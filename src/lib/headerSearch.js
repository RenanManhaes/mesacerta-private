// Busca do cabeçalho (MCT-48). Função pura: recebe o evento e o termo,
// devolve grupos de sugestões. Sem I/O e sem cálculo de domínio.

export const MIN_QUERY = 2;
export const MAX_PER_GROUP = 5;

const norm = (s) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim();

const GROUPS = [
  {
    key: 'participantes',
    label: 'Participantes',
    to: 'participantes',
    list: (ev) => ev.participants,
    fields: (p) => [p.name, p.company, p.email],
    title: (p) => p.name,
    subtitle: (p) => [p.company, p.type].filter(Boolean).join(' · '),
  },
  {
    key: 'fornecedores',
    label: 'Fornecedores',
    to: 'fornecedores',
    list: (ev) => ev.suppliers,
    fields: (s) => [s.name, s.service, s.contact],
    title: (s) => s.name,
    subtitle: (s) => s.service,
  },
  {
    key: 'tarefas',
    label: 'Tarefas',
    to: 'tarefas',
    list: (ev) => ev.tasks,
    fields: (t) => [t.name, t.owner, t.category],
    title: (t) => t.name,
    subtitle: (t) => [t.category, t.owner].filter(Boolean).join(' · '),
  },
  {
    key: 'programacao',
    label: 'Programação',
    to: 'programacao',
    list: (ev) => ev.schedule,
    fields: (a) => [a.title, a.speaker, a.room],
    title: (a) => a.title,
    subtitle: (a) => [a.start, a.speaker].filter(Boolean).join(' · '),
  },
];

/** @returns {{key:string,label:string,items:{id:string,title:string,subtitle:string,to:string,q:string}[]}[]} */
export function searchEvent(ev, term) {
  const q = norm(term);
  if (!ev || q.length < MIN_QUERY) return [];
  const out = [];
  for (const g of GROUPS) {
    const items = (g.list(ev) || [])
      .filter((row) => g.fields(row).some((f) => norm(f).includes(q)))
      .slice(0, MAX_PER_GROUP)
      .map((row) => ({
        id: `${g.key}:${row.id}`,
        title: g.title(row) || '(sem nome)',
        subtitle: g.subtitle(row),
        to: g.to,
        q: g.title(row) || '',
      }));
    if (items.length) out.push({ key: g.key, label: g.label, items });
  }
  return out;
}

export const flatten = (groups) => groups.flatMap((g) => g.items);

export function itemPath(eventId, item) {
  return `/event/${eventId}/${item.to}?q=${encodeURIComponent(item.q)}`;
}
