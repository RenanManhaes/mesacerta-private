import React from 'react';
import { useEvent } from '@/context/EventContext';
import { financialSummary, expenseTotal } from '@/lib/selectors';
import { formatBRLc } from '@/lib/format';
import ExpenseCostFields from '@/components/financial/ExpenseCostFields';
import { SectionLabel } from '@/components/common/Primitives';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function Expenses() {
  const { currentEvent: ev, updateCurrent } = useEvent();
  const { toast } = useToast();
  const fin = financialSummary(ev);

  const setExp = (id, patch) => updateCurrent(e => ({ ...e, expenses: e.expenses.map(x => x.id === id ? { ...x, ...patch } : x) }));
  const addExp = () => updateCurrent(e => ({ ...e, expenses: [{ id: Math.random().toString(36).slice(2), description: 'Nova despesa', category: 'Outros', type: 'fixed', revenueBase: 'total', qty: 1, unitValue: 0, dueDate: '', status: 'pendente', note: '' }, ...e.expenses] }));
  const removeExp = (id) => updateCurrent(e => ({ ...e, expenses: e.expenses.filter(x => x.id !== id) }));

  const byCat = {};
  ev.expenses.forEach(e => { const t = expenseTotal(e, ev.expectedAudience, fin); byCat[e.category] = (byCat[e.category] || 0) + t; });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-[26px] tracking-tight">Despesas</h1>
          <p className="mt-1 text-[14px] text-muted-foreground">{formatBRLc(fin.despesasPrevistas)} previstas · {formatBRLc(fin.pago)} pago · {formatBRLc(fin.aPagar)} a pagar</p>
        </div>
        <Button size="sm" className="h-8 gap-1.5 text-[13px]" onClick={() => { addExp(); toast({ title: 'Despesa criada', duration: 1500 }); }}>
          <Plus className="h-3.5 w-3.5" /> Despesa
        </Button>
      </div>

      <div className="border-t border-border">
        <div className="grid grid-cols-12 gap-3 px-2 py-2 border-b border-border text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
          <div className="col-span-12 sm:col-span-4">Descrição</div>
          <div className="hidden sm:block col-span-2">Categoria</div>
          <div className="hidden sm:block col-span-4">Cálculo</div>
          <div className="hidden sm:block col-span-2 text-right">Total / Status</div>
        </div>

        {ev.expenses.map(e => {
          const total = expenseTotal(e, ev.expectedAudience, fin);
          return (
            <div key={e.id} className="group grid grid-cols-12 gap-3 px-2 py-2.5 border-b border-border items-center text-[13px]">
              <div className="col-span-12 sm:col-span-4 min-w-0">
                <Input value={e.description} onChange={evt => setExp(e.id, { description: evt.target.value })} className="h-8 text-[13px]" />
                <Input type="date" value={e.dueDate} onChange={evt => setExp(e.id, { dueDate: evt.target.value })} className="mt-1.5 h-7 text-[11px] w-40" />
              </div>
              <div className="col-span-12 sm:col-span-2 flex items-center">
                <Select value={e.category} onValueChange={v => setExp(e.id, { category: v })}>
                  <SelectTrigger className="h-8 text-[12px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{ev.expenseCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-12 sm:col-span-4">
                <ExpenseCostFields expense={e} onChange={patch => setExp(e.id, patch)} />
              </div>
              <div className="col-span-12 sm:col-span-2 flex flex-wrap justify-end items-center gap-2">
                <div className="w-full text-right tnum">{formatBRLc(total)}</div>
                {e.status === 'parcial' && (
                  <Input type="number" value={e.paidAmount || 0} onChange={evt => setExp(e.id, { paidAmount: Number(evt.target.value) || 0 })} className="h-7 w-20 text-[11px] tnum" title="Valor pago" />
                )}
                <Select value={e.status} onValueChange={v => setExp(e.id, { status: v })}>
                  <SelectTrigger className="h-8 text-[12px] w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="parcial">Parcial</SelectItem>
                    <SelectItem value="pago">Pago</SelectItem>
                  </SelectContent>
                </Select>
                <button onClick={() => removeExp(e.id)} className="text-muted-foreground hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity" title="Excluir">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {Object.keys(byCat).length > 0 && (
        <section>
          <SectionLabel className="mb-2">Por categoria</SectionLabel>
          <div className="border-t border-border max-w-xl">
            {Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([cat, v]) => (
              <div key={cat} className="flex justify-between py-2 border-b border-border text-[13px]">
                <span className="text-muted-foreground">{cat}</span>
                <span className="tnum">{formatBRLc(v)}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
