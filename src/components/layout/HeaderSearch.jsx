import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useEvent } from '@/context/EventContext';
import { MIN_QUERY, flatten, itemPath, searchEvent } from '@/lib/headerSearch';

// MCT-48: sugestões enquanto digita, agrupadas por tipo, com teclado e clique.
export default function HeaderSearch() {
  const { currentEvent } = useEvent();
  const navigate = useNavigate();
  const [term, setTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const box = useRef(null);
  const listId = useId();

  const groups = useMemo(() => searchEvent(currentEvent, term), [currentEvent, term]);
  const flat = useMemo(() => flatten(groups), [groups]);
  const ready = term.trim().length >= MIN_QUERY;
  const showMenu = open && ready;

  useEffect(() => {
    const away = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', away);
    return () => document.removeEventListener('mousedown', away);
  }, []);

  const go = (item) => {
    setOpen(false);
    setActive(-1);
    navigate(itemPath(currentEvent.id, item));
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') { setOpen(false); setActive(-1); return; }
    if (!ready || !flat.length) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setOpen(true);
      const step = e.key === 'ArrowDown' ? 1 : -1;
      setActive((i) => (i + step + flat.length) % flat.length);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (showMenu && active >= 0 && flat[active]) return go(flat[active]);
    if (term.trim()) navigate(`/event/${currentEvent.id}/participantes?q=${encodeURIComponent(term)}`);
  };

  let index = -1;
  return (
    <form onSubmit={onSubmit} className="hidden sm:block w-44 lg:w-56" role="search" ref={box}>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={term}
          onChange={(e) => { setTerm(e.target.value); setOpen(true); setActive(-1); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Buscar no evento"
          aria-label="Buscar no evento"
          role="combobox"
          aria-expanded={showMenu}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
          className="h-8 pl-8 text-[13px] bg-card"
        />
        {showMenu && (
          <div id={listId} role="listbox" aria-label="Sugestões da busca" className="absolute right-0 top-full mt-1.5 w-[min(22rem,90vw)] max-h-[26rem] overflow-auto rounded-xl border border-border bg-card shadow-lg p-1.5 z-50">
            {flat.length === 0 ? (
              <p role="status" className="px-3 py-4 text-[13px] text-muted-foreground">Nada encontrado para “{term.trim()}”. Tente outro termo.</p>
            ) : groups.map((g) => (
              <div key={g.key} role="group" aria-label={g.label}>
                <p className="px-2.5 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{g.label}</p>
                {g.items.map((item) => {
                  index += 1;
                  const i = index;
                  return (
                    <div
                      key={item.id}
                      id={`${listId}-${i}`}
                      role="option"
                      aria-selected={i === active}
                      onMouseEnter={() => setActive(i)}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => go(item)}
                      className={`cursor-pointer rounded-lg px-2.5 py-1.5 ${i === active ? 'bg-secondary' : ''}`}
                    >
                      <div className="truncate text-[13px] font-medium">{item.title}</div>
                      {item.subtitle && <div className="truncate text-xs text-muted-foreground">{item.subtitle}</div>}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </form>
  );
}
