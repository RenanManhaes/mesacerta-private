import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {admin} from './local-api.mjs';
import {createClient} from '@supabase/supabase-js';

// MCT-82 no navegador real (Chromium): o modal prende o foco e o devolve a quem o abriu.
// Só Supabase LOCAL e contas sintéticas. O Vite sobe aqui, com as variáveis do Supabase local
// passadas pelo ambiente do processo (nenhum .env.local é criado ou commitado).
const status=JSON.parse((s=>s.slice(s.indexOf('{')))(spawnSync('npx --yes supabase status -o json',{shell:true,encoding:'utf8'}).stdout));
assert.match(status.API_URL,/^http:\/\/(127\.0\.0\.1|localhost):/,'só Supabase local');
const PORT=Number(process.env.MCT82_PORT||5187),BASE=`http://127.0.0.1:${PORT}`;
const playwrightRoot=['/opt/node22/lib/node_modules','/usr/local/lib/node_modules_global'].find(path=>spawnSync('test',['-d',join(path,'playwright')]).status===0);
assert.ok(playwrightRoot,'pacote playwright não encontrado');
const {chromium}=createRequire(join(playwrightRoot,'x.js'))('playwright');
process.env.PLAYWRIGHT_BROWSERS_PATH=process.env.PLAYWRIGHT_BROWSERS_PATH||'/opt/pw-browsers';

// ---- Dados sintéticos --------------------------------------------------------------------------
const tmp=await mkdtemp(resolve('node_modules/.mct82-browser-'));
await writeFile(join(tmp,'format.mjs'),await readFile('src/lib/format.js','utf8'));
await writeFile(join(tmp,'demo.mjs'),(await readFile('src/lib/demoData.js','utf8')).replaceAll("'./format'","'./format.mjs'"));
const {demoEvent}=await import(pathToFileURL(join(tmp,'demo.mjs')));
const email=`mct82-${randomUUID()}@example.test`,password=randomUUID();
const created=await admin.auth.admin.createUser({email,password,email_confirm:true});assert.ifError(created.error);
const options={auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}};
const client=createClient(status.API_URL,status.ANON_KEY,options);
assert.ifError((await client.auth.signInWithPassword({email,password})).error);
assert.ifError((await client.rpc('criar_organizacao',{p_nome:'Synthetic MCT82'})).error);
const org=await client.from('memberships').select('organization_id').eq('user_id',created.data.user.id).single();assert.ifError(org.error);
const eventId=randomUUID();
const made=await client.rpc('event_create',{p_org:org.data.organization_id,p_document:{...demoEvent,id:eventId,name:'Evento sintético MCT82',archived:false}});assert.ifError(made.error);
const serverEvent=async()=>(await client.rpc('event_list')).data.find(row=>row.document.id===eventId).document;

const vite=spawn('npx',['--yes','vite','--port',String(PORT),'--strictPort','--host','127.0.0.1'],{env:{...process.env,VITE_SUPABASE_URL:status.API_URL,VITE_SUPABASE_PUBLISHABLE_KEY:status.ANON_KEY},stdio:'ignore',detached:true});
let browser;
try {
  for(let i=0;i<120;i++){try{if((await fetch(BASE)).ok)break;}catch{/* ainda subindo */}await new Promise(r=>setTimeout(r,500));}
  browser=await chromium.launch({headless:true});
  const page=await (await browser.newContext({viewport:{width:1280,height:900}})).newPage();
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(`${BASE}/login`);
  await page.getByLabel('E-mail').fill(email);await page.getByLabel('Senha',{exact:true}).fill(password);
  await page.getByRole('button',{name:'Entrar',exact:true}).click();
  await page.waitForURL(url=>!url.pathname.startsWith('/login'));
  const go=async path=>{await page.goto(`${BASE}/event/${eventId}/${path}`);await page.waitForLoadState('networkidle');};
  const insideDialog=()=>page.evaluate(()=>!!document.activeElement?.closest('[role="alertdialog"]'));
  const focusedText=()=>page.evaluate(()=>(document.activeElement?.getAttribute('aria-label')||document.activeElement?.textContent||'').trim());
  const dialog=page.getByRole('alertdialog');
  // Prova: abre, foco entra, Tab/Shift+Tab não saem, Esc fecha e devolve o foco a quem abriu.
  const proveFocus=async(opener,name)=>{
    await opener.focus();
    await opener.press('Enter');
    await dialog.waitFor();
    assert.ok(await insideDialog(),`${name}: o foco entra no modal`);
    for(let i=0;i<7;i++){await page.keyboard.press('Tab');assert.ok(await insideDialog(),`${name}: Tab ${i+1} continua dentro do modal`);}
    for(let i=0;i<3;i++){await page.keyboard.press('Shift+Tab');assert.ok(await insideDialog(),`${name}: Shift+Tab ${i+1} continua dentro do modal`);}
    await page.keyboard.press('Escape');
    await dialog.waitFor({state:'detached'});
    assert.equal(await opener.evaluate(node=>node===document.activeElement),true,`${name}: Esc devolve o foco a quem abriu (agora: ${await focusedText()})`);
    // Também ao fechar por "Cancelar".
    await opener.press('Enter');await dialog.waitFor();
    await dialog.getByRole('button',{name:'Cancelar'}).click();
    await dialog.waitFor({state:'detached'});
    assert.equal(await opener.evaluate(node=>node===document.activeElement),true,`${name}: Cancelar devolve o foco a quem abriu`);
    console.log(`PASS foco (${name}): entra no modal, Tab/Shift+Tab ficam dentro (10 teclas), Esc e Cancelar devolvem o foco ao botão que abriu.`);
  };

  // 1) Configurações > Arquivar evento.
  await go('configuracoes');
  assert.equal(await page.getByText('Papéis de acesso').count(),0,'painel duplicado removido');
  const teamLink=page.getByRole('link',{name:'Equipe do evento'}).last();
  assert.equal(new URL(await teamLink.evaluate(a=>a.href)).pathname,`/event/${eventId}/equipe`);
  console.log('PASS Configurações: sem "Papéis de acesso"; texto com link para /equipe do evento.');
  const archive=page.getByRole('button',{name:'Arquivar evento'});
  await proveFocus(archive,'Arquivar evento');
  assert.equal((await serverEvent()).archived,false,'cancelar/Esc não arquivam');
  await archive.click();await dialog.getByRole('button',{name:'Arquivar',exact:true}).click();
  await page.waitForURL('**/eventos');
  for(let i=0;i<40&&!(await serverEvent()).archived;i++)await new Promise(r=>setTimeout(r,250));
  assert.equal((await serverEvent()).archived,true,'confirmar arquiva');
  console.log('PASS Configurações: Esc/Cancelar mantêm o evento ativo no banco; Arquivar grava archived=true.');
  // Restaura para as próximas telas.
  const row=(await client.rpc('event_list')).data.find(r=>r.document.id===eventId);
  assert.ifError((await client.rpc('event_save',{p_event:eventId,p_revision:row.revision,p_document:{...row.document,archived:false}})).error);

  // 2) Programação > Tipos de atividade > Excluir (modal dentro de outro modal).
  await go('programacao');
  await page.getByRole('button',{name:'Tipos de atividade'}).click();
  const typeName=`Tipo sintético ${randomUUID().slice(0,6)}`;
  await page.getByLabel('Novo tipo',{exact:true}).fill(typeName);
  await page.getByRole('button',{name:'Adicionar',exact:true}).click();
  const row2=page.locator('[data-type-row]',{hasText:typeName});await row2.waitFor();
  const trash=row2.getByRole('button',{name:`Excluir ${typeName}`});
  await proveFocus(trash,'Excluir tipo de atividade');
  await page.getByRole('dialog',{name:'Tipos de atividade'}).waitFor();
  assert.equal(await row2.count(),1,'cancelar/Esc mantêm o tipo');
  await trash.click();await dialog.getByRole('button',{name:'Excluir tipo'}).click();
  await row2.waitFor({state:'detached'});
  console.log('PASS Tipos de atividade: modal dentro do modal; Esc fecha só a confirmação e o foco volta à lixeira; cancelar mantém o tipo; confirmar remove.');
  await page.keyboard.press('Escape');

  // 3) Rodadas de negócio > Recalcular e substituir grade.
  await go('networking');
  await page.getByRole('button',{name:'Gerar distribuição',exact:true}).click();
  const regenerate=page.getByRole('button',{name:'Recalcular e substituir grade'}).first();
  await regenerate.waitFor();
  assert.equal(await dialog.count(),0,'a primeira geração não pergunta nada');
  let before;
  for(let i=0;i<60&&!(before=(await serverEvent()).networkingDistribution);i++)await new Promise(r=>setTimeout(r,250));
  assert.ok(before,'distribuição salva');
  await proveFocus(regenerate,'Recalcular e substituir grade');
  await new Promise(r=>setTimeout(r,1500));
  assert.deepEqual((await serverEvent()).networkingDistribution,before,'cancelar/Esc não alteram a distribuição salva');
  await regenerate.click();await dialog.getByRole('button',{name:'Substituir'}).click();
  await dialog.waitFor({state:'detached'});
  await page.getByRole('button',{name:'Recalcular e substituir grade'}).first().waitFor();
  console.log('PASS Rodadas: a primeira geração não pergunta; recalcular abre o modal, Esc/Cancelar deixam a distribuição salva idêntica no banco; "Substituir" refaz a grade.');
  assert.deepEqual(errors,[],`erros de página: ${errors.join(' | ')}`);
  console.log('MCT-82 BROWSER OK');
} finally {
  if(browser)await browser.close();
  try{process.kill(-vite.pid,'SIGTERM');}catch{/* já encerrou */}
  await rm(tmp,{recursive:true,force:true});
}
