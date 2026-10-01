import React, { useState } from 'react';
import { useEvent } from '@/context/EventContext';
import { taskSummary } from '@/lib/selectors';
import { daysUntil, formatDateShort } from '@/lib/format';
import { EmptyState } from '@/components/common/Primitives';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const FILTERS = [
  { key: 'todas', label: 'Todas' },
  { key: 'minhas', label: 'Minhas' },
  { key: 'atrasadas', label: 'Atrasadas' },
  { key: 'semana', label: 'Esta semana' },
  { key: 'concluidas', label: 'Concluídas' }
];

export default function Tasks() {
  const { currentEvent: ev, updateCurrent } = useEvent();
  const [filter, setFilter] = useState('todas');
  const s = taskSummary(ev);

  const setStatus = (id, status) => updateCurrent(e => ({ ...e, tasks: e.tasks.map(t => t.id === id ? { ...t, status } : t) }));
  const setOwner = (id, owner) => updateCurrent(e => ({ ...e, tasks: e.tasks.map(t => t.id === id ? { ...t, owner } : t) }));

  let list = ev.tasks;
  if (filter === 'minhas') list = list.filter(t => t.owner);
  else if (filter === 'atrasadas') list = list.filter(t => t.status !== 'Concluído' && t.date && daysUntil(t.date) < 0);
  else if (filter === 'semana') list = list.filter(t => t.date && daysUntil(t.date) >= 0 && daysUntil(t.date) <= 7);
  else if (filter === 'concluidas') list = list.filter(t => t.status === 'Concluído');
  else list = list.filter(t => t.status !== 'Concluído');

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-[26px] tracking-tight">Tarefas</h1>
        <p className="mt-1 text-[14px] text-muted-foreground">{s.done} concluídas · {s.pending} pendentes · {s.overdue} atrasadas · {s.noOwner} sem responsável</p>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} className={cn(
            'rounded-full px-3 py-1 text-[12px] border transition-colors',
            filter === f.key ? 'border-foreground/20 bg-secondary text-foreground' : 'border-border text-muted-foreground hover:text-foreground'
          )}>{f.label}</button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState title="Nenhuma tarefa aqui" hint="Use o botão Adicionar no topo para criar uma tarefa." />
      ) : (
        <div className="border-t border-border">
          {list.map(t => {
            const overdue = t.status !== 'Concluído' && t.date && daysUntil(t.date) < 0;
            return (
              <div key={t.id} className="grid grid-cols-12 gap-3 items-center py-3 border-b border-border">
                <div className="col-span-12 sm:col-span-6 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn('text-[14px] font-medium', t.status === 'Concluído' && 'line-through text-muted-foreground')}>{t.name}</span>
                    {t.priority === 'Crítica' && <span className="text-[10px] uppercase tracking-wide text-danger font-medium">crítica</span>}
                    {t.priority === 'Alta' && <span className="text-[10px] uppercase tracking-wide text-warning font-medium">alta</span>}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{t.category} · {t.date ? formatDateShort(t.date) : 'sem data'} {overdue && <span className="text-danger">· atrasada</span>}</div>
                </div>
                <div className="col-span-6 sm:col-span-3">
                  <Input value={t.owner || ''} placeholder="Responsável" onChange={e => setOwner(t.id, e.target.value)} className="h-8 text-[12px]" />
                </div>
                <div className="col-span-6 sm:col-span-3 flex justify-end">
                  <Select value={t.status} onValueChange={v => setStatus(t.id, v)}>
                    <SelectTrigger className="h-8 text-[12px] w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>{['A fazer','Em andamento','Concluído'].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
