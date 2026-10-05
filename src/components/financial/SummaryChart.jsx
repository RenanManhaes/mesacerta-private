import React from 'react';
import { formatBRL } from '@/lib/format';

/** @param {{summary: ReturnType<typeof import('@/lib/selectors').financialSummary>}} props */
export default function SummaryChart({ summary }) {
  const groups = [
    { label: 'Receitas', expected: summary.faturamentoPrevisto, actual: summary.recebido },
    { label: 'Despesas', expected: summary.despesasPrevistas, actual: summary.pago }
  ];
  const max = Math.max(1, ...groups.flatMap(group => [group.expected, group.actual]));
  return (
    <figure className="platform-summary-chart" aria-label="Comparação de receitas e despesas previstas e realizadas">
      <div className="platform-chart-legend"><span>Previsto</span><span>Realizado</span></div>
      <div className="platform-chart-groups">
        {groups.map(group => <div key={group.label} className="platform-chart-group"><div className="platform-chart-bars">
          {[['Previsto', group.expected], ['Realizado', group.actual]].map(([label, value]) => <div key={label} className="platform-chart-column"><span>{formatBRL(Number(value))}</span><div role="img" aria-label={`${group.label}: ${label} ${formatBRL(Number(value))}`} className={`platform-chart-bar ${label === 'Realizado' ? 'actual' : ''}`} style={{ height: `${Math.max(0, Number(value)) / max * 100}%` }} /></div>)}
        </div><div className="platform-chart-label">{group.label}</div></div>)}
      </div>
    </figure>
  );
}
