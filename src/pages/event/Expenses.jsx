import React, { useState } from 'react';
import { useEvent } from '@/context/EventContext';
import {
  financialSummary,
  expenseTotal,
  expensePaid,
  saveExpense,
} from '@/lib/selectors';
import { formatBRL, uid } from '@/lib/format';
import ExpenseCostFields from '@/components/financial/ExpenseCostFields';
import {
  PageHeader,
  Kpi,
  Progress,
  Field,
} from '@/components/common/ReferenceUI';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Receipt, CheckCircle2, Clock, Plus } from 'lucide-react';
export default function Expenses() {
  const { currentEvent: ev, updateCurrent } = useEvent();
  const [draft, setDraft] = useState(null);
  const fin = financialSummary(ev);
  const patch = (p) => setDraft((d) => ({ ...d, ...p }));
  const total = draft ? expenseTotal(draft, ev.expectedAudience, fin) : 0;
  const nextDue = [...ev.expenses]
    .filter((e) => e.status !== 'pago' && e.dueDate)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
  const save = (e) => {
    e.preventDefault();
    if (draft.status === 'parcial' && draft.paidAmount > total) return;
    updateCurrent((ev) => saveExpense(ev, draft));
    setDraft(null);
  };
  return (
    <div className="reference-page">
      <PageHeader
        eyebrow="Financeiro"
        title="Despesas"
        subtitle="Tudo o que o evento custa, por categoria."
        actions={
          <Button
            onClick={() =>
              setDraft({
                id: uid(),
                description: '',
                category: 'Outros',
                type: 'fixed',
                qty: 1,
                unitValue: 0,
                dueDate: '',
                status: 'pendente',
                paidAmount: 0,
                note: '',
              })
            }
          >
            <Plus size={16} />
            Nova despesa
          </Button>
        }
      />
      <div className="reference-grid-3">
        <Kpi
          icon={Receipt}
          label="Total previsto"
          value={fin.despesasPrevistas}
          format={formatBRL}
          sub={`${new Set(ev.expenses.map((e) => e.category)).size} categorias`}
        />
        <Kpi
          icon={CheckCircle2}
          label="Pago"
          value={fin.pago}
          format={formatBRL}
          sub={`${Math.round(fin.despesasPrevistas ? (fin.pago / fin.despesasPrevistas) * 100 : 0)}% do total`}
        />
        <Kpi
          icon={Clock}
          label="A pagar"
          value={fin.aPagar}
          format={formatBRL}
          sub={
            nextDue
              ? `Próximo vencimento: ${new Date(nextDue.dueDate + 'T12:00:00').toLocaleDateString('pt-BR')}`
              : 'Sem vencimentos pendentes'
          }
          highlight
        />
      </div>
      <div className="overflow-x-auto">
        <table className="reference-table">
          <thead>
            <tr>
              <th className="text-left">Categoria</th>
              <th className="text-left">Fornecedor</th>
              <th className="text-left">Pagamento</th>
              <th className="r">Pago</th>
              <th className="r">Total</th>
              <th className="text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {ev.expenses.map((e) => {
              const total = expenseTotal(e, ev.expectedAudience, fin),
                paid = expensePaid(e, total, ev);
              const supplier = ev.suppliers.find((s) => s.id === e.supplierId);
              return (
                <tr
                  key={e.id}
                  tabIndex={0}
                  aria-label={`Editar ${e.description}`}
                  onClick={() =>
                    setDraft({ ...e, paidAmount: expensePaid(e, total, ev) })
                  }
                  onKeyDown={(evt) => {
                    if (['Enter', ' '].includes(evt.key)) {
                      evt.preventDefault();
                      setDraft({ ...e, paidAmount: expensePaid(e, total, ev) });
                    }
                  }}
                >
                  <td>
                    <b>{e.category}</b>
                    <small className="block text-muted-foreground">
                      {e.description}
                    </small>
                  </td>
                  <td className="text-muted-foreground">
                    {supplier?.name || 'Sem fornecedor'}
                  </td>
                  <td>
                    <Progress
                      value={paid}
                      total={total}
                      tone={e.status === 'pago' ? 'green' : 'blue'}
                    />
                  </td>
                  <td className="r">{formatBRL(paid)}</td>
                  <td className="r">{formatBRL(total)}</td>
                  <td>
                    <span
                      className={`reference-tag ${e.status === 'pago' ? 'positive' : 'warning'}`}
                    >
                      ●{' '}
                      {e.status === 'pago'
                        ? 'Quitado'
                        : e.status === 'parcial'
                          ? 'Parcial'
                          : 'Pendente'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!ev.expenses.length && (
          <p className="platform-panel text-muted-foreground">
            Nenhuma despesa cadastrada.
          </p>
        )}
      </div>
      <Dialog
        open={!!draft}
        onOpenChange={(v) => {
          if (!v) setDraft(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Despesa</DialogTitle>
          </DialogHeader>
          {draft && (
            <form onSubmit={save} className="space-y-4">
              <Field
                label="Descrição"
                value={draft.description}
                required
                onChange={(description) => patch({ description })}
              />
              <div className="reference-grid-2">
                <label className="reference-field">
                  Categoria
                  <select
                    value={draft.category}
                    onChange={(e) => patch({ category: e.target.value })}
                  >
                    {ev.expenseCategories.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label className="reference-field">
                  Fornecedor
                  <select
                    value={draft.supplierId || ''}
                    onChange={(e) => patch({ supplierId: e.target.value })}
                  >
                    <option value="">Sem fornecedor</option>
                    {ev.suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <ExpenseCostFields expense={draft} onChange={patch} />
              <div className="reference-grid-2">
                <Field
                  label="Vencimento"
                  type="date"
                  value={draft.dueDate}
                  onChange={(dueDate) => patch({ dueDate })}
                />
                <Field
                  label="Data do pagamento"
                  type="date"
                  value={draft.paidDate}
                  onChange={(paidDate) => patch({ paidDate })}
                />
                <label className="reference-field">
                  Situação
                  <select
                    value={draft.status}
                    onChange={(e) => patch({ status: e.target.value })}
                  >
                    <option value="pendente">Pendente</option>
                    <option value="parcial">Parcial</option>
                    <option value="pago">Quitado</option>
                  </select>
                </label>
                {draft.status === 'parcial' && (
                  <Field
                    label="Valor pago (R$)"
                    type="number"
                    min={0}
                    max={total}
                    value={draft.paidAmount || 0}
                    onChange={(paidAmount) => patch({ paidAmount })}
                  />
                )}
              </div>
              <Field
                label="Observações"
                value={draft.note}
                onChange={(note) => patch({ note })}
              />
              <div className="reference-progress-label">
                <span>Total da despesa</span>
                <b>{formatBRL(total)}</b>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDraft(null)}
                >
                  Cancelar
                </Button>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
