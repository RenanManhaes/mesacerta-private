/**
 * Verifica o julgamento de duplicata de pessoa (MCT-22, segunda metade):
 *
 *   - DECISAO DE PRODUTO DO LOTE 03: com os limiares PADRAO, nenhum par e
 *     fundido automaticamente nem descartado automaticamente como "pessoas
 *     distintas" -- correlacao erro x confianca medida em 34 pares reais
 *     ficou em -0.10, perto de zero demais para confiar. Todo par cai em
 *     confirmar_humano, e `julgarParesDePessoas` devolve a fila ORDENADA
 *     por probabilidade (mais provavel primeiro). Isso e testado na secao 2;
 *   - o mecanismo de bandas automaticas continua existindo e testavel, se o
 *     chamador passar `limiares` explicito (secoes 2b e 5) -- prova que a
 *     politica pode ser recalibrada no futuro sem reescrever o modulo;
 *   - pares Jr/Neto nunca chegam a este modulo pelo pre-filtro (secao 4);
 *   - o numero de CHAMADAS ao Jev (nao so o numero de pares de saida do
 *     pre-filtro) fica muito abaixo do N^2 num lote de 200 pessoas (secao 6).
 *
 * Nenhum teste aqui toca rede ou precisa de API key: `perguntarAoJev` e
 * sempre um stub deterministico, injetado -- ver o cabecalho de dedup.js
 * para o raciocinio da injecao de dependencia.
 *
 *   node src/lib/pessoas/dedup.test.mjs
 */
import { compararNomes, encontrarCandidatosDuplicata } from "./prefiltro.js";
import { julgarParDePessoas, julgarParesDePessoas, perguntaDedupPessoa } from "./dedup.js";

let falhas = 0;
function checa(descricao, condicao, detalhe = "") {
  if (condicao) {
    console.log(`  ok   ${descricao}`);
  } else {
    console.log(`  FALHA ${descricao}${detalhe ? ` — ${detalhe}` : ""}`);
    falhas++;
  }
}

/** Stub que sempre devolve a mesma probabilidade, nao importa o state. */
function stubFixo(probabilidade) {
  return async () => ({ answers: { mesma_pessoa: { type: "noul", noul: probabilidade } }, usage: { input_tokens: 42, output_tokens: 0 } });
}

/** Stub que devolve probabilidades diferentes por chamada, e conta quantas vezes foi chamado. */
function stubContador(probabilidadePorChamada = () => 0.5) {
  const chamadas = [];
  const fn = async (state, questions) => {
    chamadas.push({ state, questions });
    const p = probabilidadePorChamada(chamadas.length - 1, state);
    return { answers: { mesma_pessoa: { type: "noul", noul: p } }, usage: { input_tokens: 10, output_tokens: 0 } };
  };
  fn.chamadas = chamadas;
  return fn;
}

// ---------------------------------------------------------------------------
// 1. Forma da pergunta.
// ---------------------------------------------------------------------------
console.log("1. Forma da pergunta\n");

const pergunta = perguntaDedupPessoa();
checa("pergunta e do tipo noul", pergunta.mesma_pessoa.type === "noul");
checa("tem descricao para true e false", Boolean(pergunta.mesma_pessoa.criteria.true) && Boolean(pergunta.mesma_pessoa.criteria.false));

// ---------------------------------------------------------------------------
// 2. Limiares PADRAO: nada de automatico, so confirmar_humano -- qualquer
//    probabilidade, mesmo 0.99 ou 0.01. E a decisao de produto do lote 03.
// ---------------------------------------------------------------------------
console.log("\n2. Limiares padrao: nenhuma decisao automatica, so fila de revisao\n");

const par = { a: { nome: "João Silva" }, b: { nome: "Joao Silva" }, motivo: "identico_apos_normalizacao" };

const altissima = await julgarParDePessoas(par, stubFixo(0.99));
checa("mesmo com probabilidade 0.99, o padrao e confirmar_humano (sem fusao automatica)", altissima.faixa === "confirmar_humano", altissima.faixa);

const meio = await julgarParDePessoas(par, stubFixo(0.5));
checa("probabilidade 0.5 tambem e confirmar_humano", meio.faixa === "confirmar_humano", meio.faixa);

const baixissima = await julgarParDePessoas(par, stubFixo(0.01));
checa("mesmo com probabilidade 0.01, o padrao e confirmar_humano (sem descarte automatico)", baixissima.faixa === "confirmar_humano", baixissima.faixa);

// ---------------------------------------------------------------------------
// 2b. O MECANISMO de bandas automaticas continua existindo -- so nao e o
//    padrao. Um chamador pode reativar passando limiares explicitos, para
//    quando (se) uma recalibragem futura justificar.
// ---------------------------------------------------------------------------
console.log("\n2b. Mecanismo de bandas automaticas (opt-in explicito, nao mais o padrao)\n");

const limiaresCustom = { alto: 0.9, baixo: 0.3 };
checa(
  "com limiares explicitos, 0.95 ainda classifica como fundir_automatico",
  (await julgarParDePessoas(par, stubFixo(0.95), limiaresCustom)).faixa === "fundir_automatico"
);
checa(
  "com limiares explicitos, 0.05 ainda classifica como distintas",
  (await julgarParDePessoas(par, stubFixo(0.05), limiaresCustom)).faixa === "distintas"
);

// ---------------------------------------------------------------------------
// 3. Criterio de aceite 1 e 2 do despacho -- pipeline completo pre-filtro + dedup.
// ---------------------------------------------------------------------------
console.log("\n3. Criterios 1 e 2: pipeline pre-filtro -> dedup\n");

const cadastro = [
  { id: "p1", nome: "João Silva", empresa: "Interfocus" },
  { id: "p2", nome: "Joao Silva", empresa: "Interfocus" }, // mesma empresa, variacao de acento
  { id: "p3", nome: "J. Silva", empresa: "Interfocus" }, // mesma empresa, inicial abreviada
  { id: "p4", nome: "João Santos", empresa: "Interfocus" }, // pessoa DIFERENTE, mesma empresa
];

const candidatosCadastro = encontrarCandidatosDuplicata(cadastro);
const temParIds = (a, b) => candidatosCadastro.some((p) => (p.a.id === a && p.b.id === b) || (p.a.id === b && p.b.id === a));

checa("criterio 1: João Silva / Joao Silva viram par candidato", temParIds("p1", "p2"));
checa("criterio 1: João Silva / J. Silva viram par candidato", temParIds("p1", "p3"));
checa("criterio 2: João Silva / João Santos NAO viram par candidato (ja no pre-filtro)", !temParIds("p1", "p4"));

// com os limiares PADRAO (lote 03), todo par candidato vira confirmar_humano
// -- inclusive estes, de alta probabilidade. A fila e ORDENADA, entao eles
// tem que vir primeiro se houver qualquer outro par com probabilidade menor.
const julgamentos = await julgarParesDePessoas(candidatosCadastro, stubFixo(0.93));
checa(
  "todos os pares candidatos (mesma empresa, variacoes de grafia) vao para confirmar_humano, nenhuma fusao automatica",
  julgamentos.every((j) => j.faixa === "confirmar_humano"),
  JSON.stringify(julgamentos.map((j) => j.faixa))
);
checa("nenhuma pessoa distinta (João Santos) apareceu em julgamento nenhum", !julgamentos.some((j) => j.par.a.id === "p4" || j.par.b.id === "p4"));

// fila ordenada: com probabilidades DIFERENTES entre os pares, o mais
// provavel tem que vir primeiro.
const stubPorPar = stubContador((indice) => [0.3, 0.9, 0.6][indice] ?? 0.5);
const julgamentosOrdenados = await julgarParesDePessoas(candidatosCadastro, stubPorPar);
const probabilidades = julgamentosOrdenados.map((j) => j.probabilidade);
const ordenadoDecrescente = probabilidades.every((p, i) => i === 0 || probabilidades[i - 1] >= p);
checa(
  "a fila devolvida por julgarParesDePessoas vem ordenada por probabilidade decrescente",
  ordenadoDecrescente,
  JSON.stringify(probabilidades)
);

// ---------------------------------------------------------------------------
// 4. Criterio de aceite 3 -- Jr/Neto nao funde automatico.
// ---------------------------------------------------------------------------
console.log("\n4. Criterio 3: pai e filho (Jr/Neto) nao fundem\n");

checa(
  "o pre-filtro ja rejeita o par Jr/Neto (nunca vira candidato, nunca chega ao Jev)",
  compararNomes("João Silva Jr", "João Silva Neto") === null
);

// Mesmo que o par chegasse ao julgamento por algum outro caminho (ex.: um
// pre-filtro futuro menos rigoroso), o padrao do lote 03 ja garante que
// NENHUM par funde automatico, independente da probabilidade -- entao
// Jr/Neto tambem cai em confirmar_humano, nunca em fundir_automatico.
const parJrNeto = { a: { nome: "João Silva Jr" }, b: { nome: "João Silva Neto" }, motivo: null };
const julgamentoJrNeto = await julgarParDePessoas(parJrNeto, stubFixo(0.05));
checa("com os limiares padrao, Jr/Neto cai em confirmar_humano, nunca em fundir_automatico", julgamentoJrNeto.faixa !== "fundir_automatico", julgamentoJrNeto.faixa);

// E se alguem reativar o mecanismo de bandas (limiares explicitos), Jr/Neto
// com probabilidade baixa ainda cai corretamente em "distintas" -- a LOGICA
// de protecao continua correta, so nao e mais o caminho padrao.
const julgamentoJrNetoComBandas = await julgarParDePessoas(parJrNeto, stubFixo(0.05), limiaresCustom);
checa("com bandas reativadas, Jr/Neto com probabilidade baixa cai em 'distintas'", julgamentoJrNetoComBandas.faixa === "distintas");

// ---------------------------------------------------------------------------
// 5. Criterio de aceite 6 -- log de fusao automatica, SE o mecanismo for
//    reativado. Com o padrao do lote 03 (sem fusao automatica), este
//    criterio fica vazio por desenho -- entao o teste exercita o mecanismo
//    via limiares explicitos, para nao virar um criterio nunca testado.
// ---------------------------------------------------------------------------
console.log("\n5. Criterio 6: log de toda fusao automatica (mecanismo, via limiares explicitos)\n");

const logsComPadrao = [];
const paresParaFundir = [
  { a: { nome: "Marina Souza" }, b: { nome: "marina souza" }, motivo: "identico_apos_normalizacao" },
  { a: { nome: "Carlos Reis" }, b: { nome: "Carlos Reis Jr" }, motivo: "sufixo" },
];
await julgarParesDePessoas(paresParaFundir, stubFixo(0.97), { registrarFusao: (log) => logsComPadrao.push(log) });
checa("com os limiares padrao, NENHUMA fusao automatica e logada (politica do lote 03)", logsComPadrao.length === 0, `${logsComPadrao.length}`);

const logs = [];
await julgarParesDePessoas(paresParaFundir, stubFixo(0.97), {
  limiares: limiaresCustom,
  registrarFusao: (log) => logs.push(log),
});

checa("com limiares explicitos, uma fusao automatica e logada por par de alta confianca", logs.length === 2, `${logs.length}`);
checa(
  "o log contem os dois registros originais e a probabilidade",
  logs.every((l) => l.original_a?.nome && l.original_b?.nome && typeof l.probabilidade === "number")
);

// ---------------------------------------------------------------------------
// 6. Criterio de aceite 4 -- chamadas ao Jev, nao pares de saida, com 200 pessoas.
// ---------------------------------------------------------------------------
console.log("\n6. Criterio 4: chamadas ao Jev com 200 pessoas (nao pares de saida)\n");

function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const PRIMEIROS = ["Joao", "Maria", "Pedro", "Ana", "Lucas", "Julia", "Carlos", "Beatriz", "Rafael", "Camila", "Bruno", "Fernanda", "Diego", "Larissa", "Gustavo", "Patricia", "Thiago", "Renata", "Felipe", "Aline"];
const SOBRENOMES = ["Silva", "Santos", "Oliveira", "Souza", "Pereira", "Costa", "Rodrigues", "Almeida", "Nascimento", "Lima", "Araujo", "Fernandes", "Carvalho", "Gomes", "Martins", "Rocha", "Ribeiro", "Alves", "Monteiro", "Cardoso"];
const sorteio = rng(7);
const pessoas200 = [];
const vistos = new Set();
let tentativa = 0;
while (pessoas200.length < 195) {
  tentativa++;
  const nome = `${PRIMEIROS[Math.floor(sorteio() * PRIMEIROS.length)]} ${SOBRENOMES[Math.floor(sorteio() * SOBRENOMES.length)]}`;
  if (vistos.has(nome) && tentativa < 5000) continue;
  vistos.add(nome);
  pessoas200.push({ id: `g${pessoas200.length + 1}`, nome });
}
// acrescenta 5 duplicatas de verdade (acento/caixa) para o dedup ter algo pra confirmar de fato.
for (let i = 0; i < 5; i++) {
  const original = pessoas200[i * 30];
  pessoas200.push({ id: `dup${i + 1}`, nome: original.nome.toLowerCase() });
}
checa("lote de teste tem 200 pessoas", pessoas200.length === 200, `${pessoas200.length}`);

const candidatos200 = encontrarCandidatosDuplicata(pessoas200);
const stubContadorChamadas = stubContador(() => 0.95);
const resultados200 = await julgarParesDePessoas(candidatos200, stubContadorChamadas);

const totalN2 = (200 * 199) / 2;
console.log(
  `  ${pessoas200.length} pessoas, ${candidatos200.length} par(es) candidato(s) do pre-filtro, ` +
    `${stubContadorChamadas.chamadas.length} chamada(s) ao Jev, ${totalN2} seria o N^2`
);
checa(
  "o numero de CHAMADAS ao Jev bate exatamente com o numero de pares candidatos (uma chamada por par, nao por pessoa)",
  stubContadorChamadas.chamadas.length === candidatos200.length,
  `${stubContadorChamadas.chamadas.length} != ${candidatos200.length}`
);
checa(
  "chamadas ao Jev ficam muito abaixo do N^2",
  stubContadorChamadas.chamadas.length < totalN2 * 0.05,
  `${stubContadorChamadas.chamadas.length} / ${totalN2}`
);
checa(
  "as 5 duplicatas injetadas foram todas julgadas com probabilidade alta (0.95) -- viram confirmar_humano, nao fusao automatica (padrao do lote 03)",
  resultados200.filter((r) => r.probabilidade === 0.95).length >= 5 && resultados200.every((r) => r.faixa === "confirmar_humano")
);

// ---------------------------------------------------------------------------
console.log(`\n${falhas === 0 ? "TUDO OK" : `${falhas} FALHA(S)`}`);
process.exit(falhas === 0 ? 0 : 1);
