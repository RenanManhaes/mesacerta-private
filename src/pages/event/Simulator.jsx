import React, { useState, useMemo } from 'react';
import { useEvent } from '@/context/EventContext';
import { financialSummary } from '@/lib/selectors';
import { formatBRL, formatPercent } from '@/lib/format';
import { SectionLabel, InfoTip } from '@/components/common/Primitives';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Simulator() {
  const { currentEvent: ev } = useEvent();
  const current = financialSummary(ev);

  const [participants, setParticipants] = useState(ev.expectedAudience || 150);
  const [price, setPrice] = useState(Math.round(current.avgTicket) || 299);
  const [sponsors, setSponsors] = useState(current.sponsorExpected || 25000);
  const [costPerParticipant, setCostPerParticipant] = useState(current.variablePerParticipant || 72);
  const [fixedCosts, setFixedCosts] = useState(current.fixedCosts || 18000);

  const result = useMemo(() => {
    const faturamento = participants * price + sponsors;
    const despesas = fixedCosts + costPerParticipant * participants;
    const resultado = faturamento - despesas;
    const margem = faturamento ? (resultado / faturamento) * 100 : 0;
    const contribution = price - costPerParticipant;
    const breakEven = contribution > 0 ? Math.ceil((fixedCosts - sponsors) / contribution) : 0;
    const capacityOk = ev.capacity ? participants <= ev.capacity : true;
    return { faturamento, despesas, resultado, margem, breakEven: Math.max(0, breakEven), capacityOk };
  }, [participants, price, sponsors, costPerParticipant, fixedCosts, ev.capacity]);

  const compare = () => {
    setParticipants(ev.expectedAudience || 150);
    setPrice(Math.round(current.avgTicket) || 299);
    setSponsors(current.sponsorExpected || 25000);
    setCostPerParticipant(current.variablePerParticipant || 72);
    setFixedCosts(current.fixedCosts || 18000);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="font-display text-[26px] tracking-tight">Simulador</h1>
        <p className="mt-1 text-[14px] text-muted-foreground">Simule antes de decidir. Os valores não alteram o seu evento real.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Controls */}
        <div className="space-y-6">
          <div>
            <div className="flex justify-between mb-2"><Label className="text-[13px]">Participantes</Label><span className="tnum text-[14px] font-medium">{participants}</span></div>
            <Slider value={[participants]} onValueChange={v => setParticipants(v[0])} min={0} max={ev.capacity || 400} step={1} />
          </div>
          <div>
            <div className="flex justify-between mb-2"><Label className="text-[13px]">Preço médio do ingresso</Label><span className="tnum text-[14px] font-medium">R$ {price}</span></div>
            <Slider value={[price]} onValueChange={v => setPrice(v[0])} min={0} max={1000} step={1} />
          </div>
          <div>
            <div className="flex justify-between mb-2"><Label className="text-[13px]">Patrocínios</Label><span className="tnum text-[14px] font-medium">{formatBRL(sponsors)}</span></div>
            <Slider value={[sponsors]} onValueChange={v => setSponsors(v[0])} min={0} max={60000} step={500} />
          </div>
          <div>
            <div className="flex justify-between mb-2"><Label className="text-[13px]">Custo por participante</Label><span className="tnum text-[14px] font-medium">R$ {costPerParticipant}</span></div>
            <Slider value={[costPerParticipant]} onValueChange={v => setCostPerParticipant(v[0])} min={0} max={300} step={1} />
          </div>
          <div>
            <div className="flex justify-between mb-2"><Label className="text-[13px]">Custos fixos</Label><span className="tnum text-[14px] font-medium">{formatBRL(fixedCosts)}</span></div>
            <Slider value={[fixedCosts]} onValueChange={v => setFixedCosts(v[0])} min={0} max={80000} step={500} />
          </div>
          <Button variant="outline" size="sm" className="h-8 text-[13px]" onClick={compare}>Comparar com meu cenário atual</Button>
        </div>

        {/* Result */}
        <div className="border-t border-border pt-5 lg:border-l lg:border-t-0 lg:pl-10">
          <SectionLabel className="mb-4">Resultado instantâneo</SectionLabel>
          <div className="space-y-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Faturamento</div>
              <div className="font-display text-[34px] leading-none tracking-tight tnum mt-1">{formatBRL(result.faturamento)}</div>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
              <div><div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Despesas</div><div className="tnum text-[18px] font-medium mt-1">{formatBRL(result.despesas)}</div></div>
              <div><div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Margem</div><div className="tnum text-[18px] font-medium mt-1">{formatPercent(result.margem)}</div></div>
            </div>
            <div className="border-t border-border pt-4">
              <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Resultado</div>
              <div className={cn('tnum text-[26px] font-medium mt-1', result.resultado >= 0 ? 'text-positive' : 'text-danger')}>{formatBRL(result.resultado)}</div>
            </div>
            <div className="border-t border-border pt-4 flex items-center gap-1.5">
              <span className="text-[13px] text-muted-foreground">Ponto de equilíbrio</span>
              <InfoTip text="Ingressos pagantes necessários para cobrir os custos, considerando patrocínios." />
              <span className="ml-auto tnum text-[14px] font-medium">{result.breakEven} ingressos</span>
            </div>
            <div className={cn('flex items-center gap-2 border-t border-border pt-4 text-[13px]', result.capacityOk ? 'text-positive' : 'text-danger')}>
              {result.capacityOk ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              {result.capacityOk ? 'Capacidade OK' : `Excede a capacidade em ${participants - ev.capacity} pessoas`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
