import test from 'node:test';
import assert from 'node:assert/strict';
import { applySupplierEdit } from './supplierEdit.js';
import { supplierView, updateSupplierPayment, supplierOverview } from './selectors.js';

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

test('não cria segunda fonte de valores: contratado, pago, status e despesas ficam iguais', () => {
  const ev = base();
  const next = applySupplierEdit(ev, 's1', { name: 'X', contracted: 999999, paid: 999999, status: 'pago', expenses: [] });
  const s = next.suppliers[0];
  assert.equal(s.contracted, 1000);
  assert.equal(s.paid, 400);
  assert.equal(s.status, 'pendente');
  assert.equal(next.expenses, ev.expenses);
  assert.deepEqual(supplierView(s).toPay, 600);
  assert.deepEqual(supplierOverview(next).paid, supplierOverview(ev).paid);
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
