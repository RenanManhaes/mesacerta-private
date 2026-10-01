import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useEvent } from '@/context/EventContext';
import { networkingInput, generateNetworking, occupants, personRoute, routeHasConflict, roles } from '@/components/networking/model';
import TablePlan from '@/components/networking/TablePlan';

const field = 'w-full min-w-0 border border-border bg-background px-2 py-2 text-sm rounded-sm';
const action = 'border border-border px-3 py-2 text-sm rounded-sm disabled:opacity-50';

function Details({ title, children, onClose }) {
  const dialog = useRef(null);
  useEffect(() => { dialog.current?.showModal(); }, []);
  return <dialog ref={dialog} onClose={onClose} aria-label={title} className="w-[calc(100%_-_32px)] max-w-lg border border-border bg-background p-5 text-foreground backdrop:bg-black/30">
    <div className="flex justify-between items-start gap-3"><h2 className="font-display text-lg">{title}</h2><button className={action} onClick={() => dialog.current?.close()}>Fechar</button></div>
    <div className="mt-4 space-y-3">{children}</div>
  </dialog>;
}

export default function Networking() {
  const { currentEvent: ev, updateCurrent } = useEvent();
  const input = useMemo(() => networkingInput(ev), [ev]);
  const [result, setResult] = useState(null);
  const [round, setRound] = useState(1);
  const [query, setQuery] = useState('');
  const [onlyConflict, setOnlyConflict] = useState(false);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const pendingGeneration = useRef(null);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const cfg = ev.networking || {};
  useEffect(() => {
    clearTimeout(pendingGeneration.current);
    setGenerating(false); setResult(null); setSelectedPerson(null); setSelectedTable(null); setError('');
    return () => clearTimeout(pendingGeneration.current);
  }, [ev.id, ev.participants, ev.networking]);
  const setCfg = patch => updateCurrent(event => ({ ...event, networking: { ...event.networking, ...patch } }));
  const setTable = (index, patch) => setCfg({ tableList: input.tables.map((t, i) => i === index ? { ...t, ...patch } : t) });
  const setPerson = (id, patch) => setCfg({ participantSettings: { ...cfg.participantSettings, [id]: { ...cfg.participantSettings?.[id], ...patch } } });
  const generate = () => {
    setError('');
    if (input.errors.length) { setError(input.errors.join(' ')); return; }
    setGenerating(true);
    pendingGeneration.current = setTimeout(() => {
      try { setResult(generateNetworking(input)); setRound(1); }
      catch (err) { setError(err.message); }
      finally { setGenerating(false); }
    }, 30);
  };
  const people = result ? [...result.input.mobile, ...result.input.fixed] : [];
  const routes = people.filter(person => {
    const text = `${person.name} ${person.code} ${person.company || ''}`.toLocaleLowerCase('pt-BR');
    return text.includes(query.toLocaleLowerCase('pt-BR').trim()) && (!onlyConflict || routeHasConflict(result, person));
  });
  const exportRoutes = async format => {
    setExporting(true); setError('');
    try {
      const { routesPdf, routesCsv } = await import('@/components/networking/export');
      if (format === 'pdf') routesPdf(result, ev.name).save('roteiros-networking.pdf');
      else {
        const url = URL.createObjectURL(new Blob([routesCsv(result)], { type: 'text/csv;charset=utf-8' }));
        const link = document.createElement('a'); link.href = url; link.download = 'roteiros-networking.csv'; link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch (err) { setError(`Não foi possível exportar: ${err.message}`); }
    finally { setExporting(false); }
  };
  const tableName = step => step ? result.input.tables[step.mesa - 1].name : 'Fim das rodadas';
  return (
    <div className="space-y-7 min-w-0">
      <header><h1 className="font-display text-[26px] tracking-tight">Networking</h1><p className="text-sm text-muted-foreground mt-1">Cadastre as mesas, escolha quem circula e acompanhe cada rodada.</p></header>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-y border-border py-4 text-sm">
        <div><span className="block text-muted-foreground">Pessoas que circulam</span><strong data-testid="mobile-count">{input.mobile.length}</strong></div>
        <div><span className="block text-muted-foreground">Anfitriões fixos</span><strong>{input.fixed.length}</strong></div>
        <div><span className="block text-muted-foreground">Mesas</span><strong>{input.tables.length}</strong></div>
        <div><span className="block text-muted-foreground">Rodadas</span><strong>{cfg.rounds ?? '—'}</strong></div>
      </div>
      <section className="space-y-3" aria-labelledby="rules-heading">
        <h2 id="rules-heading" className="font-medium">Mesas e regras</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <label className="text-xs">Quantidade de mesas<input aria-label="Quantidade de mesas" className={field} type="number" min="2" max="40" value={cfg.tables ?? ''} disabled={generating} onChange={e => setCfg({ tables: Number(e.target.value) })} /></label>
          <label className="text-xs">Rodadas<input aria-label="Rodadas" className={field} type="number" min="1" max="60" value={cfg.rounds ?? ''} disabled={generating} onChange={e => setCfg({ rounds: Number(e.target.value) })} /></label>
          <label className="text-xs">Capacidade padrão<input aria-label="Capacidade padrão" className={field} type="number" min="2" max="30" value={cfg.capacityPerTable ?? 7} disabled={generating} onChange={e => setCfg({ capacityPerTable: Number(e.target.value), tableList: input.tables.map(t => ({ ...t, capacity: Number(e.target.value) })) })} /></label>
          <label className="text-xs">Seed<input aria-label="Seed" className={field} type="number" min="1" value={cfg.seedBase ?? 1} disabled={generating} onChange={e => setCfg({ seedBase: Number(e.target.value) })} /></label>
        </div>
        <details><summary className="cursor-pointer text-sm">Editar nomes, empresas e capacidades das mesas</summary>
          <div className="grid sm:grid-cols-2 gap-3 mt-3">{input.tables.map((table, i) => <fieldset className="border border-border p-3 space-y-2 min-w-0" key={table.id} disabled={generating}>
            <legend className="text-xs px-1">Mesa {i + 1}</legend>
            <label className="block text-xs">Nome<input aria-label={`Nome da mesa ${i + 1}`} className={field} value={table.name} onChange={e => setTable(i, { name: e.target.value })} /></label>
            <label className="block text-xs">Empresa<input aria-label={`Empresa da mesa ${i + 1}`} className={field} value={table.company} onChange={e => setTable(i, { company: e.target.value })} /></label>
            <label className="block text-xs">Capacidade<input aria-label={`Capacidade da mesa ${i + 1}`} className={field} type="number" min="2" max="30" value={table.capacity} onChange={e => setTable(i, { capacity: Number(e.target.value) })} /></label>
          </fieldset>)}</div>
        </details>
      </section>
      <section className="space-y-3" aria-labelledby="people-heading">
        <h2 id="people-heading" className="font-medium">Pessoas cadastradas no evento</h2>
        <p className="text-xs text-muted-foreground">Os nomes vêm de Participantes. Escolha o papel e vincule os anfitriões à mesa de sua empresa.</p>
        <details><summary className="cursor-pointer text-sm">Configurar {input.people.length} pessoas</summary>
          <div className="mt-3 space-y-2">{input.people.map(person => <fieldset disabled={generating} key={person.id} className="grid md:grid-cols-[1fr_190px_190px] gap-2 border-b border-border pb-2 min-w-0">
            <div className="text-sm min-w-0"><strong className="break-words">{person.name}</strong><span className="block text-xs text-muted-foreground break-words">{person.company || 'Empresa não informada'} · {person.code}</span></div>
            <label className="text-xs">Papel<select aria-label={`Papel de ${person.name}`} className={field} value={person.role} onChange={e => setPerson(person.id, { role: e.target.value })}>{Object.entries(roles).map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label>
            {['fixed', 'host'].includes(person.role) && <label className="text-xs">Mesa da empresa<select aria-label={`Mesa de ${person.name}`} className={field} value={person.tableId} onChange={e => setPerson(person.id, { tableId: e.target.value })}><option value="">Escolha a mesa</option>{input.tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>}
          </fieldset>)}</div>
        </details>
      </section>
      {(input.errors.length > 0 || input.warnings.length > 0) && <section aria-label="Validação antes da geração" className="border border-border p-4 text-sm space-y-2">
        <h2 className="font-medium">Confira antes de gerar</h2>
        {input.errors.map((text, i) => <p key={`e${i}`} className="text-destructive">! {text}</p>)}
        {input.warnings.map((text, i) => <p key={`w${i}`} className="text-muted-foreground">⚠ {text}</p>)}
      </section>}
      <div className="flex flex-wrap gap-2"><button className={`${action} bg-primary text-primary-foreground`} disabled={generating || input.errors.length > 0} onClick={generate}>{generating ? 'Gerando…' : 'Gerar distribuição'}</button>
        {result && <><button className={action} disabled={exporting} onClick={() => exportRoutes('pdf')}>Exportar PDF</button><button className={action} disabled={exporting} onClick={() => exportRoutes('csv')}>Exportar CSV</button></>}
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {result && <>
        <section aria-label="Resultado da distribuição" className="border-y border-border py-4 text-sm space-y-1">
          <p>Seed utilizada: <strong>{result.seed}</strong> · {result.analise.pairs.length} duplas com reencontro · {result.analise.sameTable} duplas na mesma mesa · máximo de {result.analise.maxMeet} encontros por dupla.</p>
          <p className="text-muted-foreground">Reencontros entre pessoas e retornos à mesa são indicadores diferentes. A análise abaixo mostra cada dupla.</p>
        </section>
        <section aria-labelledby="plan-heading" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="plan-heading" className="font-medium">Planta da rodada {round}</h2><label className="text-xs">Rodada exibida<select aria-label="Rodada exibida" className={field} value={round} onChange={e => { setRound(Number(e.target.value)); setSelectedPerson(null); setSelectedTable(null); }}>{Array.from({ length: result.input.engine.R }, (_, r) => <option key={r} value={r + 1}>Rodada {r + 1}</option>)}</select></label></div>
          <p className="text-xs text-muted-foreground">⚑ Fixo · ◇ Anfitrião rotativo · Casa: própria empresa · ↩ Retorno · ! Reencontro na mesma mesa · Tracejado: vazio. Selecione uma cadeira ou o centro da mesa.</p>
          <div data-testid="table-grid" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">{result.input.tables.map((table, t) => <TablePlan key={table.id} table={table} round={round} occupants={occupants(result, round - 1, t)} onPerson={setSelectedPerson} onTable={() => setSelectedTable(t)} />)}</div>
        </section>
        <section aria-labelledby="routes-heading" className="space-y-3">
          <h2 id="routes-heading" className="font-medium">Rotas individuais</h2>
          <div className="flex flex-wrap gap-3 items-center"><label className="text-xs grow">Buscar nome, código ou empresa<input className={field} aria-label="Buscar rota" value={query} onChange={e => setQuery(e.target.value)} /></label><label className="text-xs flex gap-2 items-center"><input type="checkbox" checked={onlyConflict} onChange={e => setOnlyConflict(e.target.checked)} />Somente com conflito</label></div>
          {!routes.length && <p className="text-sm text-muted-foreground">Nenhuma pessoa corresponde ao filtro.</p>}
          {routes.map(person => <details key={person.id} data-testid="person-route" className="border border-border p-3"><summary className="cursor-pointer text-sm break-words">{person.name} · {person.code} · {roles[person.role]}</summary><ol className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">{personRoute(result, person).map(step => <li key={step.rodada} data-testid="route-step" className="border border-border p-2 text-xs">Rodada {step.rodada}<strong className="block break-words">{tableName(step)}</strong></li>)}</ol></details>)}
        </section>
        <section aria-labelledby="conflicts-heading" className="space-y-3">
          <h2 id="conflicts-heading" className="font-medium">Análise de conflitos por dupla</h2>
          <p className="text-xs text-muted-foreground">Primeiro, reencontros na mesma mesa. Depois, duplas com mais encontros. Esta análise considera quem circula; anfitriões fixos permanecem em suas mesas.</p>
          {!result.analise.pairs.length && <p className="text-sm">Nenhuma dupla de pessoas que circulam se reencontra.</p>}
          <details><summary className="cursor-pointer text-sm">Ver {result.analise.pairs.length} duplas</summary><ol className="space-y-3 mt-3">{result.analise.pairs.map(pair => <li key={`${pair.a}-${pair.b}`} data-testid="pair-conflict" data-same={pair.same} className="border-b border-border pb-3 text-sm">
            <strong>{result.input.mobile[pair.a].name} + {result.input.mobile[pair.b].name}</strong><span className="block text-xs">{pair.same ? '! Reencontro na mesma mesa' : 'Reencontro em mesas diferentes'} · {pair.ev.length} encontros</span><p className="text-xs text-muted-foreground">{pair.ev.map(([r, t]) => `Rodada ${r + 1}: ${result.input.tables[t].name}`).join(' · ')}</p>
          </li>)}</ol></details>
        </section>
      </>}
      {result && selectedPerson && <Details title={selectedPerson.name} onClose={() => setSelectedPerson(null)}><dl className="space-y-2 text-sm">
        <div><dt className="text-muted-foreground">Empresa</dt><dd>{selectedPerson.company || 'Não informada'}</dd></div>
        <div><dt className="text-muted-foreground">Papel</dt><dd>{roles[selectedPerson.role]}</dd></div>
        <div><dt className="text-muted-foreground">Código</dt><dd>{selectedPerson.code}</dd></div>
        <div><dt className="text-muted-foreground">Mesa atual</dt><dd>{tableName(personRoute(result, selectedPerson)[round - 1])}</dd></div>
        <div><dt className="text-muted-foreground">Próxima mesa</dt><dd>{tableName(personRoute(result, selectedPerson)[round])}</dd></div>
      </dl></Details>}
      {result && selectedTable !== null && <Details title={result.input.tables[selectedTable].name} onClose={() => setSelectedTable(null)}>
        <p className="text-sm">{result.input.tables[selectedTable].company || 'Sem empresa vinculada'} · Capacidade: {result.input.tables[selectedTable].capacity} · {occupants(result, round - 1, selectedTable).length} ocupantes</p>
        {occupants(result, round - 1, selectedTable).map(({ person }) => <button key={person.id} className={`${action} block w-full text-left`} onClick={() => { setSelectedTable(null); setSelectedPerson(person); }}>{person.name} · {roles[person.role]}</button>)}
      </Details>}
    </div>
  );
}
