import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useEvent } from '@/context/EventContext';
import { formatDateFull } from '@/lib/format';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AddMenu from './AddMenu';
import HeaderSearch from './HeaderSearch';
import LogoutButton from '@/components/LogoutButton';
import { alerts as alertsFn } from '@/lib/selectors';


export default function TopBar() {
  const { currentEvent, saveStatus } = useEvent();
  const navigate = useNavigate();
  const location = useLocation();
  const labels = { dashboard: 'Visão geral', programacao: 'Programação', tarefas: 'Tarefas', 'diretores-staffs': 'Diretores e Staffs', participantes: 'Participantes', fornecedores: 'Fornecedores', financeiro: 'Financeiro', receitas: 'Receitas', despesas: 'Despesas', patrocinios: 'Patrocínios', capacidade: 'Capacidade', networking: 'Networking', simulador: 'Simulador', configuracoes: 'Configurações' };
  const attention = currentEvent ? alertsFn(currentEvent).filter(a => a.level !== 'ok').length : 0;

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="flex items-center gap-2 sm:gap-4 px-5 sm:px-8 lg:px-9 h-16 pl-14 lg:pl-9">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <Link to="/eventos" className="hidden xl:inline text-[13px] text-muted-foreground">Eventos /</Link>
            <span className="truncate text-[14px] font-medium">{currentEvent?.name}</span>
            <span className="hidden sm:inline text-muted-foreground">·</span>
            <span className="hidden sm:inline text-[13px] font-semibold truncate">{labels[location.pathname.split('/').pop()] || (currentEvent?.date && formatDateFull(currentEvent.date))}</span>
            <span className="hidden md:inline-flex text-xs text-muted-foreground items-center gap-2"><i className={`h-1.5 w-1.5 rounded-full ${saveStatus==='error'?'bg-danger':saveStatus==='saving'?'bg-warning':'bg-positive'}`}/>{saveStatus==='saving'?'Salvando…':saveStatus==='error'?'Não salvo':'Salvo'}</span>
          </div>
        </div>

        <HeaderSearch />

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
