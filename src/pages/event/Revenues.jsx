import React, { useState } from 'react';
import { useEvent } from '@/context/EventContext';
import { financialSummary } from '@/lib/selectors';
import { formatBRL, formatBRLc, formatDateShort, uid } from '@/lib/format';
import { SectionLabel, StatusPill, InfoTip } from '@/components/common/Primitives';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

function TicketCard({ t, ev, onUpdate }) {
  const sold = t.lots.reduce((a, l) => a + (l.sold || 0), 0);
  const capacity = t.lots.reduce((a, l) => a + (l.capacity || 0), 0);
  const revenue = t.lots.reduce((a, l) => a + l.price * l.sold, 0);
  const avg = sold ? revenue / sold : 0;
  const pct = capacity ? (sold / capacity) * 100 : 0;

  const setLot = (lotId, patch) => onUpdate(ev => ({
    ...ev,
    tickets: ev.tickets.map(tk => tk.id === t.id ? { ...tk, lots: tk.lots.map(l => l.id === lotId ? { ...l, ...patch } : l) } : tk)
  }));

  return (
    <div className="border border-border rounded-md">
      <div className="flex items-start justify-between gap-3 p-4 border-b border-border">
        <div><div className="text-[15px] font-medium">{t.name}</div><div className="text-[12px] text-muted-foreground">{t.description}</div></div>
        <div className="text-right">
          <div className="tnum text-[15px] font-medium">{formatBRL(revenue)}</div>
          <div className="text-[11px] text-muted-foreground">{sold} vendidos · ticket médio {formatBRLc(avg)}</div>
        </div>
      </div>
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, pct)}%` }} />
          </div>
          <span className="text-[11px] text-muted-foreground tnum">{pct.toFixed(0)}% da capacidade</span>
        </div>
        <div className="space-y-1">
          {t.lots.map(l => (
            <div key={l.id} className="grid grid-cols-12 gap-2 items-center py-1.5 text-[13px]">
              <div className="col-span-3 font-medium">{l.name}</div>
              <div className="col-span-2 tnum text-muted-foreground">{formatBRLc(l.price)}</div>
              <div className="col-span-2 text-[11px] text-muted-foreground">{l.limitDate && `até ${formatDateShort(l.limitDate)}`}</div>
              <div className="col-span-3 flex items-center gap-1.5">
                <Input type="number" value={l.sold} onChange={e => setLot(l.id, { sold: Number(e.target.value) || 0 })} className="h-7 w-16 text-[12px] tnum" />
                <span className="text-[11px] text-muted-foreground">/ {l.capacity}</span>
              </div>
              <div className="col-span-2 text-right tnum">{formatBRL(l.price * l.sold)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Revenues() {
  const { currentEvent: ev, updateCurrent } = useEvent();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const fin = financialSummary(ev);

  const addTicket = () => {
    if (!name) return;
    updateCurrent(e => ({ ...e, tickets: [...e.tickets, { id: uid(), name, description: '', lots: [{ id: uid(), name: 'Único', price: 0, limitDate: '', sold: 0, expectedSales: 0, capacity: 0 }] }] }));
    setName(''); setOpen(false); toast({ title: 'Ingresso criado', duration: 1500 });
  };
  const addRevenue = (patch) => updateCurrent(e => ({ ...e, revenues: [...e.revenues, { id: uid(), expected: 0, received: 0, expectedDate: '', receivedDate: null, status: 'previsto', ...patch }] }));
  const setRev = (id, patch) => updateCurrent(e => ({ ...e, revenues: e.revenues.map(r => r.id === id ? { ...r, ...patch } : r) }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-[26px] tracking-tight">Receitas</h1>
          <p className="mt-1 text-[14px] text-muted-foreground">{fin.ticketSold} ingressos vendidos · {formatBRL(fin.ticketReceived)} recebidos em ingressos · {formatBRL(fin.faturamentoPrevisto)} previsto total</p>
        </div>
        <Button size="sm" className="h-8 gap-1.5 text-[13px]" onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5" /> Ingresso</Button>
      </div>

      <section className="platform-panel">
        <div className="flex items-center gap-1.5 mb-3"><SectionLabel>Ingressos</SectionLabel><InfoTip text="Cada ingresso pode ter vários lotes com preços e datas diferentes." /></div>
        <div className="space-y-3">
          {ev.tickets.map(t => <TicketCard key={t.id} t={t} ev={ev} onUpdate={updateCurrent} />)}
        </div>
      </section>

      <section className="platform-panel">
        <SectionLabel className="mb-3">Outras receitas</SectionLabel>
        <div className="border-t border-border">
          {ev.revenues.map(r => (
            <div key={r.id} className="grid grid-cols-12 gap-3 items-center py-2.5 border-b border-border text-[13px]">
              <div className="col-span-5"><Input value={r.description} onChange={e => setRev(r.id, { description: e.target.value })} className="h-8 text-[13px]" /></div>
              <div className="col-span-2 text-muted-foreground">{r.category}</div>
              <div className="col-span-2"><Input type="number" value={r.expected} onChange={e => setRev(r.id, { expected: Number(e.target.value) || 0 })} className="h-8 text-[13px] tnum" /></div>
              <div className="col-span-2"><Input type="number" value={r.received} onChange={e => setRev(r.id, { received: Number(e.target.value) || 0, status: (Number(e.target.value) || 0) >= r.expected && r.expected > 0 ? 'recebido' : 'previsto' })} className="h-8 text-[13px] tnum" /></div>
              <div className="col-span-1 flex justify-end"><StatusPill status={r.status} /></div>
            </div>
          ))}
          <button onClick={() => addRevenue({ description: 'Nova receita', category: 'Outros', expected: 0, received: 0 })} className="w-full text-left py-2.5 text-[13px] text-muted-foreground hover:text-foreground flex items-center gap-1.5"><Plus className="h-3.5 w-3.5" /> Adicionar receita</button>
        </div>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader><DialogTitle className="text-[15px]">Novo ingresso</DialogTitle></DialogHeader>
          <div><Label className="text-[13px]">Nome</Label><Input className="mt-1.5 h-9" value={name} onChange={e => setName(e.target.value)} placeholder="Ex.: Estudante" /></div>
          <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)} className="text-[13px]">Cancelar</Button><Button onClick={addTicket} className="text-[13px]">Criar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
