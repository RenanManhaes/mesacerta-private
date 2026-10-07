import { useEffect, useId, useState } from 'react';
import { useEvent } from '@/context/EventContext';
import { supabase } from '@/api/supabaseClient';
import { Panel } from '@/components/common/ReferenceUI';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { ROLE_LABEL, INVITE_HINT } from '@/lib/teamRoles';

export function invitationUrl(code, invitation) {
  return `${window.location.origin}/entrar?${new URLSearchParams({codigo: code, convite: invitation})}`;
}

const fetchInvitations = eventId => supabase.from('event_invitations').select('id,role,revoked_at,created_at').eq('event_id', eventId).order('created_at', {ascending: false});
const formatDay = value => value ? new Date(value).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'}) : '';

function Status({active, on, off}) {
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${active ? 'bg-positive/15 text-positive' : 'bg-muted text-muted-foreground'}`}>{active ? on : off}</span>;
}

/** Convite da equipe (MCT-73). Link com papel escolhido é a ação principal; o código é a alternativa. */
export default function EventInvites({embedded = false}) {
  const {currentEvent, access, reloadEvents, flush} = useEvent();
  const groupName = useId();
  const [role, setRole] = useState('staff');
  const [invitations, setInvitations] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [manual, setManual] = useState('');
  const [pending, setPending] = useState(false);
  const [revoking, setRevoking] = useState(null);
  const founder = access?.role === 'founder';
  const load = async () => {
    const {data, error} = await fetchInvitations(currentEvent.id);
    if (error) throw error;
    setInvitations(data);
  };
  useEffect(() => {
    let active = true;
    fetchInvitations(currentEvent.id).then(({data, error}) => {
      if (active) {setInvitations(data || []); if (error) setError(error.message);}
    });
    return () => {active = false;};
  }, [currentEvent.id]);
  const perform = async action => {
    setPending(true); setError(''); setMessage('');
    try {await action(); return true;} catch (err) {setError(err.message); return false;} finally {setPending(false);}
  };
  const copy = async (text, done) => {
    try {
      await navigator.clipboard.writeText(text);
      setManual(''); setMessage(done);
    } catch {
      setManual(text); setError('Não foi possível copiar sozinho. Copie o texto abaixo.');
    }
  };
  const createLink = () => perform(async () => {
    const {data, error} = await supabase.rpc('event_invite', {p_event: currentEvent.id, p_role: role});
    if (error) throw error;
    await load();
    await copy(invitationUrl(access.code, data), 'Link copiado. Envie para a pessoa.');
  });
  const reactivateCode = () => perform(async () => {
    await flush();
    const {error} = await supabase.rpc('event_code_enabled', {p_event: currentEvent.id, p_enabled: true});
    if (error) throw error;
    reloadEvents();
  });
  const confirmRevoke = async () => {
    const done = await perform(async () => {
      if (revoking.kind === 'code') {
        await flush();
        const {error} = await supabase.rpc('event_code_enabled', {p_event: currentEvent.id, p_enabled: false});
        if (error) throw error;
        reloadEvents();
      } else {
        const {error} = await supabase.rpc('event_revoke_invite', {p_invitation: revoking.invite.id});
        if (error) throw error;
        await load();
      }
    });
    if (done) setRevoking(null);
  };
  const codeOn = !!access?.codeEnabled;
  const revokingCode = revoking?.kind === 'code';
  const body = <div className="space-y-5">
    <p className="text-sm text-muted-foreground">A pessoa entra com a própria conta.</p>
    {founder ? <section className="space-y-3" aria-label="Convite por link">
      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-medium">O que a pessoa vai fazer?</legend>
        {['staff', 'director'].map(key => <label key={key} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${role === key ? 'border-primary bg-secondary' : ''}`}>
          <input type="radio" name={groupName} value={key} checked={role === key} onChange={() => setRole(key)} className="mt-1" />
          <span><strong className="block text-sm">{ROLE_LABEL[key]}</strong><span className="text-sm text-muted-foreground">{INVITE_HINT[key]}</span></span>
        </label>)}
      </fieldset>
      <Button disabled={pending} onClick={createLink}>Copiar link de convite</Button>
      <p className="text-xs text-muted-foreground">Cada clique cria um link novo com o papel escolhido.</p>
      {invitations.length > 0 && <div>
        <h4 className="text-sm font-medium">Links criados</h4>
        <ul className="divide-y">{invitations.map(invite => <li key={invite.id} className="flex flex-wrap items-center gap-2 py-2">
          <span className="min-w-0 flex-1 text-sm"><strong>{ROLE_LABEL[invite.role] || invite.role}</strong> <small className="text-muted-foreground">criado em {formatDay(invite.created_at)}</small></span>
          <Status active={!invite.revoked_at} on="Link ativo" off="Revogado" />
          {!invite.revoked_at && <>
            <Button size="sm" variant="outline" disabled={pending} onClick={() => perform(() => copy(invitationUrl(access.code, invite.id), 'Link copiado. Envie para a pessoa.'))}>Copiar link</Button>
            <Button size="sm" variant="outline" disabled={pending} onClick={() => {setError(''); setRevoking({kind: 'invite', invite});}}>Revogar link</Button>
          </>}
        </li>)}</ul>
      </div>}
    </section> : <p className="text-sm">Só o fundador cria e revoga links de convite.</p>}
    <section className="space-y-2 rounded-xl bg-secondary/60 p-3" aria-label="Código do evento">
      <h4 className="text-sm font-medium">Outra opção: código do evento</h4>
      <p className="text-sm">Código <strong className="tracking-widest">{access?.code}</strong> <Status active={codeOn} on="Código ativo" off="Código revogado" /></p>
      <p className="text-sm text-muted-foreground">Quem entra pelo código sempre vira Staff.</p>
      <div className="flex flex-wrap gap-2">
        {codeOn && <Button size="sm" variant="outline" disabled={pending} onClick={() => perform(() => copy(access.code, 'Código copiado.'))}>Copiar código</Button>}
        {founder && (codeOn
          ? <Button size="sm" variant="outline" disabled={pending} onClick={() => {setError(''); setRevoking({kind: 'code'});}}>Revogar código</Button>
          : <Button size="sm" variant="outline" disabled={pending} onClick={reactivateCode}>Reativar código</Button>)}
      </div>
    </section>
    {manual && <input readOnly aria-label="Texto para copiar" value={manual} onFocus={event => event.target.select()} className="w-full rounded-lg border p-2 text-sm" />}
    {message && <p role="status" className="text-sm text-positive">{message}</p>}
    {error && !revoking && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <ConfirmDialog open={!!revoking} onOpenChange={value => {if (!value) setRevoking(null);}} destructive pending={pending}
      title={revokingCode ? 'Revogar o código?' : `Revogar o link de ${ROLE_LABEL[revoking?.invite?.role] || 'convite'}?`}
      description={`Quem já entrou continua na equipe; ${revokingCode ? 'o código' : 'o link'} para de funcionar.`}
      confirmLabel="Revogar" pendingLabel="Revogando…" error={revoking ? error : ''} onConfirm={confirmRevoke} />
  </div>;
  return embedded ? body : <Panel title="Convite para a equipe">{body}</Panel>;
}
