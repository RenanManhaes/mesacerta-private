// @ts-nocheck -- animações manipulam estilos e atributos DOM com valores dinâmicos.
import { initHeroApp } from './heroApp';
// Animações e interações da landing. initLanding(root) retorna uma função de limpeza.
const NAMES = ['Ana Prado','João Moreira','Maria Lima','Lucas Teixeira','Pedro Rocha','Beatriz Nunes','Rafael Barros','Camila Faria','Thiago Campos','Marina Costa','Larissa Duarte','Bruno Pires','Juliana Mendes','Diego Ramos','Fernanda Lopes','Gustavo Reis','Patrícia Alves','Felipe Souza','Aline Costa','Rodrigo Melo','Carla Viana','Marcelo Dias','Isabela Torres','Vinícius Brito','Letícia Gomes','André Lacerda','Priscila Rangel','Eduardo Sales','Natália Freitas','Leonardo Cunha','Gabriela Sá','Fábio Azevedo','Vanessa Paiva','Ricardo Leal','Tatiane Bastos','Daniel Fonseca','Mariana Couto','Paulo Matos','Bianca Serra','Sérgio Macedo','Renata Coelho','Otávio Prates'];
const HOSTS = ['Nuvex','Meridiano','Andrade','Montanha','Vértice','Prisma','Lumen'];
const ROUNDS = 5, ME = 9, NS = 'http://www.w3.org/2000/svg';
const ini = n => n.split(' ').map(w => w[0]).slice(0, 2).join('');
const tableOf = (g, r) => (Math.floor(g / 6) + r * (g % 6)) % 7;
const atTable = (t, r) => [0,1,2,3,4,5].map(s => (((t - r * s) % 7) + 7) % 7 * 6 + s);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const eo = t => 1 - Math.pow(1 - t, 3);
const fmt = (v, d = 0) => v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });

export function initLanding(root) {
  const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = s => root.querySelector(s), $$ = s => [...root.querySelectorAll(s)];
  const cleanups = [];
  const on = (t, ev, fn, o) => { t.addEventListener(ev, fn, o); cleanups.push(() => t.removeEventListener(ev, fn, o)); };
  const rafs = new Set();
  const raf = fn => { const id = requestAnimationFrame(n => { rafs.delete(id); fn(n); }); rafs.add(id); return id; };
  const observers = [];

  function countUp(el, dur = 1400) {
    const to = +el.dataset.count, d = +(el.dataset.dec || 0), pre = el.dataset.pre || '', suf = el.dataset.suf || '';
    if (RM) { el.textContent = pre + fmt(to, d) + suf; return; }
    const t0 = performance.now(); el._tok = (el._tok || 0) + 1; const tok = el._tok;
    const f = n => { if (tok !== el._tok) return; const t = clamp((n - t0) / dur); el.textContent = pre + fmt(to * eo(t), d) + suf; if (t < 1) raf(f); };
    raf(f);
  }

  /* reveal */
  const io = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; e.target.classList.add('in'); e.target.querySelectorAll('[data-count]').forEach(c => countUp(c)); io.unobserve(e.target); }), { threshold: .15 });
  observers.push(io);
  $$('[data-reveal],.shot,.step').forEach(el => io.observe(el));

  /* nav + hero screenshot */
  const shot = $('.shot'), nav = $('.nav');
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle('solid', y > 20);
    if (!RM) { const p = clamp(y / (window.innerHeight * .6)); shot.style.transform = `rotateX(${(1 - p) * 14}deg) scale(${.94 + p * .06}) translateY(${(1 - p) * 10}px)`; }
  };
  on(window, 'scroll', onScroll, { passive: true }); onScroll();

  /* module tabs */
  const tabs = $$('.tab'), pns = $$('.pn'), urlEl = $('#mod-url'), mods = $('.mods');
  const URLS = ['financeiro', 'participantes', 'fornecedores', 'programacao', 'networking'], DUR = 6000;
  let cur = 0, t0 = performance.now(), paused = false, modsVisible = false, alive = true;
  const setTab = i => {
    cur = i; t0 = performance.now();
    tabs.forEach((t, k) => { t.classList.toggle('on', k === i); t.setAttribute('aria-selected', k === i); t.querySelector('.bar i').style.transform = 'scaleX(0)'; });
    pns.forEach((p, k) => { p.classList.toggle('on', k === i); if (k === i) p.querySelectorAll('[data-count]').forEach(c => countUp(c, 1000)); });
    urlEl.textContent = 'app.mesacerta.com.br/seu-evento/' + URLS[i];
  };
  tabs.forEach((t, i) => on(t, 'click', () => setTab(i)));
  on(mods, 'mouseenter', () => { paused = true; });
  on(mods, 'mouseleave', () => { paused = false; t0 = performance.now() - (tabs[cur]._p || 0) * DUR; });
  const mio = new IntersectionObserver(([e]) => { modsVisible = e.isIntersecting; if (modsVisible) t0 = performance.now(); }, { threshold: .3 });
  mio.observe(mods); observers.push(mio);
  const tick = n => {
    if (!alive) return; raf(tick);
    if (RM || paused || !modsVisible) return;
    const p = clamp((n - t0) / DUR); tabs[cur]._p = p;
    tabs[cur].querySelector('.bar i').style.transform = `scaleX(${p})`;
    if (p >= 1) setTab((cur + 1) % tabs.length);
  };
  raf(tick); setTab(0);

  /* mini table plan (aba Rodadas) */
  const MINI = ['MC','AP','JM','ML','LT','PR','BN','RB','CF','TC','LD','BP'];
  const mini = () => {
    const box = $('#plan-mini'); box.innerHTML = '';
    const r = box.getBoundingClientRect(); if (!r.width) return;
    const aw = r.width, ah = r.height, tw = Math.min(aw * .24, ah * .46), th = tw * .58, sw = tw * .36, sh = sw * .7;
    [[aw * .28, 0, 'Nuvex'], [aw * .72, 1, 'Prisma']].forEach(([x, t, nm]) => {
      const y = ah / 2, d = document.createElement('div'); d.className = 'tb' + (t ? '' : ' hi');
      Object.assign(d.style, { left: x - tw / 2 + 'px', top: y - th / 2 + 'px', width: tw + 'px', height: th + 'px' }); d.innerHTML = `<small>Mesa 0${t + 1}</small><b>${nm}</b>`; box.append(d);
      const oy = th / 2 + sh * .8, ox = tw / 2 + sw * .7;
      [[-tw*.24,-oy],[tw*.24,-oy],[ox,0],[tw*.24,oy],[-tw*.24,oy],[-ox,0]].forEach(([a, b], s) => {
        const c = document.createElement('div'), k = t * 6 + s; c.className = 'gc' + (k === 0 ? ' me' : '');
        Object.assign(c.style, { left: 0, top: 0, width: sw + 'px', height: sh + 'px', transform: `translate(${x + a - sw / 2}px,${y + b - sh / 2}px)` }); c.textContent = MINI[k]; box.append(c);
      });
    });
  };

  /* smooth scroll + FAQ */
  let scrollToken = 0;
  const smoothTo = id => {
    const token = ++scrollToken;
    const el = root.querySelector('#' + id); if (!el) return;
    const to = el.getBoundingClientRect().top + window.scrollY - 80, from = window.scrollY, d = to - from;
    if (RM) { window.scrollTo(0, to); return; }
    const dur = 280; let s;
    const f = n => { if (token !== scrollToken) return; s ??= n; const k = clamp((n - s) / dur), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; window.scrollTo(0, from + d * e); if (k < 1) raf(f); };
    raf(f);
  };
  on(window, 'wheel', () => { scrollToken++; }, { passive: true });
  on(window, 'touchstart', () => { scrollToken++; }, { passive: true });
  on(root, 'click', e => {
    const b = e.target.closest('[data-scroll]'); if (b) { e.preventDefault(); smoothTo(b.dataset.scroll); }
    const q = e.target.closest('.fq button');
    if (q) { const f = q.parentElement, open = !f.classList.contains('open'); $$('.fq').forEach(x => { x.classList.remove('open'); x.querySelector('button').setAttribute('aria-expanded', 'false'); }); f.classList.toggle('open', open); q.setAttribute('aria-expanded', open); }
  });

  /* rodadas de negócio */
  const area = $('#rd-area'), status = $('#rd-status');
  const tEls = HOSTS.map((h, i) => { const d = document.createElement('div'); d.className = 'tb'; d.innerHTML = `<small>Mesa ${i + 1}</small><b>${h}</b>`; area.append(d); return d; });
  const gEls = NAMES.map((n, g) => { const d = document.createElement('div'); d.className = 'gc' + (g === ME ? ' me' : ''); d.textContent = ini(n); d.title = n; area.append(d); return d; });
  const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'rd-route'); area.append(svg);
  const itBox = $('#rd-it'); itBox.innerHTML = '';
  const itEls = [...Array(ROUNDS)].map((_, r) => {
    const t = tableOf(ME, r), w = atTable(t, r).filter(g => g !== ME).map(g => NAMES[g].split(' ')[0]);
    const d = document.createElement('div'); d.innerHTML = `<span class="mono">R${r + 1}</span><span><b>Mesa ${t + 1} · ${HOSTS[t]}</b><small>com ${w.slice(0, 3).join(', ')} e +${w.length - 3}</small></span>`;
    itBox.append(d); return d;
  });
  const roundBtns = $$('.rd-rounds button'), elRound = $('#rd-round'), elMeet = $('#rd-meet'), pdf = $('.rd-who .pdf');
  let L = null, round = -1;
  const layout = () => {
    const r = area.getBoundingClientRect(), aw = r.width, ah = r.height;
    const rows = aw >= 520 ? [4, 3] : [2, 2, 2, 1], maxC = Math.max(...rows), colW = aw / maxC, rowH = ah / rows.length;
    const tw = Math.min(colW * .52, rowH * .78), th = tw * .56, sw = Math.max(20, tw * .34), sh = sw * .72;
    const tables = []; rows.forEach((n, ri) => { for (let c = 0; c < n; c++) tables.push({ x: (c + .5 + (maxC - n) / 2) * colW, y: (ri + .5) * rowH }); });
    const oy = th / 2 + sh * .8, ox = tw / 2 + sw * .68;
    const off = [[-tw*.24,-oy],[tw*.24,-oy],[ox,0],[tw*.24,oy],[-tw*.24,oy],[-ox,0]];
    tables.forEach((t, i) => { t.seats = off.map(([a, b]) => ({ x: t.x + a, y: t.y + b })); Object.assign(tEls[i].style, { left: t.x - tw / 2 + 'px', top: t.y - th / 2 + 'px', width: tw + 'px', height: th + 'px' }); });
    gEls.forEach(e => Object.assign(e.style, { width: sw + 'px', height: sh + 'px', fontSize: Math.max(8, sw * .3) + 'px' }));
    const pc = aw >= 520 ? 14 : 7, bw = sw * 1.3, bh = sh * 1.5, prow = Math.ceil(42 / pc);
    const pool = NAMES.map((_, g) => ({ x: aw / 2 + ((g % pc) - (pc - 1) / 2) * bw, y: ah / 2 + (Math.floor(g / pc) - (prow - 1) / 2) * bh + 28 }));
    L = { tables, pool, sw, sh };
  };
  const posOf = (g, r) => r < 0 ? L.pool[g] : L.tables[tableOf(g, r)].seats[g % 6];
  const countTo = (el, to) => {
    el._tok = (el._tok || 0) + 1;
    const token = el._tok;
    const from = +el.dataset.v || 0; el.dataset.v = to;
    if (RM || from === to) { el.textContent = to.toLocaleString('pt-BR'); return; }
    const s = performance.now();
    const f = n => { if (token !== el._tok) return; const t = Math.min(1, (n - s) / 900); el.textContent = Math.round(from + (to - from) * eo(t)).toLocaleString('pt-BR'); if (t < 1) raf(f); };
    raf(f);
  };
  const drawRoute = (r, instant) => {
    svg.innerHTML = '';
    for (let k = 1; k <= r; k++) {
      const a = posOf(ME, k - 1), b = posOf(ME, k), len = Math.hypot(b.x - a.x, b.y - a.y);
      const l = document.createElementNS(NS, 'line');
      l.setAttribute('x1', a.x); l.setAttribute('y1', a.y); l.setAttribute('x2', b.x); l.setAttribute('y2', b.y);
      l.style.strokeDasharray = `${len}`; l.style.strokeDashoffset = (k === r && !instant) ? len : 0; l.style.opacity = k === r ? 1 : .35;
      svg.append(l);
      if (k === r && !instant) raf(() => raf(() => { l.style.strokeDashoffset = 0; }));
    }
  };
  const render = (r, instant) => {
    round = r;
    gEls.forEach((e, g) => {
      const p = posOf(g, r);
      e.style.transitionDelay = instant ? '0s' : (g % 6) * 45 + Math.floor(g / 6) * 18 + 'ms';
      if (instant) e.style.transition = 'none';
      e.style.transform = `translate(${p.x - L.sw / 2}px,${p.y - L.sh / 2}px)`;
      e.style.opacity = r < 0 ? .7 : 1;
      if (instant) { void e.offsetWidth; e.style.transition = ''; }
    });
    const mt = r < 0 ? -1 : tableOf(ME, r), mates = r < 0 ? [] : atTable(mt, r);
    gEls.forEach((e, g) => e.classList.toggle('meet', g !== ME && mates.includes(g)));
    tEls.forEach((t, i) => { t.classList.toggle('show', r >= 0); t.classList.toggle('hi', i === mt); });
    status.style.opacity = r < 0 ? 1 : 0;
    roundBtns.forEach((b, i) => b.classList.toggle('on', i === r));
    itEls.forEach((d, i) => { d.classList.toggle('done', i <= r); d.classList.toggle('now', i === r); });
    pdf.classList.toggle('on', r === ROUNDS - 1);
    elRound.textContent = r < 0 ? '—' : `${r + 1} de ${ROUNDS}`;
    countTo(elMeet, r < 0 ? 0 : (r + 1) * 105);
    drawRoute(r, instant);
  };
  let timer = null, playing = !RM, rdVisible = false;
  const playBtn = $('#rd-play');
  const setPlayIcon = () => {
    playBtn.innerHTML = playing ? '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"></rect><rect x="14" y="5" width="4" height="14" rx="1"></rect></svg>' : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"></path></svg>';
    playBtn.setAttribute('aria-label', playing ? 'Pausar' : 'Reproduzir');
  };
  const schedule = () => {
    clearTimeout(timer);
    if (!playing || !rdVisible) return;
    const wait = round < 0 ? 1600 : round === ROUNDS - 1 ? 3600 : 2700;
    timer = setTimeout(() => { render(round === ROUNDS - 1 ? -1 : round + 1); schedule(); }, wait);
  };
  on(playBtn, 'click', () => { playing = !playing; setPlayIcon(); schedule(); });
  on($('#rd-restart'), 'click', () => { playing = true; setPlayIcon(); render(-1); schedule(); });
  roundBtns.forEach((b, i) => on(b, 'click', () => { playing = false; setPlayIcon(); clearTimeout(timer); render(i); }));
  const rio = new IntersectionObserver(([e]) => { rdVisible = e.isIntersecting; if (rdVisible) schedule(); else clearTimeout(timer); }, { threshold: .35 });
  rio.observe(area); observers.push(rio);
  setPlayIcon();

  on(window, 'resize', () => { mini(); layout(); render(round, true); });
  raf(() => { mini(); layout(); render(RM ? 0 : -1, true); });

  const heroCleanup = initHeroApp(root);

  return () => {
    heroCleanup();
    alive = false;
    clearTimeout(timer);
    rafs.forEach(id => cancelAnimationFrame(id)); rafs.clear();
    observers.forEach(o => o.disconnect());
    cleanups.forEach(fn => fn());
    area.querySelectorAll('.tb,.gc,.rd-route').forEach(el => el.remove());
  };
}
