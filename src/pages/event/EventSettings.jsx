import { useEventField } from '@/lib/useEventField';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useEvent } from '@/context/EventContext';
import EventInvites from '@/components/EventInvites';
import {
  PageHeader,
  Panel,
  Field,
} from '@/components/common/ReferenceUI';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import {
  CalendarDays,
  Truck,
  Ticket,
  Sparkles,
  Network,
  Gauge,
  Check,
  Archive,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
/** @type {Array<[string, string, typeof CalendarDays]>} */
const modules = [
  ['schedule', 'Programação', CalendarDays],
  ['suppliers', 'Fornecedores', Truck],
  ['tickets', 'Ingressos e receitas', Ticket],
  ['sponsors', 'Patrocínios', Sparkles],
  ['networking', 'Rodadas de negócio', Network],
  ['capacity', 'Capacidade', Gauge],
];
export default function EventSettings() {
  const { currentEvent: ev, updateCurrent } = useEvent();
  const [draft, setDraft] = useEventField('settings.draft', () =>
    Object.fromEntries(
      [
        'name',
        'date',
        'expectedAudience',
        'location',
        'city',
        'desiredEndTime',
        'goalRevenue',
        'goalSponsorship',
        'cateringBudget',
        'status',
        'modules',
      ].map((key) => [key, key === 'modules' ? { ...ev.modules } : ev[key]]),
    ),
  );
  const [archive, setArchive] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const set = (key, value) => setDraft((d) => ({ ...d, [key]: value }));
  const dirty = Object.keys(draft).some(key=>JSON.stringify(draft[key])!==JSON.stringify(ev[key]));
  const save = () => {
    if (!draft.name.trim()) {
      toast({ title: 'Informe o nome do evento', variant: 'destructive' });
      return;
    }
    updateCurrent((e) => ({
      ...e,
      ...draft,
      networking: { ...e.networking, enabled: !!draft.modules.networking },
    }));
    toast({
      title: 'Alterações aplicadas',
      description: 'Acompanhe o salvamento no topo.',
    });
  };
  return (
    <div className="reference-page">
      <PageHeader
        eyebrow="Evento"
        title="Configurações"
        subtitle="Dados do evento, módulos e equipe."
        actions={
          <>{dirty && <small role="status" className="text-warning">Alterações pendentes</small>}<Button onClick={save}>
            <Check size={16} />
            Salvar
          </Button></>
        }
      />
      <div className="reference-grid-2">
        <Panel title="Dados do evento">
          <div className="space-y-4">
            <Field
              label="Nome"
              value={draft.name}
              required
              onChange={(v) => set('name', v)}
            />
            <div className="reference-grid-2">
              <Field
                label="Data"
                type="date"
                value={draft.date}
                onChange={(v) => set('date', v)}
              />
              <Field
                label="Público"
                type="number"
                min={0}
                value={draft.expectedAudience}
                onChange={(v) => set('expectedAudience', Math.floor(v))}
              />
            </div>
            <Field
              label="Local"
              value={draft.location}
              onChange={(v) => set('location', v)}
            />
            <details>
              <summary className="text-sm text-muted-foreground cursor-pointer">
                Mais informações e metas
              </summary>
              <div className="reference-grid-2 mt-4">
                <Field
                  label="Cidade"
                  value={draft.city}
                  onChange={(v) => set('city', v)}
                />
                <Field
                  label="Término desejado"
                  type="time"
                  value={draft.desiredEndTime}
                  onChange={(v) => set('desiredEndTime', v)}
                />
                <Field
                  label="Meta de faturamento (R$)"
                  type="number"
                  min={0}
                  value={draft.goalRevenue}
                  onChange={(v) => set('goalRevenue', v)}
                />
                <Field
                  label="Meta de patrocínios (R$)"
                  type="number"
                  min={0}
                  value={draft.goalSponsorship}
                  onChange={(v) => set('goalSponsorship', v)}
                />
                <Field
                  label="Orçamento de alimentação (R$)"
                  type="number"
                  min={0}
                  value={draft.cateringBudget}
                  onChange={(v) => set('cateringBudget', v)}
                />
                <label className="reference-field">
                  Status
                  <select
                    value={draft.status}
                    onChange={(e) => set('status', e.target.value)}
                  >
                    {[
                      'planejamento',
                      'confirmado',
                      'andamento',
                      'finalizado',
                    ].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
              </div>
            </details>
          </div>
        </Panel>
        <Panel title="Módulos" extra={<small>Ligue só o que usa</small>}>
          {modules.map(([key, label, Icon]) => (
            <div key={key} className="reference-list-row">
              <span className="reference-avatar">
                <Icon size={16} />
              </span>
              <span>{label}</span>
              <Switch
                aria-label={label}
                checked={
                  key === 'capacity'
                    ? draft.modules.capacity !== false
                    : !!draft.modules[key]
                }
                onCheckedChange={(checked) =>
                  setDraft((d) => ({
                    ...d,
                    modules: { ...d.modules, [key]: checked },
                  }))
                }
              />
            </div>
          ))}
        </Panel>
        <EventInvites />
        <Panel title="Acesso da equipe">
          <p className="text-sm text-muted-foreground">
            Para mudar o acesso de alguém, abra a pessoa em{' '}
            <Link className="underline underline-offset-2 text-foreground" to={`/event/${ev.id}/equipe`}>Equipe do evento</Link>.
          </p>
        </Panel>
        <Panel title="Zona de risco">
          <p className="text-muted-foreground text-sm mb-4">
            Arquivar remove o evento da lista principal, mas mantém os dados.
          </p>
          <Button
            variant="outline"
            className="text-danger"
            onClick={() => setArchive(true)}
          >
            <Archive size={16} />
            Arquivar evento
          </Button>
        </Panel>
      </div>
      <ConfirmDialog
        open={archive}
        onOpenChange={setArchive}
        title={`Arquivar ${ev.name}?`}
        description="Os dados serão mantidos. Você pode restaurar o evento na lista de arquivados."
        confirmLabel="Arquivar"
        onConfirm={() => {
          updateCurrent((e) => ({ ...e, archived: true }));
          navigate('/eventos');
        }}
      />
    </div>
  );
}
