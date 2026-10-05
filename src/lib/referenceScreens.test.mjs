import assert from 'node:assert/strict';
import test from 'node:test';
import {
  financialSummary,
  expensePaid,
  financialEntries,
  cashFlow,
  saveExpense,
  updateSupplierPayment,
} from './selectors.js';
import {
  networkingInput,
  generateNetworking,
  restoreNetworking,
  networkingSignature,
  encounterSummary,
} from '../components/networking/model.js';
const event = () => ({
  id: 'event-a',
  date: '2026-11-18',
  expectedAudience: 10,
  tickets: [
    {
      id: 't',
      name: 'Ingresso',
      lots: [
        {
          id: 'l',
          name: 'VIP',
          price: 100,
          sold: 2,
          expectedSales: 5,
          capacity: 10,
          limitDate: '2026-11-10',
        },
      ],
    },
  ],
  sponsors: [
    {
      id: 's',
      company: 'Empresa',
      negotiated: 1000,
      received: 500,
      dueDate: '2026-10-01',
    },
  ],
  revenues: [],
  suppliers: [{ id: 'supplier', contracted: 200, paid: 50 }],
  expenses: [
    {
      id: 'expense',
      supplierId: 'supplier',
      description: 'Espaço',
      type: 'fixed',
      unitValue: 200,
      status: 'parcial',
      dueDate: '2026-11-05',
    },
  ],
});
test('Financial totals reconcile the existing supplier payment once; explicit expense payment wins', () => {
  const ev = event();
  assert.equal(financialSummary(ev).pago, 50);
  ev.expenses[0].paidAmount = 75;
  assert.equal(financialSummary(ev).pago, 75);
  assert.equal(expensePaid({ status: 'parcial', paidAmount: -10 }, 100), 0);
  assert.equal(expensePaid({ status: 'parcial', paidAmount: 999 }, 100), 100);
});
test('Adding a second supplier expense preserves its legacy partial payment', () => {
  const ev = event();
  const next = saveExpense(ev, {id:'second', supplierId:'supplier', type:'fixed', unitValue:100, status:'pendente', paidAmount:0});
  assert.equal(financialSummary(next).pago, 50);
  assert.equal(next.suppliers[0].paid, 50);
});
test('Cash flow uses dated entries only, has eight weeks, and exposes undated actual aggregates', () => {
  const ev = event();
  const predicted = cashFlow(ev);
  assert.equal(predicted.weeks.length, 8);
  assert.equal(
    predicted.weeks.reduce((a, w) => a + w.income, 0),
    1500,
  );
  assert.equal(
    predicted.weeks.reduce((a, w) => a + w.expense, 0),
    200,
  );
  const actual = cashFlow(ev, true);
  assert.equal(
    actual.weeks.reduce((a, w) => a + w.income + w.expense, 0),
    0,
  );
  assert.equal(actual.undated, 750);
  ev.sponsors[0].receivedDate = '2026-10-01';
  assert.equal(
    cashFlow(ev, true).weeks.reduce((a, w) => a + w.income, 0),
    500,
  );
});
test('Editing an expense updates the linked supplier and financial result without changing another event', () => {
  const a = event(),
    b = structuredClone(a);
  b.id = 'event-b';
  const before = JSON.stringify(b);
  const next = saveExpense(a, { ...a.expenses[0], status: 'pago' });
  assert.equal(financialSummary(next).pago, 200);
  assert.equal(next.suppliers[0].paid, 200);
  assert.equal(JSON.stringify(b), before);
  assert.equal(a.suppliers[0].paid, 50);
});
test('Supplier payment is allocated across linked expenses once, within cost bounds', () => {
  const ev = event();
  ev.expenses.push({ ...ev.expenses[0], id: 'expense-2', unitValue: 100 });
  ev.suppliers[0].contracted = 300;
  const next = updateSupplierPayment(ev, 'supplier', 150);
  assert.equal(financialSummary(next).pago, 150);
  assert.equal(next.expenses[0].paidAmount, 100);
  assert.equal(next.expenses[1].paidAmount, 50);
  ev.suppliers[0].contracted = 1000;
  assert.equal(
    financialSummary(updateSupplierPayment(ev, 'supplier', 1000)).pago,
    300,
  );
});
test('Changing selected-event inputs changes its summary and does not mutate any input', () => {
  const a = event(),
    b = event();
  b.tickets[0].lots[0].price = 200;
  const before = JSON.stringify([a, b]);
  assert.equal(
    financialSummary(b).faturamentoPrevisto -
      financialSummary(a).faturamentoPrevisto,
    500,
  );
  financialEntries(a, true);
  cashFlow(b);
  assert.equal(JSON.stringify([a, b]), before);
});
const networkEvent = () => ({
  participants: Array.from({ length: 12 }, (_, i) => ({
    id: `p${i}`,
    name: `Pessoa ${i}`,
    status: 'Confirmado',
  })),
  networking: { tables: 3, rounds: 3, capacityPerTable: 5, seedBase: 1 },
});
test('Saved networking assignments survive JSON and restore the same routes; changed inputs invalidate them', () => {
  const ev = networkEvent(),
    input = networkingInput(ev),
    result = generateNetworking(input);
  const saved = JSON.parse(
    JSON.stringify({
      signature: networkingSignature(input),
      tab: result.tab,
      seed: result.seed,
    }),
  );
  const restored = restoreNetworking(input, saved);
  assert.deepEqual(restored.tab, result.tab);
  assert.deepEqual(restored.analise, result.analise);
  ev.participants[0].name = 'Nome atualizado';
  assert.equal(restoreNetworking(networkingInput(ev), saved), null);
  saved.tab[0][0] = 99;
  assert.equal(restoreNetworking(input, saved), null);
});
test('Encounter indicators count actual unique pairs and repeated encounters including fixed hosts', () => {
  const ev = networkEvent(),
    input = networkingInput(ev),
    result = generateNetworking(input),
    counts = encounterSummary(result);
  const pairs = new Map();
  for (const round of result.analise.at)
    for (const seated of round)
      for (let a = 0; a < seated.length; a++)
        for (let b = a + 1; b < seated.length; b++) {
          const key = [seated[a], seated[b]].sort((a, b) => a - b).join(',');
          pairs.set(key, (pairs.get(key) || 0) + 1);
        }
  assert.equal(counts.unique, pairs.size);
  assert.equal(
    counts.repeats,
    [...pairs.values()].reduce((a, n) => a + n - 1, 0),
  );
  const fixed = {
    input: {
      mobile: [{ id: 'a' }],
      fixed: [
        { id: 'f1', tableId: 't' },
        { id: 'f2', tableId: 't' },
      ],
      tables: [{ id: 't' }],
    },
    analise: { at: [[[0]], [[0]]] },
  };
  assert.deepEqual(encounterSummary(fixed), {
    unique: 2,
    repeats: 2,
    average: 1,
  });
});
