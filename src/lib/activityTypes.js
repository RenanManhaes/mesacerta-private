// Tipos de atividade da programação (por organização). Funções puras; o banco fica em
// src/hooks/useActivityTypes.js e a migração em supabase/migrations/*_activity_types.sql.

// Mesma lista que a migração semeia em toda organização.
export const DEFAULT_TYPES = ['Palestra', 'Painel', 'Rodada de negócio', 'Intervalo', 'Credenciamento', 'Almoço', 'Apresentação', 'Encerramento'];

export const normalizeTypeName = (s) => String(s ?? '').trim().replace(/\s+/g, ' ');

// Chave de comparação: sem acento, sem maiúsculas, sem espaços sobrando.
export const typeKey = (s) =>
  normalizeTypeName(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export const sortTypes = (list) => [...list].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

// Tipos que casam com o texto digitado (contém, sem acento/maiúscula); os que começam com o texto vêm primeiro.
export const filterTypes = (types, query) => {
  const q = typeKey(query);
  if (!q) return types;
  const hits = types.filter((t) => typeKey(t.name).includes(q));
  return [...hits.filter((t) => typeKey(t.name).startsWith(q)), ...hits.filter((t) => !typeKey(t.name).startsWith(q))];
};

export const findType = (types, name) => {
  const k = typeKey(name);
  return k ? types.find((t) => typeKey(t.name) === k) : undefined;
};

// Quantas atividades (e em quantos eventos) usam o tipo, somando todos os eventos da organização.
export const countUsage = (events, name) => {
  const k = typeKey(name);
  let activities = 0, eventCount = 0;
  for (const ev of events || []) {
    const n = (ev.schedule || []).filter((a) => typeKey(a.type) === k).length;
    if (n) { activities += n; eventCount++; }
  }
  return { activities, events: eventCount };
};

export const renameInEvent = (event, from, to) => {
  const k = typeKey(from);
  if (!(event.schedule || []).some((a) => typeKey(a.type) === k)) return event;
  return { ...event, schedule: event.schedule.map((a) => (typeKey(a.type) === k ? { ...a, type: to } : a)) };
};
