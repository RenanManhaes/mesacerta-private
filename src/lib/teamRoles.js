/** Rótulos e regras de interface para papéis de acesso por evento (MCT-60/73/74).
 * O banco decide de verdade; isto só evita oferecer ações que seriam negadas. */
export const ROLE_LABEL = {founder: 'Fundador', director: 'Diretor', staff: 'Staff'};

/** Descrição curta de cada papel, como aparece para quem está convidando (o fundador). */
export const INVITE_HINT = {
  staff: 'Ajuda na operação: vê tarefas, participantes e programação.',
  director: 'Gerencia o evento junto com você, inclusive o financeiro.',
};

/** Descrição curta de cada papel, para quem olha o card de um membro. */
export const ROLE_HINT = {
  founder: 'Dono do evento. Não pode ser removido nem rebaixado.',
  director: 'Gerencia o evento, inclusive o financeiro.',
  staff: 'Ajuda na operação: vê tarefas, participantes e programação.',
};

/**
 * O que quem está vendo pode fazer no card de uma pessoa da equipe.
 * @param {string | undefined} viewerRole papel de acesso de quem está logado (founder, director, staff)
 * @param {string | undefined} viewerMemberId id do vínculo de quem está logado
 * @param {{id?: string, accessRole?: string}} person pessoa do card
 */
export function teamPermissions(viewerRole, viewerMemberId, person) {
  const founderViewer = viewerRole === 'founder';
  const canEdit = founderViewer || viewerRole === 'director';
  const targetIsFounder = person?.accessRole === 'founder';
  const isSelf = !!viewerMemberId && person?.id === viewerMemberId;
  const manageable = founderViewer && !targetIsFounder && !isSelf;
  return {
    canEdit,
    canChangeRole: manageable,
    canRemove: manageable,
    nextRole: person?.accessRole === 'director' ? 'staff' : 'director',
  };
}
