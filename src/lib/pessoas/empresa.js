/**
 * Casamento de empresa -> mesa (MCT-22, segunda metade).
 *
 * O legado resolve isto com substring nos dois sentidos e aceita o primeiro
 * que bater:
 *
 *   const j = DB.mesas.findIndex(m => norm(m).includes(n) || n.includes(norm(m)));
 *
 * E o mais perigoso dos dois defeitos que a MCT-22 ataca: com
 * `SB INVESTIMENTOS & CONSÓRCIO` na lista de mesas, uma entrada curta e
 * generica pode casar com a mesa errada -- e anfitriao na mesa errada
 * estraga a rodada inteira (nenhuma das rodadas daquela mesa faz sentido).
 *
 * Este modulo faz duas coisas, em duas etapas separadas:
 *   1. `candidatosPorSubstring` -- PORT FIEL da regra de geracao de
 *      candidatos do legado (substring nos dois sentidos). Continua sem IA
 *      aqui: e so a lista de "mesas que vale a pena perguntar sobre", no
 *      mesmo papel que o pre-filtro cumpre para pessoas.
 *   2. `casarEmpresa` -- pergunta ao Jev, Noul, para CADA candidato (nao so
 *      aceita o primeiro substring como o legado faz), e classifica em TRES
 *      faixas (ver LIMIARES_CASAMENTO_EMPRESA) -- mais a REGRA DURA: se DUAS
 *      OU MAIS mesas ficam confirmadas acima do limiar alto, nao escolhe
 *      nenhuma. Devolve ambiguidade para o organizador resolver. Escolher a
 *      primeira e exatamente o bug do legado que este modulo existe para
 *      consertar.
 *
 * Mesma decisao de design de dedup.js: a funcao que fala com o Jev e
 * recebida por injecao (`perguntarAoJev`), para este arquivo nao precisar do
 * SDK do TypeSafe como dependencia. Ver o cabecalho de dedup.js para o
 * raciocinio completo.
 */
import { normalizarNome } from "./prefiltro.js";

/**
 * LIMIARES DERIVADOS DA VARREDURA DO LOTE 03, NAO ESCOLHIDOS DE OUVIDO.
 *
 * Ver `varrerLimiarEmpresas` em jev-pilot/src/medir.ts e o gabarito real em
 * jev-pilot/src/fixtures/pares_empresas.json. A varredura reclassificou, em
 * cada ponto de corte de 0.50 a 0.95, as MESMAS probabilidades ja coletadas
 * numa unica rodada real contra a API (nenhuma chamada nova para derivar
 * isto):
 *
 *   - `alto = 0.80`: o primeiro ponto de corte onde o falso-positivo por
 *     candidato caiu a ZERO na amostra medida (16 casos, 19 avaliacoes de
 *     candidato). Abaixo disso -- ver `baixo` -- ainda havia candidato
 *     errado sendo confirmado (ex.: um dos 4 candidatos de "CON" ficando
 *     acima do limiar sozinho, quando o caso deveria ser ambiguo ou
 *     rejeitado).
 *   - `baixo = 0.50`: o ponto neutro da propria probabilidade. Abaixo disto
 *     o Noul esta dizendo "mais provavel que NAO" que seja a mesma empresa;
 *     nao existe leitura honesta de "talvez sim" abaixo do ponto neutro.
 *
 * Entre os dois -- candidato unico com probabilidade em [0.50, 0.80) -- o
 * Jev NAO decide sozinho. Caso real que motivou isto: "SB" contra
 * "SB INVESTIMENTOS & CONSORCIO" saiu com probabilidade 0.70 -- claramente o
 * candidato certo (e o UNICO candidato -- nao ha regra dura de ambiguidade
 * em jogo aqui), mas abaixo do limiar antigo (0.8, escolhido a priori sem
 * medir nada), que rejeitava isso como se fosse um match ruim. Virar
 * `sugerir_confirmacao` em vez de `nenhum_confirmado` evita jogar fora um
 * candidato provavelmente certo so porque o corte foi alto demais.
 */
export const LIMIARES_CASAMENTO_EMPRESA = Object.freeze({
  alto: 0.8,
  baixo: 0.5,
});

/**
 * Gera os candidatos por substring nos dois sentidos -- exatamente a regra
 * do legado (`acheMesa`), soltando TODOS os candidatos em vez de aceitar o
 * primeiro. Pura, sem IA: e o "filtro barato" deste par de funcoes, no
 * mesmo papel que `encontrarCandidatosDuplicata` cumpre para pessoas.
 */
export function candidatosPorSubstring(nomeInformado, mesas) {
  const n = normalizarNome(nomeInformado);
  if (!n) return [];
  const candidatos = [];
  mesas.forEach((mesa, indice) => {
    const m = normalizarNome(mesa);
    if (!m) return;
    if (m === n || m.includes(n) || n.includes(m)) {
      candidatos.push({ indice, mesa });
    }
  });
  return candidatos;
}

/** Pergunta Noul para um candidato de casamento de empresa. */
export function perguntaCasamentoEmpresa() {
  return {
    mesma_empresa: {
      type: "noul",
      instructions: "Estes dois nomes se referem a mesma empresa?",
      criteria: {
        true:
          "Sim -- um e abreviacao, sigla, grafia sem acento, ou nome parcial do outro " +
          "(com ou sem o sufixo societario: LTDA, S.A., ME, EIRELI etc.)",
        false:
          "Nao -- sao empresas diferentes, mesmo que o nome de uma esteja contido no " +
          "nome da outra por coincidencia (ex.: um nome curto e generico que aparece " +
          "dentro de varios nomes compostos sem ser a mesma empresa)",
      },
    },
  };
}

/**
 * Resolve o nome de empresa informado contra a lista de mesas cadastradas.
 *
 * Devolve `{ resultado, indice, avaliacoes, candidatosAmbiguos?, candidatosSugeridos? }`,
 * onde `resultado` e um de:
 *
 *   - "sem_candidato"        nenhuma mesa bateu nem por substring -- zero
 *                            chamada ao Jev, nao ha o que perguntar.
 *   - "nenhum_confirmado"    havia candidato(s), mas TODOS ficaram abaixo do
 *                            limiar baixo -- rejeitados com confianca.
 *   - "sugerir_confirmacao"  nenhum candidato bateu o limiar alto sozinho,
 *                            mas 1+ ficaram na faixa intermediaria
 *                            [baixo, alto) -- nao confirma, mas tambem nao
 *                            descarta: `candidatosSugeridos` lista os
 *                            candidatos, do mais para o menos provavel, para
 *                            o organizador escolher. `indice` fica `null`
 *                            de proposito -- e sugestao, nao decisao.
 *   - "casado"               exatamente UMA mesa confirmada acima do limiar
 *                            alto. `indice` aponta para ela.
 *   - "ambiguo"              REGRA DURA: DUAS OU MAIS mesas confirmadas
 *                            acima do limiar alto. `indice` fica `null` de
 *                            proposito -- nao escolhe nenhuma.
 *                            `candidatosAmbiguos` lista as mesas em conflito
 *                            para o organizador decidir.
 *
 *                            ATENCAO -- LIMITACAO CONHECIDA: esta regra esta
 *                            testada com stub determinístico em
 *                            empresa.test.mjs (prova que a LOGICA barra
 *                            corretamente quando 2+ candidatos SAO
 *                            confirmados), mas ainda NAO foi exercitada com
 *                            2+ confirmacoes reais do Jev simultaneamente.
 *                            Nas 14 patrocinadoras atuais, os candidatos que
 *                            pareciam ambiguos por substring ("CON" batendo
 *                            em 4 mesas, "SU" em 2) nunca teve mais de um
 *                            candidato cruzando nem o limiar alto novo nem o
 *                            antigo ao mesmo tempo -- o Jev ficou incerto
 *                            sobre todos, nao confiante em varios. Ou seja:
 *                            a prova empirica de que a regra dura DISPARA
 *                            (nao so de que ela, se disparada, acerta) ainda
 *                            nao existe. Precisa ser reexercitada quando
 *                            houver uma base de mesas maior ou com nomes
 *                            mais parecidos entre si de verdade -- nao
 *                            assumir que esta coberta so porque o teste de
 *                            unidade passa.
 */
export async function casarEmpresa(nomeInformado, mesas, perguntarAoJev, limiares = LIMIARES_CASAMENTO_EMPRESA) {
  const candidatos = candidatosPorSubstring(nomeInformado, mesas);
  if (candidatos.length === 0) {
    return { resultado: "sem_candidato", indice: null, avaliacoes: [] };
  }

  const avaliacoes = await Promise.all(
    candidatos.map(async ({ indice, mesa }) => {
      const resposta = await perguntarAoJev(
        { nome_informado: nomeInformado, nome_da_mesa: mesa },
        perguntaCasamentoEmpresa()
      );
      return { indice, mesa, probabilidade: resposta.answers.mesma_empresa.noul };
    })
  );

  const acimaDoAlto = avaliacoes.filter((a) => a.probabilidade >= limiares.alto);

  if (acimaDoAlto.length > 1) {
    // REGRA DURA: nunca escolhe a primeira. Isso e o bug do legado. Ver a
    // limitacao documentada no docstring da funcao -- esta branch segue sem
    // prova empirica real nas 14 patrocinadoras atuais.
    return { resultado: "ambiguo", indice: null, avaliacoes, candidatosAmbiguos: acimaDoAlto };
  }
  if (acimaDoAlto.length === 1) {
    return { resultado: "casado", indice: acimaDoAlto[0].indice, avaliacoes };
  }

  // Nenhum candidato bateu o limiar alto sozinho. Antes de descartar tudo,
  // separa quem ainda esta na faixa intermediaria (nem confirmado, nem
  // rejeitado com confianca) -- esses viram sugestao, nao "nenhum_confirmado".
  const candidatosSugeridos = avaliacoes
    .filter((a) => a.probabilidade >= limiares.baixo)
    .sort((a, b) => b.probabilidade - a.probabilidade);

  if (candidatosSugeridos.length > 0) {
    return { resultado: "sugerir_confirmacao", indice: null, avaliacoes, candidatosSugeridos };
  }
  return { resultado: "nenhum_confirmado", indice: null, avaliacoes };
}
