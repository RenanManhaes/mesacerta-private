/**
 * Verifica o pre-filtro de deduplicacao (MCT-22): que ele reconhece os
 * padroes de nome repetido que o dedup atual do legado (so baixa acento e
 * caixa) deixa passar, que ele NAO cria par para pessoas de fato diferentes
 * -- inclusive as que so parecem iguais (sufixo geracional conflitante) --
 * e que o custo real (comparacoes efetuadas, nao so o tamanho da saida)
 * fica muito abaixo do N^2 num lote de 200 pessoas com duplicatas de
 * verdade misturadas.
 *
 *   node src/lib/pessoas/prefiltro.test.mjs
 *
 * Sem dependencia de test runner de proposito, no mesmo estilo de
 * src/lib/networking/engine.test.mjs.
 */
import { compararNomes, encontrarCandidatosDuplicata } from "./prefiltro.js";

let falhas = 0;
function checa(descricao, condicao, detalhe = "") {
  if (condicao) {
    console.log(`  ok   ${descricao}`);
  } else {
    console.log(`  FALHA ${descricao}${detalhe ? ` — ${detalhe}` : ""}`);
    falhas++;
  }
}

function temPar(pares, nomeA, nomeB) {
  return pares.some(
    (p) =>
      (p.a.nome === nomeA && p.b.nome === nomeB) || (p.a.nome === nomeB && p.b.nome === nomeA)
  );
}

// ---------------------------------------------------------------------------
// 1. Casos que TEM que virar candidato.
// ---------------------------------------------------------------------------
console.log("1. Padroes que devem ser reconhecidos como candidatos\n");

checa(
  "acento e caixa diferentes",
  compararNomes("João Silva", "joao silva") === "identico_apos_normalizacao"
);
checa("sufixo (Jr)", compararNomes("João Silva", "João Silva Jr") === "sufixo");
checa("inicial abreviada", compararNomes("João Silva", "J. Silva") === "inicial_abreviada");
checa(
  "ordem invertida de nome e sobrenome",
  compararNomes("João Silva", "Silva João") === "ordem_invertida"
);
checa(
  "espaco duplicado e espaco no fim",
  compararNomes("João Silva", "João   Silva  ") === "identico_apos_normalizacao"
);
checa(
  "particula de ligacao ('da') -- o caso canonico de duplicata brasileira",
  compararNomes("Joao Silva", "Joao da Silva") === "particula"
);
checa(
  "particula de ligacao no meio do nome ('dos')",
  compararNomes("Maria Santos Pereira", "Maria dos Santos Pereira") === "particula"
);
checa(
  "inicial abreviada com backtracking -- ordem greedy erraria aqui",
  compararNomes("C. Carlos Souza", "Carlos Cesar Souza") === "inicial_abreviada"
);
checa(
  "nome do meio abreviado presente so de um lado (tamanhos diferentes)",
  compararNomes("Ana Alves", "Ana A. Alves") === "inicial_abreviada"
);

// ---------------------------------------------------------------------------
// 2. Casos que NAO podem virar candidato.
// ---------------------------------------------------------------------------
console.log("\n2. Pessoas diferentes que NAO podem virar candidato\n");

checa("sobrenomes diferentes", compararNomes("João Silva", "João Santos") === null);
checa(
  "duas pessoas que so compartilham o primeiro nome",
  compararNomes("Ana Costa", "Ana Pereira") === null
);
checa("nomes sem nenhuma relacao", compararNomes("João Silva", "Maria Fernandes") === null);
checa(
  "sufixos geracionais conflitantes (Jr x Neto) sao PESSOAS DIFERENTES, nao ordem invertida",
  compararNomes("João Silva Jr", "João Silva Neto") !== "ordem_invertida" &&
    compararNomes("João Silva Jr", "João Silva Neto") === null
);
checa(
  "mesmo com Filho x Sobrinho -- outro par de sufixos geracionais conflitantes",
  compararNomes("Pedro Rocha Filho", "Pedro Rocha Sobrinho") === null
);

// ---------------------------------------------------------------------------
// 3. encontrarCandidatosDuplicata com uma lista pequena e mista -- confere
//    que os pares certos aparecem e os errados nao, tudo numa chamada so.
// ---------------------------------------------------------------------------
console.log("\n3. Lista mista (o formato real: objetos com campo nome)\n");

const lista = [
  { id: "p1", nome: "João Silva" },
  { id: "p2", nome: "joao silva" }, // duplicata de p1 (acento/caixa)
  { id: "p3", nome: "João Silva Jr" }, // duplicata de p1 (sufixo)
  { id: "p4", nome: "J. Silva" }, // duplicata de p1 (inicial)
  { id: "p5", nome: "Silva João" }, // duplicata de p1 (ordem invertida)
  { id: "p6", nome: "João Santos" }, // NAO duplicata (sobrenome diferente)
  { id: "p7", nome: "Ana Costa" }, // NAO duplicata de ninguem
  { id: "p8", nome: "Ana Pereira" }, // NAO duplicata de p7 (so 1o nome em comum)
  { id: "p9", nome: "  Maria   Fernandes " }, // isolado, so testa normalizacao
  { id: "p10", nome: "João da Silva" }, // duplicata de p1 (particula)
  { id: "p11", nome: "João Silva Neto" }, // NAO duplicata de p3 (sufixo geracional conflitante)
];

const paresLista = encontrarCandidatosDuplicata(lista);
console.log(
  `  ${paresLista.length} par(es) candidato(s) em ${lista.length} pessoas (${paresLista.comparacoes} comparacoes): ` +
    paresLista.map((p) => `${p.a.id}-${p.b.id} (${p.motivo})`).join(", ")
);

checa("p1/p2 (acento e caixa) viram par", temPar(paresLista, "João Silva", "joao silva"));
checa("p1/p3 (sufixo) viram par", temPar(paresLista, "João Silva", "João Silva Jr"));
checa("p1/p4 (inicial) viram par", temPar(paresLista, "João Silva", "J. Silva"));
checa("p1/p5 (ordem invertida) viram par", temPar(paresLista, "João Silva", "Silva João"));
checa("p1/p10 (particula) viram par", temPar(paresLista, "João Silva", "João da Silva"));
checa("p1/p6 NAO viram par (João Silva x João Santos)", !temPar(paresLista, "João Silva", "João Santos"));
checa("p7/p8 NAO viram par (Ana Costa x Ana Pereira)", !temPar(paresLista, "Ana Costa", "Ana Pereira"));
checa("p3/p11 NAO viram par (Jr x Neto, sufixos conflitantes)", !temPar(paresLista, "João Silva Jr", "João Silva Neto"));
checa("p9 nao aparece em nenhum par (nome sem parecido na lista)", !paresLista.some((p) => p.a.id === "p9" || p.b.id === "p9"));

// ---------------------------------------------------------------------------
// 4. Custo com 200 pessoas: mede COMPARACOES de verdade (nao o tamanho da
//    saida -- um filtro que sempre devolve [] passaria numa asserção sobre
//    pares.length mesmo sem bloqueio nenhum), com duplicatas REAIS
//    misturadas no lote para o teste tambem provar recall em escala, nao
//    so custo.
// ---------------------------------------------------------------------------
console.log("\n4. Custo (comparacoes efetuadas) e recall com 200 pessoas, duplicatas reais incluidas\n");

const PRIMEIROS = [
  "Joao", "Maria", "Pedro", "Ana", "Lucas", "Julia", "Carlos", "Beatriz", "Rafael", "Camila",
  "Bruno", "Fernanda", "Diego", "Larissa", "Gustavo", "Patricia", "Thiago", "Renata", "Felipe", "Aline",
];
const SOBRENOMES = [
  "Silva", "Santos", "Oliveira", "Souza", "Pereira", "Costa", "Rodrigues", "Almeida", "Nascimento", "Lima",
  "Araujo", "Fernandes", "Carvalho", "Gomes", "Martins", "Rocha", "Ribeiro", "Alves", "Monteiro", "Cardoso",
];

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

const sorteio = rng(42);
const base = [];
const vistos = new Set();
let tentativa = 0;
// 190 pessoas distintas de base -- as outras 10 posicoes do lote de 200 sao
// VARIANTES deliberadas de 10 destas, uma para cada padrao de duplicata.
while (base.length < 190) {
  tentativa++;
  const nome = `${PRIMEIROS[Math.floor(sorteio() * PRIMEIROS.length)]} ${SOBRENOMES[Math.floor(sorteio() * SOBRENOMES.length)]}`;
  if (vistos.has(nome) && tentativa < 5000) continue;
  vistos.add(nome);
  base.push({ id: `g${base.length + 1}`, nome });
}

const transformacoes = [
  { tipo: "acento_caixa", aplicar: (nome) => nome.toLowerCase() },
  { tipo: "sufixo", aplicar: (nome) => `${nome} Jr` },
  { tipo: "inicial", aplicar: (nome) => nome.replace(/^(\S)\S*/, "$1.") },
  { tipo: "ordem_invertida", aplicar: (nome) => nome.split(" ").reverse().join(" ") },
  { tipo: "particula", aplicar: (nome) => nome.replace(" ", " da ") },
];

const pessoas200 = [...base];
const duplicatasEsperadas = [];
for (let i = 0; i < 10; i++) {
  const original = base[i * 18]; // espalha a escolha pelo array de base
  const transformacao = transformacoes[i % transformacoes.length];
  const nomeVariante = transformacao.aplicar(original.nome);
  const variante = { id: `dup${i + 1}`, nome: nomeVariante };
  pessoas200.push(variante);
  duplicatasEsperadas.push({ original, variante, tipo: transformacao.tipo });
}

checa("o lote de teste tem exatamente 200 pessoas", pessoas200.length === 200, `${pessoas200.length}`);

const inicio = Date.now();
const paresGerados = encontrarCandidatosDuplicata(pessoas200);
const duracao = Date.now() - inicio;

const totalN2 = (200 * 199) / 2;
console.log(
  `  ${pessoas200.length} pessoas (190 distintas + 10 variantes deliberadas), ` +
    `${paresGerados.length} par(es) candidato(s), ${paresGerados.comparacoes} comparacoes efetuadas em ${duracao}ms`
);
console.log(`  N^2 (todos os pares possiveis) seria ${totalN2}`);

checa(
  "comparacoes efetuadas ficam bem abaixo do N^2 (bloqueio funcionando de verdade)",
  paresGerados.comparacoes < totalN2 * 0.15,
  `${paresGerados.comparacoes} / ${totalN2}`
);
checa("pares candidatos ficam abaixo de 500", paresGerados.length < 500, `${paresGerados.length}`);

for (const { original, variante, tipo } of duplicatasEsperadas) {
  checa(
    `recall: "${original.nome}" x "${variante.nome}" (${tipo}) vira par`,
    temPar(paresGerados, original.nome, variante.nome)
  );
}

// ---------------------------------------------------------------------------
console.log(`\n${falhas === 0 ? "TUDO OK" : `${falhas} FALHA(S)`}`);
process.exit(falhas === 0 ? 0 : 1);
