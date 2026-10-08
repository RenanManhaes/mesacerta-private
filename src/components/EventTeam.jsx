import {useState} from 'react';
import {useEventField} from '@/lib/useEventField';
import {useEvent} from '@/context/EventContext';
import {supabase} from '@/api/supabaseClient';
import EventInvites from '@/components/EventInvites';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import {useTeamCatalog} from '@/hooks/useTeamCatalog';
import {taskOwnerIds} from '@/lib/taskOwners';
import {CatalogField,TeamCatalogManager} from '@/components/TeamCatalog';
import {PageHeader,Panel,Field,initials} from '@/components/common/ReferenceUI';
import {Button} from '@/components/ui/button';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription,DialogFooter} from '@/components/ui/dialog';
import {ROLE_LABEL,ROLE_HINT,teamPermissions} from '@/lib/teamRoles';

export default function EventTeam() {
  const {currentEvent:ev,access,flush,reloadEvents,orgId} = useEvent();
  const catalog=useTeamCatalog(orgId);
  const [catalogOpen,setCatalogOpen]=useState(false);
  const [draft,setDraft] = useEventField('staff.draft',null);
  const [search,setSearch] = useEventField('staff.search','');
  const [invite,setInvite] = useState(false), [confirm,setConfirm] = useState(null), [error,setError] = useState(''), [pending,setPending] = useState(false), [roleOverride,setRoleOverride] = useState({});
  const members=ev.staffMembers || [];
  const filtered=members.filter(p=>`${p.name} ${p.role} ${p.function || ''}`.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')));
  // O papel mostrado vem da lista atual da equipe; o rascunho pode ter sido gravado antes de uma mudança.
  const liveRole=draft ? (roleOverride[draft.id] ?? members.find(p=>p.id===draft.id)?.accessRole ?? draft.accessRole) : undefined;
  const perms=draft ? teamPermissions(access?.role,access?.memberId,{...draft,accessRole:liveRole}) : null;
  const open=person=>{setError('');setConfirm(null);setDraft({...person});};
  const close=()=>{setDraft(null);setConfirm(null);setError('');};
  const run=async(action,onDone)=>{
    setPending(true);setError('');
    try {
      await flush();
      await action();
      onDone();reloadEvents();
    } catch(err){setError(err.message);} finally{setPending(false);}
  };
  const save=e=>{
    e.preventDefault();
    return run(async()=>{
      const {error}=await supabase.rpc('event_edit_person',{p_member:draft.id,p_name:draft.name,p_email:draft.email || '',p_phone:draft.phone || '',p_function:draft.function || '',p_area:draft.area || '',p_job_title:draft.jobTitle || ''});
      if(error)throw error;
    },()=>setDraft(null));
  };
  const removePerson=()=>run(async()=>{
    const {error}=await supabase.rpc('event_remove_person',{p_member:draft.id});
    if(error)throw error;
  },close);
  const changeRole=()=>run(async()=>{
    const {error}=await supabase.rpc('event_change_role',{p_member:draft.id,p_role:perms.nextRole});
    if(error)throw error;
  },()=>{setRoleOverride(map=>({...map,[draft.id]:perms.nextRole}));setConfirm(null);});
  const set=(key,value)=>setDraft(d=>({...d,[key]:value}));
  const keyOpen=person=>event=>{if(event.key==='Enter' || event.key===' '){event.preventDefault();open(person);}};
  const promoting=perms?.nextRole==='director';
  return <div className="reference-page">
    <PageHeader eyebrow="Planejamento" title="Equipe do evento" subtitle="Pessoas com acesso a este evento." actions={<><Button onClick={()=>setInvite(true)}>+ Nova pessoa</Button><Button variant="outline" onClick={()=>setCatalogOpen(true)}>Funções e áreas</Button></>} />
    <Panel title="Equipe do evento" extra={<span>{members.length} pessoas</span>}>
      <Field label="Buscar pessoa" value={search} onChange={setSearch} />
      <div className="grid md:grid-cols-2 gap-4 mt-4">{filtered.map(person=><div key={person.id} role="button" tabIndex={0} onClick={()=>open(person)} onKeyDown={keyOpen(person)} className="cursor-pointer rounded-xl border p-4 text-left transition-colors hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" aria-label={`Gerenciar ${person.name}`}>
        <span>{initials(person.name)}</span><strong className="block">{person.name}</strong>
        <p>{person.role}{person.jobTitle ? ` · ${person.jobTitle}` : ''}{person.function ? ` · ${person.function}` : ''}</p>
        <p className="text-sm">{person.email} {person.phone}</p>
        <p className="text-xs">{(ev.tasks || []).filter(task=>taskOwnerIds(task).includes(person.id) && task.status!=='Concluído').length} tarefas pendentes</p>
        <p className="mt-2 text-xs text-primary">Gerenciar ›</p>
      </div>)}</div>
      {!filtered.length && <p>Nenhuma pessoa encontrada.</p>}
    </Panel>
    <Dialog open={invite} onOpenChange={setInvite}><DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Nova pessoa</DialogTitle><DialogDescription>Escolha o papel e copie o convite para enviar.</DialogDescription></DialogHeader><EventInvites embedded /></DialogContent></Dialog>
    <Dialog open={!!draft} onOpenChange={value=>{if(!value)close();}}><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{draft?.name || 'Pessoa'}</DialogTitle><DialogDescription>Contato, função e acesso ao evento. Alterar e-mail aqui não muda o login da conta.</DialogDescription></DialogHeader>
      {draft && <form onSubmit={save} className="space-y-4">
        {perms.canEdit ? <>
          <Field label="Nome" required value={draft.name} onChange={value=>set('name',value)} />
          <Field label="E-mail" type="email" value={draft.email || ''} onChange={value=>set('email',value)} />
          <Field label="Telefone" type="tel" value={draft.phone || ''} onChange={value=>set('phone',value)} />
          <CatalogField label="Função" kind="function" value={draft.function || ''} onChange={value=>set('function',value)} catalog={catalog} />
          <CatalogField label="Área" kind="area" value={draft.area || ''} onChange={value=>set('area',value)} catalog={catalog} />
          <CatalogField label="Cargo" kind="title" value={draft.jobTitle || ''} onChange={value=>set('jobTitle',value)} catalog={catalog} />
          <p className="-mt-2 text-xs text-muted-foreground" data-testid="cargo-hint">Cargo é só o nome que aparece na equipe. O acesso não muda.</p>
        </> : <p className="text-sm">{[draft.email,draft.phone,draft.function,draft.area,draft.jobTitle].filter(Boolean).join(' · ') || 'Sem dados de contato.'}</p>}
        <section className="space-y-2 rounded-xl border p-3" aria-label="Acesso ao evento">
          <p className="text-sm font-medium">Acesso: {ROLE_LABEL[liveRole] || draft.role}</p>
          <p className="text-sm text-muted-foreground">{ROLE_HINT[liveRole] || ''}</p>
          {perms.canChangeRole && <Button disabled={pending} variant="outline" type="button" onClick={()=>{setError('');setConfirm('role');}}>{promoting?'Promover a Diretor':'Tornar Staff'}</Button>}
          {perms.canRemove && <Button disabled={pending} variant="outline" type="button" className="text-danger" onClick={()=>{setError('');setConfirm('remove');}}>Remover da equipe</Button>}
          {!perms.canChangeRole && !perms.canRemove && liveRole!=='founder' && <p className="text-xs text-muted-foreground">Só o fundador muda o acesso ou remove pessoas.</p>}
        </section>
        {error && !confirm && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" type="button" onClick={close}>{perms.canEdit?'Cancelar':'Fechar'}</Button>
          {perms.canEdit && <Button disabled={pending} type="submit">Salvar pessoa</Button>}
        </DialogFooter>
      </form>}
    </DialogContent></Dialog>
    <ConfirmDialog open={confirm==='remove'} onOpenChange={value=>{if(!value)setConfirm(null);}} destructive pending={pending} error={confirm==='remove'?error:''}
      title={`Remover ${draft?.name || 'esta pessoa'} da equipe?`} description="A pessoa perde o acesso ao evento. Tarefas e histórico continuam salvos."
      confirmLabel="Remover" pendingLabel="Removendo…" onConfirm={removePerson} />
    <ConfirmDialog open={confirm==='role'} onOpenChange={value=>{if(!value)setConfirm(null);}} pending={pending} error={confirm==='role'?error:''}
      title={promoting?`Promover ${draft?.name || 'esta pessoa'} a Diretor?`:`Tornar ${draft?.name || 'esta pessoa'} Staff?`}
      description={promoting?'Passa a ver e gerenciar todo o evento, inclusive o financeiro. Só o fundador muda papéis.':'Passa a ver só tarefas, participantes e programação.'}
      confirmLabel={promoting?'Sim, promover':'Sim, tornar Staff'} pendingLabel="Salvando…" onConfirm={changeRole} />
    <TeamCatalogManager open={catalogOpen} onOpenChange={setCatalogOpen} catalog={catalog} />
  </div>;
}
