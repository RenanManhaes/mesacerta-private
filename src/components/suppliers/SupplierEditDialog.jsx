import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supplierView } from '@/lib/selectors';
import { formatBRL } from '@/lib/format';

const draftOf = (s) => ({
  name: s.name || '', service: s.service || '', expenseCategory: s.expenseCategory || 'Outros',
  contact: s.contact || '', paymentData: s.paymentData || '', notes: s.notes || '', dueDate: s.dueDate || '',
});

/**
 * Informações de um fornecedor. O resumo de valores é só leitura (vem de selectors.js);
 * pagamentos continuam no botão Quitar / campo de valor do card e em Despesas.
 * @param {{supplier: any, categories: string[], onClose: () => void, onSave: (patch: any) => Promise<void>}} props
 */
export default function SupplierEditDialog({ supplier, categories, onClose, onSave }) {
  const initial = draftOf(supplier);
  const [draft, setDraft] = useState(initial);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [askDiscard, setAskDiscard] = useState(false);
  const set = (key) => (e) => setDraft((d) => ({ ...d, [key]: e.target.value }));
  const dirty = Object.keys(initial).some((k) => initial[k] !== draft[k]);
  const requestClose = () => (dirty && !saving ? setAskDiscard(true) : onClose());
  const view = supplierView(supplier);
  const cats = categories.includes(draft.expenseCategory) ? categories : [draft.expenseCategory, ...categories];

  const save = async () => {
    if (!draft.name.trim()) { setError('Dê um nome para o fornecedor.'); return; }
    setSaving(true); setError('');
    try { await onSave(draft); }
    catch { setError('Não foi possível salvar. Suas alterações continuam aqui; tente de novo.'); setSaving(false); return; }
    setSaving(false);
    onClose();
  };

  const field = 'space-y-1.5';
  const label = 'text-[12px] font-medium';
  return (
    <>
      <Dialog open onOpenChange={(open) => { if (!open) requestClose(); }}>
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto" data-testid="supplier-dialog">
          <DialogHeader>
            <DialogTitle className="text-[16px]">Fornecedor</DialogTitle>
            <DialogDescription>Dados de contato e do contrato. Valores e pagamentos ficam nos cards e em Despesas.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-2 rounded-xl bg-muted p-3 text-center" data-testid="supplier-summary">
            <div><div className="text-[11px] uppercase tracking-wide text-muted-foreground">Contratado</div><div className="tnum text-[14px] font-semibold">{formatBRL(supplier.contracted || 0)}</div></div>
            <div><div className="text-[11px] uppercase tracking-wide text-muted-foreground">Pago</div><div className="tnum text-[14px] font-semibold">{formatBRL(supplier.paid || 0)}</div></div>
            <div><div className="text-[11px] uppercase tracking-wide text-muted-foreground">A pagar</div><div className="tnum text-[14px] font-semibold">{formatBRL(view.toPay)}</div></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={`col-span-2 ${field}`}><Label htmlFor="sup-name" className={label}>Nome</Label><Input id="sup-name" value={draft.name} maxLength={200} onChange={set('name')} /></div>
            <div className={field}><Label htmlFor="sup-service" className={label}>Serviço</Label><Input id="sup-service" value={draft.service} onChange={set('service')} /></div>
            <div className={field}><Label className={label}>Categoria</Label>
              <Select value={draft.expenseCategory} onValueChange={(v) => setDraft((d) => ({ ...d, expenseCategory: v }))}>
                <SelectTrigger aria-label="Categoria" className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
                <SelectContent>{cats.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className={`col-span-2 ${field}`}><Label htmlFor="sup-contact" className={label}>Contato</Label><Input id="sup-contact" value={draft.contact} placeholder="E-mail ou telefone" onChange={set('contact')} /></div>
            <div className={field}><Label htmlFor="sup-due" className={label}>Vencimento</Label><Input id="sup-due" type="date" value={draft.dueDate} onChange={set('dueDate')} /></div>
            <div className={field}><Label htmlFor="sup-pay" className={label}>Dados de pagamento</Label><Input id="sup-pay" value={draft.paymentData} placeholder="PIX, banco…" onChange={set('paymentData')} /></div>
            <div className={`col-span-2 ${field}`}><Label htmlFor="sup-notes" className={label}>Observações</Label><Textarea id="sup-notes" rows={3} value={draft.notes} maxLength={2000} onChange={set('notes')} /></div>
          </div>

          {error && <p role="alert" className="text-[13px] text-danger">{error}</p>}

          <DialogFooter>
            <Button variant="ghost" onClick={requestClose}>Cancelar</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Salvando…' : 'Salvar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={askDiscard} onOpenChange={setAskDiscard}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar as alterações?</AlertDialogTitle>
            <AlertDialogDescription>O que você mudou neste fornecedor ainda não foi salvo.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar editando</AlertDialogCancel>
            <AlertDialogAction onClick={onClose}>Descartar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
