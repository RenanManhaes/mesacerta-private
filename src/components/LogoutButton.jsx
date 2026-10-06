import { useOptionalEvent } from '@/context/EventContext';
import { useState } from 'react';
import { LogOut, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

/** @param {{className?: string}} props */
export default function LogoutButton({ className }) {
  const event = useOptionalEvent();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [pending, setPending] = useState(false);
  const leave = async () => {
    if (pending) return;
    setPending(true);
    try {
      try { await event?.flush(); } catch { event?.exportBackup(); }
      await signOut();
      // Recarrega de verdade para descartar dado privado em memoria, e cai na
      // tela de login, que e onde a pessoa espera chegar depois de sair.
      window.location.replace('/login');
    } catch {
      setPending(false);
      toast({ title: 'Não foi possível sair', description: 'Confira o salvamento dos eventos e tente novamente.', variant: 'destructive' });
    }
  };
  return <Button type="button" variant="outline" size="sm" className={className} onClick={leave} disabled={pending} aria-label={pending ? 'Saindo da conta' : 'Sair da conta'}>
    {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <LogOut className="h-4 w-4" aria-hidden="true" />}
    {pending ? 'Saindo…' : 'Sair'}
  </Button>;
}
