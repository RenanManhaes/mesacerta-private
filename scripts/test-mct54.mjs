import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import React from 'react';
import { act, create } from 'react-test-renderer';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import ts from 'typescript';

// Compile the actual components, replacing only the API and organization page.
// The test runs the real AuthProvider and route gate, including their effects.
const dir = await mkdtemp(resolve('node_modules/.mct54-'));
let tree;
try {
  await writeFile(join(dir, 'api.mjs'), `
export let listener;
export let calls = 0;
export let query = () => Promise.resolve({data: [{organization_id: 'org-1'}]});
export const setQuery = fn => { query = fn; };
export const emit = (event, session) => listener(event, session);
export const session = {user: {id: 'user-1'}, access_token: 'synthetic-test-token'};
export const releaseTabSession = () => {};
export const supabase = {
  auth: {
    getSession: async () => ({data: {session}}),
    onAuthStateChange: fn => { listener = fn; return {data: {subscription: {unsubscribe() {}}}}; },
    signOut: async () => {listener('SIGNED_OUT', null); return {};},
  },
  from: () => ({select: () => ({eq: () => {calls++; return query();}})}),
};
`);
  for (const [source, output] of [
    ['src/lib/AuthContext.jsx', 'auth.mjs'],
    ['src/components/ProtectedRoute.jsx', 'route.mjs'],
  ]) {
    const code = (await readFile(source, 'utf8'))
      .replace("'@/api/supabaseClient'", "'./api.mjs'")
      .replace("'@/lib/AuthContext'", "'./auth.mjs'")
      .replace("import CreateOrganization from '@/pages/CreateOrganization';", "const CreateOrganization = () => null;");
    await writeFile(join(dir, output), ts.transpileModule(code, {
      compilerOptions: {jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext},
    }).outputText);
  }
  const {AuthProvider, useAuth} = await import(pathToFileURL(join(dir, 'auth.mjs')));
  const {default: ProtectedRoute} = await import(pathToFileURL(join(dir, 'route.mjs')));
  const api = await import(pathToFileURL(join(dir, 'api.mjs')));
  let auth;
  let mounts = 0;
  function Form() {
    const [value, setValue] = React.useState('');
    React.useEffect(() => { mounts++; }, []);
    return React.createElement('input', {value, onChange: e => setValue(e.target.value)});
  }
  function Probe() { auth = useAuth(); return null; }
  const tick = () => new Promise(resolve => setTimeout(resolve, 10));
  await act(async () => {
    tree = create(React.createElement(AuthProvider, null,
      React.createElement(Probe),
      React.createElement(MemoryRouter, {initialEntries: ['/form']},
        React.createElement(Routes, null,
          React.createElement(Route, {element: React.createElement(ProtectedRoute, {unauthenticatedElement: React.createElement(Navigate, {to: '/login'})})},
            React.createElement(Route, {path: '/form', element: React.createElement(Form)})),
          React.createElement(Route, {path: '/login', element: React.createElement('p', null, 'LOGIN REDIRECT')})))));
    await tick();
  });
  await act(async () => { await tick(); });
  const input = () => tree.root.findByType('input');
  act(() => input().props.onChange({target: {value: 'formulário pela metade'}}));
  const mounted = input();
  const assertForm = () => {
    assert.equal(input(), mounted);
    assert.equal(input().props.value, 'formulário pela metade');
    assert.equal(mounts, 1);
    assert.ok(!JSON.stringify(tree.toJSON()).includes('LOGIN REDIRECT'));
  };
  await act(async () => {
    api.emit('SIGNED_IN', {...api.session});
    api.emit('TOKEN_REFRESHED', {...api.session, access_token: 'renewed-synthetic-token'});
    await tick();
  });
  assertForm();
  assert.equal(api.calls, 1);
  console.log('CA1 PASS: focus SIGNED_IN + TOKEN_REFRESHED preserve input and mounted instance (mounts=1).');
  console.log('CA2 PASS: same user renewal performs no membership reload, no login redirect (queries=1).');

  let complete;
  api.setQuery(() => new Promise(resolve => { complete = resolve; }));
  let pending;
  act(() => { pending = auth.refreshMemberships(); });
  assertForm();
  await act(async () => { complete({data: [{organization_id: 'org-1'}]}); await pending; });
  assertForm();
  console.log('CA1 PASS: explicit background revalidation retains form before and after response.');

  api.setQuery(async () => ({error: new Error('synthetic network failure')}));
  await act(async () => { await auth.refreshMemberships(); });
  assertForm();
  assert.equal(auth.memberships.length, 1);
  assert.ok(tree.root.findAllByProps({role: 'alert'}).length);
  console.log('CA1 PASS: failed revalidation retains organization and input with visible error.');

  act(() => api.emit('SIGNED_OUT', null));
  assertForm();
  assert.equal(auth.isAuthenticated, false);
  assert.ok(JSON.stringify(tree.toJSON()).includes('Sua sessão expirou'));
  console.log('CA3 PASS: expired session shows alert without redirect or loss; isAuthenticated=false.');
  act(() => api.emit('SIGNED_IN', api.session));
  assertForm();
  assert.equal(auth.sessionExpired, false);
  console.log('CA3 PASS: signing in again as same user preserves form and clears expiration.');
  await act(async () => { await auth.signOut(); });
  assert.equal(tree.root.findAllByType('input').length, 0);
  assert.equal(auth.sessionExpired, false);
  console.log('REGRESSION PASS: explicit logout clears session and protected form.');
} finally {
  if (tree) act(() => tree.unmount());
  await rm(dir, {recursive: true, force: true});
}
