import test from 'node:test';
import assert from 'node:assert/strict';
import { recordSignal, hasNewerSignal, decideRefresh, reconcileRemote } from './realtimeRefresh.js';

const row = (document, revision) => ({ document, revision });
const doc = (extra = {}) => ({ id: 'ev', name: 'Evento', tasks: [{ id: 't', status: 'A fazer' }], participants: [{ id: 'p', name: 'Ana' }], ...extra });

test('sinal: guarda a maior revisão e ignora lixo', () => {
  let s = recordSignal({}, 'ev', 5);
  s = recordSignal(s, 'ev', 4);
  assert.deepEqual(s, { ev: 5 });
  assert.deepEqual(recordSignal(s, 'ev', 'x'), s);
  assert.deepEqual(recordSignal(s, '', 9), s);
});

test('eco da própria gravação (revisão igual ou menor) não conta como novidade', () => {
  assert.equal(hasNewerSignal({ ev: 7 }, { ev: 7 }), false);
  assert.equal(hasNewerSignal({ ev: 6 }, { ev: 7 }), false);
  assert.equal(hasNewerSignal({ ev: 8 }, { ev: 7 }), true);
  assert.equal(hasNewerSignal({ novo: 1 }, { ev: 7 }), true);
  assert.equal(hasNewerSignal({}, { ev: 7 }), false);
});

test('decisão: ignorar, adiar, mesclar ou aplicar', () => {
  assert.equal(decideRefresh({ newer: false, writing: false, dirty: false }), 'ignore');
  assert.equal(decideRefresh({ newer: false, writing: true, dirty: true }), 'ignore');
  assert.equal(decideRefresh({ newer: true, writing: true, dirty: false }), 'defer');
  assert.equal(decideRefresh({ newer: true, writing: true, dirty: true }), 'defer');
  assert.equal(decideRefresh({ newer: true, writing: false, dirty: true }), 'merge');
  assert.equal(decideRefresh({ newer: true, writing: false, dirty: false }), 'apply');
});

test('documento limpo: aplica a versão do servidor e anota a revisão', () => {
  const ack = [doc()];
  const remote = [row(doc({ name: 'Novo nome' }), 4)];
  const r = reconcileRemote({ acknowledged: ack, local: ack, remote });
  assert.equal(r.events[0].name, 'Novo nome');
  assert.deepEqual(r.changedIds, ['ev']);
  assert.deepEqual(r.revisions, { ev: 4 });
  assert.deepEqual(r.conflicts, []);
  assert.equal(r.acknowledged[0].name, 'Novo nome');
});

test('edição local pendente em outro campo: mescla sem perder nada', () => {
  const ack = [doc()];
  const local = [doc({ participants: [{ id: 'p', name: 'Ana' }, { id: 'q', name: 'Bia' }] })];
  const remote = [row(doc({ tasks: [{ id: 't', status: 'Concluído' }] }), 5)];
  const r = reconcileRemote({ acknowledged: ack, local, remote });
  assert.equal(r.events[0].tasks[0].status, 'Concluído');
  assert.equal(r.events[0].participants.length, 2);
  assert.deepEqual(r.conflicts, []);
  assert.deepEqual(r.revisions, { ev: 5 });
});

test('edição local pendente no mesmo campo: vale a local e o conflito é reportado', () => {
  const ack = [doc()];
  const local = [doc({ name: 'Meu nome' })];
  const remote = [row(doc({ name: 'Nome dela' }), 5)];
  const r = reconcileRemote({ acknowledged: ack, local, remote });
  assert.equal(r.events[0].name, 'Meu nome');
  assert.equal(r.conflicts.length, 1);
});

test('só a revisão mudou (documento igual): mantém o local e atualiza a revisão', () => {
  const ack = [doc()];
  const local = [doc({ name: 'Editando' })];
  const r = reconcileRemote({ acknowledged: ack, local, remote: [row(doc(), 9)] });
  assert.equal(r.events[0].name, 'Editando');
  assert.deepEqual(r.changedIds, []);
  assert.deepEqual(r.revisions, { ev: 9 });
});

test('evento novo no servidor entra; evento local nunca confirmado é mantido; acesso removido some', () => {
  const kept = { id: 'novo-local', name: 'Em criação' };
  const lost = { id: 'perdido', name: 'Sem acesso' };
  const r = reconcileRemote({
    acknowledged: [doc(), lost],
    local: [doc(), lost, kept],
    remote: [row(doc(), 1), row({ id: 'outro', name: 'Convite aceito' }, 1)],
  });
  assert.deepEqual(r.events.map((e) => e.id).sort(), ['ev', 'novo-local', 'outro']);
  assert.deepEqual(r.changedIds, ['outro']);
});

test('não altera as entradas', () => {
  const ack = [doc()];
  const local = [doc({ name: 'Meu' })];
  const remote = [row(doc({ tasks: [] }), 2)];
  const copy = structuredClone({ ack, local, remote });
  reconcileRemote({ acknowledged: ack, local, remote });
  assert.deepEqual({ ack, local, remote }, copy);
});
