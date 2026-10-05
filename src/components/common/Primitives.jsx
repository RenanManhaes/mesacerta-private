import React from 'react';
import { cn } from '@/lib/utils';
import { formatBRL } from '@/lib/format';

/** @param {{children: React.ReactNode, className?: string}} props */
export function SectionLabel({ children, className }) {
  return (
    <div className={cn('platform-section-label text-base font-semibold text-foreground', className)}>
      {children}
    </div>
  );
}

/** @param {{value: number, className?: string, exact?: boolean}} props */
export function Money({ value, className, exact }) {
  return <span className={cn('tnum', className)}>{exact ? formatBRL(value) : formatBRL(value)}</span>;
}

/** @param {{label: React.ReactNode, value: React.ReactNode, sub?: React.ReactNode, accent?: boolean, className?: string}} props */
export function Stat({ label, value, sub, accent, className }) {
  return (
    <div className={className}>
      <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{label}</div>
      <div className={cn('mt-1 text-[15px] font-medium tnum', accent && 'text-primary')}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

/** @param {{status: string, className?: string}} props */
export function StatusPill({ status, className }) {
  const map = {
    ok: 'text-positive',
    positivo: 'text-positive',
    Confirmado: 'text-positive',
    quitado: 'text-positive',
    pago: 'text-positive',
    recebido: 'text-positive',
    'Check-in realizado': 'text-positive',
    atencao: 'text-warning',
    Pendente: 'text-warning',
    pendente: 'text-warning',
    parcial: 'text-warning',
    previsto: 'text-muted-foreground',
    critico: 'text-danger',
    Cancelado: 'text-danger',
    'A fazer': 'text-muted-foreground',
    'Em andamento': 'text-info',
    Concluído: 'text-positive'
  };
  const cls = map[status] || 'text-muted-foreground';
  return (
    <span className={cn('platform-status-pill inline-flex items-center gap-1.5 text-xs font-medium', cls, className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full bg-current')} />
      {status}
    </span>
  );
}

/** @param {{text: React.ReactNode, children?: React.ReactNode}} props */
export function InfoTip({ text, children }) {
  return (
    <span className="group relative inline-flex items-center">
      {children || (
        <span className="ml-1 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-border text-[9px] text-muted-foreground cursor-help">i</span>
      )}
      <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 w-56 -translate-x-1/2 rounded-md border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-sm opacity-0 transition-opacity group-hover:opacity-100">
        {text}
      </span>
    </span>
  );
}

export function Divider({ className }) {
  return <div className={cn('h-px w-full bg-border', className)} />;
}

/** @param {{title: React.ReactNode, hint?: React.ReactNode, action?: React.ReactNode}} props */
export function EmptyState({ title, hint, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-sm font-medium text-foreground">{title}</div>
      {hint && <div className="mt-1 max-w-sm text-sm text-muted-foreground">{hint}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
