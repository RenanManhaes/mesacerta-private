// Responsáveis por tarefa: busca entre os membros reais da equipe do evento.
// Funções puras (sem React). O ID estável é o ID do vínculo do membro (event_members.id).

export const normalizeText = (value) =>
  String(value || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('pt-BR').trim();

export const MAX_DESCRIPTION = 2000;

// IDs dos responsáveis de uma tarefa (aceita o formato antigo, com um só ownerId).
export function taskOwnerIds(task) {
  const raw = Array.isArray(task?.ownerIds) ? task.ownerIds : task?.ownerId ? [task.ownerId] : [];
  return [...new Set(raw.filter((id) => typeof id === 'string' && id))];
}

// Membro real = pessoa com vínculo autenticado (userId). Cadastros manuais antigos
// (sem vínculo) não entram, e a mesma pessoa nunca aparece duas vezes
// (mesmo id, mesma conta ou mesmo e-mail).
export function realMembers(staffMembers) {
  const seen = new Set();
  const out = [];
  for (const person of staffMembers || []) {
    if (!person?.id || !person.userId) continue;
    const keys = [`id:${person.id}`, `user:${person.userId}`];
    const email = normalizeText(person.email);
    if (email) keys.push(`mail:${email}`);
    if (keys.some((key) => seen.has(key))) continue;
    keys.forEach((key) => seen.add(key));
    out.push(person);
  }
  return out;
}

// Quem pode ser escolhido agora (ativos). Quem já está na tarefa é resolvido por findMember.
export const assignableMembers = (staffMembers) => realMembers(staffMembers).filter((p) => p.active !== false);

export const findMember = (staffMembers, id) => realMembers(staffMembers).find((p) => p.id === id) || null;

// Rótulos dos responsáveis para mostrar na tela, um por ID.
// Quem edita tem a equipe e vê o nome atual de cada pessoa. O staff NÃO recebe a equipe (a projeção dele
// traz só as próprias tarefas), então os IDs não resolvem; nesse caso usa o texto "owner" já gravado na tarefa.
// Se a equipe existe e o ID não está nela, é de fato alguém fora da equipe.
export function ownerChips(task, ids, members) {
  const hasTeam = realMembers(members).length > 0;
  if (hasTeam) return ids.map((id) => ({ id, label: findMember(members, id)?.name || 'Pessoa fora da equipe' }));
  const names = String(task?.owner || '').split(',').map((part) => part.trim()).filter(Boolean);
  if (!names.length) return ids.map((id) => ({ id, label: 'Pessoa fora da equipe' }));
  // Um nome por ID quando os números batem; senão, um único rótulo com o texto inteiro (sem adivinhar quem é quem).
  if (names.length === ids.length) return ids.map((id, index) => ({ id, label: names[index] }));
  return [{ id: ids[0] || names.join(', '), label: names.join(', ') }];
}

export function memberLabel(person) {
  const detail = person.jobTitle || person.function || person.role;
  return detail ? `${person.name} · ${detail}` : person.name;
}

// Busca sem acento nem maiúsculas, em nome, e-mail, função, área e cargo.
export function searchMembers(staffMembers, query, excludeIds = [], limit = 8) {
  const q = normalizeText(query);
  const skip = new Set(excludeIds);
  return assignableMembers(staffMembers)
    .filter((p) => !skip.has(p.id))
    .filter((p) => !q || normalizeText([p.name, p.email, p.function, p.area, p.jobTitle, p.role].join(' ')).includes(q))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    .slice(0, limit);
}

// Tarefa antiga só com nome em "owner": se bater com um membro real, já vem selecionado.
export function legacyOwnerMatches(task, staffMembers) {
  if (taskOwnerIds(task).length || !task?.owner) return [];
  const members = assignableMembers(staffMembers);
  const ids = [];
  for (const part of String(task.owner).split(',')) {
    const name = normalizeText(part);
    const hit = name ? members.filter((p) => normalizeText(p.name) === name) : [];
    if (hit.length === 1) ids.push(hit[0].id);
  }
  return [...new Set(ids)];
}

// Grava título, descrição e responsáveis. "owner" (nomes) e "ownerId" (primeiro)
// continuam preenchidos para o resto do app e para a visão restrita do staff.
export function applyTaskEdit(event, taskId, { name, description, ownerIds, legacyOwner = '' }) {
  const task = (event.tasks || []).find((t) => t.id === taskId);
  if (!task) return event;
  const before = new Set(taskOwnerIds(task));
  const allowed = new Set(assignableMembers(event.staffMembers).map((p) => p.id));
  const ids = [...new Set(ownerIds || [])].filter((id) => allowed.has(id) || before.has(id));
  const names = ids.map((id) => findMember(event.staffMembers, id)?.name).filter(Boolean);
  const title = String(name ?? '').trim() || task.name;
  const patch = {
    name: title,
    description: String(description ?? '').slice(0, MAX_DESCRIPTION),
    ownerIds: ids,
    ownerId: ids[0] || '',
    owner: names.length ? names.join(', ') : ids.length ? task.owner || '' : legacyOwner,
  };
  return { ...event, tasks: event.tasks.map((t) => (t.id === taskId ? { ...t, ...patch } : t)) };
}
