import React, { useState } from 'react';
import { useEvent } from '@/context/EventContext';
import {
  PageHeader,
  Panel,
  Field,
  initials,
} from '@/components/common/ReferenceUI';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Users } from 'lucide-react';
import { uid } from '@/lib/format';
import { saveStaffMember } from '@/lib/staff';

export default function Staff() {
  const { currentEvent: ev, updateCurrent } = useEvent();
  const [draft, setDraft] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const members = ev.staffMembers || [];
  const filtered = members.filter((p) =>
    `${p.name} ${p.role} ${p.function || ''}`
      .toLocaleLowerCase('pt-BR')
      .includes(search.toLocaleLowerCase('pt-BR')),
  );
  const edit = (p) => {
    setError('');
    setDraft({ ...p });
  };
  const save = (e) => {
    e.preventDefault();
    if (!draft.name.trim()) {
      setError('Informe o nome da pessoa.');
      return;
    }
    updateCurrent((event) =>
      saveStaffMember(event, {
        ...draft,
        name: draft.name.trim(),
        email: (draft.email || '').trim(),
        phone: (draft.phone || '').trim(),
        function: (draft.function || '').trim(),
      }),
    );
    setDraft(null);
  };
  return (
    <div className="reference-page">
      <PageHeader
        eyebrow="Planejamento"
        title="Diretores e Staffs"
        subtitle="Cadastre a equipe que realiza as tarefas deste evento."
        actions={
          <Button
            onClick={() =>
              edit({
                id: uid(),
                name: '',
                role: 'Staff',
                function: '',
                email: '',
                phone: '',
                active: true,
              })
            }
          >
            <Plus size={16} /> Nova pessoa
          </Button>
        }
      />
      <Panel
        title="Equipe do evento"
        extra={
          <span className="text-sm text-muted-foreground">
            {members.filter((p) => p.active !== false).length} pessoas ativas
          </span>
        }
      >
        <div className="mb-4">
          <Field label="Buscar pessoa" value={search} onChange={setSearch} />
        </div>
        {!filtered.length ? (
          <div className="py-8 text-center text-muted-foreground">
            <Users className="mx-auto mb-3" />
            <p>
              {members.length
                ? 'Nenhuma pessoa encontrada.'
                : 'Cadastre diretores e staffs para atribuir responsáveis às tarefas.'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => edit(p)}
                className="rounded-2xl border border-border p-4 text-left flex items-start gap-3 hover:bg-secondary/50"
              >
                <span className="rounded-xl bg-secondary text-info p-3 text-sm">
                  {initials(p.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <strong className="block break-words">{p.name}</strong>
                  <p className="text-sm text-muted-foreground">
                    {p.role}
                    {p.function ? ` · ${p.function}` : ''}
                    {p.active === false ? ' · Inativo' : ''}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {
                      ev.tasks.filter(
                        (t) => t.ownerId === p.id && t.status !== 'Concluído',
                      ).length
                    }{' '}
                    tarefas pendentes
                  </p>
                  {p.email && (
                    <p className="text-xs text-muted-foreground break-all mt-1">
                      {p.email}
                    </p>
                  )}
                  {p.phone && (
                    <p className="text-xs text-muted-foreground">{p.phone}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </Panel>
      <Dialog
        open={!!draft}
        onOpenChange={(open) => {
          if (!open) setDraft(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {members.some((p) => p.id === draft?.id)
                ? 'Editar pessoa'
                : 'Nova pessoa'}
            </DialogTitle>
            <DialogDescription>
              Essa pessoa poderá ser selecionada como responsável pelas tarefas
              do evento.
            </DialogDescription>
          </DialogHeader>
          {draft && (
            <form onSubmit={save} className="space-y-4">
              <Field
                label="Nome"
                required
                value={draft.name}
                onChange={(name) => setDraft((d) => ({ ...d, name }))}
              />
              <label className="block text-sm">
                Cargo
                <select
                  aria-label="Cargo"
                  className="mt-2 w-full rounded-md border border-border bg-card p-2"
                  value={draft.role}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, role: e.target.value }))
                  }
                >
                  <option>Diretor</option>
                  <option>Staff</option>
                </select>
              </label>
              <Field
                label="Função / área"
                value={draft.function || ''}
                onChange={(value) =>
                  setDraft((d) => ({ ...d, function: value }))
                }
              />
              <Field
                label="E-mail"
                type="email"
                value={draft.email || ''}
                onChange={(email) => setDraft((d) => ({ ...d, email }))}
              />
              <Field
                label="Telefone"
                type="tel"
                value={draft.phone || ''}
                onChange={(phone) => setDraft((d) => ({ ...d, phone }))}
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.active !== false}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, active: e.target.checked }))
                  }
                />{' '}
                Pessoa ativa para novas tarefas
              </label>
              {error && (
                <p role="alert" className="text-danger text-sm">
                  {error}
                </p>
              )}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDraft(null)}
                >
                  Cancelar
                </Button>
                <Button type="submit">Salvar pessoa</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
