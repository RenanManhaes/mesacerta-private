import React, { useState } from 'react';
import { useEvent } from '@/context/EventContext';
import { scheduleSummary } from '@/lib/selectors';
import { minutesToTime, timeToMinutes, uid } from '@/lib/format';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, Copy, Trash2, Plus, AlertCircle } from 'lucide-react';

const TYPES = ['Credenciamento','Abertura','Palestra','Painel','Workshop','Intervalo','Almoço','Networking','Apresentação','Encerramento','Personalizado'];

function Row({ item, idx, total, onEdit, onMove, onDuplicate, onDelete }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="platform-schedule-item border-b border-border">
      <div className="grid grid-cols-12 gap-3 items-center py-3 px-1">
        <div className="col-span-2 sm:col-span-1 tnum text-[13px] text-muted-foreground">{item.computedStart}</div>
        <div className="hidden sm:block col-span-1 tnum text-[12px] text-muted-foreground/70">{item.computedEnd}</div>
        <div className="col-span-7 sm:col-span-6 min-w-0">
          <button onClick={() => setOpen(o => !o)} className="text-left w-full">
            <div className="text-[14px] font-medium truncate">{item.title}</div>
            <div className="text-[11px] text-muted-foreground">{item.type}{item.speaker ? ` · ${item.speaker}` : ''}{item.room ? ` · ${item.room}` : ''}</div>
          </button>
        </div>
        <div className="col-span-3 sm:col-span-2 text-right tnum text-[13px]">{item.duration} min</div>
        <div className="col-span-12 sm:col-span-2 flex justify-end gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" disabled={idx === 0} onClick={() => onMove(idx, -1)}><ArrowUp className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" disabled={idx === total - 1} onClick={() => onMove(idx, 1)}><ArrowDown className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDuplicate(idx)}><Copy className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-danger" onClick={() => onDelete(idx)}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      </div>
      {open && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pb-4 px-1 animate-fade-in">
          <div className="col-span-2"><label className="text-[11px] text-muted-foreground">Título</label><Input className="h-8 text-[13px] mt-1" value={item.title} onChange={e => onEdit(idx, { title: e.target.value })} /></div>
          <div><label className="text-[11px] text-muted-foreground">Início</label><Input type="time" className="h-8 text-[13px] mt-1" value={item.start} onChange={e => onEdit(idx, { start: e.target.value })} /></div>
          <div><label className="text-[11px] text-muted-foreground">Duração (min)</label><Input type="number" className="h-8 text-[13px] mt-1" value={item.duration} onChange={e => onEdit(idx, { duration: Number(e.target.value) || 0 })} /></div>
          <div><label className="text-[11px] text-muted-foreground">Tipo</label>
            <Select value={item.type} onValueChange={v => onEdit(idx, { type: v })}>
              <SelectTrigger className="h-8 text-[13px] mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><label className="text-[11px] text-muted-foreground">Palestrante</label><Input className="h-8 text-[13px] mt-1" value={item.speaker || ''} onChange={e => onEdit(idx, { speaker: e.target.value })} /></div>
          <div><label className="text-[11px] text-muted-foreground">Espaço</label><Input className="h-8 text-[13px] mt-1" value={item.room || ''} onChange={e => onEdit(idx, { room: e.target.value })} /></div>
        </div>
      )}
    </div>
  );
}

export default function Schedule() {
  const { currentEvent: ev, updateCurrent } = useEvent();
  const sch = scheduleSummary(ev);

  const edit = (idx, patch) => updateCurrent(e => {
    const schedule = [...e.schedule];
    schedule[idx] = { ...schedule[idx], ...patch };
    return { ...e, schedule };
  });
  const move = (idx, dir) => updateCurrent(e => {
    const schedule = [...e.schedule];
    const j = idx + dir;
    if (j < 0 || j >= schedule.length) return e;
    [schedule[idx], schedule[j]] = [schedule[j], schedule[idx]];
    return { ...e, schedule };
  });
  const duplicate = (idx) => updateCurrent(e => {
    const schedule = [...e.schedule];
    const copy = { ...schedule[idx], id: uid() };
    schedule.splice(idx + 1, 0, copy);
    return { ...e, schedule };
  });
  const remove = (idx) => updateCurrent(e => ({ ...e, schedule: e.schedule.filter((_, i) => i !== idx) }));
  const addActivity = () => updateCurrent(e => {
    const last = e.schedule[e.schedule.length - 1];
    const start = last ? minutesToTime(timeToMinutes(last.start) + (last.duration || 0)) : '09:00';
    return { ...e, schedule: [...e.schedule, { id: uid(), start, duration: 30, title: 'Nova atividade', type: 'Palestra', speaker: '', room: '' }] };
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-[26px] tracking-tight">Programação</h1>
          <p className="mt-1 text-[14px] text-muted-foreground">{sch.count} atividades · {sch.durationText} previstos · início {sch.start} · término {sch.end}</p>
        </div>
        <Button size="sm" className="h-8 gap-1.5 text-[13px]" onClick={addActivity}><Plus className="h-3.5 w-3.5" /> Atividade</Button>
      </div>

      {sch.overMinutes > 0 && (
        <div className="flex items-start gap-2.5 rounded-md border border-warning/30 bg-warning/5 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
          <p className="text-[13px]">A programação agora termina às <span className="font-medium tnum">{sch.end}</span>, {sch.overMinutes} minutos depois do horário definido para encerramento ({ev.desiredEndTime}).</p>
        </div>
      )}

      <div>
        <div className="grid grid-cols-12 gap-3 px-1 pb-2 border-b border-border text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
          <div className="col-span-2 sm:col-span-1">Início</div><div className="hidden sm:block col-span-1">Fim</div>
          <div className="col-span-7 sm:col-span-6">Atividade</div>
          <div className="col-span-3 sm:col-span-2 text-right">Duração</div>
          <div className="hidden sm:block col-span-2 text-right">Ações</div>
        </div>
        {sch.computed.map((it, i) => (
          <Row key={it.id} item={it} idx={i} total={sch.computed.length} onEdit={edit} onMove={move} onDuplicate={duplicate} onDelete={remove} />
        ))}
      </div>
    </div>
  );
}
