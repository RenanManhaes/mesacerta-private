import { timeToMinutes, minutesToTime, daysUntil } from './format.js';

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
  const pago = money(sum(ev.expenses || [], e => {
    const total = expenseTotal(e, audience, revenue);
    if (e.status === 'pago') return total;
    if (e.status === 'parcial') return Math.min(total, (e.paidAmount || 0));
    return 0;
  }));
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

export function scheduleSummary(ev) {
  const items = [...(ev.schedule || [])].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
  if (!items.length) return { count: 0, totalMinutes: 0, durationText: '—', start: null, end: null, overMinutes: 0 };
  let total = 0;
  let cursor = timeToMinutes(items[0].start);
  const computed = items.map((it) => {
    const start = cursor;
    const end = start + (it.duration || 0);
    total += it.duration || 0;
    cursor = end;
    return { ...it, computedStart: minutesToTime(start), computedEnd: minutesToTime(end) };
  });
  const start = computed[0].computedStart;
  const end = computed[computed.length - 1].computedEnd;
  const desired = timeToMinutes(ev.desiredEndTime || '18:00');
  const overMinutes = timeToMinutes(end) - desired;
  const h = Math.floor(total / 60), m = total % 60;
  const durationText = `${h}h${m ? String(m).padStart(2, '0') : ''}`;
  return { count: items.length, totalMinutes: total, durationText, start, end, overMinutes, computed };
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
    out.push({ level: 'ok', title: 'Nenhum conflito encontrado nas rodadas de negócio.', to: 'networking' });
  }

  return out;
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
