/**
 * Motor de distribuicao de rodadas de negocio do Mesa Certa.
 *
 * Port fiel do motor que rodou no Get Connected Sorocaba 2026
 * (`rodadas-de-negocio.html`, 76 convidados x 14 mesas x 14 rodadas). A logica
 * nao foi reescrita: so foi tirada do arquivo HTML unico e transformada em
 * modulo, para a UI poder evoluir sem encostar no algoritmo (PRD secao 49).
 *
 * Nada aqui usa IA. A distribuicao e combinatoria deterministica: dada a mesma
 * seed e a mesma entrada, sai sempre a mesma grade.
 */

/** PRNG deterministico (mulberry32). A seed torna a grade reproduzivel. */
export function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/**
 * Monta a grade bruta: `tab[participante][rodada] = mesa`.
 *
 * Os participantes sao divididos em turmas de ate T pessoas. Em cada rodada a
 * turma k se desloca pelas mesas por uma permutacao F[ciclo][k]. Isso garante
 * que cada participante passa por todas as mesas uma vez por ciclo de T rodadas
 * e que cada mesa recebe no maximo uma pessoa por turma -- a lotacao fica
 * sempre em ceil(P/T) ou floor(P/T).
 *
 * As permutacoes sao entao otimizadas por recozimento simulado, minimizando o
 * custo de reencontro entre pares (`pairCost`): duas pessoas que ja se viram
 * pagam mais caro para cair na mesma mesa de novo, e repetir a MESMA mesa com a
 * mesma dupla custa `W` a mais.
 */
export function build(P, T, R, seed) {
  const rand = rng(seed * 7919 + P * 131 + T * 17 + R);
  const m = Math.ceil(P / T);
  const C = Math.ceil(R / T);
  const lastLen = R - (C - 1) * T;

  /** @type {number[][][]} */
  const F = [];
  for (let c = 0; c < C; c++) {
    F.push([]);
    for (let k = 0; k < m; k++) {
      const p = [...Array(T).keys()];
      for (let i = T - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [p[i], p[j]] = [p[j], p[i]];
      }
      F[c].push(p);
    }
  }

  const W = 40;
  const cnt = new Int32Array(T);
  const tk = new Int32Array(T * T);
  const touched = new Int32Array(R);

  function pairCost(k, k2) {
    let cost = 0;
    for (let r = 0; r < R; r++) {
      const c = (r / T) | 0;
      const rr = r % T;
      const a = F[c][k][rr];
      const b = F[c][k2][rr];
      const d = (a - b + T) % T;
      cost += 2 * cnt[d] + 1;
      cnt[d]++;
      const key = d * T + a;
      if (tk[key] > 0) cost += W;
      tk[key]++;
      touched[r] = key;
    }
    for (let r = 0; r < R; r++) {
      tk[touched[r]] = 0;
      const c = (r / T) | 0;
      const rr = r % T;
      cnt[(F[c][k][rr] - F[c][k2][rr] + T) % T] = 0;
    }
    return cost;
  }

  if (m > 1) {
    const pc = [];
    for (let k = 0; k < m; k++) {
      pc.push(new Float64Array(m));
      for (let k2 = 0; k2 < m; k2++) if (k2 !== k) pc[k][k2] = pairCost(k, k2);
    }
    const iters = clamp(Math.floor(5e6 / ((m - 1) * R + 1)), 3000, 250000);
    const nv = new Float64Array(m);
    for (let it = 0; it < iters; it++) {
      const temp = Math.max(0.05, 3 * (1 - it / iters));
      const c = Math.floor(rand() * C);
      const k = Math.floor(rand() * m);
      const len = c === C - 1 ? lastLen : T;
      const i = Math.floor(rand() * len);
      const j = Math.floor(rand() * T);
      if (j === i) continue;
      const f = F[c][k];
      [f[i], f[j]] = [f[j], f[i]];
      let delta = 0;
      for (let k2 = 0; k2 < m; k2++) {
        if (k2 === k) continue;
        nv[k2] = pairCost(k, k2);
        delta += nv[k2] - pc[k][k2];
      }
      if (delta <= 0 || rand() < Math.exp(-delta / temp)) {
        for (let k2 = 0; k2 < m; k2++) {
          if (k2 === k) continue;
          pc[k][k2] = nv[k2];
          pc[k2][k] = nv[k2];
        }
      } else {
        [f[i], f[j]] = [f[j], f[i]];
      }
    }
  }

  const tab = [];
  for (let i = 0; i < P; i++) {
    const k = (i / T) | 0;
    const g = i % T;
    const row = new Array(R);
    for (let r = 0; r < R; r++) {
      const c = (r / T) | 0;
      row[r] = (g + F[c][k][r % T]) % T;
    }
    tab.push(row);
  }
  return tab;
}

/** Reequilibra as rodadas: mesa com anfitrioes fixos recebe menos convidados. */
export function balancear(tab, P, T, R, fx, cap) {
  const at = [];
  for (let r = 0; r < R; r++) at.push(Array.from({ length: T }, () => []));
  for (let i = 0; i < P; i++) for (let r = 0; r < R; r++) at[r][tab[i][r]].push(i);

  for (let r = 0; r < R; r++) {
    for (let passo = 0; passo < T * 4; passo++) {
      let cheia = -1;
      let vazia = -1;
      let nc = -1;
      let nv = 1e9;
      for (let t = 0; t < T; t++) {
        const n = at[r][t].length + fx[t];
        if (n > cap && at[r][t].length && n > nc) {
          cheia = t;
          nc = n;
        }
        if (n < cap && n < nv) {
          vazia = t;
          nv = n;
        }
      }
      if (cheia < 0 || vazia < 0) break;
      let quem = at[r][cheia].find((i) => !tab[i].includes(vazia));
      if (quem === undefined) quem = at[r][cheia][0];
      tab[quem][r] = vazia;
      at[r][cheia] = at[r][cheia].filter((x) => x !== quem);
      at[r][vazia].push(quem);
    }
  }
  return tab;
}

/**
 * Tira o anfitriao que roda da mesa da propria empresa, trocando de lugar com
 * outra pessoa na mesma rodada.
 *
 * So e possivel quando ha menos rodadas que mesas: com R >= T todo mundo passa
 * por todas as mesas, entao nao ha como evitar.
 */
export function evitarCasa(tab, P, T, R, casa) {
  if (R >= T) return tab;
  const at = [];
  for (let r = 0; r < R; r++) at.push(Array.from({ length: T }, () => []));
  for (let i = 0; i < P; i++) for (let r = 0; r < R; r++) at[r][tab[i][r]].push(i);

  for (let i = 0; i < P; i++) {
    const h = casa[i];
    if (h === null || h === undefined) continue;
    for (let r = 0; r < R; r++) {
      if (tab[i][r] !== h) continue;
      for (let k = 0; k < T; k++) {
        const t2 = (h + 1 + k) % T;
        if (t2 === h || tab[i].includes(t2)) continue;
        const j = at[r][t2].find((j) => casa[j] !== h && !tab[j].includes(h));
        if (j === undefined) continue;
        tab[i][r] = t2;
        tab[j][r] = h;
        at[r][h] = at[r][h].filter((x) => x !== i);
        at[r][h].push(j);
        at[r][t2] = at[r][t2].filter((x) => x !== j);
        at[r][t2].push(i);
        break;
      }
    }
  }
  return tab;
}

/**
 * Analisa uma grade: quem senta com quem, quem repete mesa, quem se reencontra.
 * E daqui que saem os conflitos exibidos antes de publicar (PRD secao 27.7).
 */
export function analyze(tab, P, T, R) {
  /** @type {number[][][]} */
  const at = [];
  for (let r = 0; r < R; r++) {
    at.push([]);
    for (let t = 0; t < T; t++) at[r].push([]);
  }
  for (let i = 0; i < P; i++) for (let r = 0; r < R; r++) at[r][tab[i][r]].push(i);

  const visitNo = tab.map(() => new Array(R));
  const repByPart = [];
  for (let i = 0; i < P; i++) {
    const seen = new Array(T).fill(0);
    const rounds = {};
    for (let r = 0; r < R; r++) {
      const t = tab[i][r];
      seen[t]++;
      visitNo[i][r] = seen[t];
      (rounds[t] = rounds[t] || []).push(r);
    }
    const reps = [];
    for (let t = 0; t < T; t++) if (seen[t] > 1) reps.push({ t, rounds: rounds[t] });
    repByPart.push({ reps, distinct: seen.filter((x) => x > 0).length });
  }

  const log = new Map();
  for (let r = 0; r < R; r++)
    for (let t = 0; t < T; t++) {
      const g = at[r][t];
      for (let x = 0; x < g.length; x++)
        for (let y = x + 1; y < g.length; y++) {
          const a = Math.min(g[x], g[y]);
          const b = Math.max(g[x], g[y]);
          const id = a * P + b;
          const e = log.get(id);
          if (e) e.push([r, t]);
          else log.set(id, [[r, t]]);
        }
    }

  const pairs = [];
  let pairsOnce = 0;
  let maxMeet = 0;
  let sameTable = 0;
  for (const [id, ev] of log) {
    if (ev.length > maxMeet) maxMeet = ev.length;
    if (ev.length === 1) {
      pairsOnce++;
      continue;
    }
    const tbls = ev.map((e) => e[1]);
    const same = new Set(tbls).size < tbls.length;
    if (same) sameTable++;
    pairs.push({ a: Math.floor(id / P), b: id % P, ev, same });
  }
  pairs.sort((x, y) => Number(y.same) - Number(x.same) || y.ev.length - x.ev.length || x.a - y.a);

  const person = [];
  for (let i = 0; i < P; i++) person.push({ known: 0, again: [], sameTable: false });
  for (const [id, ev] of log) {
    const a = Math.floor(id / P);
    const b = id % P;
    person[a].known++;
    person[b].known++;
    if (ev.length > 1) {
      const same = new Set(ev.map((e) => e[1])).size < ev.length;
      person[a].again.push(b);
      person[b].again.push(a);
      if (same) {
        person[a].sameTable = true;
        person[b].sameTable = true;
      }
    }
  }

  const perTable = [];
  for (let t = 0; t < T; t++) {
    let visits = 0;
    let uniq = 0;
    let rev = 0;
    for (let r = 0; r < R; r++)
      for (const i of at[r][t]) {
        visits++;
        if (visitNo[i][r] === 1) uniq++;
        else rev++;
      }
    perTable.push({ t, visits, uniq, rev });
  }

  let minL = Infinity;
  let maxL = 0;
  for (let r = 0; r < R; r++)
    for (let t = 0; t < T; t++) {
      const n = at[r][t].length;
      if (n < minL) minL = n;
      if (n > maxL) maxL = n;
    }

  return { at, visitNo, repByPart, pairs, pairsOnce, maxMeet, sameTable, perTable, minL, maxL, person };
}

/**
 * Pipeline completo, como roda no evento: monta, reequilibra, tira o anfitriao
 * da propria mesa e repete com outras seeds ficando com a melhor grade.
 *
 * @param {object} cfg
 * @param {number} cfg.P  participantes que rodam
 * @param {number} cfg.T  numero de mesas
 * @param {number} cfg.R  numero de rodadas
 * @param {number} cfg.cap  pessoas por mesa, incluindo anfitriao
 * @param {number[]} [cfg.fixosPorMesa]  quantos anfitrioes fixos cada mesa tem
 * @param {(number|null)[]} [cfg.mesaDaCasa]  por participante que roda, a mesa da propria empresa
 * @param {number} [cfg.seedBase]
 */
export function gerarDistribuicao({ P, T, R, cap, fixosPorMesa, mesaDaCasa, seedBase = 1 }) {
  const fx = fixosPorMesa ?? new Array(T).fill(0);
  const casa = mesaDaCasa ?? new Array(P).fill(null);
  const montar = (sd) => evitarCasa(balancear(build(P, T, R, sd), P, T, R, fx, cap), P, T, R, casa);

  // Criterio de desempate entre grades: primeiro zerar duplas que se reencontram
  // na MESMA mesa, depois o maior numero de reencontros, depois o total.
  const nota = (a) => a.sameTable * 1e6 + a.maxMeet * 1e3 + a.pairs.length;

  let seed = seedBase;
  let tab = montar(seed);
  let A = analyze(tab, P, T, R);
  const tentativas = A.sameTable > 0 ? 15 : 4;
  for (let k = 1; k <= tentativas; k++) {
    const sd = seedBase + k;
    const t2 = montar(sd);
    const a2 = analyze(t2, P, T, R);
    if (nota(a2) < nota(A)) {
      tab = t2;
      A = a2;
      seed = sd;
    }
    if (A.sameTable === 0 && A.maxMeet <= 2) break;
  }
  return { tab, analise: A, seed };
}

/** Rota de um participante: em que mesa ele senta em cada rodada. */
export function rotaDoParticipante(tab, i) {
  return tab[i].map((mesa, r) => ({ rodada: r + 1, mesa: mesa + 1 }));
}
