import { useEventField } from '@/lib/useEventField';
import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useEvent } from '@/context/EventContext';
import { capacitySummary } from '@/lib/selectors';
import { EmptyState } from '@/components/common/Primitives';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Upload } from 'lucide-react';

const TYPES = ['Participante','Convidado','VIP','Palestrante','Equipe','Patrocinador','Expositor','Outro'];
const STATUSES = ['Confirmado','Pendente','Cancelado','Check-in realizado'];

export default function Participants() {
  const { currentEvent: ev, updateCurrent } = useEvent();
  const [params] = useSearchParams();
  const [q, setQ] = useEventField('participants.query', params.get('q') || '');
  const [type, setType] = useEventField('participants.type', 'all');
  const [status, setStatus] = useEventField('participants.status', 'all');
  const cap = capacitySummary(ev);

  const setTypeField = (id, t) => updateCurrent(e => ({ ...e, participants: e.participants.map(p => p.id === id ? { ...p, type: t } : p) }));
  const setStatusField = (id, s) => updateCurrent(e => ({ ...e, participants: e.participants.map(p => p.id === id ? { ...p, status: s } : p) }));

  const filtered = useMemo(() => ev.participants.filter(p => {
    if (q && !(`${p.name} ${p.email} ${p.company}`.toLowerCase().includes(q.toLowerCase()))) return false;
    if (type !== 'all' && p.type !== type) return false;
    if (status !== 'all' && p.status !== status) return false;
    return true;
  }), [ev.participants, q, type, status]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-[26px] tracking-tight">Participantes</h1>
          <p className="mt-1 text-[14px] text-muted-foreground">{ev.confirmed} confirmados · {ev.pending} pendentes · {cap.available} lugares restantes</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-muted-foreground">Importação de planilha em construção</span>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-[13px]" disabled title="Importação de planilha em construção"><Upload className="h-3.5 w-3.5" /> Importar</Button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por nome, email, empresa" className="h-9 pl-8 text-[13px]" />
        </div>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="h-9 w-40 text-[13px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent><SelectItem value="all">Todos os tipos</SelectItem>{TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-9 w-44 text-[13px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent><SelectItem value="all">Todos os status</SelectItem>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Nenhum participante encontrado" hint="Ajuste os filtros ou use o botão Adicionar no topo." />
      ) : (
        <div className="platform-data-table">
          <div className="grid grid-cols-12 gap-3 px-2 pb-2 border-b border-border text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
            <div className="col-span-4">Nome</div><div className="col-span-3 hidden sm:block">Empresa</div>
            <div className="col-span-2">Tipo</div><div className="col-span-3 sm:col-span-2 text-right">Status</div>
          </div>
          {filtered.map(p => (
            <div key={p.id} className="grid grid-cols-12 gap-3 px-2 py-2.5 border-b border-border items-center text-[13px]">
              <div className="col-span-4 min-w-0"><div className="font-medium truncate">{p.name}</div><div className="text-[11px] text-muted-foreground truncate">{p.email}</div></div>
              <div className="col-span-3 hidden sm:block text-muted-foreground truncate">{p.company}</div>
              <div className="col-span-2">
                <Select value={p.type} onValueChange={v => setTypeField(p.id, v)}>
                  <SelectTrigger className="h-7 w-full text-[12px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-3 sm:col-span-2 flex justify-end">
                <Select value={p.status} onValueChange={v => setStatusField(p.id, v)}>
                  <SelectTrigger className="h-7 w-32 text-[12px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
