import { gerarDistribuicao, rotaDoParticipante } from '../../lib/networking/engine.js';

export const roles = { rotating: 'Participante', fixed: 'Anfitrião fixo', host: 'Anfitrião rotativo', out: 'Fora das rodadas' };
const normalize = value => String(value || '').trim().toLocaleLowerCase('pt-BR');
const validInteger = (n, min, max) => Number.isInteger(n) && n >= min && n <= max;

export function networkingInput(event) {
  const cfg = event.networking || {};
  const count = validInteger(cfg.tables, 2, 40) ? cfg.tables : 0;
  const tables = Array.from({ length: count }, (_, i) => ({
    id: `table-${i + 1}`, name: `Mesa ${i + 1}`, company: '', capacity: cfg.capacityPerTable ?? 7,
    ...cfg.tableList?.[i],
  }));
  const people = (event.participants || []).map(person => ({
    ...person,
    code: person.code || person.id,
    role: person.status === 'Cancelado' ? 'out' : 'rotating',
    tableId: '',
    ...cfg.participantSettings?.[person.id],
  }));
  const mobile = people.filter(p => p.role === 'rotating' || p.role === 'host');
  const fixed = people.filter(p => p.role === 'fixed');
  const errors = [];
  const warnings = [];
  if (!validInteger(cfg.tables, 2, 40)) errors.push('Configure de 2 a 40 mesas.');
  if (!validInteger(cfg.rounds, 1, 60)) errors.push('Configure de 1 a 60 rodadas.');
  if (!validInteger(cfg.seedBase ?? 1, 1, 2147483647)) errors.push('A seed deve ser um inteiro positivo.');
  if (mobile.length < 2) errors.push('É necessário ter pelo menos 2 pessoas rodando para gerar.');
  if (mobile.length > 400) errors.push('O limite é de 400 pessoas rodando.');
  if (new Set(people.map(p => p.id)).size !== people.length) errors.push('Há identificadores de pessoas repetidos; revise o cadastro.');
  const included = people.filter(p => p.role !== 'out');
  for (const person of included) {
    if (!String(person.id ?? '').trim()) errors.push(`${person.name || 'Pessoa'}: identificador ausente no cadastro.`);
    if (!normalize(person.name)) errors.push(`A pessoa ${person.code} está sem nome.`);
    if (!roles[person.role]) errors.push(`Papel inválido para ${person.name}.`);
    if (['fixed', 'host'].includes(person.role) && !tables.some(t => t.id === person.tableId)) {
      errors.push(`${person.name}: escolha a mesa ${person.role === 'fixed' ? 'do anfitrião fixo' : 'da própria empresa'}.`);
    }
  }
  const seen = new Set();
  for (const person of included) {
    const name = normalize(person.name);
    if (seen.has(name)) warnings.push(`Nome repetido: ${person.name}. Confira se são pessoas diferentes.`);
    seen.add(name);
  }
  if (new Set(tables.map(t => t.id)).size !== tables.length) errors.push('Há identificadores de mesas repetidos.');
  tables.forEach(table => {
    if (!String(table.id ?? '').trim()) errors.push('Toda mesa precisa de um identificador.');
    if (!validInteger(table.capacity, 2, 30)) errors.push(`${table.name}: capacidade deve ser um inteiro de 2 a 30.`);
    if (!normalize(table.name)) errors.push('Toda mesa precisa de um nome.');
    if (!fixed.some(p => p.tableId === table.id)) warnings.push(`${table.name}: mesa sem anfitrião fixo.`);
  });
  const cap = tables.length ? Math.min(...tables.map(t => t.capacity)) : 0;
  const fixosPorMesa = tables.map(t => fixed.filter(p => p.tableId === t.id).length);
  if (tables.length && mobile.length + fixed.length > cap * tables.length) {
    errors.push(`Faltam lugares para ${mobile.length + fixed.length} pessoas. A distribuição usa a menor capacidade (${cap}) em todas as mesas; aumente-a ou adicione mesas.`);
  }
  if (fixosPorMesa.some(n => n > cap)) errors.push('Uma mesa tem mais anfitriões fixos que a menor capacidade configurada.');
  if (new Set(tables.map(t => t.capacity)).size > 1) warnings.push(`Capacidades diferentes: a distribuição usa ${cap} lugares por mesa para garantir o limite de todas; os lugares adicionais continuam visíveis.`);
  if (cfg.rounds > tables.length && tables.length) warnings.push('Há mais rodadas que mesas: participantes precisarão repetir mesas. Reduza as rodadas para evitar retornos.');
  if (mobile.some(p => p.role === 'host') && cfg.rounds >= tables.length && tables.length) {
    warnings.push(`Com ${cfg.rounds} rodadas e ${tables.length} mesas, a passagem do anfitrião rotativo pela mesa da própria empresa é matematicamente inevitável em um percurso sem repetir mesas. Use no máximo ${tables.length - 1} rodadas para evitá-la.`);
  }
  return {
    tables, people, mobile, fixed, errors, warnings,
    engine: { P: mobile.length, T: tables.length, R: cfg.rounds, cap, fixosPorMesa,
      mesaDaCasa: mobile.map(p => p.role === 'host' ? tables.findIndex(t => t.id === p.tableId) : null), seedBase: cfg.seedBase ?? 1 },
  };
}

export function generateNetworking(input) {
  if (input.errors.length) throw new Error(input.errors.join('\n'));
  const result = { ...gerarDistribuicao(input.engine), input };
  // Validate the engine output; never silently change its assignment.
  for (let r = 0; r < input.engine.R; r++) {
    for (let t = 0; t < input.tables.length; t++) {
      if (occupants(result, r, t).length > input.tables[t].capacity) {
        throw new Error(`A grade excedeu a capacidade de ${input.tables[t].name} na rodada ${r + 1}. Revise capacidade, anfitriões e rodadas.`);
      }
    }
  }
  return result;
}

export function personRoute(result, person) {
  if (person.role === 'fixed') {
    const mesa = result.input.tables.findIndex(t => t.id === person.tableId) + 1;
    return Array.from({ length: result.input.engine.R }, (_, i) => ({ rodada: i + 1, mesa }));
  }
  const index = result.input.mobile.findIndex(p => p.id === person.id);
  return index < 0 ? [] : rotaDoParticipante(result.tab, index);
}

export function occupants(result, round, table) {
  const { input, analise } = result;
  const fixed = input.fixed.filter(p => p.tableId === input.tables[table].id).map(person => ({ person, fixed: true, home: false, returning: false, conflict: false }));
  const mobile = analise.at[round][table].map(index => ({
    person: input.mobile[index], fixed: false,
    home: input.engine.mesaDaCasa[index] === table,
    returning: analise.visitNo[index][round] > 1,
    conflict: analise.pairs.some(pair => pair.same && (pair.a === index || pair.b === index) && pair.ev.some(([r, t]) => r === round && t === table)),
  }));
  return [...fixed, ...mobile];
}

export function routeHasConflict(result, person) {
  const i = result.input.mobile.findIndex(p => p.id === person.id);
  return i >= 0 && (result.analise.person[i].again.length > 0 || result.analise.repByPart[i].reps.length > 0 || result.tab[i].includes(result.input.engine.mesaDaCasa[i]));
}
