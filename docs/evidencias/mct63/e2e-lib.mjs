import { chromium } from 'playwright-core';
export const BASE = process.env.MCT_URL || 'http://127.0.0.1:5180';
const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt = b64({alg:'HS256',typ:'JWT'})+'.'+b64({sub:'u1',exp:4102444800,role:'authenticated'})+'.sig';
const CORS = {'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*','access-control-expose-headers':'*'};
export async function setup({ extra = [] } = {}) {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const db = { events: null, revision: 1, failNext: 0, writes: 0 };
  const session = { access_token: jwt, refresh_token: 'r', token_type: 'bearer', expires_in: 3600, expires_at: 4102444800, user: { id: 'u1', aud: 'authenticated', email: 'teste@exemplo.com', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' } };
  await context.addInitScript(s => localStorage.setItem('sb-exemplo-auth-token', JSON.stringify(s)), session);
  await context.route('https://exemplo.supabase.co/**', async route => {
    const req = route.request(); const url = new URL(req.url());
    let done = false; const orig = route.fulfill.bind(route); route.fulfill = o => { done = true; return orig(o); };
    const send = (status, body) => route.fulfill({ status, headers: { ...CORS, 'content-type': 'application/json' }, body: JSON.stringify(body) });
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    const path = url.pathname;
    for (const h of extra) { await h({ req, url, send, db, route }); if (done) return; }
    if (path.endsWith('/memberships')) return send(200, [{ id: 'm1', organization_id: 'org1', role: 'owner', organizations: { id: 'org1', nome: 'Org Teste' } }]);
    if (path.endsWith('/platform_workspaces')) {
      if (req.method() === 'GET') return send(200, { events: db.events, revision: db.revision });
      if (req.method() === 'PATCH') {
        if (db.failNext > 0) { db.failNext--; return send(500, { message: 'falha simulada', code: 'XX000' }); }
        const rev = url.searchParams.get('revision');
        if (rev !== `eq.${db.revision}`) return send(406, { code: 'PGRST116', message: 'no rows' });
        db.events = JSON.parse(req.postData()).events; db.revision++; db.writes++;
        return send(200, { revision: db.revision });
      }
    }
    return send(404, { message: 'mock: ' + path });
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|falha simulada/.test(m.text())) errors.push(m.text()); });
  await page.goto(BASE + '/design-system');
  db.demo = await page.evaluate(async () => { const m = await import('/src/lib/demoData.js'); return { demoEvent: m.demoEvent, demoEvents: m.demoEvents }; });
  return { browser, context, page, db, errors };
}
export const eventsFrom = demo => [demo.demoEvent, ...demo.demoEvents.filter(e => e.id !== demo.demoEvent.id).map(e => ({ ...e, tasks: [], schedule: [], participants: [], expenses: [], revenues: [], tickets: [], sponsors: [], suppliers: [], sponsorPlans: [], staffMembers: [], networking: { enabled: false }, modules: {} }))];
let n = 0, fails = 0;
export const check = (name, ok, detail = '') => { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' :: ' + detail : ''}`); if (!ok) fails++; n++; };
export const done = () => { console.log(`\n${n - fails}/${n} checks passed`); process.exitCode = fails ? 1 : 0; };
