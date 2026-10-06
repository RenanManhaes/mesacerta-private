import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import React from 'react';
import { act, create } from 'react-test-renderer';
import { MemoryRouter } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import ts from 'typescript';

// Local only: never use remote env files, customer accounts or production keys.
const status = spawnSync('npx --yes supabase status -o json', {shell: true, encoding: 'utf8'});
assert.equal(status.status, 0, 'Start the local Supabase stack before running this test.');
const config = JSON.parse(status.stdout.slice(status.stdout.indexOf('{')));
assert.match(config.API_URL, /^http:\/\/(127\.0\.0\.1|localhost):/);
const options = {auth: {persistSession: false, autoRefreshToken: false, detectSessionInUrl: false}};
const admin = createClient(config.API_URL, config.SERVICE_ROLE_KEY, options);
const password = randomUUID();
const email = `mct55-${randomUUID()}@example.test`;
const added = await admin.auth.admin.createUser({email, password, email_confirm: true});
assert.ifError(added.error);
async function signedInClient() {
  const client = createClient(config.API_URL, config.ANON_KEY, options);
  const login = await client.auth.signInWithPassword({email, password});
  assert.ifError(login.error);
  return client;
}
const firstClient = await signedInClient();
const createdOrg = await firstClient.rpc('criar_organizacao', {p_nome: 'Synthetic MCT55 QA'});
assert.ifError(createdOrg.error);
const memberships = await firstClient.from('memberships').select('organization_id').eq('user_id', added.data.user.id);
assert.ifError(memberships.error);
const orgId = memberships.data[0].organization_id;
const id = randomUUID();
const fixture = {id, name: 'Synthetic event', participants: [], tasks: [], expenses: [], revenues: [], suppliers: [], sponsors: [], tickets: [], sponsorPlans: [], schedule: [], modules: {networking: true}, networking: {tables: 3, rounds: 3, tableList: [{id: 'table-a', name: 'Table A', capacity: 4}], participantSettings: {}}, networkingDistribution: {signature: 'synthetic', tab: [[1,2,3]], seed: 1}};
const inserted = await firstClient.rpc('event_create', {p_org: orgId, p_document: fixture});
assert.ifError(inserted.error);

const dir = await mkdtemp(resolve('node_modules/.mct55-'));
let tree;
globalThis.window = {addEventListener() {}, removeEventListener() {}};
// Any browser storage use fails the test, including a hidden fallback.
globalThis.localStorage = {getItem() {throw Error('Unexpected browser storage read');}, setItem() {throw Error('Unexpected browser storage write');}};
try {
  await writeFile(join(dir, 'api.mjs'), `export let supabase; export let auth; export const configure = (client, value) => {supabase = client; auth = value;}; export const useAuth = () => auth;`);
  for (const [source, output] of [['src/context/EventContext.jsx', 'context.mjs'], ['src/lib/useEventField.js', 'field.mjs']]) {
    const code = (await readFile(source, 'utf8'))
      .replaceAll("'@/api/supabaseClient'", "'./api.mjs'")
      .replaceAll("'@/lib/AuthContext'", "'./api.mjs'")
      .replaceAll("'@/context/EventContext'", "'./context.mjs'")
      .replace("import { emptyEventTemplate } from '@/lib/demoData';", "const emptyEventTemplate = data => ({id: crypto.randomUUID(), ...data});");
    await writeFile(join(dir, output), ts.transpileModule(code, {compilerOptions: {jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext}}).outputText);
  }
  const {EventProvider, useEvent} = await import(pathToFileURL(join(dir, 'context.mjs')));
  const {useEventField} = await import(pathToFileURL(join(dir, 'field.mjs')));
  const {configure} = await import(pathToFileURL(join(dir, 'api.mjs')));
  const auth = {user: added.data.user, memberships: [{organization_id: orgId}]};
  let event;
  let draft;
  let setDraft;
  function Probe() {
    event = useEvent();
    [draft, setDraft] = useEventField('expenses.draft', null);
    return React.createElement('input', {value: draft?.description || '', readOnly: true});
  }
  async function mount(client) {
    configure(client, auth);
    await act(async () => {
      tree = create(React.createElement(MemoryRouter, {initialEntries: [`/event/${id}/despesas`], future: {v7_startTransition: true, v7_relativeSplatPath: true}}, React.createElement(EventProvider, null, React.createElement(Probe))));
    });
    for (let i = 0; i < 100 && (!event || event.loading || !event.currentEvent); i++) {
      await act(async () => {await new Promise(resolve => setTimeout(resolve, 20));});
    }
    assert.equal(event.currentEvent?.id, id);
  }
  await mount(firstClient);
  act(() => {
    event.updateCurrent(e => ({...e,
      participants: [{id: 'person-1', name: 'Synthetic Person'}],
      tasks: [{id: 'task-1', name: 'Synthetic Task'}],
      expenses: [{id: 'expense-1', unitValue: 23}],
      revenues: [{id: 'revenue-1', expected: 40}],
      suppliers: [{id: 'supplier-1', name: 'Synthetic Supplier'}],
      sponsors: [{id: 'sponsor-1', company: 'Synthetic Sponsor'}],
      tickets: [{id: 'ticket-1'}], schedule: [{id: 'activity-1'}],
    }));
    setDraft({description: 'Unfinished synthetic expense', unitValue: 17});
  });
  await act(async () => {await event.flush();});
  assert.equal(event.saveStatus, 'saved');
  const snapshot = structuredClone(event.currentEvent);
  act(() => tree.unmount());
  event = null;
  await mount(await signedInClient());
  assert.deepEqual(event.currentEvent, snapshot);
  assert.equal(draft.description, 'Unfinished synthetic expense');
  console.log('CA1 PASS: second independent Auth client + provider reads all event modules, networking and unfinished draft from local Supabase API.');
  act(() => tree.unmount());
  event = null;
  await mount(await signedInClient());
  assert.deepEqual(event.currentEvent, snapshot);
  console.log('CA2 PASS: fresh client with persistSession=false and storage methods that throw restores identical event without browser cache.');

  configure({rpc() {throw new Error('Synthetic network interruption');}}, auth);
  act(() => setDraft({description: 'Failed write stays in memory'}));
  await act(async () => {await assert.rejects(event.flush(), /Synthetic network interruption/);});
  assert.equal(event.saveStatus, 'error');
  assert.ok(tree.root.findAllByProps({role: 'alert'}).length);
  assert.equal(draft.description, 'Failed write stays in memory');
  const retry = tree.root.findAllByType('button').find(b => b.children.join('') === 'Tentar novamente');
  assert.ok(retry);
  const thirdClient = await signedInClient();
  configure(thirdClient, auth);
  await act(async () => {retry.props.onClick(); await new Promise(resolve => setTimeout(resolve, 150));});
  await act(async () => {await event.flush();});
  assert.equal(event.saveStatus, 'saved');
  const readBack = await thirdClient.rpc('event_list');
  assert.ifError(readBack.error);
  assert.equal(readBack.data[0].document.uiState[added.data.user.id]['expenses.draft'].description, 'Failed write stays in memory');
  console.log('CA3 PASS: network failure produces visible alert and saveStatus=error; retry button persists retained draft through authenticated API.');

  const contextSource = await readFile('src/context/EventContext.jsx', 'utf8');
  assert.ok(!contextSource.includes('localStorage'));
  console.log('CA4 PASS: production EventContext contains no localStorage reference; runtime storage traps were never called.');

  const outsiderEmail = `mct55-outsider-${randomUUID()}@example.test`;
  const outsider = await admin.auth.admin.createUser({email: outsiderEmail, password, email_confirm: true});
  assert.ifError(outsider.error);
  const outsiderClient = createClient(config.API_URL, config.ANON_KEY, options);
  const outsiderLogin = await outsiderClient.auth.signInWithPassword({email: outsiderEmail, password});
  assert.ifError(outsiderLogin.error);
  const response = await fetch(`${config.API_URL}/rest/v1/platform_workspaces?organization_id=eq.${orgId}&select=events`, {
    headers: {apikey: config.ANON_KEY, Authorization: `Bearer ${outsiderLogin.data.session.access_token}`},
  });
  assert.equal(response.status, 403);
  assert.equal((await response.json()).code, '42501');
  console.log('RLS PASS: REST request with outsider JWT returns HTTP 403 SQLSTATE 42501; legacy organization backup denied by database policy.');

  const legacy = {id: randomUUID(), name: 'Synthetic legacy backup', participants: [{id: 'legacy-person', name: 'Synthetic Legacy Person'}]};
  await act(async () => {await event.importBackup(JSON.parse(JSON.stringify({events: [legacy]})));});
  await act(async () => {await event.flush();});
  const imported = await thirdClient.rpc('event_list');
  assert.ifError(imported.error);
  assert.deepEqual(imported.data.find(e => e.document.id === legacy.id).document, legacy);
  await assert.rejects(() => event.importBackup({events: [legacy]}), /IDs de eventos repetidos/);
  console.log('MIGRATION PASS: explicit JSON backup import persists all legacy fields; duplicate IDs rejected without overwriting existing events.');

  // Concurrency protection: another client updates while this form is open.
  const row = imported.data.find(e => e.document.id === id);
  const changed = await thirdClient.rpc('event_save', {p_event: id, p_revision: row.revision, p_document: row.document});
  assert.ifError(changed.error);
  act(() => setDraft({description: 'Conflict must not overwrite'}));
  await act(async () => {await assert.rejects(event.flush(), /Outra pessoa atualizou/);});
  assert.equal(event.saveStatus, 'error');
  console.log('REGRESSION PASS: stale revision is rejected; concurrent document is never silently overwritten.');
  console.log('TEST_DATA: synthetic users and organization retained locally; no customer data deleted or remote project accessed.');
} finally {
  if (tree) act(() => tree.unmount());
  await rm(dir, {recursive: true, force: true});
}
