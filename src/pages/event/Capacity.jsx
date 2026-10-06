import { useEventField } from '@/lib/useEventField';
import React from 'react';
import { useEvent } from '@/context/EventContext';
import { capacitySummary } from '@/lib/selectors';
import { uid } from '@/lib/format';
import { chartPalette } from '@/lib/chartPalette';
import {
  PageHeader,
  Panel,
  Progress,
  Field,
} from '@/components/common/ReferenceUI';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
export default function Capacity() {
  const { currentEvent: ev, updateCurrent } = useEvent();
  const [draft, setDraft] = useEventField('capacity.draft', null);
  const cap = capacitySummary(ev),
    pct = cap.capacity ? (cap.reserved / cap.capacity) * 100 : 0;
  const environments = ev.environments || [];
  const set = (k, v) =>
    updateCurrent((e) => ({ ...e, [k]: Math.max(0, Math.floor(v)) }));
  const patch = (p) => setDraft((d) => ({ ...d, ...p }));
  const save = (e) => {
    e.preventDefault();
    updateCurrent((ev) => ({
      ...ev,
      environments: (ev.environments || []).some((x) => x.id === draft.id)
        ? ev.environments.map((x) => (x.id === draft.id ? draft : x))
        : [...(ev.environments || []), draft],
    }));
    setDraft(null);
  };
  return (
    <div className="reference-page">
      <PageHeader
        eyebrow="Operação"
        title="Capacidade"
        subtitle="Lotação do espaço e de cada ambiente."
      />
      <div className="reference-grid-12">
        <Panel
          title="Lotação geral"
          extra={
            <span
              className={`reference-tag ${cap.status === 'over' ? 'warning' : 'positive'}`}
            >
              ●{' '}
              {cap.status === 'over'
                ? 'Acima da capacidade'
                : cap.status === 'tight'
                  ? 'Quase lotado'
                  : 'Saudável'}
            </span>
          }
        >
          <div className="reference-gauge">
            <svg viewBox="0 0 260 160" aria-hidden="true">
              <path
                d="M20 140 A110 110 0 0 1 240 140"
                fill="none"
                stroke={chartPalette.track}
                strokeWidth="20"
                strokeLinecap="round"
              />
              <path
                d="M20 140 A110 110 0 0 1 240 140"
                fill="none"
                stroke={chartPalette.base}
                strokeWidth="20"
                strokeLinecap="round"
                pathLength="100"
                strokeDasharray={`${Math.min(100, Math.max(0, pct))} 100`}
              />
            </svg>
            <div>
              <b>{Math.round(pct)}%</b>
              <small>
                {cap.reserved} de {cap.capacity} lugares
              </small>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {cap.available} lugares disponíveis
            {cap.overExpected > 0
              ? ` · Público previsto excede a capacidade em ${cap.overExpected}`
              : ''}
          </p>
        </Panel>
        <Panel
          title="Ambientes"
          extra={
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setDraft({ id: uid(), name: '', occupied: 0, capacity: 0 })
              }
            >
              <Plus size={14} />
              Ambiente
            </Button>
          }
        >
          <div className="space-y-4">
            {environments.map((a) => (
              <button
                key={a.id}
                className="w-full text-left"
                onClick={() => setDraft({ ...a })}
              >
                <div className="reference-progress-label">
                  <span>{a.name}</span>
                  <b>
                    {a.occupied} / {a.capacity}
                  </b>
                </div>
                <Progress
                  value={a.occupied}
                  total={a.capacity}
                  tone={a.occupied >= a.capacity ? 'coral' : 'blue'}
                />
              </button>
            ))}
            {!environments.length && (
              <p className="text-muted-foreground text-sm">
                Cadastre os ambientes do evento e suas lotações.
              </p>
            )}
          </div>
        </Panel>
      </div>
      <Panel title="Ajustar">
        <div className="reference-grid-3">
          {[
            ['Capacidade do espaço', 'capacity'],
            ['Público previsto', 'expectedAudience'],
            ['Confirmados', 'confirmed'],
            ['Cortesias', 'complimentary'],
            ['Equipe', 'staff'],
          ].map(([label, key]) => (
            <Field
              key={key}
              label={label}
              type="number"
              min={0}
              value={ev[key]}
              onChange={(v) => set(key, v)}
            />
          ))}
        </div>
        <p className="text-muted-foreground text-sm mt-4">
          O público previsto recalcula os custos por pessoa e o resultado
          financeiro. As lotações dos ambientes são informadas separadamente.
        </p>
      </Panel>
      <Dialog
        open={!!draft}
        onOpenChange={(v) => {
          if (!v) setDraft(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ambiente</DialogTitle>
          </DialogHeader>
          {draft && (
            <form onSubmit={save} className="space-y-4">
              <Field
                label="Nome do ambiente"
                value={draft.name}
                required
                onChange={(name) => patch({ name })}
              />
              <Field
                label="Capacidade"
                type="number"
                min={1}
                required
                value={draft.capacity}
                onChange={(capacity) =>
                  patch({ capacity: Math.floor(capacity) })
                }
              />
              <Field
                label="Lugares ocupados"
                type="number"
                min={0}
                value={draft.occupied}
                onChange={(occupied) =>
                  patch({ occupied: Math.floor(occupied) })
                }
              />
              <DialogFooter>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setDraft(null)}
                >
                  Cancelar
                </Button>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
