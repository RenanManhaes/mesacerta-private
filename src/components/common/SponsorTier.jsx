import {Gem,Crown,Medal,Handshake} from 'lucide-react';
import {sponsorTierName} from '@/lib/sponsorTier';
export default function SponsorTier({name}) {
  const tier=sponsorTierName(name);
  const Icon=({Diamante:Gem,Ouro:Crown,Prata:Medal})[tier] || Handshake;
  const color=({Diamante:'text-blue-600',Ouro:'text-amber-600',Prata:'text-slate-500'})[tier] || 'text-muted-foreground';
  return <span className="inline-flex items-center gap-1.5 align-middle"><Icon size={15} className={color} aria-hidden="true"/>{tier || 'Sem plano'}</span>;
}
