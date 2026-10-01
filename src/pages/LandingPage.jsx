import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  Check,
  ChevronDown,
  CircleDollarSign,
  AlertTriangle,
  Clock3,
  Menu,
  X,
} from 'lucide-react';

const metrics = [
  ['Faturamento previsto', 'R$ 31.206'],
  ['Despesas previstas', 'R$ 29.719'],
  ['Margem prevista', '4,8%'],
];

const chapters = [
  {
    id: 'financeiro',
    number: '01',
    label: 'Financeiro',
    title: 'Saiba como está o evento antes de ele terminar.',
    body: 'Receitas, despesas, pagamentos e resultado ficam ligados ao evento certo. O objetivo é abrir o projeto e entender a situação sem reconstruir o contexto em outra planilha.',
  },
  {
    id: 'pessoas',
    number: '02',
    label: 'Pessoas',
    title: 'Participantes e capacidade no mesmo contexto.',
    body: 'Acompanhe confirmações, presença e capacidade do evento sem manter contagens paralelas em listas diferentes.',
  },
  {
    id: 'fornecedores',
    number: '03',
    label: 'Fornecedores',
    title: 'Contrato, vencimento e impacto financeiro conectados.',
    body: 'Fornecedor deixa de ser apenas um contato: cada compromisso aparece junto das obrigações financeiras e do evento correspondente.',
  },
  {
    id: 'planejamento',
    number: '04',
    label: 'Planejamento',
    title: 'Programação, tarefas e o que precisa de atenção.',
    body: 'Prazos, responsáveis e horários ajudam o organizador a identificar o próximo passo e os pontos que exigem decisão.',
  },
  {
    id: 'networking',
    number: '05',
    label: 'Networking',
    title: 'Rodadas de negócio que você consegue enxergar.',
    body: 'Quando o evento usa networking, mesas, ocupação, rotas e conflitos entram no mesmo ambiente operacional.',
  },
];

const faq = [
  ['Minha planilha já funciona. Por que eu mudaria?', 'A proposta não é substituir uma planilha só por trocar de ferramenta. O Mesa Certa faz sentido quando reunir financeiro, pessoas, tarefas, fornecedores e operação no contexto de cada evento reduz a procura por informação espalhada.'],
  ['Serve para um evento sem networking?', 'Sim. Networking é opcional. A proposta principal é organizar e acompanhar a operação do evento.'],
  ['Posso organizar mais de um evento?', 'Sim. Cada evento mantém seus próprios dados, números e pendências. A oferta comercial inicial prevê até três eventos ativos simultaneamente.'],
  ['O Mesa Certa vende ingressos?', 'A oferta atual é de planejamento e operação. Bilheteria e processamento de pagamentos não fazem parte da promessa comercial desta versão.'],
];

function BrandMark({ inverted = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className={`grid h-8 w-8 place-items-center border ${inverted ? 'border-[#8BB7AD] text-[#EDE8DD]' : 'border-primary text-primary'}`}>
        <span className="relative block h-4 w-4">
          <span className="absolute inset-x-1 top-0 h-px bg-current" />
          <span className="absolute inset-x-1 bottom-0 h-px bg-current" />
          <span className="absolute inset-y-1 left-0 w-px bg-current" />
          <span className="absolute inset-y-1 right-0 w-px bg-current" />
          <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 border border-current" />
        </span>
      </span>
      <span className="font-display text-[20px] tracking-tight">Mesa Certa</span>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div className="mb-4 flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
      <span className="h-px w-8 bg-border" />
      {children}
    </div>
  );
}

function EventPreview() {
  const [event, setEvent] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();
  const events = [
    { name: 'Get Connected Sorocaba', date: '25 set 2026', place: 'Sorocaba, SP', revenue: 'R$ 31.206', expense: 'R$ 29.719', margin: '4,8%', attention: '3 pontos' },
    { name: 'Summit Conecta 2026', date: '18 nov 2026', place: 'São Paulo, SP', revenue: 'R$ 74.800', expense: 'R$ 43.200', margin: '42,2%', attention: '5 pontos' },
  ];

  useEffect(() => {
    if (reduceMotion || paused) return;
    const timer = window.setInterval(() => setEvent((value) => (value + 1) % events.length), 5200);
    return () => window.clearInterval(timer);
  }, [reduceMotion, paused, events.length]);

  const current = events[event];

  return (
    <div className="border border-border bg-[#fffdf9]">
      <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
        <div>
          <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Evento atual</div>
          <div className="mt-1 text-[13px] font-medium">{current.name}</div>
        </div>
        <div className="flex gap-1.5">
          {events.map((item, index) => (
            <button
              key={item.name}
              type="button"
              onClick={() => { setEvent(index); setPaused(true); }}
              aria-label={`Ver ${item.name}`}
              aria-pressed={index === event}
              className={`h-1.5 w-7 transition-colors ${index === event ? 'bg-primary' : 'bg-border'}`}
            />
          ))}
        </div>
      </div>

      {!reduceMotion && <button type="button" onClick={() => setPaused((value) => !value)} aria-pressed={paused} className="px-4 py-2 text-[11px] text-muted-foreground underline focus-ring">{paused ? 'Retomar troca de exemplos' : 'Pausar troca de exemplos'}</button>}

      <div className="grid sm:grid-cols-[1fr_180px]">
        <div className="p-5 sm:p-6">
          <div className="border-b border-border pb-5">
            <div className="font-display text-[24px] leading-tight sm:text-[28px]">{current.name}</div>
            <div className="mt-1 text-[12px] text-muted-foreground">{current.date} · {current.place}</div>
          </div>

          <div className="grid grid-cols-2 gap-x-6 border-b border-border py-5">
            <div>
              <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Faturamento</div>
              <div className="tnum mt-1 text-[18px]">{current.revenue}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Despesas</div>
              <div className="tnum mt-1 text-[18px]">{current.expense}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-6 pt-5">
            <div>
              <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Margem</div>
              <div className="tnum mt-1 text-[18px]">{current.margin}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Sua atenção</div>
              <div className="mt-1 text-[13px] font-medium">{current.attention}</div>
            </div>
          </div>
        </div>

        <div className="border-t border-border p-4 sm:border-l sm:border-t-0">
          <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Rodada 04</div>
          <div className="relative mx-auto mt-4 h-[210px] max-w-[160px]">
            <div className="absolute left-1/2 top-1/2 flex h-24 w-20 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center border-2 border-border bg-background px-2 text-center text-[10px]">
              <strong className="block">MESA 04</strong>
              <span className="mt-1 block text-muted-foreground">NETTOP</span>
            </div>
            {[
              ['Ana', '50%', '10px'],
              ['João', '5%', '62px'],
              ['Pedro', '95%', '62px'],
              ['Maria', '5%', '148px'],
              ['Lucas', '95%', '148px'],
              ['Renan', '50%', '192px'],
            ].map(([name, left, top], index) => (
              <div
                key={name}
                className={`absolute flex h-8 w-[58px] -translate-x-1/2 items-center justify-center border bg-[#fffdf9] text-[9px] ${index === 5 ? 'border-2 border-primary' : 'border-border'}`}
                style={{ left, top }}
              >
                {name}
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-3 text-[10px] text-muted-foreground">6 / 7 lugares ocupados</div>
        </div>
      </div>
    </div>
  );
}

function ScatteredWork() {
  return (
    <div className="relative min-h-[340px] border-y border-border py-8 sm:min-h-[400px]">
      <div className="absolute left-[3%] top-10 border border-border bg-[#fffdf9] px-3 py-2 text-[12px] rotate-[-2deg]">Orçamento_final_v7.xlsx</div>
      <div className="absolute right-[5%] top-8 border border-border bg-[#fffdf9] px-3 py-2 text-[12px] rotate-[1.5deg]">Fornecedor — buffet</div>
      <div className="absolute left-[12%] top-[46%] border border-border bg-[#fffdf9] px-3 py-2 text-[12px] rotate-[1deg]">Confirmar audiovisual</div>
      <div className="absolute right-[9%] top-[45%] border border-border bg-[#fffdf9] px-3 py-2 text-[12px] rotate-[-1.5deg]">Lista convidados FINAL</div>
      <div className="absolute left-[22%] bottom-10 border border-border bg-[#fffdf9] px-3 py-2 text-[12px] rotate-[-1deg]">Cronograma</div>
      <div className="absolute right-[18%] bottom-8 border border-border bg-[#fffdf9] px-3 py-2 text-[12px] rotate-[2deg]">R$ 6.500 pendente</div>
      <div className="absolute left-1/2 top-1/2 w-[240px] -translate-x-1/2 -translate-y-1/2 border-2 border-primary bg-background px-5 py-6 text-center sm:w-[290px]">
        <div className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Evento</div>
        <div className="mt-2 font-display text-[22px]">Get Connected Sorocaba</div>
        <div className="mt-3 text-[12px] text-muted-foreground">Informações, números e pendências no mesmo contexto.</div>
      </div>
    </div>
  );
}

function FinanceBlock() {
  return (
    <div className="border-t border-border">
      <div className="grid border-b border-border py-5 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Faturamento previsto</div>
          <div className="tnum mt-2 font-display text-[38px] leading-none sm:text-[52px]">R$ 31.206</div>
        </div>
        <div className="mt-4 text-left sm:mt-0 sm:text-right">
          <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Margem prevista</div>
          <div className="tnum mt-1 text-[22px]">4,8%</div>
        </div>
      </div>
      {[
        ['Receitas previstas', 'R$ 31.206', 'text-positive'],
        ['Despesas previstas', 'R$ 29.719', ''],
        ['Resultado previsto', 'R$ 1.487', 'text-positive'],
        ['Ponto de equilíbrio', '18 ingressos', ''],
      ].map(([label, value, tone]) => (
        <div key={label} className="grid grid-cols-[1fr_auto] items-center border-b border-border py-3.5 text-[13px]">
          <span className="text-muted-foreground">{label}</span>
          <span className={`tnum ${tone}`}>{value}</span>
        </div>
      ))}
    </div>
  );
}

function ChapterVisual({ active }) {
  if (active === 'financeiro') return <FinanceBlock />;
  if (active === 'pessoas') {
    return (
      <div className="border-t border-border">
        {[
          ['Capacidade do espaço', '120'],
          ['Inscritos', '94'],
          ['Confirmados', '76'],
          ['Check-ins', '68'],
        ].map(([label, value], index) => (
          <div key={label} className="grid grid-cols-[1fr_auto] items-center border-b border-border py-4">
            <div>
              <div className="text-[13px]">{label}</div>
              <div className="mt-1 h-1.5 w-44 bg-muted sm:w-64"><div className="h-full bg-primary" style={{ width: `${[100, 78, 63, 57][index]}%` }} /></div>
            </div>
            <span className="tnum text-[18px]">{value}</span>
          </div>
        ))}
      </div>
    );
  }
  if (active === 'fornecedores') {
    return (
      <div className="border-t border-border text-[13px]">
        {[
          ['Buffet Sabor', 'Alimentação', 'R$ 13.500', 'Pendente'],
          ['Audio Pro', 'Audiovisual', 'R$ 7.500', 'Parcial'],
          ['Centro Empresarial', 'Espaço', 'R$ 11.000', 'Pago'],
        ].map((row) => (
          <div key={row[0]} className="grid grid-cols-[1.3fr_.9fr_auto] gap-3 border-b border-border py-3.5">
            <div><strong className="font-medium">{row[0]}</strong><span className="mt-0.5 block text-[11px] text-muted-foreground">{row[1]}</span></div>
            <div className="tnum text-right">{row[2]}</div>
            <div className="text-right text-[11px] text-muted-foreground">{row[3]}</div>
          </div>
        ))}
      </div>
    );
  }
  if (active === 'planejamento') {
    return (
      <div className="border-t border-border">
        {[
          ['08:00', 'Credenciamento', 'Concluído'],
          ['09:10', 'Rodadas de networking — bloco 1', 'Em andamento'],
          ['12:10', 'Almoço', 'Próximo'],
          ['14:00', 'Palestra principal', 'Programado'],
        ].map((row) => (
          <div key={row[1]} className="grid grid-cols-[58px_1fr_auto] gap-4 border-b border-border py-3.5 text-[13px]">
            <span className="tnum text-muted-foreground">{row[0]}</span>
            <span>{row[1]}</span>
            <span className="text-[11px] text-muted-foreground">{row[2]}</span>
          </div>
        ))}
      </div>
    );
  }
  return <EventPreview />;
}

function LandingPage() {
  const reduceMotion = useReducedMotion();
  const [menuOpen, setMenuOpen] = useState(false);
  const [chapter, setChapter] = useState('financeiro');
  const [openFaq, setOpenFaq] = useState(0);

  const reveal = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 16 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.2 },
        transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
      };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-5 sm:px-8">
          <a href="#top" className="focus-ring"><BrandMark /></a>
          <nav className="hidden items-center gap-7 text-[12px] text-muted-foreground lg:flex">
            <a href="#produto" className="hover:text-foreground">Produto</a>
            <a href="#como-funciona" className="hover:text-foreground">Como funciona</a>
            <a href="#networking" className="hover:text-foreground">Networking</a>
            <a href="#planos" className="hover:text-foreground">Planos</a>
            <a href="#duvidas" className="hover:text-foreground">Dúvidas</a>
          </nav>
          <div className="hidden items-center gap-3 lg:flex">
            <Link to="/login" className="px-3 py-2 text-[12px] text-muted-foreground hover:text-foreground">Entrar</Link>
            <a href="#produto" className="border border-primary bg-primary px-4 py-2 text-[12px] font-medium text-primary-foreground">Conhecer a plataforma</a>
          </div>
          <button type="button" onClick={() => setMenuOpen((value) => !value)} className="p-2 lg:hidden focus-ring" aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuOpen} aria-controls="landing-mobile-menu">
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
          <div id="landing-mobile-menu" hidden={!menuOpen} className="border-t border-border bg-background px-5 py-5 lg:hidden">
            <div className="grid gap-4 text-[13px]">
              {[
                ['Produto', '#produto'],
                ['Como funciona', '#como-funciona'],
                ['Networking', '#networking'],
                ['Planos', '#planos'],
                ['Dúvidas', '#duvidas'],
              ].map(([label, href]) => <a key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</a>)}
              <Link to="/login" className="border-t border-border pt-4 text-primary">Entrar na plataforma</Link>
            </div>
          </div>
      </header>

      <main id="top">
        <section className="border-b border-border">
          <div className="mx-auto grid max-w-[1240px] gap-14 px-5 pb-14 pt-16 sm:px-8 sm:pb-20 sm:pt-24 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:gap-16 lg:pb-24 lg:pt-28">
            <motion.div {...reveal}>
              <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Planejamento e operação de eventos</div>
              <h1 className="mt-5 max-w-[720px] font-display text-[46px] leading-[0.98] tracking-[-0.025em] sm:text-[62px] lg:text-[70px]">
                Organize seus eventos e acompanhe o financeiro de cada um em um só lugar.
              </h1>
              <p className="mt-6 max-w-[610px] text-[15px] leading-7 text-muted-foreground sm:text-[16px]">
                Reúna participantes, fornecedores, tarefas e programação no Mesa Certa. Para encontros empresariais, organize também as rodadas de networking.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a href="#produto" className="inline-flex items-center gap-2 border border-primary bg-primary px-5 py-3 text-[13px] font-medium text-primary-foreground">
                  Conhecer o Mesa Certa <ArrowRight className="h-4 w-4" />
                </a>
                <a href="#como-funciona" className="inline-flex items-center gap-2 border-b border-foreground py-2 text-[13px]">
                  Ver como funciona
                </a>
              </div>
            </motion.div>

            <motion.div {...reveal} transition={{ duration: 0.7, delay: 0.12 }}>
              <EventPreview />
              <div className="mt-3 flex justify-between text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                <span>Um evento por contexto</span>
                <span>Dados demonstrativos</span>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="mx-auto max-w-[1240px] px-5 py-20 sm:px-8 sm:py-28">
          <motion.div {...reveal} className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:gap-16">
            <div>
              <SectionLabel>O problema</SectionLabel>
              <h2 className="font-display text-[38px] leading-[1.02] tracking-tight sm:text-[52px]">Um evento não deveria viver em cinco lugares ao mesmo tempo.</h2>
              <p className="mt-5 max-w-[520px] text-[14px] leading-7 text-muted-foreground">Quando orçamento, fornecedores, tarefas e listas ficam separados, descobrir o que falta exige reconstruir o contexto. Com mais de um evento, o trabalho se repete.</p>
            </div>
            <ScatteredWork />
          </motion.div>
        </section>

        <section id="produto" className="border-y border-border bg-[#f5f0e7]">
          <div className="mx-auto max-w-[1240px] px-5 py-20 sm:px-8 sm:py-28">
            <motion.div {...reveal} className="grid gap-12 lg:grid-cols-[.7fr_1.3fr] lg:gap-16">
              <div className="lg:sticky lg:top-28 lg:self-start">
                <SectionLabel>O produto</SectionLabel>
                <h2 className="font-display text-[40px] leading-[1.02] tracking-tight sm:text-[54px]">Cada evento tem seu próprio espaço.</h2>
                <p className="mt-5 max-w-[440px] text-[14px] leading-7 text-muted-foreground">Planejamento, pessoas e números permanecem ligados ao projeto correspondente. Você muda de evento sem misturar suas informações.</p>
              </div>
              <div>
                <EventPreview />
                <div className="mt-8 grid gap-0 border-t border-border sm:grid-cols-3">
                  {[
                    ['01', 'Abra o evento', 'Veja o estado atual sem procurar em outras ferramentas.'],
                    ['02', 'Encontre a atenção', 'Pendências e números aparecem no contexto em que importam.'],
                    ['03', 'Decida o próximo passo', 'A informação existe para orientar a operação, não para decorar um dashboard.'],
                  ].map(([n, title, body]) => (
                    <div key={n} className="border-b border-border py-5 sm:border-r sm:px-5 first:pl-0 last:border-r-0">
                      <div className="tnum text-[10px] text-muted-foreground">{n}</div>
                      <div className="mt-3 text-[13px] font-medium">{title}</div>
                      <div className="mt-2 text-[12px] leading-5 text-muted-foreground">{body}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="mx-auto max-w-[1240px] px-5 py-20 sm:px-8 sm:py-28">
          <motion.div {...reveal}>
            <SectionLabel>Visão geral</SectionLabel>
            <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:gap-20">
              <div>
                <h2 className="font-display text-[40px] leading-[1.02] tracking-tight sm:text-[54px]">Abra o evento. Saiba o que precisa da sua atenção.</h2>
                <p className="mt-5 max-w-[480px] text-[14px] leading-7 text-muted-foreground">O cockpit combina financeiro, operação e próximos acontecimentos para responder rapidamente como está o evento e o que precisa acontecer agora.</p>
              </div>
              <div className="border-t border-border">
                <div className="border-b border-border py-5">
                  <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Get Connected Sorocaba 2026</div>
                  <div className="mt-2 font-display text-[36px]">Faltam 18 dias</div>
                </div>
                {metrics.map(([label, value]) => (
                  <div key={label} className="grid grid-cols-[1fr_auto] items-end border-b border-border py-4">
                    <span className="text-[13px] text-muted-foreground">{label}</span>
                    <span className="tnum text-[18px]">{value}</span>
                  </div>
                ))}
                <div className="pt-7">
                  <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Precisa da sua atenção</div>
                  {[
                    { icon: AlertTriangle, level: 'Crítico', text: '3 tarefas vencidas' },
                    { icon: CircleDollarSign, level: 'Atenção', text: 'Pagamento do buffet vence amanhã' },
                    { icon: Clock3, level: 'Atenção', text: 'Programação ultrapassa o horário em 25 min' },
                  ].map(({ icon: Icon, level, text }, index) => (
                    <div key={text} className="flex items-center gap-4 border-b border-border py-4">
                      <Icon className={`h-4 w-4 ${index === 0 ? 'text-danger' : 'text-warning'}`} />
                      <span className="w-16 text-[9px] uppercase tracking-[0.12em] text-muted-foreground">{level}</span>
                      <span className="text-[13px]">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <section className="border-y border-border bg-[#fffdf9]">
          <div className="mx-auto max-w-[1240px] px-5 py-20 sm:px-8 sm:py-28">
            <motion.div {...reveal} className="grid gap-12 lg:grid-cols-[.78fr_1.22fr] lg:gap-20">
              <div>
                <SectionLabel>Financeiro</SectionLabel>
                <h2 className="font-display text-[40px] leading-[1.02] tracking-tight sm:text-[54px]">Saiba como está o evento antes de ele terminar.</h2>
                <p className="mt-5 max-w-[460px] text-[14px] leading-7 text-muted-foreground">Receitas, despesas e resultado aparecem como informação operacional. Sem transformar o evento em um painel de BI.</p>
              </div>
              <FinanceBlock />
            </motion.div>
          </div>
        </section>

        <section className="mx-auto max-w-[1240px] px-5 py-20 sm:px-8 sm:py-28">
          <motion.div {...reveal}>
            <SectionLabel>Uma plataforma, capítulos claros</SectionLabel>
            <div className="grid gap-10 lg:grid-cols-[360px_1fr] lg:gap-16">
              <div className="border-t border-border">
                {chapters.map((item) => (
                  <button key={item.id} type="button" onClick={() => setChapter(item.id)} aria-pressed={chapter === item.id} aria-controls="landing-chapter-content" className={`grid w-full grid-cols-[42px_1fr] border-b border-border py-4 text-left transition-colors focus-ring ${chapter === item.id ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                    <span className="tnum text-[10px]">{item.number}</span>
                    <span className="text-[13px] font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
              <div id="landing-chapter-content" aria-live="polite">
                {chapters.filter((item) => item.id === chapter).map((item) => (
                  <div key={item.id}>
                    <div className="min-h-[150px]">
                      <h3 className="font-display text-[34px] leading-tight sm:text-[42px]">{item.title}</h3>
                      <p className="mt-4 max-w-[650px] text-[14px] leading-7 text-muted-foreground">{item.body}</p>
                    </div>
                    <ChapterVisual active={chapter} />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </section>

        <section id="networking" className="border-y border-border bg-primary text-primary-foreground">
          <div className="mx-auto max-w-[1240px] px-5 py-20 sm:px-8 sm:py-28">
            <motion.div {...reveal} className="grid gap-14 lg:grid-cols-[.72fr_1.28fr] lg:items-center lg:gap-20">
              <div>
                <div className="mb-4 flex items-center gap-3 text-[10px] uppercase tracking-[0.18em] text-[#b9d3cd]"><span className="h-px w-8 bg-[#6f948c]" />Networking opcional</div>
                <h2 className="font-display text-[42px] leading-[1.02] tracking-tight sm:text-[58px]">Uma rodada de negócios é espacial. O Mesa Certa também.</h2>
                <p className="mt-5 max-w-[470px] text-[14px] leading-7 text-[#c9d9d5]">Mesas, lugares, anfitriões e rotas permanecem visíveis. A representação foi pensada para operação presencial, não para virar uma tabela abstrata.</p>
                <div className="mt-8 grid grid-cols-3 border-y border-[#4d746c] py-5">
                  {[['76', 'convidados'], ['14', 'mesas'], ['14', 'rodadas']].map(([value, label]) => (
                    <div key={label}>
                      <div className="tnum text-[24px]">{value}</div>
                      <div className="mt-1 text-[9px] uppercase tracking-[0.12em] text-[#aac8c1]">{label}</div>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-[10px] leading-5 text-[#aac8c1]">O motor que deu origem ao módulo foi utilizado na operação do Get Connected Sorocaba 2026. Esse histórico se refere ao motor original, não ao uso da plataforma completa em produção.</p>
              </div>

              <div className="border border-[#4d746c] bg-[#183c36] p-4 sm:p-6">
                <div className="flex items-center justify-between border-b border-[#4d746c] pb-4 text-[11px]">
                  <span>Rodada 04</span>
                  <span className="text-[#aac8c1]">Mesa 04 · NETTOP</span>
                </div>
                <div className="relative mx-auto mt-8 h-[430px] max-w-[500px]">
                  <div className="absolute left-1/2 top-1/2 flex h-40 w-44 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center border-2 border-[#8bb7ad]">
                    <span className="text-[11px] uppercase tracking-[0.16em]">Mesa 04</span>
                    <strong className="mt-2 font-display text-[24px] font-normal">NETTOP</strong>
                    <span className="mt-3 text-[10px] text-[#aac8c1]">6 / 7 lugares</span>
                  </div>
                  {[
                    ['Ana', '50%', '8%', 'Participante'],
                    ['João', '6%', '30%', 'Participante'],
                    ['Pedro', '94%', '30%', 'Participante'],
                    ['Maria', '6%', '69%', 'Participante'],
                    ['Lucas', '94%', '69%', 'Participante'],
                    ['Renan', '50%', '91%', 'Anfitrião'],
                  ].map(([name, left, top, role], index) => (
                    <div key={name} className={`absolute w-[104px] -translate-x-1/2 -translate-y-1/2 border bg-[#183c36] px-2 py-2 text-center ${index === 5 ? 'border-2 border-[#a9d3ca]' : 'border-[#4d746c]'}`} style={{ left, top }}>
                      <div className="text-[11px]">{name}</div>
                      <div className="mt-1 text-[8px] uppercase tracking-[0.1em] text-[#aac8c1]">{role}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="como-funciona" className="mx-auto max-w-[1240px] px-5 py-20 sm:px-8 sm:py-28">
          <motion.div {...reveal}>
            <SectionLabel>Como funciona</SectionLabel>
            <h2 className="max-w-[760px] font-display text-[42px] leading-[1.02] tracking-tight sm:text-[56px]">Do primeiro cadastro ao próximo passo, sem transformar simplicidade em interface vazia.</h2>
            <div className="mt-12 border-t border-border">
              {[
                ['01', 'Crie o evento', 'Nome, data, público e formato. Você ativa apenas os módulos que fazem sentido para a operação.'],
                ['02', 'Organize o que importa', 'Participantes, fornecedores, tarefas, programação e financeiro ficam ligados ao evento.'],
                ['03', 'Acompanhe o que pede decisão', 'Abra o cockpit e revise números, pendências, prazos e alertas antes que virem surpresa.'],
              ].map(([number, title, body], index) => (
                <div key={number} className="grid gap-3 border-b border-border py-6 sm:grid-cols-[70px_260px_1fr] sm:items-start sm:gap-8">
                  <div className="tnum text-[10px] text-muted-foreground">{number}</div>
                  <div className="font-display text-[25px]">{title}</div>
                  <div className="max-w-[560px] text-[13px] leading-6 text-muted-foreground">{body}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        <section className="border-y border-border bg-[#fffdf9]">
          <div className="mx-auto max-w-[1240px] px-5 py-20 sm:px-8 sm:py-28">
            <motion.div {...reveal}>
              <SectionLabel>Feito para quem organiza</SectionLabel>
              <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:gap-20">
                <h2 className="font-display text-[40px] leading-[1.02] tracking-tight sm:text-[54px]">Menos promessa genérica. Mais contexto para o próximo evento.</h2>
                <div className="border-t border-border">
                  {[
                    ['Eventos empresariais', 'Operação, orçamento, fornecedores e networking quando necessário.'],
                    ['Associações e comunidades', 'Eventos recorrentes com equipes pequenas e muitas informações para acompanhar.'],
                    ['Pequenas produtoras', 'Vários projetos sem misturar financeiro, tarefas e participantes.'],
                    ['Organizadores independentes', 'Um lugar para reunir aquilo que hoje vive em planilhas, mensagens e listas.'],
                  ].map(([title, body]) => (
                    <div key={title} className="grid gap-2 border-b border-border py-5 sm:grid-cols-[220px_1fr] sm:gap-8">
                      <div className="text-[13px] font-medium">{title}</div>
                      <div className="text-[13px] leading-6 text-muted-foreground">{body}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="planos" className="mx-auto max-w-[1240px] px-5 py-20 sm:px-8 sm:py-28">
          <motion.div {...reveal}>
            <SectionLabel>Planos em breve</SectionLabel>
            <div className="grid gap-10 lg:grid-cols-[.7fr_1.3fr] lg:gap-20">
              <div>
                <h2 className="font-display text-[40px] leading-[1.02] tracking-tight sm:text-[54px]">Uma oferta. Duas formas de contratação.</h2>
                <p className="mt-5 max-w-[440px] text-[13px] leading-6 text-muted-foreground">Estamos preparando a abertura das vendas. Estes são os preços previstos para os dois planos. Você já pode criar sua conta; o cadastro não contrata um plano nem gera cobrança.</p>
                <Link to="/register" className="mt-6 inline-flex items-center gap-2 border border-primary px-4 py-3 text-[13px] text-primary focus-ring">Criar minha conta <ArrowRight className="h-4 w-4" /></Link>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="border border-border p-6">
                  <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Mensal</div>
                  <div className="mt-6 font-display text-[42px]">R$ 97<span className="font-body text-[13px] text-muted-foreground"> / mês</span></div>
                  <p className="mt-3 text-[12px] leading-5 text-muted-foreground">Cobrança mensal recorrente. Menor compromisso inicial.</p>
                  <div className="mt-6 border-t border-border pt-5">
                    {['Mesmos recursos da oferta anual', '1 organização', '1 responsável', 'Até 3 eventos ativos'].map((item) => <div key={item} className="flex gap-2 py-1.5 text-[12px]"><Check className="mt-0.5 h-3.5 w-3.5 text-primary" />{item}</div>)}
                  </div>
                </div>
                <div className="border-2 border-primary p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-[10px] uppercase tracking-[0.14em] text-primary">12 meses</div>
                    <div className="tnum text-[10px] text-muted-foreground">economia R$ 367</div>
                  </div>
                  <div className="mt-6 font-display text-[42px]">R$ 797</div>
                  <p className="mt-3 text-[12px] leading-5 text-muted-foreground">Pagamento único, 12 meses de acesso, sem renovação automática.</p>
                  <div className="mt-6 border-t border-border pt-5 text-[12px]">
                    <div className="flex justify-between py-1.5"><span className="text-muted-foreground">12 mensalidades</span><span className="tnum">R$ 1.164</span></div>
                    <div className="flex justify-between py-1.5"><span className="text-muted-foreground">Acesso de 12 meses</span><span className="tnum">R$ 797</span></div>
                    <div className="mt-2 flex justify-between border-t border-border pt-3 font-medium"><span>Diferença</span><span className="tnum text-positive">R$ 367</span></div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <section id="duvidas" className="border-t border-border bg-[#f5f0e7]">
          <div className="mx-auto max-w-[1240px] px-5 py-20 sm:px-8 sm:py-28">
            <motion.div {...reveal} className="grid gap-10 lg:grid-cols-[.7fr_1.3fr] lg:gap-20">
              <div>
                <SectionLabel>Dúvidas</SectionLabel>
                <h2 className="font-display text-[40px] leading-[1.02] tracking-tight sm:text-[54px]">Perguntas antes de mudar a rotina.</h2>
              </div>
              <div className="border-t border-border">
                {faq.map(([question, answer], index) => (
                  <div key={question} className="border-b border-border">
                    <button id={`landing-faq-button-${index}`} type="button" className="flex w-full items-center justify-between gap-6 py-5 text-left text-[13px] font-medium focus-ring" aria-expanded={openFaq === index} aria-controls={`landing-faq-answer-${index}`} onClick={() => setOpenFaq(openFaq === index ? -1 : index)}>
                      {question}<ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${openFaq === index ? 'rotate-180' : ''}`} />
                    </button>
                    <p id={`landing-faq-answer-${index}`} aria-labelledby={`landing-faq-button-${index}`} hidden={openFaq !== index} className="max-w-[700px] pb-6 text-[13px] leading-6 text-muted-foreground">{answer}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        <section className="bg-[#15181A] text-[#EDE8DD]">
          <div className="mx-auto max-w-[1240px] px-5 py-20 sm:px-8 sm:py-28">
            <motion.div {...reveal} className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-16">
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-[#8fa39f]">Mesa Certa</div>
                <h2 className="mt-5 max-w-[900px] font-display text-[44px] leading-[1.02] tracking-tight sm:text-[62px]">Seu próximo evento já tem informação suficiente. Falta colocá-la no lugar certo.</h2>
                <p className="mt-5 max-w-[620px] text-[13px] leading-6 text-[#9da7a4]">Conheça a plataforma, veja como os módulos se conectam e entre quando quiser acompanhar seus próprios eventos.</p>
              </div>
              <Link to="/login" className="inline-flex items-center gap-2 border border-[#6f948c] px-5 py-3 text-[13px] text-[#EDE8DD] hover:border-[#a9d3ca]">
                Entrar na plataforma <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#30363A] bg-[#15181A] text-[#9da7a4]">
        <div className="mx-auto grid max-w-[1240px] gap-8 px-5 py-10 sm:px-8 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <BrandMark inverted />
            <p className="mt-4 max-w-[430px] text-[11px] leading-5">Planejamento e operação de eventos, com financeiro por evento e networking opcional.</p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-[11px]">
            <a href="#produto" className="hover:text-[#EDE8DD]">Produto</a>
            <a href="#networking" className="hover:text-[#EDE8DD]">Networking</a>
            <a href="#planos" className="hover:text-[#EDE8DD]">Planos</a>
            <Link to="/login" className="hover:text-[#EDE8DD]">Entrar</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
