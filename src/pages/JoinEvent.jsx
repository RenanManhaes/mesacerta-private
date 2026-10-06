import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useEvent } from '@/context/EventContext';
import { supabase } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function JoinEvent() {
  const [params] = useSearchParams();
  const [code, setCode] = useState(params.get('codigo') || '');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const { isAuthenticated } = useAuth();
  const { reloadEvents, flush } = useEvent();
  const navigate = useNavigate();
  const invitation = params.get('convite');
  const returnTo = `/entrar?${new URLSearchParams({codigo: code, ...(invitation ? {convite: invitation} : {})})}`;
  const join = async e => {
    e.preventDefault(); setError(''); setPending(true);
    try {
      await flush();
      const {data, error: failure} = await supabase.rpc('event_join', {p_code: code, p_invitation: invitation});
      if (failure) throw failure;
      reloadEvents(); navigate(`/event/${data.id}/dashboard`);
    } catch (err) {setError(err.message);} finally {setPending(false);}
  };
  return <main className="platform-ui max-w-lg mx-auto p-8 space-y-5">
    <h1 className="text-2xl">Entrar em um evento</h1>
    <p>{invitation ? 'O papel de acesso será o definido neste convite.' : 'O código do evento concede acesso como staff.'}</p>
    <form onSubmit={join} className="space-y-4">
      <label htmlFor="event-code">Código do evento</label>
      <Input id="event-code" required maxLength={8} value={code} onChange={e => setCode(e.target.value.toUpperCase())} autoComplete="off" />
      {error && <p role="alert">{error}</p>}
      {isAuthenticated ? <Button disabled={pending || !code.trim()} type="submit">{pending ? 'Entrando…' : 'Entrar no evento'}</Button> : <div className="flex gap-4">
        <Link to={`/login?returnTo=${encodeURIComponent(returnTo)}`}>Entrar na conta</Link>
        <Link to={`/register?returnTo=${encodeURIComponent(returnTo)}`}>Criar conta</Link>
      </div>}
    </form>
    <Link to="/eventos">Voltar para meus eventos</Link>
  </main>;
}
