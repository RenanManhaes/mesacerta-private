// Decisão pura de "o que fazer quando outra pessoa salvou o evento" (MCT-85).
// Sem React e sem rede: o EventContext só executa o que estas funções decidem.
// Reaproveita a junção em 3 vias do MCT-66 para nunca perder o que foi digitado e ainda não salvo.
import { mergeEventDocument, sameValue } from './mergeEventDocument.js';

// Guarda a maior revisão sinalizada de cada evento (os sinais podem chegar fora de ordem).
export function recordSignal(signals, eventId, revision) {
  const value = Number(revision);
  if (!eventId || !Number.isFinite(value)) return signals;
  return { ...signals, [eventId]: Math.max(value, signals[eventId] ?? -Infinity) };
}

// Há sinal de revisão mais nova do que a que esta sessão já conhece?
// Os sinais da própria gravação (revisão igual à conhecida) não contam: é assim que se evita o laço.
export function hasNewerSignal(signals, knownRevisions) {
  return Object.entries(signals).some(([id, revision]) => !(id in knownRevisions) || revision > Number(knownRevisions[id]));
}

// 'ignore'  nada mais novo (inclui o eco da minha própria gravação)
// 'defer'   há gravação em curso: espera terminar e confere de novo
// 'merge'   há edição local ainda não salva: junta com a versão do servidor, sem perder nada
// 'apply'   documento local limpo: troca pela versão do servidor
export function decideRefresh({ newer, writing, dirty }) {
  if (!newer) return 'ignore';
  if (writing) return 'defer';
  return dirty ? 'merge' : 'apply';
}

// Junta a lista de eventos do servidor (já filtrada pelo papel) com a lista local.
// acknowledged = última lista confirmada pelo servidor; local = o que está na tela; remote = o que o servidor tem agora.
// Retorna { events, acknowledged, revisions, changedIds, conflicts }.
export function reconcileRemote({ acknowledged, local, remote }) {
  const ackById = new Map(acknowledged.map((e) => [e.id, e]));
  const localById = new Map(local.map((e) => [e.id, e]));
  const remoteIds = new Set(remote.map((row) => row.document.id));
  const events = [];
  const changedIds = [];
  const conflicts = [];
  for (const row of remote) {
    const theirs = row.document;
    const mine = localById.get(theirs.id);
    const base = ackById.get(theirs.id);
    if (!mine) { events.push(theirs); changedIds.push(theirs.id); continue; }
    if (!base || sameValue(base, theirs)) { events.push(mine); continue; }
    if (sameValue(mine, base)) { events.push(theirs); changedIds.push(theirs.id); continue; }
    const result = mergeEventDocument(base, mine, theirs);
    conflicts.push(...result.conflicts);
    events.push(result.document);
    changedIds.push(theirs.id);
  }
  // Evento só local e nunca confirmado (criação em andamento) fica; evento confirmado que sumiu do servidor perdeu acesso.
  for (const event of local) if (!remoteIds.has(event.id) && !ackById.has(event.id)) events.push(event);
  return {
    events,
    acknowledged: remote.map((row) => row.document),
    revisions: Object.fromEntries(remote.map((row) => [row.document.id, row.revision])),
    changedIds,
    conflicts,
  };
}
