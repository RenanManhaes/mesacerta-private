// Test harness imported only by browser.test.mjs; no application route.
import React from 'react';
import { createRoot } from 'react-dom/client';
import TablePlan from './TablePlan';

export function mountTable({ capacity, count }) {
  const target = document.createElement('main');
  target.style.cssText = 'max-width:360px;margin:auto;padding:10px';
  document.body.replaceChildren(target);
  createRoot(target).render(<TablePlan table={{ id: 'overflow', name: 'Mesa teste', company: 'Almeida', capacity }} round={1}
    occupants={Array.from({ length: count }, (_, i) => ({ person: { id: `test-${i}`, name: `Pessoa ${i + 1}`, company: 'Almeida', role: i === 0 ? 'fixed' : 'rotating' }, fixed: i === 0 }))}
    onPerson={() => {}} onTable={() => {}} />);
}
