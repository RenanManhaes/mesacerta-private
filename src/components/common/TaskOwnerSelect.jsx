import React from 'react';

export default function TaskOwnerSelect({
  members = [],
  ownerId = '',
  owner = '',
  onChange,
  label = 'Responsável',
}) {
  const selected = members.find((p) => p.id === ownerId);
  const legacy = !selected && !!owner;
  return (
    <select
      aria-label={label}
      className="w-full h-9 rounded-md border border-border bg-card px-2 text-[13px]"
      value={selected ? selected.id : legacy ? '__legacy' : ''}
      onChange={(e) => {
        if (e.target.value !== '__legacy') onChange(e.target.value);
      }}
    >
      <option value="">Sem responsável</option>
      {legacy && <option value="__legacy">{owner} (cadastro anterior)</option>}
      {members
        .filter((p) => p.active !== false || p.id === ownerId)
        .map((p) => (
          <option key={p.id} value={p.id} disabled={p.active === false}>
            {p.name} · {p.role}
            {p.active === false ? ' (inativo)' : ''}
          </option>
        ))}
    </select>
  );
}
