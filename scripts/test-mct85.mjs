import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {account,rpc} from './local-api.mjs';
import {saveEventWithMerge} from '../src/lib/eventSync.js';
import {watchEventSignals} from '../src/lib/eventSignals.js';
import {recordSignal,hasNewerSignal,decideRefresh} from '../src/lib/realtimeRefresh.js';
// MCT-85: sinal de mudança em tempo real. Fundador, diretor e staff no mesmo evento; um forasteiro de fora.
const founder=await account('mct85-founder'),director=await account('mct85-director'),staff=await account('mct85-staff'),outsider=await account('mct85-outsider');
await rpc(founder.client,'criar_organizacao',{p_nome:'Synthetic MCT85'});
const org=await founder.client.from('memberships').select('organization_id').eq('user_id',founder.user.id).single();assert.ifError(org.error);
const created=await rpc(founder.client,'event_create',{p_org:org.data.organization_id,p_document:{id:randomUUID(),name:'Synthetic realtime event',status:'planejamento',date:'2026-11-18',modules:{schedule:true,networking:true},
 expenses:[{id:'exp',description:'Buffet',value:100}],revenues:[{id:'rev',description:'Ingressos',value:900}],participants:[{id:'p1',name:'Ana'}],schedule:[],tasks:[],networking:{enabled:true,tables:14,rounds:11}}});
const id=created.document.id;
await rpc(director.client,'event_join',{p_code:created.code,p_invitation:await rpc(founder.client,'event_invite',{p_event:id,p_role:'director'})});
await rpc(staff.client,'event_join',{p_code:created.code,p_invitation:null});
const team=await rpc(founder.client,'event_team',{p_event:id});
const staffMember=team.find(m=>m.user_id===staff.user.id);
const wait=async(check,label,ms=8000)=>{const end=Date.now()+ms;while(Date.now()<end){const value=check();if(value)return value;await new Promise(r=>setTimeout(r,50));}assert.fail(`tempo esgotado: ${label}`);};

// RLS: a staff NÃO lê o documento completo, mas lê o sinal (que não carrega dados do evento).
const staffDocs=await staff.client.from('platform_events').select('*');assert.ifError(staffDocs.error);assert.equal(staffDocs.data.length,0);
const staffSignal=await staff.client.from('event_change_signals').select('*');assert.ifError(staffSignal.error);
assert.equal(staffSignal.data.length,1);assert.deepEqual(Object.keys(staffSignal.data[0]).sort(),['changed_at','event_id','revision']);
const outsiderSignal=await outsider.client.from('event_change_signals').select('*');assert.ifError(outsiderSignal.error);assert.equal(outsiderSignal.data.length,0);
for(const [name,client] of [['staff',staff.client],['outsider',outsider.client]]){
  for(const verb of ['insert','update','delete']){
    const op=verb==='insert'?client.from('event_change_signals').insert({event_id:id,revision:999}):verb==='update'?client.from('event_change_signals').update({revision:999}).eq('event_id',id):client.from('event_change_signals').delete().eq('event_id',id);
    const result=await op;assert.ok(result.error||!result.data?.length,`${name} não pode ${verb}`);
  }
}
console.log('RLS PASS: staff lê 0 linhas de platform_events; lê só (event_id, revision, changed_at) do sinal; forasteiro lê 0 sinais; ninguém escreve no sinal.');

// Assinaturas (mesmo código do app): diretor, staff e forasteiro.
const got={director:[],staff:[],outsider:[],founder:[]},stops=[];
const subscribe=(name,client,ids)=>new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>reject(new Error(`canal ${name} não conectou`)),10000);
  stops.push(watchEventSignals({client,eventIds:ids,onSignal:s=>got[name].push(s),onSubscribed:()=>{clearTimeout(timer);resolve();},onProblem:(status)=>reject(new Error(`canal ${name}: ${status}`))}));
});
await Promise.all([subscribe('director',director.client,[id]),subscribe('staff',staff.client,[id]),subscribe('outsider',outsider.client,[id]),subscribe('founder',founder.client,[id])]);

// Estado de cada sessão, como no app: último documento confirmado e revisão conhecida.
const load=async(who)=>{const rows=await rpc(who.client,'event_list');return rows.find(r=>r.document.id===id);};
const founderRow=await load(founder),directorRow=await load(director),staffRow=await load(staff);
assert.equal(directorRow.revision,founderRow.revision);

// 1) O fundador salva configuração + tarefa + participante + rodadas de networking.
const doc=structuredClone(founderRow.document);
doc.name='Synthetic realtime event (renomeado)';
doc.tasks=[{id:'task1',name:'Reservar som',ownerId:staffMember.id,status:'A fazer'}];
doc.participants.push({id:'p2',name:'Bruno'});
doc.networking.rounds=12;doc.networking.schedule=[{round:1,tables:{1:['p1','p2']}}];
const saved=await saveEventWithMerge({client:founder.client,base:founderRow.document,document:doc,revision:founderRow.revision});
const started=Date.now();
await wait(()=>got.director.some(s=>s.revision===saved.revision),'diretor recebe o sinal');
const latencyMs=Date.now()-started;
await wait(()=>got.staff.some(s=>s.revision===saved.revision),'staff recebe o sinal');
assert.ok(got.director.every(s=>s.eventId===id));
assert.equal(got.outsider.length,0,'forasteiro não recebe nada');

// 2) O diretor rebusca pelo caminho existente e vê a mudança (sem recarregar nada).
let signals={};for(const s of got.director)signals=recordSignal(signals,s.eventId,s.revision);
assert.equal(decideRefresh({newer:hasNewerSignal(signals,{[id]:directorRow.revision}),writing:false,dirty:false}),'apply');
const directorNow=await load(director);
assert.equal(directorNow.revision,saved.revision);
assert.equal(directorNow.document.name,'Synthetic realtime event (renomeado)');
assert.equal(directorNow.document.tasks[0].name,'Reservar som');
assert.equal(directorNow.document.participants.length,2);
assert.equal(directorNow.document.networking.rounds,12);assert.equal(directorNow.document.networking.schedule[0].round,1);
console.log(`CA1 PASS: diretor recebeu o sinal da revisão ${saved.revision} em ${latencyMs} ms e, ao rebuscar, viu nome, tarefa, participante e rodadas novos.`);

// 3) A staff recebeu o sinal, mas a rebusca dela continua sem dados financeiros.
const staffNow=await load(staff);
assert.equal(staffNow.revision,saved.revision);
assert.equal(staffNow.document.expenses,undefined);assert.equal(staffNow.document.revenues,undefined);assert.equal(staffNow.document.networking,undefined);
assert.equal(staffNow.document.participants.length,2);assert.equal(staffNow.document.tasks[0].name,'Reservar som');
console.log('CA2 PASS: staff recebeu o sinal; a rebusca traz participantes e a tarefa dela, sem despesas, receitas nem networking.');

// 4) Eco: o próprio save do fundador chegou como sinal, mas não conta como novidade para ele.
await wait(()=>got.founder.some(s=>s.revision===saved.revision),'fundador recebe o eco');
let own={};for(const s of got.founder)own=recordSignal(own,s.eventId,s.revision);
assert.equal(hasNewerSignal(own,{[id]:saved.revision}),false);
console.log('CA3 PASS: o eco da própria gravação é ignorado (revisão igual à conhecida), sem laço de rebusca.');

// 5) Staff salva (só status da tarefa); fundador e diretor recebem o sinal e veem a mudança.
const staffDoc=structuredClone(staffNow.document);staffDoc.tasks[0].status='Concluído';
const staffSaved=await saveEventWithMerge({client:staff.client,base:staffNow.document,document:staffDoc,revision:staffNow.revision});
await wait(()=>got.founder.some(s=>s.revision===staffSaved.revision)&&got.director.some(s=>s.revision===staffSaved.revision),'fundador e diretor recebem o sinal da staff');
assert.equal((await load(founder)).document.tasks[0].status,'Concluído');
console.log(`CA4 PASS: save da staff (revisão ${staffSaved.revision}) chega por sinal ao fundador e ao diretor.`);

// 6) Remoção do canal: depois de cancelar, nada mais chega.
const before=got.director.length;
for(const stop of stops)stop();
await new Promise(r=>setTimeout(r,500));
const current=await load(founder);const doc2=structuredClone(current.document);doc2.name='Depois de cancelar';
await saveEventWithMerge({client:founder.client,base:current.document,document:doc2,revision:current.revision});
await new Promise(r=>setTimeout(r,1500));
assert.equal(got.director.length,before,'canal removido não recebe mais sinais');
console.log('CA5 PASS: ao cancelar a assinatura (troca de evento/desmontagem) nenhum sinal novo chega.');
process.exit(0);
