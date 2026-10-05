import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEvent } from '@/context/EventContext';
import { financialSummary, financialEntries } from '@/lib/selectors';
import { chartPalette } from '@/lib/chartPalette';
import { formatBRL, formatPercent, formatDateShort } from '@/lib/format';
import {
  PageHeader,
  Kpi,
  Panel,
  Ring,
  FlowChart,
  Legend,
  exportCsv,
} from '@/components/common/ReferenceUI';
import { Button } from '@/components/ui/button';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Target,
  Download,
} from 'lucide-react';
export default function Financial() {
  const { currentEvent: ev } = useEvent();
  const navigate = useNavigate();
  const [realized, setRealized] = useState(false);
  const fin = financialSummary(ev),
    entries = financialEntries(ev, realized);
  const revenue = realized ? fin.recebido : fin.faturamentoPrevisto;
  const expense = realized ? fin.pago : fin.despesasPrevistas;
  const result = realized ? fin.resultadoAtual : fin.resultadoPrevisto;
  const composition = [
    {
      label: 'Ingressos',
      value: realized ? fin.ticketReceived : fin.ticketExpected,
      color: chartPalette.tones[0],
    },
    {
      label: 'Patrocínios',
      value: realized ? fin.sponsorReceived : fin.sponsorExpected,
      color: chartPalette.tones[1],
    },
    {
      label: 'Outras receitas',
      value: realized ? fin.otherReceived : fin.otherExpected,
      color: chartPalette.tones[2],
    },
  ];
  return (
    <div className="reference-page">
      <PageHeader
        eyebrow="Financeiro"
        title="Visão financeira"
        subtitle="Receitas, despesas e resultado deste evento."
        actions={
          <>
            <div className="reference-segments">
              {[false, true].map((v) => (
                <button
                  aria-pressed={realized === v}
                  className={realized === v ? 'on' : ''}
                  key={String(v)}
                  onClick={() => setRealized(v)}
                >
                  {v ? 'Realizado' : 'Previsto'}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              onClick={() =>
                exportCsv('financeiro.csv', [
                  ['Descrição', 'Categoria', 'Data', 'Entrada', 'Saída'],
                  ...entries.map((e) => [
                    e.label,
                    e.category,
                    e.date,
                    e.direction === 1 ? e.value : 0,
                    e.direction === -1 ? e.value : 0,
                  ]),
                ])
              }
            >
              <Download size={16} />
              Exportar
            </Button>
          </>
        }
      />
      <div className="platform-kpis">
        <Kpi
          icon={ArrowDownLeft}
          label="Receitas"
          value={revenue}
          format={formatBRL}
          sub={`${formatBRL(fin.aReceber)} a receber`}
        />
        <Kpi
          icon={ArrowUpRight}
          label="Despesas"
          value={expense}
          format={formatBRL}
          sub={`${formatBRL(fin.aPagar)} a pagar`}
        />
        <Kpi
          icon={Wallet}
          label="Resultado"
          value={result}
          format={formatBRL}
          sub={`Margem de ${formatPercent(revenue ? (result / revenue) * 100 : 0, 0)}`}
          highlight
        />
        <Kpi
          icon={Target}
          label="Ponto de equilíbrio"
          value={fin.breakEvenPossible ? fin.breakEven : 'Inviável'}
          sub={
            fin.breakEvenApproximate
              ? 'estimativa conservadora de ingressos'
              : 'ingressos pagantes'
          }
        />
      </div>
      <div className="reference-grid-21">
        <Panel title="Fluxo de caixa" extra={<Legend />}>
          <FlowChart event={ev} realized={realized} />
        </Panel>
        <Panel title="Composição das receitas">
          <div className="reference-ring-row">
            <Ring
              value={revenue}
              total={revenue}
              label={formatBRL(revenue)}
              sub={realized ? 'recebido' : 'previsto'}
              segments={composition}
            />
            <div className="reference-composition">
              {composition.map((c) => (
                <div key={c.label}>
                  <i style={{ background: c.color }} />
                  <span>{c.label}</span>
                  <b>{formatBRL(c.value)}</b>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>
      <Panel
        title="Lançamentos recentes"
        extra={
          <button onClick={() => navigate(`/event/${ev.id}/despesas`)}>
            Ver tudo
          </button>
        }
      >
        {entries.slice(0, 6).map((e) => (
          <button
            key={e.id}
            className="reference-list-row"
            onClick={() =>
              navigate(
                `/event/${ev.id}/${e.direction < 0 ? 'despesas' : e.category === 'Patrocínios' ? 'patrocinios' : 'receitas'}`,
              )
            }
          >
            <span
              className={`reference-avatar ${e.direction < 0 ? 'coral' : ''}`}
            >
              {e.direction < 0 ? (
                <ArrowUpRight size={18} />
              ) : (
                <ArrowDownLeft size={18} />
              )}
            </span>
            <span>
              <b>{e.label}</b>
              <small>
                {e.date ? formatDateShort(e.date) : 'Sem data registrada'}
              </small>
            </span>
            <strong className={e.direction > 0 ? 'text-positive' : ''}>
              {e.direction > 0 ? '+' : '−'} {formatBRL(e.value)}
            </strong>
          </button>
        ))}
        {!entries.length && (
          <p className="text-muted-foreground">
            Nenhum lançamento neste evento.
          </p>
        )}
      </Panel>
    </div>
  );
}
