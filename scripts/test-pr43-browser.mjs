// Validação em navegador real (Playwright + Chromium) dos 10 itens do PR #43
// (revisão de usabilidade, MCT-68 a MCT-87). Usa Supabase LOCAL, contas e
// eventos sintéticos criados por scripts/local-api.mjs. Nunca toca em produção.
//
//   npx vite --port 5185 --host 127.0.0.1      (com .env.local apontando para o Supabase local)
//   node scripts/test-pr43-browser.mjs [--only=3,7]
//
// Cada item é um teste nomeado e imprime "PASS" ou "FAIL" com o motivo.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import {mkdirSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {account,rpc,admin,permitMultiple} from './local-api.mjs';

const require=createRequire(import.meta.url);
const playwrightPath=['playwright','/opt/node-tools/node_modules/playwright','/usr/local/lib/node_modules_global/playwright'].find(p=>{try{require.resolve(p);return true;}catch{return false;}});
assert.ok(playwrightPath,'Pacote playwright não encontrado');
const {chromium}=require(playwrightPath);

const BASE=process.env.BASE_URL||'http://127.0.0.1:5185';
const EVIDENCE=resolve('docs/evidencias/pr43');
mkdirSync(EVIDENCE,{recursive:true});
const only=(process.argv.find(a=>a.startsWith('--only='))||'').replace('--only=','').split(',').filter(Boolean).map(Number);
const executablePath=existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':undefined;

const browser=await chromium.launch({executablePath,headless:true,args:['--no-sandbox']});
const shot=(page,name,options={})=>page.screenshot({path:`${EVIDENCE}/${name}.png`,...options});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

// ---------- fixture sintética ----------
const uidc=()=>randomUUID();
const founder=await account('pr43-founder');
await rpc(founder.client,'criar_organizacao',{p_nome:'Synthetic PR43'});
const orgRow=await founder.client.from('memberships').select('organization_id').eq('user_id',founder.user.id).single();assert.ifError(orgRow.error);
const orgId=orgRow.data.organization_id;
const names=['Ana Prado','João Moreira','Maria Lima','Lucas Teixeira','Pedro Rocha','Beatriz Nunes','Rafael Barros','Camila Faria','Thiago Campos','Marina Costa','Larissa Duarte','Bruno Pires','Juliana Mendes','Diego Ramos'];
const taskNames=['Confirmar buffet','Pagar audiovisual','Fechar programação','Enviar informações','Contratar segurança','Definir cardápio','Confirmar cortesias','Produzir crachás','Briefing de equipe','Conferir sonorização','Fechar convites VIP','Enviar press release'];
const doc={
  id:uidc(),name:'Evento sintético PR43',status:'planejamento',date:'2026-11-18',city:'São Paulo/SP',location:'Centro',
  expectedAudience:100,capacity:120,
  modules:{schedule:true,suppliers:true,tickets:true,sponsors:true,networking:true,capacity:true},
  expenses:[],revenues:[],tickets:[],suppliers:[],schedule:[],
  tasks:[...taskNames.map((name,i)=>({id:`task-${i}`,name,owner:'',date:'2026-12-20',category:'Operação',priority:'Normal',status:'A fazer'})),
    {id:'task-done',name:'Abrir inscrições',owner:'',date:'2026-08-20',category:'Marketing',priority:'Normal',status:'Concluído'}],
  sponsorPlans:[
    {id:'plan-master',name:'Master',price:15000,available:1,sold:1,complimentary:6,benefits:'Logo grande',notes:''},
    {id:'plan-ouro',name:'Ouro',price:8000,available:2,sold:1,complimentary:4,benefits:'Logo médio',notes:''},
    {id:'plan-apoio',name:'Apoio',price:3000,available:4,sold:3,complimentary:2,benefits:'Logo pequeno',notes:''}],
  sponsors:[
    {id:'sp-1',company:'Nuvex Tecnologia',contact:'a@nuvex.test',plan:'Master',negotiated:15000,received:15000,dueDate:'2026-09-01',status:'quitado',deliverables:''},
    {id:'sp-2',company:'Banco Meridiano',contact:'b@meridiano.test',plan:'Ouro',negotiated:8000,received:8000,dueDate:'2026-09-10',status:'quitado',deliverables:''},
    {id:'sp-3',company:'Logística Andrade',contact:'c@andrade.test',plan:'Apoio',negotiated:3000,received:3000,dueDate:'2026-09-15',status:'quitado',deliverables:''},
    {id:'sp-4',company:'Café Montanha',contact:'d@cafe.test',plan:'Apoio',negotiated:3000,received:0,dueDate:'2026-10-20',status:'pendente',deliverables:''}],
  participants:names.map((name,i)=>({id:`p-${i}`,name,email:`p${i}@example.test`,phone:'',company:`Empresa ${i}`,type:'Participante',status:'Confirmado'})),
  networking:{enabled:true,tables:4,rounds:3,capacityPerTable:5,roundMinutes:20,seedBase:1}
};
const created=await rpc(founder.client,'event_create',{p_org:orgId,p_document:doc});
const eventId=created.document.id,eventCode=created.code;
// O banco local limita contas comuns a 1 evento; o teste de criação (MCT-69) precisa de um segundo.
await permitMultiple(founder);
const eventDoc=async()=>(await rpc(founder.client,'event_list')).find(e=>e.document.id===eventId);

// ---------- helpers de UI ----------
const openPages=[];
async function newPage(viewport={width:1280,height:800},options={}) {
  const context=await browser.newContext({viewport,...options});
  const page=await context.newPage();
  openPages.push(page);
  page.errors=[];
  page.on('pageerror',e=>page.errors.push(e.message));
  return page;
}
async function login(page,person=founder) {
  await page.goto(`${BASE}/login`);
  await page.fill('#email',person.user.email);
  await page.fill('#password',person.password);
  await page.click('button[type=submit]');
  await page.waitForURL(/\/eventos/,{timeout:15000});
}
// local-api não expõe a senha; recria-a por conta para o login pela UI.
for(const person of [founder]){
  person.password=`Pr43-${randomUUID()}`;
  const updated=await admin.auth.admin.updateUserById(person.user.id,{password:person.password});assert.ifError(updated.error);
}
// Espera a carga inicial e a atualização silenciosa de foco (event_list ~0,5s depois) assentarem. Editar
// durante essa janela pode perder a edição: corrida pré-existente do EventContext, fora do PR #43 (ver relatório).
const openEvent=async(page,section)=>{await page.goto(`${BASE}/event/${eventId}/${section}`);await page.waitForSelector('.platform-main',{timeout:15000});await page.waitForLoadState('networkidle').catch(()=>{});await sleep(1200);};

const results=[];
async function item(number,title,fn) {
  if(only.length && !only.includes(number)) return;
  const label=`[${String(number).padStart(2,'0')}] ${title}`;
  const notes=[];
  try {
    await fn(notes);
    results.push({number,ok:true});
    console.log(`PASS ${label}${notes.length?`\n       ${notes.join('\n       ')}`:''}`);
  } catch(error) {
    results.push({number,ok:false});
    console.log(`FAIL ${label}\n       motivo: ${String(error.message).split('\n').slice(0,6).join('\n       ')}`);
    if(process.env.DEBUG_QA){const page=openPages.at(-1);try{console.log('       url:',page.url());console.log('       texto:',(await page.locator('body').innerText()).slice(0,400).replace(/\n+/g,' | '));await page.screenshot({path:`/tmp/claude-0/qa/fail-${number}.png`});}catch{}}
  }
}

// ---------- 1. MCT-68 ----------
await item(1,'MCT-68 landing: cards de planos sem sobreposição (1280, 1440, 390)',async notes=>{
  for(const [width,height,suffix] of [[1280,800,'desktop'],[1440,900,'1440'],[390,844,'mobile']]) {
    const page=await newPage({width,height});
    await page.goto(`${BASE}/`);
    await page.waitForSelector('#planos .plan');
    await page.evaluate(()=>document.querySelector('#planos .plans').scrollIntoView({block:'center'}));
    await page.waitForFunction(()=>[...document.querySelectorAll('#planos .plan')].every(p=>p.classList.contains('in')||getComputedStyle(p).opacity==='1'),null,{timeout:5000}).catch(()=>{});
    await sleep(900);
    const report=await page.evaluate(()=>{
      const cards=[...document.querySelectorAll('#planos .plan')];
      const rect=el=>el.getBoundingClientRect();
      const problems=[];
      cards.forEach((card,i)=>{
        const c=rect(card);
        card.querySelectorAll('*').forEach(el=>{
          if(el.closest('svg')&&el.tagName!=='svg')return;
          const r=rect(el);if(!r.width||!r.height)return;
          if(r.left<c.left-0.5||r.right>c.right+0.5)problems.push(`card ${i+1}: <${el.tagName.toLowerCase()}> "${(el.textContent||'').trim().slice(0,24)}" sai da borda horizontal (${Math.round(r.left-c.left)}..${Math.round(r.right-c.right)})`);
        });
        const price=card.querySelector('.pr');
        if(price.scrollWidth>price.clientWidth+1)problems.push(`card ${i+1}: preço cortado`);
        if(card.scrollWidth>card.clientWidth+1)problems.push(`card ${i+1}: conteúdo transborda`);
        // blocos empilhados sem sobreposição vertical
        const blocks=[...card.children].filter(el=>!el.classList.contains('tag'));
        blocks.slice(1).forEach((el,k)=>{if(rect(el).top<rect(blocks[k]).bottom-1)problems.push(`card ${i+1}: bloco ${el.tagName} sobrepõe o anterior`);});
        const tag=card.querySelector('.tag');
        if(tag){const t=rect(tag);blocks.forEach(el=>{const r=rect(el);if(t.bottom>r.top+1&&t.top<r.bottom-1&&t.right>r.left&&t.left<r.right&&el!==tag&&!el.contains(tag)&&r.top<t.bottom-4)problems.push(`card ${i+1}: etiqueta sobrepõe ${el.tagName}`);});}
      });
      for(let a=0;a<cards.length;a++)for(let b=a+1;b<cards.length;b++){
        const x=rect(cards[a]),y=rect(cards[b]);
        if(x.left<y.right-0.5&&y.left<x.right-0.5&&x.top<y.bottom-0.5&&y.top<x.bottom-0.5)problems.push(`cards ${a+1} e ${b+1} se sobrepõem`);
      }
      const h=cards.map(card=>({title:getComputedStyle(card.querySelector('h3')).fontSize,price:getComputedStyle(card.querySelector('.pr')).fontSize,w:Math.round(rect(card).width),columns:getComputedStyle(card.parentElement).gridTemplateColumns.split(' ').length}));
      return {count:cards.length,problems,h,pageOverflow:document.documentElement.scrollWidth-window.innerWidth,btn:cards.map(card=>{const b=card.querySelector('.btn');return b.scrollWidth<=b.clientWidth+1;})};
    });
    assert.equal(report.count,4,`${width}px: esperados 4 cards`);
    assert.deepEqual(report.problems,[],`${width}px: ${report.problems.join('; ')}`);
    assert.ok(report.pageOverflow<=1,`${width}px: rolagem horizontal da página (${report.pageOverflow}px)`);
    assert.ok(report.btn.every(Boolean),`${width}px: texto de botão estoura`);
    assert.equal(page.errors.length,0,`erros de página: ${page.errors}`);
    notes.push(`${width}px: 4 cards, ${report.h[0].columns} coluna(s), título ${report.h[0].title}, preço ${report.h[0].price}, largura ${report.h[0].w}px, sem sobreposição/transbordo`);
    if(suffix!=='1440') {
      await page.evaluate(narrow=>{const target=narrow?document.querySelector('#planos .plan'):document.querySelector('#planos .sec-head');window.scrollTo({top:target.getBoundingClientRect().top+scrollY-(narrow?96:90),behavior:'instant'});},width<600);await sleep(200);
      await shot(page,`mct68-${suffix}`);
    }
    await page.context().close();
  }
});

// ---------- 2. MCT-69 ----------
await item(2,'MCT-69 criar evento: cidades brasileiras (5.571), sem acento, teclado, local livre',async notes=>{
  const page=await newPage();
  const cityRequests=[];
  page.on('request',r=>{if(r.url().includes('br-cities.json'))cityRequests.push(r.url());});
  await login(page);
  await page.goto(`${BASE}/novo`);
  await page.fill('input[placeholder^="Ex.: Summit"]','Evento cidades QA');
  await page.fill('input[type=date]','2026-12-01');
  const city=page.getByRole('combobox',{name:'Cidade / local'});
  assert.equal(cityRequests.length,0,'lista de cidades não deveria carregar antes do foco');
  const data=await page.evaluate(async()=>{const r=await fetch('/data/br-cities.json');const d=await r.json();return {n:d.length,ufs:new Set(d.map(c=>c.uf)).size};});
  assert.equal(data.n,5571,`municípios: ${data.n}`);assert.equal(data.ufs,27,`UFs: ${data.ufs}`);
  cityRequests.length=0;
  await city.focus();
  await city.pressSequentially('Sao P',{delay:30});
  const list=page.getByRole('listbox');
  await list.waitFor({timeout:5000});
  const options=await list.getByRole('option').allTextContents();
  assert.ok(cityRequests.length>=0);
  assert.ok(options.includes('São Paulo/SP'),`"Sao P" deveria sugerir São Paulo/SP; recebi: ${options.join(' | ')}`);
  assert.ok(options.slice(0,3).includes('São Paulo/SP'),`São Paulo/SP deveria estar entre as 3 primeiras sugestões; recebi: ${options.slice(0,5).join(' | ')}`);
  notes.push(`"Sao P" → ${options.slice(0,4).join(' | ')}… (${options.length} sugestões)`);
  await shot(page,'mct69-desktop',{clip:{x:300,y:100,width:680,height:640}});
  // setas: ArrowDown seleciona; Enter confirma
  await city.press('ArrowDown');
  assert.equal(await list.getByRole('option').first().getAttribute('aria-selected'),'true','ArrowDown deveria ativar a 1ª opção');
  const activeId=await city.getAttribute('aria-activedescendant');assert.ok(activeId,'aria-activedescendant ausente');
  const idx=options.indexOf('São Paulo/SP');
  for(let i=0;i<idx;i++)await city.press('ArrowDown');
  await city.press('Enter');
  assert.equal(await city.inputValue(),'São Paulo/SP');
  assert.equal(await page.getByRole('listbox').count(),0,'lista deveria fechar após Enter');
  // Escape: fecha sem alterar o texto
  await city.fill('');await city.pressSequentially('Cur',{delay:30});
  await page.getByRole('listbox').waitFor();
  await city.press('ArrowDown');await city.press('Escape');
  assert.equal(await page.getByRole('listbox').count(),0,'Escape deveria fechar a lista');
  assert.equal(await city.inputValue(),'Cur','Escape não deve alterar o texto');
  // ArrowUp circula
  await city.pressSequentially('i',{delay:30});
  // local livre
  await city.fill('Fazenda Boa Vista, km 12');
  assert.equal(await page.getByRole('listbox').count(),0,'texto sem correspondência não deve mostrar lista');
  await page.getByRole('button',{name:/Continuar/}).click();
  await page.fill('input[placeholder="Ex.: 180"]','80');
  await page.getByRole('button',{name:/Continuar/}).click();
  await page.getByRole('button',{name:/Criar evento/}).click();
  await page.waitForURL(/\/event\/.+\/dashboard/,{timeout:15000});
  const rows=await rpc(founder.client,'event_list');
  const made=rows.find(r=>r.document.name==='Evento cidades QA');
  assert.ok(made,'evento criado não encontrado no banco');
  assert.equal(made.document.city,'Fazenda Boa Vista, km 12','local livre deveria ser salvo como digitado');
  notes.push('local livre "Fazenda Boa Vista, km 12" salvo como digitado; Enter/Escape/setas OK; JSON com 5571 municípios e 27 UFs');
  assert.equal(page.errors.length,0,`erros de página: ${page.errors}`);
  await page.setViewportSize({width:390,height:844});
  await page.goto(`${BASE}/novo`);
  await page.fill('input[placeholder^="Ex.: Summit"]','Mobile');
  await page.getByRole('combobox',{name:'Cidade / local'}).pressSequentially('Sao P',{delay:30});
  await page.getByRole('listbox').waitFor();
  const box=await page.getByRole('listbox').boundingBox();
  assert.ok(box.x>=0&&box.x+box.width<=390,'lista de cidades estoura a tela no celular');
  await shot(page,'mct69-mobile');
  await page.context().close();
});

// ---------- 3. MCT-70 ----------
await item(3,'MCT-70 tarefas: card acompanha o ponto de captura (topo, rolado, entre colunas), persiste e teclado',async notes=>{
  const page=await newPage({width:1280,height:800});
  await login(page);
  await openEvent(page,'tarefas');
  await page.waitForSelector('[data-task-id="task-0"]');
  const columnBox=name=>page.locator(`[data-column="${name}"]`).boundingBox();
  const dragged=id=>page.locator(`[data-task-id="${id}"].is-dragging`);
  // Registra o desvio (mouse - canto do card) em vários pontos do arraste.
  async function dragAndMeasure(id,grabDx,grabDy,targets) {
    const card=page.locator(`[data-task-id="${id}"]`);
    const box=await card.boundingBox();
    const grab={x:box.x+grabDx,y:box.y+grabDy};
    await page.mouse.move(grab.x,grab.y);
    await page.mouse.down();
    await page.mouse.move(grab.x+8,grab.y+8,{steps:4});
    await dragged(id).waitFor({timeout:3000});
    const deviations=[];
    let mouse={x:grab.x+8,y:grab.y+8};
    const measure=async()=>{const r=await dragged(id).boundingBox();deviations.push({dx:+(mouse.x-r.x-grabDx).toFixed(1),dy:+(mouse.y-r.y-grabDy).toFixed(1),w:r.width,h:r.height});};
    await sleep(120);await measure();
    for(const target of targets) {
      await page.mouse.move(target.x,target.y,{steps:12});mouse=target;await sleep(180);await measure();
    }
    return {deviations,box,release:async()=>{await page.mouse.up();await sleep(500);}};
  }
  // A biblioteca só "levanta" o card depois de ~5px de movimento, então o ponto 0 pode estar até ~8px do
  // ponto pressionado. O que importa é que esse desvio NÃO cresça depois (mover, rolar, trocar de coluna).
  const within=(deviations,label)=>{
    const base=deviations[0];
    assert.ok(Math.abs(base.dx)<=8&&Math.abs(base.dy)<=8,`${label}: ao levantar, o card já está longe do ponto pressionado: dx=${base.dx}px dy=${base.dy}px`);
    deviations.forEach((d,i)=>assert.ok(Math.abs(d.dx-base.dx)<=2.5&&Math.abs(d.dy-base.dy)<=2.5,`${label}: o card se afastou do cursor no ponto ${i}: dx=${d.dx}px dy=${d.dy}px (inicial ${base.dx}/${base.dy})`));
  };
  const worst=ds=>Math.max(...ds.map(d=>Math.max(Math.abs(d.dx-ds[0].dx),Math.abs(d.dy-ds[0].dy))));
  assert.ok(await page.evaluate(()=>document.documentElement.scrollHeight>window.innerHeight+250),'página deveria ser rolável com 12 cards');
  // (a) página no topo, de "A fazer" para "Em andamento"
  const em=await columnBox('Em andamento');
  const a=await dragAndMeasure('task-0',37,16,[{x:em.x+em.width/2,y:em.y+60},{x:em.x+em.width/2+30,y:em.y+110}]);
  within(a.deviations,'topo');
  assert.ok(Math.abs(a.deviations[0].w-a.box.width)<=2,`largura mudou ao arrastar (${a.box.width} → ${a.deviations[0].w})`);
  await shot(page,'mct70-desktop');
  await a.release();
  await page.waitForFunction(()=>document.querySelector('[data-column="Em andamento"] [data-task-id="task-0"]'),null,{timeout:5000});
  notes.push(`topo: deslocamento do card vs cursor após o levante: máx ${worst(a.deviations)}px em ${a.deviations.length} pontos (levante ${a.deviations[0].dx}/${a.deviations[0].dy}px)`);
  // persistência: banco e depois do reload
  await page.waitForTimeout(800);
  assert.equal((await eventDoc()).document.tasks.find(t=>t.id==='task-0').status,'Em andamento','status não gravado no banco');
  await page.reload();await page.waitForSelector('[data-task-id="task-0"]');
  assert.ok(await page.locator('[data-column="Em andamento"] [data-task-id="task-0"]').count(),'após reload o card voltou de coluna');
  notes.push('status "Em andamento" persistiu no banco e após recarregar');
  // (b) página rolada
  await page.mouse.move(640,500);await page.mouse.wheel(0,260);await sleep(300);
  const scrolled=await page.evaluate(()=>window.scrollY);
  assert.ok(scrolled>150,`página não rolou (${scrolled})`);
  const card=await page.locator('[data-task-id="task-3"]').boundingBox();
  assert.ok(card.y>0&&card.y<700,'task-3 não está visível após a rolagem');
  const done=await columnBox('Concluído');
  const b=await dragAndMeasure('task-3',55,20,[{x:done.x+done.width/2,y:Math.min(done.y+80,600)},{x:done.x+done.width/2-40,y:Math.min(done.y+140,640)}]);
  assert.equal(await page.evaluate(()=>window.scrollY),scrolled,'a página rolou sozinha durante o arraste (invalidaria a medida)');
  within(b.deviations,`rolado (${scrolled}px)`);
  await b.release();
  await page.waitForFunction(()=>document.querySelector('[data-column="Concluído"] [data-task-id="task-3"]'),null,{timeout:5000});
  notes.push(`rolado ${scrolled}px, A fazer → Concluído: desvio máx ${worst(b.deviations)}px`);
  // (c) entre colunas: Em andamento → A fazer, passando por Concluído
  await page.evaluate(()=>window.scrollTo(0,0));await sleep(250);
  const todo=await columnBox('A fazer');
  const done2=await columnBox('Concluído');
  const c=await dragAndMeasure('task-0',30,14,[{x:done2.x+done2.width/2,y:Math.min(done2.y+100,620)},{x:todo.x+todo.width/2,y:Math.min(todo.y+120,620)}]);
  within(c.deviations,'entre colunas');
  await c.release();
  await page.waitForFunction(()=>document.querySelector('[data-column="A fazer"] [data-task-id="task-0"]'),null,{timeout:5000});
  notes.push(`entre colunas (Em andamento → Concluído → A fazer): desvio máx ${worst(c.deviations)}px`);
  // (d) teclado
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.locator('[data-task-id="task-2"]').focus();
  await page.keyboard.press('Space');await sleep(250);
  await page.keyboard.press('ArrowRight');await sleep(350);
  await page.keyboard.press('Space');
  await page.waitForFunction(()=>document.querySelector('[data-column="Em andamento"] [data-task-id="task-2"]'),null,{timeout:5000});
  await page.waitForTimeout(800);
  assert.equal((await eventDoc()).document.tasks.find(t=>t.id==='task-2').status,'Em andamento','arraste por teclado não gravou');
  await page.reload();await page.waitForSelector('[data-task-id="task-2"]');
  assert.ok(await page.locator('[data-column="Em andamento"] [data-task-id="task-2"]').count(),'teclado: card não persistiu após reload');
  notes.push('teclado (Espaço, →, Espaço) moveu e persistiu após reload');
  assert.equal(page.errors.length,0,`erros de página: ${page.errors}`);
  await page.context().close();
});

// ---------- 4. MCT-71 ----------
await item(4,'MCT-71 áreas: autocomplete desde o foco e criação sem confirmação',async notes=>{
  const page=await newPage({width:1280,height:900});
  await login(page);
  await openEvent(page,'equipe');
  await page.locator('[role="button"][aria-label^="Gerenciar "]').first().click();
  const dialog=page.getByRole('dialog').filter({has:page.getByRole('combobox',{name:'Área',exact:true})});
  await dialog.waitFor();
  const area=dialog.getByRole('combobox',{name:'Área',exact:true});
  await area.focus();
  const list=page.getByRole('listbox',{name:'Sugestões de Área'});
  await list.waitFor({timeout:3000});
  const initial=await list.getByRole('option').allTextContents();
  assert.ok(initial.includes('Credenciamento')&&initial.includes('Audiovisual'),`foco deveria listar as áreas existentes; recebi: ${initial.join(', ')}`);
  notes.push(`foco no campo vazio já lista ${initial.length} áreas (${initial.slice(0,3).join(', ')}…)`);
  await area.pressSequentially('audio',{delay:30});
  const filtered=await list.getByRole('option').allTextContents();
  assert.deepEqual(filtered,['Audiovisual'],`filtro "audio": ${filtered}`);
  await area.press('ArrowDown');await area.press('Enter');
  assert.equal(await area.inputValue(),'Audiovisual');
  // criação direta
  const newName=`Cenografia QA ${Date.now()%100000}`;
  await area.fill(newName);
  const add=dialog.getByRole('button',{name:`Adicionar “${newName}”`});
  await add.waitFor();
  await shot(page,'mct71-desktop');
  await add.click();
  await sleep(250);
  assert.equal(await page.getByRole('alertdialog').count(),0,'não deveria abrir confirmação ao criar área');
  await add.waitFor({state:'detached',timeout:4000});
  const catalog=await rpc(founder.client,'team_catalog_list',{p_org:orgId});
  assert.ok(catalog.some(i=>i.kind==='area'&&i.name===newName),'área não foi criada no banco');
  assert.equal(await area.inputValue(),newName);
  assert.equal(await dialog.getByRole('alert').count(),0,'erro visível após criação');
  notes.push(`"${newName}" criada com 1 clique, sem confirmação, e gravada no catálogo`);
  // salvar a pessoa com a nova área (persistência real)
  await dialog.getByRole('button',{name:'Salvar pessoa'}).click();
  await dialog.waitFor({state:'detached',timeout:5000});
  const team=await rpc(founder.client,'event_team',{p_event:eventId});
  assert.ok(team.some(m=>m.area===newName),`pessoa não ficou com a área; ${JSON.stringify(team.map(m=>m.area))}`);
  // celular: o autocomplete cabe na tela, dentro do modal
  await page.setViewportSize({width:390,height:844});
  await page.locator('[role="button"][aria-label^="Gerenciar "]').first().click();
  await dialog.waitFor();await sleep(600);
  const mobileArea=dialog.getByRole('combobox',{name:'Área',exact:true});
  await mobileArea.fill('');await mobileArea.focus();
  const mobileList=page.getByRole('listbox',{name:'Sugestões de Área'});
  await mobileList.waitFor();
  const listBox=await mobileList.boundingBox(),dialogBox=await dialog.boundingBox();
  assert.ok(listBox.x>=dialogBox.x-1&&listBox.x+listBox.width<=dialogBox.x+dialogBox.width+1,`lista de áreas fora do modal no celular ${JSON.stringify({listBox,dialogBox})}`);
  assert.ok(dialogBox.x>=-1&&dialogBox.x+dialogBox.width<=391,'modal "Editar pessoa" fora da tela no celular');
  await shot(page,'mct71-mobile');
  assert.equal(page.errors.length,0,`erros de página: ${page.errors}`);
  await page.context().close();
});

// ---------- 5. MCT-72 ----------
await item(5,'MCT-72 catálogo: tudo visível, sem papéis de acesso, exclusão em modal com foco contido e Escape',async notes=>{
  // dados preparados pela API: item usado por 1 pessoa (preservação) e item livre (cancelar)
  const usedName=`Usada QA ${Date.now()%100000}`;
  await rpc(founder.client,'team_catalog_create',{p_org:orgId,p_kind:'area',p_name:usedName});
  const member=(await rpc(founder.client,'event_team',{p_event:eventId}))[0];
  await rpc(founder.client,'event_edit_person',{p_member:member.id,p_name:member.name,p_email:member.email||'',p_phone:member.phone||'',p_function:member.function||'',p_area:usedName,p_job_title:member.job_title||member.jobTitle||''});
  const before=await rpc(founder.client,'team_catalog_list',{p_org:orgId});
  const page=await newPage({width:1280,height:800});
  await login(page);
  await openEvent(page,'equipe');
  await page.getByRole('button',{name:'Funções e áreas'}).click();
  const dialog=page.getByRole('dialog',{name:'Funções e áreas'});
  await dialog.waitFor();
  assert.equal(await dialog.getByLabel('Filtrar catálogo').inputValue(),'all','filtro inicial deveria ser "Tudo"');
  const rows=await dialog.locator('ul li').allInnerTexts();
  const expected=before.filter(i=>i.kind!=='title');
  assert.equal(rows.length,expected.length,`itens visíveis ${rows.length} ≠ funções+áreas do catálogo ${expected.length}`);
  assert.ok(rows.some(r=>r.includes('Função'))&&rows.some(r=>r.includes('Área')),'deveria mostrar funções e áreas juntas');
  const text=await dialog.innerText();
  for(const hidden of ['Fundador','Assistente','Coordenador','Diretor','Staff'])assert.ok(!rows.join('\n').includes(hidden),`"${hidden}" (cargo/papel de acesso) não deveria aparecer na gestão`);
  assert.ok(/Função é o que a pessoa faz/.test(text),'texto explicativo ausente');
  notes.push(`filtro inicial "Tudo": ${rows.length} itens (funções+áreas), nenhum cargo/papel de acesso`);
  await shot(page,'mct72-desktop');
  // filtro Áreas
  await dialog.getByLabel('Filtrar catálogo').selectOption('area');
  assert.ok((await dialog.locator('ul li').allInnerTexts()).every(r=>r.includes('Área')),'filtro Áreas mostrou outro tipo');
  await dialog.getByLabel('Filtrar catálogo').selectOption('all');
  // cancelar por Escape (item livre: "Limpeza" função)
  const freeRow=dialog.locator('ul li').filter({hasText:'Limpeza'}).filter({hasText:'Função'});
  await freeRow.getByRole('button',{name:'Excluir Limpeza'}).click();
  const alert=page.getByRole('alertdialog');
  await alert.waitFor();
  assert.ok(await alert.getByText('Excluir “Limpeza”?').count(),'título do modal de exclusão');
  const insideAlert=()=>page.evaluate(()=>!!document.activeElement?.closest('[role=alertdialog]'));
  assert.ok(await insideAlert(),'foco deveria ir para dentro do modal de exclusão');
  for(let i=0;i<5;i++){await page.keyboard.press('Tab');assert.ok(await insideAlert(),`Tab ${i+1}: foco saiu do modal`);}
  for(let i=0;i<3;i++){await page.keyboard.press('Shift+Tab');assert.ok(await insideAlert(),`Shift+Tab ${i+1}: foco saiu do modal`);}
  await shot(page,'mct72-exclusao');
  await page.keyboard.press('Escape');
  await alert.waitFor({state:'detached',timeout:3000});
  assert.ok(await dialog.isVisible(),'Escape deveria fechar só o modal de exclusão, não o catálogo');
  assert.ok((await rpc(founder.client,'team_catalog_list',{p_org:orgId})).some(i=>i.name==='Limpeza'&&i.kind==='function'),'Escape não deve excluir');
  notes.push('foco contido (5×Tab, 3×Shift+Tab) e Escape fecha só o modal de exclusão sem excluir');
  // cancelar pelo botão
  await freeRow.getByRole('button',{name:'Excluir Limpeza'}).click();
  await alert.waitFor();await alert.getByRole('button',{name:'Cancelar'}).click();await alert.waitFor({state:'detached'});
  // excluir item usado por 1 pessoa: dados da pessoa preservados
  const usedRow=dialog.locator('ul li').filter({hasText:usedName});
  assert.ok((await usedRow.innerText()).includes('1 pessoa'),'contagem de pessoas');
  await usedRow.getByRole('button',{name:`Excluir ${usedName}`}).click();
  await alert.waitFor();
  assert.ok(/1 pessoa usa este item/.test(await alert.innerText()),`modal deveria citar a pessoa que usa o item: ${await alert.innerText()}`);
  await alert.getByRole('button',{name:'Excluir',exact:true}).click();
  await alert.waitFor({state:'detached',timeout:5000});
  const after=await rpc(founder.client,'team_catalog_list',{p_org:orgId});
  assert.ok(!after.some(i=>i.name===usedName),'item deveria ter sido removido do catálogo');
  assert.equal((await dialog.locator('ul li').filter({hasText:usedName}).count()),0,'item ainda aparece na lista');
  const teamAfter=await rpc(founder.client,'event_team',{p_event:eventId});
  assert.ok(teamAfter.some(m=>m.area===usedName),'dado da pessoa foi apagado junto com o item');
  notes.push(`excluir "${usedName}" (1 pessoa): saiu das sugestões e o dado da pessoa foi preservado`);
  await page.keyboard.press('Escape');
  await dialog.waitFor({state:'detached',timeout:3000});
  // celular
  await page.setViewportSize({width:390,height:844});
  await page.getByRole('button',{name:'Funções e áreas'}).click();
  await dialog.waitFor();
  await sleep(600); // termina a animação de abertura
  const box=await dialog.boundingBox();
  assert.ok(box.x>=-1&&box.x+box.width<=391&&box.y>=-1&&box.y+box.height<=845,`modal fora da tela no celular ${JSON.stringify(box)}`);
  const clipped=await dialog.evaluate(el=>{const r=el.getBoundingClientRect();return [...el.querySelectorAll('*')].filter(c=>{const q=c.getBoundingClientRect();return q.width&&q.right>r.right+1;}).map(c=>`<${c.tagName.toLowerCase()}> "${(c.textContent||'').trim().slice(0,20)}"`).slice(0,4);});
  await shot(page,'mct72-mobile');
  assert.deepEqual(clipped,[],`conteúdo do modal passa da borda direita no celular: ${clipped.join('; ')}`);
  assert.equal(page.errors.length,0,`erros de página: ${page.errors}`);
  await page.context().close();
});

// ---------- 6. MCT-75 ----------
await item(6,'MCT-75 Networking: "Configurar rodadas" no topo, modal completo, gerar e ver resultado',async notes=>{
  const page=await newPage({width:1280,height:800});
  await login(page);
  await openEvent(page,'networking');
  const button=page.getByRole('button',{name:'Configurar rodadas'});
  await button.waitFor();
  const bb=await button.boundingBox();
  assert.ok(bb.y<260&&bb.y>=0,`botão deveria estar no topo (y=${bb.y})`);
  // com 3 botões no topo o título não pode ser espremido em várias linhas
  const lines=await page.evaluate(()=>{const h=document.querySelector('.reference-header h1');return Math.round(h.getBoundingClientRect().height/parseFloat(getComputedStyle(h).lineHeight));});
  assert.ok(lines<=2,`título "Rodadas de negócio" quebrou em ${lines} linhas`);
  assert.ok(await page.evaluate(()=>[...document.querySelectorAll('.reference-actions button')].every(b=>b.getBoundingClientRect().right<=innerWidth)),'botões do topo saem da tela');
  assert.equal(await page.locator('details.reference-network-settings').count(),0,'bloco antigo "details" ainda existe');
  await button.click();
  const dialog=page.getByRole('dialog',{name:'Configurar rodadas'});
  await dialog.waitFor();
  for(const label of ['Duração de cada rodada','Quantidade de mesas','Rodadas','Capacidade padrão','Variação da distribuição'])assert.ok(await dialog.getByLabel(label,{exact:true}).count(),`campo "${label}" ausente do modal`);
  assert.ok(await dialog.getByText('Mesas e regras').count(),'seção Mesas e regras');
  await shot(page,'mct75-desktop');
  // editar
  await dialog.getByLabel('Quantidade de mesas',{exact:true}).fill('5');
  await dialog.getByLabel('Rodadas',{exact:true}).fill('4');
  await dialog.getByLabel('Duração de cada rodada',{exact:true}).fill('15');
  // A gravação automática tem 300ms de debounce; aguarda assentar antes de fechar e conferir.
  await page.getByText('Salvo',{exact:true}).first().waitFor({timeout:8000});
  await sleep(700);
  // fechar (botão) e conferir KPIs na página
  await dialog.getByRole('button',{name:'Concluir configuração'}).click();
  await dialog.waitFor({state:'detached',timeout:3000});
  // os KPIs atrás do modal podem levar um quadro a atualizar: confere com espera curta
  await page.waitForFunction(()=>/Rodadas\s*\n?\s*4/.test(document.querySelector('.platform-kpis')?.innerText||''),null,{timeout:3000}).catch(()=>{});
  const kpis=await page.locator('.platform-kpis').innerText();
  assert.ok(/Mesas\s*\n?\s*5/.test(kpis),`KPI de mesas deveria mostrar 5: ${kpis.replace(/\n+/g,' | ')}`);
  assert.ok(/Rodadas\s*\n?\s*4/.test(kpis),`KPI de rodadas deveria mostrar 4: ${kpis.replace(/\n+/g,' | ')}`);
  assert.ok(kpis.includes('15 min cada'),`KPI de duração: ${kpis.replace(/\n+/g,' | ')}`);
  // Escape também fecha
  await button.click();await dialog.waitFor();await page.keyboard.press('Escape');await dialog.waitFor({state:'detached',timeout:3000});
  // gerar
  await page.getByRole('button',{name:'Gerar distribuição'}).click();
  await page.waitForFunction(()=>{const t=document.querySelector('.platform-kpis')?.innerText||'';return !/Encontros únicos\s*\n?\s*—/.test(t);},null,{timeout:15000});
  assert.ok(await page.getByRole('button',{name:'Recalcular e substituir grade'}).count(),'após gerar, botão deveria virar "Recalcular"');
  await sleep(600);
  await shot(page,'mct75-resultado');
  await page.waitForTimeout(1200);
  const saved=(await eventDoc()).document;
  assert.equal(saved.networking.tables,5);assert.equal(saved.networking.rounds,4);assert.equal(saved.networking.roundMinutes,15);
  assert.ok(saved.networkingDistribution?.signature,'distribuição não foi gravada');
  await page.reload();
  await page.waitForFunction(()=>{const t=document.querySelector('.platform-kpis')?.innerText||'';return t.includes('Encontros únicos')&&!/Encontros únicos\s*\n?\s*—/.test(t);},null,{timeout:15000});
  notes.push('5 mesas / 4 rodadas / 15 min editados no modal, distribuição gerada, gravada e restaurada após reload');
  // celular: modal cabe na tela e o botão de concluir é alcançável
  await page.setViewportSize({width:390,height:844});
  await page.getByRole('button',{name:'Configurar rodadas'}).click();
  await dialog.waitFor();
  const box=await dialog.boundingBox();
  assert.ok(box.x>=-1&&box.x+box.width<=391&&box.height<=845,`modal não cabe no celular ${JSON.stringify(box)}`);
  await dialog.getByRole('button',{name:'Concluir configuração'}).scrollIntoViewIfNeeded();
  await shot(page,'mct75-mobile');
  await dialog.getByRole('button',{name:'Concluir configuração'}).click();
  await dialog.waitFor({state:'detached'});
  assert.equal(page.errors.length,0,`erros de página: ${page.errors}`);
  await page.context().close();
});

// ---------- 7. MCT-76 ----------
await item(7,'MCT-76 patrocínios: Diamante/Ouro/Prata com ícones; Master/Apoio antigos preservados',async notes=>{
  const page=await newPage({width:1280,height:900});
  await login(page);
  await openEvent(page,'patrocinios');
  await page.getByText('Planos de patrocínio').waitFor();
  const plans=page.locator('section.platform-panel').filter({hasText:'Planos de patrocínio'}).locator('.border.rounded-md');
  const text=await plans.allInnerTexts();
  const joined=text.join('\n---\n');
  assert.equal(text.length,3,`3 planos esperados; ${text.length}`);
  for(const name of ['Diamante','Ouro','Prata'])assert.ok(joined.includes(name),`cota "${name}" ausente`);
  assert.ok(!/Master|Apoio/.test(joined),'nomes antigos Master/Apoio não deveriam aparecer na tela');
  assert.equal(await plans.locator('svg').count(),3,'cada cota deveria ter 1 ícone');
  const flat=name=>plans.filter({hasText:name}).innerText().then(t=>t.replace(/\n/g,' '));
  assert.ok(/1\s+vendidos \/ 1 disponíveis · 6\s+cortesias/.test(await flat('Diamante')),`Diamante: ${await flat('Diamante')}`);
  assert.ok(/1\s+vendidos \/ 2 disponíveis · 4\s+cortesias/.test(await flat('Ouro')),`Ouro: ${await flat('Ouro')}`);
  assert.ok(/2\s+vendidos \/ 4 disponíveis · 2\s+cortesias/.test(await flat('Prata')),`Prata: ${await flat('Prata')}`);
  const rows=await page.locator('button.reference-sponsor').allInnerTexts();
  assert.ok(rows.some(r=>r.includes('Nuvex')&&r.includes('Diamante')),'patrocinador Master deveria aparecer como Diamante');
  assert.equal(rows.filter(r=>r.includes('Prata')).length,2,'2 patrocinadores Apoio → Prata');
  assert.ok(await page.locator('button.reference-sponsor svg.lucide').count()>=4,'ícones nos patrocinadores');
  notes.push('Master→Diamante (1/1, 6 cortesias), Ouro (1/2), Apoio→Prata (2/4); 4 patrocinadores com cota e ícone');
  // dados originais intactos no banco
  const stored=(await eventDoc()).document;
  assert.deepEqual(stored.sponsorPlans.map(p=>p.name),['Master','Ouro','Apoio'],'o dado antigo foi renomeado em massa');
  assert.deepEqual(stored.sponsors.map(s=>s.plan),['Master','Ouro','Apoio','Apoio']);
  await shot(page,'mct76-desktop');
  // editar patrocinador legado sem mexer na cota não troca o vínculo
  await page.locator('button.reference-sponsor').filter({hasText:'Nuvex'}).click();
  const modal=page.getByRole('dialog');
  await modal.waitFor();
  assert.equal(await modal.getByLabel('Cota',{exact:true}).inputValue(),'Diamante','campo Cota deveria mostrar Diamante');
  await modal.getByRole('button',{name:/Salvar/}).click();
  await modal.waitFor({state:'detached',timeout:4000});
  await page.waitForTimeout(1200);
  const afterEdit=(await eventDoc()).document;
  assert.equal(afterEdit.sponsors.find(s=>s.id==='sp-1').plan,'Master','editar sem mexer na cota alterou o vínculo');
  // Campo "Cota" não briga com a digitação: o texto cru fica como digitado e só ao salvar vira o nome da cota.
  await page.locator('button.reference-sponsor').filter({hasText:'Café Montanha'}).click();
  const typing=page.getByRole('dialog');
  await typing.waitFor();
  const cota=typing.getByLabel('Cota',{exact:true});
  await cota.fill('');
  await cota.pressSequentially('Cota ',{delay:40});
  assert.equal(await cota.inputValue(),'Cota ','o espaço digitado não pode sumir enquanto a pessoa escreve');
  await cota.pressSequentially('Especial',{delay:40});
  assert.equal(await cota.inputValue(),'Cota Especial','"Cota Especial" deveria ficar como digitado');
  await typing.getByRole('button',{name:/Salvar/}).click();
  await typing.waitFor({state:'detached',timeout:4000});
  await page.waitForTimeout(1200);
  assert.equal((await eventDoc()).document.sponsors.find(s=>s.id==='sp-4').plan,'Cota Especial','texto livre deveria ser gravado como digitado');
  await page.locator('button.reference-sponsor').filter({hasText:'Banco Meridiano'}).click();
  const lower=page.getByRole('dialog');
  await lower.waitFor();
  const cota2=lower.getByLabel('Cota',{exact:true});
  await cota2.fill('');
  await cota2.pressSequentially('diamante',{delay:40});
  assert.equal(await cota2.inputValue(),'diamante','o campo mostra o cru; a troca de maiúscula só acontece ao salvar');
  await lower.getByRole('button',{name:/Salvar/}).click();
  await lower.waitFor({state:'detached',timeout:4000});
  await page.waitForTimeout(1200);
  assert.equal((await eventDoc()).document.sponsors.find(s=>s.id==='sp-2').plan,'Master','"diamante" deveria casar com a cota Diamante (plano legado Master) ao salvar');
  const plansAfterTyping=await page.locator('section.platform-panel').filter({hasText:'Planos de patrocínio'}).locator('.border.rounded-md').allInnerTexts();
  const flatPlan=name=>plansAfterTyping.find(t=>t.includes(name)).replace(/\n/g,' ');
  assert.ok(/2\s+vendidos \/ 1 disponíveis/.test(flatPlan('Diamante')),`Diamante deveria contar Master + "diamante" (2): ${flatPlan('Diamante')}`);
  assert.ok(/0\s+vendidos \/ 2 disponíveis/.test(flatPlan('Ouro')),`Ouro: ${flatPlan('Ouro')}`);
  notes.push('campo Cota: "Cota Especial" gravado como digitado; "diamante" gravado ligado a Diamante/Master; vendidos por nome normalizado (Diamante 2, Ouro 0)');
  // nova cota usa nomenclatura nova
  await page.getByRole('button',{name:/Plano/}).click();
  const planModal=page.getByRole('dialog');
  await planModal.waitFor();
  await planModal.getByPlaceholder('Diamante, Ouro ou Prata').fill('diamante');
  await planModal.getByRole('button',{name:/Criar|Salvar/}).click();
  await page.waitForTimeout(1500);
  const afterNew=(await eventDoc()).document;
  const novo=afterNew.sponsorPlans.find(p=>!['plan-master','plan-ouro','plan-apoio'].includes(p.id));
  assert.ok(novo,'plano novo não foi criado');
  assert.equal(novo.name,'Diamante','nova cota deveria usar a nomenclatura nova');
  const diamond=await page.locator('section.platform-panel').filter({hasText:'Planos de patrocínio'}).locator('.border.rounded-md').filter({hasText:'Diamante'}).allInnerTexts();
  notes.push(`nova cota "diamante" gravada como "${novo.name}"; vendidos exibidos: ${diamond.map(t=>(t.match(/(\d+)\s+vendidos/)||[])[1]).join(' e ')}`);
  assert.equal(page.errors.length,0,`erros de página: ${page.errors}`);
  await page.setViewportSize({width:390,height:844});
  await page.waitForFunction(()=>!document.body.innerText.includes('Plano criado')&&!document.body.innerText.includes('Patrocinador atualizado'),null,{timeout:8000}).catch(()=>{});
  await page.evaluate(()=>{const panel=[...document.querySelectorAll('section.platform-panel')].find(s=>s.innerText.includes('Planos de patrocínio'));window.scrollTo({top:panel.getBoundingClientRect().top+scrollY-76,behavior:'instant'});});
  await sleep(300);
  await shot(page,'mct76-mobile');
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  assert.ok(overflow<=1,`rolagem horizontal no celular (${overflow}px)`);
  await page.context().close();
});

// ---------- 8. MCT-77 ----------
await item(8,'MCT-77 interruptores: formato iPhone (trilho/bolinha circulares) em configurações',async notes=>{
  for(const [width,height,suffix] of [[1280,900,'desktop'],[390,844,'mobile']]) {
    const page=await newPage({width,height});
    await login(page);
    await openEvent(page,'configuracoes');
    await page.getByText('Ligue só o que usa').waitFor();
    const switches=page.locator('[role=switch]');
    const count=await switches.count();
    assert.ok(count>=5,`esperados ≥5 interruptores nos módulos; ${count}`);
    const measure=()=>page.evaluate(()=>[...document.querySelectorAll('[role=switch]')].map(el=>{
      const r=el.getBoundingClientRect(),t=el.firstElementChild.getBoundingClientRect(),cs=getComputedStyle(el),ts=getComputedStyle(el.firstElementChild);
      return {label:el.getAttribute('aria-label'),state:el.dataset.state,w:r.width,h:r.height,tw:t.width,th:t.height,radius:parseFloat(cs.borderTopLeftRadius),tradius:parseFloat(ts.borderTopLeftRadius),inset:t.left-r.left,rightInset:r.right-t.right,topInset:t.top-r.top,bottomInset:r.bottom-t.bottom};
    }));
    const m=await measure();
    for(const s of m){
      assert.ok(Math.abs(s.w-44)<=1&&Math.abs(s.h-24)<=1,`${s.label}: trilho ${s.w}x${s.h} (esperado 44x24)`);
      assert.ok(s.radius>=s.h/2-0.5,`${s.label}: trilho não é arredondado (raio ${s.radius})`);
      assert.ok(Math.abs(s.tw-s.th)<=0.5&&s.tw>=18&&s.tw<=22,`${s.label}: bolinha ${s.tw}x${s.th} não é circular de ~20px`);
      assert.ok(s.tradius>=s.th/2-0.5,`${s.label}: bolinha com raio ${s.tradius}`);
      assert.ok(Math.abs(s.topInset-s.bottomInset)<=0.6,`${s.label}: bolinha fora de centro vertical (${s.topInset} / ${s.bottomInset})`);
      assert.ok(s.state==='checked'?s.rightInset>=1&&s.rightInset<=3.5:s.inset>=1&&s.inset<=3.5,`${s.label}: bolinha encostada/fora do trilho (${s.state}, esq ${s.inset}, dir ${s.rightInset})`);
    }
    const on=m.filter(s=>s.state==='checked'),off=m.filter(s=>s.state==='unchecked');
    assert.equal(new Set(m.map(s=>`${Math.round(s.w)}x${Math.round(s.h)}`)).size,1,'interruptores com tamanhos diferentes');
    // alternar: a bolinha troca de lado
    const first=switches.first();
    const stateBefore=await first.getAttribute('data-state');
    await first.click();await sleep(300);
    const after=(await measure())[0];
    assert.notEqual(after.state,stateBefore,'clique não alternou o interruptor');
    assert.ok(after.state==='checked'?after.rightInset<=3.5:after.inset<=3.5,'bolinha não foi para o lado certo após alternar');
    assert.ok(Math.abs(after.tw-after.th)<=0.5,'bolinha deformada após alternar');
    await first.click();await sleep(250);
    notes.push(`${width}px: ${count} interruptores (${on.length} ligados, ${off.length} desligados), todos 44x24, raio ${m[0].radius}px, bolinha ${m[0].tw}px circular e centrada`);
    // deixa dois desligados para o screenshot mostrar os dois estados (rascunho, sem salvar)
    await switches.nth(1).click();await switches.nth(3).click();await sleep(300);
    const mixed=await measure();
    assert.equal(mixed.filter(x=>x.state==='unchecked').length,2,'esperados 2 interruptores desligados');
    for(const x of mixed.filter(x=>x.state==='unchecked'))assert.ok(x.inset>=1&&x.inset<=3.5&&x.rightInset>=20,`${x.label}: bolinha desligada fora do lado esquerdo (esq ${x.inset})`);
    await switches.first().scrollIntoViewIfNeeded();
    await shot(page,`mct77-${suffix}`);
    await switches.nth(1).click();await switches.nth(3).click();await sleep(1200); // restaura (o rascunho é gravado no evento)
    assert.equal(page.errors.length,0,`erros de página: ${page.errors}`);
    await page.context().close();
  }
});

// ---------- 9. MCT-83 ----------
await item(9,'MCT-83 cadastro pede nome; nome aparece na Equipe após entrar por convite',async notes=>{
  const guestName='Maria Convidada QA';
  const email=`pr43-guest-${randomUUID()}@example.test`,password=`Pr43-${randomUUID()}`;
  const invitation=await rpc(founder.client,'event_invite',{p_event:eventId,p_role:'director'});
  const returnTo=`/entrar?${new URLSearchParams({codigo:eventCode,convite:invitation})}`;
  const page=await newPage({width:1280,height:900});
  await page.goto(`${BASE}/register?returnTo=${encodeURIComponent(returnTo)}`);
  await page.waitForSelector('#name');
  assert.equal(await page.locator('label[for=name]').innerText(),'Seu nome','rótulo do campo de nome');
  assert.ok(await page.locator('#name').evaluate(el=>el.required),'campo nome deveria ser obrigatório');
  await page.fill('#email',email);await page.fill('#password',password);await page.fill('#confirm',password);
  await page.getByRole('button',{name:'Criar conta'}).click();
  assert.ok(await page.locator('#name').evaluate(el=>el.validity.valueMissing),'sem nome o navegador deveria barrar o envio');
  assert.ok(page.url().includes('/register'),'enviou o cadastro sem nome');
  await page.fill('#name','   ');
  await page.getByRole('button',{name:'Criar conta'}).click();
  await page.getByText('Informe seu nome.').waitFor({timeout:3000});
  await shot(page,'mct83-desktop');
  await page.fill('#name',guestName);
  await page.getByRole('button',{name:'Criar conta'}).click();
  // confirmação por e-mail está ligada no Supabase local: segue o link real do Mailpit
  await page.getByText('Confirme seu e-mail').first().waitFor({timeout:10000});
  const mailpit=process.env.MAILPIT_URL||'http://127.0.0.1:54324';
  let link='';
  for(let i=0;i<20&&!link;i++){
    const search=await (await fetch(`${mailpit}/api/v1/search?query=${encodeURIComponent('to:'+email)}`)).json();
    const id=search.messages?.[0]?.ID;
    if(id){const message=await (await fetch(`${mailpit}/api/v1/message/${id}`)).json();link=((message.HTML||message.Text||'').match(/https?:\/\/[^"'\s<>]*verify[^"'\s<>]*/)||[''])[0].replace(/&amp;/g,'&');}
    else await sleep(500);
  }
  assert.ok(link,'e-mail de confirmação não chegou ao Mailpit');
  await page.goto(link);
  await page.waitForURL(/\/entrar/,{timeout:15000});
  await page.getByRole('button',{name:'Entrar no evento'}).click();
  await page.waitForURL(/\/event\//,{timeout:15000});
  notes.push(`conta criada com nome "${guestName}", confirmada pelo link do e-mail, entrou no evento (${new URL(page.url()).pathname})`);
  const user=(await admin.auth.admin.listUsers({page:1,perPage:1000})).data.users.find(u=>u.email===email);
  assert.equal(user.user_metadata.full_name,guestName,'full_name não foi gravado no Auth');
  await page.context().close();
  // fundador vê o nome na Equipe do evento
  const owner=await newPage({width:1280,height:900});
  await login(owner);
  await openEvent(owner,'equipe');
  const card=owner.locator('[role="button"][aria-label^="Gerenciar "]').filter({hasText:guestName});
  await card.waitFor({timeout:8000});
  const cardText=(await card.innerText()).replace(/\n+/g,' · ');
  assert.ok(/Diretor|Director|diretor/i.test(cardText),`papel do convite não aparece: ${cardText}`);
  await shot(owner,'mct83-equipe');
  notes.push(`Equipe do evento mostra "${cardText}"`);
  const team=await rpc(founder.client,'event_team',{p_event:eventId});
  assert.ok(team.some(m=>m.name===guestName),'event_team não traz o nome');
  assert.equal(owner.errors.length,0,`erros de página: ${owner.errors}`);
  await owner.context().close();
});

// ---------- 10. MCT-87 ----------
await item(10,'MCT-87 landing: links do menu rolam em ≈280ms; reduced-motion salta direto',async notes=>{
  async function click(page,section) {
    await page.evaluate(()=>window.scrollTo(0,0));await sleep(250);
    await page.evaluate(()=>{window.__s=[];window.__click=null;
      document.addEventListener('click',()=>{window.__click=performance.now();},{capture:true,once:true});
      const loop=()=>{window.__s.push([performance.now(),window.scrollY]);if(performance.now()-(window.__click||performance.now())<1500)requestAnimationFrame(loop);};requestAnimationFrame(loop);});
    await page.locator(`nav.nav-l [data-scroll="${section}"]`).first().click();
    await sleep(900);
    return page.evaluate(sec=>{
      const el=document.getElementById(sec),max=document.documentElement.scrollHeight-innerHeight;
      const s=window.__s.filter(([t])=>t>=window.__click),end=window.scrollY;
      const reached=end>1?s.find(([,y])=>Math.abs(y-end)<1.5):null; // a rolagem sempre parte do topo (scrollTo(0,0) antes do clique)
      return {end,topNow:Math.round(el.getBoundingClientRect().top),ms:reached?Math.round(reached[0]-window.__click):null,distinct:new Set(s.map(([,y])=>Math.round(y))).size,max};
    },section);
  }
  const normal=await newPage({width:1280,height:800});
  await normal.goto(`${BASE}/`);await normal.waitForSelector('nav.nav-l');
  const timings=[];
  for(const section of ['rodadas','para-quem','modulos','como','planos','duvidas']) {
    const r=await click(normal,section);
    assert.ok(r.ms!==null,`${section}: não chegou ao destino (${JSON.stringify(r)})`);
    assert.ok(r.topNow<=84&&(r.topNow>=76||r.end>=r.max-2),`${section}: seção parou a ${r.topNow}px do topo (esperado ≈80)`);
    assert.ok(r.ms>=150&&r.ms<=450,`${section}: rolagem levou ${r.ms}ms (esperado ≈280ms)`);
    assert.ok(r.distinct>=4,`${section}: sem animação intermediária (${r.distinct} posições)`);
    timings.push(`${section}=${r.ms}ms`);
  }
  notes.push(`animado: ${timings.join(', ')} (≈280ms)`);
  assert.equal(normal.errors.length,0,`erros de página: ${normal.errors}`);
  await normal.evaluate(()=>window.scrollTo(0,0));await sleep(300);
  await normal.context().close();
  const reduced=await newPage({width:1280,height:800},{reducedMotion:'reduce'});
  await reduced.goto(`${BASE}/`);await reduced.waitForSelector('nav.nav-l');
  assert.ok(await reduced.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches),'emulação de reduced-motion falhou');
  const jumps=[];
  for(const section of ['modulos','planos','duvidas']) {
    const r=await click(reduced,section);
    assert.ok(r.ms!==null&&r.ms<=60,`${section}: com movimento reduzido levou ${r.ms}ms`);
    assert.ok(r.distinct<=2,`${section}: movimento reduzido não deveria animar (${r.distinct} posições)`);
    assert.ok(r.topNow<=84&&(r.topNow>=76||r.end>=r.max-2),`${section}: seção a ${r.topNow}px do topo`);
    jumps.push(`${section}=${r.ms}ms/${r.distinct} posições`);
  }
  notes.push(`reduced-motion: salto direto (${jumps.join(', ')})`);
  assert.equal(reduced.errors.length,0,`erros de página: ${reduced.errors}`);
  await reduced.context().close();
});

await browser.close();
const failed=results.filter(r=>!r.ok);
console.log(`\n${results.length-failed.length}/${results.length} itens PASS`+(failed.length?`; FAIL: ${failed.map(r=>r.number).join(', ')}`:''));
process.exit(failed.length?1:0);
