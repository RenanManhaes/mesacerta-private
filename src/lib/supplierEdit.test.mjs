import test from 'node:test';
import assert from 'node:assert/strict';
import { applySupplierEdit, contractedError, parseBRL, formatBRLField } from './supplierEdit.js';
import { supplierView, updateSupplierPayment, supplierOverview, financialSummary } from './selectors.js';

const base = () => ({
  expectedAudience: 100,
  suppliers: [
    { id: 's1', name: 'Buffet', service: 'Comida', contact: '', contracted: 1000, paid: 400, status: 'pendente', dueDate: '2026-11-01', nextDue: '2026-11-01', expenseCategory: 'Alimentação', paymentData: '', notes: '' },
    { id: 's2', name: 'Som', contracted: 500, paid: 0, status: 'pendente' },
  ],
  expenses: [{ id: 'e1', description: 'Buffet', supplierId: 's1', type: 'fixed', qty: 1, unitValue: 1000, status: 'parcial', paidAmount: 400 }],
});

test('edita só as informações do fornecedor escolhido', () => {
  const ev = base();
  const next = applySupplierEdit(ev, 's1', { name: ' Buffet Novo ', service: 'Jantar', expenseCategory: 'Alimentação', contact: 'a@b.com', paymentData: 'PIX', notes: 'Sem glúten', dueDate: '2026-12-01' });
  const s = next.suppliers[0];
  assert.deepEqual([s.name, s.service, s.contact, s.paymentData, s.notes, s.dueDate, s.nextDue], ['Buffet Novo', 'Jantar', 'a@b.com', 'PIX', 'Sem glúten', '2026-12-01', '2026-12-01']);
  assert.equal(next.suppliers[1], ev.suppliers[1]);
  assert.equal(ev.suppliers[0].name, 'Buffet');
});

test('pago, status e despesas não são editáveis por aqui (só o contratado)', () => {
  const ev = base();
  const next = applySupplierEdit(ev, 's1', { name: 'X', paid: 999999, status: 'pago', expenses: [] });
  const s = next.suppliers[0];
  assert.equal(s.contracted, 1000);
  assert.equal(s.paid, 400);
  assert.equal(s.status, 'pendente');
  assert.equal(next.expenses, ev.expenses);
  assert.deepEqual(supplierView(s).toPay, 600);
  assert.deepEqual(supplierOverview(next).paid, supplierOverview(ev).paid);
});

test('lê valor em formato brasileiro', () => {
  assert.equal(parseBRL('1.500,50'), 1500.5);
  assert.equal(parseBRL('1500'), 1500);
  assert.equal(parseBRL('R$ 1.500'), 1500);
  assert.equal(parseBRL('1500,5'), 1500.5);
  assert.equal(parseBRL('-10'), -10);
  assert.ok(Number.isNaN(parseBRL('')));
  assert.ok(Number.isNaN(parseBRL('abc')));
  assert.equal(formatBRLField(1500), '1.500,00');
});

test('aceita aumento e redução válidos do contratado e o financeiro acompanha (fonte única)', () => {
  const ev = base();
  const up = applySupplierEdit(ev, 's1', { name: 'Buffet', contracted: 1500 });
  assert.equal(up.suppliers[0].contracted, 1500);
  assert.equal(up.suppliers[0].paid, 400);
  assert.equal(supplierView(up.suppliers[0]).toPay, 1100);
  assert.equal(up.expenses.length, 1, 'não cria lançamento');
  assert.equal(up.expenses[0].unitValue, 1500);
  assert.equal(up.expenses[0].paidAmount, 400);
  assert.equal(financialSummary(up).despesasPrevistas, 1500);
  assert.equal(financialSummary(up).aPagar, 1100);
  assert.equal(financialSummary(up).aPagar, supplierView(up.suppliers[0]).toPay);
  const down = applySupplierEdit(up, 's1', { name: 'Buffet', contracted: 800 });
  assert.equal(down.suppliers[0].contracted, 800);
  assert.equal(financialSummary(down).aPagar, 400);
  assert.equal(down.expenses.length, 1);
  assert.equal(ev.suppliers[0].contracted, 1000, 'não muda o original');
});

test('contratado igual ao pago quita o fornecedor', () => {
  const next = applySupplierEdit(base(), 's1', { name: 'Buffet', contracted: 400 });
  assert.equal(next.suppliers[0].status, 'pago');
  assert.equal(supplierView(next.suppliers[0]).state, 'quitado');
  assert.equal(financialSummary(next).aPagar, 0);
});

test('recusa contratado abaixo do já pago e negativo, com mensagem simples', () => {
  const ev = base();
  const s = ev.suppliers[0];
  assert.equal(contractedError(ev, s, 300), 'O valor contratado não pode ser menor que o já pago (R$ 400,00).');
  assert.equal(contractedError(ev, s, -5), 'O valor contratado não pode ser negativo.');
  assert.equal(contractedError(ev, s, NaN), 'Informe o valor contratado.');
  assert.equal(contractedError(ev, s, 400), '');
  assert.equal(contractedError(ev, s, 5000), '');
  // aplicar um valor inválido não muda nada
  assert.equal(applySupplierEdit(ev, 's1', { name: 'Buffet', contracted: 300 }).suppliers[0].contracted, 1000);
  assert.equal(applySupplierEdit(ev, 's1', { name: 'Buffet', contracted: -1 }).suppliers[0].contracted, 1000);
  assert.equal(applySupplierEdit(ev, 's1', { name: 'Buffet', contracted: 300 }).expenses, ev.expenses);
});

test('fornecedor sem despesa ligada: muda só o contratado, sem criar lançamento', () => {
  const ev = base();
  const next = applySupplierEdit(ev, 's2', { name: 'Som', contracted: 900 });
  assert.equal(next.suppliers[1].contracted, 900);
  assert.equal(next.expenses.length, 1);
});

test('despesa por participante: não dá para ajustar por aqui (pede Despesas); com uma fixa ao lado, ajusta a fixa', () => {
  const ev = base();
  ev.expenses = [{ id: 'e1', supplierId: 's1', type: 'perParticipant', unitValue: 10 }];
  assert.match(contractedError(ev, ev.suppliers[0], 1200), /Despesas/);
  assert.equal(applySupplierEdit(ev, 's1', { name: 'Buffet', contracted: 1200 }).suppliers[0].contracted, 1000);
  ev.expenses = [{ id: 'e1', supplierId: 's1', type: 'perParticipant', unitValue: 5 }, { id: 'e9', supplierId: 's1', type: 'fixed', qty: 1, unitValue: 500, status: 'pendente' }];
  const next = applySupplierEdit(ev, 's1', { name: 'Buffet', contracted: 1200 });
  assert.equal(next.expenses.find((e) => e.id === 'e9').unitValue, 700);
  assert.equal(next.expenses.length, 2);
});

test('nome vazio mantém o nome; vencimento vazio vira null; é idempotente', () => {
  const patch = { name: '  ', service: '', dueDate: '' };
  const next = applySupplierEdit(base(), 's1', patch);
  assert.equal(next.suppliers[0].name, 'Buffet');
  assert.equal(next.suppliers[0].dueDate, null);
  assert.deepEqual(applySupplierEdit(next, 's1', patch), next);
  assert.equal(applySupplierEdit(base(), 'nada', patch).suppliers.length, 2);
});

test('registrar pagamento depois da edição não duplica lançamento nem perde a edição', () => {
  const edited = applySupplierEdit(base(), 's1', { name: 'Buffet Novo', dueDate: '' });
  const paid = updateSupplierPayment(edited, 's1', 1000);
  assert.equal(paid.suppliers[0].name, 'Buffet Novo');
  assert.equal(paid.suppliers[0].paid, 1000);
  assert.equal(paid.expenses.length, 1);
  assert.equal(paid.expenses[0].paidAmount, 1000);
  const again = updateSupplierPayment(paid, 's1', 1000);
  assert.equal(again.expenses.length, 1);
  assert.equal(again.suppliers[0].paid, 1000);
});
