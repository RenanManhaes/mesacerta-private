import React, { useId, useState } from 'react';
import { Input } from '@/components/ui/input';
import { filterTypes, findType, normalizeTypeName } from '@/lib/activityTypes';
import { cn } from '@/lib/utils';

// Campo de tipo com sugestões que casam com o texto. Valor novo vira "Criar tipo ..." e é gravado
// quando a atividade é confirmada (ver ActivityDialog).
export default function TypeCombobox({ value, onChange, types, disabled = false, id = undefined, loading = false }) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [typed, setTyped] = useState(false); // só filtra depois que a pessoa digita; ao focar mostra todos
  const name = normalizeTypeName(value);
  const matches = filterTypes(types, typed ? value : '');
  const exact = findType(types, name);
  const options = [...matches.map((t) => ({ kind: 'existing', name: t.name })), ...(name && !exact ? [{ kind: 'new', name }] : [])];

  const choose = (opt) => { onChange(opt.name); setTyped(false); setOpen(false); setActive(-1); };
  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setOpen(true);
      if (!options.length) return;
      setActive((a) => (e.key === 'ArrowDown' ? (a + 1) % options.length : (a <= 0 ? options.length - 1 : a - 1)));
    } else if (e.key === 'Enter' && open && active >= 0 && options[active]) {
      e.preventDefault(); // escolher a sugestão, não enviar o formulário
      choose(options[active]);
    }
  };

  return (
    <div className="relative">
      <Input
        id={id}
        role="combobox"
        aria-label="Tipo"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        className="h-9 text-[13px]"
        value={value || ''}
        disabled={disabled}
        placeholder={loading ? 'Carregando tipos…' : 'Digite para buscar ou criar'}
        onChange={(e) => { onChange(e.target.value); setTyped(true); setOpen(true); setActive(-1); }}
        onFocus={() => { setTyped(false); setOpen(true); }}
        onBlur={() => { setOpen(false); setActive(-1); }}
        onKeyDown={onKeyDown}
      />
      {open && options.length > 0 && (
        <ul id={listId} role="listbox" aria-label="Sugestões de tipo" className="absolute z-50 mt-1 max-h-44 w-full overflow-auto rounded-md border border-border bg-card p-1 text-[13px] shadow-md">
          {options.map((o, i) => (
            <li
              key={`${o.kind}-${o.name}`}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              data-option-kind={o.kind}
              onMouseDown={(e) => { e.preventDefault(); choose(o); }}
              onMouseEnter={() => setActive(i)}
              className={cn('cursor-pointer rounded px-2 py-1.5', i === active && 'bg-secondary', o.kind === 'new' && 'font-medium')}
            >
              {o.kind === 'new' ? <>Criar tipo “{o.name}”</> : o.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
