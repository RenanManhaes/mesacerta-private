import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  CalendarClock,
  Check,
  ChevronDown,
  Menu,
  Minus,
  Receipt,
  Shield,
  Truck,
  Users,
  Utensils,
  X,
} from 'lucide-react';

const navLinks = [
  { id: 'plataforma', label: 'Plataforma' },
  { id: 'como-funciona', label: 'Como funciona' },
  { id: 'networking', label: 'Networking' },
  { id: 'planos', label: 'Planos' },
  { id: 'duvidas', label: 'Dúvidas' },
];

const marquee = [
  'Financeiro',
  'Participantes',
  'Fornecedores',
  'Tarefas',
  'Programação',
  'Capacidade',
  'Rodadas de negócio',
  'Mesas',
  'Anfitriões',
  'Roteiros',
];

const numbers = [
  { value: '76', label: 'convidados distribuídos no Get Connected Sorocaba 2026' },
  { value: '14', label: 'mesas de patrocinador, uma rodada a cada 8 minutos' },
  { value: '0', label: 'convidados repetindo mesa na grade final' },
  { value: '6', label: 'áreas do evento na mesma leitura: do financeiro ao networking' },
];

const audience = [
  {
    title: 'Produz eventos e perde tempo remontando contexto',
    body: 'Cada evento recomeça do zero, com planilha nova, grupo novo e a mesma pergunta: onde estava aquele número?',
  },
  {
    title: 'Quer saber se o evento dá lucro antes do fim',
    body: 'Receitas, despesas e compromissos ficam dentro do projeto, então o resultado aparece durante a operação, não depois.',
  },
  {
    title: 'Trabalha com equipe e precisa que todos vejam o mesmo',
    body: 'Participantes, fornecedores e tarefas em um só lugar, com o estado atualizado para quem abre a tela agora.',
  },
  {
    title: 'Faz rodada de negócio e sofre para montar a escala',
    body: 'O motor distribui os convidados entre as mesas sem ninguém repetir mesa e sem o patrocinador receber a mesma dupla.',
  },
  {
    title: 'Quer repetir o que deu certo na próxima edição',
    body: 'O histórico de cada evento fica guardado por projeto e serve de base para o próximo, em vez de virar arquivo morto.',
  },
];

const modules = [
  {
    icon: Receipt,
    title: 'Financeiro por evento',
    body: 'Receitas, despesas e compromissos dentro do contexto do projeto, com o resultado visível a qualquer momento.',
    tags: ['Receitas', 'Despesas', 'Resultado'],
  },
  {
    icon: Users,
    title: 'Participantes e capacidade',
    body: 'Confirmações, presença e limite de pessoas deixam de ser contagem solta e passam a fazer parte da operação.',
    tags: ['Confirmações', 'Presença', 'Capacidade'],
  },
  {
    icon: Truck,
    title: 'Fornecedores',
    body: 'O que foi combinado, quanto custa e o que ainda depende de ação, perto o suficiente para não depender da memória.',
    tags: ['Contatos', 'Custos', 'Pendências'],
  },
  {
    icon: CalendarClock,
    title: 'Tarefas e programação',
    body: 'Horários, responsáveis e etapas que antecipam o atraso antes dele virar improviso no dia.',
    tags: ['Cronograma', 'Responsáveis', 'Status'],
  },
  {
    icon: Utensils,
    title: 'Rodadas de negócio',
    body: 'Mesas, anfitriões e rotas com representação espacial, porque uma rodada não cabe numa planilha.',
    tags: ['Mesas', 'Rotas', 'Conflitos'],
  },
  {
    icon: BarChart3,
    title: 'Leitura do evento',
    body: 'Os números saem de uma fonte única, então a tela de resumo e a de detalhe nunca contam histórias diferentes.',
    tags: ['Resumo', 'Detalhe', 'Histórico'],
  },
];

const steps = [
  {
    title: 'Crie o evento',
    body: 'Nome, data, local e capacidade. A partir daí todo número que você lançar pertence a esse projeto.',
  },
  {
    title: 'Monte o financeiro',
    body: 'Receitas previstas, despesas e compromissos com fornecedor, para o resultado aparecer enquanto o evento ainda está em pé.',
  },
  {
    title: 'Traga as pessoas',
    body: 'Participantes, confirmações e presença, com a capacidade da casa sempre à vista.',
  },
  {
    title: 'Organize a operação',
    body: 'Tarefas, responsáveis e programação do dia, com o que está atrasado aparecendo antes da véspera.',
  },
  {
    title: 'Rode o networking',
    body: 'Se o evento tiver rodada de negócio, o motor monta a escala e entrega o roteiro de cada convidado.',
  },
];

const comparison = [
  { need: 'Financeiro separado por evento', sheet: 'Uma aba por evento', group: 'Não existe', mc: 'Nativo' },
  { need: 'Participantes e capacidade juntos', sheet: 'Contagem manual', group: 'Lista solta', mc: 'Mesma leitura' },
  { need: 'Tarefa com responsável e prazo', sheet: 'Cor na célula', group: 'Mensagem fixada', mc: 'Com status' },
  { need: 'Escala de rodada de negócio', sheet: 'Tentativa e erro', group: 'Sorteio na hora', mc: 'Motor dedicado' },
  { need: 'Roteiro individual pronto', sheet: 'Digitar à mão', group: 'Não existe', mc: 'Texto e PDF' },
  { need: 'Histórico para a próxima edição', sheet: 'Arquivo perdido', group: 'Some com o grupo', mc: 'Fica no evento' },
];

const security = [
  { icon: Shield, title: 'Acesso por organização', body: 'Cada organização enxerga apenas os próprios eventos e os próprios números.' },
  { icon: Users, title: 'Login com conta própria', body: 'Autenticação por e-mail e senha ou conta Google, com sessão controlada.' },
  { icon: BarChart3, title: 'Número de uma fonte só', body: 'As telas leem os mesmos seletores, então o resumo e o detalhe nunca divergem.' },
];

const faq = [
  {
    question: 'Minha planilha já funciona. Por que eu mudaria?',
    answer:
      'Se ela resolve sua operação inteira, talvez você não precise mudar. O Mesa Certa faz sentido quando financeiro, participantes, fornecedores, tarefas e programação começam a viver em lugares diferentes e você precisa reconstruir o contexto toda vez que abre um evento.',
  },
  {
    question: 'Serve para um evento sem networking?',
    answer:
      'Sim. Networking é opcional. O núcleo do Mesa Certa é planejamento e operação do evento, com o financeiro separado por projeto.',
  },
  {
    question: 'Posso organizar vários eventos ao mesmo tempo?',
    answer:
      'Sim. Cada evento mantém seus próprios dados, números e pendências. A oferta comercial inicial considera até três eventos ativos simultaneamente.',
  },
  {
    question: 'Como funciona a rodada de negócio?',
    answer:
      'O motor distribui os convidados entre as mesas dos patrocinadores sem ninguém repetir mesa, respeita quem fica fixo e evita que o mesmo patrocinador receba a mesma dupla duas vezes. Ele rodou no Get Connected Sorocaba 2026, com 76 convidados, 14 mesas e 14 rodadas.',
  },
  {
    question: 'O Mesa Certa vende ingressos?',
    answer:
      'A proposta atual é planejamento e operação. Bilheteria e processamento de pagamentos não fazem parte da promessa comercial desta versão.',
  },
  {
    question: 'Preciso instalar alguma coisa?',
    answer: 'Não. O Mesa Certa roda no navegador, em qualquer computador da equipe.',
  },
];

function BrandMark() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-[#6fe0cb] to-[#0e6b66] font-display text-[11px] font-bold text-[#04100e]">
        MC
      </span>
      <span className="font-display text-[17px] font-semibold tracking-[-0.01em] text-[#f2f7f6]">Mesa Certa</span>
    </span>
  );
}

function Eyebrow({ children }) {
  return (
    <p className="mb-3.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5fd6c2]">{children}</p>
  );
}

function TableArt() {
  const seats = [
    { name: 'Ana · fixa', host: true },
    { name: 'Camila' },
    { name: 'Renato' },
    { name: 'James' },
    { name: 'Jaqueline' },
    { name: 'Michael' },
    { name: 'Araceli' },
  ];

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[420px]" aria-hidden="true">
      <div className="absolute inset-[8%] rounded-full border border-dashed border-[#5fd6c2]/30" />
      {seats.map((seat, index) => {
        const angle = (index * 2 * Math.PI) / seats.length - Math.PI / 2;
        const radius = 41;
        return (
          <span
            key={seat.name}
            style={{
              left: `${50 + radius * Math.cos(angle)}%`,
              top: `${50 + radius * Math.sin(angle)}%`,
              transform: 'translate(-50%, -50%)',
            }}
            className={`absolute whitespace-nowrap rounded-xl border px-2.5 py-1.5 text-[11px] ${
              seat.host
                ? 'border-[#0e6b66] bg-[#0e6b66] font-semibold text-[#eafffb]'
                : 'border-[#1e3330] bg-[#11211f] text-[#a9bdbb]'
            }`}
          >
            {seat.name}
          </span>
        );
      })}
      <div className="absolute left-1/2 top-1/2 grid aspect-square w-[38%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[radial-gradient(circle_at_34%_28%,#6fe0cb,#0e6b66_70%)] text-center text-[#04100e] shadow-[0_20px_50px_rgba(14,107,102,0.4)]">
        <span>
          <span className="block text-[9px] font-semibold uppercase tracking-[0.14em] opacity-70">Patrocinador</span>
          <span className="block px-2 font-display text-[15px] font-bold leading-tight">INTERFOCUS</span>
        </span>
      </div>
    </div>
  );
}

function FaqItem({ item, open, onToggle }) {
  return (
    <div className="rounded-2xl border border-[#1e3330] bg-[#11211f]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-4 px-5 py-4 text-left text-[15px] font-semibold text-[#f2f7f6]"
      >
        {item.question}
        <span className="ml-auto text-[#5fd6c2]">
          {open ? <Minus className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </button>
      {open ? <p className="px-5 pb-5 text-[14px] leading-6 text-[#a9bdbb]">{item.answer}</p> : null}
    </div>
  );
}

function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    document.title = 'Mesa Certa — planejamento e operação de eventos';
  }, []);

  return (
    <div className="min-h-screen bg-[#07100f] font-sans text-[#f2f7f6]">
      <header className="sticky top-0 z-40 border-b border-[#132421] bg-[#07100f]/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1180px] items-center gap-6 px-5 py-3.5 sm:px-8">
          <a href="#topo" className="shrink-0">
            <BrandMark />
          </a>
          <nav className="ml-auto hidden gap-6 text-[14px] text-[#a9bdbb] lg:flex">
            {navLinks.map((link) => (
              <a key={link.id} href={`#${link.id}`} className="transition-colors hover:text-[#5fd6c2]">
                {link.label}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Link to="/login" className="hidden px-3 py-2 text-[13px] text-[#a9bdbb] transition-colors hover:text-[#f2f7f6] sm:block">
              Entrar
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-full bg-[#5fd6c2] px-4 py-2.5 text-[14px] font-semibold text-[#04100e] transition-colors hover:bg-[#7be3d1]"
            >
              Criar conta
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              className="grid h-10 w-10 place-items-center rounded-full border border-[#1e3330] text-[#a9bdbb] lg:hidden"
              aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            >
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {menuOpen ? (
          <nav className="border-t border-[#132421] px-5 py-3 text-[15px] text-[#a9bdbb] lg:hidden">
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={() => setMenuOpen(false)}
                className="block py-2.5 transition-colors hover:text-[#5fd6c2]"
              >
                {link.label}
              </a>
            ))}
          </nav>
        ) : null}
      </header>

      <main id="topo">
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-x-[-20%] -top-32 h-[620px] bg-[radial-gradient(circle_at_30%_25%,rgba(95,214,194,0.20),transparent_60%),radial-gradient(circle_at_75%_12%,rgba(232,184,74,0.10),transparent_55%)]" />
          <div className="relative mx-auto grid max-w-[1180px] items-center gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#1e3330] bg-[#11211f]/70 px-3.5 py-1.5 text-[12.5px] text-[#a9bdbb]">
                <span className="font-semibold text-[#5fd6c2]">Plataforma de eventos</span> · nascida em operação real
              </span>
              <h1 className="mt-5 font-display text-[clamp(34px,5.4vw,58px)] font-bold leading-[1.04] tracking-[-0.02em]">
                A operação inteira do evento <span className="text-[#5fd6c2]">em uma leitura só</span>
              </h1>
              <p className="mt-5 max-w-[56ch] text-[17px] leading-7 text-[#a9bdbb]">
                Financeiro, participantes, fornecedores, tarefas e programação dentro do mesmo projeto. E, quando o evento
                tem rodada de negócio, um motor que monta a escala sem ninguém repetir mesa.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-full bg-[#5fd6c2] px-5 py-3 text-[15px] font-semibold text-[#04100e] transition-colors hover:bg-[#7be3d1]"
                >
                  Criar conta <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#plataforma"
                  className="inline-flex items-center gap-2 rounded-full border border-[#1e3330] px-5 py-3 text-[15px] text-[#f2f7f6] transition-colors hover:border-[#5fd6c2] hover:text-[#5fd6c2]"
                >
                  Conhecer a plataforma
                </a>
              </div>
              <p className="mt-4 text-[13px] text-[#74908d]">
                Roda no navegador, sem instalação. Cada organização enxerga apenas os próprios eventos.
              </p>
            </div>
            <TableArt />
          </div>
        </section>

        <div className="overflow-hidden border-y border-[#132421] bg-[#0c1a18] py-3.5">
          <div className="flex w-max gap-8 whitespace-nowrap text-[12.5px] font-semibold uppercase tracking-[0.14em] text-[#74908d]">
            {[...marquee, ...marquee].map((item, index) => (
              <span key={`${item}-${index}`} className="flex items-center gap-8">
                {item}
                <span className="h-1 w-1 rounded-full bg-[#0e6b66]" />
              </span>
            ))}
          </div>
        </div>

        <section className="mx-auto max-w-[1180px] px-5 py-16 sm:px-8 sm:py-24">
          <div className="max-w-[720px]">
            <Eyebrow>De onde o Mesa Certa veio</Eyebrow>
            <h2 className="font-display text-[clamp(26px,3.6vw,40px)] font-bold leading-[1.12] tracking-[-0.015em]">
              Um motor que já rodou evento de verdade, dentro de uma plataforma
            </h2>
            <p className="mt-4 text-[17px] leading-7 text-[#a9bdbb]">
              O cálculo das rodadas de negócio nasceu no Get Connected Sorocaba 2026 e foi portado para cá sem mudar a
              lógica. Em volta dele entraram as áreas que decidem se o evento fecha no azul.
            </p>
          </div>
          <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-[#1e3330] bg-[#1e3330] sm:grid-cols-2 lg:grid-cols-4">
            {numbers.map((item) => (
              <div key={item.label} className="bg-[#0c1a18] px-6 py-7">
                <span className="block font-display text-[clamp(30px,4vw,42px)] font-bold leading-none tabular-nums">{item.value}</span>
                <span className="mt-2.5 block text-[13.5px] leading-6 text-[#a9bdbb]">{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section id="plataforma" className="border-t border-[#132421] bg-[#0a1615]">
          <div className="mx-auto max-w-[1180px] px-5 py-16 sm:px-8 sm:py-24">
            <div className="max-w-[720px]">
              <Eyebrow>Para quem é</Eyebrow>
              <h2 className="font-display text-[clamp(26px,3.6vw,40px)] font-bold leading-[1.12] tracking-[-0.015em]">
                O Mesa Certa é para você se…
              </h2>
            </div>
            <div className="mt-10 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {audience.map((item, index) => (
                <article key={item.title} className="rounded-2xl border border-[#1e3330] bg-[#11211f] p-6">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#5fd6c2]/12 font-mono text-[12.5px] font-semibold text-[#5fd6c2]">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h3 className="mt-4 font-display text-[18px] font-semibold leading-snug">{item.title}</h3>
                  <p className="mt-2.5 text-[14.5px] leading-6 text-[#a9bdbb]">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1180px] px-5 py-16 sm:px-8 sm:py-24">
          <div className="max-w-[720px]">
            <Eyebrow>Seis áreas, uma operação</Eyebrow>
            <h2 className="font-display text-[clamp(26px,3.6vw,40px)] font-bold leading-[1.12] tracking-[-0.015em]">
              Cada parte do evento tem o seu lugar
            </h2>
          </div>
          <div className="mt-10 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="rounded-2xl border border-[#1e3330] bg-[#11211f] p-6">
                  <Icon className="h-5 w-5 text-[#5fd6c2]" aria-hidden="true" />
                  <h3 className="mt-4 font-display text-[18px] font-semibold">{item.title}</h3>
                  <p className="mt-2.5 text-[14.5px] leading-6 text-[#a9bdbb]">{item.body}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <span key={tag} className="rounded-full border border-[#1e3330] px-2.5 py-1 text-[12px] text-[#74908d]">
                        {tag}
                      </span>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section id="como-funciona" className="border-y border-[#132421] bg-[#0a1615]">
          <div className="mx-auto max-w-[1180px] px-5 py-16 sm:px-8 sm:py-24">
            <div className="max-w-[720px]">
              <Eyebrow>Como um evento roda aqui dentro</Eyebrow>
              <h2 className="font-display text-[clamp(26px,3.6vw,40px)] font-bold leading-[1.12] tracking-[-0.015em]">
                Do primeiro lançamento ao roteiro na mão do convidado
              </h2>
            </div>
            <ol className="mt-10 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {steps.map((step, index) => (
                <li key={step.title} className="rounded-2xl border border-[#1e3330] bg-[#11211f] p-6">
                  <span className="font-mono text-[12.5px] font-semibold text-[#5fd6c2]">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h3 className="mt-3 font-display text-[18px] font-semibold">{step.title}</h3>
                  <p className="mt-2.5 text-[14.5px] leading-6 text-[#a9bdbb]">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="networking" className="mx-auto max-w-[1180px] px-5 py-16 sm:px-8 sm:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <Eyebrow>Módulo de networking</Eyebrow>
              <h2 className="font-display text-[clamp(26px,3.6vw,40px)] font-bold leading-[1.12] tracking-[-0.015em]">
                Rodada de negócio com regra, não com sorte
              </h2>
              <p className="mt-4 text-[17px] leading-7 text-[#a9bdbb]">
                Quatro garantias, sempre nesta ordem, revalidadas a cada mudança no cenário.
              </p>
              <div className="mt-7 rounded-2xl border border-[#1e3330] bg-gradient-to-b from-[#11211f] to-[#0c1a18] p-6">
                {[
                  ['Ninguém repete mesa', 'Com rodadas até o número de mesas, cada convidado passa por mesas sempre diferentes.'],
                  ['O patrocinador não repete dupla', 'Quando alguém volta a uma mesa, encontra outras pessoas.'],
                  ['Ninguém senta na mesa da própria empresa', 'O convidado do patrocinador é trocado de lugar enquanto houver folga.'],
                  ['Os convidados se misturam ao máximo', 'O motor testa combinações e fica com a que espalha melhor os encontros.'],
                ].map(([title, body], index) => (
                  <div key={title} className="flex gap-3.5 border-b border-dashed border-[#1e3330] py-3.5 first:pt-0 last:border-0 last:pb-0">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-[#5fd6c2]/14 text-[12px] font-bold text-[#5fd6c2]">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-[14.5px] font-semibold">{title}</p>
                      <p className="mt-1 text-[14px] leading-6 text-[#a9bdbb]">{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <TableArt />
          </div>
        </section>

        <section className="border-y border-[#132421] bg-[#0a1615]">
          <div className="mx-auto max-w-[1180px] px-5 py-16 sm:px-8 sm:py-24">
            <div className="max-w-[720px]">
              <Eyebrow>Por que Mesa Certa</Eyebrow>
              <h2 className="font-display text-[clamp(26px,3.6vw,40px)] font-bold leading-[1.12] tracking-[-0.015em]">
                Ferramenta genérica para de pé até certo ponto
              </h2>
              <p className="mt-4 text-[17px] leading-7 text-[#a9bdbb]">
                Planilha e grupo de mensagem resolvem o começo. O problema aparece quando o número precisa bater e a
                operação muda na semana do evento.
              </p>
            </div>
            <div className="mt-10 overflow-x-auto rounded-2xl border border-[#1e3330]">
              <table className="w-full min-w-[640px] text-[14.5px]">
                <thead>
                  <tr className="bg-[#0c1a18] text-[12px] uppercase tracking-[0.1em] text-[#74908d]">
                    <th className="px-4 py-3.5 text-left font-semibold">O que a operação precisa</th>
                    <th className="px-4 py-3.5 text-left font-semibold">Planilha</th>
                    <th className="px-4 py-3.5 text-left font-semibold">Grupo de mensagem</th>
                    <th className="px-4 py-3.5 text-left font-semibold text-[#5fd6c2]">Mesa Certa</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((row) => (
                    <tr key={row.need} className="border-t border-[#1e3330]">
                      <td className="px-4 py-3.5">{row.need}</td>
                      <td className="px-4 py-3.5 text-[#74908d]">{row.sheet}</td>
                      <td className="px-4 py-3.5 text-[#74908d]">{row.group}</td>
                      <td className="px-4 py-3.5 font-semibold text-[#5fd6c2]">{row.mc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1180px] px-5 py-16 sm:px-8 sm:py-24">
          <div className="max-w-[720px]">
            <Eyebrow>Acesso e confiabilidade</Eyebrow>
            <h2 className="font-display text-[clamp(26px,3.6vw,40px)] font-bold leading-[1.12] tracking-[-0.015em]">
              O dado de cada organização fica com ela
            </h2>
          </div>
          <div className="mt-10 grid gap-3.5 sm:grid-cols-3">
            {security.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="rounded-2xl border border-[#1e3330] bg-[#11211f] p-6">
                  <Icon className="h-5 w-5 text-[#5fd6c2]" aria-hidden="true" />
                  <h3 className="mt-4 font-display text-[17px] font-semibold">{item.title}</h3>
                  <p className="mt-2.5 text-[14.5px] leading-6 text-[#a9bdbb]">{item.body}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section id="planos" className="border-y border-[#132421] bg-[#0a1615]">
          <div className="mx-auto max-w-[1180px] px-5 py-16 sm:px-8 sm:py-24">
            <div className="max-w-[720px]">
              <Eyebrow>Oferta proposta</Eyebrow>
              <h2 className="font-display text-[clamp(26px,3.6vw,40px)] font-bold leading-[1.12] tracking-[-0.015em]">
                Mesmos recursos nos dois formatos. Muda só a contratação.
              </h2>
              <p className="mt-4 text-[17px] leading-7 text-[#a9bdbb]">
                A venda ainda depende da liberação operacional. Esta página não simula escassez, checkout disponível ou
                benefício que não foi comprovado.
              </p>
            </div>
            <div className="mt-10 grid gap-3.5 lg:grid-cols-2">
              <article className="rounded-2xl border border-[#1e3330] bg-[#11211f] p-7">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#74908d]">Mensal</p>
                <p className="mt-5 font-display text-[44px] font-bold leading-none">
                  R$ 97 <span className="font-sans text-[13px] font-normal text-[#74908d]">/ mês</span>
                </p>
                <p className="mt-3 text-[14px] leading-6 text-[#a9bdbb]">
                  Cobrança recorrente mensal. Menor compromisso inicial.
                </p>
                <ul className="mt-6 space-y-2.5 text-[14px] text-[#a9bdbb]">
                  {['1 organização', '1 responsável', 'Até 3 eventos ativos', 'Mesmos módulos liberados'].map((item) => (
                    <li key={item} className="flex gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#5fd6c2]" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#1e3330] px-5 py-3 text-[15px] font-semibold text-[#f2f7f6] transition-colors hover:border-[#5fd6c2] hover:text-[#5fd6c2]"
                >
                  Criar conta
                </Link>
              </article>

              <article className="rounded-2xl border border-[#5fd6c2] bg-[#11211f] p-7 shadow-[0_18px_50px_rgba(14,107,102,0.22)]">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5fd6c2]">12 meses</p>
                  <p className="text-[12px] tabular-nums text-[#74908d]">economia de R$ 367</p>
                </div>
                <p className="mt-5 font-display text-[44px] font-bold leading-none">
                  R$ 797 <span className="font-sans text-[13px] font-normal text-[#74908d]">/ ano</span>
                </p>
                <p className="mt-3 text-[14px] leading-6 text-[#a9bdbb]">
                  Pagamento único. Doze meses de acesso, sem renovação automática.
                </p>
                <dl className="mt-6 space-y-2 border-t border-[#1e3330] pt-4 text-[14px]">
                  <div className="flex justify-between">
                    <dt className="text-[#a9bdbb]">12 mensalidades</dt>
                    <dd className="tabular-nums">R$ 1.164</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#a9bdbb]">12 meses à vista</dt>
                    <dd className="tabular-nums">R$ 797</dd>
                  </div>
                  <div className="flex justify-between border-t border-[#1e3330] pt-2 font-semibold">
                    <dt>Diferença</dt>
                    <dd className="tabular-nums text-[#5fd6c2]">R$ 367</dd>
                  </div>
                </dl>
                <Link
                  to="/register"
                  className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#5fd6c2] px-5 py-3 text-[15px] font-semibold text-[#04100e] transition-colors hover:bg-[#7be3d1]"
                >
                  Criar conta
                </Link>
              </article>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[11px] uppercase tracking-[0.14em] text-[#74908d]">
              <span>Sem “mais vendido” inventado</span>
              <span>Sem bônus fictício</span>
              <span>Sem contagem regressiva</span>
            </div>
          </div>
        </section>

        <section id="duvidas" className="mx-auto max-w-[1180px] px-5 py-16 sm:px-8 sm:py-24">
          <div className="max-w-[720px]">
            <Eyebrow>Perguntas frequentes</Eyebrow>
            <h2 className="font-display text-[clamp(26px,3.6vw,40px)] font-bold leading-[1.12] tracking-[-0.015em]">
              Ainda ficou alguma dúvida?
            </h2>
          </div>
          <div className="mt-10 grid gap-2.5">
            {faq.map((item, index) => (
              <FaqItem
                key={item.question}
                item={item}
                open={openFaq === index}
                onToggle={() => setOpenFaq(openFaq === index ? -1 : index)}
              />
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-[1180px] px-5 pb-20 sm:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-[#1e3330] bg-[radial-gradient(circle_at_18%_20%,rgba(95,214,194,0.16),transparent_55%),#0c1a18] px-6 py-14 text-center sm:px-14">
            <Eyebrow>Pronto para sair do improviso?</Eyebrow>
            <h2 className="mx-auto max-w-[18ch] font-display text-[clamp(26px,3.6vw,40px)] font-bold leading-[1.12] tracking-[-0.015em]">
              Comece pelo próximo evento
            </h2>
            <p className="mx-auto mt-4 max-w-[62ch] text-[17px] leading-7 text-[#a9bdbb]">
              Crie a conta, abra o primeiro evento e traga o financeiro, as pessoas e a operação para a mesma leitura.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-full bg-[#5fd6c2] px-5 py-3 text-[15px] font-semibold text-[#04100e] transition-colors hover:bg-[#7be3d1]"
              >
                Criar conta <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-full border border-[#1e3330] px-5 py-3 text-[15px] text-[#f2f7f6] transition-colors hover:border-[#5fd6c2] hover:text-[#5fd6c2]"
              >
                Entrar na plataforma
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#132421]">
        <div className="mx-auto grid max-w-[1180px] gap-8 px-5 py-12 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <BrandMark />
            <p className="mt-3 max-w-[38ch] text-[13.5px] leading-6 text-[#74908d]">
              Planejamento e operação de eventos, do primeiro lançamento ao roteiro na mão do convidado.
            </p>
          </div>
          <div>
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a9bdbb]">Plataforma</h3>
            <ul className="grid gap-2 text-[13.5px] text-[#74908d]">
              {navLinks.map((link) => (
                <li key={link.id}>
                  <a href={`#${link.id}`} className="transition-colors hover:text-[#5fd6c2]">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a9bdbb]">Conta</h3>
            <ul className="grid gap-2 text-[13.5px] text-[#74908d]">
              <li>
                <Link to="/register" className="transition-colors hover:text-[#5fd6c2]">
                  Criar conta
                </Link>
              </li>
              <li>
                <Link to="/login" className="transition-colors hover:text-[#5fd6c2]">
                  Entrar
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mx-auto flex max-w-[1180px] flex-wrap justify-between gap-3 border-t border-[#132421] px-5 py-6 text-[13px] text-[#74908d] sm:px-8">
          <span>© 2026 Mesa Certa</span>
          <a href="#topo" className="transition-colors hover:text-[#5fd6c2]">
            Voltar ao topo
          </a>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
