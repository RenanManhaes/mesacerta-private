/**
 * Verifica o casamento de empresa -> mesa (MCT-22, segunda metade): que a
 * geracao de candidatos por substring reproduz a regra do legado, que o Jev
 * confirma ou rejeita cada candidato, e que a REGRA DURA de ambiguidade
 * funciona -- se duas mesas ficam acima do limiar, nenhuma e escolhida.
 *
 * Usa as 14 patrocinadoras reais (constante SPONSORS do HTML legado) para os
 * casos de ambiguidade, em vez de inventar nomes -- a ambiguidade entre
 * "CON" batendo em "SB INVESTIMENTOS & CONSÓRCIO" e "CONVEXXA" e real, do
 * jeito que a lista de patrocinadores do evento e hoje.
 *
 *   node src/lib/pessoas/empresa.test.mjs
 */
import { candidatosPorSubstring, casarEmpresa, perguntaCasamentoEmpresa } from "./empresa.js";

let falhas = 0;
function checa(descricao, condicao, detalhe = "") {
  if (condicao) {
    console.log(`  ok   ${descricao}`);
  } else {
    console.log(`  FALHA ${descricao}${detalhe ? ` — ${detalhe}` : ""}`);
    falhas++;
  }
}

const SPONSORS = [
  "INTERFOCUS", "NETTOP", "ASSESSOR ARQ", "ENTRE SONHOS E NÚMEROS", "SUMITANI",
  "PORT CONSULTING", "SB INVESTIMENTOS & CONSÓRCIO", "DESTRAVAHUB", "PAULO VALLE",
  "DML CORRETORA", "ADEMICON", "CLIMBZ", "JAWUL", "CONVEXXA",
];

function stubFixo(probabilidade) {
  return async () => ({ answers: { mesma_empresa: { type: "noul", noul: probabilidade } }, usage: { input_tokens: 10, output_tokens: 0 } });
}

function stubContador(probabilidadePorMesa) {
  const chamadas = [];
  const fn = async (state) => {
    chamadas.push(state);
    return { answers: { mesma_empresa: { type: "noul", noul: probabilidadePorMesa(state) } }, usage: { input_tokens: 10, output_tokens: 0 } };
  };
  fn.chamadas = chamadas;
  return fn;
}

// ---------------------------------------------------------------------------
// 1. Forma da pergunta.
// ---------------------------------------------------------------------------
console.log("1. Forma da pergunta\n");
const pergunta = perguntaCasamentoEmpresa();
checa("pergunta e do tipo noul", pergunta.mesma_empresa.type === "noul");

// ---------------------------------------------------------------------------
// 2. Geracao de candidatos por substring -- port fiel do legado.
// ---------------------------------------------------------------------------
console.log("\n2. Candidatos por substring (regra do legado, sem IA)\n");

const candidatosSB = candidatosPorSubstring("SB", SPONSORS);
checa(
  "'SB' gera candidato para 'SB INVESTIMENTOS & CONSÓRCIO'",
  candidatosSB.some((c) => c.mesa === "SB INVESTIMENTOS & CONSÓRCIO")
);

const candidatosSemMatch = candidatosPorSubstring("XYZ NAO EXISTE NA LISTA", SPONSORS);
checa("nome sem nenhuma relacao nao gera candidato nenhum", candidatosSemMatch.length === 0, `${candidatosSemMatch.length}`);

const candidatosCon = candidatosPorSubstring("CON", SPONSORS);
checa(
  "'CON' gera candidato para DUAS mesas diferentes (SB...CONSÓRCIO e CONVEXXA) -- a ambiguidade e real na lista atual",
  candidatosCon.length >= 2 &&
    candidatosCon.some((c) => c.mesa === "SB INVESTIMENTOS & CONSÓRCIO") &&
    candidatosCon.some((c) => c.mesa === "CONVEXXA"),
  JSON.stringify(candidatosCon.map((c) => c.mesa))
);

// ---------------------------------------------------------------------------
// 3. Criterio de aceite 5 -- "SB" casa com a mesa certa.
// ---------------------------------------------------------------------------
console.log("\n3. Criterio 5: 'SB' casa com SB INVESTIMENTOS & CONSÓRCIO\n");

const resultadoSB = await casarEmpresa("SB", SPONSORS, stubFixo(0.95));
checa("resultado e 'casado'", resultadoSB.resultado === "casado", resultadoSB.resultado);
checa(
  "casou com a mesa certa",
  resultadoSB.indice !== null && SPONSORS[resultadoSB.indice] === "SB INVESTIMENTOS & CONSÓRCIO"
);

// ---------------------------------------------------------------------------
// 4. Criterio de aceite 5 -- ambiguidade NAO e resolvida sozinha.
// ---------------------------------------------------------------------------
console.log("\n4. Criterio 5: ambiguidade entre duas mesas nao e resolvida sozinha\n");

// Stub que confirma (alta probabilidade) qualquer candidato -- simula o pior
// caso: as duas mesas concorrentes parecem igualmente plausiveis para o Jev.
const resultadoAmbiguo = await casarEmpresa("CON", SPONSORS, stubFixo(0.9));
checa("resultado e 'ambiguo', NUNCA escolhe a primeira", resultadoAmbiguo.resultado === "ambiguo", resultadoAmbiguo.resultado);
checa("indice fica null -- nenhuma mesa escolhida sozinha", resultadoAmbiguo.indice === null);
checa("candidatosAmbiguos lista as duas mesas em conflito", (resultadoAmbiguo.candidatosAmbiguos ?? []).length >= 2);

// variante: so UMA das duas mesas concorrentes de fato confirma -- aqui o
// resultado tem que desambiguar corretamente, provando que a regra dura nao
// e "sempre ambiguo quando ha 2+ candidatos por substring", so quando o Jev
// TAMBEM confirma mais de uma.
const stubSoConvexxa = stubContador((state) => (state.nome_da_mesa === "CONVEXXA" ? 0.92 : 0.1));
const resultadoDesambiguado = await casarEmpresa("CON", SPONSORS, stubSoConvexxa);
checa(
  "quando so uma mesa e de fato confirmada pelo Jev, o resultado desambigua (nao fica 'ambiguo' so por ter 2 candidatos de substring)",
  resultadoDesambiguado.resultado === "casado" && SPONSORS[resultadoDesambiguado.indice] === "CONVEXXA",
  JSON.stringify(resultadoDesambiguado)
);

// ---------------------------------------------------------------------------
// 5. Sem candidato nenhum -- zero chamada ao Jev (nao ha o que perguntar).
// ---------------------------------------------------------------------------
console.log("\n5. Sem candidato por substring -- custo zero\n");

const stubContadorVazio = stubContador(() => 0.99);
const resultadoSemCandidato = await casarEmpresa("EMPRESA TOTALMENTE ALHEIA", SPONSORS, stubContadorVazio);
checa("resultado e 'sem_candidato'", resultadoSemCandidato.resultado === "sem_candidato");
checa("zero chamada ao Jev quando nao ha candidato por substring", stubContadorVazio.chamadas.length === 0, `${stubContadorVazio.chamadas.length}`);

// ---------------------------------------------------------------------------
// 6. Candidato existe, mas o Jev rejeita com confianca (abaixo do limiar baixo).
// ---------------------------------------------------------------------------
console.log("\n6. Candidato por substring rejeitado com confianca pelo Jev\n");

const resultadoRejeitado = await casarEmpresa("NETTOP", SPONSORS, stubFixo(0.1));
checa("resultado e 'nenhum_confirmado'", resultadoRejeitado.resultado === "nenhum_confirmado", resultadoRejeitado.resultado);
checa("indice fica null", resultadoRejeitado.indice === null);

const resultadoRejeitadoNoLimite = await casarEmpresa("NETTOP", SPONSORS, stubFixo(0.49));
checa(
  "0.49 (logo abaixo do limiar baixo, 0.5) ainda e 'nenhum_confirmado'",
  resultadoRejeitadoNoLimite.resultado === "nenhum_confirmado",
  resultadoRejeitadoNoLimite.resultado
);

// ---------------------------------------------------------------------------
// 7. Terceiro estado -- 'sugerir_confirmacao'. Nem confirmado com confianca
// (< limiar alto), nem rejeitado com confianca (>= limiar baixo): fica no
// meio, e o organizador ve a sugestao em vez de o sistema simplesmente
// desistir. Limiares DERIVADOS da varredura do lote 03 (LIMIARES_CASAMENTO_EMPRESA),
// nao escolhidos de ouvido -- ver o comentario no cabecalho de empresa.js.
//
// Caso real que motivou isto: "SB" contra "SB INVESTIMENTOS & CONSÓRCIO"
// saiu com probabilidade 0.70 de verdade (medido, nao simulado) -- abaixo do
// limiar antigo (0.8) mas claramente o candidato certo.
// ---------------------------------------------------------------------------
console.log("\n7. Terceiro estado: sugerir_confirmacao (faixa intermediaria)\n");

const resultadoSugestao = await casarEmpresa("SB", SPONSORS, stubFixo(0.7));
checa("probabilidade 0.70 (faixa intermediaria) vira 'sugerir_confirmacao', nao 'nenhum_confirmado'", resultadoSugestao.resultado === "sugerir_confirmacao", resultadoSugestao.resultado);
checa("indice fica null -- e sugestao, o sistema nao decide sozinho", resultadoSugestao.indice === null);
checa(
  "candidatosSugeridos lista a mesa certa",
  (resultadoSugestao.candidatosSugeridos ?? []).some((c) => c.mesa === "SB INVESTIMENTOS & CONSÓRCIO")
);

// bordas exatas dos limiares default (alto=0.8, baixo=0.5)
checa("0.8 exato (limiar alto) ja confirma ('casado')", (await casarEmpresa("SB", SPONSORS, stubFixo(0.8))).resultado === "casado");
checa("0.79 (logo abaixo do limiar alto) vira sugestao", (await casarEmpresa("SB", SPONSORS, stubFixo(0.79))).resultado === "sugerir_confirmacao");
checa("0.5 exato (limiar baixo) ainda e sugestao", (await casarEmpresa("SB", SPONSORS, stubFixo(0.5))).resultado === "sugerir_confirmacao");

// varios candidatos na faixa intermediaria ao mesmo tempo -- todos entram na
// lista de sugestoes, ordenados do mais para o menos provavel; NAO e
// 'ambiguo' (essa faixa e reservada para 2+ CONFIRMADOS acima do limiar
// alto, o caso perigoso de decisao silenciosa errada -- aqui nada e
// decidido, entao nao ha o mesmo risco).
const stubDoisNaFaixaMedia = stubContador((state) => {
  if (state.nome_da_mesa === "PORT CONSULTING") return 0.55;
  if (state.nome_da_mesa === "SB INVESTIMENTOS & CONSÓRCIO") return 0.6;
  return 0.1;
});
const resultadoDuasSugestoes = await casarEmpresa("CON", SPONSORS, stubDoisNaFaixaMedia);
checa(
  "duas mesas na faixa intermediaria viram DUAS sugestoes, nao 'ambiguo'",
  resultadoDuasSugestoes.resultado === "sugerir_confirmacao" && (resultadoDuasSugestoes.candidatosSugeridos ?? []).length === 2,
  JSON.stringify(resultadoDuasSugestoes.candidatosSugeridos)
);
checa(
  "sugestoes vem ordenadas da mais provavel para a menos provavel",
  resultadoDuasSugestoes.candidatosSugeridos[0].mesa === "SB INVESTIMENTOS & CONSÓRCIO" &&
    resultadoDuasSugestoes.candidatosSugeridos[1].mesa === "PORT CONSULTING"
);

// ---------------------------------------------------------------------------
console.log(`\n${falhas === 0 ? "TUDO OK" : `${falhas} FALHA(S)`}`);
process.exit(falhas === 0 ? 0 : 1);
