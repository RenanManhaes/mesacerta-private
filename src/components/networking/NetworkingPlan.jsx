import React, { useEffect, useRef, useState } from 'react';
import { occupants, personRoute } from './model';
import { initials } from '@/components/common/ReferenceUI';

// Seats stay mounted across rounds; their positions animate between actual engine assignments.
export default function NetworkingPlan({
  result,
  round,
  selected,
  onPerson,
  onTable,
}) {
  const ref = useRef(null);
  const [width, setWidth] = useState(700);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  const maxSeats = Math.max(...result.input.tables.map((t) => t.capacity));
  const pitch = maxSeats > 12 ? 290 : 185;
  const cols = Math.max(1, Math.floor(width / pitch));
  const rows = Math.ceil(result.input.tables.length / cols);
  const cellWidth = width / cols,
    cellHeight = maxSeats > 12 ? 270 : 180;
  const selectedStep = selected
    ? personRoute(result, selected)[round - 1]
    : null;
  const positions = [],
    centers = [];
  result.input.tables.forEach((table, t) => {
    const row = Math.floor(t / cols),
      count = Math.min(cols, result.input.tables.length - row * cols);
    const cx = ((t % cols) + 0.5 + (cols - count) / 2) * cellWidth,
      cy = (row + 0.5) * cellHeight;
    centers.push({ table, t, cx, cy });
    const seated = occupants(result, round - 1, t);
    const seats = Math.max(6, table.capacity);
    for (let i = 0; i < seats; i++) {
      const angle = (i / seats) * Math.PI * 2 - Math.PI / 2;
      const rx = maxSeats > 12 ? 116 : 72,
        ry = maxSeats > 12 ? 106 : 52;
      const seat = seated[i];
      positions.push({
        key: seat ? seat.person.id : `empty-${table.id}-${i}`,
        seat,
        t,
        x: cx + Math.cos(angle) * rx - 16,
        y: cy + Math.sin(angle) * ry - 12,
      });
    }
  });
  return (
    <div
      ref={ref}
      className="reference-net-canvas"
      data-testid="table-grid"
      style={{ height: rows * cellHeight }}
      aria-label={`Planta da rodada ${round}`}
    >
      {centers.map(({ table, t, cx, cy }) => (
        <button
          key={table.id}
          className={`reference-net-table ${selectedStep?.mesa === t + 1 ? 'selected' : ''}`}
          style={{ left: cx - 49, top: cy - 27 }}
          onClick={() => onTable(t)}
        >
          <small>{table.name}</small>
          <b>{table.company || 'Sem empresa'}</b>
          <span className="sr-only">Capacidade {table.capacity}</span>
        </button>
      ))}
      {positions.map(({ key, seat, t, x, y }) =>
        seat ? (
          <button
            key={key}
            className={`reference-net-seat ${selected?.id === seat.person.id ? 'selected' : selectedStep?.mesa === t + 1 ? 'mate' : ''} ${seat.conflict ? 'conflict' : ''}`}
            style={{ transform: `translate(${x}px,${y}px)` }}
            onClick={() => onPerson(seat.person)}
            aria-label={`${seat.person.name}, ${result.input.tables[t].name}${seat.fixed ? ', anfitrião fixo' : ''}${seat.conflict ? ', reencontro' : ''}`}
            title={`${seat.person.name} · ${seat.person.company || ''}${seat.fixed ? ' · Fixo' : ''}${seat.conflict ? ' · Reencontro' : ''}`}
          >
            {initials(seat.person.name)}
          </button>
        ) : (
          <span
            key={key}
            className="reference-net-seat empty"
            style={{ transform: `translate(${x}px,${y}px)` }}
            aria-hidden="true"
          />
        ),
      )}
    </div>
  );
}
