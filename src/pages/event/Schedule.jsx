import React, { useState } from 'react';
import { useEvent } from '@/context/EventContext';
import { scheduleSummary } from '@/lib/selectors';
import { uid, minutesToTime, timeToMinutes } from '@/lib/format';
import { colorOf, insertActivity, moveActivity, sortSchedule, findConflicts } from '@/lib/schedule';
import ActivityDialog, { ACTIVITY_TYPES, ColorPicker } from '@/components/schedule/ActivityDialog';
import Timeline from '@/components/schedule/Timeline';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Copy, Trash2, Plus, AlertCircle } from 'lucide-react';

function Row({ item, onEdit, onDuplicate, onDelete }) {
  const [open, setOpen] = useState(false);
  const color = colorOf(item);
  return (
    <div className="platform-schedule-item border-b border-border" data-activity-row={item.id} data-conflict={item.conflictsWith.length ? 'true' : 'false'} style={{ borderLeft: `4px solid ${color.hex}` }}>
      <div className="grid grid-cols-12 gap-3 items-center py-3 px-1">
        <div className="col-span-2 sm:col-span-1 tnum text-[13px] text-muted-foreground">{item.computedStart}</div>
        <div className="hidden sm:block col-span-1 tnum text-[12px] text-muted-foreground/70">{item.computedEnd}</div>
        <div className="col-span-7 sm:col-span-6 min-w-0">
          <button aria-expanded={open} onClick={() => setOpen(o => !o)} className="text-left w-full">
            <div className="text-[14px] font-medium truncate">{item.title}</div>
            <div className="text-[11px] text-muted-foreground">{item.type}{item.speaker ? ` · ${item.speaker}` : ''}{item.room ? ` · ${item.room}` : ''}</div>
            {item.conflictsWith.length > 0 && <div className="text-[11px] text-danger">Conflito de horário com {item.conflictsWith.join(', ')}</div>}
          </button>
        </div>
        <div className="col-span-3 sm:col-span-2 text-right tnum text-[13px]">{item.duration} min</div>
        <div className="col-span-12 sm:col-span-2 flex justify-end gap-1">
          <Button aria-label={`Duplicar ${item.title}`} variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDuplicate(item.id)}><Copy className="h-3.5 w-3.5" /></Button>
          <Button aria-label={`Excluir ${item.title}`} variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-danger" onClick={() => onDelete(item.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      </div>
      {open && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pb-4 px-1 animate-fade-in">
          <div className="col-span-2"><label className="text-[11px] text-muted-foreground">Título</label><Input className="h-8 text-[13px] mt-1" value={item.title} onChange={e => onEdit(item.id, { title: e.target.value })} /></div>
          <div><label className="text-[11px] text-muted-foreground">Início</label><Input type="time" className="h-8 text-[13px] mt-1" value={item.start} onChange={e => e.target.value && onEdit(item.id, { start: e.target.value })} /></div>
          <div><label className="text-[11px] text-muted-foreground">Duração (min)</label><Input type="number" className="h-8 text-[13px] mt-1" value={item.duration} onChange={e => onEdit(item.id, { duration: Number(e.target.value) || 0 })} /></div>
          <div><label className="text-[11px] text-muted-foreground">Tipo</label>
            <Select value={item.type} onValueChange={v => onEdit(item.id, { type: v })}>
              <SelectTrigger className="h-8 text-[13px] mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{[...new Set([...ACTIVITY_TYPES, item.type].filter(Boolean))].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><label className="text-[11px] text-muted-foreground">Responsável</label><Input className="h-8 text-[13px] mt-1" value={item.speaker || ''} onChange={e => onEdit(item.id, { speaker: e.target.value })} /></div>
          <div><label className="text-[11px] text-muted-foreground">Espaço</label><Input className="h-8 text-[13px] mt-1" value={item.room || ''} onChange={e => onEdit(item.id, { room: e.target.value })} /></div>
          <div className="col-span-2"><label className="text-[11px] text-muted-foreground">Cor do bloco</label><div className="mt-1.5"><ColorPicker name={`Cor de ${item.title}`} value={item.color || 'azul'} onChange={c => onEdit(item.id, { color: c })} /></div></div>
          <div className="col-span-2 sm:col-span-4"><label className="text-[11px] text-muted-foreground">Observação</label><textarea className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-[13px] shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring mt-1 min-h-[52px]" value={item.notes || ''} onChange={e => onEdit(item.id, { notes: e.target.value })} /></div>
        </div>
      )}
    </div>
  );
}

export default function Schedule() {
  const { currentEvent: ev, updateCurrent } = useEvent();
  const [dialogOpen, setDialogOpen] = useState(false);
  const sch = scheduleSummary(ev);
  const conflicts = findConflicts(sch.computed);

  const edit = (id, patch) => updateCurrent(e => ({ ...e, schedule: sortSchedule(e.schedule.map(it => it.id === id ? { ...it, ...patch } : it)) }));
  const duplicate = (id) => updateCurrent(e => {
    const src = e.schedule.find(it => it.id === id);
    if (!src) return e;
    const start = minutesToTime(timeToMinutes(src.start) + (src.duration || 0));
    return { ...e, schedule: insertActivity(e.schedule, { ...src, id: uid(), start }) };
  });
  const remove = (id) => updateCurrent(e => ({ ...e, schedule: e.schedule.filter(it => it.id !== id) }));
  const addActivity = (value) => updateCurrent(e => ({ ...e, schedule: insertActivity(e.schedule, { id: uid(), room: '', ...value }) }));
  const move = (id, startMinutes) => updateCurrent(e => ({ ...e, schedule: moveActivity(e.schedule, id, startMinutes) }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-[26px] tracking-tight">Programação</h1>
          <p className="mt-1 text-[14px] text-muted-foreground">{sch.count} atividades · {sch.durationText} previstos · início {sch.start} · término {sch.end}</p>
        </div>
        <Button size="sm" className="h-8 gap-1.5 text-[13px]" onClick={() => setDialogOpen(true)}><Plus className="h-3.5 w-3.5" /> Nova atividade</Button>
      </div>

      {sch.overMinutes > 0 && (
        <div className="flex items-start gap-2.5 rounded-md border border-warning/30 bg-warning/5 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
          <p className="text-[13px]">A programação agora termina às <span className="font-medium tnum">{sch.end}</span>, {sch.overMinutes} minutos depois do horário definido para encerramento ({ev.desiredEndTime}).</p>
        </div>
      )}
      {sch.conflicts > 0 && (
        <div role="status" className="flex items-start gap-2.5 rounded-md border border-danger/30 bg-danger/5 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-danger shrink-0 mt-0.5" />
          <p className="text-[13px]">{sch.conflicts} atividade{sch.conflicts > 1 ? 's' : ''} com horário sobreposto. O salvamento não é bloqueado; ajuste os horários quando quiser.</p>
        </div>
      )}

      {sch.count === 0 ? (
        <p className="text-[13px] text-muted-foreground">Nenhuma atividade ainda. Use &quot;Nova atividade&quot; para começar.</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-start">
          <div>
            <div className="grid grid-cols-12 gap-3 px-1 pb-2 border-b border-border text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
              <div className="col-span-2 sm:col-span-1">Início</div><div className="hidden sm:block col-span-1">Fim</div>
              <div className="col-span-7 sm:col-span-6">Atividade</div>
              <div className="col-span-3 sm:col-span-2 text-right">Duração</div>
              <div className="hidden sm:block col-span-2 text-right">Ações</div>
            </div>
            {sch.computed.map((it) => (
              <Row key={it.id} item={it} onEdit={edit} onDuplicate={duplicate} onDelete={remove} />
            ))}
          </div>
          <section aria-label="Cronograma" className="lg:sticky lg:top-4">
            <h2 className="text-[12px] uppercase tracking-[0.1em] text-muted-foreground pb-2">Cronograma · arraste para mudar o horário</h2>
            <Timeline items={sch.computed} conflicts={conflicts} onMove={move} />
          </section>
        </div>
      )}

      <ActivityDialog open={dialogOpen} onOpenChange={setDialogOpen} event={ev} onConfirm={addActivity} />
    </div>
  );
}
