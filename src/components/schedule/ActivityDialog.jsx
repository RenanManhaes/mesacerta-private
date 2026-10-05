import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Check } from 'lucide-react';
import { COOL_PALETTE, DEFAULT_COLOR, conflictsFor, validateActivity, endMinutes } from '@/lib/schedule';
import { minutesToTime, timeToMinutes } from '@/lib/format';
import { cn } from '@/lib/utils';

export const ACTIVITY_TYPES = ['Credenciamento', 'Abertura', 'Palestra', 'Painel', 'Workshop', 'Intervalo', 'Almoço', 'Networking', 'Apresentação', 'Encerramento', 'Personalizado'];

const fieldCls = 'h-9 text-[13px]';
const labelCls = 'text-[12px] font-medium';

// Sugere o início logo após a última atividade (ou 09:00); só preenche o campo, não cria nada.
const suggestedStart = (schedule) => {
  if (!schedule.length) return '09:00';
  return minutesToTime(Math.max(...schedule.map(endMinutes)));
};

export const ColorPicker = ({ value, onChange, name = 'Cor do bloco' }) => (
  <div role="radiogroup" aria-label={name} className="flex flex-wrap gap-2">
    {COOL_PALETTE.map((c) => (
      <button
        key={c.key}
        type="button"
        role="radio"
        aria-checked={value === c.key}
        aria-label={c.label}
        title={c.label}
        data-color={c.key}
        onClick={() => onChange(c.key)}
        className={cn('h-7 w-7 rounded-full border-2 flex items-center justify-center transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground', value === c.key ? 'border-foreground' : 'border-transparent')}
        style={{ backgroundColor: c.hex }}
      >
        {value === c.key && <Check className="h-3.5 w-3.5 text-white" />}
      </button>
    ))}
  </div>
);

// Modal de nova atividade. Nada é criado antes de confirmar: onConfirm só roda no envio válido.
export default function ActivityDialog({ open, onOpenChange, event, onConfirm, types = ACTIVITY_TYPES }) {
  const schedule = useMemo(() => event?.schedule || [], [event]);
  const [form, setForm] = useState(/** @type {Record<string, any>} */ ({}));
  const [submitted, setSubmitted] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (open) {
      setForm({ title: '', start: suggestedStart(schedule), duration: 30, speaker: '', type: types.includes('Palestra') ? 'Palestra' : types[0], notes: '', color: DEFAULT_COLOR });
      setSubmitted(false);
    }
    // só reinicia ao abrir
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const { errors, value } = validateActivity(form);
  const hasErrors = Object.keys(errors).length > 0;
  const conflicts = hasErrors && (errors.start || errors.duration) ? [] : conflictsFor(schedule, { id: '__novo', ...value });
  const members = (event?.staffMembers || []).filter((p) => p.active !== false);

  const submit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (hasErrors) return;
    onConfirm(value);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[15px]">Nova atividade</DialogTitle>
          <DialogDescription className="text-[12px]">Preencha os dados. A atividade só entra na programação quando você confirmar, na posição do horário.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid grid-cols-2 gap-3" noValidate>
          <div className="col-span-2">
            <Label htmlFor="act-title" className={labelCls}>Título</Label>
            <Input id="act-title" className={fieldCls} value={form.title || ''} onChange={(e) => set('title', e.target.value)} aria-invalid={submitted && !!errors.title} autoFocus />
            {submitted && errors.title && <p className="mt-1 text-[11px] text-danger">{errors.title}</p>}
          </div>
          <div>
            <Label htmlFor="act-start" className={labelCls}>Horário de início</Label>
            <Input id="act-start" type="time" className={fieldCls} value={form.start || ''} onChange={(e) => set('start', e.target.value)} aria-invalid={submitted && !!errors.start} />
            {submitted && errors.start && <p className="mt-1 text-[11px] text-danger">{errors.start}</p>}
          </div>
          <div>
            <Label htmlFor="act-duration" className={labelCls}>Duração (min)</Label>
            <Input id="act-duration" type="number" min={5} step={5} className={fieldCls} value={form.duration ?? ''} onChange={(e) => set('duration', e.target.value)} aria-invalid={submitted && !!errors.duration} />
            {submitted && errors.duration && <p className="mt-1 text-[11px] text-danger">{errors.duration}</p>}
          </div>
          <div>
            <Label htmlFor="act-speaker" className={labelCls}>Responsável</Label>
            <Input id="act-speaker" className={fieldCls} list="act-members" value={form.speaker || ''} onChange={(e) => set('speaker', e.target.value)} />
            <datalist id="act-members">{members.map((p) => <option key={p.id} value={p.name} />)}</datalist>
          </div>
          <div>
            <Label className={labelCls}>Tipo</Label>
            <Select value={form.type || ''} onValueChange={(v) => set('type', v)}>
              <SelectTrigger aria-label="Tipo" className={fieldCls}><SelectValue /></SelectTrigger>
              <SelectContent>{types.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label htmlFor="act-notes" className={labelCls}>Observação</Label>
            <textarea id="act-notes" className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-[13px] shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[60px]" value={form.notes || ''} onChange={(e) => set('notes', e.target.value)} />
          </div>
          <div className="col-span-2">
            <Label className={labelCls}>Cor do bloco</Label>
            <div className="mt-1.5"><ColorPicker value={form.color || DEFAULT_COLOR} onChange={(c) => set('color', c)} /></div>
          </div>
          {conflicts.length > 0 && (
            <div role="status" data-testid="conflict-warning" className="col-span-2 flex items-start gap-2 rounded-md border border-warning/30 bg-warning/5 px-3 py-2">
              <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              <p className="text-[12px]">Este horário se sobrepõe a {conflicts.map((c) => `${c.title} (${c.start}–${minutesToTime(timeToMinutes(c.start) + (c.duration || 0))})`).join(', ')}. Você pode salvar mesmo assim.</p>
            </div>
          )}
          <DialogFooter className="col-span-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="h-8 text-[13px]">Cancelar</Button>
            <Button type="submit" className="h-8 text-[13px]">Adicionar atividade</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
