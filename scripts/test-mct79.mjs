// MCT-79: duas abas do mesmo navegador ficam em contas diferentes.
// Roda o app real (vite) num Chromium real, contra o Supabase LOCAL, com contas sinteticas.
//
//   node scripts/test-mct79.mjs
//
// Variaveis opcionais: APP_ORIGIN (app ja no ar; senao o script sobe `vite --port 5179`),
// MCT_PLAYWRIGHT_ROOT (pasta onde esta o pacote playwright).
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import {createClient} from '@supabase/supabase-js';
import {admin} from './local-api.mjs';
import {spawnSync} from 'node:child_process';

const status = spawnSync('npx --yes supabase status -o json', {shell: true, encoding: 'utf8'});
assert.equal(status.status, 0, 'Suba o Supabase local antes.');
const config = JSON.parse(status.stdout.slice(status.stdout.indexOf('{')));
assert.match(config.API_URL, /^http:\/\/(127\.0\.0\.1|localhost):/, 'So roda contra Supabase local.');

const require = createRequire(`${process.env.MCT_PLAYWRIGHT_ROOT || '/usr/local/lib/node_modules_global'}/x.cjs`);
const {chromium} = require('playwright');

const ORIGIN = process.env.APP_ORIGIN || 'http://localhost:5179';
let server;
const reachable = () => fetch(`${ORIGIN}/login`).then(r => r.ok, () => false);
if (!(await reachable())) {
  server = spawn('npx', ['vite', '--port', new URL(ORIGIN).port || '5179', '--strictPort'], {
    stdio: 'ignore',
    env: {...process.env, VITE_SUPABASE_URL: config.API_URL, VITE_SUPABASE_PUBLISHABLE_KEY: config.ANON_KEY},
  });
  for (let i = 0; i < 60 && !(await reachable()); i++) await new Promise(r => setTimeout(r, 1000));
  assert.ok(await reachable(), 'vite nao subiu');
}

const createAccount = async (label) => {
  const email = `${label}-${randomUUID()}@example.test`, password = randomUUID();
  const created = await admin.auth.admin.createUser({email, password, email_confirm: true});
  assert.ifError(created.error);
  const client = createClient(config.API_URL, config.ANON_KEY, {auth: {persistSession: false, autoRefreshToken: false, detectSessionInUrl: false}});
  const login = await client.auth.signInWithPassword({email, password});
  assert.ifError(login.error);
  const org = await client.rpc('criar_organizacao', {p_nome: `Synthetic MCT-79 ${label}`});
  assert.ifError(org.error);
  return {email, password, id: created.data.user.id, session: login.data.session};
};
const one = await createAccount('mct79-one'), two = await createAccount('mct79-two'), three = await createAccount('mct79-three');

const browser = await chromium.launch({args: ['--no-sandbox']}).catch(() => chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox']}));
const failures = [];
try {
  const context = await browser.newContext();

  // O que o servidor diz que esta aba e: usa o token DESTA aba, na mesma instancia do app.
  const who = async (page) => page.evaluate(async () => {
    const {supabase} = await import('/src/api/supabaseClient.js');
    const session = (await supabase.auth.getSession()).data.session;
    if (!session) return {email: null};
    const user = await supabase.auth.getUser(session.access_token);
    return {email: user.data.user?.email ?? null, token: session.access_token, refresh: session.refresh_token, error: user.error?.message};
  });
  const expectAccount = async (page, account, label) => {
    const result = await who(page);
    assert.equal(result.email, account.email, `${label}: esperado ${account.email}, veio ${result.email} ${result.error || ''}`);
    return result;
  };
  const login = async (page, account, path = '/login') => {
    await page.goto(`${ORIGIN}${path}`);
    await page.fill('#email', account.email);
    await page.fill('#password', account.password);
    await page.click('button[type=submit]');
    await page.waitForURL(url => !url.pathname.startsWith('/login'), {timeout: 20000});
    await page.getByRole('heading', {name: 'Meus eventos'}).waitFor({timeout: 20000});
  };

  const tabA = await context.newPage(), tabB = await context.newPage();

  // CA1: aba A entra na conta 1; aba B (mesmo contexto) entra na conta 2.
  await login(tabA, one);
  await expectAccount(tabA, one, 'A depois de entrar');
  await login(tabB, two);
  await expectAccount(tabB, two, 'B depois de entrar');
  await expectAccount(tabA, one, 'A depois de B entrar (sem recarregar)');
  console.log(`CA1 PASS: A=${one.email}, B=${two.email} no mesmo navegador; A nao mudou quando B entrou (confirmado no servidor com o token de cada aba).`);

  // CA2: F5 em A continua na conta 1, e F5 em B continua na conta 2.
  await tabA.reload();
  await tabA.getByRole('heading', {name: 'Meus eventos'}).waitFor({timeout: 20000});
  await expectAccount(tabA, one, 'A depois do F5');
  await tabB.reload();
  await tabB.getByRole('heading', {name: 'Meus eventos'}).waitFor({timeout: 20000});
  await expectAccount(tabB, two, 'B depois do F5');
  console.log('CA2 PASS: F5 em A mantem a conta 1; F5 em B mantem a conta 2.');

  // CA3: renovacao de token em segundo plano numa aba nao mexe na outra (MCT-54).
  const beforeA = await who(tabA), beforeB = await who(tabB);
  const refreshed = await tabA.evaluate(async () => {
    const {supabase} = await import('/src/api/supabaseClient.js');
    const result = await supabase.auth.refreshSession();
    return {error: result.error?.message, email: result.data.session?.user.email, refresh: result.data.session?.refresh_token};
  });
  assert.ok(!refreshed.error, `refreshSession falhou: ${refreshed.error}`);
  assert.equal(refreshed.email, one.email);
  assert.notEqual(refreshed.refresh, beforeA.refresh, 'o refresh token de A deve ter girado');
  const afterB = await expectAccount(tabB, two, 'B depois da renovacao em A');
  assert.equal(afterB.refresh, beforeB.refresh, 'o token de B nao pode mudar por causa de A');
  await tabB.reload();
  await tabB.getByRole('heading', {name: 'Meus eventos'}).waitFor({timeout: 20000});
  await expectAccount(tabB, two, 'B recarregada depois da renovacao em A');
  await tabA.reload();
  await tabA.getByRole('heading', {name: 'Meus eventos'}).waitFor({timeout: 20000});
  await expectAccount(tabA, one, 'A recarregada depois de renovar');
  console.log('CA3 PASS: refreshSession em A gira so o token de A; B segue com o mesmo token e a mesma conta, e as duas recarregam certo.');

  // CA4: sair em B (botao Sair da tela) nao desloga A; B continua deslogada depois do F5.
  await tabB.getByRole('button', {name: 'Sair da conta'}).click();
  await tabB.waitForURL(/\/login/, {timeout: 20000});
  await tabB.waitForLoadState('load');
  await tabB.locator('#email').waitFor({timeout: 20000});
  assert.equal((await who(tabB)).email, null);
  await expectAccount(tabA, one, 'A depois de B sair (sem recarregar)');
  await tabA.reload();
  await tabA.getByRole('heading', {name: 'Meus eventos'}).waitFor({timeout: 20000});
  await expectAccount(tabA, one, 'A depois de B sair e F5');
  await tabB.reload();
  await tabB.locator('#email').waitFor({timeout: 20000});
  assert.equal((await who(tabB)).email, null, 'B nao pode herdar a conta de A depois de sair');
  console.log('CA4 PASS: Sair em B leva B ao login; A segue na conta 1 (sem F5 e com F5); B continua sem conta depois do F5.');

  // CA5: aba nova herda a ultima conta que entrou (abrir o site de novo nao pede login a toa).
  const tabC = await context.newPage();
  await tabC.goto(`${ORIGIN}/eventos`);
  await tabC.getByRole('heading', {name: 'Meus eventos'}).waitFor({timeout: 20000});
  await expectAccount(tabC, one, 'aba nova');
  console.log('CA5 PASS: aba nova sem sessao propria abre ja na ultima conta (conta 1).');

  // CA6: link de confirmacao/convite (retorno com tokens no endereco) abre em outra aba e vira
  // a conta do link SOMENTE nessa aba.
  const hash = `access_token=${three.session.access_token}&refresh_token=${three.session.refresh_token}&expires_in=3600&token_type=bearer&type=signup`;
  const tabD = await context.newPage();
  await tabD.goto(`${ORIGIN}/eventos#${hash}`);
  await tabD.getByRole('heading', {name: 'Meus eventos'}).waitFor({timeout: 20000});
  await expectAccount(tabD, three, 'aba aberta pelo link');
  await expectAccount(tabA, one, 'A depois do link abrir em D');
  await tabA.reload();
  await tabA.getByRole('heading', {name: 'Meus eventos'}).waitFor({timeout: 20000});
  await expectAccount(tabA, one, 'A recarregada depois do link');
  await tabD.reload();
  await tabD.getByRole('heading', {name: 'Meus eventos'}).waitFor({timeout: 20000});
  await expectAccount(tabD, three, 'D recarregada');
  console.log('CA6 PASS: link com tokens aberto em aba nova entra na conta 3 so nessa aba; A segue na conta 1; F5 em D mantem a conta 3.');

  // CA7: sessao antiga (formato da versao anterior, uma chave unica) e migrada, ninguem e deslogado no deploy.
  const legacy = await browser.newContext();
  await legacy.addInitScript(({key, value}) => { if (!localStorage.getItem('__seeded')) { localStorage.setItem(key, value); localStorage.setItem('__seeded', '1'); } },
    {key: 'sb-127-auth-token', value: JSON.stringify(two.session)});
  const legacyTab = await legacy.newPage();
  await legacyTab.goto(`${ORIGIN}/eventos`);
  await legacyTab.getByRole('heading', {name: 'Meus eventos'}).waitFor({timeout: 20000});
  await expectAccount(legacyTab, two, 'sessao antiga migrada');
  await legacy.close();
  console.log('CA7 PASS: sessao gravada no formato antigo (localStorage sb-127-auth-token) abre logada e e migrada.');

  // CA8: nenhuma credencial vai para dados do evento / chave de sessao so em chaves de auth.
  const stored = await tabA.evaluate(() => ({
    local: Object.keys(localStorage), session: Object.keys(sessionStorage),
  }));
  assert.ok([...stored.local, ...stored.session].every(key => key.startsWith('sb-127-auth-token')), JSON.stringify(stored));
  console.log(`CA8 PASS: chaves de navegador de A: localStorage=${JSON.stringify(stored.local)} sessionStorage=${JSON.stringify(stored.session)} (so chaves de autenticacao; nenhum dado de evento).`);

  // CA9: sair numa aba nao deixa OUTRA aba da MESMA conta quebrada. A (conta 1) e C (conta 1,
  // herdada) sao a mesma conta; D e conta 3. Sair em A leva C ao login com aviso; D nao muda.
  await tabA.reload();
  await tabA.getByRole('heading', {name: 'Meus eventos'}).waitFor({timeout: 20000});
  await expectAccount(tabA, one, 'A antes de sair (CA9)');
  await expectAccount(tabC, one, 'C antes de A sair (CA9)');
  await expectAccount(tabD, three, 'D antes de A sair (CA9)');
  await tabA.getByRole('button', {name: 'Sair da conta'}).click();
  await tabA.waitForURL(/\/login/, {timeout: 20000});
  await tabC.waitForURL(/\/login\?saiu=outra-aba/, {timeout: 20000});
  await tabC.getByText('Você saiu da conta em outra aba.').waitFor({timeout: 20000});
  assert.equal((await who(tabC)).email, null, 'C deve estar sem sessao depois que A saiu');
  await expectAccount(tabD, three, 'D (outra conta) depois de A sair');
  await tabD.getByRole('heading', {name: 'Meus eventos'}).waitFor({timeout: 20000});
  await tabD.reload();
  await tabD.getByRole('heading', {name: 'Meus eventos'}).waitFor({timeout: 20000});
  await expectAccount(tabD, three, 'D depois de A sair e F5');
  console.log('CA9 PASS: Sair em A (conta 1) levou a aba C (mesma conta) ao login com "Você saiu da conta em outra aba."; a aba D (conta 3) seguiu logada, inclusive depois do F5.');
} catch (error) {
  failures.push(error);
  console.error(error);
} finally {
  await browser.close();
  server?.kill();
}
if (failures.length) process.exit(1);
console.log('Contas e dados sinteticos mantidos no Supabase local; producao nao acessada.');
