import React, { useState } from 'react';
import { useEvent } from '@/context/EventContext';
import { financialSummary } from '@/lib/selectors';
import { formatBRL, formatDateShort, uid } from '@/lib/format';
import { SectionLabel, StatusPill, EmptyState } from '@/components/common/Primitives';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function Sponsors() {
  const { currentEvent: ev, updateCurrent } = useEvent();
  const { toast } = useToast();
  const [planOpen, setPlanOpen] = useState(false);
  const [plan, setPlan] = useState({ name: '', price: '', available: '' });

  const fin = financialSummary(ev);

  const addPlan = () => {
    if (!plan.name) return;
    updateCurrent(e => ({ ...e, sponsorPlans: [...e.sponsorPlans, { id: uid(), name: plan.name, price: Number(plan.price) || 0, available: Number(plan.available) || 0, sold: 0, complimentary: 0, benefits: '', notes: '' }] }));
    setPlan({ name: '', price: '', available: '' }); setPlanOpen(false); toast({ title: 'Plano criado', duration: 1500 });
  };
  const setSponsor = (id, patch) => updateCurrent(e => ({ ...e, sponsors: e.sponsors.map(s => s.id === id ? { ...s, ...patch, status: (patch.received ?? s.received) >= s.negotiated && s.negotiated > 0 ? 'quitado' : 'pendente' } : s) }));

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-[26px] tracking-tight">Patrocínios</h1>
          <p className="mt-1 text-[14px] text-muted-foreground">{formatBRL(fin.sponsorReceived)} recebidos · {formatBRL(fin.sponsorExpected)} previsto · {ev.sponsors.length} patrocinadores</p>
        </div>
        <Button size="sm" variant="outline" className="h-8 gap-1.5 text-[13px]" onClick={() => setPlanOpen(true)}><Plus className="h-3.5 w-3.5" /> Plano</Button>
      </div>

      <section className="platform-panel">
        <SectionLabel className="mb-3">Planos de patrocínio</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ev.sponsorPlans.map(p => (
            <div key={p.id} className="border border-border rounded-md p-4">
              <div className="flex items-baseline justify-between"><span className="text-[15px] font-medium">{p.name}</span><span className="tnum text-[15px]">{formatBRL(p.price)}</span></div>
              <div className="mt-1 text-[12px] text-muted-foreground">{p.sold} vendidos / {p.available} disponíveis · {p.complimentary} cortesias</div>
              {p.benefits && <div className="mt-2 text-[12px] text-muted-foreground/80">{p.benefits}</div>}
            </div>
          ))}
        </div>
      </section>

      <section className="platform-panel">
        <SectionLabel className="mb-3">Patrocinadores</SectionLabel>
        {ev.sponsors.length === 0 ? (
          <EmptyState title="Nenhum patrocinador" hint="Use o botão Adicionar no topo para cadastrar uma empresa." />
        ) : (
          <div className="platform-data-table">
            <div className="grid grid-cols-12 gap-3 px-2 pb-2 border-b border-border text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
              <div className="col-span-3">Empresa</div><div className="col-span-2">Plano</div>
              <div className="col-span-2 text-right">Negociado</div><div className="col-span-2 text-right">Recebido</div>
              <div className="col-span-2">Vencimento</div><div className="col-span-1 text-right">Status</div>
            </div>
            {ev.sponsors.map(s => (
              <div key={s.id} className="grid grid-cols-12 gap-3 px-2 py-2.5 border-b border-border items-center text-[13px]">
                <div className="col-span-3 min-w-0"><div className="font-medium truncate">{s.company}</div><div className="text-[11px] text-muted-foreground truncate">{s.contact}</div></div>
                <div className="col-span-2 text-muted-foreground">{s.plan}</div>
                <div className="col-span-2 text-right tnum">{formatBRL(s.negotiated)}</div>
                <div className="col-span-2 text-right"><Input type="number" value={s.received} onChange={e => setSponsor(s.id, { received: Number(e.target.value) || 0 })} className="h-7 w-24 text-[12px] tnum ml-auto" /></div>
                <div className="col-span-2 text-muted-foreground">{s.dueDate ? formatDateShort(s.dueDate) : '—'}</div>
                <div className="col-span-1 flex justify-end"><StatusPill status={s.status} /></div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Dialog open={planOpen} onOpenChange={setPlanOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader><DialogTitle className="text-[15px]">Novo plano de patrocínio</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-[13px]">Nome do plano</Label><Input className="mt-1.5 h-9" value={plan.name} onChange={e => setPlan(p => ({ ...p, name: e.target.value }))} placeholder="Ex.: Master" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-[13px]">Valor</Label><Input type="number" className="mt-1.5 h-9" value={plan.price} onChange={e => setPlan(p => ({ ...p, price: e.target.value }))} /></div>
              <div><Label className="text-[13px]">Disponíveis</Label><Input type="number" className="mt-1.5 h-9" value={plan.available} onChange={e => setPlan(p => ({ ...p, available: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setPlanOpen(false)} className="text-[13px]">Cancelar</Button><Button onClick={addPlan} className="text-[13px]">Criar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
