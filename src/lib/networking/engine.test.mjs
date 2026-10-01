/**
 * Verifica que o motor portado preserva as garantias do cenario que rodou de
 * verdade no Get Connected Sorocaba 2026: 76 convidados, 14 mesas, 14 rodadas,
 * 7 lugares por mesa.
 *
 *   node src/lib/networking/engine.test.mjs
 *
 * Sem dependencia de test runner de proposito: o motor tem de poder ser
 * conferido com um `node` e nada mais.
 */
import { analyze, gerarDistribuicao } from "./engine.js";

const CENARIO = { P: 76, T: 14, R: 14, cap: 7 };

let falhas = 0;
function checa(descricao, condicao, detalhe = "") {
  if (condicao) {
    console.log(`  ok   ${descricao}`);
  } else {
    console.log(`  FALHA ${descricao}${detalhe ? ` — ${detalhe}` : ""}`);
    falhas++;
  }
}

const { P, T, R, cap } = CENARIO;
console.log(`Cenario real: ${P} convidados, ${T} mesas, ${R} rodadas, ${cap} por mesa\n`);

const inicio = Date.now();
const { tab, analise, seed } = gerarDistribuicao(CENARIO);
const duracao = Date.now() - inicio;

// 1. Forma da grade.
checa("a grade tem uma linha por participante", tab.length === P, `${tab.length}`);
checa(
  "cada linha tem uma mesa por rodada",
  tab.every((linha) => linha.length === R)
);

// 2. Com R === T, todo participante passa por TODAS as mesas, exatamente uma vez.
//    E a garantia central do desenho por permutacoes ciclicas.
const semCobertura = tab.filter((linha) => new Set(linha).size !== T);
checa(
  "todo participante visita as 14 mesas, sem repetir nenhuma",
  semCobertura.length === 0,
  `${semCobertura.length} participante(s) repetiram mesa`
);

// 3. Lotacao. Com 76 pessoas em 14 mesas, cada mesa fica com 5 ou 6 convidados
//    (76/14 = 5,43), mais o anfitriao fixo quando houver.
checa(
  `lotacao por mesa fica entre floor e ceil de P/T (${Math.floor(P / T)}–${Math.ceil(P / T)})`,
  analise.minL >= Math.floor(P / T) && analise.maxL <= Math.ceil(P / T),
  `min=${analise.minL} max=${analise.maxL}`
);
checa("nenhuma mesa estoura a capacidade", analise.maxL <= cap, `max=${analise.maxL}, cap=${cap}`);

// 4. Qualidade dos encontros — o que o recozimento simulado esta otimizando.
const totalPares = (P * (P - 1)) / 2;
const paresQueSeEncontram = analise.pairsOnce + analise.pairs.length;
checa(
  "ninguem reencontra a mesma pessoa na MESMA mesa",
  analise.sameTable === 0,
  `${analise.sameTable} dupla(s)`
);
checa("nenhuma dupla se encontra mais de 2 vezes", analise.maxMeet <= 2, `maxMeet=${analise.maxMeet}`);

// 5. Determinismo: mesma entrada e mesma seed devem dar exatamente a mesma grade.
const repetido = gerarDistribuicao({ ...CENARIO, seedBase: seed });
checa(
  "a mesma seed reproduz a mesma grade",
  JSON.stringify(repetido.tab) === JSON.stringify(tab)
);

// 6. A analise bate quando recalculada do zero sobre a mesma grade.
const reanalise = analyze(tab, P, T, R);
checa(
  "reanalisar a grade da os mesmos numeros",
  reanalise.sameTable === analise.sameTable && reanalise.maxMeet === analise.maxMeet
);

const contatosPorPessoa = analise.person.reduce((s, p) => s + p.known, 0) / P;
console.log(`
  seed escolhida:            ${seed}
  tempo de geracao:          ${duracao}ms
  duplas que se encontram:   ${paresQueSeEncontram} de ${totalPares} possiveis (${((paresQueSeEncontram / totalPares) * 100).toFixed(1)}%)
  encontram-se so uma vez:   ${analise.pairsOnce}
  reencontros:               ${analise.pairs.length}
  contatos por pessoa:       ${contatosPorPessoa.toFixed(1)}
`);

if (falhas) {
  console.error(`${falhas} verificacao(oes) falharam.`);
  process.exit(1);
}
console.log("Motor portado preserva as garantias do cenario real.");
