import test from 'node:test';
import assert from 'node:assert/strict';
import { applyTaskEdit, legacyOwnerMatches, realMembers, searchMembers, taskOwnerIds } from './taskOwners.js';
import { assignTask } from './staff.js';

const team = [
  { id: 'm1', userId: 'u1', name: 'Ana Souza', email: 'ana@x.com', role: 'Diretor', jobTitle: 'Fundador', active: true },
  { id: 'm2', userId: 'u2', name: 'João Pereira', email: 'joao@x.com', role: 'Staff', function: 'Credenciamento', active: true },
  { id: 'm3', userId: 'u3', name: 'Marina Lima', email: 'marina@x.com', role: 'Staff', area: 'Audiovisual', active: true },
  { id: 'm4', userId: 'u4', name: 'Inativo Silva', email: 'i@x.com', role: 'Staff', active: false },
  // cadastro manual antigo, sem vínculo: duplica a Ana
  { id: 'old1', name: 'Ana Souza', email: 'ana@x.com', role: 'Staff', active: true },
  // mesma pessoa listada duas vezes (mesmo vínculo)
  { id: 'm2', userId: 'u2', name: 'João Pereira', email: 'joao@x.com', role: 'Staff', active: true },
];

test('lista só membros reais e sem duplicados', () => {
  assert.deepEqual(realMembers(team).map((p) => p.id), ['m1', 'm2', 'm3', 'm4']);
  assert.deepEqual(searchMembers(team, '').map((p) => p.id), ['m1', 'm2', 'm3']); // inativo fora
  assert.equal(searchMembers(team, 'ana').length, 1); // legado "Ana" não duplica
});

test('mesmo e-mail com outro id não duplica o membro real', () => {
  const dup = [...team, { id: 'm9', userId: 'u9', name: 'Ana S.', email: 'ANA@x.com', role: 'Staff', active: true }];
  assert.deepEqual(realMembers(dup).map((p) => p.id), ['m1', 'm2', 'm3', 'm4']);
});

test('busca ignora acento e maiúsculas e olha função, área e cargo', () => {
  assert.deepEqual(searchMembers(team, 'JOAO').map((p) => p.id), ['m2']);
  assert.deepEqual(searchMembers(team, 'credenc').map((p) => p.id), ['m2']);
  assert.deepEqual(searchMembers(team, 'audiovisual').map((p) => p.id), ['m3']);
  assert.deepEqual(searchMembers(team, 'fundador').map((p) => p.id), ['m1']);
  assert.deepEqual(searchMembers(team, 'zzz'), []);
});

test('busca esconde quem já é responsável e respeita o limite', () => {
  assert.deepEqual(searchMembers(team, '', ['m1']).map((p) => p.id), ['m2', 'm3']);
  assert.equal(searchMembers(team, '', [], 2).length, 2);
});

test('taskOwnerIds aceita o formato novo e o antigo', () => {
  assert.deepEqual(taskOwnerIds({ ownerIds: ['a', 'a', 'b', ''] }), ['a', 'b']);
  assert.deepEqual(taskOwnerIds({ ownerId: 'a' }), ['a']);
  assert.deepEqual(taskOwnerIds({ owner: 'Só nome' }), []);
});

test('tarefa antiga só com nome pré-seleciona o membro real de mesmo nome', () => {
  assert.deepEqual(legacyOwnerMatches({ owner: 'ana souza' }, team), ['m1']);
  assert.deepEqual(legacyOwnerMatches({ owner: 'Ana Souza, João Pereira' }, team), ['m1', 'm2']);
  assert.deepEqual(legacyOwnerMatches({ owner: 'Fulano' }, team), []);
  assert.deepEqual(legacyOwnerMatches({ owner: 'Ana Souza', ownerIds: ['m3'] }, team), []);
});

const event = { staffMembers: team, tasks: [{ id: 't', name: 'Montar palco', priority: 'Alta', status: 'A fazer', owner: 'Legado', ownerId: '' }, { id: 'o', name: 'Outra', owner: 'X' }] };

test('applyTaskEdit grava título, descrição e vários responsáveis sem tocar no resto', () => {
  const next = applyTaskEdit(event, 't', { name: '  Montar o palco ', description: 'Chegar às 8h', ownerIds: ['m2', 'm3'] });
  const t = next.tasks[0];
  assert.equal(t.name, 'Montar o palco');
  assert.equal(t.description, 'Chegar às 8h');
  assert.deepEqual(t.ownerIds, ['m2', 'm3']);
  assert.equal(t.ownerId, 'm2');
  assert.equal(t.owner, 'João Pereira, Marina Lima');
  assert.equal(t.priority, 'Alta');
  assert.equal(t.status, 'A fazer');
  assert.equal(next.tasks[1], event.tasks[1]);
  assert.equal(event.tasks[0].name, 'Montar palco'); // entrada intacta
});

test('applyTaskEdit é idempotente (commitCurrent aplica duas vezes)', () => {
  const patch = { name: 'N', description: 'D', ownerIds: ['m1'] };
  const once = applyTaskEdit(event, 't', patch);
  assert.deepEqual(applyTaskEdit(once, 't', patch), once);
});

test('applyTaskEdit recusa quem não é membro real ativo e guarda nome antigo quando não há seleção', () => {
  const next = applyTaskEdit(event, 't', { name: 'N', description: '', ownerIds: ['old1', 'm4', 'nao-existe', 'm1', 'm1'] });
  assert.deepEqual(next.tasks[0].ownerIds, ['m1']);
  const legacy = applyTaskEdit(event, 't', { name: 'N', description: '', ownerIds: [], legacyOwner: 'Legado' });
  assert.equal(legacy.tasks[0].owner, 'Legado');
  assert.equal(legacy.tasks[0].ownerId, '');
  const cleared = applyTaskEdit(event, 't', { name: 'N', description: '', ownerIds: [], legacyOwner: '' });
  assert.equal(cleared.tasks[0].owner, '');
});

test('applyTaskEdit mantém responsável já atribuído que saiu da equipe e título vazio não apaga o nome', () => {
  const ev = { ...event, tasks: [{ id: 't', name: 'Nome', ownerIds: ['gone'], ownerId: 'gone', owner: 'Ex-membro' }] };
  const next = applyTaskEdit(ev, 't', { name: '   ', description: 'x', ownerIds: ['gone', 'm1'] });
  assert.deepEqual(next.tasks[0].ownerIds, ['gone', 'm1']);
  assert.equal(next.tasks[0].name, 'Nome');
  assert.equal(next.tasks[0].owner, 'Ana Souza');
  assert.equal(applyTaskEdit(ev, 'missing', { name: 'x', ownerIds: [] }), ev);
});

test('assignTask (seletor simples) também preenche ownerIds', () => {
  const next = assignTask({ staffMembers: [{ id: 'p', name: 'Ana', active: true }], tasks: [{ id: 't' }] }, 't', 'p');
  assert.deepEqual(next.tasks[0].ownerIds, ['p']);
  assert.deepEqual(assignTask(next, 't', '').tasks[0].ownerIds, []);
});
