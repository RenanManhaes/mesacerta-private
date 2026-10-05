import test from 'node:test';
import assert from 'node:assert/strict';
import { assignTask, saveStaffMember } from './staff.js';
const event = () => ({
  id: 'one',
  staffMembers: [
    { id: 'p', name: 'Ana', role: 'Diretor', active: true },
    { id: 'q', name: 'Pedro', role: 'Staff', active: false },
  ],
  tasks: [
    { id: 't', name: 'Preparar sala', owner: 'Legado' },
    { id: 'other', owner: 'Outro' },
  ],
});
test('Assignment uses a registered active person and does not modify other tasks/events', () => {
  const ev = event(),
    other = event();
  const next = assignTask(ev, 't', 'p');
  assert.equal(next.tasks[0].ownerId, 'p');
  assert.equal(next.tasks[0].owner, 'Ana');
  assert.deepEqual(next.tasks[1], ev.tasks[1]);
  assert.equal(ev.tasks[0].owner, 'Legado');
  assert.deepEqual(other, event());
  assert.equal(assignTask(next, 't', 'q').tasks[0].owner, '');
  assert.equal(assignTask(next, 't', '').tasks[0].ownerId, '');
});
test('Renaming follows person identity; inactivation retains assigned tasks and legacy names', () => {
  const ev = assignTask(event(), 't', 'p');
  const next = saveStaffMember(ev, {
    id: 'p',
    name: 'Ana Silva',
    role: 'Diretor',
    active: false,
  });
  assert.equal(next.tasks[0].ownerId, 'p');
  assert.equal(next.tasks[0].owner, 'Ana Silva');
  assert.equal(next.tasks[1].owner, 'Outro');
  assert.equal(next.staffMembers.length, 2);
  assert.equal(ev.staffMembers[0].name, 'Ana');
  const added = saveStaffMember(
    { tasks: [] },
    { id: 'new', name: 'Equipe', role: 'Staff', active: true },
  );
  assert.equal(added.staffMembers.length, 1);
});
