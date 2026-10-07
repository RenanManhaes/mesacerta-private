// Legacy names stay linked to their existing plans and financial entries.
// Nome canônico de uma cota: aparado, sem diferenciar maiúsculas, e com Master→Diamante e Apoio→Prata.
// Nomes que não são conhecidos ficam como foram digitados (só aparados).
export function sponsorTierName(value) {
  const name=String(value || '').trim();
  return ({master:'Diamante',apoio:'Prata',diamante:'Diamante',ouro:'Ouro',prata:'Prata'})[name.toLocaleLowerCase('pt-BR')] || name;
}

// O campo "Cota" mostra e guarda o texto cru enquanto a pessoa digita (nada de aparar ou trocar a cada tecla).
// Só ao SALVAR o texto vira o nome gravado:
//  1. igual (normalizado) à cota que o patrocinador já tinha: mantém a gravada (Master continua Master, o vínculo não muda);
//  2. igual (normalizado) ao nome de um plano existente: usa o nome exato desse plano (digitar "diamante" liga ao plano "Master" antigo);
//  3. senão, o nome normalizado.
export function resolveSponsorPlan(typed, plans = [], current = '') {
  const name=sponsorTierName(typed);
  if (current && sponsorTierName(current)===name) return current;
  const plan=plans.find(p=>p.name===name) || plans.find(p=>sponsorTierName(p.name)===name);
  return plan ? plan.name : name;
}

// Quantas cotas deste plano foram vendidas (negociação não conta). O patrocinador conta para o plano de nome exato;
// se não houver, para o primeiro plano de mesmo nome normalizado. Nunca conta em dois planos.
export function soldForPlan(plan, plans = [], sponsors = []) {
  const owner=s=>plans.find(p=>p.name===s.plan) || plans.find(p=>sponsorTierName(p.name)===sponsorTierName(s.plan));
  return sponsors.filter(s=>s.status!=='negociacao' && owner(s)===plan).length;
}
