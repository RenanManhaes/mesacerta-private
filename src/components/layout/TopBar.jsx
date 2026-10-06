import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useEvent } from '@/context/EventContext';
import { formatDateFull } from '@/lib/format';
import AddMenu from './AddMenu';
import HeaderSearch from './HeaderSearch';
import LogoutButton from '@/components/LogoutButton';
import NotificationsMenu from './NotificationsMenu';


export default function TopBar() {
  const { currentEvent, saveStatus, access } = useEvent();
  const navigate = useNavigate();
  const location = useLocation();
  const labels = { dashboard: 'Visão geral', programacao: 'Programação', tarefas: 'Tarefas', 'equipe': 'Equipe do evento', 'diretores-staffs': 'Equipe do evento', participantes: 'Participantes', fornecedores: 'Fornecedores', financeiro: 'Financeiro', receitas: 'Receitas', despesas: 'Despesas', patrocinios: 'Patrocínios', capacidade: 'Capacidade', networking: 'Networking', simulador: 'Simulador', configuracoes: 'Configurações' };

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

        <HeaderSearch />

        <NotificationsMenu />

        {access?.role !== 'staff' && <AddMenu />}
        <LogoutButton className="h-8 gap-1.5 text-[13px] shrink-0" />
      </div>
    </header>
  );
}
