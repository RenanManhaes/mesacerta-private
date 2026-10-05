import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useEvent } from '@/context/EventContext';
import { financialSummary, scheduleSummary, taskSummary, supplierSummary, alerts, upcomingActions, relativeLabel } from '@/lib/selectors';
import { formatBRL, formatPercent, formatDateFull, daysUntil, formatDateShort } from '@/lib/format';
import { StatusPill } from '@/components/common/Primitives';
import AnimatedValue from '@/components/common/AnimatedValue';
import SummaryChart from '@/components/financial/SummaryChart';
import { Wallet, Users, TrendingUp, ArrowDownRight, AlertTriangle, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';

const alertStyle = { critico: { icon: AlertTriangle, color: 'text-danger' }, atencao: { icon: AlertCircle, color: 'text-warning' }, ok: { icon: CheckCircle2, color: 'text-positive' } };

export default function Dashboard() {
  const { currentEvent: ev } = useEvent();
  const navigate = useNavigate();
  if (!ev) return null;
  const fin = financialSummary(ev), sch = scheduleSummary(ev), tasks = taskSummary(ev), sup = supplierSummary(ev);
  const al = alerts(ev), actions = upcomingActions(ev);
  const go = to => navigate(`/event/${ev.id}/${to}`);
  const hour = new Date().getHours();
  const summary = [
    { label: 'Faturamento previsto', value: fin.faturamentoPrevisto, format: formatBRL, sub: `${formatBRL(fin.recebido)} recebido`, icon: Wallet, to: 'financeiro' },
    { label: 'Despesas previstas', value: fin.despesasPrevistas, format: formatBRL, sub: `${formatBRL(fin.aPagar)} a pagar`, icon: ArrowDownRight, to: 'despesas' },
    { label: 'Resultado previsto', value: fin.resultadoPrevisto, format: formatBRL, sub: `Margem de ${formatPercent(fin.margem)}`, icon: TrendingUp, to: 'financeiro', highlight: true },
    { label: 'Confirmados', value: ev.confirmed || 0, sub: `de ${ev.expectedAudience || 0} esperados`, icon: Users, to: 'participantes' }
  ];
  const operational = [
    ['Participantes', `${ev.confirmed || 0} confirmados / ${ev.expectedAudience || 0} esperados`, 'participantes'],
    ['Programação', `${sch.count} atividades / ${sch.durationText}`, 'programacao'],
    ['Tarefas', `${tasks.done} concluídas / ${tasks.pending} pendentes / ${tasks.overdue} atrasadas`, 'tarefas'],
    ['Fornecedores', `${sup.count} contratados / ${sup.pendingPayments} pagamentos pendentes`, 'fornecedores'],
    ...(ev.modules?.networking ? [['Networking', `${ev.networking.tables} mesas / ${ev.networking.rounds} rodadas`, 'networking']] : [])
  ];
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <p className="platform-eyebrow">Visão geral</p>
        <h1 className="mt-2">{ev.name}</h1>
        <p className="text-muted-foreground mt-2">{hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'}. Veja como está o seu evento.</p>
        <p className="text-muted-foreground mt-1 text-[13px]">{formatDateFull(ev.date)} · {ev.location || ev.city}{ev.date && <> · {daysUntil(ev.date)} dias para o evento</>}</p>
      </div>
      <div className="platform-kpis">
        {summary.map(({ label, value, format, sub, icon: Icon, to, highlight }) => <button key={label} onClick={() => go(to)} className={`platform-kpi ${highlight ? 'highlight' : ''}`}><small><Icon className="w-4 h-4" />{label}</small><b><AnimatedValue value={value} format={format} /></b><span>{sub}</span></button>)}
      </div>
      <div className="platform-dashboard-grid">
        <section className="platform-panel">
          <div className="flex items-center justify-between mb-5"><h2>Resumo financeiro</h2><button className="text-sm text-info" onClick={() => go('financeiro')}>Ver financeiro →</button></div>
          <SummaryChart summary={fin} />
          <dl className="grid sm:grid-cols-2 gap-5">
            {[
              ['Recebido', fin.recebido], ['A receber', fin.aReceber], ['Já pago', fin.pago], ['A pagar', fin.aPagar], ['Patrocínios previstos', fin.sponsorExpected], ['Patrocínios recebidos', fin.sponsorReceived]
            ].map(([label, value]) => <div key={label}><dt className="text-muted-foreground text-[13px]">{label}</dt><dd className="font-semibold text-lg mt-1">{formatBRL(Number(value))}</dd></div>)}
          </dl>
          <div className="mt-6 pt-5 border-t border-border">
            <div className="flex justify-between gap-3 text-sm mb-3"><span>Meta de faturamento</span><strong>{formatBRL(fin.meta)}</strong></div>
            <div className="platform-bar"><div style={{ width: `${Math.max(0, Math.min(100, fin.metaPct))}%` }} /></div>
            <p className="text-muted-foreground text-sm mt-3">{fin.meta > 0 ? <>{formatPercent(fin.metaPct)} da meta · {fin.faltaMeta > 0 ? `Faltam ${formatBRL(fin.faltaMeta)}` : 'Meta atingida'}</> : 'Defina sua meta em Configurações.'}</p>
          </div>
        </section>
        <section className="platform-panel">
          <h2 className="mb-3">Precisa da sua atenção</h2>
          {al.map((a, i) => { const { icon: Icon, color } = alertStyle[a.level]; return <button key={i} onClick={() => go(a.to)} className="w-full flex items-center gap-3 text-left py-3 border-b border-border last:border-0 hover:bg-secondary rounded-lg"><Icon className={`w-4 h-4 shrink-0 ${color}`} /><span className="flex-1 text-sm">{a.title}</span><ChevronRight className="w-4 h-4 text-muted-foreground" /></button>; })}
        </section>
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <section className="platform-panel"><h2 className="mb-3">Próximas ações</h2>
          {!actions.length && <p className="text-muted-foreground text-sm py-4">Nada urgente nos próximos dias.</p>}
          {actions.map((a, i) => <div key={i} className="flex items-start gap-3 py-3 border-b border-border last:border-0"><div className="w-16 shrink-0 text-xs text-muted-foreground"><b>{relativeLabel(a.days)}</b><div>{formatDateShort(a.date)}</div></div><div className="min-w-0"><div className="font-medium text-sm">{a.label}</div><div className="text-xs text-muted-foreground mt-1">{a.owner} · <StatusPill status={a.status} /></div></div></div>)}
        </section>
        <section className="platform-panel"><h2 className="mb-3">Organização</h2>
          {operational.map(([label, value, to]) => <button key={label} onClick={() => go(to)} className="w-full flex items-center gap-3 py-3 border-b border-border last:border-0 text-left"><span className="text-sm text-muted-foreground">{label}</span><span className="flex-1 text-right text-sm font-medium">{value}</span><ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground" /></button>)}
        </section>
      </div>
    </div>
  );
}
