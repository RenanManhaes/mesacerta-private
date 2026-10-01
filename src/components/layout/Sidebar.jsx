import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useEvent } from '@/context/EventContext';
import { useAuth } from '@/lib/AuthContext';
import { formatDateFull, daysUntil } from '@/lib/format';
import {
  LayoutDashboard, CalendarDays, ListChecks, Users, Truck,
  Wallet, Ticket, Sparkles, Gauge, Network, Settings, ChevronDown, LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem
} from '@/components/ui/dropdown-menu';

const iconCls = 'h-[15px] w-[15px] shrink-0';

const sections = [
  { group: null, items: [{ to: 'dashboard', label: 'Visão geral', icon: LayoutDashboard }] },
  {
    group: 'Planejamento',
    items: [
      { to: 'programacao', label: 'Programação', icon: CalendarDays, module: 'schedule' },
      { to: 'tarefas', label: 'Tarefas', icon: ListChecks },
      { to: 'participantes', label: 'Participantes', icon: Users },
      { to: 'fornecedores', label: 'Fornecedores', icon: Truck, module: 'suppliers' }
    ]
  },
  {
    group: 'Financeiro',
    items: [
      { to: 'financeiro', label: 'Financeiro', icon: Wallet },
      { to: 'receitas', label: 'Receitas', icon: Ticket, module: 'tickets' },
      { to: 'despesas', label: 'Despesas', icon: Wallet, module: 'suppliers' },
      { to: 'patrocinios', label: 'Patrocínios', icon: Sparkles, module: 'sponsors' }
    ]
  },
  {
    group: 'Operação',
    items: [
      { to: 'capacidade', label: 'Capacidade', icon: Gauge },
      { to: 'networking', label: 'Networking', icon: Network, module: 'networking' }
    ]
  },
  { group: 'Análise', items: [{ to: 'simulador', label: 'Simulador', icon: Gauge }] },
  { group: null, items: [{ to: 'configuracoes', label: 'Configurações', icon: Settings }] }
];

export function SidebarContent({ onNavigate }) {
  const { events, currentEvent, setCurrentEventId } = useEvent();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const base = `/event/${currentEvent?.id || ''}`;

  const handleSignOut = async () => {
    await signOut();
    onNavigate?.();
    navigate('/login', { replace: true });
  };

  const switchEvent = (id) => {
    setCurrentEventId(id);
    navigate(`/event/${id}/dashboard`);
    onNavigate?.();
  };

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex items-center gap-2 px-5 h-14 border-b border-border">
        <div className="flex h-6 w-6 items-center justify-center rounded-[5px] bg-primary text-primary-foreground">
          <span className="text-[11px] font-semibold">M</span>
        </div>
        <span className="font-display text-[17px] leading-none tracking-tight">Mesa Certa</span>
      </div>

      {/* Event selector */}
      <div className="px-3 pt-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full rounded-md border border-border bg-card px-3 py-2.5 text-left hover:bg-secondary transition-colors focus-ring">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-medium">{currentEvent?.name || 'Selecione um evento'}</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    {currentEvent?.date ? formatDateFull(currentEvent.date) : ''}
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-60">
            {events.map(ev => (
              <DropdownMenuItem key={ev.id} onClick={() => switchEvent(ev.id)} className="flex-col items-start py-2">
                <span className="text-[13px] font-medium">{ev.name}</span>
                <span className="text-[11px] text-muted-foreground">{formatDateFull(ev.date)}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {sections.map((sec, i) => (
          <div key={i}>
            {sec.group && (
              <div className="px-2 mb-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">{sec.group}</div>
            )}
            <div className="space-y-0.5">
              {sec.items.filter(it => !it.module || currentEvent?.modules?.[it.module]).map(it => {
                const full = `${base}/${it.to}`;
                const active = location.pathname === full || location.pathname.startsWith(full + '/');
                return (
                  <NavLink key={it.to} to={full} onClick={onNavigate} className={cn(
                    'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors',
                    active ? 'bg-secondary text-foreground font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                  )}>
                    <it.icon className={iconCls} />
                    {it.label}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-border px-4 py-3 text-[11px] text-muted-foreground">
        {currentEvent?.date && (
          <>Faltam <span className="font-medium text-foreground">{daysUntil(currentEvent.date)} dias</span> para o evento</>
        )}
      </div>
      <div className="border-t border-border px-3 py-2.5">
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors focus-ring"
        >
          <LogOut className={iconCls} />
          Sair
        </button>
      </div>
    </div>
  );
}

export default function Sidebar() {
  return <SidebarContent />;
}
