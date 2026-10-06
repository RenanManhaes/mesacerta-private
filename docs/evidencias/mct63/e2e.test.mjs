import { setup, eventsFrom, check, done, BASE } from './e2e-lib.mjs';
const INITIAL = ['Palestra', 'Painel', 'Rodada de negócio', 'Intervalo', 'Credenciamento', 'Almoço', 'Apresentação', 'Encerramento'];
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*', 'access-control-expose-headers': '*' };
let seq = 0;
// Simula a tabela public.activity_types (inclui o indice unico por organizacao + lower(name)).
const typesHandler = async ({ req, url, send, db, route }) => {
  if (!url.pathname.endsWith('/activity_types')) return undefined;
  const id = url.searchParams.get('id')?.replace('eq.', '');
  if (req.method() === 'GET') return send(200, db.types);
  if (req.method() === 'POST') {
    const body = JSON.parse(req.postData());
    if (db.types.some(t => t.name.toLowerCase() === body.name.toLowerCase())) return send(409, { code: '23505', message: 'duplicate key' });
    if (body.organization_id !== 'org1') return send(403, { message: 'rls' });
    const row = { id: `t${++seq}`, name: body.name }; db.types.push(row); db.typeWrites.push(['insert', body.name]);
    return send(201, row);
  }
  if (req.method() === 'PATCH') {
    const body = JSON.parse(req.postData());
    if (db.types.some(t => t.id !== id && t.name.toLowerCase() === body.name.toLowerCase())) return send(409, { code: '23505', message: 'duplicate key' });
    const row = db.types.find(t => t.id === id); row.name = body.name; db.typeWrites.push(['update', body.name]);
    return send(200, row);
  }
  if (req.method() === 'DELETE') {
    db.types = db.types.filter(t => t.id !== id); db.typeWrites.push(['delete', id]);
    return route.fulfill({ status: 204, headers: CORS });
  }
};
const { browser, page, db, errors } = await setup({ extra: [typesHandler] });
db.types = INITIAL.map(name => ({ id: `s${++seq}`, name })); db.typeWrites = [];
const evs = eventsFrom(db.demo);
const [a, b] = [evs[0].id, evs[1].id];
const mk = (i, start, title, type) => ({ id: i, start, duration: 30, title, type, speaker: '', room: '' });
evs[0].schedule = [mk('p1', '09:00', 'Palestra 1', 'Palestra'), mk('p2', '10:00', 'Palestra 2', 'Palestra')];
evs[1].schedule = [mk('p3', '09:00', 'Palestra 3', 'Palestra')];
db.events = evs;
const heading = () => page.getByRole('heading', { name: 'Programação', exact: true }).waitFor();
const dlg = page.getByRole('dialog');
const options = async () => page.getByRole('option').allInnerTexts();
await page.goto(`${BASE}/event/${a}/programacao`); await heading();

// Lista inicial e menu de sugestoes
await page.getByRole('button', { name: 'Nova atividade' }).click();
const type = dlg.getByRole('combobox', { name: 'Tipo' });
await type.click();
let opts = await options();
check('Lista inicial: 8 tipos nas sugestoes', JSON.stringify([...opts].sort()) === JSON.stringify([...INITIAL].sort()), opts.join(' | '));

// Digitando, aparecem os que casam
await type.fill('ro');
opts = await options();
check('Digitando "ro": aparecem so os que casam (+ opcao de criar)', JSON.stringify(opts) === JSON.stringify(['Rodada de negócio', 'Criar tipo “ro”']), opts.join(' | '));
await type.fill('negocio');
opts = await options();
check('Busca sem acento: "negocio" acha "Rodada de negócio"', opts[0] === 'Rodada de negócio', opts.join(' | '));
await type.fill('PA');
opts = await options();
check('Busca sem diferenciar maiusculas: "PA" acha Palestra e Painel', ['Painel', 'Palestra'].every(x => opts.includes(x)) && !opts.includes('Almoço'), opts.join(' | '));

// Tipo inexistente confirmado e criado
await type.fill('Oficina de vinhos');
opts = await options();
check('Tipo inexistente: aparece "Criar tipo ..."', opts.includes('Criar tipo “Oficina de vinhos”'), opts.join(' | '));
await page.getByRole('option', { name: /Criar tipo/ }).click();
await dlg.getByLabel('Título').fill('Degustação');
await dlg.getByLabel('Horário de início').fill('11:00');
await dlg.getByRole('button', { name: 'Adicionar atividade' }).click();
await page.waitForTimeout(1000);
check('Tipo novo criado no banco da organizacao', db.types.some(t => t.name === 'Oficina de vinhos') && db.typeWrites.filter(w => w[0] === 'insert').length === 1, JSON.stringify(db.typeWrites));
check('Atividade salva com o tipo novo', db.events[0].schedule.find(s => s.title === 'Degustação')?.type === 'Oficina de vinhos');
await page.getByRole('button', { name: 'Nova atividade' }).click();
await type.click();
check('Tipo novo passa a aparecer nas sugestoes', (await options()).includes('Oficina de vinhos'));
await dlg.getByRole('button', { name: 'Cancelar' }).click();
check('Cancelar o modal nao criou tipos extras', db.typeWrites.filter(w => w[0] === 'insert').length === 1);

// Outro evento da mesma organizacao
await page.goto(`${BASE}/event/${b}/programacao`); await heading();
await page.getByRole('button', { name: 'Nova atividade' }).click();
await type.click();
opts = await options();
check('Outro evento da mesma organizacao: tipos criados antes estao la', opts.includes('Oficina de vinhos') && INITIAL.every(x => opts.includes(x)), opts.join(' | '));
await dlg.getByRole('button', { name: 'Cancelar' }).click();

// Gerenciamento: renomear
await page.getByRole('button', { name: 'Tipos de atividade' }).click();
const mgr = page.getByRole('dialog', { name: 'Tipos de atividade' });
await mgr.waitFor();
await mgr.getByRole('button', { name: 'Renomear Oficina de vinhos' }).click();
await mgr.getByLabel('Novo nome para Oficina de vinhos').fill('Degustação guiada');
await mgr.getByRole('button', { name: 'Salvar nome' }).click();
await page.waitForTimeout(1200);
check('Renomear: banco de tipos atualizado', db.types.some(t => t.name === 'Degustação guiada') && !db.types.some(t => t.name === 'Oficina de vinhos'));
check('Renomear: atividades que usavam o tipo acompanham (evento A)', db.events[0].schedule.find(s => s.title === 'Degustação')?.type === 'Degustação guiada');
await mgr.getByRole('button', { name: 'Renomear Painel' }).click();
await mgr.getByLabel('Novo nome para Painel').fill('palestra');
await mgr.getByRole('button', { name: 'Salvar nome' }).click();
await page.waitForTimeout(500);
check('Renomear para nome ja existente e recusado', await mgr.getByRole('alert').innerText().then(t => t.includes('Já existe')) && db.types.some(t => t.name === 'Painel'));
await mgr.getByRole('button', { name: 'Cancelar renomear' }).click();

// Gerenciamento: excluir tipo em uso avisa quantas atividades
await mgr.getByRole('button', { name: 'Excluir Palestra', exact: true }).click();
const warn = await page.getByTestId('delete-usage').innerText();
check('Excluir tipo em uso: avisa quantas atividades usam antes de confirmar', /3 atividades/.test(warn) && /2 eventos/.test(warn), warn);
check('Antes de confirmar o tipo continua no banco', db.types.some(t => t.name === 'Palestra') && !db.typeWrites.some(w => w[0] === 'delete'));
await page.getByRole('button', { name: 'Cancelar' }).last().click();
check('Cancelar a exclusao mantem o tipo', db.types.some(t => t.name === 'Palestra'));
await mgr.getByRole('button', { name: 'Excluir Palestra', exact: true }).click();
await page.getByRole('button', { name: 'Excluir tipo' }).click();
await page.waitForTimeout(800);
check('Confirmar exclusao remove o tipo do banco', !db.types.some(t => t.name === 'Palestra'));
check('Atividades que usavam o tipo continuam com o nome', db.events[0].schedule.filter(s => s.type === 'Palestra').length === 2);
await mgr.getByRole('button', { name: 'Excluir Intervalo' }).click();
check('Tipo sem uso: aviso diz que nao esta em uso', /não está em uso/.test(await page.getByTestId('delete-usage').innerText()));
await page.getByRole('button', { name: 'Cancelar' }).last().click();
await page.screenshot({ path: 'tipos.png' });
check('Sem erros de console/pagina', errors.length === 0, errors.join(' | '));
await browser.close(); done();
