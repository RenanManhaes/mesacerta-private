import assert from 'node:assert/strict';
import { searchEvent, flatten, itemPath } from './headerSearch.js';

const demoEvent = {
  participants: [{ id: 'p1', name: 'Marina Costa', company: 'Nuvex', type: 'Patrocinador' }, { id: 'p2', name: 'Júlia Ferreira', company: 'Andrade', type: 'Palestrante' }],
  suppliers: [{ id: 's1', name: 'Buffet Sabor', service: 'Alimentação' }],
  tasks: [{ id: 't1', name: 'Fechar programação', owner: 'Marina', category: 'Programação' }],
  schedule: [{ id: 'a1', start: '09:00', title: 'Credenciamento', speaker: '', room: 'Recepção' }],
};

let passed = 0;
const check = (name, run) => { run(); passed++; console.log(`PASS ${name}`); };

check('CA1: "par" lista participantes e demais itens que casam', () => {
  const ev = { ...demoEvent, participants: [...demoEvent.participants, { id: 'p-x', name: 'Paraguaçu Reis', company: 'X', type: 'Participante' }], suppliers: [...demoEvent.suppliers, { id: 's-x', name: 'Parque Eventos', service: 'Espaço' }] };
  const groups = searchEvent(ev, 'par');
  const keys = groups.map((g) => g.key);
  assert.ok(keys.includes('participantes'));
  assert.ok(keys.includes('fornecedores'));
  assert.ok(flatten(groups).some((i) => i.title === 'Paraguaçu Reis'));
});
check('menos de 2 caracteres não busca', () => {
  assert.deepEqual(searchEvent(demoEvent, 'p'), []);
  assert.deepEqual(searchEvent(demoEvent, ' '), []);
});
check('CA3: termo sem resultado devolve lista vazia (UI mostra aviso)', () => {
  assert.deepEqual(searchEvent(demoEvent, 'zzzqqq'), []);
});
check('ignora acento e caixa; limita 5 por grupo', () => {
  assert.ok(flatten(searchEvent(demoEvent, 'JULIA')).some((i) => i.title === 'Júlia Ferreira'));
  const many = { participants: Array.from({ length: 12 }, (_, i) => ({ id: `${i}`, name: `Ana ${i}` })) };
  assert.equal(searchEvent(many, 'ana')[0].items.length, 5);
});
check('itemPath leva à tela do grupo', () => {
  assert.equal(itemPath('e1', { to: 'tarefas', q: 'Pagar fornecedor' }), '/event/e1/tarefas?q=Pagar%20fornecedor');
});
console.log(`${passed}/5`);
