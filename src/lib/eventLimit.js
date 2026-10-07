import { contactUrl } from './contact.js';

// MCT-78: o limite de eventos ativos por conta comum vem do banco (event_limit()).
// Este arquivo só cuida do texto mostrado a quem organiza o evento.
export function eventLimitMessage(limit) {
  const n = Number(limit) > 0 ? Number(limit) : 1;
  return `Seu plano permite ${n} evento${n > 1 ? 's' : ''} ativo${n > 1 ? 's' : ''}. Para criar outro, fale com a gente.`;
}

export const EVENT_LIMIT_CONTACT_URL = contactUrl('Olá! Quero criar mais um evento no Mesa Certa.');

// O banco recusa com SQLSTATE 42501 e já devolve "Seu plano permite N evento(s) ativo(s)...".
// Bancos ainda sem a migração 20261007150000 devolvem o texto antigo "Sua conta pode manter até N eventos...":
// aqui ele é trocado pela mensagem padrão; os demais erros passam como estão.
export function friendlyCreateError(error) {
  const text = String(error?.message || '');
  if (error?.code === '42501' && /Sua conta pode manter/.test(text)) {
    const match = text.match(/até (\d+)/);
    return new Error(eventLimitMessage(match ? Number(match[1]) : 1));
  }
  return error;
}
