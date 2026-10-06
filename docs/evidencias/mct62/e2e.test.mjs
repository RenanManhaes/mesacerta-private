import { setup, eventsFrom, check, done, BASE } from './e2e-lib.mjs';
const { browser, page, db, errors } = await setup();
const evs = eventsFrom(db.demo);
const id = evs[0].id;
const mk = (i, start, title, color) => ({ id: i, start, duration: 60, title, type: 'Palestra', speaker: '', room: '', ...(color ? { color } : {}) });
evs[0].schedule = [mk('s15', '15:00', 'Atividade 15h'), mk('s13', '13:00', 'Atividade 13h')];
db.events = evs;
const url = `${BASE}/event/${id}/programacao`;
await page.goto(url);
await page.getByRole('heading', { name: 'Programação', exact: true }).waitFor();
const rows = () => page.locator('[data-activity-row]').evaluateAll(els => els.map(e => e.querySelector('.truncate').textContent));
const dbTitles = () => db.events[0].schedule.map(s => s.title);

// 1. modal abre e nada e criado antes de confirmar
await page.getByRole('button', { name: 'Nova atividade' }).click();
const dlg = page.getByRole('dialog');
await dlg.waitFor();
for (const l of ['Título', 'Horário de início', 'Duração (min)', 'Responsável', 'Observação']) await dlg.getByLabel(l).waitFor();
await dlg.getByRole('combobox', { name: 'Tipo' }).waitFor();
check('Modal abre com titulo, inicio, duracao, responsavel, tipo e observacao', true);
await dlg.getByLabel('Título').fill('Rascunho que sera cancelado');
await page.waitForTimeout(700);
check('Nada criado antes de confirmar (lista e banco)', (await rows()).length === 2 && db.events[0].schedule.length === 2, `linhas=${(await rows()).length} banco=${db.events[0].schedule.length}`);
await dlg.getByRole('button', { name: 'Cancelar' }).click();
await page.waitForTimeout(500);
check('Cancelar nao cria nada', (await rows()).length === 2 && db.events[0].schedule.length === 2);

// 2. 14h entra entre 13h e 15h, com cor
await page.getByRole('button', { name: 'Nova atividade' }).click();
await dlg.getByLabel('Título').fill('Atividade 14h');
await dlg.getByLabel('Horário de início').fill('14:00');
await dlg.getByLabel('Duração (min)').fill('60');
await dlg.getByLabel('Responsável').fill('Marina');
await dlg.getByLabel('Observação').fill('Levar microfone');
await dlg.getByRole('radio', { name: 'Turquesa' }).click();
check('Sem conflito: aviso nao aparece', await page.getByTestId('conflict-warning').count() === 0);
await dlg.getByRole('button', { name: 'Adicionar atividade' }).click();
await page.waitForTimeout(900);
const order = await rows();
check('Atividade das 14h aparece entre 13h e 15h (lista)', JSON.stringify(order) === JSON.stringify(['Atividade 13h', 'Atividade 14h', 'Atividade 15h']), order.join(' | '));
check('Atividade das 14h entre 13h e 15h (banco)', JSON.stringify(dbTitles()) === JSON.stringify(['Atividade 13h', 'Atividade 14h', 'Atividade 15h']), dbTitles().join(' | '));
const saved = db.events[0].schedule[1];
check('Campos salvos: responsavel, observacao, cor, duracao', saved.speaker === 'Marina' && saved.notes === 'Levar microfone' && saved.color === 'turquesa' && saved.duration === 60, JSON.stringify(saved));
const newId = saved.id;
const rowColor = await page.locator(`[data-activity-row="${newId}"]`).evaluate(e => getComputedStyle(e).borderLeftColor);
const blockColor = await page.locator(`[data-activity-id="${newId}"]`).evaluate(e => getComputedStyle(e).borderLeftColor);
check('Cor escolhida aparece na lista', rowColor === 'rgb(20, 184, 166)', rowColor);
check('Cor escolhida aparece no cronograma', blockColor === 'rgb(20, 184, 166)', blockColor);

// 3. arrastar no cronograma muda o horario e salva
const block = page.locator('[data-activity-id="s15"]');
const bb = await block.boundingBox();
await page.mouse.move(bb.x + bb.width / 2, bb.y + 8); await page.mouse.down();
await page.mouse.move(bb.x + bb.width / 2, bb.y + 20, { steps: 4 });
await page.mouse.move(bb.x + bb.width / 2, bb.y + 8 + 60, { steps: 10 });
const during = await block.innerText();
await page.mouse.up(); await page.waitForTimeout(1200);
const s15 = db.events[0].schedule.find(s => s.id === 's15');
check('Arrastar: horario mudou (60 px = 50 min => 15:50)', s15.start === '15:50', `inicio=${s15.start}; durante o arraste: ${during.replace(/\n/g, ' ')}`);
check('Arrastar: salvo no banco', db.writes >= 2, `gravacoes=${db.writes}`);
await page.reload(); await page.getByRole('heading', { name: 'Programação', exact: true }).waitFor();
check('Apos recarregar o horario continua 15:50', await page.locator('[data-activity-id="s15"]').innerText().then(t => t.includes('15:50–16:50')));

// 4. teclado
await page.locator('[data-activity-id="s15"]').focus();
await page.keyboard.press('ArrowUp'); await page.keyboard.press('ArrowUp'); await page.waitForTimeout(1000);
check('Teclado: setas mudam o horario (15:50 -> 15:40)', db.events[0].schedule.find(s => s.id === 's15').start === '15:40');

// 5. conflito sinalizado sem bloquear
await page.getByRole('button', { name: 'Nova atividade' }).click();
await dlg.getByLabel('Título').fill('Atividade em conflito');
await dlg.getByLabel('Horário de início').fill('13:30');
await dlg.getByLabel('Duração (min)').fill('30');
check('Conflito: aviso aparece no modal', await page.getByTestId('conflict-warning').count() === 1);
await dlg.getByRole('button', { name: 'Adicionar atividade' }).click();
await page.waitForTimeout(900);
check('Conflito nao bloqueia o salvamento', dbTitles().includes('Atividade em conflito'));
check('Conflito sinalizado na lista e no cronograma', await page.locator('[data-activity-row][data-conflict="true"]').count() === 2 && await page.locator('[data-activity-id][data-conflict="true"]').count() === 2);

// 6. validacao
await page.getByRole('button', { name: 'Nova atividade' }).click();
await dlg.getByRole('button', { name: 'Adicionar atividade' }).click();
check('Titulo vazio nao cria atividade', await dlg.getByText('Informe o título.').count() === 1 && db.events[0].schedule.length === 4);
await dlg.getByRole('button', { name: 'Cancelar' }).click();
await page.screenshot({ path: 'programacao.png', fullPage: true });
check('Sem erros de console/pagina', errors.length === 0, errors.join(' | '));
await browser.close(); done();
