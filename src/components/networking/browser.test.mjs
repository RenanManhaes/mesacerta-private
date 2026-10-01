import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import process from 'node:process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fixture } from './model.test.mjs';
import { networkingInput, generateNetworking, occupants } from './model.js';

const require = createRequire(`${process.env.MCT_PLAYWRIGHT_ROOT}/test.cjs`);
const { chromium } = require('playwright');
const output = process.env.MCT_EVIDENCE_DIR;
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
const page = await context.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
await context.route(url => url.pathname.startsWith('/api/'), route => {
  const url = route.request().url();
  const body = url.includes('public-settings') ? { id: 'mct-local-verification', public_settings: {} } : url.endsWith('/User/me') ? { id: 'local-review-user', full_name: 'Revisor local', email: 'review@example.test', role: 'admin' } : {};
  return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
});
const checks = [];
function pass(name) { checks.push(name); console.log(`PASS ${name}`); }
async function load(event) {
  await page.goto('http://127.0.0.1:5173/login');
  await page.waitForLoadState('networkidle');
  await page.evaluate(async event => {
    const { demoEvent } = await import('/src/lib/demoData.js');
    localStorage.setItem('base44_access_token', 'local-fixture-only');
    localStorage.setItem('mesacerta_v1', JSON.stringify({ events: [{ ...demoEvent, ...event }], currentEventId: event.id }));
  }, event);
  await page.goto(`http://127.0.0.1:5173/event/${event.id}/networking`);
  await page.getByRole('heading', { name: 'Networking', exact: true }).waitFor();
}
try {
  const event = fixture();
  await load(event);
  assert.equal(await page.locator('vite-error-overlay').count(), 0);
  pass('Servidor: tela completa, sem overlay Vite');
  assert.ok((await page.getByRole('region', { name: 'Validação antes da geração' }).innerText()).includes('mesa sem anfitrião fixo'));
  assert.equal(await page.getByTestId('table-plan').count(), 0);
  pass('MCT-33.3 aviso sem fixo antes de gerar');
  await page.getByRole('button', { name: 'Gerar distribuição', exact: true }).click();
  await page.getByTestId('table-plan').first().waitFor();
  const expected = generateNetworking(networkingInput(event));
  for (let r = 0; r < 14; r++) {
    await page.getByLabel('Rodada exibida').selectOption(String(r + 1));
    for (let t = 0; t < 14; t++) {
      const ids = await page.getByTestId('table-plan').nth(t).locator('[data-occupied="true"]').evaluateAll(nodes => nodes.map(node => node.getAttribute('data-person-id')));
      assert.deepEqual(ids, occupants(expected, r, t).map(o => o.person.id));
    }
    assert.equal(await page.locator(`[data-testid="table-plan"][data-round="${r + 1}"]`).count(), 14);
  }
  pass('MCT-19.2 / MCT-32.3 todas as 196 mesas/rodadas pela UI identicas ao motor');
  await page.getByLabel('Rodada exibida').selectOption('1');
  await page.getByRole('heading', { name: 'Planta da rodada 1' }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${output}/networking-desktop.png` });
  const chair = page.locator('[data-occupied="true"]').first();
  const chairId = await chair.getAttribute('data-person-id');
  assert.ok((await chair.getAttribute('aria-label')).includes(event.participants.find(p => p.id === chairId).name));
  await chair.click();
  const dialog = page.getByRole('dialog');
  await dialog.waitFor();
  for (const text of ['Empresa', 'Papel', 'Mesa atual', 'Próxima mesa']) assert.ok((await dialog.innerText()).includes(text));
  await dialog.getByRole('button', { name: 'Fechar' }).click();
  pass('MCT-19.4 / MCT-32.6 cadeira exibe nome cadastrado e abre empresa/papel/mesa atual/proxima');
  await page.getByRole('button', { name: 'Abrir Mesa 1', exact: true }).click();
  assert.ok((await page.getByRole('dialog').innerText()).includes('Capacidade: 7'));
  await page.getByRole('dialog').getByRole('button', { name: 'Fechar' }).click();
  pass('PRD51.13 centro abre dados da mesa');
  await page.getByLabel('Buscar rota', { exact: true }).fill('GC-1');
  const route = page.getByTestId('person-route').filter({ hasText: 'GC-1 ·' }).first();
  await route.locator('summary').click();
  const steps = await route.getByTestId('route-step').allTextContents();
  assert.equal(steps.length, 14); assert.equal(new Set(steps.map(s => s.split('Mesa ')[1])).size, 14);
  steps.forEach((step, i) => assert.ok(step.startsWith(`Rodada ${i + 1}`)));
  pass('MCT-19.3 / MCT-33.1 rota na UI 14 rodadas em ordem / 14 mesas distintas');
  await page.getByLabel('Buscar rota', { exact: true }).fill('Bruno Barbosa');
  assert.equal(await page.getByTestId('person-route').count(), 1);
  pass('MCT-33 busca por nome e codigo');
  await page.getByLabel('Buscar rota', { exact: true }).fill('');
  await page.getByLabel('Somente com conflito').check();
  assert.ok(await page.getByTestId('person-route').count() > 0);
  pass('MCT-33 filtro somente com conflito funciona');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar PDF' }).click();
  const download = await downloadPromise; await download.saveAs(`${output}/ui-routes-76.pdf`);
  pass('MCT-33.5 PDF baixado pelo botao da tela');
  await page.setViewportSize({ width: 375, height: 812 });
  await page.getByRole('heading', { name: 'Planta da rodada 1' }).scrollIntoViewIfNeeded();
  const geometry = await page.getByTestId('table-plan').evaluateAll(nodes => nodes.map(n => ({ x: n.getBoundingClientRect().x, y: n.getBoundingClientRect().y, width: n.getBoundingClientRect().width })));
  assert.ok(geometry.every(box => Math.abs(box.x - geometry[0].x) < 1));
  assert.ok(geometry.slice(1).every((box, i) => box.y > geometry[i].y));
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  await page.screenshot({ path: `${output}/networking-mobile-375.png` });
  pass('MCT-32.5 viewport375 uma mesa espacial por linha / sem scroll horizontal');
  await page.setViewportSize({ width: 820, height: 1000 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  pass('PRD51.14 tablet sem scroll horizontal');
  const fixed = fixture(8, 2, 2, 6);
  fixed.networking.participantSettings = { 'guest-1': { role: 'fixed', tableId: 'table-1' }, 'guest-2': { role: 'fixed', tableId: 'table-2' } };
  await load(fixed);
  await page.getByRole('button', { name: 'Gerar distribuição', exact: true }).click();
  await page.getByTestId('table-plan').first().waitFor();
  const first = page.getByTestId('table-plan').first();
  assert.equal(await first.getByTestId('chair').count(), 6);
  assert.equal(await first.locator('[data-occupied="true"]').count(), 4);
  assert.equal(await first.locator('[data-occupied="false"]').count(), 2);
  assert.ok((await first.locator('[data-fixed="true"]').innerText()).includes('Fixo'));
  await first.screenshot({ path: `${output}/table-4-of-6.png` });
  pass('MCT-32.1/.2 seis cadeiras / quatro ocupadas / duas vazias / fixo com simbolo e texto');
  await page.locator('summary').filter({ hasText: 'Editar nomes' }).click();
  await page.getByLabel('Nome da mesa 1', { exact: true }).fill('Mesa Alfa');
  await page.getByLabel('Capacidade da mesa 2', { exact: true }).fill('8');
  assert.equal(await page.getByTestId('table-plan').count(), 0);
  await page.getByRole('button', { name: 'Gerar distribuição', exact: true }).click();
  await page.getByTestId('table-plan').first().waitFor();
  assert.equal(await page.getByTestId('table-plan').nth(1).getByTestId('chair').count(), 8);
  assert.ok((await page.getByTestId('table-plan').first().innerText()).includes('Mesa Alfa'));
  pass('PRD51.1/.2 capacidade individual/nome editados e previa antiga invalidada');
  const host = fixture(12, 3, 3, 6);
  host.networking.participantSettings = { 'guest-1': { role: 'host', tableId: 'table-1' } };
  await load(host);
  assert.ok((await page.getByRole('region', { name: 'Validação antes da geração' }).innerText()).includes('no máximo 2 rodadas'));
  pass('MCT-33.4 aviso R>=T inevitavel e T-1 visivel antes da geracao');
  await page.getByRole('button', { name: 'Gerar distribuição', exact: true }).click();
  await page.getByTestId('table-plan').first().waitFor();
  let homeSeen = false;
  for (let r = 1; r <= 3; r++) {
    await page.getByLabel('Rodada exibida').selectOption(String(r));
    const hostChair = page.locator('[data-testid="chair"][data-person-id="guest-1"]');
    assert.ok((await hostChair.innerText()).includes('Anfitrião rotativo'));
    homeSeen ||= (await hostChair.getAttribute('aria-label')).includes('Mesa da própria empresa');
  }
  assert.ok(homeSeen);
  pass('PRD51 estados de anfitriao rotativo e propria mesa visiveis');
  await load(fixture(12, 3, 5, 6));
  await page.getByRole('button', { name: 'Gerar distribuição', exact: true }).click();
  await page.getByTestId('table-plan').first().waitFor();
  await page.getByLabel('Rodada exibida').selectOption('5');
  assert.ok((await page.locator('[data-testid="chair"][aria-label*="Retorno à mesa"]').count()) > 0);
  pass('PRD51 retorno a mesa identificado no desenho');
  const same = await page.getByTestId('pair-conflict').evaluateAll(nodes => nodes.map(n => n.dataset.same));
  assert.ok(same.includes('true')); assert.ok(same.slice(same.indexOf('false')).every(value => value === 'false'));
  pass('MCT-33.2 pares na tela ordenados mesma-mesa primeiro');
  await load(fixture(1));
  assert.equal(await page.getByRole('button', { name: 'Gerar distribuição', exact: true }).isDisabled(), true);
  assert.ok((await page.getByRole('region', { name: 'Validação antes da geração' }).innerText()).includes('pelo menos 2 pessoas'));
  pass('MCT-33.6 UI bloqueia menos de duas pessoas');
  await page.goto('http://127.0.0.1:5173/login');
  await page.evaluate(async () => { const { mountTable } = await import('/src/components/networking/verification.jsx'); mountTable({ capacity: 6, count: 8 }); });
  await page.getByTestId('table-plan').waitFor();
  assert.equal(await page.getByTestId('chair').count(), 6);
  assert.ok((await page.getByTestId('table-plan').innerText()).includes('Capacidade excedida em 2'));
  await page.getByTestId('table-plan').screenshot({ path: `${output}/table-overflow-8-of-6.png` });
  pass('MCT-32.4 componente real com8/cap6 indica excedente2 / seis cadeiras');
  for (const capacity of [2, 30]) {
    await page.evaluate(async capacity => { const { mountTable } = await import('/src/components/networking/verification.jsx'); mountTable({ capacity, count: 1 }); }, capacity);
    await page.waitForFunction(capacity => document.querySelectorAll('[data-testid="chair"]').length === capacity, capacity);
    const geometry = await page.getByTestId('table-plan').evaluate(node => {
      const center = node.querySelector('button[aria-label^="Abrir"]').getBoundingClientRect();
      return [...node.querySelectorAll('[data-testid="chair"]')].map(chair => {
        const box = chair.getBoundingClientRect();
        return { outside: box.right <= center.left || box.left >= center.right || box.bottom <= center.top || box.top >= center.bottom, left: box.left, right: box.right };
      });
    });
    assert.ok(geometry.every(chair => chair.outside && chair.left >= 0 && chair.right <= 820));
  }
  pass('Review: limites2/30 cadeiras todas no perimetro / sem sobrepor centro');
  const findings = await page.evaluate(async () => {
    const { expenseTotal, financialSummary, scheduleSummary, capacitySummary, alerts } = await import('/src/lib/selectors.js');
    const expense = { type: 'percent', unitValue: 10, qty: 1 };
    const event = { expectedAudience: 100, expenses: [expense], revenues: [{ expected: 1000 }], modules: { networking: true }, schedule: [{ id: 'a', start: '09:00', duration: 30 }, { id: 'b', start: '11:00', duration: 30 }], capacity: 100, confirmed: 0, participants: [{ status: 'Confirmado' }] };
    return { percentExpense: financialSummary(event).despesasPrevistas, zeroQuantity: expenseTotal({ type: 'fixed', unitValue: 25, qty: 0 }), secondComputedStart: scheduleSummary(event).computed[1].computedStart, reserved: capacitySummary(event).reserved, networkingAlert: alerts(event).find(a => a.to === 'networking').title };
  });
  assert.equal(findings.percentExpense, 10); assert.equal(findings.zeroQuantity, 25); assert.equal(findings.secondComputedStart, '09:30'); assert.equal(findings.reserved, 0);
  console.log('MCT-1 achados reproduzidos:', JSON.stringify(findings));
  assert.deepEqual(errors, []);
  pass('Navegacao e fluxos: zero erros JS/console (APIs isoladas por mock de teste)');
  writeFileSync(`${output}/browser-result.json`, JSON.stringify({ checks, errors, environment: 'Edge headless / auth API mocked / named fixtures' }, null, 2));
  console.log(`${checks.length}/${checks.length} verificacoes de navegador PASS`);
} catch (error) {
  console.log('BROWSER FAILURE', error.message, 'errors=', errors, 'url=', page.url());
  console.log((await page.locator('body').innerText()).slice(0, 3000));
  await page.screenshot({ path: `${output}/browser-failure.png` });
  throw error;
} finally { await browser.close(); }
