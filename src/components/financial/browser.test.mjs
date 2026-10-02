import assert from 'node:assert/strict';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import process from 'node:process';

const require = createRequire(`${process.env.MCT_PLAYWRIGHT_ROOT}/test.cjs`);
const { chromium } = require('playwright');
const output = process.env.MCT_EVIDENCE_DIR;
mkdirSync(output, { recursive: true });
const data = JSON.parse(readFileSync(new URL('../../lib/fixtures/mct34-expenses.json', import.meta.url), 'utf8'));
const fixture = {
  expectedAudience: data.audience, capacity: 1000, expenseCategories: ['Outros'],
  expenses: data.expenses.map((e, i) => ({ ...e, id: `expense-${i}`, category: 'Outros', status: 'pendente', dueDate: '',
    unitValue: e.type === 'perParticipant' ? e.unitValue * e.qty / data.audience : e.unitValue })),
  sponsors: [{ negotiated: data.sponsorRevenue }], revenues: [{ expected: data.totalRevenue - data.sponsorRevenue }], tickets: [],
};
// Component integration fixture only: deliberately avoids auth/persistence,
// which belong to the agents executing items 2/3. No writes to EventContext.
const contextModule = `
import React from '__REACT_URL__';
const Context = React.createContext(null);
export function EventProvider({children}) {
  const [event, setEvent] = React.useState(window.__event);
  window.__setEvent = setEvent;
  const updateCurrent = updater => setEvent(old => typeof updater === 'function' ? updater(old) : {...old,...updater});
  return React.createElement(Context.Provider,{value:{currentEvent:event,updateCurrent}},children);
}
export const useEvent = () => React.useContext(Context);
`;
const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
await context.route(url => url.pathname === '/src/context/EventContext.jsx', async route => {
  // Use Vite's exact optimized React URL, including its version query, so the
  // fixture provider shares the renderer's React instance.
  const compiled = await (await route.fetch()).text();
  const reactUrl = compiled.match(/from\s*["']([^"']*\/react\.js[^"']*)["']/)?.[1];
  assert.ok(reactUrl, 'Vite React import not found');
  return route.fulfill({ contentType: 'text/javascript', body: contextModule.replace('__REACT_URL__', reactUrl) });
});
await context.addInitScript(event => { window.__event = event; }, fixture);
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
const checks = [];
const pass = name => { checks.push(name); console.log(`PASS ${name}`); };
const baseUrl = process.env.MCT_URL || 'http://127.0.0.1:5175';
const harnessUrl = `${baseUrl}/src/components/financial/browser-harness.html`;
const moneyText = value => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const taxEvent = { ...fixture, expenses: [{ id: 'tax', description: 'Taxa teste MCT-34', category: 'Outros', status: 'pendente', dueDate: '', type: 'percent', unitValue: 4, revenueBase: 'total' }] };
try {
  await page.goto(harnessUrl);
  await page.getByRole('heading', { name: 'Despesas', exact: true }).waitFor();
  assert.ok((await page.locator('body').innerText()).includes(moneyText(29718.98)));
  assert.equal(await page.getByLabel('Tipo de custo', { exact: true }).count(), 25);
  pass('25 linhas renderizadas; total da tela R$ 29.718,98');
  await page.evaluate(event => window.__setEvent(event), taxEvent);
  await page.getByLabel('Base de receita').selectOption('total');
  assert.ok((await page.locator('body').innerText()).includes(moneyText(1248.24)));
  pass('Editor percentual: 4% do faturamento R$ 31.206 → R$ 1.248,24');
  await page.getByLabel('Base de receita').selectOption('sponsors');
  assert.ok((await page.locator('body').innerText()).includes(moneyText(826.32)));
  await page.evaluate(() => window.__setEvent(e => ({ ...e, expectedAudience: 1000 })));
  assert.ok((await page.locator('body').innerText()).includes(moneyText(826.32)));
  pass('Troca de base por linha: 4% de R$ 20.658 → R$ 826,32; público 1000 mantém valor');
  await page.setViewportSize({ width: 375, height: 812 });
  assert.ok(await page.getByLabel('Base de receita').isVisible());
  assert.ok(await page.getByLabel('Percentual (%)', { exact: true }).isVisible());
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  await page.screenshot({ path: `${output}/expenses-mobile.png`, fullPage: true });
  pass('Mobile 375px: percentual/base acessíveis e sem overflow horizontal');
  await page.getByLabel('Tipo de custo', { exact: true }).selectOption('fixed');
  await page.getByLabel('Quantidade', { exact: true }).fill('0');
  assert.ok((await page.locator('body').innerText()).includes(`${moneyText(0)} previstas`));
  await page.getByLabel('Quantidade', { exact: true }).fill('2');
  assert.ok((await page.locator('body').innerText()).includes(`${moneyText(8)} previstas`));
  pass('Editor fixo: quantidade zero → R$ 0,00; quantidade 2 × R$ 4,00 → R$ 8,00');
  await page.getByLabel('Tipo de custo', { exact: true }).selectOption('perParticipant');
  await page.getByLabel('Valor por pessoa (R$)', { exact: true }).fill('60');
  assert.ok((await page.locator('body').innerText()).includes(`${moneyText(60000)} previstas`));
  pass('Editor por pessoa: R$ 60 × público 1000 → R$ 60.000,00');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole('button', { name: 'Adicionar', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Despesa', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Tipo de custo', { exact: true }).selectOption('percent');
  await dialog.getByLabel('Percentual (%)', { exact: true }).fill('4');
  await dialog.getByLabel('Base de receita').selectOption('sponsors');
  await dialog.getByRole('button', { name: 'Adicionar', exact: true }).click();
  await dialog.waitFor({ state: 'hidden' });
  assert.equal(await page.getByLabel('Tipo de custo', { exact: true }).count(), 2);
  assert.equal(await page.getByLabel('Base de receita').inputValue(), 'sponsors');
  assert.ok((await page.locator('body').innerText()).includes(moneyText(826.32)));
  pass('Criação rápida preserva percentual 4 e base patrocínio');
  await page.goto(`${harnessUrl}?view=financial`);
  await page.getByRole('heading', { name: 'Financeiro', exact: true }).waitFor();
  assert.ok((await page.locator('body').innerText()).includes('4,8%'));
  pass('Financeiro: margem dos 25 lançamentos reais exibida como 4,8%');
  await page.evaluate(event => window.__setEvent(event), taxEvent);
  await page.getByRole('tab', { name: 'despesas', exact: true }).click();
  assert.ok((await page.locator('body').innerText()).includes(moneyText(1248.24)));
  assert.ok((await page.locator('body').innerText()).includes('4% do faturamento'));
  pass('Financeiro: total e rótulo percentual usam faturamento');
  await page.goto(`${harnessUrl}?view=simulator`);
  await page.getByRole('heading', { name: 'Simulador', exact: true }).waitFor();
  // Controls retain fixture values until the explicit compare action.
  await page.evaluate(event => window.__setEvent(event), taxEvent);
  await page.getByRole('button', { name: 'Comparar com meu cenário atual' }).click();
  assert.ok((await page.locator('body').innerText()).includes(moneyText(1248.24)));
  const sponsorSlider = page.getByRole('slider').nth(2);
  await sponsorSlider.focus();
  await page.keyboard.press('End');
  const actual = await page.locator('body').innerText();
  assert.ok(actual.includes(moneyText(2821.92)));
  pass('Simulador recalcula 4% com patrocínio 60000 + outras receitas 10548 → despesa 2821.92');
  await page.screenshot({ path: `${output}/simulator-desktop.png`, fullPage: true });
  const tinyContribution = { ...fixture, expectedAudience: 10, sponsors: [], revenues: [],
    tickets: [{ lots: [{ price: 0.01, expectedSales: 10 }] }],
    expenses: [{ type: 'fixed', qty: 1, unitValue: 1 }, { type: 'percent', unitValue: 99.99, revenueBase: 'total' }],
  };
  await page.evaluate(event => window.__setEvent(event), tinyContribution);
  await page.getByRole('button', { name: 'Comparar com meu cenário atual' }).click();
  assert.ok((await page.locator('body').innerText()).includes('Estimativa:'));
  await page.goto(`${harnessUrl}?view=financial`);
  await page.getByRole('heading', { name: 'Financeiro', exact: true }).waitFor();
  await page.evaluate(event => window.__setEvent(event), tinyContribution);
  await page.getByText('Estimativa conservadora de equilíbrio a partir de', { exact: false }).waitFor();
  pass('Review: estimativa conservadora identificada nas telas Financeiro e Simulador');
  assert.deepEqual(errors, []);
  pass('Zero erros de JavaScript/console nos componentes testados');
  writeFileSync(`${output}/browser-result.json`, JSON.stringify({ checks, errors, environment: 'Edge headless, EventContext de fixture em memória; sem auth/persistência' }, null, 2));
  console.log(`${checks.length}/${checks.length} verificações UI MCT-34 PASS`);
} catch (error) {
  console.log('UI FAILURE', error.message, 'errors=', errors);
  console.log((await page.locator('body').innerText()).slice(0, 3000));
  await page.screenshot({ path: `${output}/failure.png`, fullPage: true });
  throw error;
} finally { await browser.close(); }
