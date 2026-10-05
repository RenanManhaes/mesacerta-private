// @ts-nocheck -- demonstração visual manipula elementos DOM e dados locais heterogêneos.
// Painel interativo do topo.
export function initHeroApp(root) {
  const $ = s => root.querySelector(s), $$ = s => [...root.querySelectorAll(s)];
  const main = $('.shot .main'), url = $('.shot .url'), items = $$('.shot .side .it');
  if (!main) return () => {};
  const SLUG = ['', 'programacao', 'tarefas', 'participantes', 'fornecedores', 'financeiro', 'networking'];
  const brl = v => 'R$ ' + Math.round(v).toLocaleString('pt-BR');
  const escapeAttribute = value => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const ini = n => n.split(' ').map(w => w[0]).slice(0, 2).join('');
  const offs = [];
  const on = (t, e, f) => { t.addEventListener(e, f); offs.push(() => t.removeEventListener(e, f)); };

  const S = {
    tasks: [['Fechar contrato do buffet', 'Ana', 1], ['Enviar lembrete aos pendentes', 'Pedro', 0], ['Definir anfitriões das mesas', 'Marina', 0], ['Aprovar arte dos crachás', 'Lucas', 1], ['Confirmar equipe de apoio', 'Ana', 1], ['Testar som e projeção', 'João', 0]],
    people: [['Ana Prado', 'Nuvex', 'Confirmado'], ['João Moreira', 'Meridiano', 'Confirmado'], ['Maria Lima', 'Andrade', 'Pendente'], ['Lucas Teixeira', 'Prisma', 'Confirmado'], ['Beatriz Nunes', 'Vértice', 'Pendente'], ['Rafael Barros', 'Lumen', 'Confirmado'], ['Camila Faria', 'Montanha', 'Confirmado'], ['Thiago Campos', 'Nuvex', 'Pendente']],
    sup: [['Buffet', 13500, 9000], ['Audiovisual', 7500, 3750], ['Espaço', 11000, 11000], ['Equipe de apoio', 3200, 3200], ['Brindes', 8000, 4750]],
    prog: [['08:00', 'Credenciamento', 'Recepção', 1], ['09:10', 'Rodadas de negócio', 'Salão principal', 1], ['12:10', 'Almoço', 'Restaurante', 0], ['14:00', 'Painel principal', 'Auditório', 0], ['16:00', 'Coffee break', 'Foyer', 0], ['17:30', 'Encerramento', 'Auditório', 0]],
    q: '', pf: 'Todos', fin: 'prev', round: 0
  };
  const home = main.innerHTML;

  const V = {};
  V[0] = () => home;
  V[1] = () => `<div class="ha-h"><div><small>Programação</small><h4>Dia do evento</h4></div><span class="pill warn">Clique para marcar como concluído</span></div>
<div class="rows ha-list">${S.prog.map((p, i) => `<button class="ha-row" data-i="${i}"><span class="mono">${p[0]}</span><span class="ha-g"><b>${p[1]}</b><small>${p[2]}</small></span><span class="pill ${p[3] ? 'pos' : ''}">${p[3] ? 'Concluído' : 'Programado'}</span></button>`).join('')}</div>`;
  V[2] = () => { const d = S.tasks.filter(t => t[2]).length, n = S.tasks.length;
    return `<div class="ha-h"><div><small>Tarefas</small><h4>${d} de ${n} concluídas</h4></div><span class="pill ${d === n ? 'pos' : ''}">${Math.round(d / n * 100)}%</span></div>
<div class="prog ha-prog"><i style="--w:${d / n * 100}%"></i></div>
<div class="rows ha-list">${S.tasks.map((t, i) => `<button class="ha-row ha-task${t[2] ? ' done' : ''}" data-i="${i}"><span class="ha-cb"></span><span class="ha-g"><b>${t[0]}</b><small>${t[1]}</small></span></button>`).join('')}</div>`; };
  V[3] = () => { const q = S.q.toLowerCase(), list = S.people.filter(p => (S.pf === 'Todos' || p[2] === S.pf) && (p[0] + p[1]).toLowerCase().includes(q));
    return `<div class="ha-h"><div><small>Participantes</small><h4>98 confirmados de 120</h4></div></div>
<div class="ha-tools"><label class="ha-srch"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path></svg><input placeholder="Buscar participante" value="${escapeAttribute(S.q)}"></label><div class="ha-seg">${['Todos', 'Confirmado', 'Pendente'].map(f => `<button data-f="${f}" class="${S.pf === f ? 'on' : ''}">${f === 'Todos' ? f : f + 's'}</button>`).join('')}</div></div>
<div class="rows ha-list ha-people">${list.map(p => `<div><span style="color:var(--ink);display:flex;align-items:center"><span class="av">${ini(p[0])}</span>${p[0]}<span class="mut" style="margin-left:6px">· ${p[1]}</span></span><span class="pill ${p[2] === 'Confirmado' ? 'pos' : 'warn'}">${p[2]}</span></div>`).join('') || '<div><span>Ninguém encontrado.</span></div>'}</div>`; };
  V[4] = () => { const due = S.sup.reduce((a, s) => a + s[1] - s[2], 0);
    return `<div class="ha-h"><div><small>Fornecedores</small><h4>${brl(due)} a pagar</h4></div><span class="pill ${due ? 'warn' : 'pos'}">${due ? S.sup.filter(s => s[1] > s[2]).length + ' em aberto' : 'Tudo quitado'}</span></div>
<div class="rows ha-list">${S.sup.map((s, i) => `<div><span class="ha-g" style="color:var(--ink)"><b>${s[0]}</b><small>${brl(s[2])} de ${brl(s[1])}</small></span>${s[1] > s[2] ? `<button class="ha-pay" data-i="${i}">Marcar pago</button>` : '<span class="pill pos">Quitado</span>'}</div>`).join('')}</div>`; };
  V[5] = () => { const r = S.fin === 'prev', inc = r ? [['Ingressos', 42000], ['Patrocínios', 28000], ['Expositores', 4800]] : [['Ingressos', 26400], ['Patrocínios', 18000], ['Expositores', 1950]], exp = r ? 43200 : 31700, ti = inc.reduce((a, x) => a + x[1], 0);
    return `<div class="ha-h"><div><small>Financeiro</small><h4>Resultado ${r ? 'previsto' : 'realizado'}</h4></div><div class="ha-seg"><button data-fin="prev" class="${r ? 'on' : ''}">Previsto</button><button data-fin="real" class="${r ? '' : 'on'}">Realizado</button></div></div>
<div class="kpis" style="grid-template-columns:repeat(3,minmax(0,1fr))"><div class="kpi"><small>Receitas</small><b>${brl(ti)}</b></div><div class="kpi"><small>Despesas</small><b>${brl(exp)}</b></div><div class="kpi"><small>Resultado</small><b style="color:var(--acc)">${brl(ti - exp)}</b><span class="d">Margem de ${Math.round((ti - exp) / ti * 100)}%</span></div></div>
<div class="box"><h5>Receitas por origem</h5>${inc.map(x => `<div class="ha-bar"><span>${x[0]}</span><i><b style="width:${x[1] / 42000 * 100}%"></b></i><span class="mono">${brl(x[1])}</span></div>`).join('')}</div>`; };
  const NM = ['Ana Prado','João Moreira','Maria Lima','Lucas Teixeira','Pedro Rocha','Beatriz Nunes','Rafael Barros','Camila Faria','Thiago Campos','Marina Costa','Larissa Duarte','Bruno Pires','Juliana Mendes','Diego Ramos','Fernanda Lopes','Gustavo Reis','Patrícia Alves','Felipe Souza'];
  const HO = ['Nuvex', 'Meridiano', 'Prisma'];
  V[6] = () => { const r = S.round, tables = [0, 1, 2].map(t => NM.map((_, g) => g).filter(g => (Math.floor(g / 6) + r * (g % 6)) % 3 === t));
    return `<div class="ha-h"><div><small>Networking</small><h4>Rodada ${r + 1} de 5</h4></div><div class="ha-seg">${[0, 1, 2, 3, 4].map(k => `<button data-r="${k}" class="${k === r ? 'on' : ''}">R${k + 1}</button>`).join('')}</div></div>
<div class="ha-tables">${tables.map((m, t) => `<div class="box ha-tb${m.includes(9) ? ' hi' : ''}"><h5>Mesa ${t + 1} <span>${HO[t]}</span></h5><div class="ha-seats">${m.map(g => `<span class="av${g === 9 ? ' me' : ''}" title="${NM[g]}">${ini(NM[g])}</span>`).join('')}</div></div>`).join('')}</div>
<div class="rows"><div><span>Marina Costa está na</span><b>Mesa ${tables.findIndex(m => m.includes(9)) + 1}</b></div></div>`; };

  let cur = 0;
  function go(i, keepScroll) {
    cur = i;
    items.forEach((it, k) => { it.classList.toggle('on', k === i); it.setAttribute('aria-pressed', String(k === i)); });
    url.textContent = 'app.mesacerta.com.br/seu-evento' + (SLUG[i] ? '/' + SLUG[i] : '');
    main.innerHTML = V[i]();
    if (i === 0) { main.querySelectorAll('[data-count]').forEach(el => (el.textContent = (el.dataset.pre || '') + (+el.dataset.count).toLocaleString('pt-BR'))); wireHome(); }
    if (!keepScroll) { main.classList.remove('ha-in'); void main.offsetWidth; main.classList.add('ha-in'); }
    const inp = main.querySelector('.ha-srch input');
    if (inp && keepScroll) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
  }
  const tip = document.createElement('div'); tip.className = 'ha-tip'; $('.shot .frame').append(tip);
  function wireHome() {
    const ALERT = [4, 3, 1, 6];
    main.querySelectorAll('.al').forEach((a, k) => { a.classList.add('ha-link'); a.dataset.go = ALERT[k]; });
    main.querySelectorAll('.kpi').forEach((k, i) => { k.classList.add('ha-link'); k.dataset.go = [5, 4, 5, 3][i]; });
    main.querySelectorAll('[data-go]').forEach(element => { element.setAttribute('role', 'button'); element.tabIndex = 0; });
    const IN = [3.7, 5.6, 8.4, 6.2, 9.9, 12.4, 10.2, 7.7], OUT = [6.8, 3.5, 2.2, 7.4, 4.5, 6, 4, 9.4];
    main.querySelectorAll('.bars>div').forEach((b, k) => { b.classList.add('ha-bargrp'); b.dataset.k = k; b.dataset.tip = `Semana ${k + 1} · Entradas R$ ${IN[k].toLocaleString('pt-BR')} mil · Saídas R$ ${OUT[k].toLocaleString('pt-BR')} mil`; });
  }
  items.forEach((it, i) => { it.setAttribute('role', 'button'); it.setAttribute('aria-pressed', String(i === 0)); it.tabIndex = 0; on(it, 'click', () => go(i)); on(it, 'keydown', e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), go(i))); });
  on(main, 'keydown', e => { const target = e.target.closest('[data-go]'); if (target && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); go(+target.dataset.go); } });
  on(main, 'click', e => {
    const t = e.target;
    const g = t.closest('[data-go]'); if (g) return go(+g.dataset.go);
    const row = t.closest('.ha-row');
    if (row && cur === 1) { S.prog[row.dataset.i][3] ^= 1; return go(1, true); }
    if (row && cur === 2) { S.tasks[row.dataset.i][2] ^= 1; return go(2, true); }
    const pay = t.closest('.ha-pay'); if (pay) { const s = S.sup[pay.dataset.i]; s[2] = s[1]; return go(4, true); }
    const f = t.closest('[data-f]'); if (f) { S.pf = f.dataset.f; return go(3, true); }
    const fin = t.closest('[data-fin]'); if (fin) { S.fin = fin.dataset.fin; return go(5, true); }
    const r = t.closest('[data-r]'); if (r) { S.round = +r.dataset.r; return go(6, true); }
  });
  on(main, 'input', e => { if (e.target.matches('.ha-srch input')) { S.q = e.target.value; go(3, true); } });
  on(main, 'mousemove', e => {
    const b = e.target.closest('.ha-bargrp');
    if (!b) { tip.classList.remove('on'); return; }
    const fr = $('.shot .frame').getBoundingClientRect(), br = b.getBoundingClientRect();
    tip.textContent = b.dataset.tip; tip.classList.add('on');
    tip.style.left = (br.left + br.width / 2 - fr.left) + 'px'; tip.style.top = (br.top - fr.top - 10) + 'px';
    main.querySelectorAll('.ha-bargrp').forEach(x => x.classList.toggle('dim', x !== b));
  });
  on(main, 'mouseleave', () => { tip.classList.remove('on'); main.querySelectorAll('.ha-bargrp').forEach(x => x.classList.remove('dim')); });
  wireHome();
  return () => { offs.forEach(f => f()); tip.remove(); main.innerHTML = home; };
}
