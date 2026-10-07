// Legacy names stay linked to their existing plans and financial entries.
export function sponsorTierName(value) {
  const name=String(value || '').trim();
  return ({master:'Diamante',apoio:'Prata',diamante:'Diamante',ouro:'Ouro',prata:'Prata'})[name.toLocaleLowerCase('pt-BR')] || name;
}
