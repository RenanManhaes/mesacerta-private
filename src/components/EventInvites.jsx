import { useEffect, useState } from 'react';
import { useEvent } from '@/context/EventContext';
import { supabase } from '@/api/supabaseClient';
import { Panel } from '@/components/common/ReferenceUI';
import { Button } from '@/components/ui/button';

export function invitationUrl(code, invitation) {
  return `${window.location.origin}/entrar?${new URLSearchParams({codigo: code, convite: invitation})}`;
}

export default function EventInvites() {
  const {currentEvent, access, reloadEvents, flush} = useEvent();
  const [role, setRole] = useState('staff');
  const [invitations, setInvitations] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const founder = access?.role === 'founder';
  const load = async () => {
    const {data, error} = await supabase.from('event_invitations').select('id,role,revoked_at').eq('event_id', currentEvent.id).order('created_at', {ascending: false});
    if (error) throw error;
    setInvitations(data);
  };
  useEffect(() => {
    let active = true;
    supabase.from('event_invitations').select('id,role,revoked_at').eq('event_id', currentEvent.id).order('created_at', {ascending: false}).then(({data, error}) => {
      if (active) {setInvitations(data || []); if (error) setError(error.message);}
    });
    return () => {active = false;};
  }, [currentEvent.id]);
  const perform = async action => {
    setPending(true); setError(''); setMessage('');
    try {await action();} catch (err) {setError(err.message);} finally {setPending(false);}
  };
  const copy = async text => {await navigator.clipboard.writeText(text); setMessage('Copiado.');};
  return <Panel title="Código e convites do evento">
    <p>Código: <strong>{access?.code}</strong> — {access?.codeEnabled ? 'ativo' : 'revogado'}</p>
    <Button variant="outline" onClick={() => perform(() => copy(access.code))}>Copiar código</Button>
    <p className="text-sm my-3">O código dá acesso staff. O link individual concede o papel escolhido. Revogar impede novas entradas; acessos já aceitos permanecem.</p>
    {founder && <>
      <label>Papel do convite <select aria-label="Papel do convite" value={role} onChange={e => setRole(e.target.value)}><option value="staff">Staff</option><option value="director">Diretor</option></select></label>
      <Button disabled={pending} onClick={() => perform(async () => {
        const {data, error} = await supabase.rpc('event_invite', {p_event: currentEvent.id, p_role: role});
        if (error) throw error;
        await load(); await copy(invitationUrl(access.code, data));
      })}>Gerar e copiar link de convite</Button>
      <Button variant="outline" disabled={pending} onClick={() => perform(async () => {
        await flush();
        const {error} = await supabase.rpc('event_code_enabled', {p_event: currentEvent.id, p_enabled: !access.codeEnabled});
        if (error) throw error;
        reloadEvents();
      })}>{access?.codeEnabled ? 'Revogar código' : 'Reativar código'}</Button>
      {invitations.map(invite => <div key={invite.id} className="flex gap-3 items-center my-3">
        <span>{invite.role === 'director' ? 'Diretor' : 'Staff'} — {invite.revoked_at ? 'revogado' : 'ativo'}</span>
        {!invite.revoked_at && <>
          <Button variant="outline" onClick={() => perform(() => copy(invitationUrl(access.code, invite.id)))}>Copiar link</Button>
          <Button variant="outline" disabled={pending} onClick={() => perform(async () => {
            const {error} = await supabase.rpc('event_revoke_invite', {p_invitation: invite.id});
            if (error) throw error;
            await load();
          })}>Revogar convite</Button>
        </>}
      </div>)}
    </>}
    {message && <p role="status">{message}</p>}
    {error && <p role="alert">{error}</p>}
  </Panel>;
}
