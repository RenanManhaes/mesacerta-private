import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeEventDocument } from './mergeEventDocument.js';

const clone = (v) => JSON.parse(JSON.stringify(v));
const base = () => ({
  id: 'ev',
  name: 'Evento',
  participants: [{ id: 'p1', name: 'Ana' }],
  tasks: [{ id: 't1', name: 'Palco', status: 'A fazer' }, { id: 't2', name: 'Som', status: 'A fazer' }],
  expenses: [{ id: 'e1', description: 'Buffet', value: 100 }],
});

test('os dois lados adicionam participantes diferentes: os dois ficam', () => {
  const b = base();
  const mine = clone(b); mine.participants.push({ id: 'p-mine', name: 'Minha' });
  const theirs = clone(b); theirs.participants.push({ id: 'p-theirs', name: 'Dele' });
  const { document, conflicts } = mergeEventDocument(b, mine, theirs);
  assert.deepEqual(document.participants.map((p) => p.id), ['p1', 'p-theirs', 'p-mine']);
  assert.deepEqual(conflicts, []);
});

test('eles mudam o status de uma tarefa e eu mudo uma despesa: as duas mudanças ficam', () => {
  const b = base();
  const mine = clone(b); mine.expenses[0].value = 150;
  const theirs = clone(b); theirs.tasks[0].status = 'Concluído';
  const { document, conflicts } = mergeEventDocument(b, mine, theirs);
  assert.equal(document.tasks[0].status, 'Concluído');
  assert.equal(document.expenses[0].value, 150);
  assert.deepEqual(conflicts, []);
});

test('mesmo campo do mesmo item com valores diferentes: vale o local e o conflito é listado', () => {
  const b = base();
  const mine = clone(b); mine.tasks[0].status = 'Em andamento';
  const theirs = clone(b); theirs.tasks[0].status = 'Concluído';
  const { document, conflicts } = mergeEventDocument(b, mine, theirs);
  assert.equal(document.tasks[0].status, 'Em andamento');
  assert.deepEqual(conflicts, [{ path: 'tasks[t1].status', mine: 'Em andamento', theirs: 'Concluído' }]);
});

test('um lado remove um item que o outro não tocou: continua removido (nos dois sentidos)', () => {
  const b = base();
  const mine = clone(b); mine.tasks = mine.tasks.filter((t) => t.id !== 't2');
  const r1 = mergeEventDocument(b, mine, clone(b));
  assert.deepEqual(r1.document.tasks.map((t) => t.id), ['t1']);
  assert.deepEqual(r1.conflicts, []);
  const theirs = clone(b); theirs.tasks = theirs.tasks.filter((t) => t.id !== 't2');
  const r2 = mergeEventDocument(b, clone(b), theirs);
  assert.deepEqual(r2.document.tasks.map((t) => t.id), ['t1']);
  assert.deepEqual(r2.conflicts, []);
});

test('removido de um lado e modificado do outro: fica a versão modificada e vira conflito', () => {
  const b = base();
  const mine = clone(b); mine.tasks = mine.tasks.filter((t) => t.id !== 't1');
  const theirs = clone(b); theirs.tasks[0].status = 'Concluído';
  const r1 = mergeEventDocument(b, mine, theirs);
  assert.equal(r1.document.tasks.find((t) => t.id === 't1').status, 'Concluído');
  assert.equal(r1.conflicts.length, 1);
  assert.equal(r1.conflicts[0].path, 'tasks[t1]');
  const r2 = mergeEventDocument(b, theirs, mine);
  assert.equal(r2.document.tasks.find((t) => t.id === 't1').status, 'Concluído');
  assert.equal(r2.conflicts.length, 1);
});

test('chaves de topo: quem mudou ganha; os dois mudando para valores diferentes é conflito', () => {
  const b = base();
  const mine = clone(b); mine.name = 'Meu nome';
  const theirs = clone(b); theirs.date = '2026-12-01';
  const r1 = mergeEventDocument(b, mine, theirs);
  assert.equal(r1.document.name, 'Meu nome');
  assert.equal(r1.document.date, '2026-12-01');
  assert.deepEqual(r1.conflicts, []);
  const other = clone(b); other.name = 'Nome dele';
  const r2 = mergeEventDocument(b, mine, other);
  assert.equal(r2.document.name, 'Meu nome');
  assert.deepEqual(r2.conflicts, [{ path: 'name', mine: 'Meu nome', theirs: 'Nome dele' }]);
});

test('a ordem é a deles, com os meus itens novos no fim na minha ordem', () => {
  const b = base();
  const mine = clone(b); mine.tasks.push({ id: 'm1', name: 'A' }, { id: 'm2', name: 'B' });
  const theirs = clone(b); theirs.tasks.unshift({ id: 'x1', name: 'X' });
  const { document } = mergeEventDocument(b, mine, theirs);
  assert.deepEqual(document.tasks.map((t) => t.id), ['x1', 't1', 't2', 'm1', 'm2']);
});

test('campos diferentes do mesmo item combinam; entradas não são alteradas', () => {
  const b = base();
  const mine = clone(b); mine.tasks[0].name = 'Palco novo';
  const theirs = clone(b); theirs.tasks[0].status = 'Concluído';
  const copies = [clone(b), clone(mine), clone(theirs)];
  const { document, conflicts } = mergeEventDocument(b, mine, theirs);
  assert.deepEqual(document.tasks[0], { id: 't1', name: 'Palco novo', status: 'Concluído' });
  assert.deepEqual(conflicts, []);
  assert.deepEqual([b, mine, theirs], copies);
});

test('sem mudanças de nenhum lado e sem base, devolve o documento sem conflitos', () => {
  const b = base();
  assert.deepEqual(mergeEventDocument(b, clone(b), clone(b)), { document: b, conflicts: [] });
  const r = mergeEventDocument(undefined, { id: 'a', n: 1 }, { id: 'a', n: 2 });
  assert.equal(r.document.n, 1);
  assert.equal(r.conflicts.length, 1);
});

test('listas sem id são atômicas: mudança de um lado só vale; dos dois, conflito com o local', () => {
  const b = { tags: ['a'] };
  assert.deepEqual(mergeEventDocument(b, { tags: ['a', 'b'] }, { tags: ['a'] }).document.tags, ['a', 'b']);
  const r = mergeEventDocument(b, { tags: ['a', 'b'] }, { tags: ['a', 'c'] });
  assert.deepEqual(r.document.tags, ['a', 'b']);
  assert.equal(r.conflicts[0].path, 'tags');
});

test('os dois adicionam o mesmo id: junta por campo', () => {
  const b = { items: [] };
  const r = mergeEventDocument(b, { items: [{ id: 'n', a: 1 }] }, { items: [{ id: 'n', b: 2 }] });
  assert.deepEqual(r.document.items, [{ id: 'n', b: 2, a: 1 }]);
  assert.deepEqual(r.conflicts, []);
});
