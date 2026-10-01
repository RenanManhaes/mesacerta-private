/**
 * Pre-filtro de deduplicacao de pessoas (MCT-22).
 *
 * Funcao pura, sem IA: recebe uma lista de pessoas e devolve so os PARES que
 * valem a pena perguntar ao Jev "isto e a mesma pessoa?" (ver item 2 de
 * docs/jev-no-mesa-certa.md). O trabalho dele e barrar o custo N^2 antes do
 * Jev entrar -- comparar 200 pessoas gera 19.900 pares possiveis; este filtro
 * devolve uma fracao pequena disso, os pares realmente parecidos.
 *
 * Nao decide se sao a mesma pessoa. So decide se vale perguntar. O `motivo`
 * devolvido em cada par vai virar contexto no prompt do Jev -- por isso ele
 * tem que ser honesto: nunca rotular como "mesmo padrao, so reordenado" um
 * par que na verdade tem um sinal de pessoa DIFERENTE (ver `compararNomes`).
 *
 * Estrategia:
 *   1. normaliza cada nome (acento, caixa, espacos);
 *   2. remove particulas de ligacao (de/da/do/das/dos/dal/du/e) -- elas nao
 *      identificam ninguem, e "Joao Silva" e "Joao da Silva" sao o mesmo
 *      padrao de duplicata mais comum do cadastro brasileiro;
 *   3. agrupa pessoas num "bloco" pela combinacao de letras iniciais dos
 *      tokens relevantes do nome (ordem-independente, entao "Joao Silva" e
 *      "Silva Joao" caem no mesmo bloco, e "J. Silva" tambem, porque a
 *      inicial "j" tem a mesma primeira letra que "joao");
 *   4. so compara pares DENTRO do mesmo bloco -- e o que evita o N^2;
 *   5. dentro do bloco, aplica uma comparacao mais fina (normalizacao exata,
 *      particula, sufixo, ordem invertida, inicial abreviada) para decidir
 *      se o par e candidato. Pessoas com o mesmo bloco mas nomes de fato
 *      diferentes (ex.: "Joao Silva" e "Joao Santos", mesmas iniciais
 *      "j"+"s") sao descartadas aqui, nao viram par. O mesmo vale para
 *      sufixos GERACIONAIS conflitantes ("Jr" x "Neto"): sinalizam pai e
 *      filho, pessoas diferentes, nunca um par.
 */

/** Baixa acento e caixa, remove pontuacao de inicial abreviada, colapsa espacos. */
export function normalizarNome(nome) {
  return String(nome ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizar(nomeNormalizado) {
  return nomeNormalizado.split(" ").filter(Boolean);
}

/**
 * Particulas de ligacao do portugues que aparecem em sobrenomes compostos e
 * NAO identificam a pessoa -- "Joao Silva" e "Joao da Silva" sao o mesmo
 * nome para efeito de dedup. Removidas de qualquer posicao no nome, nao so
 * das pontas, porque aparecem no meio ("Maria da Silva Santos").
 */
const PARTICULAS = new Set(["de", "da", "do", "das", "dos", "dal", "du", "e"]);

function removerParticulas(tokens) {
  const semParticulas = tokens.filter((t) => !PARTICULAS.has(t));
  // nome era so particulas (nunca deveria acontecer) -- mantem o original
  // em vez de zerar o nome inteiro.
  return semParticulas.length ? semParticulas : tokens;
}

/**
 * Sufixos de nome. Dois grupos, com efeito diferente na comparacao:
 *   - GERACIONAIS (jr/neto/filho/sobrinho/numeral romano): quando dois
 *     nomes so diferem no sufixo e os sufixos SAO DIFERENTES entre si, isso
 *     e sinal de pessoas DIFERENTES (pai e filho, avo e neto) -- nunca um
 *     par. Quando o sufixo e o MESMO dos dois lados, ou existe so de um
 *     lado, e sinal de duplicata (mesma pessoa, um cadastro mais completo
 *     que o outro).
 * `ALIAS` normaliza grafias equivalentes do mesmo marcador ("junior"/"jr")
 * antes de comparar, para nao acusar conflito onde nao ha.
 */
const SUFIXOS = new Set(["jr", "junior", "neto", "filho", "sobrinho", "ii", "iii", "iv", "v"]);
const ALIAS_SUFIXO = { junior: "jr" };
const normalizarSufixo = (s) => ALIAS_SUFIXO[s] ?? s;

/**
 * Remove o sufixo FINAL (se houver) e devolve o nucleo do nome mais o
 * sufixo identificado. So olha o ultimo token -- e onde o sufixo aparece na
 * pratica ("Joao Silva Jr", nunca "Joao Jr Silva").
 */
function separarSufixo(tokens) {
  if (tokens.length <= 1) return { nucleo: tokens, sufixo: null };
  const ultimo = tokens[tokens.length - 1];
  if (!SUFIXOS.has(ultimo)) return { nucleo: tokens, sufixo: null };
  return { nucleo: tokens.slice(0, -1), sufixo: normalizarSufixo(ultimo) };
}

function multisetIguais(a, b) {
  if (a.length !== b.length) return false;
  const restante = [...b];
  for (const token of a) {
    const i = restante.indexOf(token);
    if (i === -1) return false;
    restante.splice(i, 1);
  }
  return true;
}

/** "j" e inicial de "joao"; token de 1 letra batendo com a primeira letra do outro. */
function ehInicialDe(curto, longo) {
  return curto.length === 1 && longo.length > 1 && longo[0] === curto[0];
}

/**
 * Bipartite matching POR BACKTRACKING entre os tokens de `a` e `b` (exato ou
 * por inicial). Precisa ser backtracking, nao guloso: um casamento guloso
 * erra em casos como "C. Carlos Souza" x "Carlos Cesar Souza", onde "c" (a
 * inicial) reivindica "carlos" (o nome completo) antes de "carlos" (o nome
 * completo do outro lado) ter chance de casar com ele -- sobra "cesar" sem
 * par e o algoritmo guloso devolve falso negativo. Com poucos tokens por
 * nome (tipicamente 2-4), o custo do backtracking e irrelevante.
 */
function casamentoComIniciais(a, b, usados = new Array(b.length).fill(false), i = 0) {
  if (a.length !== b.length) return false;
  if (i >= a.length) return true;
  const token = a[i];
  for (let j = 0; j < b.length; j++) {
    if (usados[j]) continue;
    if (b[j] === token || ehInicialDe(token, b[j]) || ehInicialDe(b[j], token)) {
      usados[j] = true;
      if (casamentoComIniciais(a, b, usados, i + 1)) return true;
      usados[j] = false;
    }
  }
  return false;
}

/**
 * Mesma ideia de `casamentoComIniciais`, mas para tamanhos diferentes em
 * exatamente 1 token -- o caso de um nome do meio abreviado ("Ana Alves" x
 * "Ana A. Alves"). Tenta remover, um de cada vez, um token de 1 letra do
 * lado mais comprido (um "meio-nome" que o lado mais curto simplesmente nao
 * tem) e testa se o restante casa exatamente.
 */
function casamentoComIniciaisExtras(curto, comprido) {
  if (comprido.length !== curto.length + 1) return false;
  for (let i = 0; i < comprido.length; i++) {
    if (comprido[i].length !== 1) continue; // so remove inicial solta, nao nome inteiro
    const semEssa = [...comprido.slice(0, i), ...comprido.slice(i + 1)];
    if (casamentoComIniciais(curto, semEssa)) return true;
  }
  return false;
}

/**
 * Compara dois nomes e devolve o motivo do casamento, ou `null` se nao ha
 * candidatura a duplicata. Exportada separada de `encontrarCandidatosDuplicata`
 * porque e a peca que concentra a logica de "sao parecidos" -- util para
 * testar isolada.
 */
export function compararNomes(nomeA, nomeB) {
  const normA = normalizarNome(nomeA);
  const normB = normalizarNome(nomeB);
  if (!normA || !normB) return null;
  if (normA === normB) return "identico_apos_normalizacao";

  const tokensA = tokenizar(normA);
  const tokensB = tokenizar(normB);

  // 1) Mesmos tokens, so em ordem diferente -- nenhuma particula ou sufixo
  //    envolvido, entao e pura inversao de ordem.
  if (multisetIguais(tokensA, tokensB)) {
    return "ordem_invertida";
  }

  // 2) Remove particulas de ligacao (de/da/do...) e testa de novo. Se bate
  //    agora, a unica diferenca era a particula.
  const semParticulaA = removerParticulas(tokensA);
  const semParticulaB = removerParticulas(tokensB);
  if (multisetIguais(semParticulaA, semParticulaB)) {
    return "particula";
  }

  // 3) Remove o sufixo final (jr/neto/...) de cada lado e testa o nucleo.
  const { nucleo: nucleoA, sufixo: sufixoA } = separarSufixo(semParticulaA);
  const { nucleo: nucleoB, sufixo: sufixoB } = separarSufixo(semParticulaB);
  if (multisetIguais(nucleoA, nucleoB)) {
    if (sufixoA && sufixoB && sufixoA !== sufixoB) {
      // "Joao Silva Jr" x "Joao Silva Neto" -- nucleo igual, mas os
      // sufixos sao marcadores geracionais DIFERENTES: pai e filho, nao a
      // mesma pessoa com cadastro duplicado. Reprova o par.
      return null;
    }
    return "sufixo";
  }

  // 4) Inicial abreviada, com backtracking real (ver casamentoComIniciais).
  if (casamentoComIniciais(nucleoA, nucleoB)) {
    return "inicial_abreviada";
  }

  // 5) Mesmo caso, mas um lado tem 1 token a mais que e uma inicial solta
  //    (nome do meio abreviado presente so de um lado).
  if (nucleoA.length < nucleoB.length && casamentoComIniciaisExtras(nucleoA, nucleoB)) {
    return "inicial_abreviada";
  }
  if (nucleoB.length < nucleoA.length && casamentoComIniciaisExtras(nucleoB, nucleoA)) {
    return "inicial_abreviada";
  }

  return null;
}

/** Chave de bloco: letras iniciais dos tokens (sem particula nem sufixo), ordenadas e sem repetir. */
function chaveDeBloco(nomeNormalizado) {
  const semSufixo = separarSufixo(removerParticulas(tokenizar(nomeNormalizado))).nucleo;
  const letras = new Set(semSufixo.map((t) => t[0]).filter(Boolean));
  return [...letras].sort().join("");
}

/**
 * Recebe uma lista de pessoas (cada item: string com o nome, ou objeto com
 * campo `nome`) e devolve os pares candidatos a duplicata.
 *
 * Cada resultado e `{ a, b, motivo }`, onde `a` e `b` sao os itens ORIGINAIS
 * da lista de entrada (preserva id e outros campos que o chamador tenha
 * posto no objeto) e `motivo` e uma das strings devolvidas por
 * `compararNomes`.
 *
 * O array devolvido carrega tambem `.comparacoes` (nao enumeravel na
 * contagem de pares, so um numero a mais na propria referencia) -- quantas
 * chamadas a `compararNomes` o bloqueio realmente precisou fazer. E o
 * numero que prova que o filtro nao degenerou pra N^2: com bloqueio
 * funcionando, `comparacoes` fica muito abaixo de `pessoas.length^2 / 2`.
 */
export function encontrarCandidatosDuplicata(pessoas) {
  if (!Array.isArray(pessoas)) return Object.assign([], { comparacoes: 0 });

  const itens = [];
  pessoas.forEach((pessoa, indice) => {
    const nome = typeof pessoa === "string" ? pessoa : pessoa?.nome;
    const normalizado = normalizarNome(nome);
    if (!normalizado) return; // sem nome, nao entra na comparacao
    itens.push({ indice, original: pessoa, nome, normalizado });
  });

  const blocos = new Map();
  for (const item of itens) {
    const chave = chaveDeBloco(item.normalizado);
    if (!blocos.has(chave)) blocos.set(chave, []);
    blocos.get(chave).push(item);
  }

  const pares = [];
  let comparacoes = 0;
  for (const grupo of blocos.values()) {
    for (let i = 0; i < grupo.length; i++) {
      for (let j = i + 1; j < grupo.length; j++) {
        comparacoes++;
        const motivo = compararNomes(grupo[i].nome, grupo[j].nome);
        if (motivo) {
          pares.push({ a: grupo[i].original, b: grupo[j].original, motivo });
        }
      }
    }
  }
  return Object.assign(pares, { comparacoes });
}
