import React from 'react';
import { useEventField } from '@/lib/useEventField';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useEvent } from '@/context/EventContext';
import { formatDateFull } from '@/lib/format';
import { Search, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AddMenu from './AddMenu';
import LogoutButton from '@/components/LogoutButton';
import { alerts as alertsFn } from '@/lib/selectors';


export default function TopBar() {
  const { currentEvent, saveStatus } = useEvent();
  const navigate = useNavigate();
  const location = useLocation();
  const labels = { dashboard: 'Visão geral', programacao: 'Programação', tarefas: 'Tarefas', 'diretores-staffs': 'Diretores e Staffs', participantes: 'Participantes', fornecedores: 'Fornecedores', financeiro: 'Financeiro', receitas: 'Receitas', despesas: 'Despesas', patrocinios: 'Patrocínios', capacidade: 'Capacidade', networking: 'Networking', simulador: 'Simulador', configuracoes: 'Configurações' };
  const [search, setSearch] = useEventField('global.search', '');
  const attention = currentEvent ? alertsFn(currentEvent).filter(a => a.level !== 'ok').length : 0;

  const onSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/event/${currentEvent.id}/participantes?q=${encodeURIComponent(search)}`);
  };

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="flex items-center gap-2 sm:gap-4 px-5 sm:px-8 lg:px-9 h-16 pl-14 lg:pl-9">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <Link to="/eventos" className="hidden xl:inline text-[13px] text-muted-foreground">Eventos /</Link>
            <span className="truncate text-[14px] font-medium">{currentEvent?.name}</span>
            <span className="hidden sm:inline text-muted-foreground">·</span>
            <span className="hidden sm:inline text-[13px] font-semibold truncate">{labels[location.pathname.split('/').pop()] || (currentEvent?.date && formatDateFull(currentEvent.date))}</span>
            <span role="status" aria-live="polite" className="inline-flex text-xs text-muted-foreground items-center gap-2"><i className={`h-1.5 w-1.5 rounded-full ${saveStatus==='error'?'bg-danger':saveStatus==='saving'?'bg-warning':'bg-positive'}`}/>{saveStatus==='saving'?'Salvando…':saveStatus==='error'?'Não salvo':'Salvo'}</span>
          </div>
        </div>

        <form onSubmit={onSearch} className="hidden sm:block w-44 lg:w-56">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar no evento" className="h-8 pl-8 text-[13px] bg-card" />
          </div>
        </form>

        <Button variant="ghost" size="icon" className="h-8 w-8 relative" aria-label="Notificações" onClick={() => navigate(`/event/${currentEvent.id}/dashboard`)}>
          <Bell className="h-4 w-4" />
          {attention > 0 && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-danger" />}
        </Button>

        <AddMenu />
        <LogoutButton className="h-8 gap-1.5 text-[13px] shrink-0" />
      </div>
    </header>
  );
}
