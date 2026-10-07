// MCT-85 no navegador: duas páginas (fundador e diretor) no mesmo evento; o que o fundador salva aparece na do diretor sem recarregar.
// Pré-requisitos: Supabase local de pé e o app em http://localhost:5181 (npx vite --port 5181) com .env.local apontando ao Supabase local.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import {account,rpc,admin} from './local-api.mjs';
import {saveEventWithMerge} from '../src/lib/eventSync.js';
const require=createRequire(import.meta.url);
let playwright;
try { playwright=require('playwright'); } catch { playwright=require(process.env.PLAYWRIGHT_PATH||'/opt/node22/lib/node_modules/playwright'); }
const APP=process.env.APP_URL||'http://localhost:5181';
const founder=await account('mct85ui-founder'),director=await account('mct85ui-director');
const password=randomUUID();
for(const person of [founder,director]){const r=await admin.auth.admin.updateUserById(person.user.id,{password});assert.ifError(r.error);}
await rpc(founder.client,'criar_organizacao',{p_nome:'Synthetic MCT85 UI'});
const org=await founder.client.from('memberships').select('organization_id').eq('user_id',founder.user.id).single();assert.ifError(org.error);
const created=await rpc(founder.client,'event_create',{p_org:org.data.organization_id,p_document:{id:randomUUID(),name:'Evento sincronizado',status:'planejamento',date:'2026-11-18',modules:{schedule:true},participants:[],schedule:[],tasks:[{id:'t1',name:'Tarefa inicial',status:'A fazer'}]}});
const id=created.document.id;
await rpc(director.client,'event_join',{p_code:created.code,p_invitation:await rpc(founder.client,'event_invite',{p_event:id,p_role:'director'})});

const browser=await playwright.chromium.launch({headless:true});
try {
  const open=async(person)=>{
    const context=await browser.newContext(),page=await context.newPage();
    await page.goto(`${APP}/login`);
    await page.fill('#email',person.user.email);await page.fill('#password',password);
    await page.click('button[type=submit]');
    await page.waitForURL(url=>!url.pathname.startsWith('/login'),{timeout:15000});
    await page.goto(`${APP}/event/${id}/tarefas`);
    await page.getByText('Tarefa inicial').first().waitFor({timeout:15000});
    await page.evaluate(()=>{window.__semRecarregar=true;});
    return page;
  };
  const [founderPage,directorPage]=await Promise.all([open(founder),open(director)]);
  await new Promise(r=>setTimeout(r,2500)); // canal Realtime conectado nas duas páginas

  // O fundador grava uma tarefa nova e a mudança de configuração (nome do evento).
  const current=(await rpc(founder.client,'event_list')).find(r=>r.document.id===id);
  const doc=structuredClone(current.document);
  doc.name='Evento sincronizado (renomeado)';
  doc.tasks.push({id:'t2',name:'Tarefa criada pelo fundador',status:'A fazer'});
  const saved=await saveEventWithMerge({client:founder.client,base:current.document,document:doc,revision:current.revision});
  const started=Date.now();
  await directorPage.getByText('Tarefa criada pelo fundador').first().waitFor({timeout:8000});
  const elapsed=Date.now()-started;
  assert.equal(await directorPage.evaluate(()=>window.__semRecarregar===true),true,'a página do diretor não pode ter recarregado');
  await directorPage.getByText('Atualizado por outra pessoa da equipe').first().waitFor({timeout:3000});
  await directorPage.screenshot({path:process.env.SHOT||'mct85-diretor.png'});
  console.log(`UI PASS 1: diretor viu a tarefa nova (revisão ${saved.revision}) em ${elapsed} ms, sem recarregar a página, com o aviso "Atualizado por outra pessoa da equipe".`);

  // Agora o contrário, tudo pela interface: o diretor muda o status da tarefa e a página do fundador acompanha.
  await directorPage.waitForTimeout(3500); // deixa o aviso anterior sumir
  assert.equal(await directorPage.getByText('Atualizado por outra pessoa da equipe').count(),0);
  await directorPage.getByLabel('Status de Tarefa inicial').click();
  await directorPage.getByRole('option',{name:'Concluído'}).click();
  const moved=founderPage.locator('[data-column="Concluído"] [data-task-id="t1"]');
  const began=Date.now();
  await moved.waitFor({timeout:8000});
  const elapsed2=Date.now()-began;
  assert.equal(await founderPage.evaluate(()=>window.__semRecarregar===true),true,'a página do fundador não pode ter recarregado');
  await founderPage.getByText('Atualizado por outra pessoa da equipe').first().waitFor({timeout:3000});
  await directorPage.waitForTimeout(1500);
  assert.equal(await directorPage.getByText('Atualizado por outra pessoa da equipe').count(),0,'quem salvou não recebe o aviso (eco ignorado)');
  assert.equal(await directorPage.evaluate(()=>window.__semRecarregar===true),true);
  console.log(`UI PASS 2: o diretor mudou o status pela tela; o fundador viu a tarefa em Concluído em ${elapsed2} ms, sem recarregar, com o aviso; o diretor (quem salvou) não viu aviso.`);
} finally { await browser.close(); }
process.exit(0);
