import { timeToMinutes, minutesToTime } from './format.js';

// Paleta de tons frios para o organizador separar visualmente as partes do evento.
export const COOL_PALETTE = [
  { key: 'azul', label: 'Azul', hex: '#3b82f6', soft: '#e8f0fe' },
  { key: 'ceu', label: 'Céu', hex: '#0ea5e9', soft: '#e3f4fc' },
  { key: 'ciano', label: 'Ciano', hex: '#06b6d4', soft: '#e0f7fb' },
  { key: 'turquesa', label: 'Turquesa', hex: '#14b8a6', soft: '#e0f6f3' },
  { key: 'indigo', label: 'Índigo', hex: '#6366f1', soft: '#ececfd' },
  { key: 'violeta', label: 'Violeta', hex: '#8b5cf6', soft: '#f0eafe' },
  { key: 'ardosia', label: 'Ardósia', hex: '#64748b', soft: '#eaeef3' },
];
export const DEFAULT_COLOR = 'azul';
export const colorOf = (item) => COOL_PALETTE.find((c) => c.key === item?.color) || COOL_PALETTE[0];

export const SNAP_MINUTES = 5;
const DAY = 24 * 60;

export const endMinutes = (item) => timeToMinutes(item.start) + (Number(item.duration) || 0);

// Ordena pela hora de início; empate preserva a ordem atual (estável).
export const sortSchedule = (list) =>
  list
    .map((item, i) => ({ item, i }))
    .sort((a, b) => timeToMinutes(a.item.start) - timeToMinutes(b.item.start) || a.i - b.i)
    .map((x) => x.item);

// Coloca a atividade na posição certa pela hora (depois das que começam no mesmo horário).
export const insertActivity = (list, activity) => sortSchedule([...list, activity]);

const overlaps = (a, b) => {
  const aS = timeToMinutes(a.start), aE = endMinutes(a);
  const bS = timeToMinutes(b.start), bE = endMinutes(b);
  return aE > aS && bE > bS && aS < bE && bS < aE;
};

// Atividades que se sobrepõem à candidata (sem contar ela mesma). Encostar (fim = início) não é conflito.
export const conflictsFor = (list, candidate) =>
  list.filter((o) => o.id !== candidate.id && overlaps(o, candidate));

// Mapa id -> atividades em conflito.
export const findConflicts = (list) => {
  const map = new Map();
  list.forEach((it) => {
    const c = conflictsFor(list, it);
    if (c.length) map.set(it.id, c);
  });
  return map;
};

// Move a atividade para um novo início (em minutos), encaixando em múltiplos de 5 min dentro do dia.
export const moveActivity = (list, id, newStartMinutes) =>
  sortSchedule(
    list.map((it) => {
      if (it.id !== id) return it;
      const max = Math.max(0, DAY - (Number(it.duration) || 0));
      const snapped = Math.round(newStartMinutes / SNAP_MINUTES) * SNAP_MINUTES;
      return { ...it, start: minutesToTime(Math.min(max, Math.max(0, snapped))) };
    }),
  );

// Raias para exibir atividades sobrepostas lado a lado (sem trilhas: só visual do conflito).
export const layoutLanes = (items) => {
  const sorted = sortSchedule(items);
  const result = [];
  let cluster = [], clusterEnd = -1;
  const flush = () => {
    const lanes = [];
    cluster.forEach((it) => {
      let lane = lanes.findIndex((end) => end <= timeToMinutes(it.item.start));
      if (lane < 0) { lane = lanes.length; lanes.push(0); }
      lanes[lane] = endMinutes(it.item);
      it.__lane = lane;
    });
    cluster.forEach((it) => result.push({ item: it.item, lane: it.__lane, lanes: lanes.length }));
    cluster = []; clusterEnd = -1;
  };
  sorted.forEach((item) => {
    const s = timeToMinutes(item.start);
    if (cluster.length && s >= clusterEnd) flush();
    cluster.push({ item });
    clusterEnd = Math.max(clusterEnd, endMinutes(item));
  });
  if (cluster.length) flush();
  return result;
};

// Valida e normaliza os dados do formulário. Retorna { errors, value }.
export const validateActivity = (form) => {
  const errors = {};
  const title = String(form.title || '').trim();
  if (!title) errors.title = 'Informe o título.';
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(form.start || '')) errors.start = 'Informe o horário de início.';
  const duration = Math.round(Number(form.duration));
  if (!Number.isFinite(duration) || duration < 5 || duration > DAY) errors.duration = 'Duração entre 5 e 1440 minutos.';
  return {
    errors,
    value: {
      title,
      start: form.start,
      duration,
      speaker: String(form.speaker || '').trim(),
      type: form.type || 'Palestra',
      notes: String(form.notes || '').trim(),
      color: COOL_PALETTE.some((c) => c.key === form.color) ? form.color : DEFAULT_COLOR,
    },
  };
};
