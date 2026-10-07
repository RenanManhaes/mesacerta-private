import test from 'node:test';
import assert from 'node:assert/strict';
import { recordSignal, hasNewerSignal, decideRefresh, reconcileRemote, createMutationTracker } from './realtimeRefresh.js';

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

// Rebusca em voo + criação local: a resposta antiga não traz o evento novo.
test('criar evento durante a rebusca: a resposta velha seria tratada como "perdi o acesso" e é descartada', async () => {
  const tracker = createMutationTracker();
  const old = [doc()];
  let local = [doc()];
  let acknowledged = [doc()];
  const startedEpoch = tracker.snapshot(); // a rebusca começa aqui e fica em voo
  await tracker.track(async () => { // o usuário cria um evento (addEvent) e o servidor confirma
    const created = { id: 'novo', name: 'Criado agora' };
    local = [...local, created];
    acknowledged = [...acknowledged, created];
  });
  // Sem a guarda, aplicar a resposta velha removeria o evento recém-criado:
  const unguarded = reconcileRemote({ acknowledged, local, remote: old.map((d) => row(d, 1)) });
  assert.deepEqual(unguarded.events.map((e) => e.id), ['ev'], 'este é o defeito que a guarda evita');
  // Com a guarda, a rebusca percebe que algo mudou no meio, descarta e busca de novo:
  assert.equal(tracker.changedSince(startedEpoch), true);
  // A nova rebusca (começa depois) vê o servidor já com o evento e não descarta:
  const secondEpoch = tracker.snapshot();
  const fresh = reconcileRemote({ acknowledged, local, remote: [row(doc(), 1), row({ id: 'novo', name: 'Criado agora' }, 1)] });
  assert.equal(tracker.changedSince(secondEpoch), false);
  assert.deepEqual(fresh.events.map((e) => e.id).sort(), ['ev', 'novo']);
});

test('operação em andamento conta como mudança e como ocupado; falha também encerra a operação', async () => {
  const tracker = createMutationTracker();
  const snap = tracker.snapshot();
  assert.equal(tracker.busy(), false);
  assert.equal(tracker.changedSince(snap), false);
  let release;
  const running = tracker.track(() => new Promise((resolve) => { release = resolve; }));
  assert.equal(tracker.busy(), true);
  const during = tracker.snapshot();
  assert.equal(tracker.changedSince(during), true, 'enquanto há operação, nenhuma resposta é confiável');
  release();
  await running;
  assert.equal(tracker.busy(), false);
  assert.equal(tracker.changedSince(during), true, 'a operação terminou depois do início da rebusca');
  await assert.rejects(tracker.track(async () => { throw new Error('limite'); }), /limite/);
  assert.equal(tracker.busy(), false, 'erro não deixa o contador preso');
});

test('gravação durante a rebusca também invalida a resposta (não desfaz a mudança recém-salva)', async () => {
  const tracker = createMutationTracker();
  const startedEpoch = tracker.snapshot();
  await tracker.track(async () => {}); // um save começou e terminou enquanto a rebusca estava em voo
  assert.equal(tracker.changedSince(startedEpoch), true);
});
