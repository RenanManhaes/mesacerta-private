// MCT-86: editar tarefa (descrição + vários responsáveis) contra o Supabase LOCAL, com tokens reais.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {account,rpc,admin} from './local-api.mjs';
import {applyTaskEdit,searchMembers,realMembers,taskOwnerIds} from '../src/lib/taskOwners.js';

const founder=await account('mct86-founder'),director=await account('mct86-director'),staff=await account('mct86-staff'),staff2=await account('mct86-staff2');
await rpc(founder.client,'criar_organizacao',{p_nome:'Synthetic MCT86'});
const org=await founder.client.from('memberships').select('organization_id').eq('user_id',founder.user.id).single();assert.ifError(org.error);
const eventId=randomUUID();
const row=await rpc(founder.client,'event_create',{p_org:org.data.organization_id,p_document:{id:eventId,name:'Synthetic MCT86',status:'planejamento',date:'2026-11-18',modules:{schedule:true},expenses:[],participants:[],schedule:[],
  // Cadastro manual antigo, sem vínculo: não pode aparecer ao lado do membro real.
  staffMembers:[{id:'legacy-1',name:'Staff Legado',email:'legado@example.test',role:'Staff',active:true}],
  tasks:[{id:'t1',name:'Montar palco',description:'',category:'Operação',priority:'Alta',status:'A fazer',ownerId:'',owner:''},{id:'t2',name:'Outra tarefa',status:'A fazer',ownerId:'',owner:''}]}});
await rpc(staff.client,'event_join',{p_code:row.code});
await rpc(staff2.client,'event_join',{p_code:row.code});
await rpc(director.client,'event_join',{p_code:row.code,p_invitation:await rpc(founder.client,'event_invite',{p_event:eventId,p_role:'director'})});

const load=async client=>(await rpc(client,'event_list')).find(r=>r.document.id===eventId);
const save=(client,r,doc)=>client.rpc('event_save',{p_event:eventId,p_revision:r.revision,p_document:doc});

// --- Membros reais, sem legado duplicado ---
let dirRow=await load(director.client);
const members=dirRow.document.staffMembers;
const team=await rpc(director.client,'event_team',{p_event:eventId});
assert.equal(team.length,4);
assert.deepEqual(members.map(m=>m.id).sort(),team.map(m=>m.id).sort());
assert.ok(!members.some(m=>m.id==='legacy-1'));
assert.equal(realMembers(members).length,4);
const staffMember=members.find(m=>m.userId===staff.user.id),staff2Member=members.find(m=>m.userId===staff2.user.id),directorMember=members.find(m=>m.userId===director.user.id);
assert.ok(staffMember.id&&staffMember.id!==staff.user.id);
// Nome precisa ser buscável por trecho/sem acento; o diretor aparece como membro real.
const probe=members.find(m=>m.id===staffMember.id).name.slice(0,4).toUpperCase();
assert.ok(searchMembers(members,probe).some(p=>p.id===staffMember.id));
console.log(`CA1 PASS: event_team devolve ${team.length} membros reais; staffMembers do evento tem os mesmos IDs e não traz o cadastro antigo "Staff Legado"; busca por "${probe}" acha o membro por ID estável.`);

// --- Diretor edita descrição e responsáveis por busca e persiste ---
const searched=searchMembers(members,staff2Member.name.split('@')[0].slice(0,3));
assert.ok(searched.some(p=>p.id===staff2Member.id));
let doc=applyTaskEdit(dirRow.document,'t1',{name:'Montar o palco principal',description:'Chegar às 8h e conferir o som.',ownerIds:[staffMember.id,staff2Member.id]});
let saved=await save(director.client,dirRow,doc);assert.ifError(saved.error);
dirRow=await load(director.client);
let t1=dirRow.document.tasks.find(t=>t.id==='t1');
assert.equal(t1.name,'Montar o palco principal');assert.equal(t1.description,'Chegar às 8h e conferir o som.');
assert.deepEqual(t1.ownerIds,[staffMember.id,staff2Member.id]);assert.equal(t1.ownerId,staffMember.id);
assert.equal(t1.priority,'Alta');assert.equal(dirRow.document.tasks.find(t=>t.id==='t2').name,'Outra tarefa');
const founderRow=await load(founder.client);
assert.deepEqual(founderRow.document.tasks.find(t=>t.id==='t1').ownerIds,[staffMember.id,staff2Member.id]);
console.log('CA2 PASS: diretor salvou título, descrição e 2 responsáveis (IDs de membro); recarregando (event_list) pelo diretor e pelo fundador os dados continuam.');

// Fundador também edita tudo.
doc=applyTaskEdit(founderRow.document,'t2',{name:'Outra tarefa',description:'Feita pelo fundador',ownerIds:[directorMember.id]});
saved=await save(founder.client,founderRow,doc);assert.ifError(saved.error);
assert.equal((await load(founder.client)).document.tasks.find(t=>t.id==='t2').description,'Feita pelo fundador');
console.log('CA2b PASS: fundador edita descrição/responsável de outra tarefa.');

// --- Staff: vê a tarefa por ser UM dos responsáveis; só muda status ---
let sRow=await load(staff.client);
assert.deepEqual(sRow.document.tasks.map(t=>t.id),['t1']);
assert.equal(sRow.document.tasks[0].description,'Chegar às 8h e conferir o som.');
let s2Row=await load(staff2.client);assert.deepEqual(s2Row.document.tasks.map(t=>t.id),['t1']);
assert.equal(sRow.document.staffMembers,undefined);
console.log('CA3 PASS: staff e staff2 (ambos em ownerIds) veem só a tarefa t1; a equipe não vai na projeção do staff.');

const deny=async(label,mutate)=>{
  const current=await load(staff.client),next=structuredClone(current.document);mutate(next);
  const r=await save(staff.client,current,next);
  assert.equal(r.error?.code,'42501',`${label}: esperava 42501, veio ${JSON.stringify(r.error)}`);
  console.log(`CA4 ${label}: HTTP ${r.status}, SQLSTATE ${r.error.code}, ${r.error.message}`);
};
await deny('staff troca responsáveis',d=>{d.tasks[0].ownerIds=[staffMember.id,directorMember.id];});
await deny('staff tira outro responsável',d=>{d.tasks[0].ownerIds=[staffMember.id];});
await deny('staff muda ownerId',d=>{d.tasks[0].ownerId=directorMember.id;});
await deny('staff edita descrição',d=>{d.tasks[0].description='hackeado';});
await deny('staff edita título',d=>{d.tasks[0].name='hackeado';});
await deny('staff cria tarefa',d=>{d.tasks.push({id:'t3',name:'Nova',ownerIds:[staffMember.id],ownerId:staffMember.id,status:'A fazer'});});
await deny('staff apaga tarefa',d=>{d.tasks=[];});
await deny('staff tenta pegar a tarefa t2',d=>{d.tasks.push({...dirRow.document.tasks.find(t=>t.id==='t2'),ownerIds:[staffMember.id],ownerId:staffMember.id});});
const unchanged=await load(founder.client);
assert.equal(unchanged.document.tasks.length,2);assert.equal(unchanged.document.tasks.find(t=>t.id==='t1').name,'Montar o palco principal');
assert.deepEqual(unchanged.document.tasks.find(t=>t.id==='t1').ownerIds,[staffMember.id,staff2Member.id]);

sRow=await load(staff.client);const statusDoc=structuredClone(sRow.document);statusDoc.tasks[0].status='Em andamento';
saved=await save(staff.client,sRow,statusDoc);assert.ifError(saved.error);
t1=(await load(founder.client)).document.tasks.find(t=>t.id==='t1');
assert.equal(t1.status,'Em andamento');assert.equal(t1.description,'Chegar às 8h e conferir o som.');assert.deepEqual(t1.ownerIds,[staffMember.id,staff2Member.id]);
console.log('CA4 PASS: staff mudou o status e nada mais (descrição e responsáveis intactos para o fundador).');

// --- Acesso direto às tabelas normalizadas (mesmas regras do MCT-60) ---
const ins=await admin.from('events').insert({id:eventId,organization_id:org.data.organization_id,nome:'Synthetic normalized MCT86'});
if(ins.error&&ins.error.code!=='23505')assert.ifError(ins.error);
const norm=await admin.from('tasks').insert({event_id:eventId,titulo:'Tarefa normalizada',descricao:'original',assigned_user_id:staff.user.id}).select('*').single();assert.ifError(norm.error);
for(const changes of [{descricao:'Forbidden edit'},{titulo:'Forbidden rename'},{assigned_user_id:director.user.id}]){
  const r=await staff.request(`tasks?id=eq.${norm.data.id}`,'PATCH',changes);assert.equal(r.status,403);assert.equal(r.body.code,'42501');
  console.log(`CA4b tabela tasks, staff PATCH ${Object.keys(changes)[0]}: HTTP ${r.status}, SQLSTATE ${r.body.code}`);
}
let r=await staff.request('tasks','POST',{event_id:eventId,titulo:'Forbidden creation',assigned_user_id:staff.user.id});assert.equal(r.status,403);assert.equal(r.body.code,'42501');
console.log('CA4b tabela tasks, staff INSERT: HTTP 403, SQLSTATE 42501');
r=await director.request(`tasks?id=eq.${norm.data.id}`,'PATCH',{descricao:'Diretor edita',assigned_user_id:staff2.user.id});assert.equal(r.status,204);
const after=await admin.from('tasks').select('descricao,assigned_user_id').eq('id',norm.data.id).single();assert.ifError(after.error);
assert.equal(after.data.descricao,'Diretor edita');assert.equal(after.data.assigned_user_id,staff2.user.id);
console.log('CA4c PASS: diretor muda descrição e responsável na tabela normalizada (HTTP 204, confirmado por leitura independente).');
console.log(`ownerIds finais: ${JSON.stringify(taskOwnerIds(t1))}`);
console.log('Registros sintéticos locais mantidos; nada de produção foi tocado.');
