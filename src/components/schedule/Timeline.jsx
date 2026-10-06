import React, { useRef, useState } from 'react';
import { colorOf, layoutLanes, SNAP_MINUTES } from '@/lib/schedule';
import { minutesToTime, timeToMinutes } from '@/lib/format';
import { cn } from '@/lib/utils';

const PX_PER_MIN = 1.2;
const GUTTER = 52;
const DRAG_THRESHOLD = 4;

// Cronograma vertical: cada atividade é um bloco posicionado pelo horário. Arrastar na vertical
// muda o início (encaixa de 5 em 5 min); setas mudam o início pelo teclado.
export default function Timeline({ items, conflicts, onMove }) {
  const [drag, setDrag] = useState(null); // { id, start, moved }
  const origin = useRef(null);
  if (!items.length) return null;

  const startMin = Math.max(0, Math.floor(Math.min(...items.map((i) => timeToMinutes(i.start)), 8 * 60) / 60) * 60);
  const endMin = Math.min(24 * 60, Math.ceil(Math.max(...items.map((i) => timeToMinutes(i.start) + (i.duration || 0)), 18 * 60) / 60) * 60);
  const height = (endMin - startMin) * PX_PER_MIN;
  const hours = [];
  for (let m = startMin; m <= endMin; m += 60) hours.push(m);
  const layout = layoutLanes(items);

  const onPointerDown = (e, item) => {
    if (e.button !== undefined && e.button !== 0) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    origin.current = { id: item.id, y: e.clientY, start: timeToMinutes(item.start), duration: item.duration || 0 };
  };
  const onPointerMove = (e) => {
    const o = origin.current;
    if (!o) return;
    const dy = e.clientY - o.y;
    if (!drag?.moved && Math.abs(dy) < DRAG_THRESHOLD) return;
    const raw = o.start + dy / PX_PER_MIN;
    const snapped = Math.round(raw / SNAP_MINUTES) * SNAP_MINUTES;
    const start = Math.min(24 * 60 - o.duration, Math.max(0, snapped));
    setDrag({ id: o.id, start, moved: true });
  };
  const finish = () => {
    const o = origin.current;
    origin.current = null;
    if (drag?.moved && o && drag.start !== o.start) onMove(o.id, drag.start);
    setDrag(null);
  };
  const onKeyDown = (e, item) => {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault();
    const step = e.shiftKey ? 15 : SNAP_MINUTES;
    onMove(item.id, timeToMinutes(item.start) + (e.key === 'ArrowUp' ? -step : step));
  };

  return (
    <div className="platform-timeline" role="group" aria-label="Cronograma da programação" style={{ height }} data-testid="timeline">
      {hours.map((m) => (
        <div key={m} className="platform-timeline-hour" style={{ top: (m - startMin) * PX_PER_MIN }}>
          <span className="tnum">{minutesToTime(m === 1440 ? 0 : m)}</span>
        </div>
      ))}
      {layout.map(({ item, lane, lanes }) => {
        const c = colorOf(item);
        const dragging = drag?.id === item.id;
        const start = dragging ? drag.start : timeToMinutes(item.start);
        const dur = item.duration || 0;
        const conflict = conflicts.has(item.id);
        return (
          <div
            key={item.id}
            role="button"
            tabIndex={0}
            data-activity-id={item.id}
            data-color={item.color || 'azul'}
            data-conflict={conflict ? 'true' : 'false'}
            aria-label={`${item.title}, ${minutesToTime(start)} às ${minutesToTime(start + dur)}${conflict ? ', com conflito de horário' : ''}. Setas para cima e para baixo mudam o horário.`}
            className={cn('platform-timeline-block', dragging && 'is-dragging', conflict && 'has-conflict')}
            style={{
              top: (start - startMin) * PX_PER_MIN,
              height: Math.max(22, dur * PX_PER_MIN - 2),
              left: `calc(${GUTTER}px + (100% - ${GUTTER}px) * ${lane / lanes})`,
              width: `calc((100% - ${GUTTER}px) / ${lanes} - 4px)`,
              background: c.soft,
              borderLeftColor: c.hex,
            }}
            onPointerDown={(e) => onPointerDown(e, item)}
            onPointerMove={onPointerMove}
            onPointerUp={finish}
            onPointerCancel={finish}
            onKeyDown={(e) => onKeyDown(e, item)}
          >
            <div className="text-[12px] font-medium truncate">{item.title}</div>
            <div className="text-[11px] text-muted-foreground tnum truncate">{minutesToTime(start)}–{minutesToTime(start + dur)}{conflict ? ' · conflito' : ''}</div>
          </div>
        );
      })}
    </div>
  );
}
