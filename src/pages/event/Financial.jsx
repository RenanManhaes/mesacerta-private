import React, { useState } from 'react';
import { useEvent } from '@/context/EventContext';
import { financialSummary, expenseTotal } from '@/lib/selectors';
import { formatBRL, formatBRLc, formatPercent, formatDateShort } from '@/lib/format';
import { SectionLabel, InfoTip, StatusPill } from '@/components/common/Primitives';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

/** @param {{label: React.ReactNode, value: React.ReactNode, sub?: React.ReactNode, strong?: boolean, tone?: string}} props */
function Line({ label, value, sub, strong, tone }) {
  return (
    <div className="flex items-baseline justify-between py-2.5 border-b border-border last:border-0">
      <div>
        <div className="text-[13px] text-muted-foreground">{label}</div>
        {sub && <div className="text-[11px] text-muted-foreground/70 mt-0.5">{sub}</div>}
      </div>
      <div className={cn('tnum text-[14px]', strong && 'font-medium', tone === 'pos' && 'text-positive', tone === 'neg' && 'text-danger')}>{value}</div>
    </div>
  );
}

function Resumo() {
  const { currentEvent: ev } = useEvent();
  const fin = financialSummary(ev);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="platform-panel">
        <SectionLabel className="mb-3">Receitas</SectionLabel>
        <div className="border-t border-border">
          <Line label="Faturamento previsto" value={formatBRL(fin.faturamentoPrevisto)} strong />
          <Line label="Recebido" value={formatBRL(fin.recebido)} tone="pos" />
          <Line label="A receber" value={formatBRL(fin.aReceber)} />
        </div>
        <div className="mt-4 space-y-1 text-[12px] text-muted-foreground">
          <div className="flex justify-between"><span>Ingressos</span><span className="tnum">{formatBRL(fin.ticketReceived)} / {formatBRL(fin.ticketExpected)}</span></div>
          <div className="flex justify-between"><span>Patrocínios</span><span className="tnum">{formatBRL(fin.sponsorReceived)} / {formatBRL(fin.sponsorExpected)}</span></div>
          <div className="flex justify-between"><span>Outras receitas</span><span className="tnum">{formatBRL(fin.otherReceived)} / {formatBRL(fin.otherExpected)}</span></div>
        </div>
      </div>

      <div className="platform-panel">
        <SectionLabel className="mb-3">Despesas</SectionLabel>
        <div className="border-t border-border">
          <Line label="Despesas previstas" value={formatBRL(fin.despesasPrevistas)} strong />
          <Line label="Pago" value={formatBRL(fin.pago)} tone="pos" />
          <Line label="A pagar" value={formatBRL(fin.aPagar)} />
        </div>
        <div className="mt-4 text-[12px] text-muted-foreground space-y-1">
          <div className="flex justify-between"><span>Custos fixos</span><span className="tnum">{formatBRL(fin.fixedCosts)}</span></div>
          <div className="flex justify-between"><span>Percentuais sobre receita</span><span className="tnum">{formatBRLc(fin.percentCosts)}</span></div>
          <div className="flex justify-between"><span>Custo por participante</span><span className="tnum">{formatBRLc(fin.variablePerParticipant)} × {ev.expectedAudience}</span></div>
        </div>
      </div>

      <div className="platform-panel">
        <SectionLabel className="mb-3">Resultado</SectionLabel>
        <div className="border-t border-border">
          <Line label="Resultado previsto" value={formatBRL(fin.resultadoPrevisto)} strong tone={fin.resultadoPrevisto >= 0 ? 'pos' : 'neg'} />
          <Line label="Margem prevista" value={formatPercent(fin.margem)} />
          <Line label="Resultado atual" value={formatBRL(fin.resultadoAtual)} tone={fin.resultadoAtual >= 0 ? 'pos' : 'neg'} />
        </div>
        <div className="mt-4 rounded-md border border-border bg-card p-4">
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] font-medium">Ponto de equilíbrio</span>
            <InfoTip text="Quantidade mínima de vendas necessária para que receitas e despesas se igualem." />
          </div>
          <div className="mt-1.5 text-[13px] text-muted-foreground">
            {fin.breakEvenPossible ? <>{fin.breakEvenApproximate ? 'Estimativa conservadora de equilíbrio a partir de' : 'Seu evento atinge o ponto de equilíbrio a partir de'}
              <span className="text-foreground font-medium tnum"> {fin.breakEven} ingressos pagantes</span>.</>
              : 'Inviável nas condições atuais: a receita líquida por ingresso não cobre o custo variável.'}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReceitasTab() {
  const { currentEvent: ev } = useEvent();
  const rows = [
    ...ev.tickets.flatMap(t => t.lots.map(l => ({ desc: `${t.name} — ${l.name}`, expected: l.price * l.expectedSales, received: l.price * l.sold, cat: 'Ingressos', date: l.limitDate, status: l.sold >= l.expectedSales ? 'recebido' : 'previsto' }))),
    ...ev.sponsors.map(s => ({ desc: s.company, expected: s.negotiated, received: s.received, cat: 'Patrocínios', date: s.dueDate, status: s.status })),
    ...ev.revenues.map(r => ({ desc: r.description, expected: r.expected, received: r.received, cat: r.category, date: r.expectedDate, status: r.status }))
  ];
  return (
    <div>
      <div className="grid grid-cols-12 gap-4 px-2 pb-2 border-b border-border text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
        <div className="col-span-5">Descrição</div><div className="col-span-2">Categoria</div>
        <div className="col-span-2 text-right">Previsto</div><div className="col-span-2 text-right">Recebido</div><div className="col-span-1 text-right">Status</div>
      </div>
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-12 gap-4 px-2 py-2.5 border-b border-border items-center text-[13px]">
          <div className="col-span-5 min-w-0"><div className="truncate font-medium">{r.desc}</div><div className="text-[11px] text-muted-foreground">{r.date && formatDateShort(r.date)}</div></div>
          <div className="col-span-2 text-muted-foreground">{r.cat}</div>
          <div className="col-span-2 text-right tnum">{formatBRL(r.expected)}</div>
          <div className="col-span-2 text-right tnum text-positive">{formatBRL(r.received)}</div>
          <div className="col-span-1 flex justify-end"><StatusPill status={r.status} /></div>
        </div>
      ))}
    </div>
  );
}

function DespesasTab() {
  const { currentEvent: ev } = useEvent();
  const fin = financialSummary(ev);
  const byCat = {};
  ev.expenses.forEach(e => {
    const total = expenseTotal(e, ev.expectedAudience, fin);
    byCat[e.category] = (byCat[e.category] || 0) + total;
  });
  return (
    <div>
      <div className="grid grid-cols-12 gap-4 px-2 pb-2 border-b border-border text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
        <div className="col-span-5">Descrição</div><div className="col-span-2">Categoria</div>
        <div className="col-span-2 text-right">Tipo</div><div className="col-span-2 text-right">Total</div><div className="col-span-1 text-right">Status</div>
      </div>
      {ev.expenses.map(e => {
        const total = expenseTotal(e, ev.expectedAudience, fin);
        return (
          <div key={e.id} className="grid grid-cols-12 gap-4 px-2 py-2.5 border-b border-border items-center text-[13px]">
            <div className="col-span-5 min-w-0"><div className="truncate font-medium">{e.description}</div>{e.note && <div className="text-[11px] text-muted-foreground">{e.note}</div>}</div>
            <div className="col-span-2 text-muted-foreground">{e.category}</div>
            <div className="col-span-2 text-right text-[12px] text-muted-foreground">{e.type === 'percent' ? `${e.unitValue}% ${e.revenueBase === 'sponsors' ? 'do patrocínio' : 'do faturamento'}` : e.type === 'perParticipant' ? `${formatBRLc(e.unitValue)}/pessoa` : 'Fixo'}</div>
            <div className="col-span-2 text-right tnum">{formatBRLc(total)}</div>
            <div className="col-span-1 flex justify-end"><StatusPill status={e.status} /></div>
          </div>
        );
      })}
      <div className="mt-5">
        <SectionLabel className="mb-2">Por categoria</SectionLabel>
        <div className="border-t border-border">
          {Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([cat, v]) => (
            <div key={cat} className="flex justify-between py-2 border-b border-border text-[13px]">
              <span className="text-muted-foreground">{cat}</span>
              <span className="tnum">{formatBRLc(v)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FluxoTab() {
  const { currentEvent: ev } = useEvent();
  const fin = financialSummary(ev);
  const saldo = fin.recebido - fin.pago;
  const max = Math.max(fin.recebido, fin.pago, 1);
  return (
    <div className="max-w-xl">
      <SectionLabel className="mb-3">Fluxo de caixa previsto</SectionLabel>
      <div className="border-t border-border pt-4 space-y-5">
        <div>
          <div className="flex justify-between text-[13px] mb-1.5"><span className="text-muted-foreground">Entradas (recebido)</span><span className="tnum text-positive">{formatBRL(fin.recebido)}</span></div>
          <div className="h-2 w-full bg-muted rounded-full"><div className="h-full bg-positive rounded-full transition-all" style={{ width: `${(fin.recebido / max) * 100}%` }} /></div>
        </div>
        <div>
          <div className="flex justify-between text-[13px] mb-1.5"><span className="text-muted-foreground">Saídas (pago)</span><span className="tnum text-danger">{formatBRL(fin.pago)}</span></div>
          <div className="h-2 w-full bg-muted rounded-full"><div className="h-full bg-danger rounded-full transition-all" style={{ width: `${(fin.pago / max) * 100}%` }} /></div>
        </div>
        <div className="pt-3 border-t border-border flex justify-between items-baseline">
          <span className="text-[14px] font-medium">Saldo atual</span>
          <span className={cn('tnum text-[18px] font-medium', saldo >= 0 ? 'text-positive' : 'text-danger')}>{formatBRL(saldo)}</span>
        </div>
        <div className="flex justify-between text-[13px]">
          <span className="text-muted-foreground">A receber</span><span className="tnum">{formatBRL(fin.aReceber)}</span>
        </div>
        <div className="flex justify-between text-[13px]">
          <span className="text-muted-foreground">A pagar</span><span className="tnum">{formatBRL(fin.aPagar)}</span>
        </div>
      </div>
    </div>
  );
}

export default function Financial() {
  const [tab, setTab] = useState('resumo');
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-[26px] tracking-tight">Financeiro</h1>
        <p className="mt-1 text-[14px] text-muted-foreground">Quanto você vai ganhar, gastar e o que já está pago.</p>
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-transparent h-9 p-0 gap-6 border-b border-border rounded-none w-full justify-start">
          {['resumo','receitas','despesas','fluxo'].map(t => (
            <TabsTrigger key={t} value={t} className="rounded-none text-[13px] capitalize data-[state=active]:shadow-none data-[state=active]:bg-transparent data-[state=active]:text-foreground text-muted-foreground px-0 pb-2.5 -mb-px data-[state=active]:border-b-2 data-[state=active]:border-primary border-b-2 border-transparent">
              {t === 'fluxo' ? 'Fluxo de caixa' : t}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="resumo" className="mt-6"><Resumo /></TabsContent>
        <TabsContent value="receitas" className="mt-6"><ReceitasTab /></TabsContent>
        <TabsContent value="despesas" className="mt-6"><DespesasTab /></TabsContent>
        <TabsContent value="fluxo" className="mt-6"><FluxoTab /></TabsContent>
      </Tabs>
    </div>
  );
}
