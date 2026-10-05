// @ts-nocheck -- landing visual usa propriedades CSS customizadas em estilos inline.
import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Armchair, ArrowRight, Briefcase, CalendarDays, Check, ClipboardCheck, FileText, Handshake, LayoutDashboard, ListChecks, Minus, Network, Shuffle, Truck, Users, Wallet, X } from 'lucide-react';
import './landing/landing.css';
import { initLanding } from './landing/landingEffects';

export default function LandingPage() {
  const rootRef = useRef(null);
  useEffect(() => initLanding(rootRef.current), []);
  return (
    <div className="mc-landing" ref={rootRef}>
<header className="nav"><div className="wrap">
<a href="#top" className="logo" data-scroll="top"><b><span></span><span></span><span></span><span></span></b>Mesa Certa</a>
<nav className="nav-l"><button data-scroll="rodadas">Rodadas de negócio</button><button data-scroll="para-quem">Para quem</button><button data-scroll="modulos">Módulos</button><button data-scroll="como">Como funciona</button><button data-scroll="planos">Planos</button><button data-scroll="duvidas">Dúvidas</button></nav>
<div className="nav-r"><Link className="lnk" to="/login">Entrar</Link><a className="btn btn-p btn-s" href="#planos" data-scroll="planos">Começar agora</a></div>
</div></header>

<section className="hero" id="top" data-screen-label="01 Hero"><div className="wrap">
<div className="hero-t">
<span className="eyebrow" data-reveal>Sistema de gestão de eventos</span>
<h1 data-reveal style={{ '--d': '1' }}>Seu evento inteiro, <em>num lugar só.</em></h1>
<p className="lead" data-reveal style={{ '--d': '2' }}>Financeiro, participantes, fornecedores, tarefas, programação e as mesas das rodadas de negócio. Sem planilha solta, sem grupo de WhatsApp.</p>
<div className="cta-row" data-reveal style={{ '--d': '3' }}><a className="btn btn-p" href="#planos" data-scroll="planos">Começar agora<ArrowRight aria-hidden="true" /></a><button className="btn" data-scroll="rodadas">Ver as rodadas em ação</button></div>
<div className="trust" data-reveal style={{ '--d': '4' }}><span><Check aria-hidden="true" />Funciona no navegador</span><span><Check aria-hidden="true" />Vários eventos ao mesmo tempo</span><span><Check aria-hidden="true" />Feito para quem produz evento</span></div>
</div>
<div style={{ display: 'flex', justifyContent: 'center' }}><span className="try" data-reveal style={{ '--d': '5' }}><i></i>Experimente: clique no menu e nos cards do painel</span></div>
<div className="shot-w"><div className="shot">
<div className="frame">
<div className="fr-bar"><span className="dots"><i></i><i></i><i></i></span><span className="url">app.mesacerta.com.br/seu-evento</span><span style={{ width: '46px' }}></span></div>
<div className="app">
<aside className="side">
<div className="ev"><b>Encontro de Negócios</b><small>18 nov · 120 inscritos</small></div>
<span className="it on"><LayoutDashboard aria-hidden="true" />Visão geral</span>
<span className="g">Planejamento</span>
<span className="it"><CalendarDays aria-hidden="true" />Programação</span>
<span className="it"><ListChecks aria-hidden="true" />Tarefas</span>
<span className="it"><Users aria-hidden="true" />Participantes</span>
<span className="it"><Truck aria-hidden="true" />Fornecedores</span>
<span className="g">Financeiro</span>
<span className="it"><Wallet aria-hidden="true" />Financeiro</span>
<span className="g">Operação</span>
<span className="it"><Network aria-hidden="true" />Networking</span>
</aside>
<div className="main">
<div className="mh"><div><small>Boa tarde. Veja como está o seu evento.</small><h4>Encontro de Negócios</h4></div><div className="days"><b data-count="47">0</b><small className="mut">dias para o evento</small></div></div>
<div className="kpis">
<div className="kpi"><small>Faturamento previsto</small><b data-count="74800" data-pre="R$ ">R$ 0</b><span className="d">62% recebido</span></div>
<div className="kpi"><small>Despesas previstas</small><b data-count="43200" data-pre="R$ ">R$ 0</b><span className="d" style={{ color: 'var(--mut)' }}>R$ 11.500 a pagar</span></div>
<div className="kpi"><small>Resultado previsto</small><b data-count="31600" data-pre="R$ ">R$ 0</b><span className="d">Margem de 42%</span></div>
<div className="kpi"><small>Confirmados</small><b data-count="98">0</b><span className="d" style={{ color: 'var(--mut)' }}>de 120 inscritos</span></div>
</div>
<div className="m2">
<div className="box"><h5>Entradas e saídas <span>próximas 8 semanas</span></h5><div className="bars"><div><i style={{ '--h': '30%', '--d': '0' }}></i><i className="x" style={{ '--h': '55%', '--d': '0' }}></i></div><div><i style={{ '--h': '45%', '--d': '1' }}></i><i className="x" style={{ '--h': '28%', '--d': '1' }}></i></div><div><i style={{ '--h': '68%', '--d': '2' }}></i><i className="x" style={{ '--h': '18%', '--d': '2' }}></i></div><div><i style={{ '--h': '50%', '--d': '3' }}></i><i className="x" style={{ '--h': '60%', '--d': '3' }}></i></div><div><i style={{ '--h': '80%', '--d': '4' }}></i><i className="x" style={{ '--h': '36%', '--d': '4' }}></i></div><div><i style={{ '--h': '100%', '--d': '5' }}></i><i className="x" style={{ '--h': '48%', '--d': '5' }}></i></div><div><i style={{ '--h': '82%', '--d': '6' }}></i><i className="x" style={{ '--h': '32%', '--d': '6' }}></i></div><div><i style={{ '--h': '62%', '--d': '7' }}></i><i className="x" style={{ '--h': '76%', '--d': '7' }}></i></div></div></div>
<div className="box"><h5>Precisa da sua atenção</h5>
<div className="al"><i className="cr"></i>Parcela do audiovisual vence sexta</div>
<div className="al"><i></i>22 inscritos sem confirmação</div>
<div className="al"><i></i>Programação passa 25 min do horário</div>
<div className="al"><i className="ok"></i>Mesas das 7 rodadas montadas</div></div>
</div>
</div>
</div>
</div>
</div></div>
</div>
<div className="strip" aria-hidden="true"><div className="strip-t"><span>Financeiro</span><span>Participantes</span><span>Fornecedores</span><span>Tarefas</span><span>Programação</span><span>Patrocínios</span><span>Rodadas de negócio</span><span>Roteiros</span><span>Financeiro</span><span>Participantes</span><span>Fornecedores</span><span>Tarefas</span><span>Programação</span><span>Patrocínios</span><span>Rodadas de negócio</span><span>Roteiros</span></div></div>
</section>

<section className="sec rd" id="rodadas" data-screen-label="02 Rodadas de negócio"><div className="wrap">
<div className="sec-head c"><span className="eyebrow" data-reveal>O nosso diferencial</span><h2 data-reveal style={{ '--d': '1' }}>Rodadas de negócio montadas sozinhas.</h2><p data-reveal style={{ '--d': '2' }}>Você importa os convidados. O Mesa Certa distribui as mesas, troca as pessoas a cada rodada sem repetir nenhum encontro e entrega o roteiro de cada um.</p></div>
<div className="rd-grid">
<div className="rd-stage" data-reveal>
<div className="rd-top"><div className="rd-rounds" role="group" aria-label="Rodadas"><button>R1</button><button>R2</button><button>R3</button><button>R4</button><button>R5</button></div><div className="rd-ctrl"><button id="rd-restart" aria-label="Recomeçar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"></path><path d="M3 3v5h5"></path></svg></button><button id="rd-play"></button></div></div>
<div className="rd-status" id="rd-status">42 convidados importados</div>
<div className="rd-area" id="rd-area"></div>
<div className="rd-stats"><div><b id="rd-round">—</b><small>rodada</small></div><div><b id="rd-meet">0</b><small>encontros únicos</small></div><div><b>0</b><small>encontros repetidos</small></div></div>
</div>
<div className="rd-side">
<div className="rd-card" data-reveal style={{ '--d': '1' }}><div className="rd-who"><span className="av">MC</span><div><b>Marina Costa</b><small>Roteiro individual</small></div><span className="pdf">PDF pronto</span></div><div className="rd-it" id="rd-it"></div></div>
<ul className="rd-pts" data-reveal style={{ '--d': '2' }}><li><Shuffle aria-hidden="true" /><span><b>Sem repetição.</b> Cada pessoa conhece gente nova em todas as rodadas.</span></li><li><Armchair aria-hidden="true" /><span><b>Anfitriões fixos.</b> Patrocinadores ficam na sua mesa e recebem os convidados.</span></li><li><FileText aria-hidden="true" /><span><b>Roteiro pronto.</b> Cada convidado recebe para onde ir em cada rodada.</span></li></ul>
</div>
</div>
</div></section>

<section className="sec" id="para-quem" data-screen-label="02 Para quem"><div className="wrap">
<div className="sec-head"><span className="eyebrow" data-reveal>Para quem é</span><h2 data-reveal style={{ '--d': '1' }}>Para quem produz evento e responde pelo resultado.</h2></div>
<div className="cards3">
<div className="c3" data-reveal><span className="n"><Briefcase aria-hidden="true" /></span><h3>Produtoras</h3><p>Vários eventos ao mesmo tempo, cada um com seus números, equipe e pendências separados.</p></div>
<div className="c3" data-reveal style={{ '--d': '1' }}><span className="n"><ClipboardCheck aria-hidden="true" /></span><h3>Organizadores</h3><p>Uma tela com o que precisa de decisão hoje, no lugar de cinco planilhas e três grupos.</p></div>
<div className="c3" data-reveal style={{ '--d': '2' }}><span className="n"><Handshake aria-hidden="true" /></span><h3>Eventos de networking</h3><p>Mesas por empresa, anfitriões e rodadas que entregam ao patrocinador os encontros prometidos.</p></div>
</div>
</div></section>

<section className="sec" id="modulos" style={{ background: 'var(--bg2)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }} data-screen-label="03 Módulos"><div className="wrap">
<div className="sec-head"><span className="eyebrow" data-reveal>Módulos</span><h2 data-reveal style={{ '--d': '1' }}>Cada parte do evento tem o seu lugar.</h2></div>
<div className="mods">
<div className="tabs" role="tablist">
<button className="tab" role="tab"><h3><Wallet aria-hidden="true" />Financeiro</h3><p><span>Receitas, despesas, patrocínios e meta. Você sabe o resultado antes do evento acabar.</span></p><span className="bar"><i></i></span></button>
<button className="tab" role="tab"><h3><Users aria-hidden="true" />Participantes</h3><p><span>Importe a planilha, remova duplicados e acompanhe cada confirmação.</span></p><span className="bar"><i></i></span></button>
<button className="tab" role="tab"><h3><Truck aria-hidden="true" />Fornecedores</h3><p><span>Contrato, valor, parcelas e vencimentos de cada fornecedor num só lugar.</span></p><span className="bar"><i></i></span></button>
<button className="tab" role="tab"><h3><CalendarDays aria-hidden="true" />Programação e tarefas</h3><p><span>A grade do dia e o checklist da equipe, com aviso do que vai atrasar.</span></p><span className="bar"><i></i></span></button>
<button className="tab" role="tab"><h3><Network aria-hidden="true" />Rodadas de negócio</h3><p><span>Mesas montadas sem repetir encontro e o roteiro de cada convidado pronto.</span></p><span className="bar"><i></i></span></button>
</div>
<div className="stage" data-reveal><div className="frame">
<div className="fr-bar"><span className="dots"><i></i><i></i><i></i></span><span className="url" id="mod-url">app.mesacerta.com.br/seu-evento/financeiro</span><span style={{ width: '46px' }}></span></div>
<div className="pnw">
<div className="pn"><div className="pn-h"><b>Resultado previsto</b><span className="pill pos">Margem 42%</span></div><div className="big" data-count="31600" data-pre="R$ ">R$ 31.600</div>
<div className="bars" style={{ height: '110px' }}><div><i style={{ '--h': '40%', '--d': '0' }}></i><i className="x" style={{ '--h': '62%', '--d': '0' }}></i></div><div><i style={{ '--h': '55%', '--d': '1' }}></i><i className="x" style={{ '--h': '30%', '--d': '1' }}></i></div><div><i style={{ '--h': '72%', '--d': '2' }}></i><i className="x" style={{ '--h': '48%', '--d': '2' }}></i></div><div><i style={{ '--h': '60%', '--d': '3' }}></i><i className="x" style={{ '--h': '70%', '--d': '3' }}></i></div><div><i style={{ '--h': '88%', '--d': '4' }}></i><i className="x" style={{ '--h': '52%', '--d': '4' }}></i></div><div><i style={{ '--h': '100%', '--d': '5' }}></i><i className="x" style={{ '--h': '80%', '--d': '5' }}></i></div></div>
<div className="rows"><div><span>Faturamento previsto</span><b>R$ 74.800</b></div><div><span>Despesas previstas</span><b>R$ 43.200</b></div></div></div>
<div className="pn"><div className="pn-h"><b>Participantes</b><span className="pill">Capacidade 140</span></div>
<div className="k3"><div><b data-count="120">120</b><small>inscritos</small></div><div><b data-count="98">98</b><small>confirmados</small></div><div><b data-count="22">22</b><small>pendentes</small></div></div>
<div className="rows"><div><span style={{ color: 'var(--ink)' }}><span className="av">AP</span>Ana Prado</span><span className="pill pos">Confirmado</span></div><div><span style={{ color: 'var(--ink)' }}><span className="av">JM</span>João Moreira</span><span className="pill pos">Confirmado</span></div><div><span style={{ color: 'var(--ink)' }}><span className="av">ML</span>Maria Lima</span><span className="pill warn">Aguardando</span></div><div><span style={{ color: 'var(--ink)' }}><span className="av">LT</span>Lucas Teixeira</span><span className="pill">Cortesia</span></div></div></div>
<div className="pn"><div className="pn-h"><b>Fornecedores</b><span className="pill warn">1 vence esta semana</span></div>
<div className="rows"><div><span style={{ color: 'var(--ink)' }}>Buffet</span><b>R$ 13.500</b><span className="pill">Parcial</span></div><div><span style={{ color: 'var(--ink)' }}>Audiovisual</span><b>R$ 7.500</b><span className="pill warn">Vence sexta</span></div><div><span style={{ color: 'var(--ink)' }}>Espaço</span><b>R$ 11.000</b><span className="pill pos">Quitado</span></div><div><span style={{ color: 'var(--ink)' }}>Equipe de apoio</span><b>R$ 3.200</b><span className="pill pos">Quitado</span></div></div>
<div className="rows"><div><span>Total a pagar</span><b data-count="11500" data-pre="R$ ">R$ 11.500</b></div></div></div>
<div className="pn"><div className="pn-h"><b>Programação do dia</b><span className="pill warn">+25 min</span></div>
<div className="rows"><div><span className="mono">08:00</span><span style={{ flex: '1' }}>Credenciamento</span><span className="pill pos">Concluído</span></div><div><span className="mono">09:10</span><span style={{ flex: '1' }}>Rodadas de negócio</span><span className="pill warn">Agora</span></div><div><span className="mono">12:10</span><span style={{ flex: '1' }}>Almoço</span><span className="pill">Próximo</span></div><div><span className="mono">14:00</span><span style={{ flex: '1' }}>Painel principal</span><span className="pill">Programado</span></div></div>
<div><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', marginBottom: '8px' }}><span className="mut">Tarefas concluídas</span><b>23 de 31</b></div><div className="prog"><i style={{ '--w': '74%' }}></i></div></div></div>
<div className="pn"><div className="pn-h"><b>Rodada 1 de 7</b><span className="pill pos">Nenhum encontro repetido</span></div>
<div className="plan-mini" id="plan-mini"></div>
<div className="rows"><div><span>Roteiro de Marina Costa</span><b>Mesa 1 → 5 → 2</b></div></div></div>
</div></div></div>
</div>
</div></section>

<section className="sec" id="como" data-screen-label="04 Como funciona"><div className="wrap">
<div className="sec-head"><span className="eyebrow" data-reveal>Como funciona</span><h2 data-reveal style={{ '--d': '1' }}>Três passos para sair da planilha.</h2></div>
<div className="steps">
<div className="step"><span className="mono">01</span><h3>Crie o evento</h3><p>Nome, data, público e formato. Ligue só os módulos de que precisa.</p></div>
<div className="step" style={{ '--d': '1' }}><span className="mono">02</span><h3>Traga a operação</h3><p>Importe participantes e cadastre fornecedores, tarefas e receitas.</p></div>
<div className="step" style={{ '--d': '2' }}><span className="mono">03</span><h3>Acompanhe e decida</h3><p>A visão geral mostra o resultado e o que precisa de você hoje.</p></div>
</div>
</div></section>

<section className="sec" style={{ paddingTop: '0' }} data-screen-label="05 Comparativo"><div className="wrap">
<div className="sec-head"><span className="eyebrow" data-reveal>Por que Mesa Certa</span><h2 data-reveal style={{ '--d': '1' }}>Planilha e WhatsApp não foram feitos para evento.</h2></div>
<div className="cmp" data-reveal><table>
<thead><tr><th>O que a sua operação precisa</th><th>Planilha</th><th>WhatsApp</th><th>Mesa Certa</th></tr></thead>
<tbody>
<tr><td>Tudo do evento no mesmo lugar</td><td><span className="n"><Minus aria-hidden="true" />Vários arquivos</span></td><td><span className="n"><Minus aria-hidden="true" />Se perde</span></td><td><span className="y"><Check aria-hidden="true" />Sim</span></td></tr>
<tr><td>Resultado financeiro do evento</td><td><span className="n"><Minus aria-hidden="true" />Manual</span></td><td><span className="n"><X aria-hidden="true" />Não</span></td><td><span className="y"><Check aria-hidden="true" />Automático</span></td></tr>
<tr><td>Aviso de vencimento e atraso</td><td><span className="n"><X aria-hidden="true" />Não</span></td><td><span className="n"><X aria-hidden="true" />Não</span></td><td><span className="y"><Check aria-hidden="true" />Sim</span></td></tr>
<tr><td>Mesas sem repetir encontro</td><td><span className="n"><Minus aria-hidden="true" />Na mão</span></td><td><span className="n"><X aria-hidden="true" />Não</span></td><td><span className="y"><Check aria-hidden="true" />Automático</span></td></tr>
<tr><td>Roteiro individual do convidado</td><td><span className="n"><X aria-hidden="true" />Não</span></td><td><span className="n"><X aria-hidden="true" />Não</span></td><td><span className="y"><Check aria-hidden="true" />PDF pronto</span></td></tr>
</tbody></table></div>
</div></section>

<section className="sec" id="planos" style={{ background: 'var(--bg2)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }} data-screen-label="06 Planos"><div className="wrap">
<div className="sec-head c"><span className="eyebrow" data-reveal>Planos</span><h2 data-reveal style={{ '--d': '1' }}>Todos os módulos. Escolha como pagar.</h2></div>
<div className="plans">
<div className="plan" data-reveal><h3>Mensal</h3><div className="pr">R$ 97<small> /mês</small></div><p className="mut">Para começar sem compromisso.</p><ul><li><Check aria-hidden="true" />Até 3 eventos ativos</li><li><Check aria-hidden="true" />1 responsável</li><li><Check aria-hidden="true" />Todos os módulos</li></ul><Link className="btn" to="/register">Assinar mensal</Link></div>
<div className="plan hl" data-reveal style={{ '--d': '1' }}><span className="tag">Economize R$ 367</span><h3>Anual</h3><div className="pr">R$ 797<small> /ano</small></div><p className="mut">Pagamento único, sem renovação automática.</p><ul><li><Check aria-hidden="true" />Até 3 eventos ativos</li><li><Check aria-hidden="true" />1 responsável</li><li><Check aria-hidden="true" />Todos os módulos</li></ul><Link className="btn btn-p" to="/register">Assinar anual</Link></div>
</div>
</div></section>

<section className="sec" id="duvidas" data-screen-label="07 Dúvidas"><div className="wrap">
<div className="sec-head c"><span className="eyebrow" data-reveal>Dúvidas</span><h2 data-reveal style={{ '--d': '1' }}>Perguntas frequentes</h2></div>
<div className="faq" data-reveal>
<div className="fq open"><button aria-expanded="true">Minha planilha já funciona. Por que mudar?<i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"></path></svg></i></button><div className="fq-a"><div><p>Se ela resolve tudo, talvez você não precise. O Mesa Certa faz sentido quando financeiro, participantes, fornecedores e tarefas começam a viver em lugares diferentes.</p></div></div></div>
<div className="fq"><button aria-expanded="false">Serve para evento sem networking?<i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"></path></svg></i></button><div className="fq-a"><div><p>Sim. As rodadas de negócio são um módulo opcional. O núcleo é planejamento e operação, com o financeiro separado por evento.</p></div></div></div>
<div className="fq"><button aria-expanded="false">Posso cuidar de vários eventos ao mesmo tempo?<i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"></path></svg></i></button><div className="fq-a"><div><p>Sim. Cada evento tem seus próprios dados, números e pendências. Os planos incluem até três eventos ativos.</p></div></div></div>
<div className="fq"><button aria-expanded="false">Preciso instalar alguma coisa?<i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"></path></svg></i></button><div className="fq-a"><div><p>Não. O Mesa Certa funciona direto no navegador, no computador ou no celular.</p></div></div></div>
<div className="fq"><button aria-expanded="false">O Mesa Certa vende ingressos?<i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"></path></svg></i></button><div className="fq-a"><div><p>Não nesta versão. Você registra lotes e receitas para acompanhar o resultado; a venda continua na plataforma que você já usa.</p></div></div></div>
</div>
</div></section>

<section className="cta" data-screen-label="08 CTA">
<h2 data-reveal>Pronto para sair do improviso?</h2>
<p data-reveal style={{ '--d': '1' }}>Abra o próximo evento no Mesa Certa e tenha tudo num lugar só.</p>
<div className="cta-row" data-reveal style={{ '--d': '2' }}><Link className="btn" to="/register">Criar minha conta<ArrowRight aria-hidden="true" /></Link><button className="btn gh" data-scroll="duvidas">Tirar uma dúvida</button></div>
<small>Criar conta não inicia cobrança.</small>
</section>
<footer className="foot"><div className="wrap"><a href="#top" className="logo" data-scroll="top"><b><span></span><span></span><span></span><span></span></b>Mesa Certa</a><nav><button data-scroll="modulos">Módulos</button><button data-scroll="planos">Planos</button><button data-scroll="duvidas">Dúvidas</button><Link to="/login">Entrar</Link></nav><span>© 2026 Mesa Certa</span></div></footer>
    </div>
  );
}
