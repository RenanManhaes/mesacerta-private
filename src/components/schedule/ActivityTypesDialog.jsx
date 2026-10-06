import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { useEvent } from '@/context/EventContext';
import { useActivityTypes } from '@/hooks/useActivityTypes';
import { countUsage, renameInEvent, normalizeTypeName } from '@/lib/activityTypes';

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

// Gerenciamento dos tipos da organização: criar, renomear e excluir (avisa quantas atividades usam).
export default function ActivityTypesDialog({ open, onOpenChange }) {
  const { events, orgId, updateEventById } = useEvent();
  const { types, loading, error: loadError, create, rename, remove } = useActivityTypes(orgId);
  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState(null); // { id, name }
  const [pendingDelete, setPendingDelete] = useState(null); // tipo a excluir (mantido durante a animação de saída)
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (fn) => {
    setBusy(true); setError('');
    try { await fn(); } catch (e) { setError(e.message || 'Não foi possível concluir.'); } finally { setBusy(false); }
  };

  const add = (e) => {
    e.preventDefault();
    if (!normalizeTypeName(newName)) return;
    run(async () => { await create(newName); setNewName(''); });
  };
  const saveRename = (t) => run(async () => {
    const to = normalizeTypeName(editing.name);
    if (to === t.name) { setEditing(null); return; }
    const saved = await rename(t.id, to);
    // As atividades guardam o nome do tipo: acompanham o novo nome em todos os eventos da organização.
    events.forEach((ev) => updateEventById(ev.id, (cur) => renameInEvent(cur, t.name, saved.name)));
    setEditing(null);
  });
  const confirmDelete = () => run(async () => { await remove(pendingDelete.id); setConfirmOpen(false); });
  const usage = pendingDelete ? countUsage(events, pendingDelete.name) : null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[480px] max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[15px]">Tipos de atividade</DialogTitle>
            <DialogDescription className="text-[12px]">Valem para todos os eventos da organização.</DialogDescription>
          </DialogHeader>
          <form onSubmit={add} className="flex gap-2">
            <Input aria-label="Novo tipo" className="h-9 text-[13px]" placeholder="Novo tipo" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <Button type="submit" disabled={busy || !normalizeTypeName(newName)} className="h-9 text-[13px]">Adicionar</Button>
          </form>
          {(error || loadError) && <p role="alert" className="text-[12px] text-danger">{error || `Não foi possível carregar os tipos: ${loadError.message}`}</p>}
          {loading && <p className="text-[12px] text-muted-foreground">Carregando…</p>}
          <ul className="divide-y divide-border" aria-label="Tipos cadastrados">
            {types.map((t) => {
              const u = countUsage(events, t.name);
              const isEditing = editing?.id === t.id;
              return (
                <li key={t.id} data-type-row={t.name} className="flex items-center gap-2 py-2">
                  {isEditing ? (
                    <form className="flex flex-1 items-center gap-2" onSubmit={(e) => { e.preventDefault(); saveRename(t); }}>
                      <Input aria-label={`Novo nome para ${t.name}`} autoFocus className="h-8 text-[13px]" value={editing.name} onChange={(e) => setEditing({ id: t.id, name: e.target.value })} />
                      <Button type="submit" variant="ghost" size="icon" className="h-7 w-7" aria-label="Salvar nome" disabled={busy}><Check className="h-3.5 w-3.5" /></Button>
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7" aria-label="Cancelar renomear" onClick={() => { setEditing(null); setError(''); }}><X className="h-3.5 w-3.5" /></Button>
                    </form>
                  ) : (
                    <>
                      <span className="flex-1 text-[13px]">{t.name}</span>
                      <span className="text-[11px] text-muted-foreground">{u.activities ? plural(u.activities, 'atividade', 'atividades') : 'sem uso'}</span>
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7" aria-label={`Renomear ${t.name}`} onClick={() => { setEditing({ id: t.id, name: t.name }); setError(''); }}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-danger" aria-label={`Excluir ${t.name}`} onClick={() => { setError(''); setPendingDelete(t); setConfirmOpen(true); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent role="alertdialog" className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="text-[15px]">Excluir o tipo “{pendingDelete?.name}”?</DialogTitle>
            <DialogDescription data-testid="delete-usage" className="text-[13px]">
              {usage?.activities
                ? `Este tipo está em uso por ${plural(usage.activities, 'atividade', 'atividades')} em ${plural(usage.events, 'evento', 'eventos')}. Elas continuam com o nome “${pendingDelete.name}”, mas o tipo deixa de aparecer nas sugestões.`
                : 'Este tipo não está em uso por nenhuma atividade.'}
            </DialogDescription>
          </DialogHeader>
          {error && <p role="alert" className="text-[12px] text-danger">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" className="h-8 text-[13px]" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
            <Button type="button" variant="destructive" disabled={busy} className="h-8 text-[13px]" onClick={confirmDelete}>Excluir tipo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
