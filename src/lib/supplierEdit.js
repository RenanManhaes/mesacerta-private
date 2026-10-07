// Edição das INFORMAÇÕES do fornecedor. Valores (contratado, pago, status) e lançamentos
// continuam no modelo financeiro central (selectors.js): esta função não os toca.
export function applySupplierEdit(event, id, patch) {
  if (!(event.suppliers || []).some((s) => s.id === id)) return event;
  const text = (v) => String(v ?? '').trim();
  return {
    ...event,
    suppliers: event.suppliers.map((s) => {
      if (s.id !== id) return s;
      const dueDate = text(patch.dueDate) || null;
      return {
        ...s,
        name: text(patch.name) || s.name,
        service: text(patch.service),
        expenseCategory: text(patch.expenseCategory) || s.expenseCategory || 'Outros',
        contact: text(patch.contact),
        paymentData: text(patch.paymentData),
        notes: String(patch.notes ?? '').slice(0, 2000),
        dueDate,
        nextDue: dueDate,
      };
    }),
  };
}
