import React from 'react';
import EventBackupImport from '@/components/EventBackupImport';
import {eventHome} from '@/lib/eventAccess';
import LogoutButton from '@/components/LogoutButton';
import { useNavigate } from 'react-router-dom';
import { useEvent } from '@/context/EventContext';
import { Button } from '@/components/ui/button';
import { formatDateFull, daysUntil } from '@/lib/format';
import { Plus, MapPin, Users, ArrowRight } from 'lucide-react';
import { StatusPill } from '@/components/common/Primitives';

const statusOrder = ['planejamento', 'confirmado', 'andamento', 'finalizado'];
const statusLabel = { planejamento: 'Planejamento', confirmado: 'Confirmado', andamento: 'Em andamento', finalizado: 'Finalizado' };

function EventRow({ ev }) {
  const navigate = useNavigate();
  const {eventAccess} = useEvent();
  return (
    <button onClick={() => navigate(eventHome(ev.id,eventAccess[ev.id]))} className="platform-event group w-full">
      <div className="platform-event-cover">{statusLabel[ev.status] || ev.status}</div>
      <div className="platform-event-body">
      <div className="min-w-0">
        <h3>{ev.name}</h3>
        <div className="mt-0.5 text-[13px] text-muted-foreground flex items-center gap-1.5">
          <MapPin className="h-3 w-3" /> {ev.location || ev.city || '—'}
        </div>
      </div>
      <div className="text-[13px] text-muted-foreground">
        {formatDateFull(ev.date)}
        {ev.status !== 'finalizado' && ev.date && <span className="block text-[11px] text-muted-foreground/80 mt-0.5">em {daysUntil(ev.date)} dias</span>}
      </div>
      <div className="text-[13px] text-muted-foreground flex items-center gap-1.5">
        <Users className="h-3 w-3" /> {ev.expectedAudience || 0}
      </div>
      <div className="flex items-center justify-between gap-3">
        <StatusPill status={statusLabel[ev.status] || ev.status} />
        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      </div>
    </button>
  );
}

function Group({ title, hint, events }) {
  if (!events.length) return null;
  return (
    <section className="mb-10">
      <div className="flex items-baseline justify-between mb-1">
        <h2 className="text-[13px] font-medium uppercase tracking-[0.12em] text-muted-foreground">{title}</h2>
        {hint && <span className="text-[12px] text-muted-foreground">{hint}</span>}
      </div>
      <div className="platform-events mt-4">
        {events.map(ev => <EventRow key={ev.id} ev={ev} />)}
      </div>
    </section>
  );
}

export default function Events() {
  const { events, updateEventById } = useEvent();
  const navigate = useNavigate();
  const planning = events.filter(e => !e.archived && ['planejamento', 'confirmado'].includes(e.status));
  const upcoming = events.filter(e => !e.archived && e.status === 'andamento');
  const finished = events.filter(e => !e.archived && e.status === 'finalizado');

  return (
    <div className="platform-ui min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-[1100px] mx-auto px-5 sm:px-8 min-h-14 py-3 flex flex-wrap gap-3 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="platform-mark" aria-hidden="true"><i /><i /><i /><i /></span>
            <span className="font-display font-bold text-[18px] tracking-tight">Mesa Certa</span>
          </div>
          <div className="flex items-center gap-2">
          <Button size="sm" className="h-8 gap-1.5 text-[13px]" onClick={() => navigate('/novo')}>
            <Plus className="h-3.5 w-3.5" /> Criar evento
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/entrar')}>Entrar em um evento</Button>
          <LogoutButton className="h-8 gap-1.5 text-[13px]" />
          </div>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto px-5 sm:px-8 py-10">
        <div className="mb-8">
          <p className="platform-eyebrow mb-2">Organização</p>
          <h1 className="font-display text-[30px] leading-tight tracking-tight">Meus eventos</h1>
          <p className="mt-1 text-[14px] text-muted-foreground">Planeje, acompanhe e opere cada evento em um só lugar.</p>
        </div>

        <Group title="Em planejamento" hint={`${planning.length} evento${planning.length !== 1 ? 's' : ''}`} events={planning} />
        <Group title="Próximos" hint={`${upcoming.length} evento${upcoming.length !== 1 ? 's' : ''}`} events={upcoming} />
        <Group title="Finalizados" hint={`${finished.length} evento${finished.length !== 1 ? 's' : ''}`} events={finished} />
        {events.some(e=>e.archived) && <details className="platform-panel"><summary className="cursor-pointer">Eventos arquivados</summary>{events.filter(e=>e.archived).map(e=><div key={e.id} className="flex justify-between items-center gap-4 py-3"><span>{e.name}</span><Button variant="outline" onClick={()=>updateEventById(e.id,x=>({...x,archived:false}))}>Restaurar</Button></div>)}</details>}
        <EventBackupImport />
      </main>
    </div>
  );
}
