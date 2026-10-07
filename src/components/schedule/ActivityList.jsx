import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { colorOf } from '@/lib/schedule';
import { ColorPicker } from '@/components/schedule/ActivityDialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Copy, Trash2, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

function Details({ item, typeNames, onEdit }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pb-4 px-1 animate-fade-in">
      <div className="col-span-2"><label className="text-[11px] text-muted-foreground">Título</label><Input className="h-8 text-[13px] mt-1" value={item.title} onChange={e => onEdit(item.id, { title: e.target.value })} /></div>
      <div><label className="text-[11px] text-muted-foreground">Início</label><Input type="time" className="h-8 text-[13px] mt-1" value={item.start} onChange={e => e.target.value && onEdit(item.id, { start: e.target.value })} /></div>
      <div><label className="text-[11px] text-muted-foreground">Duração (min)</label><Input type="number" className="h-8 text-[13px] mt-1" value={item.duration} onChange={e => onEdit(item.id, { duration: Number(e.target.value) || 0 })} /></div>
      <div><label className="text-[11px] text-muted-foreground">Tipo</label>
        <Select value={item.type} onValueChange={v => onEdit(item.id, { type: v })}>
          <SelectTrigger className="h-8 text-[13px] mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>{[...new Set([...typeNames, item.type].filter(Boolean))].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div><label className="text-[11px] text-muted-foreground">Responsável</label><Input className="h-8 text-[13px] mt-1" value={item.speaker || ''} onChange={e => onEdit(item.id, { speaker: e.target.value })} /></div>
      <div><label className="text-[11px] text-muted-foreground">Espaço</label><Input className="h-8 text-[13px] mt-1" value={item.room || ''} onChange={e => onEdit(item.id, { room: e.target.value })} /></div>
      <div className="col-span-2"><label className="text-[11px] text-muted-foreground">Cor do bloco</label><div className="mt-1.5"><ColorPicker name={`Cor de ${item.title}`} value={item.color || 'azul'} onChange={c => onEdit(item.id, { color: c })} /></div></div>
      <div className="col-span-2 sm:col-span-4"><label className="text-[11px] text-muted-foreground">Observação</label><textarea className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-[13px] shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring mt-1 min-h-[52px]" value={item.notes || ''} onChange={e => onEdit(item.id, { notes: e.target.value })} /></div>
    </div>
  );
}

// Staff só lê: mostra o que existe, sem campos para editar.
function ReadOnlyDetails({ item }) {
  const facts = [['Responsável', item.speaker], ['Espaço', item.room], ['Observação', item.notes]].filter(([, v]) => v);
  return (
    <div className="pb-4 px-1 space-y-1 animate-fade-in">
      {facts.map(([label, value]) => <p key={label} className="text-[13px]"><span className="text-muted-foreground">{label}: </span>{value}</p>)}
    </div>
  );
}

function Row({ item, index, isLast, typeNames, canEdit, onEdit, onDuplicate, onDelete }) {
  const [open, setOpen] = useState(false);
  const color = colorOf(item);
  const hasFacts = !!(item.speaker || item.room || item.notes);
  const body = (drag, dragSnap) => {
    const card = (
      <div
        ref={drag?.innerRef} {...(drag?.draggableProps || {})}
        className={cn('platform-schedule-item border-b border-border', isLast && 'is-last', dragSnap?.isDragging && 'is-dragging platform-ui')}
        data-activity-row={item.id} data-conflict={item.conflictsWith.length ? 'true' : 'false'}
        style={{ ...(drag?.draggableProps?.style || {}), borderLeft: `4px solid ${color.hex}` }}
      >
        <div className="flex items-center gap-1">
          {canEdit && (
            <button type="button" {...drag.dragHandleProps} data-drag-handle={item.id}
              aria-label={`Mover ${item.title}. Espaço para pegar, setas para cima e para baixo para mover, Espaço para soltar.`}
              className="platform-schedule-handle shrink-0 h-8 w-6 -ml-1 flex items-center justify-center rounded text-muted-foreground hover:text-foreground">
              <GripVertical className="h-4 w-4" />
            </button>
          )}
          <div className="grid grid-cols-12 gap-3 items-center py-3 px-1 flex-1 min-w-0">
            <div className="col-span-2 sm:col-span-1 tnum text-[13px] text-muted-foreground">{item.computedStart}</div>
            <div className="hidden sm:block col-span-1 tnum text-[12px] text-muted-foreground/70">{item.computedEnd}</div>
            <div className={cn('min-w-0', canEdit ? 'col-span-7 sm:col-span-6' : 'col-span-7 sm:col-span-8')}>
              <button aria-expanded={open} onClick={() => setOpen(o => !o)} className="text-left w-full">
                <div className="text-[14px] font-medium truncate">{item.title}</div>
                <div className="text-[11px] text-muted-foreground">{item.type}{item.speaker ? ` · ${item.speaker}` : ''}{item.room ? ` · ${item.room}` : ''}</div>
                {item.conflictsWith.length > 0 && <div className="text-[11px] text-danger">Conflito de horário com {item.conflictsWith.join(', ')}</div>}
              </button>
            </div>
            <div className="col-span-3 sm:col-span-2 text-right tnum text-[13px]">{item.duration} min</div>
            {canEdit && (
              <div className="col-span-12 sm:col-span-2 flex justify-end gap-1">
                <Button aria-label={`Duplicar ${item.title}`} variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDuplicate(item.id)}><Copy className="h-3.5 w-3.5" /></Button>
                <Button aria-label={`Excluir ${item.title}`} variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-danger" onClick={() => onDelete(item.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            )}
          </div>
        </div>
        {open && (canEdit ? <Details item={item} typeNames={typeNames} onEdit={onEdit} /> : hasFacts ? <ReadOnlyDetails item={item} /> : null)}
      </div>
    );
    // Dentro de um ancestral com transformação o card arrastado fica deslocado; no body não.
    return dragSnap?.isDragging ? createPortal(card, document.body) : card;
  };
  if (!canEdit) return body();
  return (
    <Draggable draggableId={item.id} index={index}>
      {(drag, dragSnap) => body(drag, dragSnap)}
    </Draggable>
  );
}

// Lista principal da programação. Quem pode editar arrasta pela alça (ou pelo teclado) para
// reordenar; quem só pode ler (staff) vê a mesma lista sem alças nem botões.
export default function ActivityList({ items, typeNames, canEdit, onEdit, onDuplicate, onDelete, onReorder }) {
  const header = (
    <div className={cn('grid grid-cols-12 gap-3 px-1 pb-2 border-b border-border text-[11px] uppercase tracking-[0.1em] text-muted-foreground', canEdit && 'pl-6')}>
      <div className="col-span-2 sm:col-span-1">Início</div><div className="hidden sm:block col-span-1">Fim</div>
      <div className={cn(canEdit ? 'col-span-7 sm:col-span-6' : 'col-span-7 sm:col-span-8')}>Atividade</div>
      <div className="col-span-3 sm:col-span-2 text-right">Duração</div>
      {canEdit && <div className="hidden sm:block col-span-2 text-right">Ações</div>}
    </div>
  );
  const rows = items.map((it, index) => (
    <Row key={it.id} item={it} index={index} isLast={index === items.length - 1} typeNames={typeNames} canEdit={canEdit} onEdit={onEdit} onDuplicate={onDuplicate} onDelete={onDelete} />
  ));
  if (!canEdit) return <div>{header}{rows}</div>;
  return (
    <DragDropContext onDragEnd={({ draggableId, destination, source }) => {
      if (destination && destination.index !== source.index) onReorder(draggableId, destination.index);
    }}>
      {header}
      <Droppable droppableId="programacao">
        {(drop) => (
          <div ref={drop.innerRef} {...drop.droppableProps} data-testid="activity-list">
            {rows}
            {drop.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
