import React, { useState } from 'react';
import { SectionLabel, StatusPill, Divider } from '@/components/common/Primitives';
import { formatBRL, formatPercent } from '@/lib/format';

/* ------------------------------------------------------------------ */
/* Página de demonstração do design system do Mesa Certa.              */
/* Não é um catálogo de componentes — é a prova de que o produto não   */
/* precisa de gradiente, glow ou card para parecer maduro.             */
/* Dados: evento real Get Connected Sorocaba 2026.                     */
/* Ver docs/branding-mesa-certa.md para a justificativa de cada token. */
/* ------------------------------------------------------------------ */

const swatchesNeutral = [
  { token: '--background', hex: '#FAF7F1', label: 'Fundo de página' },
  { token: '--card', hex: '#FFFFFF', label: 'Superfície elevada' },
  { token: '--secondary / --muted', hex: '#F0EBE1', label: 'Zebra, hover sutil' },
  { token: '--border', hex: '#E3DDD0', label: 'Toda separação do produto' },
  { token: '--muted-foreground', hex: '#6B6558', label: 'Texto secundário' },
  { token: '--foreground', hex: '#1C1A16', label: 'Texto principal' },
];

const swatchesSemantic = [
  { token: '--primary', hex: '#1F4D46', label: 'Marca · ação · foco' },
  { token: '--positive', hex: '#2E7D4F', label: 'Pago · confirmado · margem saudável' },
  { token: '--warning', hex: '#B5750C', label: 'Pendente · retorno à mesa' },
  { token: '--danger', hex: '#B3402C', label: 'Capacidade excedida · conflito' },
  { token: '--info', hex: '#3B6EA5', label: 'Em andamento · neutro-informativo' },
];

const expenses = [
  { desc: 'Buffet e catering', category: 'Alimentação', value: 14200 },
  { desc: 'Locação do espaço', category: 'Infraestrutura', value: 6500 },
  { desc: 'Audiovisual e som', category: 'Infraestrutura', value: 3100 },
  { desc: 'Identidade visual e impressos', category: 'Marketing', value: 1450 },
  { desc: 'Equipe de apoio', category: 'Operação', value: 2600 },
  { desc: 'Brindes e credenciamento', category: 'Operação', value: 980 },
  { desc: 'Marketing e divulgação', category: 'Marketing', value: 889 },
];
const despesasTotal = expenses.reduce((a, e) => a + e.value, 0); // 29.719
const faturamentoPrevisto = 31206;
const resultadoPrevisto = faturamentoPrevisto - despesasTotal; // 1.487
const margem = (resultadoPrevisto / faturamentoPrevisto) * 100; // ~4,8%

const sponsors = ['INTERFOCUS', 'NETTOP', 'ASSESSOR ARQ', 'ADEMICON', 'SUMITANI'];

const seats = [
  { name: 'Ana', role: 'participant', pos: { left: '50%', top: 10 } },
  { name: 'Pedro', role: 'participant', pos: { left: '88%', top: 68 } },
  { name: 'Lucas', role: 'participant', pos: { left: '88%', top: 196 } },
  { name: 'Renan', full: 'Renan Manhães', role: 'host', pos: { left: '50%', top: 254 } },
  { name: 'Maria', role: 'participant', pos: { left: '12%', top: 196 } },
  { name: null, role: 'empty', pos: { left: '12%', top: 68 } },
];

function Seat({ seat, onSelect, selected }) {
  const base =
    'absolute flex h-11 w-[84px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center border text-center text-[11px] leading-tight transition-colors';
  if (seat.role === 'empty') {
    return (
      <div
        className={`${base} border-dashed border-border text-muted-foreground bg-background/60`}
        style={seat.pos}
        title="Lugar vazio"
      >
        <span>Vazio</span>
      </div>
    );
  }
  const isHost = seat.role === 'host';
  return (
    <button
      type="button"
      onClick={() => onSelect(seat)}
      className={`${base} cursor-pointer bg-card hover:border-foreground focus-ring ${
        isHost ? 'border-[2px] border-primary' : 'border-border'
      } ${selected?.name === seat.name ? 'ring-2 ring-ring ring-offset-1 ring-offset-background' : ''}`}
      style={seat.pos}
      title={isHost ? `${seat.full} · Anfitrião fixo` : `${seat.name} · Participante`}
    >
      <span className="font-medium truncate max-w-full px-1">
        {isHost && <span className="mr-1 text-primary">★</span>}
        {seat.name}
      </span>
      <span className="text-[9px] text-muted-foreground">{isHost ? 'Anfitrião' : 'Participante'}</span>
    </button>
  );
}

function Swatch({ token, hex, label }) {
  return (
    <div className="flex items-start gap-3 border-t border-border py-2.5">
      <div
        className="mt-0.5 h-9 w-9 shrink-0 border border-border"
        style={{ backgroundColor: hex }}
        aria-hidden
      />
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <code className="text-[11px] text-foreground">{token}</code>
          <code className="text-[11px] text-muted-foreground tnum">{hex}</code>
        </div>
        <div className="text-[12px] text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

export default function DesignSystem() {
  const [selectedSeat, setSelectedSeat] = useState(null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 space-y-14">
        {/* ------------------------------------------------------------ */}
        <header className="space-y-2 border-b border-border pb-6">
          <SectionLabel>Design system · Mesa Certa</SectionLabel>
          <h1 className="font-display text-[30px] sm:text-[34px] tracking-tight">
            Um instrumento operacional, não um dashboard.
          </h1>
          <p className="max-w-2xl text-[14px] text-muted-foreground">
            Esta página mostra a paleta, a escala tipográfica, os estados semânticos e a
            representação espacial de mesa que sustentam o produto — com os números reais do
            evento <strong className="text-foreground font-medium">Get Connected Sorocaba 2026</strong>.
            Ver <code className="text-[12px]">docs/branding-mesa-certa.md</code> para a justificativa de
            cada decisão.
          </p>
        </header>

        {/* ------------------------------------------------------------ */}
        <section className="space-y-4">
          <div>
            <h2 className="font-heading text-[18px] font-semibold">Paleta</h2>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Neutros quentes de papel, uma única cor de marca — verde-azulado de tinta, não azul
              de SaaS — e quatro estados semânticos usados em texto e borda, nunca em preenchimento
              grande.
            </p>
          </div>
          <div className="grid gap-x-8 sm:grid-cols-2">
            <div>
              <SectionLabel className="mb-1">Neutros</SectionLabel>
              {swatchesNeutral.map((s) => (
                <Swatch key={s.token} {...s} />
              ))}
            </div>
            <div>
              <SectionLabel className="mb-1">Marca e estados</SectionLabel>
              {swatchesSemantic.map((s) => (
                <Swatch key={s.token} {...s} />
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------ */}
        <section className="space-y-4">
          <h2 className="font-heading text-[18px] font-semibold">Escala tipográfica</h2>
          <div className="border-t border-border divide-y divide-border">
            <div className="py-3">
              <div className="font-display text-[30px] tracking-tight">
                {formatBRL(faturamentoPrevisto)}
              </div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                Display · Instrument Serif 400 · título e KPI hero
              </div>
            </div>
            <div className="py-3">
              <div className="font-heading text-[19px] font-semibold">Despesas por categoria</div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                H2 · Instrument Sans 600 · título de seção
              </div>
            </div>
            <div className="py-3">
              <div className="font-heading text-[14px] font-semibold">Mesa 04 — NETTOP</div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                H3 · Instrument Sans 600 · cabeçalho de bloco, nome de mesa
              </div>
            </div>
            <div className="py-3">
              <div className="text-[13px]">
                76 convidados confirmados, 14 mesas montadas, 7 lugares por mesa.
              </div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                Corpo · Instrument Sans 400–500 · texto de tabela e parágrafo
              </div>
            </div>
            <div className="py-3">
              <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                Categoria
              </div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                Rótulo · 11px uppercase, tracking 0.12–0.14em · cabeçalho de coluna
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------ */}
        <section className="space-y-4">
          <h2 className="font-heading text-[18px] font-semibold">Estados semânticos</h2>
          <p className="text-[13px] text-muted-foreground max-w-2xl">
            PRD §32: nunca cinco cores fortes competindo — ponto de 6px, borda fina ou texto, sempre
            acompanhado de palavra. A cor reforça, nunca é a única informação.
          </p>
          <div className="grid gap-2 sm:grid-cols-2 border-t border-border pt-3">
            <StatusPill status="pago" />
            <StatusPill status="pendente" />
            <StatusPill status="critico" />
            <StatusPill status="Em andamento" />
          </div>
        </section>

        {/* ------------------------------------------------------------ */}
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-heading text-[18px] font-semibold">Despesas — Get Connected Sorocaba 2026</h2>
              <p className="mt-1 text-[13px] text-muted-foreground">
                {formatBRL(despesasTotal)} previstas em 7 linhas reais do evento.
              </p>
            </div>
          </div>
          <div className="border-t border-border">
            <div className="grid grid-cols-12 gap-3 px-2 py-2 border-b border-border text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
              <div className="col-span-6 sm:col-span-7">Descrição</div>
              <div className="hidden sm:block col-span-3">Categoria</div>
              <div className="col-span-6 sm:col-span-2 text-right">Valor</div>
            </div>
            {expenses.map((e) => (
              <div
                key={e.desc}
                className="grid grid-cols-12 gap-3 px-2 py-2.5 border-b border-border items-center text-[13px]"
              >
                <div className="col-span-6 sm:col-span-7 truncate">{e.desc}</div>
                <div className="hidden sm:block col-span-3 text-muted-foreground">{e.category}</div>
                <div className="col-span-6 sm:col-span-2 text-right tnum">{formatBRL(e.value)}</div>
              </div>
            ))}
            <div className="grid grid-cols-12 gap-3 px-2 py-2.5 items-center text-[13px] font-medium">
              <div className="col-span-6 sm:col-span-10">Total</div>
              <div className="col-span-6 sm:col-span-2 text-right tnum">{formatBRL(despesasTotal)}</div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------ */}
        <section className="space-y-4">
          <h2 className="font-heading text-[18px] font-semibold">Financeiro — visão rápida</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-5 border-y border-border py-5">
            <div>
              <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                Faturamento previsto
              </div>
              <div className="mt-1 font-display text-[22px] tnum">{formatBRL(faturamentoPrevisto)}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                Despesas previstas
              </div>
              <div className="mt-1 font-display text-[22px] tnum">{formatBRL(despesasTotal)}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                Resultado previsto
              </div>
              <div className="mt-1 font-display text-[22px] tnum text-positive">
                {formatBRL(resultadoPrevisto)}
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Margem</div>
              <div className="mt-1 text-[15px] font-medium tnum text-positive">
                {formatPercent(margem)}
              </div>
              <div className="mt-0.5 text-[12px] text-muted-foreground">
                Margem apertada — 1 casa decimal, nunca arredondada
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                Ponto de equilíbrio
              </div>
              <div className="mt-1 text-[15px] font-medium tnum">18 ingressos pagos</div>
              <div className="mt-0.5 text-[12px] text-muted-foreground">28 vendidos · 10 acima do ponto</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                Convidados
              </div>
              <div className="mt-1 text-[15px] font-medium tnum">76 pessoas</div>
              <div className="mt-0.5 text-[12px] text-muted-foreground">28 pagantes · 48 cortesias</div>
            </div>
          </div>
          <div className="text-[13px] text-muted-foreground">
            Patrocinadores confirmados: {sponsors.join(' · ')}.
          </div>
        </section>

        {/* ------------------------------------------------------------ */}
        <section className="space-y-4">
          <div>
            <h2 className="font-heading text-[18px] font-semibold">Representação espacial da mesa</h2>
            <p className="mt-1 max-w-2xl text-[13px] text-muted-foreground">
              PRD §29–§32: cadeiras desenhadas no perímetro, nunca uma lista. Capacidade = 6 cadeiras
              neste exemplo — uma vazia, um anfitrião fixo (★), quatro participantes. Selecione uma
              cadeira ocupada.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-[320px_1fr]">
            <div className="border border-border p-3">
              <div className="flex items-center justify-between px-1 pb-2 text-[12px]">
                <strong className="font-heading">Mesa 04 — NETTOP</strong>
                <span className="tnum text-muted-foreground">5 / 6 lugares</span>
              </div>
              <div className="relative mx-auto h-[300px] w-full max-w-[280px]">
                <div
                  className="absolute border-2 border-primary bg-accent px-2 py-3 text-center"
                  style={{ left: '50%', top: '50%', width: '34%', transform: 'translate(-50%, -50%)' }}
                >
                  <div className="text-[11px] font-semibold leading-tight">MESA 04</div>
                  <div className="text-[9px] leading-tight text-muted-foreground">NETTOP</div>
                  <div className="mt-1 text-[9px] tnum">5/6</div>
                </div>
                {seats.map((seat) => (
                  <Seat
                    key={seat.name ?? `empty-${seat.pos.left}-${seat.pos.top}`}
                    seat={seat}
                    onSelect={setSelectedSeat}
                    selected={selectedSeat}
                  />
                ))}
              </div>
              <Divider className="my-2" />
              <div className="flex flex-wrap gap-x-4 gap-y-1 px-1 text-[11px] text-muted-foreground">
                <span><span className="text-primary">★</span> Anfitrião fixo</span>
                <span>Borda tracejada · lugar vazio</span>
                <span>Borda sólida · participante</span>
              </div>
            </div>

            <div className="border border-border p-4 text-[13px]">
              {selectedSeat && selectedSeat.role !== 'empty' ? (
                <div className="space-y-2.5">
                  <SectionLabel>Cadeira selecionada</SectionLabel>
                  <h3 className="font-display text-[19px]">
                    {selectedSeat.full ?? selectedSeat.name}
                  </h3>
                  <dl className="grid grid-cols-[110px_1fr] gap-y-1.5 text-[13px]">
                    <dt className="text-muted-foreground">Papel</dt>
                    <dd>{selectedSeat.role === 'host' ? 'Anfitrião fixo' : 'Participante'}</dd>
                    <dt className="text-muted-foreground">Mesa atual</dt>
                    <dd>Mesa 04 — Nettop</dd>
                    <dt className="text-muted-foreground">Rodada</dt>
                    <dd className="tnum">4 de 10</dd>
                    <dt className="text-muted-foreground">Próxima mesa</dt>
                    <dd>Interfocus</dd>
                  </dl>
                  <button className="mt-1 border border-border px-3 py-1.5 text-[12px] hover:border-foreground focus-ring">
                    Ver rota completa
                  </button>
                </div>
              ) : (
                <div className="text-muted-foreground">
                  Clique numa cadeira ocupada para ver os detalhes da pessoa — popover simples,
                  drawer para rota completa (PRD §34). O painel ao lado também representa a
                  interação de clicar no centro da mesa para abrir capacidade, anfitrião e
                  histórico de rodadas (PRD §35).
                </div>
              )}
            </div>
          </div>
        </section>

        <footer className="border-t border-border pt-6 text-[12px] text-muted-foreground">
          14 mesas · 7 lugares por mesa · 76 convidados · 0 conflitos nesta rodada.
        </footer>
      </div>
    </div>
  );
}
