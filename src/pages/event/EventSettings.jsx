import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useEvent } from '@/context/EventContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SectionLabel } from '@/components/common/Primitives';
import { AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const MODULES = [
  { key: 'tickets', label: 'Venda de ingressos', desc: 'Gerencie lotes e vendas.' },
  { key: 'sponsors', label: 'Patrocínios', desc: 'Planos e patrocinadores.' },
  { key: 'suppliers', label: 'Fornecedores', desc: 'Contratos e pagamentos.' },
  { key: 'schedule', label: 'Programação', desc: 'Cronograma de atividades.' },
  { key: 'networking', label: 'Networking', desc: 'Rodadas de negócio.' }
];

export default function EventSettings() {
  const { currentEvent: ev, updateCurrent, resetDemo } = useEvent();
  const navigate = useNavigate();
  const { toast } = useToast();
  const set = (k) => (e) => updateCurrent(ev2 => ({ ...ev2, [k]: e.target ? e.target.value : e }));
  const toggleModule = (k) => updateCurrent(ev2 => ({ ...ev2, modules: { ...ev2.modules, [k]: !ev2.modules[k] }, networking: k === 'networking' ? { ...ev2.networking, enabled: !ev2.modules.networking } : ev2.networking }));

  return (
    <div className="space-y-10 animate-fade-in max-w-3xl">
      <div>
        <h1 className="font-display text-[26px] tracking-tight">Configurações</h1>
        <p className="mt-1 text-[14px] text-muted-foreground">Ajuste as informações e os módulos do evento.</p>
      </div>

      <section>
        <SectionLabel className="mb-3">Informações</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border pt-4">
          <div><Label className="text-[13px]">Nome</Label><Input className="mt-1.5 h-9 text-[13px]" value={ev.name} onChange={set('name')} /></div>
          <div><Label className="text-[13px]">Data</Label><Input type="date" className="mt-1.5 h-9 text-[13px]" value={ev.date} onChange={set('date')} /></div>
          <div><Label className="text-[13px]">Cidade / local</Label><Input className="mt-1.5 h-9 text-[13px]" value={ev.city} onChange={set('city')} /></div>
          <div><Label className="text-[13px]">Local</Label><Input className="mt-1.5 h-9 text-[13px]" value={ev.location} onChange={set('location')} /></div>
          <div><Label className="text-[13px]">Status</Label>
            <Select value={ev.status} onValueChange={v => updateCurrent(e => ({ ...e, status: v }))}>
              <SelectTrigger className="mt-1.5 h-9 text-[13px]"><SelectValue /></SelectTrigger>
              <SelectContent>{['planejamento','confirmado','andamento','finalizado'].map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label className="text-[13px]">Horário desejado de término</Label><Input type="time" className="mt-1.5 h-9 text-[13px]" value={ev.desiredEndTime} onChange={set('desiredEndTime')} /></div>
        </div>
      </section>

      <section>
        <SectionLabel className="mb-3">Público e capacidade</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-border pt-4">
          <div><Label className="text-[13px]">Público previsto</Label><Input type="number" className="mt-1.5 h-9 text-[13px] tnum" value={ev.expectedAudience} onChange={set('expectedAudience')} /></div>
          <div><Label className="text-[13px]">Capacidade</Label><Input type="number" className="mt-1.5 h-9 text-[13px] tnum" value={ev.capacity} onChange={set('capacity')} /></div>
          <div><Label className="text-[13px]">Confirmados</Label><Input type="number" className="mt-1.5 h-9 text-[13px] tnum" value={ev.confirmed} onChange={set('confirmed')} /></div>
          <div><Label className="text-[13px]">Cortesias</Label><Input type="number" className="mt-1.5 h-9 text-[13px] tnum" value={ev.complimentary} onChange={set('complimentary')} /></div>
        </div>
      </section>

      <section>
        <SectionLabel className="mb-3">Financeiro</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-border pt-4">
          <div><Label className="text-[13px]">Meta de faturamento (R$)</Label><Input type="number" className="mt-1.5 h-9 text-[13px] tnum" value={ev.goalRevenue} onChange={set('goalRevenue')} /></div>
          <div><Label className="text-[13px]">Orçamento de alimentação (R$)</Label><Input type="number" className="mt-1.5 h-9 text-[13px] tnum" value={ev.cateringBudget} onChange={set('cateringBudget')} /></div>
          <div><Label className="text-[13px]">Equipe</Label><Input type="number" className="mt-1.5 h-9 text-[13px] tnum" value={ev.staff} onChange={set('staff')} /></div>
        </div>
      </section>

      <section>
        <SectionLabel className="mb-3">Módulos</SectionLabel>
        <div className="border-t border-border">
          {MODULES.map(m => (
            <div key={m.key} className="flex items-center justify-between py-3.5 border-b border-border">
              <div><div className="text-[13px] font-medium">{m.label}</div><div className="text-[12px] text-muted-foreground">{m.desc}</div></div>
              <Switch checked={ev.modules[m.key]} onCheckedChange={() => toggleModule(m.key)} />
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border pt-6">
        <div className="flex items-start gap-2.5 rounded-md border border-danger/30 bg-danger/5 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-danger shrink-0 mt-0.5" />
          <div>
            <div className="text-[13px] font-medium text-foreground">Restaurar dados demo</div>
            <div className="text-[12px] text-muted-foreground mt-0.5">Isso substitui todos os eventos pelos dados de demonstração originais.</div>
          </div>
          <Button variant="outline" size="sm" className="ml-auto h-8 text-[13px] text-danger border-danger/30 hover:bg-danger/5" onClick={() => { resetDemo(); toast({ title: 'Dados demo restaurados', duration: 1500 }); navigate(`/event/summit-conecta-2026/dashboard`); }}>Restaurar</Button>
        </div>
      </section>
    </div>
  );
}
