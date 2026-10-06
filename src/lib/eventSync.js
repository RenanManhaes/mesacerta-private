// Gravação de um evento com junção automática quando outra pessoa salvou antes (erro 40001).
import { mergeEventDocument } from './mergeEventDocument.js';

export const MAX_SAVE_ATTEMPTS = 3;

const isRevisionConflict = (error) => error?.code === '40001';

// Busca o documento e a revisão atuais de um evento no servidor (já filtrados pelo papel do usuário).
export async function fetchEventRow(client, id, timeoutMs = 15000) {
  const { data, error } = await client.rpc('event_list').abortSignal(AbortSignal.timeout(timeoutMs));
  if (error) throw new Error(error.message);
  return (data || []).find((row) => row.document?.id === id) || null;
}

// base = último documento confirmado pelo servidor; document = o local.
// Retorna { document, revision, conflicts, merged }; "document" é o que ficou gravado.
export async function saveEventWithMerge({ client, base, document, revision, maxAttempts = MAX_SAVE_ATTEMPTS, timeoutMs = 15000 }) {
  let currentBase = base;
  let current = document;
  let currentRevision = revision;
  const conflicts = [];
  let merged = false;
  for (let attempt = 1; ; attempt++) {
    const { data, error } = await client
      .rpc('event_save', { p_event: current.id, p_revision: currentRevision, p_document: current })
      .abortSignal(AbortSignal.timeout(timeoutMs));
    if (!error) return { document: current, revision: data, conflicts, merged };
    if (!isRevisionConflict(error) || attempt >= maxAttempts) throw new Error(error.message);
    const row = await fetchEventRow(client, current.id, timeoutMs);
    if (!row) throw new Error(error.message);
    const result = mergeEventDocument(currentBase, current, row.document);
    conflicts.push(...result.conflicts);
    merged = true;
    currentBase = row.document;
    current = result.document;
    currentRevision = row.revision;
  }
}
