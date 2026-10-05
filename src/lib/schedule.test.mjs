import assert from 'node:assert/strict';
import { COOL_PALETTE, insertActivity, moveActivity, findConflicts, conflictsFor, validateActivity, layoutLanes } from './schedule.js';
import { scheduleSummary } from './selectors.js';

let passed = 0;
function check(name, run) { run(); passed++; console.log(`PASS ${name}`); }
const act = (id, start, duration = 60) => ({ id, start, duration, title: id, type: 'Palestra' });

check('atividade das 14h entra entre as de 13h e 15h', () => {
  const list = insertActivity([act('a13', '13:00'), act('a15', '15:00')], act('a14', '14:00'));
  assert.deepEqual(list.map((a) => a.id), ['a13', 'a14', 'a15']);
});
check('mesmo horario entra depois da que ja existia', () => {
  const list = insertActivity([act('x', '10:00'), act('z', '11:00')], act('y', '10:00'));
  assert.deepEqual(list.map((a) => a.id), ['x', 'y', 'z']);
});
check('arrastar muda o horario e reordena (encaixe de 5 em 5 min)', () => {
  const list = moveActivity([act('a', '09:00'), act('b', '10:00'), act('c', '11:00')], 'a', 10 * 60 + 52);
  assert.equal(list.find((x) => x.id === 'a').start, '10:50');
  assert.deepEqual(list.map((a) => a.id), ['b', 'a', 'c']);
});
check('arrastar respeita os limites do dia', () => {
  assert.equal(moveActivity([act('a', '09:00', 60)], 'a', -50)[0].start, '00:00');
  assert.equal(moveActivity([act('a', '09:00', 60)], 'a', 99999)[0].start, '23:00');
});
check('conflito: sobreposicao sinaliza, encostar nao', () => {
  const list = [act('a', '09:00', 60), act('b', '09:30', 60), act('c', '10:30', 30)];
  const map = findConflicts(list);
  assert.deepEqual([...map.keys()].sort(), ['a', 'b']);
  assert.equal(conflictsFor([act('a', '09:00', 60)], act('n', '10:00', 30)).length, 0);
});
check('validacao exige titulo, horario e duracao', () => {
  const { errors } = validateActivity({ title: '  ', start: '', duration: 0 });
  assert.deepEqual(Object.keys(errors).sort(), ['duration', 'start', 'title']);
  const ok = validateActivity({ title: ' Painel ', start: '14:00', duration: '45', color: 'violeta' });
  assert.deepEqual(ok.errors, {});
  assert.equal(ok.value.title, 'Painel');
  assert.equal(ok.value.duration, 45);
  assert.equal(ok.value.color, 'violeta');
});
check('cor invalida cai no padrao; paleta so tem tons frios (sem vermelho/laranja/amarelo)', () => {
  assert.equal(validateActivity({ title: 'x', start: '09:00', duration: 30, color: 'vermelho' }).value.color, 'azul');
  for (const c of COOL_PALETTE) {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(c.hex.slice(i, i + 2), 16));
    assert.ok(b >= r, `${c.key} deve ter mais azul que vermelho`);
  }
});
check('raias: sobrepostas ficam lado a lado', () => {
  const lanes = layoutLanes([act('a', '09:00', 60), act('b', '09:30', 60), act('c', '11:00', 30)]);
  assert.equal(lanes.find((l) => l.item.id === 'a').lanes, 2);
  assert.equal(lanes.find((l) => l.item.id === 'c').lanes, 1);
});
check('scheduleSummary usa o horario proprio de cada atividade e marca conflitos', () => {
  const s = scheduleSummary({ desiredEndTime: '18:00', schedule: [act('b', '14:00', 60), act('a', '09:00', 30), act('c', '14:30', 60)] });
  assert.deepEqual(s.computed.map((c) => c.computedStart), ['09:00', '14:00', '14:30']);
  assert.equal(s.end, '15:30');
  assert.equal(s.conflicts, 2);
  assert.deepEqual(s.computed[1].conflictsWith, ['c']);
});
check('scheduleSummary de lista vazia nao quebra', () => {
  assert.deepEqual(scheduleSummary({ schedule: [] }).computed, []);
});
console.log(`\n${passed} verificacoes passaram`);
