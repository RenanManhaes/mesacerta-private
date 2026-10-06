export const STAFF_ROUTES = ['tarefas', 'participantes', 'programacao'];
export function canOpenModule(role, route) {
  return role === 'founder' || role === 'director' || (role === 'staff' && STAFF_ROUTES.includes(route));
}
export function eventHome(id, access) {
  return `/event/${id}/${access?.role === 'staff' ? 'tarefas' : 'dashboard'}`;
}
export function visibleSections(sections, event, role) {
  return sections.map(section => ({...section, items: section.items.filter(item => canOpenModule(role,item.to) &&
    (role === 'staff' || !item.module || (item.module === 'capacity' ? event?.modules?.capacity !== false : event?.modules?.[item.module])))})).filter(section => section.items.length);
}
