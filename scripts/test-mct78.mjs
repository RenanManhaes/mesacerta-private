// MCT-78: conta comum mantem 1 evento ativo (substitui o limite 3 da MCT-46).
// Roda contra o Supabase local (contas sinteticas). Nao toca producao.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import React from 'react';
import {act,create} from 'react-test-renderer';
import {MemoryRouter} from 'react-router-dom';
import ts from 'typescript';
import {account,rpc,admin} from './local-api.mjs';
import {eventLimitMessage,friendlyCreateError} from '../src/lib/eventLimit.js';

const MESSAGE = 'Seu plano permite 1 evento ativo. Para criar outro, fale com a gente.';
const orgOf = async (person) => {
  const {data,error} = await person.client.from('memberships').select('organization_id').eq('user_id',person.user.id);
  assert.ifError(error);
  return data.map(row => row.organization_id);
};
const newEvent = (name) => ({id: randomUUID(), name, status: 'planejamento', modules: {}});

// CA0: o limite vem do banco e vale 1.
const limitRow = await admin.rpc('event_limit');
assert.ifError(limitRow.error);
assert.equal(limitRow.data,1);
console.log('CA0 PASS: public.event_limit() = 1.');

// CA1: conta comum com 1 evento ativo nao cria outro por RPC.
const common = await account('mct78-common');
await rpc(common.client,'criar_organizacao',{p_nome:'Synthetic MCT-78 common'});
const [org] = await orgOf(common);
const first = await rpc(common.client,'event_create',{p_org:org,p_document:newEvent('Synthetic MCT-78 first')});
assert.equal(first.creationPermission.canCreate,false);
assert.equal(first.creationPermission.eventLimit,1);
const permission = await rpc(common.client,'event_creation_permission');
assert.deepEqual(permission,{canCreate:false,eventCount:1,eventLimit:1,multiEvent:false});
const denied = await common.request('rpc/event_create','POST',{p_org:org,p_document:newEvent('Synthetic MCT-78 forbidden')});
assert.equal(denied.status,403);
assert.equal(denied.body.code,'42501');
assert.equal((await rpc(common.client,'event_creation_permission')).eventCount,1);
console.log(`CA1 PASS: first event created; second via POST rpc/event_create -> HTTP ${denied.status}, SQLSTATE ${denied.body.code}; permission=${JSON.stringify(permission)}.`);

// CA2: duas chamadas paralelas (Promise.all) em organizacoes diferentes -> so uma passa.
const racer = await account('mct78-race');
for (let i = 0; i < 2; i++) await rpc(racer.client,'criar_organizacao',{p_nome:`Synthetic MCT-78 race org ${i}`});
const raceOrgs = await orgOf(racer);
assert.equal(raceOrgs.length,2);
const attempts = await Promise.all(raceOrgs.map((target,i) => racer.client.rpc('event_create',{p_org:target,p_document:newEvent(`Synthetic MCT-78 race ${i}`)})));
assert.equal(attempts.filter(result => !result.error).length,1);
assert.equal(attempts.filter(result => result.error?.code === '42501').length,1);
assert.equal((await rpc(racer.client,'event_creation_permission')).eventCount,1);
console.log('CA2 PASS: Promise.all with two organizations -> exactly one success and one SQLSTATE 42501; eventCount stays 1.');

// CA3: conta master cria mais de um evento.
const master = await account('mct78-master','renannascimento0304@gmail.com');
await rpc(master.client,'criar_organizacao',{p_nome:'Synthetic MCT-78 master'});
const masterOrgs = await orgOf(master);
const before = (await rpc(master.client,'event_creation_permission')).eventCount;
for (let i = 0; i < 2; i++) await rpc(master.client,'event_create',{p_org:masterOrgs[0],p_document:newEvent(`Synthetic MCT-78 master ${i}`)});
const masterAfter = await rpc(master.client,'event_creation_permission');
assert.equal(masterAfter.multiEvent,true);
assert.equal(masterAfter.canCreate,true);
assert.equal(masterAfter.eventCount,before + 2);
assert.ok(masterAfter.eventCount >= 2);
console.log(`CA3 PASS: master account created 2 more events (eventCount ${before} -> ${masterAfter.eventCount}); canCreate stays true.`);

// CA4: conta acima do limite conserva todos os eventos; apenas nao cria novos.
const heavy = await account('mct78-over');
await rpc(heavy.client,'criar_organizacao',{p_nome:'Synthetic MCT-78 over limit'});
const [heavyOrg] = await orgOf(heavy);
const flag = await admin.from('user_event_permissions').update({multi_event:true}).eq('user_id',heavy.user.id);
assert.ifError(flag.error);
const created = [];
for (let i = 0; i < 3; i++) created.push((await rpc(heavy.client,'event_create',{p_org:heavyOrg,p_document:newEvent(`Synthetic MCT-78 legacy ${i}`)})).document.id);
const revoke = await admin.from('user_event_permissions').update({multi_event:false}).eq('user_id',heavy.user.id);
assert.ifError(revoke.error);
const listed = await rpc(heavy.client,'event_list');
const listedIds = listed.map(row => row.document.id);
for (const id of created) assert.ok(listedIds.includes(id),`event ${id} must still be listed`);
const rows = await admin.from('platform_events').select('id,archived:document->archived').in('id',created);
assert.ifError(rows.error);
assert.equal(rows.data.length,3);
assert.ok(rows.data.every(row => !row.archived));
const heavyPermission = await rpc(heavy.client,'event_creation_permission');
assert.equal(heavyPermission.eventCount,3);
assert.equal(heavyPermission.canCreate,false);
const heavyDenied = await heavy.request('rpc/event_create','POST',{p_org:heavyOrg,p_document:newEvent('Synthetic MCT-78 over forbidden')});
assert.equal(heavyDenied.status,403);
assert.equal((await rpc(heavy.client,'event_list')).length,3);
console.log('CA4 PASS: account with 3 pre-existing events keeps all 3 (listed, not archived, not deleted), canCreate=false, new creation denied HTTP 403.');

// CA5: textos da interface (telas reais renderizadas com a permissao vinda da API).
assert.equal(eventLimitMessage(1),MESSAGE);
assert.equal(friendlyCreateError({code:'42501',message:denied.body.message}).message,MESSAGE);
const passthrough = {code:'XX000',message:'outro erro'};
assert.equal(friendlyCreateError(passthrough),passthrough);
const directory = await mkdtemp(resolve('node_modules/.limit78-ui-'));
let tree;
try {
  await writeFile(join(directory,'mocks.mjs'),`import React from 'react'; export const useEvent=()=>globalThis.__limitContext; export const EventBackupImport=()=>null; export const LogoutButton=()=>null; export const CityField=()=>null; export const formatDateFull=()=>''; export const daysUntil=()=>0; export const cn=(...x)=>x.filter(Boolean).join(' '); export const StatusPill=()=>null; export const Button=({children,variant,size,asChild,...props})=>asChild?children:React.createElement('button',props,children); export const Input=props=>React.createElement('input',props); export const Label=({children,...props})=>React.createElement('label',props,children);`);
  await writeFile(join(directory,'access.mjs'),await readFile('src/lib/eventAccess.js','utf8'));
  await writeFile(join(directory,'contact.mjs'),await readFile('src/lib/contact.js','utf8'));
  await writeFile(join(directory,'limit.mjs'),(await readFile('src/lib/eventLimit.js','utf8')).replace("'./contact.js'","'./contact.mjs'"));
  for (const [input,output] of [['src/pages/Events.jsx','events.mjs'],['src/pages/CreateEvent.jsx','create.mjs']]) {
    let source = (await readFile(input,'utf8')).replaceAll("'@/lib/eventAccess'","'./access.mjs'").replaceAll("'@/lib/eventLimit'","'./limit.mjs'");
    for (const alias of ['@/components/EventBackupImport','@/components/LogoutButton','@/context/EventContext','@/lib/format','@/lib/utils','@/components/common/Primitives','@/components/common/CityField','@/components/ui/button','@/components/ui/input','@/components/ui/label']) source = source.replaceAll(`'${alias}'`,"'./mocks.mjs'");
    for (const name of ['EventBackupImport','LogoutButton','CityField']) source = source.replace(`import ${name} from './mocks.mjs'`,`import {${name}} from './mocks.mjs'`);
    await writeFile(join(directory,output),ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext}}).outputText);
  }
  const {default:Events} = await import(pathToFileURL(join(directory,'events.mjs')));
  const {default:CreateEvent} = await import(pathToFileURL(join(directory,'create.mjs')));
  const mount = (permission,events,Component) => {
    globalThis.__limitContext = {events,canCreateEvent:permission.canCreate,eventLimit:permission.eventLimit,updateEventById:()=>{},addEvent:()=>{throw Error('UI must not create when limited');}};
    act(() => {tree = create(React.createElement(MemoryRouter,{future:{v7_startTransition:true,v7_relativeSplatPath:true}},React.createElement(Component)));});
  };
  const textOf = node => node.children.map(child => typeof child === 'string' ? child : textOf(child)).join('');
  const createButtons = () => tree.root.findAllByType('button').filter(button => /Criar evento|Novo evento/.test(textOf(button)));
  mount(permission,[first.document],Events);
  assert.equal(createButtons().length,0);
  assert.ok(textOf(tree.root.findByProps({role:'status'})).includes(MESSAGE));
  act(() => tree.unmount());
  mount(permission,[first.document],CreateEvent);
  assert.equal(createButtons().length,0);
  assert.equal(textOf(tree.root.findByProps({role:'alert'})),MESSAGE);
  assert.ok(tree.root.findAllByType('a').some(link => /wa\.me/.test(link.props.href)));
  act(() => tree.unmount());
  mount(masterAfter,[first.document],Events);
  assert.equal(createButtons().length,1);
  assert.equal(tree.root.findAllByProps({role:'status'}).length,0);
  act(() => tree.unmount());
  console.log(`CA5 PASS: limited Events shows "${MESSAGE}" and no create button; /novo shows the same alert with a contact link; master Events keeps "Criar evento" and shows no notice.`);
} finally {
  if (tree) act(() => tree.unmount());
  delete globalThis.__limitContext;
  await rm(directory,{recursive:true,force:true});
}
console.log('Synthetic local users/events retained; nothing deleted; no production access.');
