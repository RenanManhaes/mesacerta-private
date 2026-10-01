/**
 * Verifica o aferidor de aderencia (MCT-28):
 *   - a pergunta tem os dois formatos certos (Noul + Choice de 4 rotulos);
 *   - a regra de desenho que nao se negocia -- o `state` NUNCA carrega um
 *     campo de "relatorio" do agente, so criterio + diff + saida de comando;
 *   - diff que cabe no limite vai numa chamada so, sem cortar nada;
 *   - diff que nao cabe fatia por arquivo, SEM TRUNCAR nenhum pedaco -- cada
 *     arquivo chega ao Jev com o conteudo INTEIRO dele, nunca cortado;
 *   - arquivo que sozinho estoura o limite e RECUSADO explicitamente, com
 *     zero chamada ao Jev -- nunca truncado para caber a forca;
 *   - agregacao de veredito fatiado usa o PIOR desfecho entre os arquivos,
 *     nao a media nem o primeiro.
 *
 * Nenhum teste aqui toca rede: `perguntarAoJev` e sempre um stub
 * deterministico, injetado -- ver o cabecalho de aferidor.js/dedup.js para
 * o raciocinio da injecao de dependencia.
 *
 *   node src/lib/qa/aferidor.test.mjs
 */
import { aferirCriterio, LIMITE_ESTADO_CARACTERES, perguntaAferidor } from "./aferidor.js";

let falhas = 0;
function checa(descricao, condicao, detalhe = "") {
  if (condicao) {
    console.log(`  ok   ${descricao}`);
  } else {
    console.log(`  FALHA ${descricao}${detalhe ? ` — ${detalhe}` : ""}`);
    falhas++;
  }
}

function stubFixo(probabilidade, desfecho) {
  const chamadas = [];
  const fn = async (state) => {
    chamadas.push(state);
    return {
      answers: {
        atendido: { type: "noul", noul: probabilidade },
        desfecho: { type: "choice", choice: desfecho, confidence: 0.8 },
      },
      usage: { input_tokens: 50, output_tokens: 0 },
    };
  };
  fn.chamadas = chamadas;
  return fn;
}

function stubPorArquivo(mapaProbabilidadePorArquivo, mapaDesfechoPorArquivo) {
  const chamadas = [];
  const fn = async (state) => {
    chamadas.push(state);
    const chave = state.arquivo ?? "(diff unico)";
    return {
      answers: {
        atendido: { type: "noul", noul: mapaProbabilidadePorArquivo[chave] ?? 0.5 },
        desfecho: { type: "choice", choice: mapaDesfechoPorArquivo[chave] ?? "nao_demonstrado", confidence: 0.8 },
      },
      usage: { input_tokens: 50, output_tokens: 0 },
    };
  };
  fn.chamadas = chamadas;
  return fn;
}

// ---------------------------------------------------------------------------
// 1. Forma da pergunta.
// ---------------------------------------------------------------------------
console.log("1. Forma da pergunta\n");

const pergunta = perguntaAferidor();
checa("atendido e Noul", pergunta.atendido.type === "noul");
checa("desfecho e Choice", pergunta.desfecho.type === "choice");
checa(
  "desfecho tem os 4 rotulos pedidos",
  ["atendido", "parcial", "fora_do_escopo", "nao_demonstrado"].every((r) => r in pergunta.desfecho.criteria)
);

// ---------------------------------------------------------------------------
// 2. Regra de desenho que nao se negocia: nunca um campo de "relatorio".
// ---------------------------------------------------------------------------
console.log("\n2. Regra de desenho: o state nunca carrega o relatorio do agente\n");

const stub1 = stubFixo(0.9, "atendido");
await aferirCriterio("Algum criterio", { diff: "+ linha adicionada", saidaComando: "ok" }, stub1);
const stateEnviado = stub1.chamadas[0];
checa("o state tem criterio_de_aceite, diff, saida_de_comando", "criterio_de_aceite" in stateEnviado && "diff" in stateEnviado && "saida_de_comando" in stateEnviado);
checa(
  "o state NAO tem nenhum campo de relatorio/report/prosa do agente",
  !("relatorio" in stateEnviado) && !("report" in stateEnviado) && !("resumo_do_agente" in stateEnviado)
);

// ---------------------------------------------------------------------------
// 3. Diff que cabe -- uma chamada so, sem fatiar.
// ---------------------------------------------------------------------------
console.log("\n3. Diff pequeno -- avaliado completo, uma chamada\n");

const stub2 = stubFixo(0.85, "atendido");
const r2 = await aferirCriterio("Criterio pequeno", { diff: "diff pequeno de teste" }, stub2);
checa("resultado e 'avaliado_completo'", r2.resultado === "avaliado_completo", r2.resultado);
checa("uma chamada so ao Jev", stub2.chamadas.length === 1, `${stub2.chamadas.length}`);
checa("probabilidade bate com o stub", r2.probabilidade === 0.85);
checa("desfecho bate com o stub", r2.desfecho === "atendido");

// ---------------------------------------------------------------------------
// 4. Diff grande demais para caber junto, mas cada arquivo cabe sozinho --
//    fatia por arquivo, SEM TRUNCAR nada.
// ---------------------------------------------------------------------------
console.log("\n4. Diff grande (soma nao cabe, cada arquivo cabe) -- fatia por arquivo, sem truncar\n");

// cada arquivo tem ~20000 caracteres -- sozinho cabe (limite e 32000), mas
// os dois juntos (~40000) nao cabem numa chamada so.
const diffA = "A".repeat(20000);
const diffB = "B".repeat(20000);
const evidenciaGrande = {
  diffPorArquivo: [
    { arquivo: "src/arquivoA.js", diff: diffA },
    { arquivo: "src/arquivoB.js", diff: diffB },
  ],
  saidaComando: "npm test -> ok",
};

const stub3 = stubPorArquivo(
  { "src/arquivoA.js": 0.9, "src/arquivoB.js": 0.2 },
  { "src/arquivoA.js": "atendido", "src/arquivoB.js": "nao_demonstrado" }
);
const r3 = await aferirCriterio("Criterio que cobre dois arquivos", evidenciaGrande, stub3);

checa("resultado e 'fatiado'", r3.resultado === "fatiado", r3.resultado);
checa("duas chamadas ao Jev, uma por arquivo", stub3.chamadas.length === 2, `${stub3.chamadas.length}`);
checa(
  "o diff de CADA arquivo chegou INTEIRO ao Jev, nao truncado",
  stub3.chamadas.every((c) => c.diff.length === 20000),
  JSON.stringify(stub3.chamadas.map((c) => c.diff.length))
);
checa(
  "veredito agregado usa o PIOR desfecho (nao_demonstrado do arquivoB), nao o melhor nem a media",
  r3.desfecho === "nao_demonstrado",
  r3.desfecho
);
checa("probabilidade agregada e o MINIMO entre os arquivos (0.2, nao a media 0.55)", r3.probabilidade === 0.2, `${r3.probabilidade}`);
checa(
  "avaliacoesPorArquivo lista os dois arquivos com seus vereditos individuais",
  r3.avaliacoesPorArquivo.length === 2 &&
    r3.avaliacoesPorArquivo.some((a) => a.arquivo === "src/arquivoA.js" && a.desfecho === "atendido") &&
    r3.avaliacoesPorArquivo.some((a) => a.arquivo === "src/arquivoB.js" && a.desfecho === "nao_demonstrado")
);

// ---------------------------------------------------------------------------
// 5. Um arquivo, sozinho, ja estoura o limite -- RECUSA, zero chamada.
// ---------------------------------------------------------------------------
console.log("\n5. Um arquivo sozinho estoura o limite -- recusa explicita, nunca truncado\n");

const diffEnorme = "X".repeat(LIMITE_ESTADO_CARACTERES + 5000);
const evidenciaEnorme = {
  diffPorArquivo: [
    { arquivo: "src/arquivoPequeno.js", diff: "diff normal" },
    { arquivo: "src/arquivoEnorme.js", diff: diffEnorme },
  ],
};

const stub4 = stubFixo(0.99, "atendido");
const r4 = await aferirCriterio("Criterio com um arquivo gigante", evidenciaEnorme, stub4);

checa("resultado e 'estado_grande_demais'", r4.resultado === "estado_grande_demais", r4.resultado);
checa("ZERO chamadas ao Jev -- recusa antes de gastar qualquer coisa", stub4.chamadas.length === 0, `${stub4.chamadas.length}`);
checa("o motivo da recusa identifica o arquivo culpado", r4.motivo.includes("arquivoEnorme.js"));
checa("arquivosRecusados lista soo o arquivo grande, nao o pequeno", r4.arquivosRecusados.length === 1 && r4.arquivosRecusados[0] === "src/arquivoEnorme.js");

// ---------------------------------------------------------------------------
console.log(`\n${falhas === 0 ? "TUDO OK" : `${falhas} FALHA(S)`}`);
process.exit(falhas === 0 ? 0 : 1);
