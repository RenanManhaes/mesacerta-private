// Notificações do sino (MCT-53). Derivadas dos dados do evento por função pura;
// o que é persistido no banco é só o estado de leitura (tabela notification_reads).
import { daysUntil } from './format.js';

export const TASK_WINDOW_DAYS = 3;
export const PAYMENT_WINDOW_DAYS = 7;
const MAX = 30;

const plural = (n, s, p) => (n === 1 ? s : p);
const when = (d) => (d < 0 ? `venceu há ${-d} ${plural(-d, 'dia', 'dias')}` : d === 0 ? 'vence hoje' : `vence em ${d} ${plural(d, 'dia', 'dias')}`);

/** @returns {{key:string,type:string,title:string,detail:string,to:string,urgency:number}[]} */
export function eventNotifications(ev, now = new Date()) {
  if (!ev) return [];
  const out = [];

  for (const t of ev.tasks || []) {
    if (t.status === 'Concluído' || !t.date) continue;
    const d = daysUntil(t.date, now);
    if (d <= TASK_WINDOW_DAYS) out.push({ key: `task:${t.id}:${t.date}`, type: 'tarefa', title: `Tarefa ${when(d)}`, detail: t.name, to: 'tarefas', urgency: d });
  }

  for (const e of ev.expenses || []) {
    if (e.status === 'pago' || !e.dueDate) continue;
    const d = daysUntil(e.dueDate, now);
    if (d <= PAYMENT_WINDOW_DAYS) out.push({ key: `payment:${e.id}:${e.dueDate}`, type: 'pagamento', title: `Pagamento ${when(d)}`, detail: e.description, to: 'despesas', urgency: d });
  }

  for (const s of ev.suppliers || []) {
    if (s.status !== 'pendente') continue;
    out.push({ key: `supplier:${s.id}:${s.paid || 0}`, type: 'fornecedor', title: 'Pendência de fornecedor', detail: s.name, to: 'fornecedores', urgency: 100 });
  }

  for (const p of ev.staffMembers || []) {
    if (p.inviteStatus === 'accepted' && p.active !== false) out.push({ key: `invite:${p.id}`, type: 'convite', title: 'Convite aceito', detail: p.name, to: 'diretores-staffs', urgency: 200 });
  }

  return out.sort((a, b) => a.urgency - b.urgency).slice(0, MAX);
}

export const unreadOf = (list, readKeys) => list.filter((n) => !readKeys.has(n.key));
