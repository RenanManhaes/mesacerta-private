import React from 'react';
import { roles } from './model.js';

export default function TablePlan({ table, occupants, round, onPerson, onTable }) {
  const capacity = table.capacity;
  const overflow = Math.max(0, occupants.length - capacity);
  const sideRows = Math.ceil(Math.max(0, capacity - 2) / 2);
  const height = Math.max(300, sideRows * 58 + 100);
  const position = index => {
    if (index === 0) return { left: '50%', top: 24 };
    if (index === capacity - 1) return { left: '50%', top: height - 24 };
    const side = (index - 1) % 2;
    const row = Math.floor((index - 1) / 2);
    return { left: side ? '85%' : '15%', top: 78 + row * (height - 156) / Math.max(1, sideRows - 1) };
  };
  return (
    <section data-testid="table-plan" data-table-id={table.id} data-round={round}
      aria-label={`${table.name}, rodada ${round}, ${occupants.length} pessoas, capacidade ${capacity}`}
      className={`min-w-0 border p-2 ${overflow ? 'border-destructive' : 'border-border'}`}>
      <div className="flex flex-wrap justify-between gap-1 text-xs px-1 py-2">
        <strong>{table.name}</strong><span>{occupants.length}/{capacity} lugares</span>
      </div>
      {overflow > 0 && <button type="button" onClick={onTable} className="w-full border border-destructive p-2 text-xs font-semibold text-destructive">Capacidade excedida em {overflow} — ver ocupantes</button>}
      <div className="relative w-full" style={{ height }}>
        <button type="button" onClick={onTable} aria-label={`Abrir ${table.name}`}
          className="absolute border-2 border-border bg-muted/20 px-2 text-center text-xs break-words"
          style={{ left: '34%', width: '32%', top: 68, bottom: 68 }}>
          <strong className="block">{table.name}</strong>
          <span className="block mt-2 text-muted-foreground">{table.company || 'Sem empresa vinculada'}</span>
          <span className="block mt-2 text-[10px]">{occupants.length}/{capacity} lugares</span>
          <span className="block mt-2 text-[10px]">Rodada {round}</span>
        </button>
        {Array.from({ length: capacity }, (_, index) => {
          const occupant = occupants[index];
          const state = occupant ? [roles[occupant.person.role], occupant.home && 'Mesa da própria empresa', occupant.returning && 'Retorno à mesa', occupant.conflict && 'Reencontro na mesma mesa'].filter(Boolean).join(' · ') : 'Lugar vazio';
          return (
            <button type="button" key={index} data-testid="chair" data-occupied={Boolean(occupant)}
              data-person-id={occupant?.person.id} data-fixed={Boolean(occupant?.fixed)}
              disabled={!occupant} onClick={() => occupant && onPerson(occupant.person)}
              title={occupant ? `${occupant.person.name} | ${occupant.person.company || 'Empresa não informada'} | ${state}` : state}
              aria-label={occupant ? `${occupant.person.name}, ${state}` : `Lugar ${index + 1} vazio`}
              className={`absolute h-11 border text-[11px] leading-tight px-1 transition-colors duration-150 motion-reduce:transition-none ${occupant ? 'bg-background hover:border-foreground focus-visible:outline focus-visible:outline-2' : 'border-dashed text-muted-foreground bg-muted/20'} ${occupant?.fixed ? 'border-double border-[3px]' : ''} ${occupant?.conflict ? 'border-destructive' : 'border-border'}`}
              style={{ ...position(index), width: '28%', maxWidth: 100, transform: 'translate(-50%, -50%)' }}>
              {occupant ? <><span className="block truncate">{occupant.fixed ? '⚑ ' : occupant.person.role === 'host' ? '◇ ' : ''}{occupant.person.name}</span><span className="block text-[9px] truncate">{occupant.fixed ? 'Fixo' : occupant.person.role === 'host' ? 'Anfitrião rotativo' : 'Participante'}{occupant.home ? ' · Casa' : ''}{occupant.returning ? ' · ↩' : ''}{occupant.conflict ? ' · !' : ''}</span></> : <span>Vazio</span>}
            </button>
          );
        })}
      </div>
    </section>
  );
}
