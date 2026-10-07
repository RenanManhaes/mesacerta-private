import { expenseTotal, financialSummary, updateSupplierPayment } from './selectors.js';

// Edição de um fornecedor. O valor contratado é editável aqui; o pago continua vindo dos
// pagamentos (updateSupplierPayment) e o "a pagar" é recalculado por selectors.js.

const cents = (n) => Math.round((Number(n) || 0) * 100) / 100;
const brl = (n) => cents(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }).replace(/\u00a0/g, ' ');
const isFixed = (e) => e.type !== 'perParticipant' && e.type !== 'percent';

/**
 * Lê um valor em reais no formato brasileiro ("1.500,50", "1500", "R$ 1.500", "1500,5").
 * @returns {number} NaN quando vazio ou inválido (negativos voltam como número negativo).
 */
export function parseBRL(text) {
  if (typeof text === 'number') return Number.isFinite(text) ? text : NaN;
  let s = String(text ?? '').replace(/R\$|\s/g, '');
  if (!s) return NaN;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  return /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : NaN;
}

/** Valor para o campo: "1.500,00" (sem o R$, que já aparece ao lado). */
export const formatBRLField = (n) => cents(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Despesas do financeiro ligadas a este fornecedor (expense.supplierId).
const linkedExpenses = (event, id) => (event.expenses || []).filter((e) => e.supplierId === id);

// A despesa fixa que recebe o ajuste e a soma das outras despesas ligadas (que não mudam).
function ledgerSplit(event, id) {
  const linked = linkedExpenses(event, id);
  if (!linked.length) return { linked, adjust: null, others: 0 };
  const adjust = [...linked].reverse().find(isFixed) || null;
  const fin = financialSummary(event);
  const others = linked.filter((e) => e !== adjust).reduce((a, e) => a + expenseTotal(e, event.expectedAudience, fin), 0);
  return { linked, adjust, others };
}

/**
 * Mensagem de erro (uma linha, em português simples) se o novo contratado não pode ser salvo; senão ''.
 * @param {any} event evento atual
 * @param {any} supplier fornecedor como está salvo
 * @param {number} value novo valor contratado
 */
export function contractedError(event, supplier, value) {
  if (!Number.isFinite(value)) return 'Informe o valor contratado.';
  if (value < 0) return 'O valor contratado não pode ser negativo.';
  const paid = cents(supplier.paid);
  if (cents(value) < paid) return `O valor contratado não pode ser menor que o já pago (${brl(paid)}).`;
  const { linked, adjust, others } = ledgerSplit(event, supplier.id);
  if (linked.length) {
    if (!adjust) return 'Este fornecedor tem despesa por pessoa ou por porcentagem. Mude o valor em Despesas.';
    if (cents(value) < cents(others)) return 'Este valor é menor que as outras despesas deste fornecedor. Ajuste em Despesas.';
  }
  return '';
}

// Mantém UMA fonte: o contratado do fornecedor e a despesa ligada a ele (a que o financeiro soma) andam juntos.
// Não cria lançamento: ajusta a despesa fixa já ligada e redistribui o pago pelo mesmo caminho do pagamento.
function applyContracted(event, id, value) {
  const supplier = event.suppliers.find((s) => s.id === id);
  const target = cents(value);
  const { adjust, others } = ledgerSplit(event, id);
  const expenses = adjust
    ? event.expenses.map((e) => (e === adjust ? { ...e, type: 'fixed', qty: 1, unitValue: cents(target - others) } : e))
    : event.expenses;
  const next = { ...event, expenses, suppliers: event.suppliers.map((s) => (s.id === id ? { ...s, contracted: target } : s)) };
  return updateSupplierPayment(next, id, supplier.paid || 0);
}

export function applySupplierEdit(event, id, patch) {
  const current = (event.suppliers || []).find((s) => s.id === id);
  if (!current) return event;
  const text = (v) => String(v ?? '').trim();
  let base = event;
  // Contratado inválido (negativo, abaixo do pago…) é ignorado aqui; quem chama valida antes com contractedError.
  if (patch.contracted !== undefined && cents(patch.contracted) !== cents(current.contracted) && !contractedError(event, current, Number(patch.contracted))) {
    base = applyContracted(event, id, Number(patch.contracted));
  }
  return {
    ...base,
    suppliers: base.suppliers.map((s) => {
      if (s.id !== id) return s;
      const dueDate = text(patch.dueDate) || null;
      return {
        ...s,
        name: text(patch.name) || s.name,
        service: text(patch.service),
        expenseCategory: text(patch.expenseCategory) || s.expenseCategory || 'Outros',
        contact: text(patch.contact),
        paymentData: text(patch.paymentData),
        notes: String(patch.notes ?? '').slice(0, 2000),
        dueDate,
        nextDue: dueDate,
      };
    }),
  };
}
