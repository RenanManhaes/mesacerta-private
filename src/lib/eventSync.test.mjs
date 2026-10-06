import test from 'node:test';
import assert from 'node:assert/strict';
import { saveEventWithMerge } from './eventSync.js';

// Cliente falso: simula event_save com trava otimista e event_list.
function fakeClient(server, { interfering = 0 } = {}) {
  const calls = [];
  let interferences = interfering;
  return {
    calls,
    rpc(name, args) {
      calls.push(name);
      const result = (() => {
        if (name === 'event_list') return { data: [{ document: structuredClone(server.document), revision: server.revision }], error: null };
        if (interferences > 0 && args.p_revision === server.revision) {
          interferences--;
          server.document = { ...server.document, tasks: [...server.document.tasks, { id: `x${interferences}`, name: 'Outra pessoa' }] };
          server.revision++;
        }
        if (args.p_revision !== server.revision) return { data: null, error: { code: '40001', message: 'Outra pessoa atualizou o evento.' } };
        server.document = structuredClone(args.p_document);
        return { data: ++server.revision, error: null };
      })();
      return { abortSignal: () => Promise.resolve(result) };
    },
  };
}

const base = { id: 'ev', tasks: [{ id: 't', status: 'A fazer' }], expenses: [{ id: 'e', value: 1 }] };

test('conflito 40001: busca o servidor, junta e regrava com a nova revisão', async () => {
  const server = { document: { ...base, tasks: [{ id: 't', status: 'Concluído' }] }, revision: 3 };
  const client = fakeClient(server);
  const mine = { ...base, expenses: [{ id: 'e', value: 2 }] };
  const saved = await saveEventWithMerge({ client, base, document: mine, revision: 2 });
  assert.equal(saved.merged, true);
  assert.deepEqual(saved.conflicts, []);
  assert.equal(saved.revision, 4);
  assert.equal(server.document.tasks[0].status, 'Concluído');
  assert.equal(server.document.expenses[0].value, 2);
  assert.deepEqual(client.calls, ['event_save', 'event_list', 'event_save']);
});

test('desiste depois de 3 tentativas e devolve o erro do servidor', async () => {
  const server = { document: structuredClone(base), revision: 1 };
  const client = fakeClient(server, { interfering: 10 });
  await assert.rejects(
    saveEventWithMerge({ client, base, document: { ...base, expenses: [{ id: 'e', value: 9 }] }, revision: 1 }),
    /Outra pessoa atualizou o evento/,
  );
  assert.equal(client.calls.filter((c) => c === 'event_save').length, 3);
});

test('erro que não é 40001 não é repetido', async () => {
  const client = { rpc: () => ({ abortSignal: () => Promise.resolve({ data: null, error: { code: '42501', message: 'negado' } }) }) };
  await assert.rejects(saveEventWithMerge({ client, base, document: base, revision: 1 }), /negado/);
});
