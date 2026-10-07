// MCT-85: criar um evento enquanto uma atualizacao silenciosa (event_list) esta em voo NAO pode fazer o evento
// novo sumir. Navegador real (Playwright) contra o Supabase LOCAL, conta sintetica.
//
//   APP_URL=http://127.0.0.1:5191 node scripts/test-mct85-race.mjs
//
// Truque: a primeira chamada de event_list feita depois do login e segurada (a resposta velha, sem o evento novo, e
// guardada) ate o evento ser criado; so entao e entregue. Sem a guarda de mutacao, o app trata o evento novo como
// "perdi o acesso" e o remove da lista local (a tela volta para o evento antigo).
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import {account,rpc,admin,permitMultiple} from './local-api.mjs';
const require=createRequire(import.meta.url);
let playwright;
try { playwright=require('playwright'); } catch { playwright=require(process.env.PLAYWRIGHT_PATH||'/usr/local/lib/node_modules_global/playwright'); }
const APP=process.env.APP_URL||'http://127.0.0.1:5191';

const founder=await account('mct85race');
const password=randomUUID();
const reset=await admin.auth.admin.updateUserById(founder.user.id,{password});assert.ifError(reset.error);
await rpc(founder.client,'criar_organizacao',{p_nome:'Synthetic MCT85 race'});
const org=await founder.client.from('memberships').select('organization_id').eq('user_id',founder.user.id).single();assert.ifError(org.error);
await rpc(founder.client,'event_create',{p_org:org.data.organization_id,p_document:{id:randomUUID(),name:'Evento que ja existia',status:'planejamento',date:'2026-11-18',modules:{},participants:[],schedule:[],tasks:[]}});
await permitMultiple(founder);

const browser=await playwright.chromium.launch({headless:true,args:['--no-sandbox']}).catch(()=>playwright.chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium',args:['--no-sandbox']}));
let failed=false;
try {
  const page=await (await browser.newContext()).newPage();
  await page.goto(`${APP}/login`);
  await page.fill('#email',founder.user.email);await page.fill('#password',password);
  await page.click('button[type=submit]');
  await page.getByRole('heading',{name:'Meus eventos'}).waitFor({timeout:20000});
  await page.getByText('Evento que ja existia').first().waitFor({timeout:10000});
  await new Promise(r=>setTimeout(r,1500)); // canal e carga inicial assentados

  // Segura a proxima event_list: busca no servidor AGORA (resposta velha) e entrega depois.
  let held=null,release,calls=0;
  const gate=new Promise(r=>{release=r;});
  await page.route('**/rest/v1/rpc/event_list',async route=>{
    calls++;
    if(held) return route.continue();
    const response=await route.fetch(); // o servidor ainda nao tem o evento novo
    held={body:await response.text()};
    await gate;
    await route.fulfill({response,body:held.body});
  });
  await page.evaluate(()=>window.dispatchEvent(new Event('focus'))); // dispara a rebusca silenciosa
  const start=Date.now();
  while(!held&&Date.now()-start<10000) await new Promise(r=>setTimeout(r,50));
  assert.ok(held,'a rebusca silenciosa nao comecou');

  // Cria o evento pela tela, com a rebusca ainda em voo.
  await page.getByRole('button',{name:/Criar evento/}).click();
  await page.fill('input[placeholder^="Ex.: Summit"]','Evento criado durante a rebusca');
  await page.locator('input[type=date]').fill('2026-12-01');
  await page.getByRole('button',{name:/Continuar/}).click();
  await page.locator('input[type=number]').first().fill('50');
  await page.getByRole('button',{name:/Continuar/}).click();
  await page.getByRole('button',{name:/Criar evento/}).click();
  await page.waitForURL(/\/event\/.+\/dashboard/,{timeout:15000});
  const createdId=page.url().match(/\/event\/([^/]+)\//)[1];
  const inDb=await rpc(founder.client,'event_list');
  assert.ok(inDb.some(r=>r.document.id===createdId),'o evento deveria existir no servidor');

  // Entrega a resposta velha (sem o evento novo) e confere que ele continua na tela.
  release();
  await new Promise(r=>setTimeout(r,2500)); // tempo para a resposta velha ser tratada e a nova rebusca terminar
  await page.getByText('Evento criado durante a rebusca').first().waitFor({timeout:5000});
  assert.match(page.url(),new RegExp(createdId),'a tela saiu do evento recem-criado');
  assert.ok(calls>=2,`esperava uma nova rebusca depois de descartar a resposta velha (event_list chamado ${calls}x)`);
  console.log(`PASS: evento criado com a rebusca em voo continuou na tela e no servidor (${createdId}); event_list foi chamado ${calls}x (a resposta velha foi descartada e refeita).`);
} catch (error) {
  failed=true;console.error(error);
} finally {
  await browser.close();
}
if(failed) process.exit(1);
