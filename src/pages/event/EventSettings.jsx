import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEvent } from '@/context/EventContext';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/api/supabaseClient';
import {
  PageHeader,
  Panel,
  Field,
  initials,
} from '@/components/common/ReferenceUI';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  CalendarDays,
  Truck,
  Ticket,
  Sparkles,
  Network,
  Gauge,
  Check,
  UserPlus,
  Archive,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
/** @type {Array<[string, string, typeof CalendarDays]>} */
const modules = [
  ['schedule', 'Programação', CalendarDays],
  ['suppliers', 'Fornecedores', Truck],
  ['tickets', 'Ingressos e receitas', Ticket],
  ['sponsors', 'Patrocínios', Sparkles],
  ['networking', 'Rodadas de negócio', Network],
  ['capacity', 'Capacidade', Gauge],
];
export default function EventSettings() {
  const { currentEvent: ev, updateCurrent, orgId } = useEvent();
  const { memberships } = useAuth();
  const [draft, setDraft] = useState(() =>
    Object.fromEntries(
      [
        'name',
        'date',
        'expectedAudience',
        'location',
        'city',
        'desiredEndTime',
        'goalRevenue',
        'goalSponsorship',
        'cateringBudget',
        'status',
        'modules',
      ].map((key) => [key, key === 'modules' ? { ...ev.modules } : ev[key]]),
    ),
  );
  const [team, setTeam] = useState([]),
    [teamError, setTeamError] = useState(''),
    [email, setEmail] = useState(''),
    [invite, setInvite] = useState(false),
    [pending, setPending] = useState(false),
    [archive, setArchive] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const admin = memberships.some(
    (m) => m.organization_id === orgId && ['owner', 'admin'].includes(m.role),
  );
  const loadTeam = async () => {
    if (!orgId) return;
    const { data, error } = await supabase.rpc('platform_team', {
      p_org: orgId,
    });
    setTeam(data || []);
    setTeamError(error ? 'Não foi possível carregar a equipe.' : '');
  };
  useEffect(() => {
    let active = true;
    if (orgId)
      supabase
        .rpc('platform_team', { p_org: orgId })
        .then(({ data, error }) => {
          if (active) {
            setTeam(data || []);
            setTeamError(error ? 'Não foi possível carregar a equipe.' : '');
          }
        });
    return () => {
      active = false;
    };
  }, [orgId]);
  const set = (key, value) => setDraft((d) => ({ ...d, [key]: value }));
  const dirty = Object.keys(draft).some(key=>JSON.stringify(draft[key])!==JSON.stringify(ev[key]));
  const save = () => {
    if (!draft.name.trim()) {
      toast({ title: 'Informe o nome do evento', variant: 'destructive' });
      return;
    }
    updateCurrent((e) => ({
      ...e,
      ...draft,
      networking: { ...e.networking, enabled: !!draft.modules.networking },
    }));
    toast({
      title: 'Alterações aplicadas',
      description: 'Acompanhe o salvamento no topo.',
    });
  };
  const addMember = async (e) => {
    e.preventDefault();
    setPending(true);
    try {
      const { error } = await supabase.rpc('platform_add_member', {
        p_org: orgId,
        p_email: email,
      });
      if (error) throw error;
      await loadTeam();
      setInvite(false);
      setEmail('');
      toast({ title: 'Pessoa adicionada à organização' });
    } catch (err) {
      toast({
        title: 'Não foi possível adicionar',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setPending(false);
    }
  };
  return (
    <div className="reference-page">
      <PageHeader
        eyebrow="Evento"
        title="Configurações"
        subtitle="Dados do evento, módulos e equipe."
        actions={
          <>{dirty && <small role="status" className="text-warning">Alterações pendentes</small>}<Button onClick={save}>
            <Check size={16} />
            Salvar
          </Button></>
        }
      />
      <div className="reference-grid-2">
        <Panel title="Dados do evento">
          <div className="space-y-4">
            <Field
              label="Nome"
              value={draft.name}
              required
              onChange={(v) => set('name', v)}
            />
            <div className="reference-grid-2">
              <Field
                label="Data"
                type="date"
                value={draft.date}
                onChange={(v) => set('date', v)}
              />
              <Field
                label="Público"
                type="number"
                min={0}
                value={draft.expectedAudience}
                onChange={(v) => set('expectedAudience', Math.floor(v))}
              />
            </div>
            <Field
              label="Local"
              value={draft.location}
              onChange={(v) => set('location', v)}
            />
            <details>
              <summary className="text-sm text-muted-foreground cursor-pointer">
                Mais informações e metas
              </summary>
              <div className="reference-grid-2 mt-4">
                <Field
                  label="Cidade"
                  value={draft.city}
                  onChange={(v) => set('city', v)}
                />
                <Field
                  label="Término desejado"
                  type="time"
                  value={draft.desiredEndTime}
                  onChange={(v) => set('desiredEndTime', v)}
                />
                <Field
                  label="Meta de faturamento (R$)"
                  type="number"
                  min={0}
                  value={draft.goalRevenue}
                  onChange={(v) => set('goalRevenue', v)}
                />
                <Field
                  label="Meta de patrocínios (R$)"
                  type="number"
                  min={0}
                  value={draft.goalSponsorship}
                  onChange={(v) => set('goalSponsorship', v)}
                />
                <Field
                  label="Orçamento de alimentação (R$)"
                  type="number"
                  min={0}
                  value={draft.cateringBudget}
                  onChange={(v) => set('cateringBudget', v)}
                />
                <label className="reference-field">
                  Status
                  <select
                    value={draft.status}
                    onChange={(e) => set('status', e.target.value)}
                  >
                    {[
                      'planejamento',
                      'confirmado',
                      'andamento',
                      'finalizado',
                    ].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
              </div>
            </details>
          </div>
        </Panel>
        <Panel title="Módulos" extra={<small>Ligue só o que usa</small>}>
          {modules.map(([key, label, Icon]) => (
            <div key={key} className="reference-list-row">
              <span className="reference-avatar">
                <Icon size={16} />
              </span>
              <span>{label}</span>
              <Switch
                aria-label={label}
                checked={
                  key === 'capacity'
                    ? draft.modules.capacity !== false
                    : !!draft.modules[key]
                }
                onCheckedChange={(checked) =>
                  setDraft((d) => ({
                    ...d,
                    modules: { ...d.modules, [key]: checked },
                  }))
                }
              />
            </div>
          ))}
        </Panel>
        <Panel
          title="Equipe"
          extra={
            <Button
              variant="outline"
              size="sm"
              disabled={!admin}
              onClick={() => setInvite(true)}
            >
              <UserPlus size={16} />
              Convidar
            </Button>
          }
        >
          {team.map((m) => (
            <div className="reference-list-row" key={m.id}>
              <span className="reference-avatar coral">{initials(m.name)}</span>
              <span>
                <b>{m.name}</b>
                <small>{m.email}</small>
              </span>
              <span className="reference-tag">
                {m.role === 'owner'
                  ? 'Dono'
                  : m.role === 'admin'
                    ? 'Administrador'
                    : 'Membro'}
              </span>
            </div>
          ))}
          {teamError && <p className="text-danger text-sm">{teamError}</p>}
          <p className="text-muted-foreground text-xs mt-3">
            A equipe da organização tem acesso aos seus eventos.
          </p>
        </Panel>
        <Panel title="Zona de risco">
          <p className="text-muted-foreground text-sm mb-4">
            Arquivar remove o evento da lista principal, mas mantém os dados.
          </p>
          <Button
            variant="outline"
            className="text-danger"
            onClick={() => setArchive(true)}
          >
            <Archive size={16} />
            Arquivar evento
          </Button>
        </Panel>
      </div>
      <Dialog open={invite} onOpenChange={setInvite}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar para a organização</DialogTitle>
          </DialogHeader>
          <form onSubmit={addMember} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Informe o e-mail de uma pessoa que já criou e confirmou sua conta
              no Mesa Certa. Ela receberá acesso como membro da organização.
            </p>
            <Field
              label="E-mail"
              type="email"
              required
              value={email}
              onChange={setEmail}
            />
            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => setInvite(false)}
              >
                Cancelar
              </Button>
              <Button disabled={pending} type="submit">
                {pending ? 'Adicionando…' : 'Adicionar membro'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={archive} onOpenChange={setArchive}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Arquivar {ev.name}?</DialogTitle>
          </DialogHeader>
          <p>
            Os dados serão mantidos. Você pode restaurar o evento na lista de
            arquivados.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setArchive(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                updateCurrent((e) => ({ ...e, archived: true }));
                navigate('/eventos');
              }}
            >
              Arquivar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
