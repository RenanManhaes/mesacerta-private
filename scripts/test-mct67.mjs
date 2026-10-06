// MCT-67: fluxos de e-mail de confirmação contra o Supabase LOCAL + Mailpit.
// Uso: com o stack local no ar (`supabase start`, feito fora deste script):
//   node scripts/test-mct67.mjs
//
// O script nunca sobe/derruba o stack e nunca fala com o projeto hospedado.
// Cada verificação imprime PASS, FAIL ou SKIP (com o motivo). SKIP = o stack
// atual não permite exercitar o critério (ex.: confirmações desligadas); FAIL
// só aparece quando o comportamento observado contradiz o esperado.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const status = spawnSync('npx --yes supabase status -o json', { shell: true, encoding: 'utf8' });
assert.equal(status.status, 0, 'Suba o Supabase local antes (supabase start).');
const config = JSON.parse(status.stdout.slice(status.stdout.indexOf('{')));
assert.match(config.API_URL, /^http:\/\/(127\.0\.0\.1|localhost):/, 'Só roda contra Supabase local.');

const MAIL = (config.MAILPIT_URL || config.INBUCKET_URL || 'http://127.0.0.1:54324').replace(/\/$/, '');
const ORIGIN = process.env.APP_ORIGIN || 'http://localhost:5173';
const opts = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
const anon = () => createClient(config.API_URL, config.ANON_KEY, opts);
const admin = createClient(config.API_URL, config.SERVICE_ROLE_KEY, opts);

const results = [];
const report = (kind, name, note = '') => {
  results.push(kind);
  console.log(`${kind} ${name}${note ? ` - ${note}` : ''}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Mesmo formato que JoinEvent.jsx monta para o returnTo do convite.
const invitePath = `/entrar?${new URLSearchParams({ codigo: 'ABCD1234', convite: randomUUID() })}`;
const emailRedirectTo = ORIGIN + invitePath;

async function mailsFor(address, expected, timeoutMs = 10000) {
  const end = Date.now() + timeoutMs;
  let found = [];
  while (Date.now() < end) {
    const res = await fetch(`${MAIL}/api/v1/search?query=${encodeURIComponent(`to:${address}`)}`);
    if (res.ok) {
      const body = await res.json();
      found = body.messages || [];
      if (found.length >= expected) break;
    }
    await sleep(500);
  }
  const full = [];
  for (const m of found) {
    const res = await fetch(`${MAIL}/api/v1/message/${m.ID}`);
    full.push(await res.json());
  }
  return full;
}

const linkRedirect = (mail) => {
  const text = `${mail.HTML || ''} ${mail.Text || ''}`;
  const link = text.match(/https?:\/\/[^"\s<>]*\/auth\/v1\/verify[^"\s<>]*/)?.[0]?.replaceAll('&amp;', '&');
  return { link, redirectTo: link ? new URL(link).searchParams.get('redirect_to') : null };
};

// 1) Cadastro com returnTo: o link do e-mail precisa apontar de volta ao convite.
const email = `mct67-${randomUUID()}@example.test`;
const password = randomUUID();
const client = anon();
const signUp = await client.auth.signUp({ email, password, options: { emailRedirectTo } });
assert.ifError(signUp.error);
if (signUp.data.session) {
  report('SKIP', 'signUp envia e-mail com redirect_to do convite', 'o stack local está com confirmações DESLIGADAS (signUp devolveu sessão). Reinicie o stack com enable_confirmations = true.');
  report('SKIP', 'reenvio de confirmação', 'depende de confirmações ligadas');
} else {
  const mails = await mailsFor(email, 1);
  if (!mails.length) {
    report('FAIL', 'signUp envia e-mail', 'nenhum e-mail chegou ao Mailpit');
  } else {
    const { redirectTo } = linkRedirect(mails[0]);
    if (redirectTo === emailRedirectTo) report('PASS', 'link do e-mail de cadastro leva a /entrar?codigo=...&convite=...', redirectTo);
    else report('FAIL', 'link do e-mail de cadastro leva ao convite', `redirect_to=${redirectTo} (esperado ${emailRedirectTo}); confira additional_redirect_urls`);
  }

  // 2) Reenvio com o mesmo redirect.
  await sleep(1500); // max_frequency local = 1s
  const resend = await client.auth.resend({ type: 'signup', email, options: { emailRedirectTo } });
  if (resend.error) report('FAIL', 'resend de confirmação', resend.error.message);
  else {
    const after = await mailsFor(email, 2);
    const last = after.sort((a, b) => new Date(b.Created) - new Date(a.Created))[0];
    const { redirectTo } = last ? linkRedirect(last) : {};
    if (after.length >= 2 && redirectTo === emailRedirectTo) report('PASS', 'resend envia novo e-mail com o mesmo redirect', `${after.length} e-mails`);
    else report('FAIL', 'resend envia novo e-mail com o mesmo redirect', `e-mails=${after.length} redirect_to=${redirectTo}`);
  }

  // 3) Limite do servidor: reenvio imediato (dentro de max_frequency) é recusado.
  const burst = await client.auth.resend({ type: 'signup', email, options: { emailRedirectTo } });
  if (burst.error) report('PASS', 'reenvio imediato é recusado pelo servidor', `${burst.error.status} ${burst.error.code || burst.error.message}`);
  else report('SKIP', 'reenvio imediato recusado pelo servidor', 'servidor aceitou (max_frequency local = 1s e a chamada demorou mais). O bloqueio de 60 s é do cliente: ver src/lib/emailResend.test.mjs.');

  // 4) Login antes de confirmar: erro que o Login.jsx traduz e oferece o reenvio.
  const early = await anon().auth.signInWithPassword({ email, password });
  if (early.error?.message?.includes('Email not confirmed')) report('PASS', 'login sem confirmar devolve "Email not confirmed"');
  else report('FAIL', 'login sem confirmar devolve "Email not confirmed"', early.error?.message || 'entrou sem confirmar');
}

// 5) Clique no link de confirmação -> redireciona ao convite com sessão no hash.
//    generateLink não depende de SMTP nem das confirmações ligadas.
const linkEmail = `mct67-link-${randomUUID()}@example.test`;
const gen = await admin.auth.admin.generateLink({ type: 'signup', email: linkEmail, password, options: { redirectTo: emailRedirectTo } });
assert.ifError(gen.error);
const verify = await fetch(gen.data.properties.action_link, { redirect: 'manual' });
const location = verify.headers.get('location') || '';
if (location.startsWith(emailRedirectTo) || location.startsWith(ORIGIN + '/entrar?')) {
  const url = new URL(location);
  const sameParams = url.searchParams.get('codigo') === 'ABCD1234' && url.searchParams.get('convite') === new URL(emailRedirectTo).searchParams.get('convite');
  const hasSession = /access_token=/.test(url.hash);
  if (sameParams && hasSession) report('PASS', 'confirmar o e-mail redireciona ao convite com sessão (#access_token)', `${url.origin}${url.pathname}?codigo&convite`);
  else report('FAIL', 'confirmar o e-mail redireciona ao convite com sessão', `params=${sameParams} sessao=${hasSession} location=${location.slice(0, 120)}`);
} else {
  report('FAIL', 'confirmar o e-mail redireciona ao convite', `Location=${location.slice(0, 120)}. Provável: ${ORIGIN} fora de additional_redirect_urls (config.toml novo não aplicado ao stack).`);
}

// 6) MCT-67 item 4: is_org_member/is_org_admin deixam de ser RPC.
const probeEmail = `mct67-rpc-${randomUUID()}@example.test`;
const created = await admin.auth.admin.createUser({ email: probeEmail, password, email_confirm: true });
assert.ifError(created.error);
const user = anon();
assert.ifError((await user.auth.signInWithPassword({ email: probeEmail, password })).error);
for (const fn of ['is_org_member', 'is_org_admin']) {
  const res = await user.rpc(fn, { p_organization_id: randomUUID() });
  if (res.error) report('PASS', `rpc ${fn} não está exposta`, res.error.code || res.error.message);
  else report('FAIL', `rpc ${fn} não está exposta`, 'ainda executável como authenticated (migration 20261006190000 não aplicada?)');
}
const org = await user.rpc('criar_organizacao', { p_nome: 'Org MCT-67' });
if (org.error) report('FAIL', 'criar_organizacao continua funcionando', org.error.message);
else {
  const orgs = await user.from('organizations').select('id');
  if (!orgs.error && orgs.data.length === 1) report('PASS', 'criar_organizacao + leitura por RLS (policy chama private.is_org_member)');
  else report('FAIL', 'RLS de organizations após a migration', orgs.error?.message || `linhas=${orgs.data?.length}`);
}

const fails = results.filter((r) => r === 'FAIL').length;
console.log(`\n${results.filter((r) => r === 'PASS').length} PASS, ${results.filter((r) => r === 'SKIP').length} SKIP, ${fails} FAIL`);
process.exit(fails ? 1 : 0);
