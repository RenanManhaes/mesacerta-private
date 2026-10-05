import { setup, eventsFrom, check, done, BASE } from './e2e-lib.mjs';
const { browser, page, db, errors } = await setup();
const evs = eventsFrom(db.demo);
const id = evs[0].id;
evs[0].tasks = [
  { id: 'tA', name: 'Alta no prazo', owner: '', date: '2027-12-31', category: 'Op', priority: 'Alta', status: 'A fazer' },
  { id: 'tB', name: 'Alta atrasada', owner: '', date: '2026-09-01', category: 'Op', priority: 'Alta', status: 'A fazer' },
  { id: 'tC', name: 'Normal', owner: '', date: '2027-12-31', category: 'Op', priority: 'Normal', status: 'A fazer' },
  { id: 'tD', name: 'Para teclado', owner: '', date: '2027-12-31', category: 'Op', priority: 'Normal', status: 'A fazer' },
  { id: 'tE', name: 'Para falha', owner: '', date: '2027-12-31', category: 'Op', priority: 'Normal', status: 'A fazer' },
];
db.events = evs;
await page.goto(`${BASE}/event/${id}/tarefas`);
await page.getByRole('heading', { name: 'Tarefas', exact: true }).waitFor();
const card = tid => page.locator(`[data-task-id="${tid}"]`);
const border = async tid => card(tid).evaluate(e => getComputedStyle(e).borderTopColor);
check('Alta: borda laranja', await border('tA') === 'rgb(249, 115, 22)', await border('tA'));
check('Alta + atrasada: borda vermelha prevalece', await border('tB') === 'rgb(220, 38, 38)', await border('tB'));
check('Normal: borda padrao (nem laranja nem vermelha)', !['rgb(249, 115, 22)','rgb(220, 38, 38)'].includes(await border('tC')), await border('tC'));
const col = async tid => card(tid).evaluate(e => e.closest('[data-column]').dataset.column);

const drag = async (tid, target) => {
  const a = await card(tid).boundingBox(); const t = await page.locator(`[data-column="${target}"]`).boundingBox();
  await page.mouse.move(a.x + a.width / 2, a.y + 10); await page.mouse.down();
  await page.mouse.move(a.x + a.width / 2 + 20, a.y + 30, { steps: 5 });
  await page.mouse.move(t.x + t.width / 2, t.y + Math.min(t.height - 15, 120), { steps: 15 });
  await page.waitForTimeout(300); await page.mouse.up(); await page.waitForTimeout(1200);
};
await drag('tA', 'Em andamento');
check('Arrastar: card mudou de coluna', await col('tA') === 'Em andamento', await col('tA'));
check('Arrastar: gravado no banco', db.events[0].tasks.find(t => t.id === 'tA').status === 'Em andamento', `writes=${db.writes}`);
await page.reload(); await page.getByRole('heading', { name: 'Tarefas', exact: true }).waitFor();
check('Apos recarregar: continua em Em andamento', await col('tA') === 'Em andamento');

await card('tD').focus();
await page.keyboard.press('Space'); await page.waitForTimeout(300);
await page.keyboard.press('ArrowRight'); await page.waitForTimeout(500);
await page.keyboard.press('ArrowRight'); await page.waitForTimeout(500);
await page.keyboard.press('Space'); await page.waitForTimeout(1500);
check('Teclado: status mudou para Concluido', await col('tD') === 'Concluído', await col('tD'));
check('Teclado: gravado no banco', db.events[0].tasks.find(t => t.id === 'tD').status === 'Concluído');

db.failNext = 5;
await drag('tE', 'Concluído'); console.log('failNext restante', db.failNext);
check('Falha: card voltou para A fazer', await col('tE') === 'A fazer', await col('tE'));
check('Falha: banco manteve o status antigo', db.events[0].tasks.find(t => t.id === 'tE').status === 'A fazer');
check('Falha: aviso de reversao exibido', await page.getByText('O card voltou para "A fazer"').count() === 1);
await page.screenshot({ path: 'tarefas.png' });
check('Sem erros de console/pagina', errors.length === 0, errors.join(' | '));
await browser.close(); done();
