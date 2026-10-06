import assert from 'node:assert/strict';
import { eventNotifications, unreadOf } from './notifications.js';

let passed = 0;
const check = (name, run) => { run(); passed++; console.log(`PASS ${name}`); };
const now = new Date('2026-10-05T12:00:00');
const ev = {
  tasks: [
    { id: 't1', name: 'Pagar entrada do AV', date: '2026-10-06', status: 'A fazer' },
    { id: 't2', name: 'Longe', date: '2026-12-01', status: 'A fazer' },
    { id: 't3', name: 'Feita', date: '2026-10-01', status: 'Concluído' },
  ],
  expenses: [
    { id: 'e1', description: 'Audio Pro', dueDate: '2026-10-09', status: 'parcial' },
    { id: 'e2', description: 'Paga', dueDate: '2026-10-09', status: 'pago' },
  ],
  suppliers: [{ id: 's1', name: 'Buffet Sabor', status: 'pendente', paid: 6000 }, { id: 's2', name: 'Ok', status: 'pago' }],
  staffMembers: [{ id: 'm1', name: 'Ana', inviteStatus: 'accepted', active: true }],
};

check('CA1: gera os quatro tipos, cada um com a tela de origem', () => {
  const l = eventNotifications(ev, now);
  assert.deepEqual(l.map((n) => n.type).sort(), ['convite', 'fornecedor', 'pagamento', 'tarefa']);
  assert.deepEqual(Object.fromEntries(l.map((n) => [n.type, n.to])), { tarefa: 'tarefas', pagamento: 'despesas', fornecedor: 'fornecedores', convite: 'diretores-staffs' });
});
check('ignora tarefa concluída, distante e despesa paga', () => {
  const l = eventNotifications(ev, now);
  assert.ok(!l.some((n) => n.detail === 'Longe' || n.detail === 'Feita' || n.detail === 'Paga'));
});
check('CA2: marcar como lidas zera as não lidas; item novo volta a notificar', () => {
  const l = eventNotifications(ev, now);
  const read = new Set(l.map((n) => n.key));
  assert.equal(unreadOf(l, read).length, 0);
  const novo = eventNotifications({ ...ev, tasks: [...ev.tasks, { id: 't9', name: 'Nova', date: '2026-10-05', status: 'A fazer' }] }, now);
  assert.equal(unreadOf(novo, read).length, 1);
});
check('CA4: evento sem pendências devolve lista vazia', () => {
  assert.deepEqual(eventNotifications({ tasks: [], expenses: [], suppliers: [], staffMembers: [] }, now), []);
  assert.deepEqual(eventNotifications(null, now), []);
});
check('mais urgente primeiro (vencida antes de futura)', () => {
  const l = eventNotifications({ tasks: [{ id: 'a', name: 'A', date: '2026-10-07', status: 'x' }, { id: 'b', name: 'B', date: '2026-10-01', status: 'x' }] }, now);
  assert.equal(l[0].detail, 'B');
  assert.match(l[0].title, /venceu há 4 dias/);
});
console.log(`${passed}/5`);
