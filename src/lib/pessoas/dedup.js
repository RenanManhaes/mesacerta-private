/**
 * Julgamento de duplicata de pessoa (MCT-22, segunda metade).
 *
 * O pre-filtro (prefiltro.js) ja devolveu os PARES CANDIDATOS, sem IA, muito
 * abaixo do N^2. Este modulo pega cada par candidato e pergunta ao Jev, um
 * Noul por par, se sao a mesma pessoa.
 *
 * DECISAO DE PRODUTO (lote 03, medida contra jev-pilot/src/fixtures/pares_pessoas.json,
 * 34 pares reais): NAO HA FUSAO AUTOMATICA NESTE CAMPO. A medicao real deu:
 *   - correlacao erro x confianca (ponto-bisserial): -0.10 -- praticamente
 *     zero. Nos outros quatro campos medidos ate aqui, os piores ja eram
 *     +0.09 (segmento) e -0.16/-0.33 (papel, entre rodadas); este e o unico
 *     onde o numero fica tao perto de zero por esta amostra inteira.
 *   - confianca media no acerto (0.57) e no erro (0.49) -- quase iguais. O
 *     Jev NAO avisa de forma confiavel quando esta errando aqui.
 *   - o limiar derivado dos proprios dados (maior confianca de erro +
 *     margem) barraria 72% dos acertos so para filtrar os poucos erros --
 *     trade-off ruim demais para valer a pena automatizar.
 *
 * Por isso `LIMIARES_DEDUP_PESSOA` abaixo desliga as duas pontas (fusao
 * automatica E descarte automatico como "pessoas distintas") por padrao.
 * TODO par candidato vai para confirmacao humana, sem excecao. O valor do
 * Jev neste campo NAO e decidir -- e ORDENAR a fila de revisao pela
 * probabilidade (par mais provavel primeiro), para o organizador nao
 * precisar olhar 30 pares na ordem arbitraria em que o pre-filtro os
 * produziu. Ver `julgarParesDePessoas`, que devolve a fila ja ordenada.
 *
 * O mecanismo de faixas (e o registro de fusao automatica, com log) continua
 * existindo e testado -- um chamador pode passar `opts.limiares` explicito
 * para reativar bandas automaticas, se uma recalibragem futura (mais dados,
 * outro modelo) justificar. O que mudou e o PADRAO: desligado, ate prova em
 * contrario.
 *
 * DECISAO DE DESIGN (inalterada): este modulo NAO instancia o cliente do
 * TypeSafe SDK. mesa-certa ainda nao decidiu se o SDK entra como dependencia
 * do produto (AGENTS.md, "Ponto em aberto" sobre o backend) e nao ha
 * necessidade demonstrada de acrescentar a dependencia so para isto. Em vez
 * disso, a funcao que fala com o Jev e recebida por INJECAO --
 * `perguntarAoJev(state, questions) => Promise<{ answers, usage }>`, no
 * mesmo formato de retorno de `jev.systemOne()` do SDK. Quem chama decide de
 * onde vem essa funcao:
 *   - em producao, um adaptador fino sobre o TypeSafeClient;
 *   - na medicao (jev-pilot/src/medir.ts), o cliente real do piloto;
 *   - em teste, um stub deterministico, sem rede e sem chave de API.
 *
 * Isso mantem este arquivo testavel com `node` puro, no mesmo espirito de
 * prefiltro.js, mesmo ele proprio dependendo de IA (o pre-filtro, esse sim,
 * e puro -- ver o cabecalho dele).
 */

/**
 * Limiares padrao: as duas pontas INATINGIVEIS de proposito (ver decisao de
 * produto acima). `probabilidade >= Infinity` e `probabilidade <= -Infinity`
 * nunca sao verdadeiros para um Noul (que devolve 0..1) -- entao todo par,
 * por padrao, cai em "confirmar_humano". Nao e um limiar esquecido: e a
 * politica atual, documentada e proposital.
 */
export const LIMIARES_DEDUP_PESSOA = {
  alto: Infinity,
  baixo: -Infinity,
};

/** Pergunta Noul para um par de pessoas. POJO no formato de `NoulQuestion` do SDK -- sem importar o SDK. */
export function perguntaDedupPessoa() {
  return {
    mesma_pessoa: {
      type: "noul",
      instructions:
        "Estes dois registros de cadastro de participantes de um evento de networking " +
        "empresarial se referem a mesma pessoa fisica, cadastrada duas vezes?",
      criteria: {
        true:
          "Mesma pessoa. Pode ser a mesma grafia com acento/caixa diferentes, um sufixo " +
          "a mais (Jr., Neto), um nome abreviado, a ordem do nome trocada, ou a mesma " +
          "pessoa com sobrenome de casada.",
        false:
          "Pessoas diferentes. Inclusive quando os nomes parecem muito semelhantes por " +
          "coincidencia (homonimos), ou quando sao parentes com nomes parecidos de " +
          "proposito (pai e filho usando Jr. e Neto, por exemplo) -- isso e sinal de " +
          "DUAS pessoas, nao de cadastro duplicado.",
      },
    },
  };
}

/**
 * Julga UM par candidato. `par` e o formato que `encontrarCandidatosDuplicata`
 * (prefiltro.js) devolve: `{ a, b, motivo }`, onde `a`/`b` sao os registros
 * originais (objetos com `nome` e, se houver, `empresa`) e `motivo` e a razao
 * estrutural pela qual o pre-filtro marcou o par como parecido.
 *
 * O `motivo` entra no `state` como uma DICA, nunca como fato. Isto importa:
 * se o pre-filtro atribuir um motivo errado (o defeito corrigido no lote 01,
 * onde um par Jr/Neto podia sair rotulado "ordem_invertida"), repassar isso
 * ao modelo como se fosse verdade contamina o julgamento com uma mentira. O
 * texto abaixo deixa explicito que e so a razao do FILTRO BARATO, nunca uma
 * garantia -- para o Jev julgar pelos nomes, nao pela legenda.
 *
 * `faixa` na saida, com os limiares padrao (ver LIMIARES_DEDUP_PESSOA), e
 * SEMPRE "confirmar_humano" -- e a propria decisao de produto do lote 03,
 * nao um efeito colateral. So muda se o chamador passar `limiares` explicito.
 */
export async function julgarParDePessoas(par, perguntarAoJev, limiares = LIMIARES_DEDUP_PESSOA) {
  const state = {
    pessoa_a: { nome: par?.a?.nome ?? null, empresa: par?.a?.empresa ?? null },
    pessoa_b: { nome: par?.b?.nome ?? null, empresa: par?.b?.empresa ?? null },
    dica_do_pre_filtro: {
      motivo_estrutural: par?.motivo ?? null,
      aviso:
        "Isto e so a razao pela qual um filtro barato, sem IA, marcou o par como parecido " +
        "o bastante para valer a pena perguntar. NAO e garantia de que sao a mesma pessoa -- " +
        "julgue pelos nomes e pela empresa, nao por esta legenda.",
    },
  };

  const resposta = await perguntarAoJev(state, perguntaDedupPessoa());
  const probabilidade = resposta.answers.mesma_pessoa.noul;

  let faixa;
  if (probabilidade >= limiares.alto) faixa = "fundir_automatico";
  else if (probabilidade <= limiares.baixo) faixa = "distintas";
  else faixa = "confirmar_humano";

  return { par, probabilidade, faixa, usage: resposta.usage ?? null };
}

/**
 * Julga uma lista de pares candidatos, em lotes (para nao estourar limite de
 * taxa da API), e devolve a FILA DE REVISAO HUMANA ja ordenada -- par mais
 * provavel de ser duplicata primeiro. E aqui que o Jev agrega valor neste
 * campo (lote 03): nao decide, ordena.
 *
 * Com os limiares padrao, nenhum par e auto-fundido nem auto-descartado --
 * `registrarFusao` so dispara se o chamador passar `opts.limiares`
 * explicito reativando a faixa alta (ver decisao de produto no cabecalho do
 * arquivo). Quando dispara, e SEMPRE com log contendo os dois registros
 * originais e a probabilidade -- e o criterio de aceite 6 do lote 02, que
 * continua valendo para quem reativar fusao automatica no futuro.
 */
export async function julgarParesDePessoas(pares, perguntarAoJev, opts = {}) {
  const limiares = { ...LIMIARES_DEDUP_PESSOA, ...(opts.limiares ?? {}) };
  const concorrencia = opts.concorrencia ?? 6;
  const registrarFusao =
    opts.registrarFusao ??
    ((log) => console.log("[dedup] fusao automatica:", JSON.stringify(log)));

  const resultados = [];
  for (let i = 0; i < pares.length; i += concorrencia) {
    const lote = pares.slice(i, i + concorrencia);
    const resultadosLote = await Promise.all(
      lote.map((par) => julgarParDePessoas(par, perguntarAoJev, limiares))
    );
    for (const r of resultadosLote) {
      if (r.faixa === "fundir_automatico") {
        registrarFusao({
          tipo: "pessoa",
          original_a: r.par.a,
          original_b: r.par.b,
          motivo_pre_filtro: r.par.motivo ?? null,
          probabilidade: r.probabilidade,
          timestamp: new Date().toISOString(),
        });
      }
      resultados.push(r);
    }
  }

  // Fila de revisao ordenada -- probabilidade decrescente. Pares com a mesma
  // probabilidade mantem a ordem relativa em que chegaram (sort estavel).
  resultados.sort((a, b) => b.probabilidade - a.probabilidade);
  return resultados;
}
