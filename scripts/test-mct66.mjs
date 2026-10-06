import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {account,rpc} from './local-api.mjs';
import {saveEventWithMerge} from '../src/lib/eventSync.js';
// MCT-66: fundador e staff editam o mesmo evento em sessões separadas; nenhuma edição pode se perder.
const founder=await account('mct66-founder'),staff=await account('mct66-staff');
await rpc(founder.client,'criar_organizacao',{p_nome:'Synthetic MCT66'});
const org=await founder.client.from('memberships').select('organization_id').eq('user_id',founder.user.id).single();assert.ifError(org.error);
const row=await rpc(founder.client,'event_create',{p_org:org.data.organization_id,p_document:{id:randomUUID(),name:'Synthetic concurrent event',status:'planejamento',date:'2026-11-18',modules:{schedule:true,tickets:true},expenses:[{id:'exp',description:'Buffet',value:100}],participants:[{id:'person',name:'Participante'}],schedule:[],tasks:[]}});
const id=row.document.id;
await rpc(staff.client,'event_join',{p_code:row.code});
const team=await rpc(founder.client,'event_team',{p_event:id});
const member=team.find(m=>m.user_id===staff.user.id);
row.document.tasks=[{id:'task',name:'Tarefa da staff',ownerId:member.id,status:'A fazer'}];
const start=await rpc(founder.client,'event_save',{p_event:id,p_revision:row.revision,p_document:row.document});

// Duas sessões carregam a mesma revisão.
const founderRow=(await rpc(founder.client,'event_list'))[0],staffRow=(await rpc(staff.client,'event_list'))[0];
assert.equal(founderRow.revision,start);assert.equal(staffRow.revision,start);

// 1) A staff muda o status da tarefa e grava.
const staffDoc=structuredClone(staffRow.document);staffDoc.tasks[0].status='Concluído';
const staffSaved=await saveEventWithMerge({client:staff.client,base:staffRow.document,document:staffDoc,revision:staffRow.revision});
assert.equal(staffSaved.revision,start+1);assert.equal(staffSaved.merged,false);

// 2) O fundador, ainda na revisão antiga, edita uma despesa. Sem a junção isso daria 40001 e a mensagem de exportar.
const stale=await founder.client.rpc('event_save',{p_event:id,p_revision:founderRow.revision,p_document:{...founderRow.document,expenses:[{id:'exp',description:'Buffet',value:150}]}});
assert.equal(stale.error?.code,'40001');
console.log(`Pré-condição: gravar com revisão antiga falha com SQLSTATE ${stale.error.code}.`);
const founderDoc=structuredClone(founderRow.document);founderDoc.expenses[0].value=150;
let founderSaved;
try {
  founderSaved=await saveEventWithMerge({client:founder.client,base:founderRow.document,document:founderDoc,revision:founderRow.revision});
} catch (err) { assert.fail(`o fundador não deveria ver erro de conflito: ${err.message}`); }
assert.equal(founderSaved.merged,true);assert.deepEqual(founderSaved.conflicts,[]);
assert.equal(founderSaved.revision,start+2);
assert.equal(founderSaved.document.tasks[0].status,'Concluído');
assert.equal(founderSaved.document.expenses[0].value,150);

// 3) Ambas as mudanças persistiram e a revisão avançou duas vezes.
const final=(await rpc(founder.client,'event_list'))[0];
assert.equal(final.revision,start+2);
assert.equal(final.document.tasks[0].status,'Concluído');
assert.equal(final.document.expenses[0].value,150);
const staffFinal=(await rpc(staff.client,'event_list'))[0];
assert.equal(staffFinal.document.tasks[0].status,'Concluído');assert.equal(staffFinal.document.expenses,undefined);
console.log(`CA E2E PASS: revisão ${start} -> ${start+1} (staff: status da tarefa) -> ${start+2} (fundador: despesa, junção automática); as duas mudanças persistem; o fundador não recebeu erro; a staff continua sem ver despesas.`);
