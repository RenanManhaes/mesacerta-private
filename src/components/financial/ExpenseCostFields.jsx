import React from 'react';

// Shared by the expense editor and the quick-create dialog.
export default function ExpenseCostFields({ expense, onChange }) {
  const type = expense.type || 'fixed';
  const selectClass = 'h-8 rounded-md border border-input bg-background px-2 text-[12px]';
  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="grid gap-1 text-[11px] text-muted-foreground">
        Tipo de custo
        <select aria-label="Tipo de custo" className={selectClass} value={type} onChange={e => onChange({ type: e.target.value })}>
          <option value="fixed">Fixo</option>
          <option value="perParticipant">Por pessoa</option>
          <option value="percent">Percentual</option>
        </select>
      </label>
      <label className="grid gap-1 text-[11px] text-muted-foreground">
        {type === 'percent' ? 'Percentual (%)' : type === 'perParticipant' ? 'Valor por pessoa (R$)' : 'Valor unitário (R$)'}
        <input aria-label={type === 'percent' ? 'Percentual (%)' : type === 'perParticipant' ? 'Valor por pessoa (R$)' : 'Valor unitário (R$)'} type="number" min="0" step="any" value={expense.unitValue ?? 0} onChange={e => onChange({ unitValue: Number(e.target.value) || 0 })} className="h-8 w-32 rounded-md border border-input bg-background px-2 text-[12px] tnum" />
      </label>
      {type === 'fixed' && (
        <label className="grid gap-1 text-[11px] text-muted-foreground">
          Quantidade
          <input aria-label="Quantidade" type="number" min="0" step="any" value={expense.qty ?? 1} onChange={e => onChange({ qty: Number(e.target.value) || 0 })} className="h-8 w-24 rounded-md border border-input bg-background px-2 text-[12px] tnum" />
        </label>
      )}
      {type === 'percent' && (
        <label className="grid gap-1 text-[11px] text-muted-foreground">
          Base de receita
          <select aria-label="Base de receita" className={selectClass} value={expense.revenueBase ?? 'total'} onChange={e => onChange({ revenueBase: e.target.value })}>
            <option value="total">Faturamento total previsto</option>
            <option value="sponsors">Patrocínio previsto</option>
          </select>
        </label>
      )}
    </div>
  );
}
