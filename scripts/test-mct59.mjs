import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import React from 'react';
import {act,create} from 'react-test-renderer';
import ts from 'typescript';
import {account,rpc,permitMultiple} from './local-api.mjs';
import {writeTeamSupport,transpile} from './team-ui-helpers.mjs';
const founder=await account('mct59-founder'),staff=await account('mct59-staff');
await permitMultiple(founder); // Explicit local commercial exception for multi-event regression fixtures.
await rpc(founder.client,'criar_organizacao',{p_nome:'Synthetic MCT59'});
const org=await founder.client.from('memberships').select('organization_id').eq('user_id',founder.user.id).single();assert.ifError(org.error);
const p_org=org.data.organization_id;
const events=[];
for(let i=0;i<2;i++)events.push(await rpc(founder.client,'event_create',{p_org,p_document:{id:randomUUID(),name:`Synthetic catalog event ${i}`,tasks:[]}}));
for(const event of events)await rpc(staff.client,'event_join',{p_code:event.code});
let catalog,tree;
const name=`Robótica ${randomUUID().slice(0,6)}`;
const directory=await mkdtemp(resolve('node_modules/.catalog-ui-'));
try {
 globalThis.__catalogClient=founder.client;
 await writeFile(join(directory,'mocks.mjs'),`import React from 'react'; export const supabase=globalThis.__catalogClient; export const Button=({children,variant,...props})=>React.createElement('button',props,children); export const Dialog=({open,children})=>open?React.createElement('div',null,children):null; export const DialogContent=({children})=>React.createElement('div',null,children); export const DialogHeader=DialogContent; export const DialogTitle=DialogContent; export const DialogDescription=DialogContent; export const Input=props=>React.createElement('input',props);`);
 await writeTeamSupport(directory); // ConfirmDialog/AlertDialog simples usados pelos componentes reais.
 const maps={'@/api/supabaseClient':'./mocks.mjs','@/components/ui/button':'./mocks.mjs','@/components/ui/dialog':'./mocks.mjs','@/components/ui/input':'./mocks.mjs','@/components/ui/alert-dialog':'./alert.mjs','@/components/common/SearchSuggestions':'./search.mjs'};
 for(const [input,output] of [['src/components/TeamCatalog.jsx','catalog.mjs'],['src/hooks/useTeamCatalog.js','hook.mjs'],['src/components/common/SearchSuggestions.jsx','search.mjs']])await transpile(input,join(directory,output),maps);
 const {CatalogField,TeamCatalogManager}=await import(pathToFileURL(join(directory,'catalog.mjs')));
 const {useTeamCatalog}=await import(pathToFileURL(join(directory,'hook.mjs')));
 function Probe({manager=false}) {catalog=useTeamCatalog(p_org);const [value,setValue]=React.useState('');return manager?React.createElement(TeamCatalogManager,{catalog,open:true,onOpenChange:()=>{}}):React.createElement(CatalogField,{label:'Função',kind:'function',catalog,value,onChange:setValue});}
 const mount=async(manager=false)=>{await act(async()=>{tree=create(React.createElement(Probe,{manager}));await new Promise(r=>setTimeout(r,120));});};
 const type=value=>act(()=>tree.root.findByProps({'aria-label':'Função'}).props.onChange({target:{value}}));
 const button=label=>tree.root.findAllByType('button').find(b=>b.children.join('')===label);
 // MCT-72 (docs/usabilidade-2026-10-06.md): sugestões desde a primeira letra e criação direta, sem confirmação.
 await mount();type('zzzqx');assert.equal(tree.root.findAllByProps({role:'listbox'}).length,0);
 type('se');assert.ok(tree.root.findAllByProps({role:'option'}).length>0,'sugestões já com duas letras');
 type('seg');assert.ok(tree.root.findAllByProps({role:'option'}).some(item=>item.children.join('').includes('Segurança')));
 console.log('CA1 UI PASS: actual CatalogField suggests from the first letters (MCT-72), none for an unknown term; seg returns Segurança from organization starter catalog.');
 type(name);assert.equal(tree.root.findAllByProps({role:'alertdialog'}).length,0,'criar valor novo não abre confirmação (MCT-72)');
 await act(async()=>{await button(`Adicionar “${name}”`).props.onClick();});
 assert.ok(catalog.items.some(item=>item.name===name));
 type(name.slice(0,3));assert.ok(tree.root.findAllByProps({role:'option'}).some(item=>item.children.join('')===name));
 console.log('CA2 UI/API PASS: actual Adicionar button creates new function through authenticated API and immediately exposes it in suggestions.');
 const item=catalog.items.find(item=>item.name===name);act(()=>tree.unmount());
 await mount();type(name.slice(0,3));assert.ok(tree.root.findAllByProps({role:'option'}).some(item=>item.children.join('')===name));
 const second=(await rpc(founder.client,'event_list')).find(row=>row.document.id===events[1].document.id);assert.equal(second.organizationId,p_org);
 console.log('CA3 UI/API PASS: fresh field/hook for second event reads same organization catalog and suggests previously created function.');
 act(()=>tree.unmount());
 for(const event of events){const team=await rpc(founder.client,'event_team',{p_event:event.document.id});const member=team.find(m=>m.user_id===staff.user.id);await rpc(founder.client,'event_edit_person',{p_member:member.id,p_name:'Synthetic catalog person',p_email:staff.user.email,p_phone:'',p_function:name});}
 await mount(true);
 const inUse=catalog.items.find(row=>row.id===item.id);assert.equal(inUse.people_count,1); // Same account in two events counts as one person.
 act(()=>tree.root.findByProps({'aria-label':`Excluir ${name}`}).props.onClick());
 const confirmation=tree.root.findByProps({role:'alertdialog'});const alertText=confirmation.findAll(node=>typeof node.type==='string').flatMap(node=>node.children.filter(child=>typeof child==='string')).join(' ');assert.ok(alertText.includes('1 pessoa'),alertText);
 assert.ok(catalog.items.some(row=>row.id===item.id));
 const noConfirmation=await founder.client.rpc('team_catalog_remove',{p_catalog:item.id,p_confirm_count:null});assert.match(noConfirmation.error.message,/1 pessoas/);
 await act(async()=>{await confirmation.findAllByType('button').find(b=>b.children.join('')==='Excluir').props.onClick({preventDefault(){}});await new Promise(r=>setTimeout(r,200));});
 assert.ok(!catalog.items.some(row=>row.id===item.id));
 for(const event of events){const team=await rpc(founder.client,'event_team',{p_event:event.document.id});assert.equal(team.find(m=>m.user_id===staff.user.id).function,name);}
 console.log('CA4 UI/API PASS: real manager displays one person using value across two events, requires confirmation; API rejects missing confirmation; confirmed removal hides suggestion and preserves both profiles.');
 // MCT-72: o gestor cuida de funções e áreas; cargos continuam existindo na API, sem tela de gestão.
 const label=`Synthetic area ${randomUUID().slice(0,6)}`;
 act(()=>tree.root.findByProps({'aria-label':'Tipo do novo cadastro'}).props.onChange({target:{value:'area'}}));
 act(()=>tree.root.findByProps({'aria-label':'Nome do novo cadastro'}).props.onChange({target:{value:label}}));
 await act(async()=>{await tree.root.findByType('form').props.onSubmit({preventDefault(){}});await new Promise(r=>setTimeout(r,150));});
 assert.ok(catalog.items.some(item=>item.kind==='area' && item.name===label));
 assert.ok(!tree.root.findAllByProps({value:'title'}).length,'gestor não oferece cargos');
 await act(async()=>{await catalog.create('title',`Synthetic title ${randomUUID().slice(0,6)}`);});
 const area=catalog.items.find(item=>item.kind==='area' && item.name.startsWith('Synthetic area'));
 const title=catalog.items.find(item=>item.kind==='title' && item.name.startsWith('Synthetic title'));
 const team=await rpc(founder.client,'event_team',{p_event:events[0].document.id});const member=team.find(m=>m.user_id===staff.user.id);
 await rpc(founder.client,'event_edit_person',{p_member:member.id,p_name:'Contact remains editable',p_email:staff.user.email,p_phone:'',p_function:name,p_area:area.name,p_job_title:title.name});
 const profile=(await rpc(founder.client,'event_team',{p_event:events[0].document.id})).find(m=>m.id===member.id);
 assert.equal(profile.function,name);assert.equal(profile.area,area.name);assert.equal(profile.job_title,title.name);assert.equal(profile.role,'staff');
 console.log('SCOPE UI/API PASS: real manager creates a reusable area (title via API, MCT-72); profile saves both while retaining archived function text and staff access role.');
 const role=(await rpc(staff.client,'event_list'))[0].role;assert.equal(role,'staff');
 const denied=await staff.request('rpc/team_catalog_create','POST',{p_org,p_kind:'title',p_name:'Diretor'});assert.equal(denied.status,403);assert.equal(denied.body.code,'42501');
 const direct=await staff.request(`team_catalog?organization_id=eq.${p_org}&select=id`);assert.equal(direct.status,200);assert.deepEqual(direct.body,[]);
 console.log(`RLS PASS: staff catalog mutation HTTP ${denied.status}, SQLSTATE ${denied.body.code}; direct catalog read HTTP 200 []; function/title never change access role.`);
 const source=await readFile('src/components/EventTeam.jsx','utf8');assert.ok(source.includes('+ Nova pessoa</Button><Button variant="outline" onClick={()=>setCatalogOpen(true)}>Gerenciar funções, áreas e cargos'));
 console.log('MANAGER PASS: manager action is adjacent to + Nova pessoa in EventTeam actions; functions, areas and titles handled by common catalog. Local fixtures retained.');
} finally {if(tree)act(()=>tree.unmount());delete globalThis.__catalogClient;await rm(directory,{recursive:true,force:true});}
