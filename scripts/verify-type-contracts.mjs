import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import ts from 'typescript';

// Compare with the reviewed base, rather than changing assertions to fit the fixes.
const base = process.argv[2] || '40b322438d033545fc52918651f29e11f259cd68';
const sourceAtBase = (path) => execFileSync('git', ['show', `${base}:${path}`], { encoding: 'utf8' });
const emit = (source) => ts.transpileModule(source, { compilerOptions: {
  jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ESNext,
  module: ts.ModuleKind.ESNext, removeComments: true,
} }).outputText;

const contracts = [
  'src/components/ui/button.jsx', 'src/components/ui/input.jsx',
  'src/components/ui/label.jsx', 'src/components/ui/slider.jsx',
  'src/components/ui/switch.jsx', 'src/components/ui/tabs.jsx',
  'src/components/ui/select.jsx', 'src/components/ui/dialog.jsx',
  'src/components/common/Primitives.jsx', 'src/components/AuthLayout.jsx',
  'src/pages/event/Financial.jsx',
];
for (const path of contracts) {
  assert.equal(emit(readFileSync(path, 'utf8')), emit(sourceAtBase(path)), path);
}
console.log(`PASS: ${contracts.length} component contracts emit identical JavaScript`);

const originalModule = (path) => import(`data:text/javascript;base64,${Buffer.from(sourceAtBase(path)).toString('base64')}`);
const originalFormat = await originalModule('src/lib/format.js');
const currentFormat = await import('../src/lib/format.js');
for (const date of ['', 'invalid', '2026-01-01', '2024-02-29', '2026-12-31']) {
  for (const name of ['formatDate', 'formatDateFull', 'formatDateShort']) {
    assert.equal(currentFormat[name](date), originalFormat[name](date), `${name}: ${date}`);
  }
  assert.equal(currentFormat.daysUntil(date, new Date('2026-10-01T12:00:00')), originalFormat.daysUntil(date, new Date('2026-10-01T12:00:00')));
}
console.log('PASS: date formatting and day differences preserve base behavior');

const originalEngine = await originalModule('src/lib/networking/engine.js');
const currentEngine = await import('../src/lib/networking/engine.js');
for (const [people, tables, rounds, seed] of [[76, 14, 14, 1], [76, 14, 14, 7], [20, 5, 10, 1], [13, 4, 7, 5], [1, 1, 1, 1]]) {
  const original = originalEngine.build(people, tables, rounds, seed);
  const current = currentEngine.build(people, tables, rounds, seed);
  assert.deepEqual(current, original, 'generated grid');
  assert.deepEqual(currentEngine.analyze(current, people, tables, rounds), originalEngine.analyze(original, people, tables, rounds), 'analysis');
}
console.log('PASS: identical networking grids and analyses in five deterministic scenarios');
