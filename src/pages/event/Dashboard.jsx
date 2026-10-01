import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useEvent } from '@/context/EventContext';
import { financialSummary, capacitySummary, scheduleSummary, taskSummary, supplierSummary, alerts, upcomingActions, relativeLabel } from '@/lib/selectors';
import { formatBRL, formatPercent, formatDateFull, daysUntil, formatDateShort } from '@/lib/format';
import { SectionLabel, InfoTip, StatusPill } from '@/components/common/Primitives';
import { AlertTriangle, AlertCircle, CheckCircle2, ArrowRight, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const alertStyle = {
  critico: { icon: AlertTriangle, color: 'text-danger', dot: 'bg-danger' },
  atencao: { icon: AlertCircle, color: 'text-warning', dot: 'bg-warning' },
  ok: { icon: CheckCircle2, color: 'text-positive', dot: 'bg-positive' }
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function OrgLine({ label, value, to }) {
  const navigate = useNavigate();
  const { currentEvent } = useEvent();
  return (
    <button onClick={() => navigate(`/event/${currentEvent.id}/${to}`)} className="w-full flex items-center justify-between py-2.5 border-b border-border last:border-0 group">
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2">
        <span className="text-[13px] font-medium tnum text-right">{value}</span>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </span>
    </button>
  );
}

export default function Dashboard() {
  const { currentEvent } = useEvent();
  const navigate = useNavigate();
  if (!currentEvent) return null;

  const fin = financialSummary(currentEvent);
  const cap = capacitySummary(currentEvent);
  const sch = scheduleSummary(currentEvent);
  const tasks = taskSummary(currentEvent);
  const sup = supplierSummary(currentEvent);
  const al = alerts(currentEvent);
  const actions = upcomingActions(currentEvent);
  const ev = currentEvent;

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Greeting */}
      <div>
        <p className="text-[13px] text-muted-foreground">{greeting()}. Veja como está o seu evento.</p>
        <h1 className="font-display text-[30px] sm:text-[34px] leading-tight tracking-tight mt-1">{ev.name}</h1>
        <p className="mt-1 text-[14px] text-muted-foreground">
          {formatDateFull(ev.date)} · {ev.location || ev.city}
          {ev.date && <> · <span className="text-foreground font-medium">faltam {daysUntil(ev.date)} dias</span></>}
        </p>
      </div>

      {/* Financial summary — editorial hierarchy */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <SectionLabel>Resumo financeiro</SectionLabel>
          <button onClick={() => navigate(`/event/${ev.id}/financeiro`)} className="text-[12px] text-muted-foreground hover:text-foreground flex items-center gap-1">
            Ver financeiro <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        <div className="grid grid-cols-12 gap-x-8 gap-y-6 border-t border-border pt-5">
          {/* Primary: faturamento + resultado */}
          <div className="col-span-12 lg:col-span-5">
            <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Faturamento previsto</div>
            <div className="mt-1 font-display text-[40px] leading-none tracking-tight tnum">{formatBRL(fin.faturamentoPrevisto)}</div>
            <div className="mt-2 text-[13px] text-muted-foreground">
              {fin.recebido > 0 && <>Recebido <span className="text-positive font-medium tnum">{formatBRL(fin.recebido)}</span></>}
              {fin.aReceber > 0 && <> · A receber <span className="tnum">{formatBRL(fin.aReceber)}</span></>}
            </div>

            <div className="mt-6 pt-5 border-t border-border">
              <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Resultado previsto</div>
              <div className={cn('mt-1 font-display text-[30px] leading-none tracking-tight tnum', fin.resultadoPrevisto >= 0 ? 'text-foreground' : 'text-danger')}>
                {formatBRL(fin.resultadoPrevisto)}
              </div>
              <div className="mt-2 text-[13px] text-muted-foreground">
                Margem prevista <span className="font-medium text-foreground tnum">{formatPercent(fin.margem)}</span>
                <InfoTip text="Margem é o resultado previsto dividido pelo faturamento previsto." />
              </div>
            </div>
          </div>

          {/* Secondary lines */}
          <div className="col-span-12 lg:col-span-4 lg:border-l lg:border-border lg:pl-8">
            <dl className="space-y-3.5">
              <div className="flex justify-between items-baseline">
                <dt className="text-[13px] text-muted-foreground">Despesas previstas</dt>
                <dd className="tnum text-[14px] font-medium">{formatBRL(fin.despesasPrevistas)}</dd>
              </div>
              <div className="flex justify-between items-baseline pl-3">
                <dt className="text-[12px] text-muted-foreground/80">Já pago</dt>
                <dd className="tnum text-[12px] text-muted-foreground">{formatBRL(fin.pago)}</dd>
              </div>
              <div className="flex justify-between items-baseline pl-3">
                <dt className="text-[12px] text-muted-foreground/80">A pagar</dt>
                <dd className="tnum text-[12px] text-muted-foreground">{formatBRL(fin.aPagar)}</dd>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-border">
                <dt className="text-[13px] text-muted-foreground">Recebido</dt>
                <dd className="tnum text-[14px] font-medium text-positive">{formatBRL(fin.recebido)}</dd>
              </div>
              <div className="flex justify-between items-baseline">
                <dt className="text-[13px] text-muted-foreground">Patrocínios</dt>
                <dd className="tnum text-[13px]">{formatBRL(fin.sponsorReceived)} <span className="text-muted-foreground">/ {formatBRL(fin.sponsorExpected)}</span></dd>
              </div>
            </dl>
          </div>

          {/* Meta */}
          <div className="col-span-12 lg:col-span-3 lg:border-l lg:border-border lg:pl-8">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Meta de faturamento</span>
              <InfoTip text="A meta é o faturamento que você quer alcançar. Defina em Configurações." />
            </div>
            <div className="mt-1 tnum text-[20px] font-medium">{formatBRL(fin.meta)}</div>
            <div className="mt-3 h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${Math.min(100, fin.metaPct)}%` }} />
            </div>
            <div className="mt-2 text-[13px]">
              <span className="font-medium tnum">{formatPercent(fin.metaPct)}</span>
              <span className="text-muted-foreground"> da meta</span>
            </div>
            <div className="mt-1 text-[12px] text-muted-foreground">
              {fin.faltaMeta > 0 ? <>Faltam <span className="text-foreground font-medium tnum">{formatBRL(fin.faltaMeta)}</span></> : <>Meta atingida</>}
            </div>
          </div>
        </div>
      </section>

      {/* Attention */}
      <section>
        <SectionLabel className="mb-3">Precisa da sua atenção</SectionLabel>
        <div className="border-t border-border">
          {al.map((a, i) => {
            const s = alertStyle[a.level];
            const Icon = s.icon;
            return (
              <button key={i} onClick={() => navigate(`/event/${ev.id}/${a.to}`)} className="w-full flex items-center gap-3 py-3 border-b border-border last:border-0 text-left hover:bg-secondary/40 transition-colors group">
                <Icon className={cn('h-4 w-4 shrink-0', s.color)} />
                <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground w-16 shrink-0">{a.level === 'critico' ? 'Crítico' : a.level === 'atencao' ? 'Atenção' : 'OK'}</span>
                <span className="flex-1 text-[13px]">{a.title}</span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </button>
            );
          })}
        </div>
      </section>

      {/* Actions + Organization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <section>
          <SectionLabel className="mb-3">Próximas ações</SectionLabel>
          <div className="border-t border-border">
            {actions.length === 0 && <div className="py-4 text-[13px] text-muted-foreground">Nada urgente nos próximos dias.</div>}
            {actions.map((a, i) => (
              <div key={i} className="flex items-start gap-3 py-3 border-b border-border last:border-0">
                <div className="w-16 shrink-0">
                  <div className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">{relativeLabel(a.days)}</div>
                  <div className="text-[11px] text-muted-foreground/70 tnum">{formatDateShort(a.date)}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium">{a.label}</div>
                  <div className="mt-0.5 text-[12px] text-muted-foreground">{a.owner} · <StatusPill status={a.status} /></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <SectionLabel className="mb-3">Organização</SectionLabel>
          <div className="border-t border-border pt-1">
            <OrgLine label="Participantes" value={`${ev.confirmed} confirmados / ${ev.expectedAudience} esperados`} to="participantes" />
            <OrgLine label="Programação" value={`${sch.count} atividades / ${sch.durationText}`} to="programacao" />
            <OrgLine label="Tarefas" value={`${tasks.done} concluídas / ${tasks.pending} pendentes / ${tasks.overdue} atrasadas`} to="tarefas" />
            <OrgLine label="Fornecedores" value={`${sup.count} contratados / ${sup.pendingPayments} pagamentos pendentes`} to="fornecedores" />
            {ev.modules?.networking && (
              <OrgLine label="Networking" value={`${ev.networking.tables} mesas / ${ev.networking.rounds} rodadas`} to="networking" />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
