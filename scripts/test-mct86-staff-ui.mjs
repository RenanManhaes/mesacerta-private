// MCT-86: o staff abre a PROPRIA tarefa e ve os nomes dos responsaveis, nao "Pessoa fora da equipe".
// A projecao do staff nao traz a equipe (staffMembers), entao a tela usa o texto "owner" ja gravado na tarefa.
// Navegador real contra o Supabase LOCAL, contas sinteticas.
//
//   APP_URL=http://127.0.0.1:5191 node scripts/test-mct86-staff-ui.mjs
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import {account,rpc,admin} from './local-api.mjs';
import {applyTaskEdit} from '../src/lib/taskOwners.js';
const require=createRequire(import.meta.url);
let playwright;
try { playwright=require('playwright'); } catch { playwright=require(process.env.PLAYWRIGHT_PATH||'/usr/local/lib/node_modules_global/playwright'); }
const APP=process.env.APP_URL||'http://127.0.0.1:5191';

const founder=await account('mct86ui-founder'),staff=await account('mct86ui-staff'),staff2=await account('mct86ui-staff2');
const password=randomUUID();
for(const person of [staff,staff2]){const r=await admin.auth.admin.updateUserById(person.user.id,{password});assert.ifError(r.error);}
await rpc(founder.client,'criar_organizacao',{p_nome:'Synthetic MCT86 UI'});
const org=await founder.client.from('memberships').select('organization_id').eq('user_id',founder.user.id).single();assert.ifError(org.error);
const eventId=randomUUID();
const row=await rpc(founder.client,'event_create',{p_org:org.data.organization_id,p_document:{id:eventId,name:'Synthetic MCT86 UI',status:'planejamento',date:'2026-11-18',modules:{schedule:true},participants:[],schedule:[],
  tasks:[{id:'t1',name:'Montar palco',status:'A fazer',ownerId:'',owner:''}]}});
await rpc(staff.client,'event_join',{p_code:row.code});
await rpc(staff2.client,'event_join',{p_code:row.code});
const current=(await rpc(founder.client,'event_list')).find(r=>r.document.id===eventId);
const members=current.document.staffMembers;
const a=members.find(m=>m.userId===staff.user.id),b=members.find(m=>m.userId===staff2.user.id);
// Renomeia pelo caminho real (RPC), como o fundador faria no card do membro, e atribui as duas pessoas.
for(const [member,name] of [[a,'Joao Pereira'],[b,'Marina Lima']]){
  await rpc(founder.client,'event_edit_person',{p_member:member.id,p_name:name,p_email:member.email||'',p_phone:member.phone||'',p_function:member.function||'',p_area:member.area||'',p_job_title:member.jobTitle||''});
}
const fresh=(await rpc(founder.client,'event_list')).find(r=>r.document.id===eventId);
const edited=applyTaskEdit(fresh.document,'t1',{name:'Montar palco',description:'Das 8h as 10h.',ownerIds:[a.id,b.id]});
const saved=await founder.client.rpc('event_save',{p_event:eventId,p_revision:fresh.revision,p_document:edited});assert.ifError(saved.error);

const browser=await playwright.chromium.launch({headless:true,args:['--no-sandbox']}).catch(()=>playwright.chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium',args:['--no-sandbox']}));
let failed=false;
try {
  const page=await (await browser.newContext()).newPage();
  await page.goto(`${APP}/login`);
  await page.fill('#email',staff.user.email);await page.fill('#password',password);
  await page.click('button[type=submit]');
  await page.waitForURL(url=>!url.pathname.startsWith('/login'),{timeout:15000});
  await page.goto(`${APP}/event/${eventId}/tarefas`);
  await page.getByText('Montar palco').first().waitFor({timeout:15000});
  await page.getByText('Montar palco').first().click();
  const owners=page.getByTestId('task-owners');
  await owners.waitFor({timeout:5000});
  const text=await owners.innerText();
  assert.ok(!/fora da equipe/i.test(text),`o staff nao pode ver "Pessoa fora da equipe": ${text}`);
  assert.match(text,/Joao Pereira/);assert.match(text,/Marina Lima/);
  assert.equal(await owners.locator('[data-owner-id]').count(),2,'um rotulo por responsavel');
  assert.equal(await owners.getByRole('button').count(),0,'staff nao pode tirar responsaveis');
  console.log(`PASS: staff abriu a propria tarefa e viu os responsaveis "${text.replace(/\s+/g,' ').trim()}" (sem "Pessoa fora da equipe", sem botao de tirar).`);
} catch (error) {
  failed=true;console.error(error);
} finally {
  await browser.close();
}
if(failed) process.exit(1);
