import { useEventField } from '@/lib/useEventField';
import React, { useState } from 'react';
import { useEvent } from '@/context/EventContext';
import { uid } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Plus, User, ListChecks, Wallet, Ticket, Truck, CalendarDays, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import ExpenseCostFields from '@/components/financial/ExpenseCostFields';
import TaskOwnerSelect from '@/components/common/TaskOwnerSelect';

const TYPES = [
  { key: 'participante', label: 'Participante', icon: User },
  { key: 'tarefa', label: 'Tarefa', icon: ListChecks },
  { key: 'despesa', label: 'Despesa', icon: Wallet },
  { key: 'receita', label: 'Receita', icon: Ticket },
  { key: 'fornecedor', label: 'Fornecedor', icon: Truck },
  { key: 'atividade', label: 'Atividade', icon: CalendarDays },
  { key: 'patrocinador', label: 'Patrocinador', icon: Sparkles }
];

const fieldCls = 'h-9 text-[13px]';
const labelCls = 'text-[12px] font-medium';

export default function AddMenu() {
  const { currentEvent, updateCurrent } = useEvent();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [type, setType] = useEventField('add.type', null);
  const [form, setForm] = useEventField('add.form', {});

  const openFor = (t) => { if (t !== type) setForm({}); setType(t); setOpen(true); };
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = () => {
    if (!type || !currentEvent) return;
    updateCurrent(ev => {
      switch (type) {
        case 'participante':
          return { ...ev, participants: [{ id: uid(), name: form.name || 'Sem nome', email: form.email || '', phone: '', company: form.company || '', type: form.type || 'Participante', status: 'Pendente' }, ...ev.participants] };
        case 'tarefa':
          return { ...ev, tasks: [{ id: uid(), name: form.name || 'Nova tarefa', ownerId: form.ownerId || '', owner: (ev.staffMembers || []).find(p=>p.id===form.ownerId && p.active!==false)?.name || '', date: form.date || '', category: form.category || 'Operação', priority: form.priority || 'Normal', status: 'A fazer' }, ...ev.tasks] };
        case 'despesa':
          return { ...ev, expenses: [{ id: uid(), description: form.description || 'Despesa', category: form.category || 'Outros', type: form.type || 'fixed', revenueBase: form.revenueBase || 'total', qty: Number(form.qty ?? 1), unitValue: Number(form.unitValue) || 0, dueDate: form.dueDate || '', status: 'pendente', note: '' }, ...ev.expenses] };
        case 'receita':
          return { ...ev, revenues: [{ id: uid(), description: form.description || 'Receita', type: form.type || 'Outros', expected: Number(form.expected) || 0, received: 0, expectedDate: form.expectedDate || '', receivedDate: null, category: form.type || 'Outros', status: 'previsto' }, ...ev.revenues] };
        case 'fornecedor':
          return { ...ev, suppliers: [{ id: uid(), name: form.name || 'Fornecedor', service: form.service || '', contact: '', contracted: Number(form.contracted) || 0, paid: Number(form.paid) || 0, entry: 0, nextDue: form.dueDate || null, dueDate: form.dueDate || null, paymentData: '', notes: '', status: Number(form.paid) >= Number(form.contracted) && form.contracted ? 'pago' : 'pendente', expenseCategory: form.service || 'Outros', expenseType: 'fixed' }, ...ev.suppliers] };
        case 'atividade':
          return { ...ev, schedule: [...ev.schedule, { id: uid(), start: form.start || '09:00', duration: Number(form.duration) || 30, title: form.title || 'Atividade', type: form.type || 'Personalizado', speaker: '', room: '' }] };
        case 'patrocinador':
          return { ...ev, sponsors: [{ id: uid(), company: form.company || 'Empresa', contact: '', plan: form.plan || 'Apoio', negotiated: Number(form.negotiated) || 0, received: 0, dueDate: form.dueDate || '', guests: 0, status: 'pendente', deliverables: '' }, ...ev.sponsors] };
        default: return ev;
      }
    });
    toast({ title: `${TYPES.find(t => t.key === type).label} adicionado`, duration: 1800 });
    setForm({});
    setOpen(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" className="h-8 gap-1.5 text-[13px]">
            <Plus className="h-3.5 w-3.5" /> Adicionar
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {TYPES.map(t => (
            <DropdownMenuItem key={t.key} onClick={() => openFor(t.key)} className="gap-2.5 py-1.5 text-[13px]">
              <t.icon className="h-3.5 w-3.5 text-muted-foreground" />
              {t.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="text-[15px]">Adicionar {type && TYPES.find(t => t.key === type).label.toLowerCase()}</DialogTitle>
            <DialogDescription className="sr-only">Preencha os dados e salve para adicionar ao evento atual.</DialogDescription>
          </DialogHeader>

          {type === 'participante' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label className={labelCls}>Nome</Label><Input className={fieldCls} value={form.name || ''} onChange={e => set('name', e.target.value)} /></div>
              <div><Label className={labelCls}>Email</Label><Input className={fieldCls} value={form.email || ''} onChange={e => set('email', e.target.value)} /></div>
              <div><Label className={labelCls}>Empresa</Label><Input className={fieldCls} value={form.company || ''} onChange={e => set('company', e.target.value)} /></div>
              <div className="col-span-2"><Label className={labelCls}>Tipo</Label>
                <Select value={form.type || 'Participante'} onValueChange={v => set('type', v)}>
                  <SelectTrigger className={fieldCls}><SelectValue /></SelectTrigger>
                  <SelectContent>{['Participante','Convidado','VIP','Palestrante','Equipe','Patrocinador','Expositor','Outro'].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          )}

          {type === 'tarefa' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label className={labelCls}>Tarefa</Label><Input className={fieldCls} value={form.name || ''} onChange={e => set('name', e.target.value)} /></div>
              <div><Label className={labelCls}>Responsável</Label><TaskOwnerSelect members={currentEvent.staffMembers || []} ownerId={form.ownerId || ''} onChange={id=>set('ownerId',id)}/></div>
              <div><Label className={labelCls}>Data</Label><Input type="date" className={fieldCls} value={form.date || ''} onChange={e => set('date', e.target.value)} /></div>
              <div><Label className={labelCls}>Prioridade</Label>
                <Select value={form.priority || 'Normal'} onValueChange={v => set('priority', v)}>
                  <SelectTrigger className={fieldCls}><SelectValue /></SelectTrigger><SelectContent>{['Normal','Alta','Crítica'].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className={labelCls}>Categoria</Label><Input className={fieldCls} value={form.category || ''} onChange={e => set('category', e.target.value)} /></div>
            </div>
          )}

          {type === 'despesa' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label className={labelCls}>Descrição</Label><Input className={fieldCls} value={form.description || ''} onChange={e => set('description', e.target.value)} /></div>
              <div><Label className={labelCls}>Categoria</Label>
                <Select value={form.category || 'Outros'} onValueChange={v => set('category', v)}>
                  <SelectTrigger className={fieldCls}><SelectValue /></SelectTrigger><SelectContent>{currentEvent.expenseCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2"><ExpenseCostFields expense={form} onChange={patch => setForm(f => ({ ...f, ...patch }))} /></div>
              <div><Label className={labelCls}>Vencimento</Label><Input type="date" className={fieldCls} value={form.dueDate || ''} onChange={e => set('dueDate', e.target.value)} /></div>
            </div>
          )}

          {type === 'receita' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label className={labelCls}>Descrição</Label><Input className={fieldCls} value={form.description || ''} onChange={e => set('description', e.target.value)} /></div>
              <div><Label className={labelCls}>Tipo</Label>
                <Select value={form.type || 'Outros'} onValueChange={v => set('type', v)}>
                  <SelectTrigger className={fieldCls}><SelectValue /></SelectTrigger><SelectContent>{currentEvent.revenueCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className={labelCls}>Valor previsto</Label><Input type="number" className={fieldCls} value={form.expected || ''} onChange={e => set('expected', e.target.value)} /></div>
              <div className="col-span-2"><Label className={labelCls}>Data prevista</Label><Input type="date" className={fieldCls} value={form.expectedDate || ''} onChange={e => set('expectedDate', e.target.value)} /></div>
            </div>
          )}

          {type === 'fornecedor' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label className={labelCls}>Nome</Label><Input className={fieldCls} value={form.name || ''} onChange={e => set('name', e.target.value)} /></div>
              <div><Label className={labelCls}>Serviço</Label><Input className={fieldCls} value={form.service || ''} onChange={e => set('service', e.target.value)} /></div>
              <div><Label className={labelCls}>Contratado</Label><Input type="number" className={fieldCls} value={form.contracted || ''} onChange={e => set('contracted', e.target.value)} /></div>
              <div><Label className={labelCls}>Pago</Label><Input type="number" className={fieldCls} value={form.paid || ''} onChange={e => set('paid', e.target.value)} /></div>
              <div><Label className={labelCls}>Vencimento</Label><Input type="date" className={fieldCls} value={form.dueDate || ''} onChange={e => set('dueDate', e.target.value)} /></div>
            </div>
          )}

          {type === 'atividade' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label className={labelCls}>Título</Label><Input className={fieldCls} value={form.title || ''} onChange={e => set('title', e.target.value)} /></div>
              <div><Label className={labelCls}>Início</Label><Input type="time" className={fieldCls} value={form.start || '09:00'} onChange={e => set('start', e.target.value)} /></div>
              <div><Label className={labelCls}>Duração (min)</Label><Input type="number" className={fieldCls} value={form.duration || 30} onChange={e => set('duration', e.target.value)} /></div>
              <div className="col-span-2"><Label className={labelCls}>Tipo</Label>
                <Select value={form.type || 'Palestra'} onValueChange={v => set('type', v)}>
                  <SelectTrigger className={fieldCls}><SelectValue /></SelectTrigger><SelectContent>{['Credenciamento','Abertura','Palestra','Painel','Workshop','Intervalo','Almoço','Networking','Apresentação','Encerramento','Personalizado'].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          )}

          {type === 'patrocinador' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label className={labelCls}>Empresa</Label><Input className={fieldCls} value={form.company || ''} onChange={e => set('company', e.target.value)} /></div>
              <div><Label className={labelCls}>Plano</Label>
                <Select value={form.plan || 'Apoio'} onValueChange={v => set('plan', v)}>
                  <SelectTrigger className={fieldCls}><SelectValue /></SelectTrigger><SelectContent>{currentEvent.sponsorPlans.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}<SelectItem value="Personalizado">Personalizado</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label className={labelCls}>Valor negociado</Label><Input type="number" className={fieldCls} value={form.negotiated || ''} onChange={e => set('negotiated', e.target.value)} /></div>
              <div className="col-span-2"><Label className={labelCls}>Vencimento</Label><Input type="date" className={fieldCls} value={form.dueDate || ''} onChange={e => set('dueDate', e.target.value)} /></div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} className="h-8 text-[13px]">Cancelar</Button>
            <Button onClick={submit} className="h-8 text-[13px]">Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
