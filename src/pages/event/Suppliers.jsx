import React, { useState } from 'react';
import { useEventField } from '@/lib/useEventField';
import { useEvent } from '@/context/EventContext';
import { supplierOverview, supplierView, updateSupplierPayment } from '@/lib/selectors';
import { formatBRL, formatDateShort } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SupplierEditDialog from '@/components/suppliers/SupplierEditDialog';
import { applySupplierEdit } from '@/lib/supplierEdit';
import { Check, Plus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const STATE_BADGE = {
  quitado: { label: 'Quitado', cls: 'bg-emerald-50 text-emerald-700' },
  parcial: { label: 'Parcial', cls: 'bg-amber-50 text-amber-700' },
  orcamento: { label: 'Orçamento', cls: 'bg-slate-100 text-slate-600' }
};

const initials = (name = '') =>
  name.split(/\s+/).filter(w => /\p{L}/u.test(w)).slice(0, 2).map(w => w[0].toUpperCase()).join('') || '?';

/** @param {{label: string, value: React.ReactNode, hint: string, dark?: boolean}} props */
function SummaryCard({ label, value, hint, dark = false }) {
  return (
    <div className={`rounded-2xl border p-5 min-w-0 ${dark ? 'border-[#101828] bg-[#101828] text-white' : 'border-border bg-card'}`}>
      <div className={`text-[11px] uppercase tracking-[0.1em] ${dark ? 'text-white/60' : 'text-muted-foreground'}`}>{label}</div>
      <div className="tnum mt-1.5 text-[26px] font-semibold tracking-tight leading-none">{value}</div>
      <div className={`mt-2 text-[13px] ${dark ? 'text-white/70' : 'text-muted-foreground'}`}>{hint}</div>
    </div>
  );
}

export default function Suppliers() {
  const { currentEvent: ev, updateCurrent, commitCurrent } = useEvent();
  const [editingId, setEditingId] = useState(null);
  const { toast } = useToast();
  const o = supplierOverview(ev);
  const [paymentDrafts, setPaymentDrafts] = useEventField('suppliers.paymentDrafts', {});

  const setPaid = (id, value) => updateCurrent(e => updateSupplierPayment(e, id, value));
  const registerFull = id => {
    updateCurrent(e => updateSupplierPayment(e, id, e.suppliers.find(s => s.id === id)?.contracted || 0));
    toast({ title: 'Pagamento registrado', duration: 1800 });
  };
  // Só as informações do fornecedor; valores e pagamentos seguem em selectors.js. Se a gravação falhar, volta ao que era.
  const saveSupplier = async (id, patch) => {
    const previous = ev.suppliers.find(s => s.id === id);
    if (!previous) return;
    try { await commitCurrent(e => applySupplierEdit(e, id, patch)); }
    catch (error) {
      updateCurrent(e => ({ ...e, suppliers: e.suppliers.map(s => s.id === id ? previous : s) }));
      throw error;
    }
  };
  const editing = editingId ? ev.suppliers.find(s => s.id === editingId) : null;
  const addSupplier = () => window.dispatchEvent(new CustomEvent('mesacerta:add', { detail: 'fornecedor' }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-[26px] tracking-tight">Fornecedores</h1>
          <p className="mt-1 text-[14px] text-muted-foreground">Contratos, valores e vencimentos.</p>
        </div>
        <Button onClick={addSupplier} className="shrink-0 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Novo fornecedor
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard label="Contratados" value={o.count} hint={`${o.budgetCount} em orçamento`} />
        <SummaryCard label="Pago" value={formatBRL(o.paid)} hint={`${o.paidPercent}% do total`} />
        <SummaryCard dark label="A pagar" value={formatBRL(o.toPay)} hint={`${o.dueThisWeekCount} vence${o.dueThisWeekCount === 1 ? '' : 'm'} na semana`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {ev.suppliers.map(sup => {
          const v = supplierView(sup);
          const badge = STATE_BADGE[v.state];
          return (
            <div key={sup.id} data-testid="supplier-card" data-supplier-id={sup.id} onClick={() => setEditingId(sup.id)}
              className="relative cursor-pointer rounded-2xl border border-border bg-card p-5 min-w-0 transition-colors hover:border-foreground/25 focus-within:ring-2 focus-within:ring-ring">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-[14px] font-semibold text-accent-foreground">{initials(sup.name)}</div>
                {/* Botão de verdade (Enter/Espaço funcionam) que cobre o card inteiro; os campos de pagamento ficam acima dele. */}
                <button type="button" aria-label={`Abrir fornecedor ${sup.name}`} className="min-w-0 flex-1 text-left outline-none after:absolute after:inset-0 after:rounded-2xl after:content-['']">
                  <span className="block truncate text-[15px] font-medium tracking-tight">{sup.name}</span>
                  <span className="block truncate text-[12px] text-muted-foreground">{sup.service}</span>
                </button>
              </div>

              <div className="mt-4 flex items-end justify-between gap-2">
                <div className="tnum text-[22px] font-semibold tracking-tight leading-none">{formatBRL(sup.contracted)}</div>
                <div className="flex flex-wrap justify-end gap-1.5">
                  {v.dueLabel && <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-700">{v.dueLabel}</span>}
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${badge.cls}`}>{badge.label}</span>
                </div>
              </div>

              <div
                className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted"
                role="progressbar" aria-label={`Pagamento de ${sup.name}`}
                aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(v.progress * 100)}
              >
                <div className="h-full rounded-full bg-primary" style={{ width: `${v.progress * 100}%` }} />
              </div>
              <div className="mt-2 text-[12px] text-muted-foreground">
                {formatBRL(sup.paid)} pagos{sup.dueDate && v.toPay > 0 ? <> · vencimento {formatDateShort(sup.dueDate)}</> : null}
              </div>

              {v.toPay > 0 && (
                <div className="relative z-10 mt-4 flex flex-wrap items-center gap-2" onClick={e => e.stopPropagation()}>
                  <Input type="number" aria-label={`Valor pago a ${sup.name}`} placeholder="Valor pago" className="h-8 text-[13px] w-32" value={paymentDrafts[sup.id] || ''} onChange={e => setPaymentDrafts(d => ({ ...d, [sup.id]: e.target.value }))} onBlur={e => {
                    if (e.target.value) {
                      setPaid(sup.id, e.target.value);
                      setPaymentDrafts(d => ({ ...d, [sup.id]: '' }));
                    }
                  }} />
                  <Button size="sm" variant="outline" className="h-8 text-[13px] gap-1.5" onClick={() => registerFull(sup.id)}><Check className="h-3.5 w-3.5" /> Quitar</Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {editing && (
        <SupplierEditDialog key={editing.id} supplier={editing} categories={ev.expenseCategories || []}
          onClose={() => setEditingId(null)} onSave={patch => saveSupplier(editing.id, patch)} />
      )}
    </div>
  );
}
