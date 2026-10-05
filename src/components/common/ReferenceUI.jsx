import React, { useId } from 'react';
import AnimatedValue from './AnimatedValue';
import { formatBRL, formatDateShort } from '@/lib/format';
import { cashFlow } from '@/lib/selectors';
import { chartPalette } from '@/lib/chartPalette';

export function PageHeader({ eyebrow, title, subtitle, actions = null }) {
  return (
    <header className="reference-header">
      <div>
        <p className="platform-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="text-muted-foreground">{subtitle}</p>
      </div>
      <div className="reference-actions">{actions}</div>
    </header>
  );
}
export function Kpi({
  icon: Icon,
  label,
  value,
  sub,
  highlight = false,
  format = undefined,
  onClick = undefined,
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      className={`platform-kpi ${highlight ? 'highlight' : ''}`}
      onClick={onClick}
    >
      <small>
        {Icon && <Icon size={16} />}
        {label}
      </small>
      <b>
        {typeof value === 'number' ? (
          <AnimatedValue value={value} format={format} />
        ) : (
          value
        )}
      </b>
      <span>{sub}</span>
    </Tag>
  );
}
export function Panel({ title, extra = null, children, className = '' }) {
  return (
    <section className={`platform-panel ${className}`}>
      <div className="reference-panel-head">
        <h2>{title}</h2>
        {extra}
      </div>
      {children}
    </section>
  );
}
export function Progress({ value, total = 100, tone = 'blue' }) {
  const pct = total > 0 ? Math.max(0, Math.min(100, (value / total) * 100)) : 0;
  return (
    <div
      className={`platform-bar progress-${tone}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
    >
      <div style={{ width: `${pct}%` }} />
    </div>
  );
}
export function Ring({ value, total, label, sub, segments = null }) {
  const pieces = segments || [{ value, color: chartPalette.base }];
  let offset = 0;
  return (
    <div className="reference-ring">
      <svg viewBox="0 0 160 160" aria-hidden="true">
        <circle
          cx="80"
          cy="80"
          r="66"
          fill="none"
          stroke={chartPalette.track}
          strokeWidth="18"
        />
        {pieces.map((s, i) => {
          const length =
            total > 0 ? Math.max(0, Math.min(1 - offset, s.value / total)) : 0;
          const start = offset;
          offset += length;
          return (
            <circle
              key={i}
              cx="80"
              cy="80"
              r="66"
              fill="none"
              stroke={s.color}
              strokeWidth="18"
              pathLength="100"
              strokeDasharray={`${length * 100} ${100 - length * 100}`}
              strokeDashoffset={-start * 100}
              transform="rotate(-90 80 80)"
            />
          );
        })}
      </svg>
      <div>
        <b>{label}</b>
        <small>{sub}</small>
      </div>
    </div>
  );
}
export function FlowChart({ event, realized = false }) {
  const flow = cashFlow(event, realized);
  const max = Math.max(1, ...flow.weeks.flatMap((w) => [w.income, w.expense]));
  return (
    <>
      <div
        className="reference-chart"
        aria-label={`Fluxo ${realized ? 'realizado' : 'previsto'} em oito semanas`}
      >
        {flow.weeks.map((w, i) => (
          <div key={w.date} className="reference-chart-week">
            <div className="reference-chart-bars">
              <div
                title={`Entradas: ${formatBRL(w.income)}`}
                style={{ height: `${(w.income / max) * 100}%` }}
              />
              <div
                title={`Saídas: ${formatBRL(w.expense)}`}
                style={{ height: `${(w.expense / max) * 100}%` }}
              />
            </div>
            <small title={formatDateShort(w.date)}>S{i + 1}</small>
            <span className="sr-only">
              {formatDateShort(w.date)}: entradas {formatBRL(w.income)}, saídas{' '}
              {formatBRL(w.expense)}
            </span>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        {formatDateShort(flow.weeks[0].date)} – {formatDateShort(flow.end)}
        {flow.undated > 0
          ? ` · ${formatBRL(flow.undated)} sem data de ${realized ? 'pagamento' : 'vencimento'}`
          : ''}
      </p>
    </>
  );
}
export function Legend() {
  return (
    <span className="reference-legend">
      <span>
        <i />
        Entradas
      </span>
      <span>
        <i />
        Saídas
      </span>
    </span>
  );
}
export function Field({
  label,
  value,
  onChange,
  type = 'text',
  min = undefined,
  max = undefined,
  required = false,
}) {
  const id = useId();
  return (
    <label htmlFor={id} className="reference-field">
      <span>{label}</span>
      <input
        id={id}
        type={type}
        min={min}
        max={max}
        step={type === 'number' ? 'any' : undefined}
        required={required}
        value={value ?? ''}
        onInput={type === 'date' || type === 'time' ? e => onChange(e.currentTarget.value) : undefined}
        onChange={(e) =>
          onChange(
            type === 'number' ? Number(e.target.value) || 0 : e.target.value,
          )
        }
      />
    </label>
  );
}
export const initials = (name) =>
  (name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
export function exportCsv(name, rows) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          let value = String(cell ?? '');
          if (/^[=+@-]/.test(value)) value = `'${value}`;
          return `"${value.replaceAll('"', '""')}"`;
        })
        .join(';'),
    )
    .join('\r\n');
  const url = URL.createObjectURL(
    new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
