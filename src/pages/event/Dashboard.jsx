import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useEvent } from '@/context/EventContext';
import { useAuth } from '@/lib/AuthContext';
import {
  financialSummary,
  taskSummary,
  scheduleSummary,
  supplierSummary,
  alerts,
  relativeLabel,
} from '@/lib/selectors';
import {
  formatBRL,
  formatPercent,
  formatDateFull,
  daysUntil,
} from '@/lib/format';
import {
  PageHeader,
  Kpi,
  Panel,
  Progress,
  Ring,
  FlowChart,
  Legend,
} from '@/components/common/ReferenceUI';
import { Button } from '@/components/ui/button';
import {
  CalendarClock,
  TrendingUp,
  Wallet,
  Users,
  Share2,
  Plus,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function Dashboard() {
  const { currentEvent: ev, updateCurrent } = useEvent();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const fin = financialSummary(ev),
    tasks = taskSummary(ev),
    sch = scheduleSummary(ev),
    sup = supplierSummary(ev);
  const attention = alerts(ev).slice(0, 4);
  const upcoming = [...ev.tasks]
    .filter((t) => t.status !== 'Concluído')
    .sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'))
    .slice(0, 4);
  const go = (to) => navigate(`/event/${ev.id}/${to}`);
  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: 'Link do evento copiado' });
    } catch {
      toast({
        title: 'Não foi possível copiar o link',
        variant: 'destructive',
      });
    }
  };
  const hour = new Date().getHours();
  const name =
    user?.user_metadata?.full_name?.split(' ')[0] ||
    user?.email?.split('@')[0] ||
    '';
  const organization = [
    [
      'Participantes',
      ev.confirmed || 0,
      ev.expectedAudience || 0,
      `${ev.confirmed || 0} / ${ev.expectedAudience || 0}`,
      'participantes',
    ],
    [
      'Tarefas',
      tasks.done,
      tasks.total,
      `${tasks.done} / ${tasks.total}`,
      'tarefas',
    ],
    [
      'Fornecedores pagos',
      sup.paid,
      sup.contracted,
      formatBRL(sup.paid),
      'fornecedores',
    ],
    [
      'Programação',
      sch.count,
      sch.count,
      `${sch.count} atividades`,
      'programacao',
    ],
  ];
  return (
    <div className="reference-page">
      <PageHeader
        eyebrow={`${formatDateFull(ev.date)} · ${ev.location || ev.city || 'Local a definir'}`}
        title={ev.name}
        subtitle={`${hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'}${name ? ', ' + name : ''}. Veja como está o seu evento.`}
        actions={
          <>
            <Button variant="outline" onClick={share}>
              <Share2 size={16} />
              Compartilhar
            </Button>
            <Button onClick={() => go('tarefas')}>
              <Plus size={16} />
              Nova tarefa
            </Button>
          </>
        }
      />
      <div className="platform-kpis">
        <Kpi
          icon={CalendarClock}
          label="Dias para o evento"
          value={ev.date ? Math.max(0, daysUntil(ev.date)) : '—'}
          sub={`Faltam ${tasks.pending} tarefas`}
          highlight
        />
        <Kpi
          icon={TrendingUp}
          label="Faturamento previsto"
          value={fin.faturamentoPrevisto}
          format={formatBRL}
          sub={`${formatPercent(fin.faturamentoPrevisto ? (fin.recebido / fin.faturamentoPrevisto) * 100 : 0, 0)} já recebido`}
          onClick={() => go('financeiro')}
        />
        <Kpi
          icon={Wallet}
          label="Resultado previsto"
          value={fin.resultadoPrevisto}
          format={formatBRL}
          sub={`Margem de ${formatPercent(fin.margem, 0)}`}
          onClick={() => go('financeiro')}
        />
        <Kpi
          icon={Users}
          label="Confirmados"
          value={Number(ev.confirmed) || 0}
          sub={`de ${ev.expectedAudience || 0} esperados`}
          onClick={() => go('participantes')}
        />
      </div>
      <div className="reference-grid-21">
        <Panel title="Entradas e saídas" extra={<Legend />}>
          <FlowChart event={ev} />
        </Panel>
        <Panel
          title="Precisa da sua atenção"
          extra={<small>{attention.length} itens</small>}
        >
          {attention.map((a, i) => (
            <button
              className="reference-list-row"
              key={i}
              onClick={() => go(a.to)}
            >
              <span
                className={`reference-avatar ${a.level === 'ok' ? 'positive' : 'coral'}`}
              >
                {a.level === 'ok' ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <AlertTriangle size={18} />
                )}
              </span>
              <span>{a.title}</span>
              <ChevronRight size={16} />
            </button>
          ))}
          {!attention.length && (
            <p className="text-muted-foreground">
              Nenhuma pendência encontrada.
            </p>
          )}
        </Panel>
      </div>
      <div className="reference-grid-3">
        <Panel
          title="Meta de faturamento"
          extra={<small>{formatPercent(fin.metaPct, 0)}</small>}
        >
          <div className="reference-ring-row">
            <Ring
              value={fin.faturamentoPrevisto}
              total={fin.meta}
              label={formatPercent(fin.metaPct, 0)}
              sub="da meta"
            />
            <dl className="reference-dl">
              {[
                ['Meta', fin.meta],
                ['Previsto', fin.faturamentoPrevisto],
                ['Falta', fin.faltaMeta],
              ].map(([l, v]) => (
                <div key={l}>
                  <dt>{l}</dt>
                  <dd>{formatBRL(v)}</dd>
                </div>
              ))}
            </dl>
          </div>
          {!fin.meta && (
            <button
              onClick={() => go('configuracoes')}
              className="text-sm text-info"
            >
              Definir meta
            </button>
          )}
        </Panel>
        <Panel
          title="Próximas tarefas"
          extra={<button onClick={() => go('tarefas')}>Ver todas</button>}
        >
          {upcoming.map((t) => (
            <label key={t.id} className="reference-list-row">
              <input
                type="checkbox"
                checked={false}
                onChange={() =>
                  updateCurrent((e) => ({
                    ...e,
                    tasks: e.tasks.map((x) =>
                      x.id === t.id ? { ...x, status: 'Concluído' } : x,
                    ),
                  }))
                }
              />
              <span>{t.name}</span>
              <small className="reference-tag">
                {t.date ? relativeLabel(daysUntil(t.date)) : 'Sem prazo'}
              </small>
            </label>
          ))}
          {!upcoming.length && (
            <p className="text-muted-foreground">
              Todas as tarefas concluídas.
            </p>
          )}
        </Panel>
        <Panel title="Organização">
          <div className="space-y-4">
            {organization.map(([l, v, total, text, to]) => (
              <button
                className="w-full text-left"
                key={l}
                onClick={() => go(to)}
              >
                <div className="reference-progress-label">
                  <span>{l}</span>
                  <b>{text}</b>
                </div>
                <Progress
                  value={v}
                  total={total}
                  tone={l === 'Programação' ? 'green' : 'blue'}
                />
              </button>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
