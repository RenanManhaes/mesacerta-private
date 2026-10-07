import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import React from 'react';
import {act,create} from 'react-test-renderer';
import {writeTeamSupport,transpile,supportImports} from './team-ui-helpers.mjs';

// MCT-82: toda confirmação destrutiva é um modal (AlertDialog) com ação e Cancelar claros.
// Não usa banco: as telas reais são renderizadas com react-test-renderer sobre dados em memória.

// ---- (a) Nenhum confirm do navegador e nenhuma confirmação "inline" em src/ ------------------
const grep=(pattern)=>spawnSync('grep',['-rnE',pattern,'src','--include=*.js','--include=*.jsx','--include=*.ts','--include=*.tsx'],{encoding:'utf8'});
const browserConfirm=grep('window\\.(confirm|prompt)|(^|[^A-Za-z0-9_.$])confirm\\(');
assert.equal(browserConfirm.status,1,`window.confirm/confirm() em src/:\n${browserConfirm.stdout}`);
const inlineText=grep('Tem certeza|Confirmar remoção|Confirmar exclusão|Clique de novo para');
assert.equal(inlineText.status,1,`confirmação inline em src/:\n${inlineText.stdout}`);
console.log('PASS (a): grep em src/ não encontra window.confirm, confirm(), prompt() nem textos de confirmação inline ("Tem certeza", "Confirmar remoção"...).');

// Telas que apagam, removem, arquivam, revogam ou substituem têm de usar o modal.
const expected={
  'src/components/EventInvites.jsx':'ConfirmDialog','src/components/EventTeam.jsx':'ConfirmDialog','src/pages/event/EventSettings.jsx':'ConfirmDialog',
  'src/components/schedule/ActivityTypesDialog.jsx':'ConfirmDialog','src/pages/event/Networking.jsx':'ConfirmDialog',
  'src/components/TeamCatalog.jsx':'AlertDialog','src/pages/event/Schedule.jsx':'AlertDialog','src/components/tasks/TaskEditDialog.jsx':'AlertDialog','src/components/suppliers/SupplierEditDialog.jsx':'AlertDialog',
};
for(const [file,component] of Object.entries(expected))assert.ok((await readFile(file,'utf8')).includes(`<${component}`),`${file} deveria abrir <${component}>`);
const modalFiles=spawnSync('grep',['-rlE','<(ConfirmDialog|AlertDialog)\\b','src','--include=*.jsx'],{encoding:'utf8'}).stdout.split('\n').filter(Boolean).filter(file=>!file.startsWith('src/components/ui/')&&file!=='src/components/common/ConfirmDialog.jsx').sort();
assert.deepEqual(modalFiles,Object.keys(expected).sort(),'novo uso de modal fora da lista: atualize a tabela do MCT-82');
console.log(`PASS (a): ${modalFiles.length} telas abrem modal de confirmação: ${modalFiles.map(file=>file.replace('src/','')).join(', ')}.`);

// ---- (b) Telas reais renderizadas -------------------------------------------------------------
const dir=await mkdtemp(resolve('node_modules/.mct82-'));
globalThis.window={location:{origin:'http://localhost:5173'}};
const state={archived:false,navigated:[],removed:[],rpc:[],invites:[{id:'inv-1',role:'staff',revoked_at:null,created_at:'2026-10-01T12:00:00Z'}]};
globalThis.__mct82=state;
let tree;
const textOf=node=>typeof node==='string'?node:node.children.map(textOf).join('');
const alerts=()=>tree.root.findAll(node=>node.props.role==='alertdialog');
const buttons=()=>tree.root.findAllByType('button');
const button=label=>buttons().find(b=>textOf(b).trim()===label);
const press=async(label,pause=0)=>{const target=button(label);assert.ok(target,`botão "${label}" não encontrado`);await act(async()=>{await target.props.onClick({preventDefault(){}});if(pause)await new Promise(r=>setTimeout(r,pause));});};
const mount=async element=>{if(tree)act(()=>tree.unmount());await act(async()=>{tree=create(element);await new Promise(r=>setTimeout(r,30));});};
try {
  await writeTeamSupport(dir); // ConfirmDialog real + AlertDialog simples (role=alertdialog) + teamRoles
  await writeFile(join(dir,'mocks.mjs'),`import React from 'react';
const S=()=>globalThis.__mct82;
export const useEvent=()=>({currentEvent:{id:'evt-1',name:'Evento sintético',modules:{},networking:{}},access:{role:'founder',code:'ABC12345',codeEnabled:true},updateCurrent:update=>{const next=update({archived:false});if(next.archived)S().archived=true;},events:[{id:'evt-1',schedule:[{id:'a1',type:'Palestra'},{id:'a2',type:'Palestra'}]}],orgId:'org-1',updateEventById(){},reloadEvents(){},flush:async()=>{}});
export const useEventField=(key,initial)=>React.useState(typeof initial==='function'?initial():initial);
export const useNavigate=()=>path=>S().navigated.push(path);
export const Link=({children,to,...props})=>React.createElement('a',{...props,href:to},children);
export const useToast=()=>({toast(){}});
export const PageHeader=({title,actions})=>React.createElement('header',null,React.createElement('h1',null,title),actions);
export const Panel=({title,children})=>React.createElement('section',{'aria-label':title},children);
export const Field=({label,value,onChange})=>React.createElement('label',null,label,React.createElement('input',{value:value??'',onChange:e=>onChange(e.target.value)}));
export const Button=({children,variant,size,...props})=>React.createElement('button',props,children);
export const Switch=props=>React.createElement('input',{type:'checkbox',checked:props.checked,readOnly:true});
export const Input=props=>React.createElement('input',props);
export const Dialog=({open,children})=>open?React.createElement('div',{role:'dialog'},children):null;
export const DialogContent=({children})=>React.createElement('div',null,children);
export const DialogHeader=DialogContent,DialogTitle=DialogContent,DialogDescription=DialogContent,DialogFooter=DialogContent;
export default ()=>null;
export const useActivityTypes=()=>({types:S().types||(S().types=[{id:'type-1',name:'Palestra'},{id:'type-2',name:'Intervalo'}]),loading:false,error:null,create:async()=>{},rename:async()=>{},remove:async id=>{S().removed.push(id);S().types=S().types.filter(t=>t.id!==id);}});
const query={select:()=>query,eq:()=>query,order:async()=>({data:S().invites,error:null})};
export const supabase={from:()=>query,rpc:async(name,args)=>{S().rpc.push([name,args]);if(name==='event_revoke_invite')S().invites=S().invites.map(i=>i.id===args.p_invitation?{...i,revoked_at:'2026-10-07T12:00:00Z'}:i);return {data:null,error:null};}};
`);
  await writeFile(join(dir,'activityTypes.mjs'),await readFile('src/lib/activityTypes.js','utf8'));
  const maps={'@/lib/useEventField':'./mocks.mjs','react-router-dom':'./mocks.mjs','@/context/EventContext':'./mocks.mjs','@/components/EventInvites':'./mocks.mjs','@/components/common/ReferenceUI':'./mocks.mjs','@/components/ui/button':'./mocks.mjs','@/components/ui/switch':'./mocks.mjs','@/components/ui/use-toast':'./mocks.mjs','@/components/ui/input':'./mocks.mjs','@/components/ui/dialog':'./mocks.mjs','@/hooks/useActivityTypes':'./mocks.mjs','@/lib/activityTypes':'./activityTypes.mjs','@/api/supabaseClient':'./mocks.mjs',...supportImports};
  await transpile('src/pages/event/EventSettings.jsx',join(dir,'settings.mjs'),maps);
  await transpile('src/components/schedule/ActivityTypesDialog.jsx',join(dir,'types.mjs'),maps);
  // EventInvites real: o stub de './mocks.mjs' para EventInvites não vale aqui.
  await transpile('src/components/EventInvites.jsx',join(dir,'invites.mjs'),maps);
  const {default:Settings}=await import(pathToFileURL(join(dir,'settings.mjs')));
  const {default:TypesDialog}=await import(pathToFileURL(join(dir,'types.mjs')));
  const {default:Invites}=await import(pathToFileURL(join(dir,'invites.mjs')));

  // Tela 1: Configurações > Arquivar evento.
  await mount(React.createElement(Settings));
  assert.equal(alerts().length,0,'nada abre antes do clique');
  await press('Arquivar evento');
  assert.equal(alerts().length,1,'arquivar abre role=alertdialog');
  assert.match(textOf(alerts()[0]),/Arquivar Evento sintético\?/);
  assert.ok(button('Arquivar')&&button('Cancelar'),'ação com verbo e Cancelar');
  await press('Cancelar');
  assert.equal(alerts().length,0);assert.equal(state.archived,false,'Cancelar não arquiva');assert.deepEqual(state.navigated,[]);
  await press('Arquivar evento');await press('Arquivar');
  assert.equal(state.archived,true,'Confirmar arquiva');assert.deepEqual(state.navigated,['/eventos']);
  const link=tree.root.findAll(node=>node.type==='a');
  assert.ok(link.some(a=>a.props.href==='/event/evt-1/equipe'&&textOf(a)==='Equipe do evento'),'Configurações aponta para Equipe do evento');
  assert.ok(!JSON.stringify(tree.toJSON()).includes('Papéis de acesso'),'painel duplicado removido');
  console.log('PASS (b) Configurações: Arquivar evento abre alertdialog; Cancelar mantém o evento (archived=false); Arquivar confirma (archived=true, volta para /eventos); link para Equipe do evento presente e painel "Papéis de acesso" ausente.');

  // Tela 2: Tipos de atividade > Excluir tipo (antes: segundo Dialog com role=alertdialog).
  await mount(React.createElement(TypesDialog,{open:true,onOpenChange(){}}));
  assert.equal(alerts().length,0);
  await act(async()=>{tree.root.findByProps({'aria-label':'Excluir Palestra'}).props.onClick();});
  assert.equal(alerts().length,1,'excluir tipo abre role=alertdialog');
  assert.match(textOf(alerts()[0]),/Excluir o tipo “Palestra”\?.*2 atividades em 1 evento/);
  assert.ok(button('Excluir tipo')&&button('Cancelar'));
  await press('Cancelar');
  assert.equal(alerts().length,0);assert.deepEqual(state.removed,[],'Cancelar não exclui');
  await act(async()=>{tree.root.findByProps({'aria-label':'Excluir Palestra'}).props.onClick();});
  await press('Excluir tipo',60);
  assert.deepEqual(state.removed,['type-1'],'Confirmar exclui');assert.equal(alerts().length,0,'modal fecha ao concluir');
  console.log('PASS (b) Tipos de atividade: Excluir abre alertdialog com o uso do tipo; Cancelar não chama remove; "Excluir tipo" remove type-1 e fecha.');

  // Tela 3: Convites > Revogar link e Revogar código.
  await mount(React.createElement(Invites));
  await act(async()=>{await new Promise(r=>setTimeout(r,30));});
  await press('Revogar link');
  assert.equal(alerts().length,1,'revogar link abre role=alertdialog');
  assert.match(textOf(alerts()[0]),/Revogar o link de Staff\?/);
  await press('Cancelar');
  assert.equal(alerts().length,0);assert.equal(state.rpc.length,0,'Cancelar não chama o banco');assert.equal(state.invites[0].revoked_at,null);
  await press('Revogar link');await press('Revogar',60);
  assert.deepEqual(state.rpc.map(([name])=>name),['event_revoke_invite']);assert.ok(state.invites[0].revoked_at,'Confirmar revoga');
  await press('Revogar código');
  assert.equal(alerts().length,1);assert.match(textOf(alerts()[0]),/Revogar o código\?/);
  await press('Cancelar');
  assert.equal(state.rpc.length,1,'Cancelar o código não chama o banco');
  console.log('PASS (b) Convites: Revogar link/código abrem alertdialog; Cancelar não chama o banco; Revogar confirma (event_revoke_invite).');
} finally {
  if(tree)act(()=>tree.unmount());
  delete globalThis.__mct82;
  await rm(dir,{recursive:true,force:true});
}
console.log('MCT-82 OK');
