import test from 'node:test';
import assert from 'node:assert/strict';
import { createTabAuthStorage, tabAuthStorageKey } from './tabAuthStorage.js';

const fake = () => {
  const m = new Map();
  return {
    getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k),
    key: i => [...m.keys()][i] ?? null, get length() { return m.size; },
  };
};
const BASE = 'sb-test-auth-token';
const session = (id, token = 't') => JSON.stringify({ access_token: token, refresh_token: `r-${token}`, user: { id } });
const idOf = (tab) => { const raw = tab.storage.getItem(tab.key); return raw ? JSON.parse(raw).user.id : null; };
// Cada "aba" tem seu sessionStorage; todas dividem o mesmo localStorage. `sessionOf` simula o F5.
const openTab = (shared, sessionOf) => {
  const key = tabAuthStorageKey(BASE);
  const tab = sessionOf ? sessionOf.tab : fake();
  return { key, tab, storage: createTabAuthStorage(BASE, key, { shared, tab }) };
};

test('duas abas, duas contas: entrar em uma não muda a outra', () => {
  const shared = fake();
  const a = openTab(shared), b = openTab(shared);
  a.storage.setItem(a.key, session('u1'));
  b.storage.setItem(b.key, session('u2'));
  assert.equal(idOf(a), 'u1');
  assert.equal(idOf(b), 'u2');
});

test('F5 (mesmo sessionStorage, novo carregamento com nova chave) mantém a conta da aba', () => {
  const shared = fake();
  const a = openTab(shared), b = openTab(shared);
  a.storage.setItem(a.key, session('u1'));
  b.storage.setItem(b.key, session('u2'));
  assert.equal(idOf(openTab(shared, a)), 'u1');
  assert.equal(idOf(openTab(shared, b)), 'u2');
});

test('renovar token gira só a conta da aba e não muda a "última conta"', () => {
  const shared = fake();
  const a = openTab(shared), b = openTab(shared);
  a.storage.setItem(a.key, session('u1', 'old'));
  b.storage.setItem(b.key, session('u2'));
  a.storage.setItem(a.key, session('u1', 'new'));
  assert.equal(JSON.parse(a.storage.getItem(a.key)).access_token, 'new');
  assert.equal(shared.getItem(`${BASE}:last`), 'u2');
});

test('aba nova herda a última conta; sair não derruba as outras e a aba que saiu não herda', () => {
  const shared = fake();
  const a = openTab(shared), b = openTab(shared);
  a.storage.setItem(a.key, session('u1'));
  b.storage.setItem(b.key, session('u2'));
  assert.equal(idOf(openTab(shared)), 'u2');
  b.storage.removeItem(b.key);
  b.storage.release();
  assert.equal(idOf(b), null);
  assert.equal(idOf(a), 'u1');
  assert.equal(shared.getItem(`${BASE}:last`), 'u1');
  assert.equal(idOf(openTab(shared, b)), null, 'aba que saiu continua sem conta no F5');
  assert.equal(idOf(openTab(shared)), 'u1');
});

test('sessão que só expirou mantém a fixação: novo login da mesma conta em outra aba recupera a aba', () => {
  const shared = fake();
  const a = openTab(shared), b = openTab(shared);
  a.storage.setItem(a.key, session('u1'));
  a.storage.removeItem(a.key); // expirou: removida pela SDK, sem release
  assert.equal(idOf(a), null);
  b.storage.setItem(b.key, session('u1', 'again'));
  assert.equal(JSON.parse(a.storage.getItem(a.key)).access_token, 'again');
});

test('não troca a conta da aba em silêncio quando a sessão dela some', () => {
  const shared = fake();
  const a = openTab(shared), b = openTab(shared);
  a.storage.setItem(a.key, session('u1'));
  b.storage.setItem(b.key, session('u2'));
  a.storage.removeItem(a.key);
  assert.equal(idOf(a), null);
  assert.equal(idOf(a), null);
});

test('migra a sessão no formato antigo (chave única) sem deslogar', () => {
  const shared = fake();
  shared.setItem(BASE, session('legacy'));
  assert.equal(idOf(openTab(shared)), 'legacy');
  assert.equal(shared.getItem(BASE), null);
  assert.ok(shared.getItem(`${BASE}:u:legacy`));
});

test('chaves que não são a sessão (ex.: verificador PKCE) ficam compartilhadas, com nome estável', () => {
  const shared = fake();
  const a = openTab(shared), b = openTab(shared);
  a.storage.setItem(`${a.key}-code-verifier`, 'v');
  assert.equal(b.storage.getItem(`${b.key}-code-verifier`), 'v');
  assert.equal(shared.getItem(`${BASE}-code-verifier`), 'v');
});

test('storageKey é único por carregamento (canal de broadcast não é compartilhado)', () => {
  assert.notEqual(tabAuthStorageKey(BASE), tabAuthStorageKey(BASE));
});
