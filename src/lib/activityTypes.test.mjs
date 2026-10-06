import assert from 'node:assert/strict';
import { DEFAULT_TYPES, filterTypes, findType, countUsage, renameInEvent, normalizeTypeName, typeKey } from './activityTypes.js';

let passed = 0;
function check(name, run) { run(); passed++; console.log(`PASS ${name}`); }
const types = DEFAULT_TYPES.map((name, i) => ({ id: `t${i}`, name }));

check('lista inicial tem os 8 tipos pedidos', () => {
  assert.deepEqual([...DEFAULT_TYPES].sort(), ['Almoço', 'Apresentação', 'Credenciamento', 'Encerramento', 'Intervalo', 'Painel', 'Palestra', 'Rodada de negócio'].sort());
});
check('digitando, aparecem os tipos que casam (sem acento nem maiúscula)', () => {
  assert.deepEqual(filterTypes(types, 'negocio').map((t) => t.name), ['Rodada de negócio']);
  assert.deepEqual(filterTypes(types, 'ALMOCO').map((t) => t.name), ['Almoço']);
  assert.deepEqual(filterTypes(types, 'zzz'), []);
  assert.equal(filterTypes(types, '').length, 8);
});
check('quem começa com o texto vem primeiro', () => {
  const r = filterTypes(types, 'pa').map((t) => t.name);
  assert.deepEqual(r.sort(), ['Painel', 'Palestra']);
  const mix = filterTypes([{ id: 1, name: 'Mesa de painel' }, { id: 2, name: 'Painel' }], 'pain').map((t) => t.name);
  assert.deepEqual(mix, ['Painel', 'Mesa de painel']);
});
check('findType reconhece o mesmo nome ignorando caixa, acento e espaços', () => {
  assert.equal(findType(types, '  rodada   DE negocio ')?.name, 'Rodada de negócio');
  assert.equal(findType(types, 'Workshop'), undefined);
  assert.equal(findType(types, '   '), undefined);
});
check('normalizeTypeName / typeKey', () => {
  assert.equal(normalizeTypeName('  Oficina   de  vinhos '), 'Oficina de vinhos');
  assert.equal(typeKey('Apresentação'), 'apresentacao');
});
const events = [
  { id: 'a', schedule: [{ id: 1, type: 'Palestra' }, { id: 2, type: 'palestra' }, { id: 3, type: 'Painel' }] },
  { id: 'b', schedule: [{ id: 4, type: 'Palestra' }] },
  { id: 'c' },
];
check('countUsage soma atividades e eventos da organização', () => {
  assert.deepEqual(countUsage(events, 'Palestra'), { activities: 3, events: 2 });
  assert.deepEqual(countUsage(events, 'Painel'), { activities: 1, events: 1 });
  assert.deepEqual(countUsage(events, 'Intervalo'), { activities: 0, events: 0 });
});
check('renameInEvent troca só as atividades do tipo e preserva as demais', () => {
  const r = renameInEvent(events[0], 'Palestra', 'Conferência');
  assert.deepEqual(r.schedule.map((a) => a.type), ['Conferência', 'Conferência', 'Painel']);
  assert.equal(renameInEvent(events[2], 'Palestra', 'X'), events[2]);
});
console.log(`\n${passed} verificacoes passaram`);
