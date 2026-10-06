import {useEffect,useState} from 'react';
import {useEvent} from '@/context/EventContext';
import {supabase} from '@/api/supabaseClient';
import {Panel} from '@/components/common/ReferenceUI';

export default function EventRoles() {
  const {currentEvent,access} = useEvent();
  const [team,setTeam] = useState([]), [error,setError] = useState(''), [pending,setPending] = useState(false);
  useEffect(() => {
    let active = true;
    supabase.rpc('event_team',{p_event:currentEvent.id}).then(({data,error})=>{if(active){setTeam(data || []);setError(error?.message || '');}});
    return ()=>{active=false;};
  },[currentEvent.id]);
  const change = async (id,role) => {
    setPending(true);setError('');
    const {error} = await supabase.rpc('event_change_role',{p_member:id,p_role:role});
    if(error)setError(error.message);else setTeam(rows=>rows.map(row=>row.id===id?{...row,role}:row));
    setPending(false);
  };
  return <Panel title="Papéis de acesso">
    {team.map(person=><div key={person.id} className="flex justify-between gap-4 my-3">
      <span>{person.name} <small>{person.email}</small></span>
      {person.role==='founder'?<span>Fundador</span>:<select aria-label={`Papel de ${person.name}`} value={person.role} disabled={pending || access?.role!=='founder'} onChange={e=>change(person.id,e.target.value)}><option value="staff">Staff</option><option value="director">Diretor</option></select>}
    </div>)}
    <p className="text-sm">Somente o fundador altera papéis. A mudança vale no banco imediatamente e aparece no próximo carregamento da pessoa.</p>
    {error && <p role="alert">{error}</p>}
  </Panel>;
}
