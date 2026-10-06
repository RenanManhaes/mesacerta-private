import { useEventField } from '@/lib/useEventField';
import React, { useState } from 'react';
import { useEvent } from '@/context/EventContext';
import { financialSummary } from '@/lib/selectors';
import { formatBRL, uid } from '@/lib/format';
import { SectionLabel, EmptyState } from '@/components/common/Primitives';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Sparkles, Handshake } from 'lucide-react';
import {
  PageHeader,
  Kpi,
  Panel,
  Progress,
  Field,
  initials,
} from '@/components/common/ReferenceUI';
import { useToast } from '@/components/ui/use-toast';

export default function Sponsors() {
  const { currentEvent: ev, updateCurrent } = useEvent();
  const { toast } = useToast();
  const [draft, setDraft] = useEventField('sponsors.draft', null);
  const [planOpen, setPlanOpen] = useState(false);
  const [plan, setPlan] = useEventField('sponsors.planDraft', { name: '', price: '', available: '' });

  const fin = financialSummary(ev);

  const addPlan = () => {
    if (!plan.name) return;
    updateCurrent((e) => ({
      ...e,
      sponsorPlans: [
        ...e.sponsorPlans,
        {
          id: uid(),
          name: plan.name,
          price: Math.max(0, Number(plan.price) || 0),
          available: Math.max(0, Math.floor(Number(plan.available) || 0)),
          sold: 0,
          complimentary: 0,
          benefits: '',
          notes: '',
        },
      ],
    }));
    setPlan({ name: '', price: '', available: '' });
    setPlanOpen(false);
    toast({ title: 'Plano criado', duration: 1500 });
  };
  const saveSponsor = (e) => {
    e.preventDefault();
    if (
      !draft.company.trim() ||
      draft.received < 0 ||
      draft.negotiated < draft.received
    )
      return;
    const next = {
      ...draft,
      status:
        draft.status === 'negociacao'
          ? 'negociacao'
          : draft.received >= draft.negotiated && draft.negotiated > 0
            ? 'quitado'
            : draft.received > 0
              ? 'parcial'
              : 'pendente',
    };
    updateCurrent((ev) => ({
      ...ev,
      sponsors: ev.sponsors.some((s) => s.id === next.id)
        ? ev.sponsors.map((s) => (s.id === next.id ? next : s))
        : [...ev.sponsors, next],
    }));
    setDraft(null);
    toast({ title: 'Patrocinador atualizado' });
  };
  const patch = (change) => setDraft((d) => ({ ...d, ...change }));
  const goal = Number(ev.goalSponsorship) || 0;
  const labelStatus = (s) =>
    s.status === 'negociacao'
      ? 'Em negociação'
      : s.received >= s.negotiated && s.negotiated > 0
        ? 'Pago'
        : s.received > 0
          ? 'Parcial'
          : 'Aguardando';
  return (
    <div className="reference-page">
      <PageHeader
        eyebrow="Financeiro"
        title="Patrocínios"
        subtitle="Cotas vendidas, contrapartidas e pagamentos."
        actions={
          <Button
            onClick={() =>
              setDraft({
                id: uid(),
                company: '',
                contact: '',
                plan: ev.sponsorPlans[0]?.name || '',
                negotiated: 0,
                received: 0,
                dueDate: '',
                status: 'pendente',
                deliverables: '',
              })
            }
          >
            <Plus size={16} />
            Novo patrocinador
          </Button>
        }
      />
      <div className="reference-grid-3">
        <Kpi
          icon={Sparkles}
          label="Captado"
          value={fin.sponsorExpected}
          format={formatBRL}
          sub={
            goal
              ? `Meta de ${formatBRL(goal)}`
              : 'Defina a meta em Configurações'
          }
          highlight
        />
        <Kpi
          icon={Handshake}
          label="Patrocinadores"
          value={ev.sponsors.length}
          sub={`${ev.sponsors.filter((s) => s.status === 'negociacao').length} em negociação`}
        />
        <Panel
          title="Meta de captação"
          extra={
            <small>
              {goal ? Math.round((fin.sponsorExpected / goal) * 100) : 0}%
            </small>
          }
        >
          <Progress value={fin.sponsorExpected} total={goal} tone="coral" />
          <p className="text-muted-foreground text-sm mt-3">
            {goal
              ? `Faltam ${formatBRL(Math.max(0, goal - fin.sponsorExpected))} para a meta`
              : 'Meta ainda não definida'}
          </p>
        </Panel>
      </div>
      <div className="reference-grid-2">
        {ev.sponsors.map((s) => (
          <button
            key={s.id}
            className="platform-panel reference-sponsor"
            onClick={() => setDraft({ ...s })}
          >
            <span className="reference-avatar">{initials(s.company)}</span>
            <span>
              <b>{s.company}</b>
              <small>
                Cota {s.plan || 'Sem plano'} · {formatBRL(s.negotiated)}
              </small>
            </span>
            <span
              className={`reference-tag ${s.received >= s.negotiated && s.negotiated > 0 ? 'positive' : s.status === 'negociacao' ? '' : 'warning'}`}
            >
              ● {labelStatus(s)}
            </span>
          </button>
        ))}
      </div>
      {!ev.sponsors.length && (
        <EmptyState
          title="Nenhum patrocinador"
          hint="Cadastre a primeira empresa."
        />
      )}
      <section className="platform-panel">
        <div className="reference-panel-head">
          <SectionLabel>Planos de patrocínio</SectionLabel>
          <Button variant="outline" onClick={() => setPlanOpen(true)}>
            <Plus size={16} />
            Plano
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ev.sponsorPlans.map((p) => (
            <div key={p.id} className="border border-border rounded-md p-4">
              <div className="flex items-baseline justify-between">
                <span className="text-[15px] font-medium">{p.name}</span>
                <span className="tnum text-[15px]">{formatBRL(p.price)}</span>
              </div>
              <div className="mt-1 text-[12px] text-muted-foreground">
                {
                  ev.sponsors.filter(
                    (s) => s.plan === p.name && s.status !== 'negociacao',
                  ).length
                }{' '}
                vendidos / {p.available} disponíveis · {p.complimentary}{' '}
                cortesias
              </div>
              {p.benefits && (
                <div className="mt-2 text-[12px] text-muted-foreground/80">
                  {p.benefits}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <Dialog
        open={!!draft}
        onOpenChange={(v) => {
          if (!v) setDraft(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Patrocinador</DialogTitle>
          </DialogHeader>
          {draft && (
            <form onSubmit={saveSponsor} className="space-y-4">
              <Field
                label="Empresa"
                value={draft.company}
                required
                onChange={(company) => patch({ company })}
              />
              <div className="reference-grid-2">
                <Field
                  label="Contato"
                  value={draft.contact}
                  onChange={(contact) => patch({ contact })}
                />
                <Field
                  label="Cota"
                  value={draft.plan}
                  onChange={(plan) => patch({ plan })}
                />
                <Field
                  label="Valor negociado (R$)"
                  type="number"
                  min={0}
                  value={draft.negotiated}
                  onChange={(negotiated) => patch({ negotiated })}
                />
                <Field
                  label="Valor recebido (R$)"
                  type="number"
                  min={0}
                  max={draft.negotiated}
                  value={draft.received}
                  onChange={(received) => patch({ received })}
                />
                <Field
                  label="Vencimento"
                  type="date"
                  value={draft.dueDate}
                  onChange={(dueDate) => patch({ dueDate })}
                />
                <Field
                  label="Data do recebimento"
                  type="date"
                  value={draft.receivedDate}
                  onChange={(receivedDate) => patch({ receivedDate })}
                />
              </div>
              <label className="reference-field">
                Situação
                <select
                  value={
                    draft.status === 'negociacao'
                      ? 'negociacao'
                      : draft.received >= draft.negotiated &&
                          draft.negotiated > 0
                        ? 'quitado'
                        : draft.received > 0
                          ? 'parcial'
                          : 'pendente'
                  }
                  onChange={(e) =>
                    patch(
                      e.target.value === 'quitado'
                        ? { status: 'quitado', received: draft.negotiated }
                        : e.target.value === 'pendente'
                          ? { status: 'pendente', received: 0 }
                          : { status: e.target.value },
                    )
                  }
                >
                  <option value="pendente">Aguardando</option>
                  <option value="parcial">
                    Parcial — informe o valor recebido
                  </option>
                  <option value="quitado">Pago</option>
                  <option value="negociacao">Em negociação</option>
                </select>
              </label>
              <Field
                label="Contrapartidas"
                value={draft.deliverables}
                onChange={(deliverables) => patch({ deliverables })}
              />
              <dl className="reference-dl">
                <div>
                  <dt>Saldo a receber</dt>
                  <dd>
                    {formatBRL(Math.max(0, draft.negotiated - draft.received))}
                  </dd>
                </div>
              </dl>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
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
      <Dialog open={planOpen} onOpenChange={setPlanOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-[15px]">
              Novo plano de patrocínio
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-[13px]">Nome do plano</Label>
              <Input
                className="mt-1.5 h-9"
                value={plan.name}
                onChange={(e) =>
                  setPlan((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Ex.: Master"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[13px]">Valor</Label>
                <Input
                  type="number"
                  className="mt-1.5 h-9"
                  value={plan.price}
                  onChange={(e) =>
                    setPlan((p) => ({ ...p, price: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label className="text-[13px]">Disponíveis</Label>
                <Input
                  type="number"
                  className="mt-1.5 h-9"
                  value={plan.available}
                  onChange={(e) =>
                    setPlan((p) => ({ ...p, available: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setPlanOpen(false)}
              className="text-[13px]"
            >
              Cancelar
            </Button>
            <Button onClick={addPlan} className="text-[13px]">
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
