import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion';
import {
  ArrowDownRight,
  ArrowRight,
  Check,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Menu,
  Sparkles,
  Users,
  X,
} from 'lucide-react';

const chapters = [
  {
    id: 'financeiro',
    eyebrow: '01 · Financeiro',
    title: 'Você não deveria descobrir se o evento deu certo depois que ele acabou.',
    body: 'Receitas, despesas, compromissos e resultado ficam dentro do contexto do evento. A leitura financeira existe para responder uma pergunta simples: como esse projeto está agora?',
  },
  {
    id: 'pessoas',
    eyebrow: '02 · Pessoas',
    title: 'Cada confirmação muda a operação. Então ela precisa estar visível.',
    body: 'Participantes, presença e capacidade deixam de ser contagens soltas e passam a fazer parte da mesma leitura operacional.',
  },
  {
    id: 'fornecedores',
    eyebrow: '03 · Fornecedores',
    title: 'Fornecedor não é só um contato. É prazo, custo e responsabilidade.',
    body: 'O que foi combinado, quanto custa e o que ainda depende de ação ficam próximos o suficiente para você não depender da memória.',
  },
  {
    id: 'planejamento',
    eyebrow: '04 · Planejamento',
    title: 'A programação deveria mostrar o que está prestes a dar errado.',
    body: 'Horários, tarefas e responsáveis ajudam a antecipar atrasos, lacunas e decisões antes que elas virem improviso no dia do evento.',
  },
  {
    id: 'networking',
    eyebrow: '05 · Networking',
    title: 'Quando a experiência acontece ao redor de uma mesa, a interface também precisa pensar no espaço.',
    body: 'Mesas, cadeiras, anfitriões, rotas e conflitos ganham representação espacial — porque uma rodada de negócios não é uma planilha.',
  },
];

const faq = [
  {
    question: 'Minha planilha já funciona. Por que eu mudaria?',
    answer: 'Se ela resolve sua operação inteira, talvez você não precise mudar. O Mesa Certa faz sentido quando financeiro, participantes, fornecedores, tarefas e programação começam a viver em lugares diferentes e você precisa reconstruir o contexto toda vez que abre um evento.',
  },
  {
    question: 'Serve para um evento sem networking?',
    answer: 'Sim. Networking é opcional. O núcleo do Mesa Certa é planejamento e operação do evento, com o financeiro separado por projeto.',
  },
  {
    question: 'Posso organizar vários eventos ao mesmo tempo?',
    answer: 'Sim. Cada evento mantém seus próprios dados, números e pendências. A oferta comercial inicial considera até três eventos ativos simultaneamente.',
  },
  {
    question: 'O Mesa Certa vende ingressos?',
    answer: 'A proposta atual é planejamento e operação. Bilheteria e processamento de pagamentos não fazem parte da promessa comercial desta versão.',
  },
];

const chaosItems = [
  { label: 'Orçamento_final_v7.xlsx', x: '-34vw', y: '-20vh', r: -7, finalX: '-18vw', finalY: '-4vh' },
  { label: 'Fornecedor — buffet', x: '31vw', y: '-26vh', r: 6, finalX: '17vw', finalY: '-7vh' },
  { label: 'Confirmar audiovisual', x: '-36vw', y: '5vh', r: 4, finalX: '-19vw', finalY: '8vh' },
  { label: 'Lista convidados FINAL', x: '33vw', y: '7vh', r: -5, finalX: '18vw', finalY: '7vh' },
  { label: 'Cronograma', x: '-28vw', y: '27vh', r: -3, finalX: '-13vw', finalY: '18vh' },
  { label: 'R$ 6.500 pendente', x: '29vw', y: '29vh', r: 8, finalX: '14vw', finalY: '18vh' },
];

const networkingRounds = [
  [
    { name: 'Ana', left: '19%', top: '14%' },
    { name: 'João', left: '81%', top: '14%' },
    { name: 'Maria', left: '9%', top: '49%' },
    { name: 'Lucas', left: '91%', top: '49%' },
    { name: 'Renan', left: '31%', top: '85%' },
    { name: 'Pedro', left: '69%', top: '85%' },
  ],
  [
    { name: 'Ana', left: '31%', top: '85%' },
    { name: 'João', left: '19%', top: '14%' },
    { name: 'Maria', left: '81%', top: '14%' },
    { name: 'Lucas', left: '9%', top: '49%' },
    { name: 'Renan', left: '69%', top: '85%' },
    { name: 'Pedro', left: '91%', top: '49%' },
  ],
  [
    { name: 'Ana', left: '91%', top: '49%' },
    { name: 'João', left: '31%', top: '85%' },
    { name: 'Maria', left: '19%', top: '14%' },
    { name: 'Lucas', left: '69%', top: '85%' },
    { name: 'Renan', left: '81%', top: '14%' },
    { name: 'Pedro', left: '9%', top: '49%' },
  ],
];

function easeInOutQuint(t) {
  return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
}

function scrollToSection(id, reduceMotion) {
  const target = document.getElementById(id);
  if (!target) return;

  const offset = 72;
  const from = window.scrollY;
  const to = Math.max(0, target.getBoundingClientRect().top + window.scrollY - offset);

  if (reduceMotion) {
    window.scrollTo(0, to);
    return;
  }

  const distance = to - from;
  const duration = Math.min(1400, Math.max(850, Math.abs(distance) * 0.5));
  let startedAt = null;

  const frame = (time) => {
    if (startedAt === null) startedAt = time;
    const elapsed = time - startedAt;
    const progress = Math.min(1, elapsed / duration);
    window.scrollTo(0, from + distance * easeInOutQuint(progress));
    if (progress < 1) window.requestAnimationFrame(frame);
  };

  window.requestAnimationFrame(frame);
}

function NavButton({ target, children, reduceMotion, className = '' }) {
  return (
    <button
      type="button"
      onClick={() => scrollToSection(target, reduceMotion)}
      className={'landing-nav-link ' + className}
    >
      {children}
    </button>
  );
}

function BrandMark({ light = false }) {
  return (
    <div className="flex items-center gap-3">
      <span className={'relative grid h-9 w-9 place-items-center border ' + (light ? 'border-[#88aaa3] text-[#f6f1e7]' : 'border-primary text-primary')}>
        <span className="absolute left-1/2 top-[-4px] h-2 w-px -translate-x-1/2 bg-current" />
        <span className="absolute bottom-[-4px] left-1/2 h-2 w-px -translate-x-1/2 bg-current" />
        <span className="absolute left-[-4px] top-1/2 h-px w-2 -translate-y-1/2 bg-current" />
        <span className="absolute right-[-4px] top-1/2 h-px w-2 -translate-y-1/2 bg-current" />
        <span className="h-3.5 w-3.5 border border-current" />
      </span>
      <span className="font-display text-[21px] tracking-[-0.02em]">Mesa Certa</span>
    </div>
  );
}

function SectionKicker({ number, children, light = false }) {
  return (
    <div className={'mb-6 flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.22em] ' + (light ? 'text-[#9fb8b2]' : 'text-muted-foreground')}>
      <span className={'tnum ' + (light ? 'text-[#dce9e5]' : 'text-primary')}>{number}</span>
      <span className={'h-px w-9 ' + (light ? 'bg-[#4d746c]' : 'bg-border')} />
      <span>{children}</span>
    </div>
  );
}

function HeroLines({ progress }) {
  const path1 = useTransform(progress, [0, 0.28], [0, 1]);
  const path2 = useTransform(progress, [0.06, 0.34], [0, 1]);
  const path3 = useTransform(progress, [0.12, 0.4], [0, 1]);

  return (
    <svg viewBox="0 0 1000 820" className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-hidden="true">
      <motion.path d="M80 710 H920 V110 H245 V535 H760" fill="none" stroke="currentColor" strokeWidth="1" className="text-[#d8d1c5]" style={{ pathLength: path1 }} />
      <motion.path d="M0 265 H410 V0 M710 820 V450 H1000" fill="none" stroke="currentColor" strokeWidth="1" className="text-[#e4ded3]" style={{ pathLength: path2 }} />
      <motion.path d="M150 0 V125 H860 V820" fill="none" stroke="currentColor" strokeWidth="1" className="text-[#ede7dd]" style={{ pathLength: path3 }} />
      <circle cx="245" cy="535" r="5" fill="currentColor" className="text-primary" />
      <circle cx="760" cy="535" r="5" fill="currentColor" className="text-primary" />
    </svg>
  );
}

function HeroProduct() {
  const [event, setEvent] = useState(0);
  const events = [
    {
      name: 'Get Connected Sorocaba',
      date: '25 SET 2026',
      revenue: 'R$ 31.206',
      expense: 'R$ 29.719',
      margin: '4,8%',
      attention: '3',
    },
    {
      name: 'Summit Conecta 2026',
      date: '18 NOV 2026',
      revenue: 'R$ 74.800',
      expense: 'R$ 43.200',
      margin: '42,2%',
      attention: '5',
    },
  ];

  useEffect(() => {
    const timer = window.setInterval(() => setEvent((current) => (current + 1) % events.length), 5000);
    return () => window.clearInterval(timer);
  }, []);

  const current = events[event];

  return (
    <div className="relative">
      <div className="absolute -left-8 top-16 hidden text-[9px] uppercase tracking-[0.2em] text-muted-foreground xl:block [writing-mode:vertical-rl]">
        VISÃO DO EVENTO
      </div>

      <motion.div
        initial={{ opacity: 0, y: 34, rotate: -1.2 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ duration: 0.9, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative border border-[#bcb4a6] bg-[#fffdf9] shadow-[18px_24px_0_rgba(31,77,70,0.08)]"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 bg-primary" />
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Evento atual</span>
          </div>
          <div className="flex gap-1.5">
            {events.map((item, index) => (
              <button
                key={item.name}
                type="button"
                onClick={() => setEvent(index)}
                className={'h-[2px] w-8 transition-colors duration-500 ' + (index === event ? 'bg-primary' : 'bg-border')}
                aria-label={'Ver ' + item.name}
                aria-pressed={index === event}
              />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={current.name}
            initial={{ opacity: 0, y: 9 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -7 }}
            transition={{ duration: 0.35 }}
          >
            <div className="grid lg:grid-cols-[1fr_190px]">
              <div className="p-5 sm:p-7">
                <div className="border-b border-border pb-6">
                  <div className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">{current.date}</div>
                  <div className="mt-2 font-display text-[30px] leading-[1.05] sm:text-[36px]">{current.name}</div>
                </div>

                <div className="grid grid-cols-2 border-b border-border">
                  <div className="border-r border-border py-5 pr-4">
                    <div className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Faturamento</div>
                    <div className="tnum mt-2 text-[19px]">{current.revenue}</div>
                  </div>
                  <div className="py-5 pl-4">
                    <div className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Despesas</div>
                    <div className="tnum mt-2 text-[19px]">{current.expense}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2">
                  <div className="border-r border-border py-5 pr-4">
                    <div className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Margem</div>
                    <div className="tnum mt-2 text-[19px]">{current.margin}</div>
                  </div>
                  <div className="py-5 pl-4">
                    <div className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Precisa de atenção</div>
                    <div className="mt-2 flex items-center gap-2 text-[13px] font-medium">
                      <span className="h-2 w-2 bg-warning" />
                      {current.attention} pontos
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-border p-5 lg:border-l lg:border-t-0">
                <div className="flex items-center justify-between">
                  <div className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground">Rodada 04</div>
                  <div className="tnum text-[9px] text-muted-foreground">06 / 07</div>
                </div>

                <div className="relative mx-auto mt-5 h-[210px] max-w-[160px]">
                  <div className="absolute left-1/2 top-1/2 flex h-24 w-[86px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center border-2 border-primary/45">
                    <span className="text-[8px] uppercase tracking-[0.14em] text-muted-foreground">Mesa 04</span>
                    <strong className="mt-1 text-[10px] font-medium">NETTOP</strong>
                  </div>
                  {[
                    ['Ana', '50%', '8px'],
                    ['João', '4%', '58px'],
                    ['Pedro', '96%', '58px'],
                    ['Maria', '4%', '145px'],
                    ['Lucas', '96%', '145px'],
                    ['Renan', '50%', '191px'],
                  ].map(([name, left, top], index) => (
                    <motion.div
                      key={name}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.55 + index * 0.05 }}
                      className={'absolute flex h-8 w-[56px] -translate-x-1/2 items-center justify-center bg-[#fffdf9] text-[8px] ' + (index === 5 ? 'border-2 border-primary' : 'border border-border')}
                      style={{ left, top }}
                    >
                      {name}
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.65, delay: 1 }}
        className="absolute -bottom-6 right-5 hidden border border-primary bg-primary px-4 py-3 text-primary-foreground sm:block"
      >
        <div className="text-[8px] uppercase tracking-[0.17em] text-[#b8d0cb]">Hoje</div>
        <div className="mt-1 text-[11px]">Pagamento do buffet vence amanhã</div>
      </motion.div>
    </div>
  );
}

function ChaosFragment({ item, progress, index }) {
  const x = useTransform(progress, [0.05, 0.58, 0.82], [item.x, item.finalX, '0vw']);
  const y = useTransform(progress, [0.05, 0.58, 0.82], [item.y, item.finalY, '0vh']);
  const rotate = useTransform(progress, [0.05, 0.72], [item.r, 0]);
  const opacity = useTransform(progress, [0, 0.1, 0.76, 0.9], [0, 1, 1, 0]);

  return (
    <motion.div
      style={{ x, y, rotate, opacity }}
      className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap border border-[#c9c1b4] bg-[#fffdf9] px-4 py-3 text-[11px] shadow-[6px_7px_0_rgba(31,77,70,0.04)] sm:text-[12px]"
    >
      <span className="mr-2 tnum text-[8px] text-muted-foreground">0{index + 1}</span>
      {item.label}
    </motion.div>
  );
}

function ChaosToContext() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  });
  const centralOpacity = useTransform(scrollYProgress, [0.58, 0.76, 0.98], [0, 1, 1]);
  const centralScale = useTransform(scrollYProgress, [0.58, 0.82], [0.82, 1]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.16, 0.63, 0.78], [0, 1, 1, 0]);
  const resolvedOpacity = useTransform(scrollYProgress, [0.68, 0.86], [0, 1]);

  return (
    <section ref={ref} className="relative h-[240vh] border-b border-border bg-[#f4efe6]">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div className="absolute inset-0">
          <svg className="h-full w-full text-[#ded7cb]" viewBox="0 0 1400 900" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 155 H1400 M0 745 H1400 M245 0 V900 M1155 0 V900" fill="none" stroke="currentColor" strokeWidth="1" />
          </svg>
        </div>

        <motion.div style={{ opacity: titleOpacity }} className="absolute left-5 top-24 z-30 max-w-[620px] sm:left-8 lg:left-[8vw] lg:top-[16vh]">
          <SectionKicker number="02">O problema não é falta de informação</SectionKicker>
          <h2 className="font-display text-[42px] leading-[0.98] tracking-[-0.025em] sm:text-[58px] lg:text-[72px]">
            É ela estar em todo lugar ao mesmo tempo.
          </h2>
        </motion.div>

        <div className="absolute inset-0">
          {chaosItems.map((item, index) => (
            <ChaosFragment key={item.label} item={item} progress={scrollYProgress} index={index} />
          ))}
        </div>

        <motion.div
          style={{ opacity: centralOpacity, scale: centralScale }}
          className="absolute left-1/2 top-1/2 z-10 w-[86vw] max-w-[760px] -translate-x-1/2 -translate-y-1/2 border-2 border-primary bg-background px-5 py-6 sm:px-8 sm:py-8"
        >
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <div className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Evento</div>
              <div className="mt-1 font-display text-[28px] sm:text-[34px]">Get Connected Sorocaba</div>
            </div>
            <span className="hidden text-[9px] uppercase tracking-[0.16em] text-primary sm:block">25.09.2026</span>
          </div>
          <div className="grid grid-cols-2 gap-x-6 py-5 text-[11px] sm:grid-cols-4">
            <div><span className="text-muted-foreground">Financeiro</span><strong className="mt-1 block font-medium">No contexto</strong></div>
            <div><span className="text-muted-foreground">Pessoas</span><strong className="mt-1 block font-medium">No contexto</strong></div>
            <div className="mt-4 sm:mt-0"><span className="text-muted-foreground">Tarefas</span><strong className="mt-1 block font-medium">No contexto</strong></div>
            <div className="mt-4 sm:mt-0"><span className="text-muted-foreground">Fornecedores</span><strong className="mt-1 block font-medium">No contexto</strong></div>
          </div>
          <div className="border-t border-border pt-4 text-[12px] text-muted-foreground">
            Você para de procurar a informação. Passa a abrir o evento.
          </div>
        </motion.div>

        <motion.div style={{ opacity: resolvedOpacity }} className="absolute bottom-[8vh] left-1/2 z-30 w-full max-w-[780px] -translate-x-1/2 px-5 text-center">
          <div className="font-display text-[30px] leading-tight sm:text-[42px]">Um evento. Um contexto. Uma operação que faz sentido.</div>
        </motion.div>
      </div>
    </section>
  );
}

function FinanceVisual() {
  return (
    <div className="h-full bg-[#fffdf9] p-5 sm:p-8">
      <div className="flex items-end justify-between border-b border-border pb-6">
        <div>
          <div className="text-[9px] uppercase tracking-[0.17em] text-muted-foreground">Resultado previsto</div>
          <div className="tnum mt-2 font-display text-[42px] sm:text-[56px]">R$ 1.487</div>
        </div>
        <div className="text-right">
          <div className="text-[9px] uppercase tracking-[0.17em] text-muted-foreground">Margem</div>
          <div className="tnum mt-2 text-[20px]">4,8%</div>
        </div>
      </div>
      {[
        ['Faturamento previsto', 'R$ 31.206'],
        ['Despesas previstas', 'R$ 29.719'],
        ['Ponto de equilíbrio', '18 ingressos'],
      ].map(([label, value]) => (
        <div key={label} className="grid grid-cols-[1fr_auto] border-b border-border py-4 text-[12px]">
          <span className="text-muted-foreground">{label}</span>
          <span className="tnum">{value}</span>
        </div>
      ))}
      <div className="mt-7 grid grid-cols-[auto_1fr] gap-4 border-l-2 border-warning pl-4">
        <CircleDollarSign className="mt-0.5 h-4 w-4 text-warning" />
        <div>
          <div className="text-[11px] font-medium">Pagamento do buffet vence amanhã</div>
          <div className="mt-1 text-[10px] text-muted-foreground">R$ 6.500 ainda pendentes</div>
        </div>
      </div>
    </div>
  );
}

function PeopleVisual() {
  return (
    <div className="relative h-full overflow-hidden bg-[#fffdf9] p-6 sm:p-8">
      <div className="flex items-end justify-between border-b border-border pb-5">
        <div>
          <div className="text-[9px] uppercase tracking-[0.17em] text-muted-foreground">Participantes</div>
          <div className="tnum mt-2 font-display text-[48px]">76</div>
        </div>
        <Users className="h-7 w-7 text-primary" />
      </div>
      <div className="mt-6 space-y-5">
        {[
          ['Confirmados', 76, 100],
          ['Check-ins', 68, 89],
          ['Cortesias', 48, 63],
        ].map(([label, value, width]) => (
          <div key={label}>
            <div className="flex justify-between text-[11px]"><span>{label}</span><span className="tnum">{value}</span></div>
            <div className="mt-2 h-1 bg-muted"><motion.div initial={{ width: 0 }} animate={{ width: width + '%' }} transition={{ duration: 0.8 }} className="h-full bg-primary" /></div>
          </div>
        ))}
      </div>
      <div className="absolute bottom-6 right-6 border border-border px-3 py-2 text-[9px] uppercase tracking-[0.15em] text-muted-foreground">Capacidade 98</div>
    </div>
  );
}

function SupplierVisual() {
  return (
    <div className="h-full bg-[#fffdf9]">
      <div className="grid grid-cols-[1.4fr_.7fr_.8fr] border-b border-border px-5 py-3 text-[8px] uppercase tracking-[0.14em] text-muted-foreground sm:px-8">
        <span>Fornecedor</span><span>Valor</span><span>Status</span>
      </div>
      {[
        ['Buffet Sabor', 'R$ 13.500', 'Pagamento amanhã'],
        ['Audio Pro', 'R$ 7.500', '50% pago'],
        ['Espaço Franclei', 'R$ 11.000', 'Confirmado'],
        ['Equipe apoio', 'R$ 3.800', 'Aguardando NF'],
      ].map(([name, value, status], index) => (
        <motion.div
          key={name}
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.08 }}
          className="grid grid-cols-[1.4fr_.7fr_.8fr] items-center border-b border-border px-5 py-5 text-[11px] sm:px-8"
        >
          <span className="font-medium">{name}</span>
          <span className="tnum">{value}</span>
          <span className={index === 0 ? 'text-warning' : 'text-muted-foreground'}>{status}</span>
        </motion.div>
      ))}
    </div>
  );
}

function PlanningVisual() {
  return (
    <div className="h-full bg-[#fffdf9] p-5 sm:p-8">
      <div className="border-l border-border pl-6">
        {[
          ['08:00', 'Credenciamento', 'Concluído'],
          ['09:10', 'Rodadas de networking', 'Em andamento'],
          ['12:10', 'Almoço', 'Próximo'],
          ['14:00', 'Palestra principal', 'Programado'],
        ].map(([time, label, status], index) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08 }}
            className="relative grid grid-cols-[55px_1fr] gap-4 border-b border-border py-5"
          >
            <span className={'absolute -left-[29px] top-[25px] h-[7px] w-[7px] -translate-y-1/2 ' + (index <= 1 ? 'bg-primary' : 'border border-border bg-[#fffdf9]')} />
            <span className="tnum text-[10px] text-muted-foreground">{time}</span>
            <div>
              <div className="text-[12px] font-medium">{label}</div>
              <div className="mt-1 text-[9px] uppercase tracking-[0.12em] text-muted-foreground">{status}</div>
            </div>
          </motion.div>
        ))}
      </div>
      <div className="mt-6 flex items-center gap-3 border-l-2 border-warning pl-4 text-[11px]">
        <Clock3 className="h-4 w-4 text-warning" />
        A programação ultrapassa o horário previsto em 25 min.
      </div>
    </div>
  );
}

function NetworkingMiniVisual() {
  return (
    <div className="relative h-full min-h-[390px] bg-[#163b35] text-[#edf5f2]">
      <div className="absolute inset-x-5 top-5 flex justify-between border-b border-[#42665f] pb-4 text-[9px] uppercase tracking-[0.14em] text-[#9db9b2] sm:inset-x-8">
        <span>Rodada 04</span><span>Mesa 04</span>
      </div>
      <div className="absolute left-1/2 top-1/2 flex h-32 w-36 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center border-2 border-[#80a99f]">
        <span className="text-[9px] uppercase tracking-[0.15em] text-[#9db9b2]">Mesa 04</span>
        <strong className="mt-2 font-display text-[22px] font-normal">NETTOP</strong>
      </div>
      {networkingRounds[1].map((person, index) => (
        <motion.div
          key={person.name}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.07 }}
          className={'absolute flex h-10 w-[74px] -translate-x-1/2 -translate-y-1/2 items-center justify-center bg-[#163b35] text-[9px] ' + (person.name === 'Renan' ? 'border-2 border-[#b5d2cb]' : 'border border-[#4d746c]')}
          style={{ left: person.left, top: person.top }}
        >
          {person.name}
        </motion.div>
      ))}
    </div>
  );
}

function ChapterVisual({ id }) {
  if (id === 'financeiro') return <FinanceVisual />;
  if (id === 'pessoas') return <PeopleVisual />;
  if (id === 'fornecedores') return <SupplierVisual />;
  if (id === 'planejamento') return <PlanningVisual />;
  return <NetworkingMiniVisual />;
}

function ProductStory() {
  const ref = useRef(null);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  });

  useMotionValueEvent(scrollYProgress, 'change', (value) => {
    const next = Math.min(chapters.length - 1, Math.floor(value * chapters.length));
    setActive(next);
  });

  const progress = useSpring(scrollYProgress, { stiffness: 85, damping: 24, mass: 0.3 });

  return (
    <section id="produto" ref={ref} className="relative h-[470vh] bg-background">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <motion.div style={{ scaleX: progress }} className="absolute left-0 top-0 h-[2px] w-full origin-left bg-primary" />

        <div className="mx-auto grid w-full max-w-[1240px] gap-9 px-5 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:gap-16">
          <div className="self-center">
            <SectionKicker number="03">Por dentro do Mesa Certa</SectionKicker>

            <div className="hidden border-t border-border lg:block">
              {chapters.map((item, index) => (
                <div key={item.id} className={'grid grid-cols-[42px_1fr] border-b border-border py-3.5 text-[11px] transition-colors duration-500 ' + (index === active ? 'text-primary' : 'text-muted-foreground')}>
                  <span className="tnum">0{index + 1}</span>
                  <span>{item.eyebrow.split(' · ')[1]}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 min-h-[290px] lg:mt-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={chapters[active].id}
                  initial={{ opacity: 0, y: 22 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -18 }}
                  transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="text-[9px] uppercase tracking-[0.18em] text-primary">{chapters[active].eyebrow}</div>
                  <h2 className="mt-4 max-w-[590px] font-display text-[36px] leading-[1.02] tracking-[-0.02em] sm:text-[46px] lg:text-[54px]">
                    {chapters[active].title}
                  </h2>
                  <p className="mt-5 max-w-[500px] text-[13px] leading-6 text-muted-foreground sm:text-[14px] sm:leading-7">
                    {chapters[active].body}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <div className="self-center">
            <div className="relative min-h-[430px] border border-[#bcb4a6] bg-[#fffdf9] shadow-[18px_24px_0_rgba(31,77,70,0.06)] sm:min-h-[500px]">
              <div className="absolute inset-x-0 top-0 z-10 flex h-11 items-center justify-between border-b border-border bg-[#fffdf9] px-4 text-[8px] uppercase tracking-[0.16em] text-muted-foreground sm:px-6">
                <span>{chapters[active].eyebrow}</span>
                <span>Evento · Get Connected Sorocaba</span>
              </div>
              <div className="absolute inset-x-0 bottom-0 top-11">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={chapters[active].id}
                    initial={{ opacity: 0, scale: 0.985, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 1.01, y: -8 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full"
                  >
                    <ChapterVisual id={chapters[active].id} />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-[9px] uppercase tracking-[0.13em] text-muted-foreground">
              <span>Role para explorar</span>
              <span className="tnum">0{active + 1} / 05</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function NetworkingStory() {
  const ref = useRef(null);
  const [round, setRound] = useState(0);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  });

  useMotionValueEvent(scrollYProgress, 'change', (value) => {
    setRound(Math.min(2, Math.floor(value * 3)));
  });

  return (
    <section id="networking" ref={ref} className="relative h-[260vh] bg-[#163b35] text-[#edf5f2]">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <svg className="absolute inset-0 h-full w-full text-[#264e47]" viewBox="0 0 1400 900" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 190 H1400 M0 710 H1400 M235 0 V900 M1165 0 V900" fill="none" stroke="currentColor" strokeWidth="1" />
        </svg>

        <div className="relative z-10 mx-auto grid w-full max-w-[1240px] gap-12 px-5 sm:px-8 lg:grid-cols-[.72fr_1.28fr] lg:items-center lg:gap-20">
          <div>
            <SectionKicker number="04" light>Networking que existe no espaço</SectionKicker>
            <h2 className="font-display text-[42px] leading-[0.98] tracking-[-0.025em] sm:text-[58px] lg:text-[66px]">
              Você vê a rodada mudar. Não só uma lista atualizar.
            </h2>
            <p className="mt-6 max-w-[500px] text-[13px] leading-6 text-[#bad0ca] sm:text-[14px] sm:leading-7">
              O módulo nasceu de uma operação real de networking. Por isso a interface trata mesa, assento, anfitrião e movimento como parte do problema — não como detalhe decorativo.
            </p>

            <div className="mt-8 grid grid-cols-3 border-y border-[#42665f] py-5">
              {[['76', 'convidados'], ['14', 'mesas'], ['14', 'rodadas']].map(([value, label]) => (
                <div key={label}>
                  <div className="tnum text-[24px]">{value}</div>
                  <div className="mt-1 text-[8px] uppercase tracking-[0.14em] text-[#9db9b2]">{label}</div>
                </div>
              ))}
            </div>

            <p className="mt-4 max-w-[500px] text-[9px] leading-5 text-[#88a69f]">
              O motor que deu origem ao módulo foi usado no Get Connected Sorocaba 2026. Esse histórico se refere ao motor original, não ao uso da plataforma completa em produção.
            </p>
          </div>

          <div>
            <div className="relative min-h-[440px] border border-[#42665f] bg-[#12322d] sm:min-h-[520px]">
              <div className="absolute inset-x-5 top-5 z-20 flex items-center justify-between border-b border-[#42665f] pb-4 text-[9px] uppercase tracking-[0.16em] text-[#9db9b2] sm:inset-x-7">
                <span>Rodada 0{round + 1}</span>
                <span>Mesa 04 · NETTOP</span>
              </div>

              <div className="absolute left-1/2 top-1/2 flex h-36 w-40 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center border-2 border-[#80a99f] sm:h-40 sm:w-44">
                <span className="text-[9px] uppercase tracking-[0.16em] text-[#9db9b2]">Mesa 04</span>
                <strong className="mt-2 font-display text-[24px] font-normal">NETTOP</strong>
                <span className="mt-3 text-[8px] uppercase tracking-[0.12em] text-[#71938b]">6 / 7 lugares</span>
              </div>

              {networkingRounds[round].map((person) => (
                <motion.div
                  key={person.name}
                  animate={{ left: person.left, top: person.top }}
                  transition={{ type: 'spring', stiffness: 85, damping: 18, mass: 0.65 }}
                  className={'absolute z-10 flex h-11 w-[84px] -translate-x-1/2 -translate-y-1/2 items-center justify-center bg-[#12322d] text-[9px] sm:w-[100px] ' + (person.name === 'Renan' ? 'border-2 border-[#b5d2cb]' : 'border border-[#4d746c]')}
                >
                  {person.name}
                </motion.div>
              ))}

              <div className="absolute bottom-5 left-5 right-5 flex gap-2">
                {[0, 1, 2].map((index) => (
                  <div key={index} className={'h-[2px] flex-1 transition-colors duration-500 ' + (index <= round ? 'bg-[#a9c9c1]' : 'bg-[#315a52]')} />
                ))}
              </div>
            </div>
            <div className="mt-4 flex justify-between text-[8px] uppercase tracking-[0.15em] text-[#73928b]">
              <span>Continue rolando</span>
              <span>A composição muda com a rodada</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PlanSection() {
  return (
    <section id="planos" className="relative overflow-hidden border-b border-border bg-[#f2ede4]">
      <div className="absolute right-[7vw] top-0 h-full w-px bg-[#ded7ca]" />
      <div className="absolute left-[7vw] top-0 h-full w-px bg-[#ded7ca]" />

      <div className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32">
        <div className="grid gap-12 lg:grid-cols-[.72fr_1.28fr] lg:gap-20">
          <div>
            <SectionKicker number="06">Oferta proposta</SectionKicker>
            <h2 className="font-display text-[42px] leading-[0.98] tracking-[-0.025em] sm:text-[58px]">
              Escolha como você quer entrar. Não o que você pode usar.
            </h2>
            <p className="mt-6 max-w-[460px] text-[13px] leading-6 text-muted-foreground">
              A proposta inicial mantém os mesmos recursos nos dois formatos. O que muda é somente a forma de contratação.
            </p>
            <div className="mt-8 border-l-2 border-primary pl-4 text-[11px] leading-5 text-muted-foreground">
              A venda ainda depende da liberação operacional. Esta página não simula escassez, checkout disponível ou benefício que ainda não foi comprovado.
            </div>
          </div>

          <div>
            <div className="grid border-t-2 border-primary sm:grid-cols-2">
              <div className="border-b border-border py-7 pr-0 sm:border-r sm:pr-8">
                <div className="text-[9px] uppercase tracking-[0.17em] text-muted-foreground">Mensal</div>
                <div className="mt-6 flex items-end gap-2">
                  <span className="font-display text-[52px] leading-none">R$ 97</span>
                  <span className="pb-1 text-[11px] text-muted-foreground">/ mês</span>
                </div>
                <p className="mt-4 max-w-[320px] text-[12px] leading-5 text-muted-foreground">Cobrança recorrente mensal. Menor compromisso inicial.</p>
                <div className="mt-7 space-y-2 border-t border-border pt-5 text-[11px]">
                  {['1 organização', '1 responsável', 'Até 3 eventos ativos', 'Mesmos módulos liberados'].map((item) => (
                    <div key={item} className="flex gap-2"><Check className="h-3.5 w-3.5 text-primary" />{item}</div>
                  ))}
                </div>
              </div>

              <div className="border-b border-border py-7 sm:pl-8">
                <div className="flex items-start justify-between gap-4">
                  <div className="text-[9px] uppercase tracking-[0.17em] text-primary">12 meses</div>
                  <div className="tnum text-[9px] text-muted-foreground">− R$ 367</div>
                </div>
                <div className="mt-6 font-display text-[52px] leading-none">R$ 797</div>
                <p className="mt-4 max-w-[320px] text-[12px] leading-5 text-muted-foreground">Pagamento único. Doze meses de acesso, sem renovação automática.</p>
                <div className="mt-7 border-t border-border pt-5 text-[11px]">
                  <div className="flex justify-between py-1.5"><span className="text-muted-foreground">12 mensalidades</span><span className="tnum">R$ 1.164</span></div>
                  <div className="flex justify-between py-1.5"><span className="text-muted-foreground">12 meses</span><span className="tnum">R$ 797</span></div>
                  <div className="mt-2 flex justify-between border-t border-border pt-3 font-medium"><span>Diferença</span><span className="tnum text-positive">R$ 367</span></div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              <span>Sem “mais vendido” inventado</span>
              <span>Sem bônus fictício</span>
              <span>Sem contagem regressiva</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function LandingPage() {
  const reduceMotion = useReducedMotion();
  const [menuOpen, setMenuOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(0);
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 110, damping: 28, mass: 0.3 });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <motion.div style={{ scaleX: smoothProgress }} className="fixed left-0 top-0 z-[80] h-[2px] w-full origin-left bg-primary" />

      <header className="fixed inset-x-0 top-0 z-[70] border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-[72px] max-w-[1240px] items-center justify-between px-5 sm:px-8">
          <button type="button" onClick={() => scrollToSection('top', reduceMotion)} className="focus-ring">
            <BrandMark />
          </button>

          <nav className="hidden items-center gap-7 text-[11px] text-muted-foreground lg:flex">
            <NavButton target="produto" reduceMotion={reduceMotion}>Produto</NavButton>
            <NavButton target="networking" reduceMotion={reduceMotion}>Networking</NavButton>
            <NavButton target="como-funciona" reduceMotion={reduceMotion}>Como funciona</NavButton>
            <NavButton target="planos" reduceMotion={reduceMotion}>Planos</NavButton>
            <NavButton target="duvidas" reduceMotion={reduceMotion}>Dúvidas</NavButton>
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link to="/login" className="px-3 py-2 text-[11px] text-muted-foreground transition-colors hover:text-foreground">Entrar</Link>
            <NavButton target="produto" reduceMotion={reduceMotion} className="border border-primary bg-primary px-4 py-2.5 text-primary-foreground hover:bg-primary/90">
              Conhecer por dentro
            </NavButton>
          </div>

          <button type="button" className="p-2 lg:hidden" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuOpen}>
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-border bg-background lg:hidden"
            >
              <div className="grid gap-1 px-5 py-5 text-[13px]">
                {[
                  ['produto', 'Produto'],
                  ['networking', 'Networking'],
                  ['como-funciona', 'Como funciona'],
                  ['planos', 'Planos'],
                  ['duvidas', 'Dúvidas'],
                ].map(([target, label]) => (
                  <button
                    key={target}
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      window.setTimeout(() => scrollToSection(target, reduceMotion), 120);
                    }}
                    className="border-b border-border py-3 text-left"
                  >
                    {label}
                  </button>
                ))}
                <Link to="/login" className="mt-2 py-3 text-primary">Entrar na plataforma</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main id="top">
        <section className="relative min-h-screen overflow-hidden border-b border-border pt-[72px]">
          <HeroLines progress={smoothProgress} />

          <div className="relative z-10 mx-auto grid min-h-[calc(100vh-72px)] max-w-[1240px] gap-12 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:gap-14">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.1 }}
                className="text-[9px] font-medium uppercase tracking-[0.24em] text-muted-foreground"
              >
                Planejamento e operação de eventos
              </motion.div>

              <div className="landing-mask mt-6">
                <motion.h1
                  initial={{ y: '110%' }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.95, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
                  className="max-w-[700px] font-display text-[49px] leading-[0.94] tracking-[-0.035em] sm:text-[67px] lg:text-[76px]"
                >
                  Você não precisa organizar o próximo evento do zero.
                </motion.h1>
              </div>

              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.55 }}
                className="mt-7 max-w-[610px] text-[14px] leading-7 text-muted-foreground sm:text-[16px]"
              >
                Abra o evento e encontre financeiro, participantes, fornecedores, tarefas e programação no contexto certo. Quando houver rodadas de negócio, o networking também entra na operação.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.72 }}
                className="mt-8 flex flex-wrap items-center gap-5"
              >
                <NavButton target="produto" reduceMotion={reduceMotion} className="group inline-flex items-center gap-3 border border-primary bg-primary px-5 py-3 text-[12px] font-medium text-primary-foreground">
                  Ver a plataforma por dentro
                  <ArrowDownRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:translate-y-1" />
                </NavButton>
                <NavButton target="como-funciona" reduceMotion={reduceMotion} className="inline-flex items-center gap-2 border-b border-foreground py-2 text-[12px]">
                  Entender a lógica
                </NavButton>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-10 flex items-center gap-4 text-[9px] uppercase tracking-[0.15em] text-muted-foreground"
              >
                <span className="h-px w-9 bg-border" />
                Role. A página se organiza com você.
              </motion.div>
            </div>

            <HeroProduct />
          </div>

          <div className="relative z-20 border-t border-border bg-background/80 py-3">
            <motion.div
              animate={reduceMotion ? {} : { x: ['0%', '-50%'] }}
              transition={{ duration: 28, ease: 'linear', repeat: Infinity }}
              className="flex w-max whitespace-nowrap text-[9px] uppercase tracking-[0.18em] text-muted-foreground"
            >
              {Array.from({ length: 2 }).map((_, loopIndex) => (
                <div key={loopIndex} className="flex">
                  {['Financeiro', 'Participantes', 'Fornecedores', 'Tarefas', 'Programação', 'Capacidade', 'Networking', 'Financeiro', 'Participantes', 'Fornecedores', 'Tarefas', 'Programação', 'Capacidade', 'Networking'].map((item, index) => (
                    <span key={loopIndex + '-' + index} className="flex items-center">
                      <span className="px-6">{item}</span>
                      <span className="h-1 w-1 bg-primary" />
                    </span>
                  ))}
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        <ChaosToContext />

        <ProductStory />

        <section id="como-funciona" className="relative border-y border-border bg-[#fffdf9]">
          <div className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32">
            <SectionKicker number="05">A lógica é simples</SectionKicker>
            <div className="grid gap-12 lg:grid-cols-[.72fr_1.28fr] lg:gap-20">
              <div>
                <h2 className="font-display text-[42px] leading-[0.98] tracking-[-0.025em] sm:text-[58px]">
                  O software não deveria pedir para você aprender a pensar como ele.
                </h2>
                <p className="mt-6 max-w-[470px] text-[13px] leading-6 text-muted-foreground sm:text-[14px] sm:leading-7">
                  A estrutura segue a forma como o organizador já raciocina: primeiro o evento, depois tudo o que pertence a ele.
                </p>
              </div>

              <div className="border-t-2 border-primary">
                {[
                  ['01', 'Crie o evento', 'Nome, data, público e formato. Você liga apenas o que precisa.'],
                  ['02', 'Coloque a operação dentro dele', 'Pessoas, fornecedores, tarefas, programação e financeiro deixam de viver separados.'],
                  ['03', 'Abra e veja o que pede decisão', 'O objetivo não é mostrar mais dados. É tornar o próximo passo mais óbvio.'],
                ].map(([number, title, body], index) => (
                  <motion.div
                    key={number}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.55 }}
                    transition={{ duration: 0.5, delay: index * 0.06 }}
                    className="grid gap-4 border-b border-border py-7 sm:grid-cols-[52px_220px_1fr] sm:gap-8"
                  >
                    <div className="tnum text-[10px] text-primary">{number}</div>
                    <div className="font-display text-[26px]">{title}</div>
                    <div className="max-w-[500px] text-[12px] leading-6 text-muted-foreground">{body}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <NetworkingStory />

        <section className="border-b border-border">
          <div className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32">
            <SectionKicker number="05.1">Origem prática</SectionKicker>
            <div className="grid gap-12 lg:grid-cols-[.85fr_1.15fr] lg:gap-20">
              <div>
                <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Get Connected Sorocaba 2026</div>
                <div className="mt-4 font-display text-[44px] leading-none sm:text-[62px]">76 · 14 · 14</div>
                <div className="mt-3 text-[10px] uppercase tracking-[0.15em] text-muted-foreground">convidados · mesas · rodadas</div>
              </div>
              <div className="max-w-[690px]">
                <h2 className="font-display text-[35px] leading-[1.05] sm:text-[46px]">
                  Antes de ser um módulo, parte dessa lógica precisou funcionar com pessoas de verdade esperando a próxima rodada.
                </h2>
                <p className="mt-5 text-[13px] leading-7 text-muted-foreground">
                  O motor original que inspirou o módulo foi usado na operação do Get Connected Sorocaba 2026. É dessa experiência que vem a obsessão com assentos visíveis, rotas compreensíveis e conflitos que não podem ser escondidos.
                </p>
              </div>
            </div>
          </div>
        </section>

        <PlanSection />

        <section id="duvidas" className="border-b border-border bg-background">
          <div className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32">
            <div className="grid gap-12 lg:grid-cols-[.7fr_1.3fr] lg:gap-20">
              <div>
                <SectionKicker number="07">Antes de mudar sua rotina</SectionKicker>
                <h2 className="font-display text-[42px] leading-[0.98] tracking-[-0.025em] sm:text-[58px]">As perguntas que deveriam vir antes da compra.</h2>
              </div>

              <div className="border-t-2 border-primary">
                {faq.map((item, index) => (
                  <div key={item.question} className="border-b border-border">
                    <button
                      type="button"
                      onClick={() => setFaqOpen(faqOpen === index ? -1 : index)}
                      className="flex w-full items-center justify-between gap-8 py-5 text-left text-[13px] font-medium"
                      aria-expanded={faqOpen === index}
                    >
                      <span>{item.question}</span>
                      <ChevronDown className={'h-4 w-4 shrink-0 transition-transform duration-300 ' + (faqOpen === index ? 'rotate-180' : '')} />
                    </button>
                    <AnimatePresence initial={false}>
                      {faqOpen === index && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <p className="max-w-[720px] pb-6 text-[12px] leading-6 text-muted-foreground sm:text-[13px]">{item.answer}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-[#111918] text-[#edf3f0]">
          <svg className="absolute inset-0 h-full w-full text-[#20312e]" viewBox="0 0 1400 700" preserveAspectRatio="none" aria-hidden="true">
            <path d="M70 590 H1330 V110 H340 V460 H1030" fill="none" stroke="currentColor" strokeWidth="1" />
            <circle cx="340" cy="460" r="5" fill="#7fa69d" />
            <circle cx="1030" cy="460" r="5" fill="#7fa69d" />
          </svg>

          <div className="relative z-10 mx-auto max-w-[1240px] px-5 py-28 sm:px-8 sm:py-36">
            <div className="max-w-[980px]">
              <div className="text-[9px] uppercase tracking-[0.22em] text-[#8fa7a1]">Mesa Certa</div>
              <h2 className="mt-6 font-display text-[48px] leading-[0.95] tracking-[-0.03em] sm:text-[70px] lg:text-[84px]">
                Talvez o que faltava no seu evento não fosse mais uma ferramenta.
              </h2>
              <p className="mt-5 max-w-[690px] font-display text-[28px] leading-tight text-[#a9bdb7] sm:text-[36px]">
                Era um lugar em que tudo finalmente fizesse sentido junto.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link to="/login" className="group inline-flex items-center gap-3 border border-[#86a9a0] px-5 py-3 text-[12px] text-[#edf3f0] transition-colors hover:border-[#bfd1cc]">
                  Entrar na plataforma
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
                <button type="button" onClick={() => scrollToSection('top', reduceMotion)} className="px-3 py-3 text-[11px] text-[#8fa7a1]">
                  Voltar ao início
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#283936] bg-[#111918] text-[#849994]">
        <div className="mx-auto grid max-w-[1240px] gap-8 px-5 py-10 sm:px-8 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <BrandMark light />
            <p className="mt-4 max-w-[460px] text-[10px] leading-5">Planejamento e operação de eventos, com financeiro por evento e networking opcional.</p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-[10px]">
            <NavButton target="produto" reduceMotion={reduceMotion} className="text-[#849994] hover:text-[#edf3f0]">Produto</NavButton>
            <NavButton target="networking" reduceMotion={reduceMotion} className="text-[#849994] hover:text-[#edf3f0]">Networking</NavButton>
            <NavButton target="planos" reduceMotion={reduceMotion} className="text-[#849994] hover:text-[#edf3f0]">Planos</NavButton>
            <Link to="/login" className="hover:text-[#edf3f0]">Entrar</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
