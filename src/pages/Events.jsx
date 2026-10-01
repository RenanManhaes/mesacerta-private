import React from 'react';
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
  return (
    <button onClick={() => navigate(`/event/${ev.id}/dashboard`)} className="group w-full text-left border-b border-border py-5 px-1 grid grid-cols-12 gap-4 items-center hover:bg-secondary/40 transition-colors">
      <div className="col-span-12 sm:col-span-5 min-w-0">
        <div className="text-[15px] font-medium tracking-tight">{ev.name}</div>
        <div className="mt-0.5 text-[13px] text-muted-foreground flex items-center gap-1.5">
          <MapPin className="h-3 w-3" /> {ev.location || ev.city || '—'}
        </div>
      </div>
      <div className="col-span-6 sm:col-span-3 text-[13px] text-muted-foreground">
        {formatDateFull(ev.date)}
        {ev.status !== 'finalizado' && ev.date && <span className="block text-[11px] text-muted-foreground/80 mt-0.5">em {daysUntil(ev.date)} dias</span>}
      </div>
      <div className="col-span-3 sm:col-span-2 text-[13px] text-muted-foreground flex items-center gap-1.5">
        <Users className="h-3 w-3" /> {ev.expectedAudience || 0}
      </div>
      <div className="col-span-3 sm:col-span-2 flex items-center justify-end gap-3">
        <StatusPill status={statusLabel[ev.status] || ev.status} />
        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
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
      <div className="border-t border-border">
        {events.map(ev => <EventRow key={ev.id} ev={ev} />)}
      </div>
    </section>
  );
}

export default function Events() {
  const { events } = useEvent();
  const navigate = useNavigate();
  const planning = events.filter(e => ['planejamento', 'confirmado'].includes(e.status));
  const upcoming = events.filter(e => e.status === 'andamento');
  const finished = events.filter(e => e.status === 'finalizado');

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-[1100px] mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-[5px] bg-primary text-primary-foreground"><span className="text-[11px] font-semibold">M</span></div>
            <span className="font-display text-[17px] tracking-tight">Mesa Certa</span>
          </div>
          <Button size="sm" className="h-8 gap-1.5 text-[13px]" onClick={() => navigate('/novo')}>
            <Plus className="h-3.5 w-3.5" /> Criar evento
          </Button>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto px-5 sm:px-8 py-10">
        <div className="mb-8">
          <h1 className="font-display text-[30px] leading-tight tracking-tight">Meus eventos</h1>
          <p className="mt-1 text-[14px] text-muted-foreground">Planeje, acompanhe e opere cada evento em um só lugar.</p>
        </div>

        <Group title="Em planejamento" hint={`${planning.length} evento${planning.length !== 1 ? 's' : ''}`} events={planning} />
        <Group title="Próximos" hint={`${upcoming.length} evento${upcoming.length !== 1 ? 's' : ''}`} events={upcoming} />
        <Group title="Finalizados" hint={`${finished.length} evento${finished.length !== 1 ? 's' : ''}`} events={finished} />
      </main>
    </div>
  );
}
