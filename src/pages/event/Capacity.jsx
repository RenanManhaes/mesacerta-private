import React from 'react';
import { useEvent } from '@/context/EventContext';
import { capacitySummary } from '@/lib/selectors';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

function Field({ label, value, onChange, suffix }) {
  return (
    <div>
      <Label className="text-[12px] text-muted-foreground">{label}</Label>
      <div className="mt-1 flex items-center gap-2">
        <Input type="number" value={value} onChange={e => onChange(Number(e.target.value) || 0)} className="h-9 w-32 text-[14px] tnum" />
        {suffix && <span className="text-[12px] text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}

export default function Capacity() {
  const { currentEvent: ev, updateCurrent } = useEvent();
  const cap = capacitySummary(ev);
  const set = (k) => (v) => updateCurrent(e => ({ ...e, [k]: v }));

  const over = cap.status === 'over';
  const tight = cap.status === 'tight';
  const Icon = over ? AlertTriangle : CheckCircle2;
  const msg = over
    ? (cap.overExpected > 0 ? `Seu público previsto excede a capacidade do local em ${cap.overExpected} pessoas.` : 'Você ultrapassou a capacidade do local.')
    : tight ? `Seu espaço está quase lotado — restam apenas ${cap.available} lugares.` : `Seu espaço comporta ${cap.capacity} pessoas. ${cap.reserved} lugares já estão reservados. Você ainda pode receber ${cap.available} pessoas.`;

  const rows = [
    { label: 'Capacidade máxima', value: cap.capacity, color: 'bg-foreground' },
    { label: 'Público previsto', value: cap.expected, color: 'bg-info' },
    { label: 'Confirmados', value: cap.confirmed, color: 'bg-positive' },
    { label: 'Cortesias', value: cap.complimentary, color: 'bg-warning' },
    { label: 'Equipe', value: cap.staff, color: 'bg-muted-foreground' }
  ];
  const max = cap.capacity || 1;

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl">
      <div>
        <h1 className="font-display text-[26px] tracking-tight">Capacidade</h1>
        <p className="mt-1 text-[14px] text-muted-foreground">Acompanhe se o espaço comporta o público planejado.</p>
      </div>

      <div className={cn('flex items-start gap-3 rounded-md border px-5 py-4', over ? 'border-danger/30 bg-danger/5' : tight ? 'border-warning/30 bg-warning/5' : 'border-positive/30 bg-positive/5')}>
        <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', over ? 'text-danger' : tight ? 'text-warning' : 'text-positive')} />
        <p className="text-[14px]">{msg}</p>
      </div>

      <div className="space-y-3">
        {rows.map(r => (
          <div key={r.label}>
            <div className="flex justify-between text-[13px] mb-1"><span className="text-muted-foreground">{r.label}</span><span className="tnum font-medium">{r.value}</span></div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden"><div className={cn('h-full rounded-full', r.color)} style={{ width: `${Math.min(100, (r.value / max) * 100)}%` }} /></div>
          </div>
        ))}
        <div className="flex justify-between text-[13px] pt-2 border-t border-border"><span className="text-muted-foreground">Disponíveis</span><span className="tnum font-medium">{cap.available}</span></div>
      </div>

      <div className="border-t border-border pt-6">
        <h2 className="text-[13px] font-medium uppercase tracking-[0.12em] text-muted-foreground mb-4">Ajustar</h2>
        <div className="flex flex-wrap gap-x-8 gap-y-4">
          <Field label="Capacidade do espaço" value={ev.capacity} onChange={set('capacity')} suffix="pessoas" />
          <Field label="Público previsto" value={ev.expectedAudience} onChange={set('expectedAudience')} suffix="pessoas" />
          <Field label="Confirmados" value={ev.confirmed} onChange={set('confirmed')} suffix="pessoas" />
          <Field label="Cortesias" value={ev.complimentary} onChange={set('complimentary')} suffix="pessoas" />
          <Field label="Equipe" value={ev.staff} onChange={set('staff')} suffix="pessoas" />
        </div>
        <p className="mt-4 text-[12px] text-muted-foreground">Alterar o público previsto recalcula custos por pessoa e o resultado financeiro automaticamente.</p>
      </div>
    </div>
  );
}
