/**
 * Aferidor de aderencia a criterio de aceite (MCT-28).
 *
 * Dado um criterio de aceite e a EVIDENCIA do que foi feito, pergunta ao Jev
 * se o criterio foi atendido (Noul) e classifica o desfecho (Choice, quatro
 * rotulos: atendido / parcial / fora_do_escopo / nao_demonstrado).
 *
 * REGRA DE DESENHO QUE NAO SE NEGOCIA: o Jev julga o DIFF e a SAIDA DE
 * COMANDO, nunca o relatorio em prosa que o agente escreve sobre o proprio
 * trabalho. Se o agente escreve o relatorio e o Jev julga o relatorio, o
 * agente se autoavalia e o numero nao vale nada. Por isso a assinatura de
 * `aferirCriterio()` nem aceita um campo de "relatorio" -- so `criterio` +
 * `evidencia` (diff por arquivo, mais saida de comando opcional). Quem
 * chama este modulo NUNCA deve passar o texto que o agente escreveu sobre
 * si mesmo como evidencia.
 *
 * LIMITE DE ESTADO (32k): o despacho do MCT-28 avisa que um diff grande nao
 * cabe no `state` do Jev. Truncar em silencio faria o aferidor julgar meio
 * diff sem avisar -- inaceitavel num instrumento de medicao. Este modulo:
 *   1. tenta mandar tudo (diff de todos os arquivos + saida de comando) numa
 *      chamada so, se couber;
 *   2. se nao couber, fatia por ARQUIVO -- uma chamada por arquivo, juntando
 *      os vereditos no fim (ver `agregarVereditos`);
 *   3. se um UNICO arquivo, sozinho, ja passar do limite, RECUSA
 *      explicitamente (`resultado: "estado_grande_demais"`) -- zero chamada
 *      ao Jev para esse arquivo, e o motivo da recusa fica no retorno. Nunca
 *      corta o texto no meio para forcar caber.
 *
 * DECISAO DE DESIGN (igual a dedup.js/empresa.js): este modulo NAO
 * instancia o cliente do TypeSafe SDK -- recebe `perguntarAoJev(state,
 * questions) => Promise<{ answers, usage }>` por injecao, no mesmo formato
 * de `jev.systemOne()`. Ver o cabecalho de dedup.js para o raciocinio
 * completo.
 */

/**
 * Aproximacao conservadora do limite de 32k mencionado no despacho. Conta
 * CARACTERES do `state` ja serializado em JSON (o que de fato vai na
 * requisicao), nao tokens -- contar caracteres e barato, deterministico, e
 * subestimar o numero de tokens por caractere e o lado seguro do erro
 * (um caractere nunca vale MENOS que uma fracao de token, entao um texto
 * que passa no teste de caracteres tende a passar no limite real de tokens
 * tambem, nunca o contrario).
 */
export const LIMITE_ESTADO_CARACTERES = 32000;

function tamanhoDoState(state) {
  return JSON.stringify(state).length;
}

/** Pergunta do aferidor: um Noul (atendido?) mais um Choice (desfecho). POJOs, sem importar o SDK. */
export function perguntaAferidor() {
  return {
    atendido: {
      type: "noul",
      instructions:
        "O criterio de aceite abaixo foi atendido pela evidencia (diff de codigo e/ou saida de " +
        "comando)? Julgue SOMENTE o que esta na evidencia -- nao ha relatorio de agente aqui, " +
        "so o diff e a saida bruta.",
      criteria: {
        true: "O diff e/ou a saida de comando demonstram que o criterio foi cumprido.",
        false:
          "O diff e/ou a saida de comando NAO demonstram o criterio cumprido -- falta implementacao, " +
          "a mudanca nao cobre o que o criterio pede, ou nao ha evidencia suficiente para afirmar que foi cumprido.",
      },
    },
    desfecho: {
      type: "choice",
      instructions: "Classifique o desfecho deste criterio de aceite, a partir da mesma evidencia.",
      criteria: {
        atendido: "A evidencia demonstra, de forma clara, que o criterio foi cumprido integralmente.",
        parcial:
          "A evidencia mostra progresso relevante, mas o criterio nao foi cumprido por completo -- " +
          "cobre so parte do que foi pedido, ou cumpre so em alguns casos.",
        fora_do_escopo:
          "A evidencia mostra uma mudanca real, mas que nao e o que o criterio pede -- resolve outra " +
          "coisa, ou vai na direcao errada.",
        nao_demonstrado:
          "Nao ha evidencia suficiente no diff/saida para afirmar nada sobre este criterio -- falta " +
          "implementacao, falta teste, ou a evidencia fornecida simplesmente nao toca o assunto.",
      },
    },
  };
}

/** Monta o `state` para UM arquivo (ou para o pacote inteiro, quando `arquivo` e null). */
function montarState(criterio, arquivo, diff, saidaComando) {
  return {
    criterio_de_aceite: criterio,
    arquivo: arquivo ?? null,
    diff,
    saida_de_comando: saidaComando ?? null,
  };
}

async function avaliarUmaChamada(state, perguntarAoJev) {
  const resposta = await perguntarAoJev(state, perguntaAferidor());
  return {
    probabilidade: resposta.answers.atendido.noul,
    desfecho: resposta.answers.desfecho.choice,
    desfechoConfidence: resposta.answers.desfecho.confidence,
    usage: resposta.usage ?? null,
  };
}

/**
 * Ordem de severidade para agregar desfechos de varios arquivos -- o pior
 * desfecho de qualquer arquivo individual vence. "nao_demonstrado" e o mais
 * severo (nenhuma evidencia de nada), depois "fora_do_escopo" (mudanca real,
 * mas errada), depois "parcial", e so "atendido" quando TODOS os arquivos
 * avaliados forem "atendido". A mesma logica de "o elo mais fraco decide"
 * de `calcularConfiancaEmpresa` no medir.ts -- nao esconder uma reprovacao
 * atras de varios arquivos que passam.
 */
const SEVERIDADE_DESFECHO = { nao_demonstrado: 0, fora_do_escopo: 1, parcial: 2, atendido: 3 };

function agregarVereditos(avaliacoesPorArquivo) {
  let pior = avaliacoesPorArquivo[0];
  for (const av of avaliacoesPorArquivo) {
    if ((SEVERIDADE_DESFECHO[av.desfecho] ?? 0) < (SEVERIDADE_DESFECHO[pior.desfecho] ?? 0)) pior = av;
  }
  const probabilidadeMinima = Math.min(...avaliacoesPorArquivo.map((a) => a.probabilidade));
  return {
    resultado: "fatiado",
    probabilidade: probabilidadeMinima,
    desfecho: pior.desfecho,
    desfechoConfidence: pior.desfechoConfidence,
    avaliacoesPorArquivo,
  };
}

/**
 * Afere UM criterio de aceite contra a evidencia fornecida.
 *
 * `evidencia` e `{ diffPorArquivo: [{ arquivo, diff }], saidaComando? }` OU,
 * para o caso comum de um diff so, `{ diff, saidaComando? }` (equivalente a
 * `diffPorArquivo: [{ arquivo: null, diff }]`).
 *
 * Devolve `{ resultado, probabilidade, desfecho, desfechoConfidence, ... }`,
 * onde `resultado` e um de:
 *   - "avaliado_completo"  coube tudo numa chamada so.
 *   - "fatiado"            nao coube inteiro; avaliado arquivo por arquivo e
 *                          agregado pelo pior desfecho (ver `agregarVereditos`).
 *   - "estado_grande_demais"  pelo menos um arquivo, sozinho, passa do
 *                          limite -- RECUSADO, zero chamada ao Jev para
 *                          esse arquivo. `motivo` explica qual(is).
 */
export async function aferirCriterio(criterio, evidencia, perguntarAoJev) {
  const arquivos = evidencia.diffPorArquivo ?? [{ arquivo: null, diff: evidencia.diff ?? "" }];
  const saidaComando = evidencia.saidaComando ?? null;

  const diffCombinado = arquivos.map((a) => `--- ${a.arquivo ?? "(diff unico)"} ---\n${a.diff}`).join("\n\n");
  const stateCompleto = montarState(criterio, null, diffCombinado, saidaComando);

  if (tamanhoDoState(stateCompleto) <= LIMITE_ESTADO_CARACTERES) {
    const av = await avaliarUmaChamada(stateCompleto, perguntarAoJev);
    return { resultado: "avaliado_completo", ...av };
  }

  // Nao coube inteiro. Antes de fatiar, confere se algum arquivo, sozinho,
  // ja estoura o limite -- esse caso nao tem fatia possivel, e recusa.
  const grandesDemais = arquivos.filter(
    (a) => tamanhoDoState(montarState(criterio, a.arquivo, a.diff, saidaComando)) > LIMITE_ESTADO_CARACTERES
  );
  if (grandesDemais.length > 0) {
    return {
      resultado: "estado_grande_demais",
      motivo:
        `o diff de ${grandesDemais.map((a) => a.arquivo ?? "(diff unico)").join(", ")} sozinho ja passa de ` +
        `${LIMITE_ESTADO_CARACTERES} caracteres -- recusado, nao truncado. Fatie manualmente antes de aferir.`,
      arquivosRecusados: grandesDemais.map((a) => a.arquivo ?? null),
    };
  }

  const avaliacoesPorArquivo = [];
  for (const a of arquivos) {
    const state = montarState(criterio, a.arquivo, a.diff, saidaComando);
    const av = await avaliarUmaChamada(state, perguntarAoJev);
    avaliacoesPorArquivo.push({ arquivo: a.arquivo, ...av });
  }
  return agregarVereditos(avaliacoesPorArquivo);
}
