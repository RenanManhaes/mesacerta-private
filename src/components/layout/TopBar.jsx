import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEvent } from '@/context/EventContext';
import { formatDateFull } from '@/lib/format';
import { Search, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusPill } from '@/components/common/Primitives';
import AddMenu from './AddMenu';
import { alerts as alertsFn } from '@/lib/selectors';

const statusLabel = { planejamento: 'Planejamento', confirmado: 'Confirmado', andamento: 'Em andamento', finalizado: 'Finalizado' };

export default function TopBar() {
  const { currentEvent } = useEvent();
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const attention = currentEvent ? alertsFn(currentEvent).filter(a => a.level !== 'ok').length : 0;

  const onSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/event/${currentEvent.id}/participantes?q=${encodeURIComponent(search)}`);
  };

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="flex items-center gap-4 px-5 sm:px-8 lg:px-12 h-14 pl-14 lg:pl-12">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="truncate text-[14px] font-medium">{currentEvent?.name}</span>
            <span className="hidden sm:inline text-muted-foreground">·</span>
            <span className="hidden sm:inline text-[13px] text-muted-foreground truncate">{currentEvent?.date && formatDateFull(currentEvent.date)}</span>
            {currentEvent && <StatusPill status={statusLabel[currentEvent.status] || currentEvent.status} className="hidden md:inline-flex" />}
          </div>
        </div>

        <form onSubmit={onSearch} className="hidden sm:block w-44 lg:w-56">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar participantes" className="h-8 pl-8 text-[13px] bg-card" />
          </div>
        </form>

        <Button variant="ghost" size="icon" className="h-8 w-8 relative" aria-label="Notificações" onClick={() => navigate(`/event/${currentEvent.id}/dashboard`)}>
          <Bell className="h-4 w-4" />
          {attention > 0 && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-danger" />}
        </Button>

        <AddMenu />
      </div>
    </header>
  );
}
