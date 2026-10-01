const BRL0 = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const BRL2 = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const NUM = new Intl.NumberFormat('pt-BR');

export const formatBRL = (n) => BRL0.format(Number.isFinite(n) ? n : 0);
export const formatBRLc = (n) => BRL2.format(Number.isFinite(n) ? n : 0);
export const formatNum = (n) => NUM.format(Number.isFinite(n) ? n : 0);

export const formatPercent = (n, digits = 1) =>
  `${(Number.isFinite(n) ? n : 0).toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`;

const MONTHS = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const MONTHS_SHORT = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

export const formatDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.getDate()} de ${MONTHS[d.getMonth()]}`;
};
export const formatDateFull = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`;
};
export const formatDateShort = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
};

export const daysUntil = (iso, from = new Date()) => {
  if (!iso) return 0;
  const d = new Date(iso + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return 0;
  const f = new Date(from);
  f.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - f.getTime()) / 86400000);
};

export const timeToMinutes = (t) => {
  if (!t) return 0;
  const [h, m] = String(t).split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};
export const minutesToTime = (mins) => {
  const m = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
};
export const addMinutes = (t, mins) => minutesToTime(timeToMinutes(t) + mins);

export const uid = () => Math.random().toString(36).slice(2, 10);
