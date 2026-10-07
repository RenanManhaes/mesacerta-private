// MCT-84 e MCT-86 no navegador (Playwright + Chromium) contra o Supabase LOCAL.
// Pré-requisitos: Supabase local no ar e o app em http://localhost:5183 (npx vite --port 5183)
// com .env.local (NÃO commitado) apontando para o Supabase local.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import {account,rpc,admin} from './local-api.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'/opt/node22/lib/node_modules/playwright');
const APP=process.env.APP_URL||'http://localhost:5183';

const founder=await account('mct84ui-founder'),staff=await account('mct84ui-staff'),staff2=await account('mct84ui-staff2');
const password='Senha-local-'+randomUUID();
for(const p of [founder,staff,staff2]){const r=await admin.auth.admin.updateUserById(p.user.id,{password});assert.ifError(r.error);}
await rpc(founder.client,'criar_organizacao',{p_nome:'Synthetic MCT84 UI'});
const org=await founder.client.from('memberships').select('organization_id').eq('user_id',founder.user.id).single();assert.ifError(org.error);
const eventId=randomUUID();
const cats=['Alimentação','Audiovisual','Outros'];
const row=await rpc(founder.client,'event_create',{p_org:org.data.organization_id,p_document:{id:eventId,name:'Evento UI 84/86',status:'planejamento',date:'2026-11-18',expectedAudience:100,
  modules:{schedule:true,suppliers:true,tickets:true,sponsors:true,networking:true,capacity:true},expenseCategories:cats,revenueCategories:['Ingressos','Outros'],
  tickets:[],sponsors:[],sponsorPlans:[],revenues:[],participants:[],schedule:[],
  suppliers:[
   {id:'s-buffet',name:'Buffet Sabor',service:'Alimentação',contact:'buffet@sabor.test',contracted:1000,paid:0,entry:0,nextDue:'2026-11-12',dueDate:'2026-11-12',paymentData:'PIX',notes:'',status:'pendente',expenseCategory:'Alimentação',expenseType:'fixed'},
   {id:'s-som',name:'Audio Pro',service:'Audiovisual',contact:'som@audio.test',contracted:500,paid:0,entry:0,nextDue:null,dueDate:null,paymentData:'',notes:'Som e luz',status:'pendente',expenseCategory:'Audiovisual',expenseType:'fixed'}],
  expenses:[
   {id:'e-buffet',description:'Buffet',category:'Alimentação',supplierId:'s-buffet',type:'fixed',qty:1,unitValue:1000,dueDate:'2026-11-12',status:'pendente',note:''},
   {id:'e-som',description:'Audiovisual',category:'Audiovisual',supplierId:'s-som',type:'fixed',qty:1,unitValue:500,dueDate:'',status:'pendente',note:''}],
  tasks:[{id:'t1',name:'Montar palco',description:'',category:'Operação',priority:'Normal',status:'A fazer',ownerId:'',owner:''},
         {id:'t2',name:'Conferir crachás',description:'',category:'Operação',priority:'Normal',status:'A fazer',ownerId:'',owner:''}]}});
await rpc(staff.client,'event_join',{p_code:row.code});await rpc(staff2.client,'event_join',{p_code:row.code});
const team=await rpc(founder.client,'event_team',{p_event:eventId});
const idOf=p=>team.find(m=>m.user_id===p.user.id).id;
await rpc(founder.client,'event_edit_person',{p_member:idOf(staff),p_name:'Beatriz Souza',p_email:'bea@example.test',p_phone:'',p_function:'',p_area:'',p_job_title:''});
await rpc(founder.client,'event_edit_person',{p_member:idOf(staff2),p_name:'João Pereira',p_email:'joao@example.test',p_phone:'',p_function:'',p_area:'',p_job_title:''});
// Staff da Beatriz já tem a tarefa t2 (para a visão restrita).
{const r=(await rpc(founder.client,'event_list')).find(x=>x.document.id===eventId);
 const doc=r.document;doc.tasks=doc.tasks.map(t=>t.id==='t2'?{...t,ownerIds:[idOf(staff)],ownerId:idOf(staff),owner:'Beatriz Souza'}:t);
 await rpc(founder.client,'event_save',{p_event:eventId,p_revision:r.revision,p_document:doc});}
const current=async()=>(await rpc(founder.client,'event_list')).find(x=>x.document.id===eventId);

const browser=await chromium.launch();
const open=async person=>{
  const context=await browser.newContext({viewport:{width:1280,height:900}});const page=await context.newPage();
  page.setDefaultTimeout(15000);
  await page.goto(`${APP}/login`);
  await page.getByPlaceholder('voce@empresa.com.br').fill(person.user.email);await page.getByPlaceholder('••••••••').fill(password);
  await page.getByRole('button',{name:/^Entrar/}).click();await page.waitForURL(/\/eventos/);
  return {context,page};
};
const settle=async page=>{await page.getByText('Salvo',{exact:true}).waitFor();};

// ======================= MCT-84: fornecedores =======================
{
  const {context,page}=await open(founder);
  await page.goto(`${APP}/event/${eventId}/fornecedores`);
  const cards=page.getByTestId('supplier-card');await cards.first().waitFor();assert.equal(await cards.count(),2);

  // Clique no card (no vazio do card, longe dos controles) abre O fornecedor clicado.
  await cards.nth(1).click({position:{x:12,y:12}});
  let dialog=page.getByTestId('supplier-dialog');await dialog.waitFor();
  assert.equal(await dialog.getByLabel('Nome',{exact:true}).inputValue(),'Audio Pro');
  assert.match(await dialog.getByTestId('supplier-summary').innerText(),/CONTRATADO\s+R\$\s?500\s+PAGO\s+R\$\s?0\s+A PAGAR\s+R\$\s?500/);
  await dialog.getByRole('button',{name:'Cancelar'}).click();await dialog.waitFor({state:'detached'});
  console.log('CA1a PASS: clique no segundo card abriu "Audio Pro" (nome certo, resumo com contratado R$ 500, pago R$ 0, a pagar R$ 500), sem mexer em nada.');

  // Teclado: foco no botão do card + Enter e Espaço.
  const buffet=page.getByRole('button',{name:'Abrir fornecedor Buffet Sabor'});
  await buffet.focus();await page.keyboard.press('Enter');
  await dialog.waitFor();assert.equal(await dialog.getByLabel('Nome',{exact:true}).inputValue(),'Buffet Sabor');
  await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});
  await buffet.focus();await page.keyboard.press('Space');
  await dialog.waitFor();assert.equal(await dialog.getByLabel('Nome',{exact:true}).inputValue(),'Buffet Sabor');
  console.log('CA1b PASS: Enter e Espaço com foco no card abrem "Buffet Sabor"; Esc fecha.');

  // Descartar com AlertDialog (nunca window.confirm).
  let nativeDialogs=0;page.on('dialog',d=>{nativeDialogs++;d.dismiss();});
  await dialog.getByLabel('Nome',{exact:true}).fill('Nome que será descartado');
  await dialog.getByRole('button',{name:'Cancelar'}).click();
  const alert=page.getByRole('alertdialog');await alert.waitFor();assert.match(await alert.innerText(),/Descartar as alterações/);
  await alert.getByRole('button',{name:'Continuar editando'}).click();await alert.waitFor({state:'detached'});
  assert.equal(await dialog.getByLabel('Nome',{exact:true}).inputValue(),'Nome que será descartado');
  await dialog.getByRole('button',{name:'Cancelar'}).click();await alert.waitFor();await alert.getByRole('button',{name:'Descartar'}).click();
  await dialog.waitFor({state:'detached'});assert.equal(nativeDialogs,0);
  assert.equal((await current()).document.suppliers[0].name,'Buffet Sabor');
  console.log('CA1c PASS: confirmação de descarte é AlertDialog (role=alertdialog), zero window.confirm, nome não mudou.');

  // Editar e persistir.
  await buffet.click();await dialog.waitFor();
  await dialog.getByLabel('Nome',{exact:true}).fill('Buffet Sabor & Cia');
  await dialog.getByLabel('Contato').fill('novo@sabor.test');
  await dialog.getByLabel('Observações').fill('Sem glúten para 10 pessoas');
  await dialog.getByLabel('Dados de pagamento').fill('Transferência');
  await dialog.getByRole('button',{name:'Salvar'}).click();await dialog.waitFor({state:'detached'});await settle(page);
  let sup=(await current()).document.suppliers.find(s=>s.id==='s-buffet');
  assert.deepEqual([sup.name,sup.contact,sup.notes,sup.paymentData,sup.contracted,sup.paid],['Buffet Sabor & Cia','novo@sabor.test','Sem glúten para 10 pessoas','Transferência',1000,0]);
  await page.reload();await cards.first().waitFor();
  await page.getByRole('button',{name:'Abrir fornecedor Buffet Sabor & Cia'}).click();await dialog.waitFor();
  assert.equal(await dialog.getByLabel('Contato').inputValue(),'novo@sabor.test');assert.equal(await dialog.getByLabel('Observações').inputValue(),'Sem glúten para 10 pessoas');
  await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});
  console.log('CA2 PASS: edição gravada no banco (event_list) e, após recarregar a página, o modal reabre com os novos dados; contratado/pago intactos (1000/0).');

  // Pagamento: Quitar não abre o modal e não duplica lançamentos.
  const before=(await current()).document;
  await cards.nth(0).getByRole('button',{name:'Quitar'}).click();
  await page.getByText('Pagamento registrado').first().waitFor();await settle(page);
  assert.equal(await page.getByTestId('supplier-dialog').count(),0);
  let after=(await current()).document;
  assert.equal(after.expenses.length,before.expenses.length);assert.equal(after.suppliers.find(s=>s.id==='s-buffet').paid,1000);
  assert.equal(after.expenses.find(e=>e.id==='e-buffet').status,'pago');assert.equal(after.suppliers.find(s=>s.id==='s-buffet').name,'Buffet Sabor & Cia');
  // Valor parcial digitado + Tab (blur) também não abre o modal.
  const valor=cards.nth(1).getByLabel('Valor pago a Audio Pro');await valor.fill('200');await valor.press('Tab');await settle(page);
  assert.equal(await page.getByTestId('supplier-dialog').count(),0);
  after=(await current()).document;
  assert.equal(after.suppliers.find(s=>s.id==='s-som').paid,200);assert.equal(after.expenses.length,2);
  assert.equal(after.expenses.find(e=>e.id==='e-som').paidAmount,200);
  console.log('CA3 PASS: "Quitar" e valor parcial não abriram o modal; contratado/pago/despesas mudaram uma vez só (2 despesas antes e depois; Buffet pago 1000, Audio Pro 200).');
  await context.close();
}

// ======================= MCT-86: tarefas =======================
{
  const {context,page}=await open(founder);
  await page.goto(`${APP}/event/${eventId}/tarefas`);
  const card=name=>page.locator('[data-task-id]').filter({hasText:name});
  await card('Montar palco').waitFor();
  const dialog=page.getByTestId('task-dialog');

  // Clicar no select de status do card NÃO abre o modal.
  await card('Montar palco').getByRole('combobox',{name:/Status de/}).click();
  assert.equal(await dialog.count(),0);await page.keyboard.press('Escape');

  // Clique abre; busca por responsáveis (sem acento e por trecho).
  await card('Montar palco').click({position:{x:10,y:10}});await dialog.waitFor();
  assert.equal(await dialog.getByLabel('Nome da tarefa').inputValue(),'Montar palco');
  await dialog.getByLabel('Descrição').fill('Chegar às 8h. Conferir o som antes.');
  const search=dialog.getByLabel('Buscar responsável');
  await search.fill('joao');
  const options=page.getByRole('option');await options.first().waitFor();
  assert.equal(await options.count(),1);assert.match(await options.first().innerText(),/João Pereira/);
  await options.first().click();
  await search.fill('bea');await page.getByRole('option',{name:/Beatriz Souza/}).click();
  // Não lista legado nem quem já foi escolhido.
  await search.fill('');await search.focus();
  const labels=await page.getByRole('option').allInnerTexts();
  assert.ok(!labels.some(l=>/João|Beatriz|Legado/.test(l)),`opções inesperadas: ${labels}`);
  assert.deepEqual(await dialog.locator('[data-owner-id]').allInnerTexts().then(t=>t.map(x=>x.trim())),['João Pereira','Beatriz Souza']);
  await dialog.getByRole('button',{name:'Salvar'}).click();await dialog.waitFor({state:'detached'});await settle(page);
  let t1=(await current()).document.tasks.find(t=>t.id==='t1');
  assert.deepEqual(t1.ownerIds,[idOf(staff2),idOf(staff)]);assert.equal(t1.description,'Chegar às 8h. Conferir o som antes.');assert.equal(t1.owner,'João Pereira, Beatriz Souza');
  console.log('CA4 PASS: fundador abriu a tarefa pelo clique, buscou "joao" (sem acento) e "bea", escolheu 2 membros reais por ID, salvou; banco tem ownerIds=[João, Beatriz] e a descrição.');

  await page.reload();await card('Montar palco').waitFor();
  assert.match(await card('Montar palco').innerText(),/João Pereira, Beatriz Souza/);
  await card('Montar palco').focus();await page.keyboard.press('Enter');await dialog.waitFor();
  assert.equal(await dialog.getByLabel('Descrição').inputValue(),'Chegar às 8h. Conferir o som antes.');
  assert.equal(await dialog.locator('[data-owner-id]').count(),2);
  await dialog.getByRole('button',{name:'Tirar João Pereira'}).click();
  await dialog.getByRole('button',{name:'Salvar'}).click();await dialog.waitFor({state:'detached'});await settle(page);
  t1=(await current()).document.tasks.find(t=>t.id==='t1');assert.deepEqual(t1.ownerIds,[idOf(staff)]);
  console.log('CA5 PASS: após recarregar, card e modal mostram descrição e responsáveis; Enter abre pelo teclado; remover um responsável e salvar persiste.');

  // Arrastar pelo teclado continua funcionando (lote anterior).
  await card('Conferir crachás').focus();await page.keyboard.press('Space');await page.keyboard.press('ArrowRight');await page.keyboard.press('Space');
  await settle(page);
  await page.waitForTimeout(600);
  assert.equal((await current()).document.tasks.find(t=>t.id==='t2').status,'Em andamento');
  assert.equal(await dialog.count(),0);
  console.log('CA6 PASS: arraste pelo teclado (Espaço, seta, Espaço) ainda muda o status e não abre o modal.');
  await context.close();
}

// ---- Staff: só vê as suas tarefas, não cria e não edita ----
{
  const {context,page}=await open(staff);
  await page.goto(`${APP}/event/${eventId}/tarefas`);
  const cards=page.locator('[data-task-id]');await cards.first().waitFor();
  // Beatriz é responsável de t2 (ownerId) e de t1 (um dos ownerIds); não vê nada além disso.
  assert.equal(await cards.count(),2);
  assert.deepEqual((await cards.evaluateAll(n=>n.map(x=>x.dataset.taskId))).sort(),['t1','t2']);
  assert.equal(await page.getByRole('button',{name:'Adicionar'}).count(),0);
  await page.locator('[data-task-id="t2"]').click({position:{x:10,y:10}});
  const dialog=page.getByTestId('task-dialog');await dialog.waitFor();
  assert.equal(await dialog.getByLabel('Nome da tarefa').isDisabled(),true);assert.equal(await dialog.getByLabel('Descrição').isDisabled(),true);
  assert.equal(await dialog.getByLabel('Buscar responsável').count(),0);assert.equal(await dialog.getByRole('button',{name:'Salvar'}).count(),0);
  assert.equal(await dialog.getByRole('button',{name:/^Tirar /}).count(),0);
  await dialog.getByRole('combobox',{name:'Status da tarefa'}).click();await page.getByRole('option',{name:'Concluído'}).click();
  await page.getByText('Salvo',{exact:true}).waitFor();await page.waitForTimeout(500);
  assert.equal((await current()).document.tasks.find(t=>t.id==='t2').status,'Concluído');
  console.log('CA7 PASS: staff vê só as 2 tarefas em que é responsável (t1 por ownerIds, t2 por ownerId), sem botão Adicionar; o modal vem somente leitura (título/descrição desabilitados, sem busca, sem Salvar) e só o status muda e persiste.');
  await context.close();
}
await browser.close();
console.log('Registros sintéticos locais mantidos; nada de produção foi tocado.');
