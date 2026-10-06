import { timeToMinutes, minutesToTime, daysUntil } from './format.js';
import { networkingInput, networkingSignature, restoreNetworking } from '../components/networking/model.js';
import { sortSchedule, findConflicts, endMinutes } from './schedule.js';

const sum = (arr, f) => arr.reduce((a, b) => a + (f(b) || 0), 0);

const money = value => {
  const cents = Math.abs(value) * 100;
  return Math.sign(value) * Math.round(cents + Number.EPSILON * cents) / 100;
};

// Percentages are percentage points (4 = 4%). Missing revenueBase defaults to
// total revenue for existing rows; audience is used ONLY for perParticipant.
export function expenseTotal(exp, audience = 0, revenue = { faturamentoPrevisto: 0, sponsorExpected: 0 }) {
  if (!exp) return 0;
  if (exp.type === 'perParticipant') return money((exp.unitValue || 0) * (audience || 0));
  if (exp.type === 'percent') {
    const base = exp.revenueBase === 'sponsors' ? revenue.sponsorExpected : revenue.faturamentoPrevisto;
    return money((exp.unitValue || 0) * (base || 0) / 100);
  }
  return money((exp.qty ?? 1) * (exp.unitValue || 0));
}

export function financialSummary(ev) {
  const audience = Number(ev.expectedAudience) || 0;

  const ticketExpected = sum(ev.tickets || [], t => sum(t.lots || [], l => (l.price || 0) * (l.expectedSales || 0)));
  const ticketReceived = sum(ev.tickets || [], t => sum(t.lots || [], l => (l.price || 0) * (l.sold || 0)));
  const ticketSold = sum(ev.tickets || [], t => sum(t.lots || [], l => l.sold || 0));
  const ticketCapacity = sum(ev.tickets || [], t => sum(t.lots || [], l => l.capacity || 0));
  const ticketExpectedCount = sum(ev.tickets || [], t => sum(t.lots || [], l => l.expectedSales || 0));

  const sponsorExpected = sum(ev.sponsors || [], s => s.negotiated || 0);
  const sponsorReceived = sum(ev.sponsors || [], s => s.received || 0);

  const otherExpected = sum(ev.revenues || [], r => r.expected || 0);
  const otherReceived = sum(ev.revenues || [], r => r.received || 0);

  const faturamentoPrevisto = ticketExpected + sponsorExpected + otherExpected;
  const recebido = ticketReceived + sponsorReceived + otherReceived;
  const aReceber = faturamentoPrevisto - recebido;
  const revenue = { faturamentoPrevisto, sponsorExpected };

  const despesasPrevistas = money(sum(ev.expenses || [], e => expenseTotal(e, audience, revenue)));
  const pago = money(sum(ev.expenses || [], e => expensePaid(e, expenseTotal(e, audience, revenue), ev)));
  const aPagar = money(despesasPrevistas - pago);

  const resultadoPrevisto = money(faturamentoPrevisto - despesasPrevistas);
  const resultadoAtual = money(recebido - pago);
  const margem = faturamentoPrevisto ? (resultadoPrevisto / faturamentoPrevisto) * 100 : 0;

  const meta = ev.goalRevenue || 0;
  const metaPct = meta ? (faturamentoPrevisto / meta) * 100 : 0;
  const faltaMeta = Math.max(0, meta - faturamentoPrevisto);

  const fixedCosts = money(sum((ev.expenses || []).filter(e => e.type !== 'perParticipant' && e.type !== 'percent'), e => expenseTotal(e, audience, revenue)));
  const percentExpenses = (ev.expenses || []).filter(e => e.type === 'percent');
  const percentCosts = money(sum(percentExpenses, e => expenseTotal(e, audience, revenue)));
  const totalRate = sum(percentExpenses.filter(e => e.revenueBase !== 'sponsors'), e => (e.unitValue || 0) / 100);
  const sponsorRate = sum(percentExpenses.filter(e => e.revenueBase === 'sponsors'), e => (e.unitValue || 0) / 100);
  const variablePerParticipant = sum((ev.expenses || []).filter(e => e.type === 'perParticipant'), e => e.unitValue || 0);
  const avgTicket = ticketExpectedCount ? ticketExpected / ticketExpectedCount : 0;
  const contribution = avgTicket * (1 - totalRate) - variablePerParticipant;
  const uncoveredCosts = fixedCosts - sponsorExpected * (1 - totalRate - sponsorRate) - otherExpected * (1 - totalRate);
  // Check the rounded line totals near the analytical threshold. Summing rates
  // alone can announce break-even while the rounded expenses still exceed sales.
  const resultAt = sales => {
    const base = { faturamentoPrevisto: money(avgTicket * sales + sponsorExpected + otherExpected), sponsorExpected };
    return money(base.faturamentoPrevisto - sum(ev.expenses || [], e => expenseTotal(e, sales, base)));
  };
  let breakEvenSafe = 0;
  let breakEvenApproximate = false;
  const breakEvenPossible = resultAt(0) >= 0 || contribution > 0;
  if (resultAt(0) < 0 && contribution > 0) {
    // Every rounded line and the revenue can differ by at most half a cent.
    const slack = ((ev.expenses || []).length + 1) * 0.005 + 0.01;
    const first = Math.max(0, Math.ceil((uncoveredCosts - slack) / contribution));
    const last = Math.max(first, Math.ceil((uncoveredCosts + slack) / contribution));
    breakEvenSafe = last;
    // Extremely small contributions can create an enormous search interval.
    // Use a conservative upper bound, explicitly labelled as an estimate.
    breakEvenApproximate = last - first > 1000;
    if (!breakEvenApproximate) {
      breakEvenSafe = first;
      // Roundings can make one sale break even and the next lose a cent.
      // Find the last loss, so "from N sales" remains true for larger volumes.
      for (let sales = last; sales >= first; sales--) {
        if (resultAt(sales) < 0) { breakEvenSafe = sales + 1; break; }
      }
    }
  }

  return {
    ticketExpected, ticketReceived, ticketSold, ticketCapacity, ticketExpectedCount,
    sponsorExpected, sponsorReceived, otherExpected, otherReceived,
    faturamentoPrevisto, recebido, aReceber,
    despesasPrevistas, pago, aPagar,
    resultadoPrevisto, resultadoAtual, margem,
    meta, metaPct, faltaMeta,
    fixedCosts, percentCosts, variablePerParticipant, avgTicket, contribution, breakEven: breakEvenSafe, breakEvenPossible, breakEvenApproximate
  };
}

export function capacitySummary(ev) {
  const capacity = Number(ev.capacity) || 0;
  const reserved = (Number(ev.confirmed) || 0) + (Number(ev.complimentary) || 0) + (Number(ev.staff) || 0);
  const available = capacity - reserved;
  const expected = Number(ev.expectedAudience) || 0;
  const overExpected = expected > capacity ? expected - capacity : 0;
  const status = overExpected > 0 ? 'over' : available < 0 ? 'over' : available < 10 ? 'tight' : 'ok';
  return { capacity, reserved, available, expected, overExpected, status, confirmed: ev.confirmed || 0, complimentary: ev.complimentary || 0, staff: ev.staff || 0 };
}

// Cada atividade tem horário próprio (início + duração). Conflito = sobreposição; não bloqueia nada.
export function scheduleSummary(ev) {
  const items = sortSchedule(ev.schedule || []);
  if (!items.length) return { count: 0, totalMinutes: 0, durationText: '—', start: null, end: null, overMinutes: 0, computed: [], conflicts: 0 };
  const conflicts = findConflicts(items);
  let total = 0;
  let lastEnd = 0;
  const computed = items.map((it) => {
    total += it.duration || 0;
    lastEnd = Math.max(lastEnd, endMinutes(it));
    return {
      ...it,
      computedStart: minutesToTime(timeToMinutes(it.start)),
      computedEnd: minutesToTime(endMinutes(it)),
      conflictsWith: (conflicts.get(it.id) || []).map((o) => o.title),
    };
  });
  const start = computed[0].computedStart;
  const end = minutesToTime(lastEnd);
  const desired = timeToMinutes(ev.desiredEndTime || '18:00');
  const overMinutes = lastEnd - desired;
  const h = Math.floor(total / 60), m = total % 60;
  const durationText = `${h}h${m ? String(m).padStart(2, '0') : ''}`;
  return { count: items.length, totalMinutes: total, durationText, start, end, overMinutes, computed, conflicts: conflicts.size };
}

export function taskSummary(ev) {
  const tasks = ev.tasks || [];
  const done = tasks.filter(t => t.status === 'Concluído').length;
  const pending = tasks.filter(t => t.status !== 'Concluído').length;
  const overdue = tasks.filter(t => t.status !== 'Concluído' && t.date && daysUntil(t.date) < 0).length;
  const noOwner = tasks.filter(t => t.status !== 'Concluído' && !t.owner).length;
  const critical = tasks.filter(t => t.status !== 'Concluído' && t.priority === 'Crítica').length;
  return { total: tasks.length, done, pending, overdue, noOwner, critical };
}

export function supplierSummary(ev) {
  const list = ev.suppliers || [];
  const contracted = sum(list, s => s.contracted || 0);
  const paid = sum(list, s => s.paid || 0);
  const toPay = contracted - paid;
  const pendingPayments = list.filter(s => s.status === 'pendente').length;
  return { count: list.length, contracted, paid, toPay, pendingPayments };
}

const WEEKDAYS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

// Per-supplier view for the Suppliers screen. Derived only from the existing
// fields (contracted, paid, dueDate); the data model is unchanged.
//  - quitado:   paid covers the whole contract
//  - parcial:   something paid, balance remaining
//  - orcamento: nothing paid yet (no payment commitment registered)
// dueLabel is set when the balance falls due within the next 7 days
// ("Vence sexta", "Vence hoje") or is already late ("Vencido").
export function supplierView(sup, from = new Date()) {
  const contracted = sup.contracted || 0;
  const paid = sup.paid || 0;
  const toPay = Math.max(0, contracted - paid);
  const progress = contracted > 0 ? Math.min(1, paid / contracted) : 0;
  const state = contracted > 0 && paid >= contracted ? 'quitado' : paid > 0 ? 'parcial' : 'orcamento';
  let dueLabel = null;
  if (toPay > 0 && sup.dueDate) {
    const d = daysUntil(sup.dueDate, from);
    if (d < 0) dueLabel = 'Vencido';
    else if (d === 0) dueLabel = 'Vence hoje';
    else if (d <= 7) dueLabel = `Vence ${WEEKDAYS[new Date(sup.dueDate + 'T00:00:00').getDay()]}`;
  }
  return { toPay, progress, state, dueLabel, dueThisWeek: dueLabel !== null && dueLabel !== 'Vencido' };
}

export function supplierOverview(ev, from = new Date()) {
  const base = supplierSummary(ev);
  const views = (ev.suppliers || []).map(s => supplierView(s, from));
  return {
    ...base,
    budgetCount: views.filter(v => v.state === 'orcamento').length,
    paidPercent: base.contracted > 0 ? Math.round((base.paid / base.contracted) * 100) : 0,
    dueThisWeekCount: views.filter(v => v.dueThisWeek).length
  };
}

const LEVEL_ORDER = { critico: 0, atencao: 1, ok: 2 };

// Reencontros da distribuição salva, como o analyze() do motor os calcula
// (duplas que se encontram mais de uma vez; é a lista da tela de Networking).
// Devolve:
//   null      -> não há distribuição salva;
//   undefined -> há, mas não confere com o cadastro atual (nada é afirmado);
//   número    -> reencontros calculados sobre a grade salva.
// O alerts() roda a cada render: o analyze() só roda de novo quando o objeto
// salvo ou a assinatura do cadastro mudam.
const repeatsCache = new WeakMap();
function networkingRepeats(ev) {
  const saved = ev.networkingDistribution;
  if (!saved || typeof saved !== 'object') return null;
  try {
    const input = networkingInput(ev);
    const signature = networkingSignature(input);
    const hit = repeatsCache.get(saved);
    if (hit && hit.signature === signature) return hit.value;
    const restored = restoreNetworking(input, saved);
    const value = restored ? restored.analise.pairs.length : undefined;
    repeatsCache.set(saved, { signature, value });
    return value;
  } catch {
    return undefined;
  }
}

export function alerts(ev) {
  const fin = financialSummary(ev);
  const cap = capacitySummary(ev);
  const sch = scheduleSummary(ev);
  const tasks = taskSummary(ev);
  const sup = supplierSummary(ev);
  const out = [];

  // overdue supplier payments
  const overduePayments = (ev.suppliers || []).filter(s => s.status === 'pendente' && s.dueDate && daysUntil(s.dueDate) < 0);
  if (overduePayments.length) {
    out.push({ level: 'critico', title: `${overduePayments.length} pagamento${overduePayments.length > 1 ? 's' : ''} vencido${overduePayments.length > 1 ? 's' : ''}.`, to: 'fornecedores' });
  }
  if (tasks.noOwner) out.push({ level: 'atencao', title: `${tasks.noOwner} tarefas ainda não têm responsável.`, to: 'tarefas' });
  if (tasks.overdue) out.push({ level: 'atencao', title: `${tasks.overdue} tarefa${tasks.overdue > 1 ? 's' : ''} atrasada${tasks.overdue > 1 ? 's' : ''}.`, to: 'tarefas' });
  if (tasks.critical) out.push({ level: 'atencao', title: `${tasks.critical} tarefa${tasks.critical > 1 ? 's' : ''} crítica${tasks.critical > 1 ? 's' : ''} em aberto.`, to: 'tarefas' });

  // catering over budget
  const catering = (ev.expenses || []).find(e => e.category === 'Alimentação');
  if (catering && ev.cateringBudget) {
    const actual = expenseTotal(catering, ev.expectedAudience, fin);
    const pct = ev.cateringBudget ? ((actual - ev.cateringBudget) / ev.cateringBudget) * 100 : 0;
    if (pct > 5) out.push({ level: 'atencao', title: `O orçamento de alimentação está ${pct.toFixed(0)}% acima do planejado.`, to: 'financeiro' });
  }

  if (sch.overMinutes > 0) {
    out.push({ level: 'atencao', title: `A programação termina ${sch.overMinutes} minutos depois do horário desejado (${ev.desiredEndTime}).`, to: 'programacao' });
  }

  if (cap.status === 'over') {
    out.push({ level: 'critico', title: cap.overExpected > 0 ? `Seu público previsto excede a capacidade do local em ${cap.overExpected} pessoas.` : `Você ultrapassou a capacidade do local.`, to: 'capacidade' });
  } else {
    out.push({ level: 'ok', title: 'O espaço comporta o público previsto.', to: 'capacidade' });
  }

  if (ev.modules?.networking) {
    const reencontros = networkingRepeats(ev);
    if (reencontros === null) {
      out.push({ level: 'atencao', title: 'As rodadas de negócio ainda não foram geradas.', to: 'networking' });
    } else if (reencontros === undefined) {
      out.push({ level: 'atencao', title: 'O cadastro mudou depois que as rodadas foram geradas; gere de novo para ver os reencontros.', to: 'networking' });
    } else if (reencontros === 0) {
      out.push({ level: 'ok', title: 'Nas rodadas de negócio, ninguém repete companhia.', to: 'networking' });
    } else {
      out.push({ level: 'atencao', title: `Nas rodadas de negócio, ${reencontros} dupla${reencontros > 1 ? 's' : ''} se reencontra${reencontros > 1 ? 'm' : ''}.`, to: 'networking' });
    }
  }

  // Mais grave primeiro. Array.prototype.sort é estável, então dentro do mesmo
  // nível a ordem em que os itens nasceram é preservada.
  return out.sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]);
}

export function expensePaid(exp, total, ev = null) {
  if (exp.status === 'pago') return total;
  const linked = ev?.expenses?.filter(e => e.supplierId && e.supplierId === exp.supplierId);
  const legacyPaid = linked?.length === 1 ? ev.suppliers?.find(s => s.id === exp.supplierId)?.paid : 0;
  return exp.status === 'parcial' ? Math.max(0, Math.min(total, Number(exp.paidAmount ?? legacyPaid) || 0)) : 0;
}

// Undated aggregate receipts are not invented as dated cash movements.
export function financialEntries(ev, realized = false) {
  const fin = financialSummary(ev);
  return [
    ...(ev.tickets || []).flatMap(t => (t.lots || []).map(l => ({ id: l.id, label: `${t.name} · ${l.name}`, category: 'Ingressos', date: realized ? l.receivedDate : l.limitDate, value: (l.price || 0) * (realized ? l.sold || 0 : l.expectedSales || 0), direction: 1 }))),
    ...(ev.sponsors || []).map(s => ({ id: s.id, label: `Patrocínio · ${s.company}`, category: 'Patrocínios', date: realized ? s.receivedDate : s.dueDate, value: realized ? s.received || 0 : s.negotiated || 0, direction: 1 })),
    ...(ev.revenues || []).map(r => ({ id: r.id, label: r.description, category: r.category, date: realized ? r.receivedDate : r.expectedDate, value: realized ? r.received || 0 : r.expected || 0, direction: 1 })),
    ...(ev.expenses || []).map(e => { const total = expenseTotal(e, ev.expectedAudience, fin); return { id: e.id, label: e.description, category: e.category, date: realized ? e.paidDate : e.dueDate, value: realized ? expensePaid(e, total, ev) : total, direction: -1 }; })
  ].filter(e => e.value > 0).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}
export function cashFlow(ev, realized = false, now = new Date()) {
  const entries = financialEntries(ev, realized);
  const end = new Date((ev.date || now.toISOString().slice(0, 10)) + 'T12:00:00');
  const start = new Date(end); start.setDate(start.getDate() - 55);
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const weeks = Array.from({ length: 8 }, (_, i) => { const d = new Date(start); d.setDate(d.getDate() + i * 7); return { date: iso(d), income: 0, expense: 0 }; });
  let undated = 0;
  for (const entry of entries) {
    if (!entry.date) { undated += entry.value; continue; }
    const d = new Date(entry.date + 'T12:00:00');
    const days = Math.round((d.getTime() - start.getTime()) / 86400000);
    if (days >= 0 && days < 56) weeks[Math.floor(days / 7)][entry.direction === 1 ? 'income' : 'expense'] += entry.value;
  }
  return { weeks, end: iso(end), undated };
}

export function upcomingActions(ev) {
  const items = [];
  (ev.tasks || []).filter(t => t.status !== 'Concluído').forEach(t => {
    if (!t.date) return;
    const d = daysUntil(t.date);
    if (d <= 14) items.push({ type: 'task', date: t.date, label: t.name, owner: t.owner || 'Sem responsável', status: t.status, days: d });
  });
  (ev.suppliers || []).filter(s => s.status === 'pendente' && s.dueDate).forEach(s => {
    const d = daysUntil(s.dueDate);
    if (d <= 14) items.push({ type: 'payment', date: s.dueDate, label: `Pagar ${s.name}`, owner: 'Financeiro', status: 'Pendente', days: d });
  });
  return items.sort((a, b) => a.days - b.days).slice(0, 6);
}

export function relativeLabel(days) {
  if (days < 0) return `${Math.abs(days)} dia${Math.abs(days) !== 1 ? 's' : ''} atrás`;
  if (days === 0) return 'Hoje';
  if (days === 1) return 'Amanhã';
  return `Em ${days} dias`;
}

// Synchronize the supplier display with the expense ledger after an expense edit.
export function saveExpense(ev, expense) {
  const previous=ev.expenses.find(e=>e.id===expense.id);
  const before=financialSummary(ev);
  const normalized=ev.expenses.map(e=>({...e,paidAmount:expensePaid(e,expenseTotal(e,ev.expectedAudience,before),ev)}));
  const expenses=previous?normalized.map(e=>e.id===expense.id?expense:e):[...normalized,expense];
  const next={...ev,expenses};const fin=financialSummary(next);
  const ids=new Set([previous?.supplierId,expense.supplierId].filter(Boolean));
  return {...next,suppliers:ev.suppliers.map(s=>{
    if(!ids.has(s.id))return s;
    const linked=expenses.filter(e=>e.supplierId===s.id);
    const paid=money(sum(linked,e=>expensePaid(e,expenseTotal(e,ev.expectedAudience,fin),next)));
    return {...s,paid,status:paid>=s.contracted && s.contracted>0?'pago':'pendente'};
  })};
}
export function updateSupplierPayment(ev,id,amount) {
  const supplier=ev.suppliers.find(s=>s.id===id);if(!supplier)return ev;
  const paid=money(Math.max(0,Math.min(supplier.contracted,Number(amount)||0)));
  const fin=financialSummary(ev),linked=ev.expenses.filter(e=>e.supplierId===id);
  const total=money(sum(linked,e=>expenseTotal(e,ev.expectedAudience,fin)));
  let remaining=Math.min(paid,total);
  const payments=new Map(linked.map((e,i)=>{const cost=expenseTotal(e,ev.expectedAudience,fin);const value=i===linked.length-1?remaining:Math.min(remaining,money(total?Math.min(paid,total)*cost/total:0));remaining=money(remaining-value);return [e.id,{paidAmount:value,status:value>=cost && cost>0?'pago':value>0?'parcial':'pendente'}];}));
  return {...ev,suppliers:ev.suppliers.map(s=>s.id===id?{...s,paid,status:paid>=s.contracted && s.contracted>0?'pago':'pendente'}:s),expenses:ev.expenses.map(e=>payments.has(e.id)?{...e,...payments.get(e.id)}:e)};
}
