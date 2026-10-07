import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveSponsorPlan, soldForPlan, sponsorTierName } from './sponsorTier.js';

const legacyPlans = [{ id: 'a', name: 'Master' }, { id: 'b', name: 'Ouro' }, { id: 'c', name: 'Apoio' }];

test('nome canônico: aparado, sem diferenciar maiúsculas, com legados mapeados', () => {
  assert.equal(sponsorTierName('  diamante '), 'Diamante');
  assert.equal(sponsorTierName('OURO'), 'Ouro');
  assert.equal(sponsorTierName('prata'), 'Prata');
  assert.equal(sponsorTierName('Master'), 'Diamante');
  assert.equal(sponsorTierName('apoio'), 'Prata');
  assert.equal(sponsorTierName('  Cota Especial '), 'Cota Especial');
  assert.equal(sponsorTierName(undefined), '');
});

test('o nome canônico apara e remapeia, por isso o campo NÃO pode mostrá-lo enquanto a pessoa digita', () => {
  // Estados intermediários de "Cota Especial" e de "diamante": se o campo exibisse o canônico, o espaço sumiria e "diamante" viraria "Diamante" no meio da digitação.
  assert.notEqual(sponsorTierName('Cota '), 'Cota ');
  assert.notEqual(sponsorTierName('diamante'), 'diamante');
  // A normalização só roda ao salvar (resolveSponsorPlan); o espaço do meio é mantido.
  assert.equal(resolveSponsorPlan('Cota Especial', [], ''), 'Cota Especial');
  assert.equal(resolveSponsorPlan('  Cota Especial  ', [], ''), 'Cota Especial');
});

test('ao salvar: "diamante" casa com Diamante (sem diferenciar maiúsculas)', () => {
  const plans = [{ id: 'x', name: 'Diamante' }, { id: 'y', name: 'Ouro' }];
  assert.equal(resolveSponsorPlan('diamante', plans, ''), 'Diamante');
  assert.equal(resolveSponsorPlan('DIAMANTE', plans, ''), 'Diamante');
  assert.equal(resolveSponsorPlan('ouro ', plans, 'Prata'), 'Ouro');
  assert.equal(resolveSponsorPlan('', plans, ''), '');
});

test('legados: editar sem mexer na cota mantém Master/Apoio; digitar o nome novo liga ao plano antigo', () => {
  assert.equal(resolveSponsorPlan('Diamante', legacyPlans, 'Master'), 'Master');
  assert.equal(resolveSponsorPlan('Prata', legacyPlans, 'Apoio'), 'Apoio');
  assert.equal(resolveSponsorPlan('diamante', legacyPlans, ''), 'Master');
  assert.equal(resolveSponsorPlan('prata', legacyPlans, 'Ouro'), 'Apoio');
  // trocar para outra cota de verdade troca
  assert.equal(resolveSponsorPlan('Ouro', legacyPlans, 'Master'), 'Ouro');
});

test('vendidas comparam por nome normalizado, sem contar em dois planos', () => {
  const sponsors = [
    { id: '1', plan: 'Master', status: 'quitado' },
    { id: '2', plan: 'Diamante', status: 'pendente' }, // digitado com o nome novo: vai para o plano legado Master
    { id: '3', plan: 'Apoio', status: 'quitado' },
    { id: '4', plan: 'prata', status: 'pendente' },
    { id: '5', plan: 'Apoio', status: 'negociacao' }, // em negociação não conta
    { id: '6', plan: 'Ouro', status: 'parcial' },
  ];
  const [master, ouro, apoio] = legacyPlans;
  assert.equal(soldForPlan(master, legacyPlans, sponsors), 2);
  assert.equal(soldForPlan(ouro, legacyPlans, sponsors), 1);
  assert.equal(soldForPlan(apoio, legacyPlans, sponsors), 2);
  // um plano novo "Diamante" ao lado do legado "Master": cada patrocinador conta uma vez só
  const plans = [...legacyPlans, { id: 'd', name: 'Diamante' }];
  assert.equal(soldForPlan(plans[3], plans, sponsors), 1); // o de nome exato "Diamante"
  assert.equal(soldForPlan(plans[0], plans, sponsors), 1); // o "Master" exato
  assert.equal(plans.reduce((sum, p) => sum + soldForPlan(p, plans, sponsors), 0), 5);
});
