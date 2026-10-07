// MCT-80 (staff não altera a programação) e MCT-81 (arrastar na lista principal).
// Roda contra o Supabase LOCAL (contas sintéticas). Não toca produção.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdtemp,rm,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import React from 'react';
import {act,create} from 'react-test-renderer';
import {rolldown} from 'rolldown';
import {account,rpc,admin} from './local-api.mjs';

const tag=randomUUID().slice(0,8);
const founder=await account(`mct80-founder-${tag}`),staff=await account(`mct80-staff-${tag}`),director=await account(`mct80-director-${tag}`);
await rpc(founder.client,'criar_organizacao',{p_nome:`Synthetic MCT80 ${tag}`});
const org=await founder.client.from('memberships').select('organization_id').eq('user_id',founder.user.id).single();assert.ifError(org.error);
const item=(id,start,duration,title)=>({id,start,duration,title,type:'Palestra',speaker:'',room:''});
const original=[item('abertura','09:00',30,'Abertura'),item('palestra','09:30',60,'Palestra'),item('painel','10:30',45,'Painel')];
const created=await rpc(founder.client,'event_create',{p_org:org.data.organization_id,p_document:{id:randomUUID(),name:`Synthetic schedule event ${tag}`,status:'planejamento',date:'2026-11-18',modules:{schedule:true},expenses:[],participants:[{id:'p1',name:'Participante'}],schedule:original,tasks:[]}});
const id=created.document.id;
await rpc(staff.client,'event_join',{p_code:created.code});
const invitation=await rpc(founder.client,'event_invite',{p_event:id,p_role:'director'});
await rpc(director.client,'event_join',{p_code:created.code,p_invitation:invitation});
const scheduleOf=async client=>(await rpc(client,'event_list')).find(r=>r.document.id===id);
const storedSchedule=async()=>(await admin.from('platform_events').select('document,revision').eq('id',id).single()).data;

// --- Leitura continua permitida para staff ---
let staffView=await scheduleOf(staff.client);
assert.equal(staffView.role,'staff');
assert.deepEqual(staffView.document.schedule.map(a=>a.id),['abertura','palestra','painel']);
console.log('CA leitura: staff lê a programação pelo event_list (3 atividades, papel staff).');

// --- Staff não altera pelo RPC event_save ---
const tampered=staffView.document.schedule.map(a=>a.id==='abertura'?{...a,title:'HACKEADO',start:'15:00'}:a);
let res=await staff.request('rpc/event_save','POST',{p_event:id,p_revision:staffView.revision,p_document:{...staffView.document,schedule:tampered}});
assert.equal(res.status,403);assert.equal(res.body.code,'42501');
console.log(`CA RPC alterar horário/título: HTTP ${res.status}, SQLSTATE ${res.body.code}, message=${res.body.message}`);
res=await staff.request('rpc/event_save','POST',{p_event:id,p_revision:staffView.revision,p_document:{...staffView.document,schedule:[]}});
assert.equal(res.status,403);assert.equal(res.body.code,'42501');
res=await staff.request('rpc/event_save','POST',{p_event:id,p_revision:staffView.revision,p_document:{...staffView.document,schedule:[...staffView.document.schedule,item('novo','18:00',30,'Intrusa')]}});
assert.equal(res.status,403);assert.equal(res.body.code,'42501');
console.log('CA RPC esvaziar a programação e inserir atividade nova: HTTP 403, SQLSTATE 42501 nos dois casos.');
let stored=await storedSchedule();
assert.deepEqual(stored.document.schedule,original);assert.equal(stored.revision,staffView.revision);
console.log('CA RPC: leitura independente (service role) mostra a programação idêntica à original e a revisão não mudou.');
// Revisão velha: nunca grava a programação (cai no conflito normal, 40001).
res=await staff.request('rpc/event_save','POST',{p_event:id,p_revision:staffView.revision-1,p_document:{...staffView.document,schedule:tampered}});
assert.notEqual(res.status,200);
assert.deepEqual((await storedSchedule()).document.schedule,original);
console.log(`CA RPC com revisão velha: HTTP ${res.status}, SQLSTATE ${res.body.code}; programação segue intacta.`);
// Staff continua salvando o que lhe cabe (participantes) e a programação enviada igual passa.
const participants=[...staffView.document.participants,{id:'p2',name:'Pessoa nova'}];
const newRevision=await rpc(staff.client,'event_save',{p_event:id,p_revision:staffView.revision,p_document:{...staffView.document,participants}});
stored=await storedSchedule();
assert.equal(stored.document.participants.length,2);assert.deepEqual(stored.document.schedule,original);assert.equal(stored.revision,newRevision);
console.log('CA regressão: staff ainda salva participantes (programação igual) e a programação não muda.');

// --- Staff não escreve direto em schedule_items; lê normalmente ---
let inserted=await admin.from('events').insert({id,organization_id:org.data.organization_id,nome:`Synthetic normalized ${tag}`});assert.ifError(inserted.error);
inserted=await admin.from('schedule_items').insert({event_id:id,titulo:'Item normalizado',duracao_min:30}).select('*').single();assert.ifError(inserted.error);
const rowId=inserted.data.id;
res=await staff.request(`schedule_items?event_id=eq.${id}&select=id,titulo`);
assert.equal(res.status,200);assert.equal(res.body.length,1);assert.equal(res.body[0].titulo,'Item normalizado');
console.log('CA staff SELECT em schedule_items: HTTP 200, 1 linha.');
res=await staff.request('schedule_items','POST',{event_id:id,titulo:'Intruso',duracao_min:10});
assert.equal(res.status,403);assert.equal(res.body.code,'42501');
console.log(`CA staff INSERT em schedule_items: HTTP ${res.status}, SQLSTATE ${res.body.code}.`);
res=await staff.request(`schedule_items?id=eq.${rowId}`,'PATCH',{titulo:'Hackeado'});
assert.equal(res.status,204);
res=await staff.request(`schedule_items?id=eq.${rowId}`,'DELETE');
assert.equal(res.status,204);
let kept=await admin.from('schedule_items').select('titulo').eq('id',rowId).single();assert.ifError(kept.error);assert.equal(kept.data.titulo,'Item normalizado');
console.log('CA staff UPDATE/DELETE em schedule_items: HTTP 204 sem linhas autorizadas; leitura independente prova item original intacto.');

// --- Diretor e fundador editam ---
res=await director.request('schedule_items','POST',{event_id:id,titulo:'Do diretor',duracao_min:10});
assert.equal(res.status,201);
res=await director.request(`schedule_items?id=eq.${rowId}`,'PATCH',{titulo:'Editado pelo diretor'});assert.equal(res.status,204);
kept=await admin.from('schedule_items').select('titulo').eq('id',rowId).single();assert.equal(kept.data.titulo,'Editado pelo diretor');
res=await founder.request(`schedule_items?id=eq.${rowId}`,'PATCH',{titulo:'Editado pelo fundador'});assert.equal(res.status,204);
kept=await admin.from('schedule_items').select('titulo').eq('id',rowId).single();assert.equal(kept.data.titulo,'Editado pelo fundador');
res=await director.request(`schedule_items?titulo=eq.Do diretor&event_id=eq.${id}`,'DELETE');assert.equal(res.status,204);
assert.equal((await admin.from('schedule_items').select('id').eq('event_id',id)).data.length,1);
console.log('CA diretor: INSERT, UPDATE, DELETE ok; fundador: UPDATE ok (confirmado por leitura independente).');
const directorView=await scheduleOf(director.client);
const reordered=[{...original[1],start:'09:00'},{...original[0],start:'10:00'},original[2]];
const afterDirector=await rpc(director.client,'event_save',{p_event:id,p_revision:directorView.revision,p_document:{...directorView.document,schedule:reordered}});
assert.deepEqual((await storedSchedule()).document.schedule,reordered);
const founderView=await scheduleOf(founder.client);
await rpc(founder.client,'event_save',{p_event:id,p_revision:afterDirector,p_document:{...founderView.document,schedule:original}});
assert.deepEqual((await storedSchedule()).document.schedule,original);
console.log('CA diretor e fundador salvam a programação pelo event_save (reordenar e voltar), confirmado por leitura independente.');

// --- Tela: staff só lê, direção arrasta (Schedule.jsx real, com primitivas simples) ---
globalThis.window??={self:{},top:{}}; // src/lib/utils.js lê window.self/top ao carregar
const directoryPath=await mkdtemp(resolve('node_modules/.mct80-ui-'));
try {
  const stubs={
    '@/context/EventContext':`export const useEvent=()=>globalThis.__ctx;`,
    '@/hooks/useActivityTypes':`export const useActivityTypes=()=>({types:[{name:'Palestra'}]});`,
    '@/components/schedule/ActivityDialog':`export default ()=>null;export const ColorPicker=()=>null;`,
    '@/components/schedule/ActivityTypesDialog':`export default ()=>null;`,
    '@/components/ui/input':`import React from 'react';export const Input=p=>React.createElement('input',p);`,
    '@/components/ui/select':`import React from 'react';const P=({children})=>React.createElement('div',null,children);export const Select=P,SelectContent=P,SelectItem=P,SelectTrigger=P,SelectValue=P;`,
    '@/components/ui/button':`import React from 'react';export const Button=({children,variant,size,...p})=>React.createElement('button',p,children);`,
    '@/components/ui/alert-dialog':`import React from 'react';const P=({children})=>React.createElement('div',null,children);export const AlertDialog=({open,children})=>open?React.createElement('section',{role:'alertdialog'},children):null;export const AlertDialogContent=P,AlertDialogHeader=P,AlertDialogTitle=P,AlertDialogDescription=P,AlertDialogFooter=P,AlertDialogCancel=P,AlertDialogAction=P;`,
    '@hello-pangea/dnd':`import React from 'react';
export const DragDropContext=({children,onDragEnd})=>{globalThis.__onDragEnd=onDragEnd;return children;};
export const Droppable=({children})=>children({innerRef(){},droppableProps:{},placeholder:null},{});
export const Draggable=({children})=>children({innerRef(){},draggableProps:{style:{}},dragHandleProps:{tabIndex:0,role:'button'}},{isDragging:false});`
  };
  const bundle=await rolldown({input:'src/pages/event/Schedule.jsx',external:['react','react-dom','react/jsx-runtime','lucide-react'],
    resolve:{alias:{'@':resolve('src')},extensions:['.jsx','.js','.mjs']},
    plugins:[{name:'stubs',resolveId(source){return source in stubs?`\0stub:${source}`:null;},load(path){return path.startsWith('\0stub:')?stubs[path.slice(6)]:null;}}]});
  const {output}=await bundle.generate({format:'esm'});
  const file=join(directoryPath,'schedule.mjs');await writeFile(file,output[0].code);
  const {default:Schedule}=await import(pathToFileURL(file));
  let doc={id,name:'Evento',desiredEndTime:'18:00',schedule:structuredClone(original)};
  let tree;
  const mount=role=>{
    globalThis.__ctx={currentEvent:doc,orgId:'org',access:{role},updateCurrent:fn=>{doc=fn(doc);}};
    act(()=>{tree?.unmount();tree=create(React.createElement(Schedule));});
    return tree.root;
  };
  const labels=root=>root.findAll(n=>typeof n.type==='string'&&typeof n.props?.['aria-label']==='string').map(n=>n.props['aria-label']);
  const text=root=>JSON.stringify(root.findAll(n=>typeof n.type==='string').flatMap(n=>n.children.filter(c=>typeof c==='string')));
  let root=mount('staff');
  assert.equal(labels(root).filter(l=>/^(Mover|Duplicar|Excluir) /.test(l)).length,0);
  assert.equal(root.findAll(n=>typeof n.type==='string'&&n.props?.['data-drag-handle']).length,0);
  assert.ok(!text(root).includes('Nova atividade'));assert.ok(!text(root).includes('Tipos de atividade'));
  assert.ok(text(root).includes('Você pode ver a programação. Só a direção do evento pode alterar.'));
  assert.equal(root.findAll(n=>typeof n.type==='string'&&n.props?.['data-activity-row']).length,3);
  assert.equal(globalThis.__onDragEnd,undefined);
  console.log('CA UI staff: Schedule.jsx real mostra as 3 atividades, o aviso "Você pode ver a programação. Só a direção do evento pode alterar." e nenhum botão de criar, duplicar, excluir, tipos nem alça de arraste.');
  for(const role of ['director','founder']) {
    root=mount(role);
    assert.equal(root.findAll(n=>typeof n.type==='string'&&n.props?.['data-drag-handle']).length,3);
    assert.equal(labels(root).filter(l=>/^Excluir /.test(l)).length,3);
    assert.ok(text(root).includes('Nova atividade'));assert.ok(!text(root).includes('Você pode ver a programação'));
    assert.ok(!text(root).includes('Cronograma'));
  }
  console.log('CA UI direção: founder e director veem alça de arraste, Excluir e Nova atividade, sem aviso; não existe mais o painel "Cronograma".');
  root=mount('director');
  act(()=>globalThis.__onDragEnd({draggableId:'abertura',source:{index:0},destination:{index:2}}));
  assert.deepEqual(doc.schedule.map(a=>`${a.id}@${a.start}+${a.duration}`),['palestra@09:00+60','painel@10:00+45','abertura@10:45+30']);
  root=mount('director');
  assert.deepEqual(root.findAll(n=>typeof n.type==='string'&&n.props?.['data-activity-row']).map(n=>n.props['data-activity-row']),['palestra','painel','abertura']);
  assert.equal(root.findAll(n=>typeof n.type==='string'&&n.props?.['data-conflict']==='true').length,0);
  console.log('CA UI arraste (director): soltar a abertura no fim da lista principal reordena e recalcula 09:00, 10:00, 10:45 sem sobreposição; lista renderizada na nova ordem.');
  // Staff, mesmo que algo dispare uma mudança, não altera o documento.
  const before=JSON.stringify(doc.schedule);mount('staff');
  assert.equal(JSON.stringify(doc.schedule),before);
  act(()=>tree.unmount());
} finally {await rm(directoryPath,{recursive:true,force:true});}
console.log('MCT-80/81: todos os testes passaram (dados sintéticos locais retidos; nada em produção).');
