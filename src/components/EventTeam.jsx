import {useState} from 'react';
import {useEventField} from '@/lib/useEventField';
import {useEvent} from '@/context/EventContext';
import {supabase} from '@/api/supabaseClient';
import EventInvites from '@/components/EventInvites';
import {useTeamCatalog} from '@/hooks/useTeamCatalog';
import {CatalogField,TeamCatalogManager} from '@/components/TeamCatalog';
import {PageHeader,Panel,Field,initials} from '@/components/common/ReferenceUI';
import {Button} from '@/components/ui/button';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription,DialogFooter} from '@/components/ui/dialog';

export default function EventTeam() {
  const {currentEvent:ev,access,flush,reloadEvents,orgId} = useEvent();
  const catalog=useTeamCatalog(orgId);
  const [catalogOpen,setCatalogOpen]=useState(false);
  const [draft,setDraft] = useEventField('staff.draft',null);
  const [search,setSearch] = useEventField('staff.search','');
  const [invite,setInvite] = useState(false), [remove,setRemove] = useState(false), [error,setError] = useState(''), [pending,setPending] = useState(false);
  const members=ev.staffMembers || [];
  const filtered=members.filter(p=>`${p.name} ${p.role} ${p.function || ''}`.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')));
  const save=async e=>{
    e.preventDefault();setPending(true);setError('');
    try {
      await flush();
      const {error}=await supabase.rpc('event_edit_person',{p_member:draft.id,p_name:draft.name,p_email:draft.email || '',p_phone:draft.phone || '',p_function:draft.function || '',p_area:draft.area || '',p_job_title:draft.jobTitle || ''});
      if(error)throw error;
      setDraft(null);reloadEvents();
    } catch(err){setError(err.message);} finally{setPending(false);}
  };
  const removePerson=async()=>{
    setPending(true);setError('');
    try {
      await flush();
      const {error}=await supabase.rpc('event_remove_person',{p_member:draft.id});
      if(error)throw error;
      setRemove(false);setDraft(null);reloadEvents();
    } catch(err){setError(err.message);} finally{setPending(false);}
  };
  const set=(key,value)=>setDraft(d=>({...d,[key]:value}));
  return <div className="reference-page">
    <PageHeader eyebrow="Planejamento" title="Equipe do evento" subtitle="Pessoas com acesso a este evento." actions={<><Button onClick={()=>setInvite(true)}>+ Nova pessoa</Button><Button variant="outline" onClick={()=>setCatalogOpen(true)}>Funções e áreas</Button></>} />
    <Panel title="Equipe do evento" extra={<span>{members.length} pessoas</span>}>
      <Field label="Buscar pessoa" value={search} onChange={setSearch} />
      <div className="grid md:grid-cols-2 gap-4 mt-4">{filtered.map(person=><button key={person.id} onClick={()=>{setError('');setRemove(false);setDraft({...person});}} className="rounded-xl border p-4 text-left" aria-label={`Editar ${person.name}`}>
        <span>{initials(person.name)}</span><strong className="block">{person.name}</strong>
        <p>{person.role}{person.jobTitle ? ` · ${person.jobTitle}` : ''}{person.function ? ` · ${person.function}` : ''}</p>
        <p className="text-sm">{person.email} {person.phone}</p>
        <p className="text-xs">{(ev.tasks || []).filter(task=>task.ownerId===person.id && task.status!=='Concluído').length} tarefas pendentes</p>
      </button>)}</div>
      {!filtered.length && <p>Nenhuma pessoa encontrada.</p>}
    </Panel>
    <Dialog open={invite} onOpenChange={setInvite}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Nova pessoa</DialogTitle><DialogDescription>Compartilhe o código ou gere um link. A pessoa entra com a própria conta.</DialogDescription></DialogHeader><EventInvites /></DialogContent></Dialog>
    <Dialog open={!!draft} onOpenChange={open=>{if(!open){setDraft(null);setRemove(false);}}}><DialogContent><DialogHeader><DialogTitle>Editar pessoa</DialogTitle><DialogDescription>Dados de contato da equipe. Alterar e-mail aqui não muda o login da conta.</DialogDescription></DialogHeader>
      {draft && <form onSubmit={save} className="space-y-4">
        <Field label="Nome" required value={draft.name} onChange={value=>set('name',value)} />
        <Field label="E-mail" type="email" value={draft.email || ''} onChange={value=>set('email',value)} />
        <Field label="Telefone" type="tel" value={draft.phone || ''} onChange={value=>set('phone',value)} />
        <CatalogField label="Função" kind="function" value={draft.function || ''} onChange={value=>set('function',value)} catalog={catalog} />
        <CatalogField label="Área" kind="area" value={draft.area || ''} onChange={value=>set('area',value)} catalog={catalog} />
        <CatalogField label="Cargo" kind="title" value={draft.jobTitle || ''} onChange={value=>set('jobTitle',value)} catalog={catalog} disabled={draft.accessRole==='founder'} />
        <p>Papel de acesso: {draft.accessRole==='founder'?'Fundador':draft.role}. O fundador altera papéis em Configurações.</p>
        {error && <p role="alert">{error}</p>}
        {remove && <div role="alert"><p>Remover {draft.name} da equipe? O acesso será revogado. Tarefas e histórico serão preservados.</p><Button disabled={pending} type="button" onClick={removePerson}>Confirmar remoção</Button><Button variant="outline" type="button" onClick={()=>setRemove(false)}>Cancelar remoção</Button></div>}
        <DialogFooter>
          {access?.role==='founder' && draft.accessRole!=='founder' && <Button disabled={pending} variant="outline" type="button" onClick={()=>setRemove(true)}>Remover da equipe</Button>}
          <Button variant="outline" type="button" onClick={()=>setDraft(null)}>Cancelar</Button>
          <Button disabled={pending} type="submit">Salvar pessoa</Button>
        </DialogFooter>
      </form>}
    </DialogContent></Dialog>
    <TeamCatalogManager open={catalogOpen} onOpenChange={setCatalogOpen} catalog={catalog} />
  </div>;
}
