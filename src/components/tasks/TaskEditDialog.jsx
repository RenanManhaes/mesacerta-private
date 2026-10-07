import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SearchSuggestions from '@/components/common/SearchSuggestions';
import { MAX_DESCRIPTION, findMember, legacyOwnerMatches, memberLabel, searchMembers, taskOwnerIds } from '@/lib/taskOwners';

const sameList = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

/**
 * Edição de uma tarefa. Fundador e diretor mudam título, descrição e responsáveis;
 * staff só enxerga (e muda o status). O banco também recusa o que o staff não pode.
 * @param {{task: any, members: any[], statuses: string[], canEdit: boolean, onClose: () => void, onSave: (patch: any) => Promise<void>, onStatus: (status: string) => void}} props
 */
export default function TaskEditDialog({ task, members, statuses, canEdit, onClose, onSave, onStatus }) {
  const [name, setName] = useState(task.name || '');
  const [description, setDescription] = useState(task.description || '');
  const current = taskOwnerIds(task);
  const initialIds = current.length ? current : legacyOwnerMatches(task, members);
  const initialLegacy = initialIds.length ? '' : task.owner || '';
  const [ownerIds, setOwnerIds] = useState(initialIds);
  const [legacyOwner, setLegacyOwner] = useState(initialLegacy);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [askDiscard, setAskDiscard] = useState(false);

  const dirty = canEdit && (
    name !== (task.name || '') || description !== (task.description || '') ||
    !sameList(ownerIds, initialIds) || legacyOwner !== initialLegacy
  );
  const requestClose = () => (dirty && !saving ? setAskDiscard(true) : onClose());

  const options = searchMembers(members, query, ownerIds).map((p) => ({ id: p.id, value: p.id, label: memberLabel(p) }));
  const add = (option) => { setOwnerIds((ids) => (ids.includes(option.id) ? ids : [...ids, option.id])); setLegacyOwner(''); setQuery(''); };
  const remove = (id) => setOwnerIds((ids) => ids.filter((x) => x !== id));

  const save = async () => {
    if (!name.trim()) { setError('Dê um nome para a tarefa.'); return; }
    setSaving(true); setError('');
    try { await onSave({ name, description, ownerIds, legacyOwner }); }
    catch { setError('Não foi possível salvar. Suas alterações continuam aqui; tente de novo.'); setSaving(false); return; }
    setSaving(false);
    onClose();
  };

  const chip = 'inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2.5 py-1 text-[12px]';

  return (
    <>
      <Dialog open onOpenChange={(open) => { if (!open) requestClose(); }}>
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto" data-testid="task-dialog">
          <DialogHeader>
            <DialogTitle className="text-[16px]">{canEdit ? 'Editar tarefa' : 'Tarefa'}</DialogTitle>
            <DialogDescription>{canEdit ? 'Mude o nome, escreva detalhes e escolha quem cuida dela.' : 'Você pode mudar só o status das suas tarefas.'}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="task-name" className="text-[12px] font-medium">Nome da tarefa</Label>
              <Input id="task-name" value={name} disabled={!canEdit} maxLength={200} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="task-description" className="text-[12px] font-medium">Descrição</Label>
              <Textarea id="task-description" rows={4} value={description} disabled={!canEdit} maxLength={MAX_DESCRIPTION}
                placeholder={canEdit ? 'O que precisa ser feito? Escreva do seu jeito.' : 'Sem descrição.'} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium">Responsáveis</Label>
              <div className="flex flex-wrap gap-1.5" data-testid="task-owners">
                {ownerIds.map((id) => {
                  const person = findMember(members, id);
                  return (
                    <span key={id} className={chip} data-owner-id={id}>
                      {person ? person.name : 'Pessoa fora da equipe'}
                      {canEdit && <button type="button" aria-label={`Tirar ${person ? person.name : 'responsável'}`} onClick={() => remove(id)} className="rounded-full p-0.5 hover:bg-accent"><X className="h-3 w-3" /></button>}
                    </span>
                  );
                })}
                {legacyOwner && (
                  <span className={chip}>{legacyOwner} (cadastro anterior)
                    {canEdit && <button type="button" aria-label={`Tirar ${legacyOwner}`} onClick={() => setLegacyOwner('')} className="rounded-full p-0.5 hover:bg-accent"><X className="h-3 w-3" /></button>}
                  </span>
                )}
                {!ownerIds.length && !legacyOwner && <span className="text-[12px] text-muted-foreground">Sem responsável</span>}
              </div>
              {canEdit && (
                <SearchSuggestions label="Buscar responsável" placeholder="Digite um nome da equipe" value={query} onChange={setQuery} options={options} onSelect={add} />
              )}
              {canEdit && members.length > 0 && !options.length && query && <p className="text-[12px] text-muted-foreground">Ninguém da equipe com esse nome.</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium">Status</Label>
              <Select value={task.status} onValueChange={onStatus}>
                <SelectTrigger aria-label="Status da tarefa" className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
                <SelectContent>{statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            {error && <p role="alert" className="text-[13px] text-danger">{error}</p>}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={requestClose}>{canEdit ? 'Cancelar' : 'Fechar'}</Button>
            {canEdit && <Button onClick={save} disabled={saving}>{saving ? 'Salvando…' : 'Salvar'}</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={askDiscard} onOpenChange={setAskDiscard}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar as alterações?</AlertDialogTitle>
            <AlertDialogDescription>O que você mudou nesta tarefa ainda não foi salvo.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar editando</AlertDialogCancel>
            <AlertDialogAction onClick={onClose}>Descartar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
