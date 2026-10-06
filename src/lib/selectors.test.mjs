import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { expenseTotal, financialSummary, alerts } from './selectors.js';
import { networkingInput, generateNetworking, networkingSignature } from '../components/networking/model.js';
import { analyze } from './networking/engine.js';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/mct34-expenses.json', import.meta.url), 'utf8'));
const revenue = { faturamentoPrevisto: fixture.totalRevenue, sponsorExpected: fixture.sponsorRevenue };
let passed = 0;
function check(name, run) {
  run();
  passed++;
  console.log(`PASS ${name}`);
}
const totalTax = { type: 'percent', unitValue: 4, revenueBase: 'total' };
const sponsorTax = { ...totalTax, revenueBase: 'sponsors' };

check('CA1: 4% de 31206 = 1248.24; públicos 0/82/100/1000 não alteram o valor', () => {
  for (const audience of [0, 82, 100, 1000]) assert.equal(expenseTotal(totalTax, audience, revenue), 1248.24);
});
check('CA2: 4% de patrocínio 20658 = 826.32, diferente de 1248.24', () => {
  assert.equal(expenseTotal(sponsorTax, 100, revenue), 826.32);
  assert.notEqual(expenseTotal(sponsorTax, 100, revenue), expenseTotal(totalTax, 100, revenue));
  assert.equal(expenseTotal(sponsorTax, 1000, revenue), 826.32);
});
check('CA3: fixo qty=0 → 0; qty ausente → 1 unidade; qty=17 × 68 → 1156', () => {
  assert.equal(expenseTotal({ type: 'fixed', qty: 0, unitValue: 5500 }), 0);
  assert.equal(expenseTotal({ type: 'fixed', unitValue: 5500 }), 5500);
  assert.equal(expenseTotal({ type: 'fixed', qty: 17, unitValue: 68 }), 1156);
});

// The spreadsheet contracts different quantities per line (100 meals, 360
// bottles, zero kits). Normalize each variable line to its cost per contracted
// attendee (100); preserve original qty/unitValue in the fixture for auditing.
const expenses = fixture.expenses.map(e => e.type === 'perParticipant'
  ? { ...e, unitValue: e.unitValue * e.qty / fixture.audience }
  : e);
const event = {
  expectedAudience: fixture.audience,
  expenses,
  sponsors: [{ negotiated: fixture.sponsorRevenue }],
  revenues: [{ expected: fixture.totalRevenue - fixture.sponsorRevenue }],
};

check('CA4/CA5: 25 linhas reais — comparação individual planilha × seletor', () => {
  assert.equal(expenses.length, 25);
  for (const [index, expense] of expenses.entries()) {
    const actual = expenseTotal(expense, fixture.audience, revenue);
    assert.equal(actual, fixture.expenses[index].expected, `Despesas!D${expense.row}: ${expense.description}`);
    console.log(`  D${expense.row} ${expense.type}: planilha=${expense.expected.toFixed(2)} sistema=${actual.toFixed(2)}`);
  }
});
check('CA4: total planilha=29718.98 sistema=29718.98; margem planilha=4.8% sistema=4.8%', () => {
  const summary = financialSummary(event);
  assert.equal(summary.despesasPrevistas, fixture.expectedTotal);
  assert.equal(summary.faturamentoPrevisto, 31206);
  assert.equal(summary.fixedCosts, 16848.58);
  assert.equal(summary.percentCosts, 0);
  assert.equal(summary.resultadoPrevisto, 1487.02);
  assert.equal(Number(summary.margem.toFixed(1)), fixture.expectedMargin);
});
check('CA5: por participante recalcula; café real 60 × 100 = 6000; × 82 = 4920', () => {
  assert.equal(expenseTotal({ type: 'perParticipant', unitValue: 60 }, 100), 6000);
  assert.equal(expenseTotal({ type: 'perParticipant', unitValue: 60 }, 82), 4920);
  assert.equal(expenseTotal({ type: 'perParticipant', unitValue: 60 }, 0), 0);
});
check('Receita alterada recalcula somente a base selecionada; defaults sem público', () => {
  assert.equal(expenseTotal(totalTax, 100, { ...revenue, faturamentoPrevisto: 50000 }), 2000);
  assert.equal(expenseTotal(sponsorTax, 100, { ...revenue, faturamentoPrevisto: 50000 }), 826.32);
  assert.equal(expenseTotal(sponsorTax, 100, { ...revenue, sponsorExpected: 30000 }), 1200);
  assert.equal(expenseTotal({ type: 'percent', unitValue: 4 }, 100, revenue), 1248.24);
  assert.equal(expenseTotal(totalTax, 1000), 0);
  assert.equal(expenseTotal(null), 0);
});
check('Resumo/pagamentos/margem e alerta usam a mesma base de receita', () => {
  const input = { ...event, cateringBudget: 1000, expenses: [
    { ...totalTax, status: 'pago', category: 'Alimentação' },
    { ...sponsorTax, status: 'parcial', paidAmount: 100 },
  ] };
  for (const audience of [0, 100, 1000]) {
    const summary = financialSummary({ ...input, expectedAudience: audience });
    assert.equal(summary.despesasPrevistas, 2074.56);
    assert.equal(summary.pago, 1348.24);
    assert.equal(summary.aPagar, 726.32);
    assert.equal(summary.resultadoPrevisto, 29131.44);
    assert.ok(alerts({ ...input, expectedAudience: audience }).some(a => a.title.includes('25% acima')));
  }
});
check('Centavos arredondados por lançamento; 0.10 × 3 = 0.30; 1.005 → 1.01', () => {
  assert.equal(expenseTotal({ type: 'fixed', unitValue: 0.1, qty: 3 }), 0.3);
  assert.equal(expenseTotal({ type: 'fixed', unitValue: 1.005, qty: 1 }), 1.01);
  assert.equal(expenseTotal({ type: 'fixed', unitValue: 35.675, qty: 1 }), 35.68);
  assert.equal(expenseTotal({ type: 'fixed', unitValue: -1.005, qty: 1 }), -1.01);
});
check('Ponto de equilíbrio inclui taxa total na contribuição e taxa de patrocínio na receita líquida', () => {
  const summary = financialSummary({ expectedAudience: 100,
    tickets: [{ lots: [{ price: 100, expectedSales: 100 }] }], sponsors: [{ negotiated: 2000 }],
    expenses: [{ type: 'fixed', qty: 1, unitValue: 5000 }, { type: 'perParticipant', unitValue: 20 },
      { type: 'percent', unitValue: 10, revenueBase: 'total' }, { type: 'percent', unitValue: 5, revenueBase: 'sponsors' }],
  });
  assert.equal(summary.fixedCosts, 5000);
  assert.equal(summary.percentCosts, 1300);
  assert.equal(summary.contribution, 70);
  assert.equal(summary.breakEven, 48);
  assert.equal(summary.breakEvenPossible, true);
});
check('Taxa de 100% com custos descobertos não anuncia equilíbrio em zero ingressos', () => {
  const summary = financialSummary({ expectedAudience: 100,
    tickets: [{ lots: [{ price: 100, expectedSales: 100 }] }],
    expenses: [{ type: 'fixed', qty: 1, unitValue: 5000 }, { type: 'percent', unitValue: 100, revenueBase: 'total' }],
  });
  assert.equal(summary.breakEvenPossible, false);
});
check('Review: duas taxas de 25% arredondadas — equilíbrio em 3 vendas, não 2', () => {
  const input = { tickets: [{ lots: [{ price: 0.05, expectedSales: 10 }] }],
    expenses: [{ type: 'fixed', qty: 1, unitValue: 0.05 },
      { type: 'percent', unitValue: 25, revenueBase: 'total' },
      { type: 'percent', unitValue: 25, revenueBase: 'total' }],
  };
  const summary = financialSummary(input);
  assert.equal(summary.breakEven, 3);
  assert.equal(summary.breakEvenApproximate, false);
  const netAt = sales => sales * 0.05 - input.expenses.reduce((v, e) => v + expenseTotal(e, sales, { faturamentoPrevisto: sales * 0.05, sponsorExpected: 0 }), 0);
  assert.ok(netAt(2) < 0);
  assert.ok(netAt(3) >= 0);
});
check('Review: contribuição mínima usa estimativa conservadora explícita e sem busca excessiva', () => {
  const input = { tickets: [{ lots: [{ price: 0.01, expectedSales: 10 }] }],
    expenses: [{ type: 'fixed', qty: 1, unitValue: 1 }, { type: 'percent', unitValue: 99.99, revenueBase: 'total' }],
  };
  const summary = financialSummary(input);
  assert.equal(summary.breakEvenApproximate, true);
  const sales = summary.breakEven;
  const revenue = { faturamentoPrevisto: Math.round(sales * 0.01 * 100) / 100, sponsorExpected: 0 };
  assert.ok(revenue.faturamentoPrevisto >= input.expenses.reduce((v, e) => v + expenseTotal(e, sales, revenue), 0));
});
check('Review: equilíbrio pontual em 1 venda seguido de prejuízo em 2 não anuncia lucro a partir de 1', () => {
  const input = { tickets: [{ lots: [{ price: 0.01, expectedSales: 10 }] }],
    expenses: [{ type: 'fixed', qty: 1, unitValue: 0.01 },
      { type: 'percent', unitValue: 25, revenueBase: 'total' }, { type: 'percent', unitValue: 25, revenueBase: 'total' }],
  };
  assert.equal(financialSummary(input).breakEven, 3);
  for (let sales = 3; sales <= 10; sales++) {
    const revenue = { faturamentoPrevisto: Math.round(sales * 0.01 * 100) / 100, sponsorExpected: 0 };
    assert.ok(revenue.faturamentoPrevisto >= input.expenses.reduce((v, e) => v + expenseTotal(e, sales, revenue), 0));
  }
});
check('Eventos independentes: A receita=50000 despesa=22000; B receita=80000 despesa=22700', () => {
  const a = { expectedAudience: 100, tickets: [{ lots: [{ price: 300, expectedSales: 100 }] }],
    sponsors: [{ negotiated: 20000 }], expenses: [
      { type: 'fixed', qty: 1, unitValue: 10000 }, { type: 'perParticipant', unitValue: 100 },
      { type: 'percent', unitValue: 4, revenueBase: 'total' }],
  };
  const b = { expectedAudience: 150, tickets: [{ lots: [{ price: 500, expectedSales: 150 }] }],
    sponsors: [{ negotiated: 5000 }], expenses: [
      { type: 'fixed', qty: 1, unitValue: 15000 }, { type: 'perParticipant', unitValue: 50 },
      { type: 'percent', unitValue: 4, revenueBase: 'sponsors' }],
  };
  const aBefore = JSON.stringify(a), bBefore = JSON.stringify(b);
  assert.equal(financialSummary(a).faturamentoPrevisto, 50000);
  assert.equal(financialSummary(a).despesasPrevistas, 22000);
  assert.equal(financialSummary(b).faturamentoPrevisto, 80000);
  assert.equal(financialSummary(b).despesasPrevistas, 22700);
  const bSummary = financialSummary(b);
  financialSummary({ ...a, expectedAudience: 400, sponsors: [{ negotiated: 60000 }] });
  assert.deepEqual(financialSummary(b), bSummary);
  assert.equal(JSON.stringify(a), aBefore);
  assert.equal(JSON.stringify(b), bBefore);
});
console.log(`${passed}/${passed} testes MCT-34 PASS`);

// ---- MCT-49: Fornecedores ----
import { supplierView, supplierOverview } from './selectors.js';
{
  const from = new Date('2026-11-02T10:00:00'); // segunda
  const sups = [
    { id: 'a', contracted: 1000, paid: 1000, dueDate: null },
    { id: 'b', contracted: 1000, paid: 400, dueDate: '2026-11-06' }, // sexta
    { id: 'c', contracted: 500, paid: 0, dueDate: '2026-12-30' },
    { id: 'd', contracted: 500, paid: 100, dueDate: '2026-10-20' }
  ];
  const ev = { suppliers: sups };
  assert.equal(supplierView(sups[0], from).state, 'quitado');
  assert.equal(supplierView(sups[1], from).state, 'parcial');
  assert.equal(supplierView(sups[1], from).progress, 0.4);
  assert.equal(supplierView(sups[1], from).dueLabel, 'Vence sexta');
  assert.equal(supplierView(sups[2], from).state, 'orcamento');
  assert.equal(supplierView(sups[2], from).dueLabel, null);
  assert.equal(supplierView(sups[3], from).dueLabel, 'Vencido');
  const o = supplierOverview(ev, from);
  assert.equal(o.count, 4);
  assert.equal(o.budgetCount, 1);
  assert.equal(o.paid, 1500);
  assert.equal(o.paidPercent, 50);
  assert.equal(o.toPay, 1500);
  assert.equal(o.dueThisWeekCount, 1);
  console.log('PASS MCT-49: resumo, selo Parcial/Orçamento/Quitado e vencimento na semana');
}

// ---- Painel "Precisa da sua atenção": MCT-29 (ordem), MCT-38 (críticas), MCT-36 (networking) ----
const PASSADO = '2020-01-01';
const nivelDe = lista => lista.map(a => a.level);
const eventoCinco = (extra = {}) => ({
  suppliers: [{ status: 'pendente', dueDate: PASSADO }],
  tasks: [{ status: 'A fazer', date: PASSADO }],
  cateringBudget: 1000,
  expenses: [{ category: 'Alimentação', type: 'fixed', qty: 1, unitValue: 2000 }],
  capacity: 100, expectedAudience: 130,
  ...extra,
});
function rodadas(participantes, mesas, rodadasN) {
  const ev = {
    modules: { networking: true },
    participants: Array.from({ length: participantes }, (_, i) => ({ id: 'g' + i, code: 'C' + i, name: 'Pessoa ' + i, company: 'Empresa ' + i, status: 'Confirmado' })),
    networking: { tables: mesas, rounds: rodadasN, capacityPerTable: Math.ceil(participantes / mesas) + 1, seedBase: 1 },
  };
  const gerado = generateNetworking(networkingInput(ev));
  return { ev, gerado, salvo: { signature: networkingSignature(networkingInput(ev)), tab: gerado.tab, seed: gerado.seed } };
}

check('MCT-29: crítico que nasce por último aparece nos 4 primeiros (corte do Dashboard)', () => {
  const lista = alerts(eventoCinco());
  assert.ok(lista.length >= 5, 'o evento precisa ter mais de quatro alertas');
  assert.ok(lista.some(a => a.level === 'critico' && a.to === 'capacidade'));
  const quatro = lista.slice(0, 4);
  assert.ok(quatro.some(a => a.to === 'capacidade' && a.level === 'critico'), 'capacidade crítica ficou fora do slice(0, 4)');
  assert.deepEqual(nivelDe(quatro).slice(0, 2), ['critico', 'critico']);
});
check('MCT-29: ordem critico, atencao, ok; estável dentro do nível', () => {
  const lista = alerts(eventoCinco({ capacity: 500 }));
  const rank = { critico: 0, atencao: 1, ok: 2 };
  assert.deepEqual(nivelDe(lista), [...nivelDe(lista)].sort((a, b) => rank[a] - rank[b]));
  assert.equal(lista.at(-1).level, 'ok');
  const atencao = lista.filter(a => a.level === 'atencao').map(a => a.to);
  assert.deepEqual(atencao, ['tarefas', 'tarefas', 'financeiro']);
});
check('MCT-38: tarefa Crítica não concluída gera alerta atencao para tarefas, com concordância', () => {
  const um = alerts({ tasks: [{ status: 'A fazer', priority: 'Crítica', owner: 'a' }] }).find(a => /crítica/.test(a.title));
  assert.equal(um.level, 'atencao');
  assert.equal(um.to, 'tarefas');
  assert.equal(um.title, '1 tarefa crítica em aberto.');
  const dois = alerts({ tasks: [{ status: 'A fazer', priority: 'Crítica', owner: 'a' }, { status: 'Em andamento', priority: 'Crítica', owner: 'a' }] }).find(a => /crítica/.test(a.title));
  assert.equal(dois.title, '2 tarefas críticas em aberto.');
  assert.ok(!alerts({ tasks: [{ status: 'Concluído', priority: 'Crítica', owner: 'a' }, { status: 'A fazer', priority: 'Alta', owner: 'a' }] }).some(a => /crítica/.test(a.title)));
});
check('MCT-36: módulo ligado sem distribuição salva diz que não foi gerada, sem número', () => {
  const item = alerts({ modules: { networking: true } }).find(a => a.to === 'networking');
  assert.equal(item.level, 'atencao');
  assert.equal(item.title, 'As rodadas de negócio ainda não foram geradas.');
  assert.ok(!/\d/.test(item.title));
  assert.ok(!alerts({}).some(a => a.to === 'networking'), 'módulo desligado não gera item');
});
check('MCT-36: distribuição salva sem reencontro vira item ok', () => {
  const { ev, salvo } = rodadas(6, 3, 2);
  const item = alerts({ ...ev, networkingDistribution: salvo }).find(a => a.to === 'networking');
  assert.equal(item.level, 'ok');
  assert.equal(item.title, 'Nas rodadas de negócio, ninguém repete companhia.');
});
check('MCT-36: com reencontro, o número exibido é o que analyze() devolve para a grade salva', () => {
  const { ev, salvo } = rodadas(4, 2, 3);
  const esperado = analyze(salvo.tab, 4, 2, 3).pairs.length;
  assert.ok(esperado > 0);
  const item = alerts({ ...ev, networkingDistribution: salvo }).find(a => a.to === 'networking');
  assert.equal(item.level, 'atencao');
  assert.equal(item.title, `Nas rodadas de negócio, ${esperado} duplas se reencontram.`);
});
check('MCT-36: grade inconsistente com o cadastro não gera número', () => {
  const { ev, salvo } = rodadas(4, 2, 3);
  const outro = { ...ev, participants: ev.participants.slice(0, 3) };
  const item = alerts({ ...outro, networkingDistribution: salvo }).find(a => a.to === 'networking');
  assert.equal(item.level, 'atencao');
  assert.ok(!/\d/.test(item.title));
  const corrompida = alerts({ ...ev, networkingDistribution: { ...salvo, tab: [[9]] } }).find(a => a.to === 'networking');
  assert.ok(!/\d/.test(corrompida.title));
});
check('MCT-36: o analyze() não roda de novo a cada chamada com a mesma distribuição', () => {
  const { ev, salvo } = rodadas(4, 2, 3);
  const entrada = { ...ev, networkingDistribution: salvo };
  const primeira = alerts(entrada).find(a => a.to === 'networking').title;
  const tabOriginal = salvo.tab;
  salvo.tab = null; // se recalculasse, a grade inválida mudaria a resposta
  assert.equal(alerts(entrada).find(a => a.to === 'networking').title, primeira);
  salvo.tab = tabOriginal;
});
