// MCT-84: abrir a gestão do fornecedor ao clicar no card.
// Parte 1: o Suppliers.jsx de verdade renderizado (react-test-renderer) com o contexto simulado.
// Parte 2: persistência e permissões contra o Supabase LOCAL (tokens reais).
// O comportamento no navegador (clique, Enter/Espaço, recarregar) está em scripts/test-mct84-ui.mjs.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import React from 'react';
import {act,create} from 'react-test-renderer';
import ts from 'typescript';
import {account,rpc} from './local-api.mjs';
import {applySupplierEdit} from '../src/lib/supplierEdit.js';
import {updateSupplierPayment} from '../src/lib/selectors.js';

// ---------------- Parte 1: componente ----------------
const suppliers=()=>[
  {id:'a',name:'Buffet',service:'Comida',contact:'',contracted:1000,paid:0,status:'pendente',dueDate:null,expenseCategory:'Alimentação'},
  {id:'b',name:'Som',service:'Áudio',contact:'',contracted:500,paid:500,status:'pago',dueDate:null,expenseCategory:'Outros'}];
const expenses=()=>[{id:'ea',description:'Buffet',supplierId:'a',type:'fixed',qty:1,unitValue:1000,status:'pendente'},{id:'eb',description:'Som',supplierId:'b',type:'fixed',qty:1,unitValue:500,status:'pago'}];
globalThis.__ctx={currentEvent:{id:'ev',expectedAudience:10,suppliers:suppliers(),expenses:expenses(),expenseCategories:['Outros']},updates:0,commits:0};
globalThis.__dialogProps=null;
const directory=await mkdtemp(resolve('node_modules/.mct84-'));let tree;
try {
  const real=name=>pathToFileURL(resolve(name)).href;
  await writeFile(join(directory,'mocks.mjs'),`import React from 'react';
export const useEventField=(key,initial)=>[React.useState(initial)[0],()=>{}];
export const useEvent=()=>({currentEvent:globalThis.__ctx.currentEvent,updateCurrent:fn=>{globalThis.__ctx.updates++;globalThis.__ctx.currentEvent=fn(globalThis.__ctx.currentEvent);},commitCurrent:async fn=>{globalThis.__ctx.commits++;globalThis.__ctx.currentEvent=fn(globalThis.__ctx.currentEvent);if(globalThis.__failNext)throw new Error('falha ao gravar');}});
export const useToast=()=>({toast:()=>{}});
export const Button=({children,...p})=>React.createElement('button',p,children);
export const Input=p=>React.createElement('input',p);
export default function SupplierEditDialog(props){globalThis.__dialogProps=props;return React.createElement('div',{'data-testid':'dialog-stub'},props.supplier.name);}`);
  let source=await readFile('src/pages/event/Suppliers.jsx','utf8');
  const map={'@/lib/useEventField':'./mocks.mjs','@/context/EventContext':'./mocks.mjs','@/components/ui/button':'./mocks.mjs','@/components/ui/input':'./mocks.mjs','@/components/ui/use-toast':'./mocks.mjs','@/components/suppliers/SupplierEditDialog':'./mocks.mjs',
    '@/lib/selectors':real('src/lib/selectors.js'),'@/lib/format':real('src/lib/format.js'),'@/lib/supplierEdit':real('src/lib/supplierEdit.js')};
  for(const [from,to] of Object.entries(map))source=source.replaceAll(`'${from}'`,`'${to}'`);
  source=source.replace("import SupplierEditDialog from './mocks.mjs'","import SupplierEditDialog from './mocks.mjs'");
  await writeFile(join(directory,'page.mjs'),ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext}}).outputText);
  const {default:Suppliers}=await import(pathToFileURL(join(directory,'page.mjs')));
  const render=()=>{act(()=>{tree=create(React.createElement(Suppliers));});};
  render();
  const cards=()=>tree.root.findAllByProps({'data-testid':'supplier-card'});
  assert.equal(cards().length,2);
  assert.equal(tree.root.findAllByProps({'data-testid':'dialog-stub'}).length,0);

  // Clique no card -> abre o fornecedor certo.
  act(()=>{cards()[1].props.onClick({stopPropagation(){}});});
  assert.equal(globalThis.__dialogProps.supplier.id,'b');
  console.log('CA1 PASS (componente): onClick do 2º card abriu o diálogo do fornecedor "b" (Som); o 1º abre "a".');
  act(()=>{cards()[0].props.onClick({stopPropagation(){}});});assert.equal(globalThis.__dialogProps.supplier.id,'a');

  // Cada card tem um <button> real (Enter/Espaço nativos) rotulado com o nome.
  const names=tree.root.findAllByType('button').filter(b=>/^Abrir fornecedor/.test(b.props['aria-label'] || '')).map(b=>b.props['aria-label']);
  assert.deepEqual(names,['Abrir fornecedor Buffet','Abrir fornecedor Som']);
  console.log('CA1b PASS (componente): cada card expõe um botão focável "Abrir fornecedor <nome>"; Enter/Espaço disparam o click nativo (provado no navegador em test-mct84-ui.mjs).');

  // Pagamento: o contêiner dos controles para a propagação, então o clique não chega ao card.
  act(()=>{tree.unmount();});globalThis.__dialogProps=null;render();
  const quitar=tree.root.findAllByType('button').find(b=>b.children.join('').includes('Quitar'));
  let stopped=0;const ev={stopPropagation(){stopped++;}};
  let wrapper=quitar.parent;while(wrapper && wrapper.type!=='div')wrapper=wrapper.parent;assert.equal(typeof wrapper.props.onClick,'function');
  const updatesBefore=globalThis.__ctx.updates;
  act(()=>{quitar.props.onClick(ev);});
  act(()=>{wrapper.props.onClick(ev);});
  assert.equal(stopped,1);assert.equal(globalThis.__dialogProps,null);
  assert.equal(globalThis.__ctx.updates,updatesBefore+1);
  const state=globalThis.__ctx.currentEvent;
  assert.equal(state.suppliers[0].paid,1000);assert.equal(state.expenses.length,2);
  console.log('CA3 PASS (componente): "Quitar" chama updateCurrent 1 vez (pago=1000, 2 lançamentos antes e depois), o contêiner chama stopPropagation e o diálogo não abre.');

  // Contratado abaixo do já pago é recusado antes de gravar, com a mensagem simples para o diálogo.
  act(()=>{cards()[0].props.onClick({stopPropagation(){}});});
  const paidBefore=globalThis.__ctx.currentEvent.suppliers[0].paid;
  await act(async()=>{await assert.rejects(globalThis.__dialogProps.onSave({name:'Buffet Novo',contracted:1}),e=>e.userMessage==='O valor contratado não pode ser menor que o já pago (R$ 1.000,00).');});
  assert.equal(globalThis.__ctx.commits,0);assert.equal(globalThis.__ctx.currentEvent.suppliers[0].contracted,1000);
  // O onSave grava as informações; pago (vem dos pagamentos) e lançamentos não mudam por aqui.
  await act(async()=>{await globalThis.__dialogProps.onSave({name:'Buffet Novo',paid:1});});
  const saved=globalThis.__ctx.currentEvent;
  assert.equal(globalThis.__ctx.commits,1);assert.equal(saved.suppliers[0].name,'Buffet Novo');
  assert.equal(saved.suppliers[0].contracted,1000);assert.equal(saved.suppliers[0].paid,paidBefore);assert.equal(saved.expenses.length,2);
  console.log('CA2 PASS (componente): contratado abaixo do pago é recusado sem gravar; onSave usa commitCurrent e muda as informações; pago e lançamentos seguem iguais.');
  // Se a gravação falhar, o fornecedor volta ao que era e o erro sobe para o diálogo (que mantém o rascunho).
  globalThis.__ctx.currentEvent={...globalThis.__ctx.currentEvent,suppliers:suppliers()};
  act(()=>{cards()[0].props.onClick({stopPropagation(){}});});
  globalThis.__failNext=true;
  await act(async()=>{await assert.rejects(globalThis.__dialogProps.onSave({name:'Não deve ficar'}),/falha ao gravar/);});
  assert.equal(globalThis.__ctx.currentEvent.suppliers[0].name,'Buffet');
  console.log('CA2b PASS (componente): gravação recusada -> onSave rejeita e o fornecedor volta a "Buffet" (nada fica só na tela).');
} finally {if(tree)act(()=>tree.unmount());delete globalThis.__ctx;delete globalThis.__dialogProps;delete globalThis.__failNext;await rm(directory,{recursive:true,force:true});}

// ---------------- Parte 2: banco local ----------------
const founder=await account('mct84-founder'),director=await account('mct84-director'),staff=await account('mct84-staff');
await rpc(founder.client,'criar_organizacao',{p_nome:'Synthetic MCT84'});
const org=await founder.client.from('memberships').select('organization_id').eq('user_id',founder.user.id).single();assert.ifError(org.error);
const eventId=randomUUID();
const row=await rpc(founder.client,'event_create',{p_org:org.data.organization_id,p_document:{id:eventId,name:'Synthetic MCT84',status:'planejamento',date:'2026-11-18',expectedAudience:50,modules:{schedule:true,suppliers:true},
  suppliers:suppliers(),expenses:expenses(),participants:[],schedule:[],tasks:[]}});
await rpc(staff.client,'event_join',{p_code:row.code});
await rpc(director.client,'event_join',{p_code:row.code,p_invitation:await rpc(founder.client,'event_invite',{p_event:eventId,p_role:'director'})});
const load=async client=>(await rpc(client,'event_list')).find(r=>r.document.id===eventId);

let d=await load(director.client);
let saved=await director.client.rpc('event_save',{p_event:eventId,p_revision:d.revision,p_document:applySupplierEdit(d.document,'a',{name:'Buffet Sabor & Cia',service:'Jantar',expenseCategory:'Alimentação',contact:'novo@sabor.test',paymentData:'PIX',notes:'Sem glúten',dueDate:'2026-12-01'})});
assert.ifError(saved.error);
let f=await load(founder.client);let a=f.document.suppliers.find(s=>s.id==='a');
assert.deepEqual([a.name,a.service,a.contact,a.paymentData,a.notes,a.dueDate,a.contracted,a.paid],['Buffet Sabor & Cia','Jantar','novo@sabor.test','PIX','Sem glúten','2026-12-01',1000,0]);
assert.equal(f.document.suppliers.find(s=>s.id==='b').name,'Som');
console.log('CA2 PASS (API): diretor editou nome/serviço/contato/pagamento/observações/vencimento do fornecedor "a"; fundador relê do banco os mesmos dados; contratado/pago e o outro fornecedor intactos.');

// Registrar pagamento depois da edição: 1 só lançamento, edição preservada.
const paid=updateSupplierPayment(f.document,'a',1000);
saved=await founder.client.rpc('event_save',{p_event:eventId,p_revision:f.revision,p_document:paid});assert.ifError(saved.error);
f=await load(founder.client);
assert.equal(f.document.expenses.length,2);assert.equal(f.document.suppliers.find(s=>s.id==='a').paid,1000);assert.equal(f.document.suppliers.find(s=>s.id==='a').name,'Buffet Sabor & Cia');
assert.equal(f.document.expenses.find(e=>e.id==='ea').status,'pago');
console.log('CA3 PASS (API): pagamento registrado pelo fluxo central grava pago=1000 e marca o lançamento como pago; continuam 2 lançamentos e o nome editado.');

// Staff não vê nem altera fornecedores.
const s=await load(staff.client);assert.equal(s.document.suppliers,undefined);
const denied=await staff.client.rpc('event_save',{p_event:eventId,p_revision:s.revision,p_document:{...s.document,suppliers:[{id:'x',name:'Invasor'}]}});
assert.equal(denied.error?.code,'42501');
const rest=await staff.request(`suppliers?event_id=eq.${eventId}&select=id`);assert.equal(rest.status,200);assert.deepEqual(rest.body,[]);
console.log(`CA4 PASS (API): staff não recebe fornecedores na projeção; event_save com fornecedores é negado (SQLSTATE ${denied.error.code}); tabela suppliers devolve [] ao staff.`);
console.log('Registros sintéticos locais mantidos; nada de produção foi tocado.');
