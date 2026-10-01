import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { networkingInput, generateNetworking, personRoute, occupants, routeHasConflict } from './model.js';
import { gerarDistribuicao } from '../../lib/networking/engine.js';
import { routesCsv, routesPdf } from './export.js';
import { writeFileSync } from 'node:fs';
import process from 'node:process';
import { Buffer } from 'node:buffer';

const names = ['Ana', 'Bruno', 'Carla', 'Daniel', 'Elisa', 'Fabio', 'Gabriela', 'Hugo', 'Isabela', 'Joao', 'Karen', 'Lucas', 'Marina', 'Nicolas', 'Olivia', 'Paulo', 'Raquel', 'Sergio', 'Tatiana'];
const surnames = ['Almeida', 'Barbosa', 'Costa', 'Dias'];
export function fixture(count = 76, tables = 14, rounds = 14, capacity = 7) {
  return { id: 'verification', name: 'Get Connected | verificacao 76/14/14/7', participants: Array.from({ length: count }, (_, i) => ({ id: `guest-${i + 1}`, code: `GC-${i + 1}`, name: `${names[i % names.length]} ${surnames[Math.floor(i / names.length) % surnames.length]}`, company: `Consultoria ${surnames[i % surnames.length]}`, status: 'Confirmado' })), networking: { tables, rounds, capacityPerTable: capacity, seedBase: 1 } };
}

if (process.argv[1]?.endsWith('model.test.mjs')) {
  let total = 0;
  const check = (name, fn) => { fn(); total++; console.log(`PASS ${name}`); };
  const event = fixture();
  const input = networkingInput(event);
  const result = generateNetworking(input);
  check('MCT-19.2 adaptador identico ao oraculo 76/14/14/7 seed1', () => assert.deepEqual(result.tab, gerarDistribuicao({ P: 76, T: 14, R: 14, cap: 7, seedBase: 1 }).tab));
  console.log(`SHA256 grade=${createHash('sha256').update(JSON.stringify(result.tab)).digest('hex')}`);
  check('MCT-19.3 / MCT-33.1 todas as 76 rotas em ordem e 14 mesas distintas', () => {
    input.mobile.forEach(person => {
      const route = personRoute(result, person);
      assert.equal(route.length, 14); assert.equal(new Set(route.map(s => s.mesa)).size, 14);
      assert.deepEqual(route.map(s => s.rodada), Array.from({ length: 14 }, (_, i) => i + 1));
    });
  });
  check('MCT-19.4 nomes preservados, nenhum participante sintetizado no adaptador', () => assert.deepEqual(input.mobile.map(p => p.name), event.participants.map(p => p.name)));
  check('MCT-33.3 avisos de mesa sem fixo existem antes da geracao', () => assert.equal(input.warnings.filter(s => s.includes('sem anfitrião fixo')).length, 14));
  const fixedEvent = fixture(8, 2, 2, 6);
  fixedEvent.networking.participantSettings = { 'guest-1': { role: 'fixed', tableId: 'table-1' }, 'guest-2': { role: 'fixed', tableId: 'table-2' } };
  const fixedInput = networkingInput(fixedEvent), fixedResult = generateNetworking(fixedInput);
  check('Fixos excluidos de P, incluidos nas cadeiras e rotas', () => {
    assert.equal(fixedInput.engine.P, 6); assert.equal(fixedResult.tab.length, 6); assert.deepEqual(fixedInput.engine.fixosPorMesa, [1, 1]);
    assert.equal(occupants(fixedResult, 0, 0).length, 4);
    assert.deepEqual(personRoute(fixedResult, fixedInput.fixed[0]).map(s => s.mesa), [1, 1]);
  });
  const host = fixture(12, 3, 3, 6);
  host.networking.participantSettings = { 'guest-1': { role: 'host', tableId: 'table-1' } };
  check('MCT-33.4 R>=T explica inevitavel e sugere T-1', () => assert.ok(networkingInput(host).warnings.some(s => s.includes('matematicamente inevitável') && s.includes('no máximo 2 rodadas'))));
  check('MCT-33.6 menos de 2 rotativos bloqueado', () => assert.throws(() => generateNetworking(networkingInput(fixture(1))), /pelo menos 2 pessoas/));
  const invalid = fixture(4, 2, 2, 6);
  invalid.participants[1].name = invalid.participants[0].name;
  invalid.networking.participantSettings = { 'guest-1': { role: 'fixed' } };
  check('Cadastro: fixo sem mesa bloqueia, nome duplicado avisa', () => {
    const data = networkingInput(invalid);
    assert.ok(data.errors.some(s => s.includes('anfitrião fixo'))); assert.ok(data.warnings.some(s => s.includes('Nome repetido')));
  });
  const repeats = generateNetworking(networkingInput(fixture(12, 3, 5, 6)));
  check('MCT-33.2 analise original ordenada mesma mesa primeiro / mais encontros', () => {
    assert.ok(repeats.analise.pairs.some(p => p.same));
    repeats.analise.pairs.slice(1).forEach((p, i) => {
      const before = repeats.analise.pairs[i];
      assert.ok(Number(before.same) >= Number(p.same));
      if (before.same === p.same) assert.ok(before.ev.length >= p.ev.length);
    });
    assert.ok(repeats.input.mobile.some(p => routeHasConflict(repeats, p)));
  });
  check('Limites: capacidades/rodadas invalidas bloqueadas sem executar motor', () => {
    assert.throws(() => generateNetworking(networkingInput(fixture(10, 2, 0, 6))), /rodadas/);
    assert.throws(() => generateNetworking(networkingInput(fixture(10, 2, 2, 2))), /Faltam lugares/);
  });
  check('Review: identificador ausente bloqueado', () => {
    const noId = fixture(4, 2, 2, 6); delete noId.participants[0].id;
    assert.throws(() => generateNetworking(networkingInput(noId)), /identificador ausente/);
  });
  check('Capacidade individual preservada e limite conservador explicito', () => {
    const different = fixture(6, 2, 2, 6);
    different.networking.tableList = [{ capacity: 4 }, { capacity: 6 }];
    const data = networkingInput(different); assert.equal(data.engine.cap, 4); assert.deepEqual(data.tables.map(t => t.capacity), [4, 6]);
    assert.ok(data.warnings.some(s => s.includes('Capacidades diferentes')));
    const distribution = generateNetworking(data);
    for (let r = 0; r < 2; r++) for (let t = 0; t < 2; t++) assert.ok(occupants(distribution, r, t).length <= data.tables[t].capacity);
  });
  check('MCT-33.5 CSV inclui pessoas/fixos e rodadas; protege formula', () => {
    const csv = routesCsv(fixedResult); assert.equal(csv.trim().split('\r\n').length, 17);
    fixedInput.fixed[0].name = '=2+2'; assert.ok(routesCsv(fixedResult).includes("\"'=2+2\""));
  });
  check('MCT-33.5 PDF de 76 pessoas x 14 rodadas e PDF com fixos gerados', () => {
    const out = process.env.MCT_EVIDENCE_DIR;
    if (out) {
      writeFileSync(`${out}/routes-76.pdf`, Buffer.from(routesPdf(result, event.name).output('arraybuffer')));
      writeFileSync(`${out}/routes-fixed.pdf`, Buffer.from(routesPdf(fixedResult, fixedEvent.name).output('arraybuffer')));
    }
    assert.ok(routesPdf(result, event.name).getNumberOfPages() > 1);
  });
  check('Review: PDF 60 rodadas e nomes/empresas extensos com continuacao', () => {
    const long = fixture(2, 2, 60, 6);
    long.participants.forEach(p => { p.name += ' de Albuquerque '.repeat(12); p.company += ' Tecnologia e Consultoria '.repeat(12); });
    const distribution = generateNetworking(networkingInput(long));
    const document = routesPdf(distribution, long.name);
    assert.ok(document.getNumberOfPages() > 1);
    if (process.env.MCT_EVIDENCE_DIR) writeFileSync(`${process.env.MCT_EVIDENCE_DIR}/routes-long-60.pdf`, Buffer.from(document.output('arraybuffer')));
  });
  console.log(`${total}/${total} verificacoes PASS (fixture de teste com nomes, nao lista real de convidados).`);
}
