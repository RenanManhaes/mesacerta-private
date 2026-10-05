import React from 'react';
import { useEvent } from '@/context/EventContext';
import { supplierSummary, updateSupplierPayment } from '@/lib/selectors';
import { formatBRL, formatDateShort } from '@/lib/format';
import { StatusPill } from '@/components/common/Primitives';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Info } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function Suppliers() {
  const { currentEvent: ev, updateCurrent } = useEvent();
  const { toast } = useToast();
  const s = supplierSummary(ev);

  const setPaid = (id,value) => updateCurrent(e=>updateSupplierPayment(e,id,value));
  const registerFull = id => {
    updateCurrent(e=>updateSupplierPayment(e,id,e.suppliers.find(s=>s.id===id)?.contracted || 0));
    toast({ title: 'Pagamento registrado', duration: 1800 });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-[26px] tracking-tight">Fornecedores</h1>
        <p className="mt-1 text-[14px] text-muted-foreground">{s.count} contratados · {formatBRL(s.toPay)} a pagar · {s.pendingPayments} pagamentos pendentes</p>
      </div>

      <div className="flex items-start gap-2.5 rounded-md border border-border bg-card px-4 py-3">
        <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-[13px] text-muted-foreground">Cada fornecedor alimenta automaticamente as despesas. Você não precisa digitar o mesmo valor duas vezes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ev.suppliers.map(sup => {
          const toPay = sup.contracted - sup.paid;
          return (
            <div key={sup.id} className="platform-panel">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[15px] font-medium tracking-tight">{sup.name}</div>
                  <div className="text-[12px] text-muted-foreground">{sup.service} · {sup.contact}</div>
                </div>
                <StatusPill status={sup.status} />
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <div><div className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Contrato</div><div className="tnum text-[14px] mt-0.5">{formatBRL(sup.contracted)}</div></div>
                <div><div className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Pago</div><div className="tnum text-[14px] mt-0.5 text-positive">{formatBRL(sup.paid)}</div></div>
                <div><div className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">A pagar</div><div className="tnum text-[14px] mt-0.5">{formatBRL(toPay)}</div></div>
              </div>

              <div className="mt-3 text-[12px] text-muted-foreground">
                {sup.dueDate ? <>Vencimento {formatDateShort(sup.dueDate)}</> : 'Sem vencimento'} · {sup.paymentData}
              </div>
              {sup.notes && <div className="mt-1 text-[12px] text-muted-foreground/80">{sup.notes}</div>}

              {toPay > 0 && (
                <div className="mt-4 flex items-center gap-2">
                  <Input type="number" placeholder="Valor pago" className="h-8 text-[13px] w-32" onChange={() => {}} onBlur={e => e.target.value && setPaid(sup.id, e.target.value)} />
                  <Button size="sm" variant="outline" className="h-8 text-[13px] gap-1.5" onClick={() => registerFull(sup.id)}><Check className="h-3.5 w-3.5" /> Quitar</Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
