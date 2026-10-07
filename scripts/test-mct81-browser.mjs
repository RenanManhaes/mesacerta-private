// MCT-81 / MCT-80 em navegador real (Playwright + Chromium): arrastar atividade na lista
// principal da programação com mouse e com teclado, persistência, e staff sem alça de arraste.
// Usa Supabase LOCAL e contas sintéticas; nunca toca em produção.
//
//   npx vite --port 5185 --host 127.0.0.1      (com .env.local apontando para o Supabase local)
//   node scripts/test-mct81-browser.mjs
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import {existsSync} from 'node:fs';
import {account,rpc,admin} from './local-api.mjs';

const require=createRequire(import.meta.url);
const playwrightPath=['playwright','/opt/node-tools/node_modules/playwright','/usr/local/lib/node_modules_global/playwright','/opt/node22/lib/node_modules/playwright'].find(p=>{try{require.resolve(p);return true;}catch{return false;}});
assert.ok(playwrightPath,'Pacote playwright não encontrado');
const {chromium}=require(playwrightPath);
const BASE=process.env.BASE_URL||'http://127.0.0.1:5185';
const executablePath=existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':undefined;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

const founder=await account('mct81b-founder'),staff=await account('mct81b-staff');
for(const person of [founder,staff]){person.password=`Mct81-${randomUUID()}`;const r=await admin.auth.admin.updateUserById(person.user.id,{password:person.password});assert.ifError(r.error);}
await rpc(founder.client,'criar_organizacao',{p_nome:'Synthetic MCT81 browser'});
const org=await founder.client.from('memberships').select('organization_id').eq('user_id',founder.user.id).single();assert.ifError(org.error);
const schedule=[
  {id:'a-abertura',title:'Abertura',start:'09:00',duration:30,type:'Palestra'},
  {id:'a-painel',title:'Painel',start:'09:30',duration:60,type:'Palestra'},
  {id:'a-cafe',title:'Café',start:'10:30',duration:15,type:'Intervalo'},
];
const created=await rpc(founder.client,'event_create',{p_org:org.data.organization_id,p_document:{id:randomUUID(),name:'Programação MCT-81',status:'planejamento',date:'2026-11-18',modules:{schedule:true},schedule,tasks:[],participants:[]}});
const eventId=created.document.id;
await rpc(staff.client,'event_join',{p_code:created.code});
const saved=async()=>(await rpc(founder.client,'event_list')).find(e=>e.document.id===eventId).document.schedule;
const order=list=>[...list].sort((a,b)=>a.start.localeCompare(b.start)).map(a=>`${a.title} ${a.start}`);
const noOverlap=list=>{const s=[...list].sort((a,b)=>a.start.localeCompare(b.start));const m=t=>+t.slice(0,2)*60+ +t.slice(3);for(let i=1;i<s.length;i++)assert.ok(m(s[i].start)>=m(s[i-1].start)+s[i-1].duration,`sobreposição: ${order(list)}`);};

const browser=await chromium.launch({executablePath,headless:true,args:['--no-sandbox']});
async function open(person){
  const page=await (await browser.newContext({viewport:{width:1280,height:900}})).newPage();
  await page.goto(`${BASE}/login`);await page.fill('#email',person.user.email);await page.fill('#password',person.password);await page.click('button[type=submit]');
  await page.waitForURL(/\/eventos/,{timeout:15000});
  await page.goto(`${BASE}/event/${eventId}/programacao`);await page.waitForSelector('[data-activity-row="a-abertura"]',{timeout:15000});
  await page.waitForLoadState('networkidle').catch(()=>{});await sleep(1200);
  return page;
}
const rows=page=>page.locator('[data-activity-row]').evaluateAll(els=>els.map(e=>e.getAttribute('data-activity-row')));
try {
  // 1. Mouse: arrastar "Abertura" pela alça até depois do "Café".
  let page=await open(founder);
  assert.equal(await page.getByText('Cronograma',{exact:true}).count(),0,'painel duplicado "Cronograma" não deveria existir');
  const handle=page.locator('[data-drag-handle="a-abertura"]');
  const from=await handle.boundingBox(),last=await page.locator('[data-activity-row="a-cafe"]').boundingBox();
  await page.mouse.move(from.x+from.width/2,from.y+from.height/2);await page.mouse.down();
  await page.mouse.move(from.x+from.width/2,from.y+from.height/2+10,{steps:4});
  await page.locator('[data-activity-row="a-abertura"].is-dragging').waitFor({timeout:3000});
  const lifted=await page.locator('[data-activity-row="a-abertura"].is-dragging').boundingBox();
  await page.mouse.move(from.x+from.width/2,last.y+last.height+20,{steps:20});await sleep(250);
  const moving=await page.locator('[data-activity-row="a-abertura"].is-dragging').boundingBox();
  const drift=Math.abs((moving.x-lifted.x));
  assert.ok(drift<=3,`card arrastado saiu do eixo do cursor: ${drift}px`);
  await page.mouse.up();
  await page.waitForFunction(()=>[...document.querySelectorAll('[data-activity-row]')].map(e=>e.getAttribute('data-activity-row')).at(-1)==='a-abertura',null,{timeout:5000});
  await page.getByText('Salvo',{exact:false}).first().waitFor({timeout:10000}).catch(()=>{});await sleep(1500);
  let db=await saved();
  assert.deepEqual(order(db),['Painel 09:00','Café 10:00','Abertura 10:15'],`mouse: ordem/horários gravados ${order(db)}`);
  noOverlap(db);
  await page.reload();await page.waitForSelector('[data-activity-row]');
  assert.deepEqual(await rows(page),['a-painel','a-cafe','a-abertura'],'após recarregar a ordem não persistiu');
  console.log(`MOUSE PASS: arrastar "Abertura" para o fim recalcula ${order(db).join(', ')} sem sobreposição; desvio lateral do card ${drift.toFixed(1)}px; persiste após recarregar.`);

  // 2. Teclado: alça da "Abertura" (última) → Espaço, seta para cima ×2, Espaço → volta ao início.
  await page.waitForLoadState('networkidle').catch(()=>{});await sleep(1200);
  await page.locator('[data-drag-handle="a-abertura"]').focus();
  await page.keyboard.press('Space');await sleep(250);
  if(process.env.DEBUG_QA)console.log('após Espaço:',await page.locator('.is-dragging').count(),await page.evaluate(()=>document.activeElement?.getAttribute('data-drag-handle')));
  await page.keyboard.press('ArrowUp');await sleep(250);await page.keyboard.press('ArrowUp');await sleep(250);
  await page.keyboard.press('Space');
  await page.waitForFunction(()=>document.querySelector('[data-activity-row]')?.getAttribute('data-activity-row')==='a-abertura',null,{timeout:5000});
  await sleep(2000);
  db=await saved();
  assert.deepEqual(order(db),['Abertura 09:00','Painel 09:30','Café 10:30'],`teclado: ${order(db)}`);
  noOverlap(db);
  console.log(`TECLADO PASS: Espaço, ↑↑, Espaço devolve "Abertura" ao início: ${order(db).join(', ')}.`);
  await page.context().close();

  // 3. Staff: vê a lista, sem alça de arraste e com o aviso de somente leitura.
  page=await open(staff);
  assert.equal(await page.locator('[data-drag-handle]').count(),0,'staff não deveria ver alça de arraste');
  assert.ok(await page.getByText('Só a direção do evento pode alterar.',{exact:false}).count(),'staff deveria ver o aviso de somente leitura');
  assert.deepEqual(await rows(page),['a-abertura','a-painel','a-cafe']);
  console.log('STAFF PASS: staff vê as 3 atividades, o aviso de somente leitura e nenhuma alça de arraste.');
  await page.context().close();
  console.log('MCT-81 BROWSER OK (dados sintéticos locais; nada em produção).');
} finally {
  await browser.close();
}
