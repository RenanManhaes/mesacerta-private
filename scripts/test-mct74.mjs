import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {writeFile,mkdtemp,rm} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import React from 'react';
import {act,create} from 'react-test-renderer';
import {account,rpc,admin} from './local-api.mjs';
import {writeTeamSupport,transpile,supportImports} from './team-ui-helpers.mjs';

// MCT-74: papéis e remoção pelo card do membro. Contas e evento sintéticos, só no Supabase local.
const founder=await account('mct74-founder'),director=await account('mct74-director'),staff=await account('mct74-staff'),other=await account('mct74-other');
await rpc(founder.client,'criar_organizacao',{p_nome:'Synthetic MCT74'});
const org=await founder.client.from('memberships').select('organization_id').eq('user_id',founder.user.id).single();assert.ifError(org.error);
let row=await rpc(founder.client,'event_create',{p_org:org.data.organization_id,p_document:{id:randomUUID(),name:'Synthetic MCT74 event',tasks:[]}});
const eventId=row.document.id;
await rpc(director.client,'event_join',{p_code:row.code,p_invitation:await rpc(founder.client,'event_invite',{p_event:eventId,p_role:'director'})});
await rpc(staff.client,'event_join',{p_code:row.code});
await rpc(other.client,'event_join',{p_code:row.code});
const members=async()=>(await rpc(founder.client,'event_team',{p_event:eventId}));
let team=await members();
const idOf=account=>team.find(m=>m.user_id===account.user.id).id;
const ids={founder:idOf(founder),director:idOf(director),staff:idOf(staff),other:idOf(other)};
const roleOf=async who=>(await members()).find(m=>m.id===ids[who])?.role;
// Tarefa atribuída ao staff: a remoção não pode apagá-la.
row=(await rpc(founder.client,'event_list'))[0];
row.document.tasks=[{id:'t1',name:'Tarefa do staff',ownerId:ids.staff,owner:'Staff sintético',status:'A fazer'}];
await rpc(founder.client,'event_save',{p_event:eventId,p_revision:row.revision,p_document:row.document});

// ---- Matriz de permissões da interface (função pura) -------------------------------------
const dir=await mkdtemp(resolve('node_modules/.team74-'));
let tree;
globalThis.window={location:{origin:'http://localhost:5173'}};
try {
 await writeTeamSupport(dir);
 const {teamPermissions}=await import(pathToFileURL(join(dir,'roles.mjs')));
 const cases=[
  ['founder',ids.founder,{id:ids.staff,accessRole:'staff'},{canEdit:true,canChangeRole:true,canRemove:true,nextRole:'director'}],
  ['founder',ids.founder,{id:ids.director,accessRole:'director'},{canEdit:true,canChangeRole:true,canRemove:true,nextRole:'staff'}],
  ['founder',ids.founder,{id:ids.founder,accessRole:'founder'},{canEdit:true,canChangeRole:false,canRemove:false}],
  ['director',ids.director,{id:ids.staff,accessRole:'staff'},{canEdit:true,canChangeRole:false,canRemove:false}],
  ['director',ids.director,{id:ids.director,accessRole:'director'},{canEdit:true,canChangeRole:false,canRemove:false}],
  ['director',ids.director,{id:ids.founder,accessRole:'founder'},{canEdit:true,canChangeRole:false,canRemove:false}],
  ['staff',ids.staff,{id:ids.staff,accessRole:'staff'},{canEdit:false,canChangeRole:false,canRemove:false}],
  ['staff',ids.staff,{id:ids.director,accessRole:'director'},{canEdit:false,canChangeRole:false,canRemove:false}],
 ];
 for(const [viewer,viewerId,person,expected] of cases)assert.deepEqual({...teamPermissions(viewer,viewerId,person)},{...teamPermissions(viewer,viewerId,person),...expected},`${viewer} sobre ${person.accessRole}`);
 console.log(`PERMISSÕES PASS: teamPermissions cobre ${cases.length} combinações (fundador gerencia staff/diretor e nunca o fundador; diretor só edita contato; staff só lê).`);

 // ---- API: ninguém além do fundador muda papel, remove ou convida -----------------------
 const status=async(who,path,body)=>(await who.request(path,'POST',body));
 for(const [label,who,target,newRole] of [['diretor promove staff',director,ids.staff,'director'],['diretor rebaixa a si mesmo',director,ids.director,'staff'],['diretor rebaixa o fundador',director,ids.founder,'staff'],['staff se eleva a diretor',staff,ids.staff,'director'],['staff eleva outro staff',staff,ids.other,'director'],['staff rebaixa diretor',staff,ids.director,'staff']]) {
  const result=await status(who,'rpc/event_change_role',{p_member:target,p_role:newRole});
  assert.equal(result.status,403,label);assert.equal(result.body.code,'42501',label);
  console.log(`API negada (${label}): HTTP ${result.status}, SQLSTATE ${result.body.code}, message=${result.body.message}`);
 }
 assert.equal(await roleOf('staff'),'staff');assert.equal(await roleOf('director'),'director');assert.equal(await roleOf('other'),'staff');
 for(const [label,who,target] of [['diretor remove staff',director,ids.staff],['diretor remove o fundador',director,ids.founder],['staff remove diretor',staff,ids.director],['staff remove a si mesmo',staff,ids.staff]]) {
  const result=await status(who,'rpc/event_remove_person',{p_member:target});
  assert.equal(result.status,403,label);assert.equal(result.body.code,'42501',label);
  console.log(`API negada (${label}): HTTP ${result.status}, SQLSTATE ${result.body.code}`);
 }
 assert.equal((await members()).length,4,'ninguém foi removido pelas chamadas negadas');
 for(const [label,who,path,body] of [['diretor gera link',director,'rpc/event_invite',{p_event:eventId,p_role:'staff'}],['staff gera link',staff,'rpc/event_invite',{p_event:eventId,p_role:'staff'}],['diretor revoga código',director,'rpc/event_code_enabled',{p_event:eventId,p_enabled:false}]]) {
  const result=await status(who,path,body);assert.equal(result.status,403,label);assert.equal(result.body.code,'42501',label);
 }
 console.log('API negada: diretor/staff também não geram link nem revogam código (MCT-60/73).');
 const ownDenied=await founder.client.rpc('event_change_role',{p_member:ids.founder,p_role:'staff'});assert.equal(ownDenied.error.code,'42501');
 const toFounder=await founder.client.rpc('event_change_role',{p_member:ids.staff,p_role:'founder'});assert.equal(toFounder.error.code,'42501');
 const removeFounder=await founder.client.rpc('event_remove_person',{p_member:ids.founder});assert.equal(removeFounder.error.code,'42501');
 assert.equal(await roleOf('founder'),'founder');
 console.log(`API negada ao próprio fundador: rebaixar a si mesmo ('${ownDenied.error.message}'), criar segundo fundador e remover o fundador (SQLSTATE ${removeFounder.error.code}); fundador segue fundador.`);
 const editedByDirector=await director.client.rpc('event_edit_person',{p_member:ids.staff,p_name:'Staff editado pelo diretor',p_email:'',p_phone:'111',p_function:'',p_area:'',p_job_title:''});assert.ifError(editedByDirector.error);
 const editedByStaff=await status(staff,'rpc/event_edit_person',{p_member:ids.other,p_name:'Nope',p_email:'',p_phone:'',p_function:''});assert.equal(editedByStaff.status,403);
 console.log('API: diretor edita contato (permitido); staff editar contato retorna HTTP 403.');

 // ---- Interface do card ----------------------------------------------------------------
 const mocks=`import React from 'react'; export const supabase=new Proxy({},{get:(_,key)=>globalThis.__team74.client[key]}); export const useEvent=()=>globalThis.__team74.context; export const useEventField=(key,initial)=>React.useState(initial); export const Panel=({children})=>React.createElement('section',null,children); export const PageHeader=({title,actions})=>React.createElement('header',null,React.createElement('h1',null,title),actions); export const initials=()=>''; export const Field=({label,value,onChange,...props})=>React.createElement('label',null,label,React.createElement('input',{...props,'aria-label':label,value,onChange:e=>onChange(e.target.value)})); export const Button=({children,variant,size,...props})=>React.createElement('button',props,children); export const Dialog=({children,open})=>open?React.createElement('div',{role:'dialog'},children):null; export const DialogContent=({children})=>React.createElement('div',null,children); export const DialogHeader=DialogContent; export const DialogTitle=DialogContent; export const DialogDescription=DialogContent; export const DialogFooter=DialogContent; export const Input=props=>React.createElement('input',props);`;
 await writeFile(join(dir,'mocks.mjs'),mocks);
 const maps={'@/context/EventContext':'./mocks.mjs','@/api/supabaseClient':'./mocks.mjs','@/lib/useEventField':'./mocks.mjs','@/components/common/ReferenceUI':'./mocks.mjs','@/components/ui/button':'./mocks.mjs','@/components/ui/dialog':'./mocks.mjs','@/components/ui/input':'./mocks.mjs','@/components/ui/alert-dialog':'./alert.mjs','@/components/EventInvites':'./invites.mjs','@/components/TeamCatalog':'./catalog.mjs','@/hooks/useTeamCatalog':'./hook.mjs','@/components/common/SearchSuggestions':'./search.mjs',...supportImports};
 for(const [input,output] of [['src/components/EventTeam.jsx','team.mjs'],['src/components/EventInvites.jsx','invites.mjs'],['src/components/TeamCatalog.jsx','catalog.mjs'],['src/hooks/useTeamCatalog.js','hook.mjs'],['src/components/common/SearchSuggestions.jsx','search.mjs']])await transpile(input,join(dir,output),maps);
 const {default:Team}=await import(pathToFileURL(join(dir,'team.mjs')));
 const pause=()=>new Promise(r=>setTimeout(r,120));
 const mount=async(viewer,{asAccess}={})=>{
  if(tree)act(()=>tree.unmount());
  const load=async()=>{
   const [mine]=await rpc(viewer.client,'event_list');
   const [full]=asAccess?await rpc(director.client,'event_list'):[mine];
   globalThis.__team74={client:viewer.client,context:{currentEvent:full.document,access:{...mine,document:undefined},orgId:mine.organizationId,flush:async()=>{},reloadEvents:async()=>{await load();tree.update(React.createElement(Team));}}};
  };
  await load();
  await act(async()=>{tree=create(React.createElement(Team));await pause();});
 };
 const buttons=()=>tree.root.findAllByType('button').map(b=>b.children.join(''));
 const button=label=>tree.root.findAllByType('button').find(b=>b.children.join('')===label);
 const alerts=()=>tree.root.findAll(node=>node.props.role==='alertdialog').length;
 const card=name=>tree.root.findAll(node=>node.props.role==='button' && node.props['aria-label']===`Gerenciar ${name}`)[0];
 const nameOf=async who=>(await rpc(founder.client,'event_list'))[0].document.staffMembers.find(p=>p.id===ids[who]).name;
 const closeModal=()=>act(()=>{(button('Cancelar') || button('Fechar')).props.onClick();});
 const cancelAlert=()=>act(()=>{tree.root.findAllByType('button').filter(b=>b.children.join('')==='Cancelar').at(-1).props.onClick();});

 // Fundador: teclado abre; promove com confirmação; rebaixa; remove.
 await mount(founder);
 const staffName=await nameOf('staff');
 assert.ok(card(staffName),'card do membro é clicável');
 assert.equal(card(staffName).props.tabIndex,0);
 act(()=>card(staffName).props.onKeyDown({key:'a',preventDefault(){}}));
 assert.equal(tree.root.findAll(node=>node.props.role==='dialog').length,0,'outras teclas não abrem');
 for(const key of ['Enter',' ']) {
  act(()=>card(staffName).props.onKeyDown({key,preventDefault(){}}));
  assert.equal(tree.root.findAll(node=>node.props.role==='dialog').length,1,`tecla "${key===' '?'Espaço':key}" abre o modal`);
  closeModal();
 }
 console.log('UI PASS: card de membro com role=button/tabIndex=0 abre o modal por clique, Enter e Espaço; outras teclas não abrem.');
 act(()=>card(staffName).props.onClick());
 assert.ok(buttons().includes('Promover a Diretor')&&buttons().includes('Remover da equipe')&&buttons().includes('Salvar pessoa'));
 act(()=>button('Promover a Diretor').props.onClick());
 assert.equal(alerts(),1);assert.equal(await roleOf('staff'),'staff','nada muda antes de confirmar');
 cancelAlert();
 assert.equal(await roleOf('staff'),'staff');
 act(()=>button('Promover a Diretor').props.onClick());
 await act(async()=>{await button('Sim, promover').props.onClick({preventDefault(){}});await pause();});
 assert.equal(await roleOf('staff'),'director');assert.equal(alerts(),0);
 assert.ok(buttons().includes('Tornar Staff'),'modal passa a oferecer rebaixar');
 assert.equal((await rpc(staff.client,'event_list'))[0].role,'director');
 console.log('UI/API PASS: fundador promove staff para diretor pelo modal do card, com AlertDialog; event_list do promovido já devolve role=director.');
 act(()=>button('Tornar Staff').props.onClick());
 assert.equal(alerts(),1);
 await act(async()=>{await button('Sim, tornar Staff').props.onClick({preventDefault(){}});await pause();});
 assert.equal(await roleOf('staff'),'staff');
 console.log('UI/API PASS: fundador rebaixa diretor para staff pelo mesmo modal.');
 closeModal();
 // Card do fundador: sem promover, rebaixar ou remover.
 const founderName=await nameOf('founder');
 act(()=>card(founderName).props.onClick());
 for(const label of ['Promover a Diretor','Tornar Staff','Remover da equipe'])assert.ok(!buttons().includes(label),`card do fundador não oferece "${label}"`);
 assert.ok(buttons().includes('Salvar pessoa'));
 console.log('UI PASS: card do fundador só oferece editar contato; sem promover, rebaixar ou remover.');
 closeModal();

 // Diretor: edita contato, nada de papel/remoção.
 await mount(director);
 const names={staff:await nameOf('staff'),director:await nameOf('director'),founder:await nameOf('founder')};
 for(const who of ['staff','director','founder']) {
  act(()=>card(names[who]).props.onClick());
  assert.ok(buttons().includes('Salvar pessoa'),`diretor edita contato (${who})`);
  for(const label of ['Promover a Diretor','Tornar Staff','Remover da equipe'])assert.ok(!buttons().includes(label),`diretor não vê "${label}" no card de ${who}`);
  closeModal();
 }
 console.log('UI PASS: diretor vê "Salvar pessoa" nos cards, mas nunca promover, rebaixar ou remover.');
 await act(async()=>{button('+ Nova pessoa').props.onClick();await pause();});
 const inviteText=JSON.stringify(tree.toJSON());
 for(const label of ['Copiar link de convite','Revogar código','Reativar código','Revogar link'])assert.ok(!buttons().includes(label),`diretor não vê "${label}"`);
 assert.ok(buttons().includes('Copiar código')&&inviteText.includes('Só o fundador cria e revoga links de convite.')&&inviteText.includes('Quem entra pelo código sempre vira Staff.')&&inviteText.includes('Código ativo'));
 console.log('UI PASS (MCT-73): diretor vê só o código (ativo, sempre Staff) e o aviso de que apenas o fundador cria/revoga links.');
 await mount(founder);
 await act(async()=>{button('+ Nova pessoa').props.onClick();await pause();});
 assert.ok(buttons().includes('Copiar link de convite')&&buttons().includes('Revogar código'));
 assert.ok(JSON.stringify(tree.toJSON()).includes('Ajuda na operação: vê tarefas, participantes e programação.')&&JSON.stringify(tree.toJSON()).includes('Gerencia o evento junto com você'));
 console.log('UI PASS (MCT-73): fundador vê papéis Staff/Diretor descritos em uma linha, "Copiar link de convite" e "Revogar código".');

 // Staff (acesso real de staff sobre a lista da equipe): somente leitura.
 await mount(staff,{asAccess:true});
 const staffViewName=await nameOf('other');
 act(()=>card(staffViewName).props.onClick());
 for(const label of ['Salvar pessoa','Promover a Diretor','Tornar Staff','Remover da equipe'])assert.ok(!buttons().includes(label),`staff não vê "${label}"`);
 assert.ok(buttons().includes('Fechar'));
 console.log('UI PASS: staff vê o card só para leitura, sem salvar, promover, rebaixar ou remover.');

 // Remoção: confirmação modal; histórico e tarefas preservados.
 await mount(founder);
 const otherName=await nameOf('other');
 act(()=>card(otherName).props.onClick());
 act(()=>button('Remover da equipe').props.onClick());
 assert.equal(alerts(),1);assert.equal((await members()).length,4);
 cancelAlert();
 assert.equal((await members()).length,4,'cancelar não remove');
 act(()=>button('Remover da equipe').props.onClick());
 await act(async()=>{await button('Remover').props.onClick({preventDefault(){}});await pause();});
 assert.equal((await members()).length,3);
 console.log('UI/API PASS: remover exige AlertDialog; cancelar mantém a pessoa; confirmar remove da equipe ativa.');
 // Remover quem tem tarefa: vínculo revogado, tarefa e histórico preservados.
 await mount(founder);
 const removedName=await nameOf('staff');
 act(()=>card(removedName).props.onClick());
 act(()=>button('Remover da equipe').props.onClick());
 await act(async()=>{await button('Remover').props.onClick({preventDefault(){}});await pause();});
 assert.equal((await members()).length,2);
 const kept=(await rpc(founder.client,'event_list'))[0].document;
 assert.ok(kept.tasks.some(task=>task.id==='t1'&&task.ownerId===ids.staff),'tarefa do removido continua no evento');
 const link=await admin.from('event_members').select('removed_at,role').eq('id',ids.staff).single();assert.ifError(link.error);assert.ok(link.data.removed_at,'vínculo só foi revogado, não apagado');
 assert.deepEqual(await rpc(staff.client,'event_list'),[]);
 console.log(`UI/API PASS: remover membro com tarefa revoga o vínculo (removed_at=${link.data.removed_at}); tarefa t1 e linha em event_members continuam; JWT do removido vê 0 eventos.`);
} finally {if(tree)act(()=>tree.unmount());delete globalThis.__team74;await rm(dir,{recursive:true,force:true});}
