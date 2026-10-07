import React, { useState } from 'react';
import { useEvent } from '@/context/EventContext';
import { scheduleSummary } from '@/lib/selectors';
import { uid, minutesToTime, timeToMinutes } from '@/lib/format';
import { insertActivity, reorderActivities, sortSchedule } from '@/lib/schedule';
import { canEditSchedule } from '@/lib/eventAccess';
import ActivityDialog from '@/components/schedule/ActivityDialog';
import ActivityList from '@/components/schedule/ActivityList';
import ActivityTypesDialog from '@/components/schedule/ActivityTypesDialog';
import { useActivityTypes } from '@/hooks/useActivityTypes';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Plus, AlertCircle, Tags, Eye } from 'lucide-react';

export default function Schedule() {
  const { currentEvent: ev, updateCurrent, orgId, access } = useEvent();
  const canEdit = canEditSchedule(access?.role);
  const { types } = useActivityTypes(orgId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [typesOpen, setTypesOpen] = useState(false);
  const sch = scheduleSummary(ev);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [reorderNote, setReorderNote] = useState('');

  const edit = (id, patch) => canEdit && updateCurrent(e => ({ ...e, schedule: sortSchedule(e.schedule.map(it => it.id === id ? { ...it, ...patch } : it)) }));
  const duplicate = (id) => canEdit && updateCurrent(e => {
    const src = e.schedule.find(it => it.id === id);
    if (!src) return e;
    const start = minutesToTime(timeToMinutes(src.start) + (src.duration || 0));
    return { ...e, schedule: insertActivity(e.schedule, { ...src, id: uid(), start }) };
  });
  const remove = (id) => canEdit && updateCurrent(e => ({ ...e, schedule: e.schedule.filter(it => it.id !== id) }));
  const addActivity = (value) => canEdit && updateCurrent(e => ({ ...e, schedule: insertActivity(e.schedule, { id: uid(), room: '', ...value }) }));
  // Soltar na lista: a atividade muda de posição e os horários se ajustam em sequência.
  const reorder = (id, toIndex) => {
    if (!canEdit) return;
    setReorderNote('');
    const next = reorderActivities(ev.schedule, id, toIndex);
    if (!next) { setReorderNote('Essa ordem passaria da meia-noite, então não foi aplicada. Diminua a duração de alguma atividade e tente de novo.'); return; }
    if (next !== ev.schedule) updateCurrent(e => ({ ...e, schedule: reorderActivities(e.schedule, id, toIndex) || e.schedule }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-[26px] tracking-tight">Programação</h1>
          <p className="mt-1 text-[14px] text-muted-foreground">{sch.count} atividades · {sch.durationText} previstos · início {sch.start} · término {sch.end}</p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="h-8 gap-1.5 text-[13px]" onClick={() => setTypesOpen(true)}><Tags className="h-3.5 w-3.5" /> Tipos de atividade</Button>
            <Button size="sm" className="h-8 gap-1.5 text-[13px]" onClick={() => setDialogOpen(true)}><Plus className="h-3.5 w-3.5" /> Nova atividade</Button>
          </div>
        )}
      </div>

      {!canEdit && (
        <div role="note" data-testid="schedule-readonly" className="flex items-start gap-2.5 rounded-md border border-border bg-secondary/60 px-4 py-3">
          <Eye className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-[13px]">Você pode ver a programação. Só a direção do evento pode alterar.</p>
        </div>
      )}

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
        <p className="text-[13px] text-muted-foreground">{canEdit ? 'Nenhuma atividade ainda. Use "Nova atividade" para começar.' : 'Nenhuma atividade ainda.'}</p>
      ) : (
        <div className="space-y-3">
          {canEdit && <p className="text-[12px] text-muted-foreground">Para mudar a ordem, arraste uma atividade pela alça à esquerda. Os horários se ajustam sozinhos. Pelo teclado: foque a alça, aperte Espaço, use as setas e aperte Espaço para soltar.</p>}
          {reorderNote && <p role="alert" className="text-[13px] text-danger">{reorderNote}</p>}
          <ActivityList items={sch.computed} typeNames={types.map(t => t.name)} canEdit={canEdit} onEdit={edit} onDuplicate={duplicate} onDelete={(id) => setPendingDelete(sch.computed.find(it => it.id === id) || null)} onReorder={reorder} />
        </div>
      )}

      {canEdit && <ActivityTypesDialog open={typesOpen} onOpenChange={setTypesOpen} />}
      {canEdit && <ActivityDialog open={dialogOpen} onOpenChange={setDialogOpen} event={ev} onConfirm={addActivity} />}
      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir esta atividade?</AlertDialogTitle>
            <AlertDialogDescription>{pendingDelete ? `"${pendingDelete.title}" será removida da programação.` : ''}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (pendingDelete) remove(pendingDelete.id); setPendingDelete(null); }}>Excluir atividade</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
