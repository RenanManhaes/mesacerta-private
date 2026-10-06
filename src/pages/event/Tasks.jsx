import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useEventField } from '@/lib/useEventField';
import { useEvent } from '@/context/EventContext';
import { taskSummary } from '@/lib/selectors';
import { daysUntil, formatDateShort } from '@/lib/format';
import { EmptyState } from '@/components/common/Primitives';
import TaskOwnerSelect from '@/components/common/TaskOwnerSelect';
import { assignTask } from '@/lib/staff';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const FILTERS = [
  { key: 'todas', label: 'Todas' },
  { key: 'minhas', label: 'Minhas' },
  { key: 'atrasadas', label: 'Atrasadas' },
  { key: 'semana', label: 'Esta semana' },
  { key: 'concluidas', label: 'Concluídas' }
];
const STATUSES = ['A fazer', 'Em andamento', 'Concluído'];

// Borda: atraso (vermelha) prevalece sobre prioridade alta (laranja).
const taskTone = (t) => {
  if (t.status !== 'Concluído' && t.date && daysUntil(t.date) < 0) return 'overdue';
  return t.priority === 'Alta' ? 'high' : 'normal';
};

export default function Tasks() {
  const { currentEvent: ev, updateCurrent, commitCurrent, access } = useEvent();
  const [filter, setFilter] = useEventField('tasks.filter', 'todas');
  const [revertNote, setRevertNote] = useState('');
  const s = taskSummary(ev);

  const withStatus = (id, status) => e => ({ ...e, tasks: e.tasks.map(t => t.id === id ? { ...t, status } : t) });
  // Muda na hora (feedback visual), grava e desfaz se a gravação falhar.
  const setStatus = async (id, status) => {
    const previous = ev.tasks.find(t => t.id === id)?.status;
    if (!previous || previous === status) return;
    setRevertNote('');
    try { await commitCurrent(withStatus(id, status)); }
    catch {
      updateCurrent(e => ({ ...e, tasks: e.tasks.map(t => t.id === id && t.status === status ? { ...t, status: previous } : t) }));
      setRevertNote(`Não foi possível salvar a mudança de status. O card voltou para "${previous}".`);
    }
  };
  const onDragEnd = ({ draggableId, destination }) => {
    if (destination) setStatus(draggableId, destination.droppableId);
  };
  const setOwner = (id, ownerId) => updateCurrent(e => assignTask(e,id,ownerId));

  let list = ev.tasks;
  if (filter === 'minhas') list = list.filter(t => t.owner);
  else if (filter === 'atrasadas') list = list.filter(t => t.status !== 'Concluído' && t.date && daysUntil(t.date) < 0);
  else if (filter === 'semana') list = list.filter(t => t.date && daysUntil(t.date) >= 0 && daysUntil(t.date) <= 7);
  else if (filter === 'concluidas') list = list.filter(t => t.status === 'Concluído');

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
        <DragDropContext onDragEnd={onDragEnd}>
          <p className="text-[12px] text-muted-foreground">Arraste os cards entre as colunas. Pelo teclado: foque o card, aperte Espaço, use as setas para mover e Espaço para soltar. O seletor de status de cada card também funciona.</p>
          {revertNote && <p role="alert" className="text-[13px] text-danger">{revertNote}</p>}
          <div className="platform-kanban">
            {STATUSES.map(status => (
              <section key={status} className="platform-kanban-column">
                <h2 className="flex justify-between text-sm px-1 py-1">{status}<span className="text-muted-foreground">{list.filter(t => t.status === status).length}</span></h2>
                <Droppable droppableId={status}>
                  {(drop, snap) => (
                    <div ref={drop.innerRef} {...drop.droppableProps} data-column={status} className={cn('platform-kanban-drop', snap.isDraggingOver && 'is-over')}>
                      {list.filter(t => t.status === status).map((t, index) => {
                        const tone = taskTone(t);
                        return (
                          <Draggable key={t.id} draggableId={t.id} index={index}>
                            {(drag, dragSnap) => (
                              <div ref={drag.innerRef} {...drag.draggableProps} {...drag.dragHandleProps}
                                aria-label={`Tarefa ${t.name}, ${t.status}. Espaço para pegar e mover.`}
                                data-task-id={t.id} data-tone={tone}
                                className={cn('platform-task-card platform-task-card--dnd grid grid-cols-12 gap-3 items-center', `task-tone-${tone}`, dragSnap.isDragging && 'is-dragging')}>
                                <div className="col-span-12 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className={cn('text-[14px] font-medium', t.status === 'Concluído' && 'line-through text-muted-foreground')}>{t.name}</span>
                                    {t.priority === 'Crítica' && <span className="text-[10px] uppercase tracking-wide text-danger font-medium">crítica</span>}
                                    {t.priority === 'Alta' && <span className="text-[10px] uppercase tracking-wide text-warning font-medium">alta</span>}
                                  </div>
                                  <div className="text-[11px] text-muted-foreground mt-0.5">{t.category} · {t.date ? formatDateShort(t.date) : 'sem data'} {tone === 'overdue' && <span className="text-danger">· atrasada</span>}</div>
                                </div>
                                <div className="col-span-12">
                                  {access?.role === 'staff' ? <span>{t.owner || 'Minha tarefa'}</span> : <TaskOwnerSelect label={`Responsável por ${t.name}`} members={ev.staffMembers || []} ownerId={t.ownerId || ''} owner={t.owner || ''} onChange={id=>setOwner(t.id,id)}/>}
                                </div>
                                <div className="col-span-12 flex justify-end">
                                  <Select value={t.status} onValueChange={v => setStatus(t.id, v)}>
                                    <SelectTrigger aria-label={`Status de ${t.name}`} className="h-8 text-[12px] w-40"><SelectValue /></SelectTrigger>
                                    <SelectContent>{STATUSES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                                  </Select>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {drop.placeholder}
                    </div>
                  )}
                </Droppable>
              </section>
            ))}
          </div>
        </DragDropContext>
      )}
    </div>
  );
}
