export function assignTask(event, taskId, ownerId) {
  const person = (event.staffMembers || []).find(
    (p) => p.id === ownerId && p.active !== false,
  );
  return {
    ...event,
    tasks: event.tasks.map((t) =>
      t.id === taskId
        ? { ...t, ownerId: person?.id || '', ownerIds: person ? [person.id] : [], owner: person?.name || '' }
        : t,
    ),
  };
}

export function saveStaffMember(event, person) {
  const members = event.staffMembers || [];
  return {
    ...event,
    staffMembers: members.some((p) => p.id === person.id)
      ? members.map((p) => (p.id === person.id ? person : p))
      : [...members, person],
    tasks: event.tasks.map((t) =>
      t.ownerId === person.id ? { ...t, owner: person.name } : t,
    ),
  };
}
