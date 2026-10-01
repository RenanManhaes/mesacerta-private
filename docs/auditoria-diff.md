# Diff do lote 01

Snapshot pre-edicao versus estado revisado. Fora de Networking, apenas imports sem uso foram removidos.

## src\pages\event\Capacity.jsx

```diff
--- antes/src\pages\event\Capacity.jsx
+++ depois/src\pages\event\Capacity.jsx
@@ -1,7 +1,6 @@
 import React from 'react';
 import { useEvent } from '@/context/EventContext';
 import { capacitySummary } from '@/lib/selectors';
-import { formatBRL } from '@/lib/format';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { AlertTriangle, CheckCircle2 } from 'lucide-react';

```

## src\pages\event\Financial.jsx

```diff
--- antes/src\pages\event\Financial.jsx
+++ depois/src\pages\event\Financial.jsx
@@ -2,7 +2,7 @@
 import { useEvent } from '@/context/EventContext';
 import { financialSummary, expenseTotal } from '@/lib/selectors';
 import { formatBRL, formatBRLc, formatPercent, formatDateShort } from '@/lib/format';
-import { SectionLabel, InfoTip, StatusPill, EmptyState } from '@/components/common/Primitives';
+import { SectionLabel, InfoTip, StatusPill } from '@/components/common/Primitives';
 import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
 import { cn } from '@/lib/utils';
 

```

## src\pages\event\Networking.jsx

```diff
--- antes/src\pages\event\Networking.jsx
+++ depois/src\pages\event\Networking.jsx
@@ -1,149 +1,153 @@
-import React, { useState, useMemo } from 'react';
+import React, { useEffect, useMemo, useRef, useState } from 'react';
 import { useEvent } from '@/context/EventContext';
-import { generateDistribution, participantRoute } from '@/lib/networking/distribution';
-import { SectionLabel, StatusPill } from '@/components/common/Primitives';
-import { Button } from '@/components/ui/button';
-import { Input } from '@/components/ui/input';
-import { Label } from '@/components/ui/label';
-import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
-import { Network, Download, CheckCircle2, AlertTriangle, ChevronRight } from 'lucide-react';
-import { cn } from '@/lib/utils';
+import { networkingInput, generateNetworking, occupants, personRoute, routeHasConflict, roles } from '@/components/networking/model';
+import TablePlan from '@/components/networking/TablePlan';
+
+const field = 'w-full min-w-0 border border-border bg-background px-2 py-2 text-sm rounded-sm';
+const action = 'border border-border px-3 py-2 text-sm rounded-sm disabled:opacity-50';
+
+function Details({ title, children, onClose }) {
+  const dialog = useRef(null);
+  useEffect(() => { dialog.current?.showModal(); }, []);
+  return <dialog ref={dialog} onClose={onClose} aria-label={title} className="w-[calc(100%_-_32px)] max-w-lg border border-border bg-background p-5 text-foreground backdrop:bg-black/30">
+    <div className="flex justify-between items-start gap-3"><h2 className="font-display text-lg">{title}</h2><button className={action} onClick={() => dialog.current?.close()}>Fechar</button></div>
+    <div className="mt-4 space-y-3">{children}</div>
+  </dialog>;
+}
 
 export default function Networking() {
   const { currentEvent: ev, updateCurrent } = useEvent();
+  const input = useMemo(() => networkingInput(ev), [ev]);
   const [result, setResult] = useState(null);
   const [round, setRound] = useState(1);
-  const [routeQuery, setRouteQuery] = useState('');
-
+  const [query, setQuery] = useState('');
+  const [onlyConflict, setOnlyConflict] = useState(false);
+  const [error, setError] = useState('');
+  const [generating, setGenerating] = useState(false);
+  const [exporting, setExporting] = useState(false);
+  const pendingGeneration = useRef(null);
+  const [selectedPerson, setSelectedPerson] = useState(null);
+  const [selectedTable, setSelectedTable] = useState(null);
   const cfg = ev.networking || {};
-  const setCfg = (patch) => updateCurrent(e => ({ ...e, networking: { ...e.networking, ...patch } }));
-
+  useEffect(() => {
+    clearTimeout(pendingGeneration.current);
+    setGenerating(false); setResult(null); setSelectedPerson(null); setSelectedTable(null); setError('');
+    return () => clearTimeout(pendingGeneration.current);
+  }, [ev.id, ev.participants, ev.networking]);
+  const setCfg = patch => updateCurrent(event => ({ ...event, networking: { ...event.networking, ...patch } }));
+  const setTable = (index, patch) => setCfg({ tableList: input.tables.map((t, i) => i === index ? { ...t, ...patch } : t) });
+  const setPerson = (id, patch) => setCfg({ participantSettings: { ...cfg.participantSettings, [id]: { ...cfg.participantSettings?.[id], ...patch } } });
   const generate = () => {
-    const res = generateDistribution(cfg);
-    setResult(res);
-    setRound(1);
+    setError('');
+    if (input.errors.length) { setError(input.errors.join(' ')); return; }
+    setGenerating(true);
+    pendingGeneration.current = setTimeout(() => {
+      try { setResult(generateNetworking(input)); setRound(1); }
+      catch (err) { setError(err.message); }
+      finally { setGenerating(false); }
+    }, 30);
   };
-
-  const exportCsv = () => {
-    if (!result) return;
-    const lines = ['Rodada,Mesa,Participantes'];
-    result.grid.forEach((tables, r) => {
-      tables.forEach((ids, t) => {
-        lines.push(`${r + 1},${t + 1},${ids.join(' | ')}`);
-      });
-    });
-    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
-    const url = URL.createObjectURL(blob);
-    const a = document.createElement('a');
-    a.href = url; a.download = 'distribuicao-networking.csv'; a.click();
-    URL.revokeObjectURL(url);
+  const people = result ? [...result.input.mobile, ...result.input.fixed] : [];
+  const routes = people.filter(person => {
+    const text = `${person.name} ${person.code} ${person.company || ''}`.toLocaleLowerCase('pt-BR');
+    return text.includes(query.toLocaleLowerCase('pt-BR').trim()) && (!onlyConflict || routeHasConflict(result, person));
+  });
+  const exportRoutes = async format => {
+    setExporting(true); setError('');
+    try {
+      const { routesPdf, routesCsv } = await import('@/components/networking/export');
+      if (format === 'pdf') routesPdf(result, ev.name).save('roteiros-networking.pdf');
+      else {
+        const url = URL.createObjectURL(new Blob([routesCsv(result)], { type: 'text/csv;charset=utf-8' }));
+        const link = document.createElement('a'); link.href = url; link.download = 'roteiros-networking.csv'; link.click();
+        setTimeout(() => URL.revokeObjectURL(url), 1000);
+      }
+    } catch (err) { setError(`Não foi possível exportar: ${err.message}`); }
+    finally { setExporting(false); }
   };
-
-  const route = useMemo(() => {
-    if (!result || !routeQuery) return null;
-    const id = routeQuery.toUpperCase();
-    return participantRoute(result.grid, id);
-  }, [result, routeQuery]);
-
-  const steps = ['Participantes', 'Mesas', 'Regras', 'Distribuição', 'Publicar'];
-
+  const tableName = step => step ? result.input.tables[step.mesa - 1].name : 'Fim das rodadas';
   return (
-    <div className="space-y-8 animate-fade-in">
-      <div>
-        <h1 className="font-display text-[26px] tracking-tight">Networking</h1>
-        <p className="mt-1 text-[14px] text-muted-foreground">Organize rodadas de negócio com distribuição automática e sem conflitos.</p>
+    <div className="space-y-7 min-w-0">
+      <header><h1 className="font-display text-[26px] tracking-tight">Networking</h1><p className="text-sm text-muted-foreground mt-1">Cadastre as mesas, escolha quem circula e acompanhe cada rodada.</p></header>
+      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-y border-border py-4 text-sm">
+        <div><span className="block text-muted-foreground">Pessoas que circulam</span><strong data-testid="mobile-count">{input.mobile.length}</strong></div>
+        <div><span className="block text-muted-foreground">Anfitriões fixos</span><strong>{input.fixed.length}</strong></div>
+        <div><span className="block text-muted-foreground">Mesas</span><strong>{input.tables.length}</strong></div>
+        <div><span className="block text-muted-foreground">Rodadas</span><strong>{cfg.rounds ?? '—'}</strong></div>
       </div>
-
-      {/* Summary */}
-      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 border-t border-border pt-4">
-        {[
-          { label: 'Participantes', value: cfg.rotatingParticipants + cfg.fixedHosts + cfg.rotatingHosts },
-          { label: 'Mesas', value: cfg.tables },
-          { label: 'Rodadas', value: cfg.rounds },
-          { label: 'Capacidade/mesa', value: cfg.capacityPerTable },
-          { label: 'Conflitos', value: result ? result.stats.conflicts : '—' }
-        ].map(s => (
-          <div key={s.label}><div className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">{s.label}</div><div className="tnum text-[18px] font-medium mt-0.5">{s.value}</div></div>
-        ))}
+      <section className="space-y-3" aria-labelledby="rules-heading">
+        <h2 id="rules-heading" className="font-medium">Mesas e regras</h2>
+        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
+          <label className="text-xs">Quantidade de mesas<input aria-label="Quantidade de mesas" className={field} type="number" min="2" max="40" value={cfg.tables ?? ''} disabled={generating} onChange={e => setCfg({ tables: Number(e.target.value) })} /></label>
+          <label className="text-xs">Rodadas<input aria-label="Rodadas" className={field} type="number" min="1" max="60" value={cfg.rounds ?? ''} disabled={generating} onChange={e => setCfg({ rounds: Number(e.target.value) })} /></label>
+          <label className="text-xs">Capacidade padrão<input aria-label="Capacidade padrão" className={field} type="number" min="2" max="30" value={cfg.capacityPerTable ?? 7} disabled={generating} onChange={e => setCfg({ capacityPerTable: Number(e.target.value), tableList: input.tables.map(t => ({ ...t, capacity: Number(e.target.value) })) })} /></label>
+          <label className="text-xs">Seed<input aria-label="Seed" className={field} type="number" min="1" value={cfg.seedBase ?? 1} disabled={generating} onChange={e => setCfg({ seedBase: Number(e.target.value) })} /></label>
+        </div>
+        <details><summary className="cursor-pointer text-sm">Editar nomes, empresas e capacidades das mesas</summary>
+          <div className="grid sm:grid-cols-2 gap-3 mt-3">{input.tables.map((table, i) => <fieldset className="border border-border p-3 space-y-2 min-w-0" key={table.id} disabled={generating}>
+            <legend className="text-xs px-1">Mesa {i + 1}</legend>
+            <label className="block text-xs">Nome<input aria-label={`Nome da mesa ${i + 1}`} className={field} value={table.name} onChange={e => setTable(i, { name: e.target.value })} /></label>
+            <label className="block text-xs">Empresa<input aria-label={`Empresa da mesa ${i + 1}`} className={field} value={table.company} onChange={e => setTable(i, { company: e.target.value })} /></label>
+            <label className="block text-xs">Capacidade<input aria-label={`Capacidade da mesa ${i + 1}`} className={field} type="number" min="2" max="30" value={table.capacity} onChange={e => setTable(i, { capacity: Number(e.target.value) })} /></label>
+          </fieldset>)}</div>
+        </details>
+      </section>
+      <section className="space-y-3" aria-labelledby="people-heading">
+        <h2 id="people-heading" className="font-medium">Pessoas cadastradas no evento</h2>
+        <p className="text-xs text-muted-foreground">Os nomes vêm de Participantes. Escolha o papel e vincule os anfitriões à mesa de sua empresa.</p>
+        <details><summary className="cursor-pointer text-sm">Configurar {input.people.length} pessoas</summary>
+          <div className="mt-3 space-y-2">{input.people.map(person => <fieldset disabled={generating} key={person.id} className="grid md:grid-cols-[1fr_190px_190px] gap-2 border-b border-border pb-2 min-w-0">
+            <div className="text-sm min-w-0"><strong className="break-words">{person.name}</strong><span className="block text-xs text-muted-foreground break-words">{person.company || 'Empresa não informada'} · {person.code}</span></div>
+            <label className="text-xs">Papel<select aria-label={`Papel de ${person.name}`} className={field} value={person.role} onChange={e => setPerson(person.id, { role: e.target.value })}>{Object.entries(roles).map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label>
+            {['fixed', 'host'].includes(person.role) && <label className="text-xs">Mesa da empresa<select aria-label={`Mesa de ${person.name}`} className={field} value={person.tableId} onChange={e => setPerson(person.id, { tableId: e.target.value })}><option value="">Escolha a mesa</option>{input.tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>}
+          </fieldset>)}</div>
+        </details>
+      </section>
+      {(input.errors.length > 0 || input.warnings.length > 0) && <section aria-label="Validação antes da geração" className="border border-border p-4 text-sm space-y-2">
+        <h2 className="font-medium">Confira antes de gerar</h2>
+        {input.errors.map((text, i) => <p key={`e${i}`} className="text-destructive">! {text}</p>)}
+        {input.warnings.map((text, i) => <p key={`w${i}`} className="text-muted-foreground">⚠ {text}</p>)}
+      </section>}
+      <div className="flex flex-wrap gap-2"><button className={`${action} bg-primary text-primary-foreground`} disabled={generating || input.errors.length > 0} onClick={generate}>{generating ? 'Gerando…' : 'Gerar distribuição'}</button>
+        {result && <><button className={action} disabled={exporting} onClick={() => exportRoutes('pdf')}>Exportar PDF</button><button className={action} disabled={exporting} onClick={() => exportRoutes('csv')}>Exportar CSV</button></>}
       </div>
-
-      {/* Stepper */}
-      <div className="flex items-center gap-1.5 flex-wrap text-[12px]">
-        {steps.map((s, i) => (
-          <React.Fragment key={s}>
-            <span className={cn('px-2.5 py-1 rounded-full border', i === 3 && result ? 'border-primary bg-accent text-accent-foreground' : 'border-border text-muted-foreground')}>{s}</span>
-            {i < steps.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
-          </React.Fragment>
-        ))}
-      </div>
-
-      {/* Config */}
-      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
-        <div><Label className="text-[12px]">Mesas</Label><Input type="number" value={cfg.tables} onChange={e => setCfg({ tables: Number(e.target.value) || 0 })} className="h-9 mt-1 tnum" /></div>
-        <div><Label className="text-[12px]">Rodadas</Label><Input type="number" value={cfg.rounds} onChange={e => setCfg({ rounds: Number(e.target.value) || 0 })} className="h-9 mt-1 tnum" /></div>
-        <div><Label className="text-[12px]">Capacidade/mesa</Label><Input type="number" value={cfg.capacityPerTable} onChange={e => setCfg({ capacityPerTable: Number(e.target.value) || 1 })} className="h-9 mt-1 tnum" /></div>
-        <div><Label className="text-[12px]">Anfitriões fixos</Label><Input type="number" value={cfg.fixedHosts} onChange={e => setCfg({ fixedHosts: Number(e.target.value) || 0 })} className="h-9 mt-1 tnum" /></div>
-        <div><Label className="text-[12px]">Anfitriões que rodam</Label><Input type="number" value={cfg.rotatingHosts} onChange={e => setCfg({ rotatingHosts: Number(e.target.value) || 0 })} className="h-9 mt-1 tnum" /></div>
-        <div><Label className="text-[12px]">Participantes móveis</Label><Input type="number" value={cfg.rotatingParticipants} onChange={e => setCfg({ rotatingParticipants: Number(e.target.value) || 0 })} className="h-9 mt-1 tnum" /></div>
-      </div>
-
-      <div className="flex gap-2">
-        <Button size="sm" className="h-9 gap-1.5 text-[13px]" onClick={generate}><Network className="h-3.5 w-3.5" /> Gerar distribuição</Button>
-        {result && <Button size="sm" variant="outline" className="h-9 gap-1.5 text-[13px]" onClick={exportCsv}><Download className="h-3.5 w-3.5" /> Exportar</Button>}
-      </div>
-
-      {result && (
-        <>
-          <div className={cn('flex items-center gap-2 rounded-md border px-4 py-3', result.stats.conflicts === 0 ? 'border-positive/30 bg-positive/5' : 'border-warning/30 bg-warning/5')}>
-            {result.stats.conflicts === 0 ? <CheckCircle2 className="h-4 w-4 text-positive" /> : <AlertTriangle className="h-4 w-4 text-warning" />}
-            <span className="text-[13px]">
-              {result.stats.conflicts === 0
-                ? 'Distribuição sem conflitos. Nenhum participante repete mesa.'
-                : `${result.stats.conflicts} reencontro(s) detectado(s) — ajuste mesas ou rodadas.`}
-            </span>
-          </div>
-
-          {/* Round viewer */}
-          <div>
-            <div className="flex items-center justify-between mb-3">
-              <SectionLabel>Rodada {round}</SectionLabel>
-              <Select value={String(round)} onValueChange={v => setRound(Number(v))}>
-                <SelectTrigger className="h-8 w-32 text-[13px]"><SelectValue /></SelectTrigger>
-                <SelectContent>{Array.from({ length: cfg.rounds }, (_, i) => <SelectItem key={i} value={String(i + 1)}>Rodada {i + 1}</SelectItem>)}</SelectContent>
-              </Select>
-            </div>
-            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
-              {result.grid[round - 1]?.map((ids, t) => (
-                <div key={t} className="border border-border rounded-md p-3">
-                  <div className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Mesa {t + 1}</div>
-                  <div className="mt-1.5 space-y-0.5">
-                    {ids.map(id => (
-                      <div key={id} className={cn('text-[12px] tnum', id.startsWith('FH') ? 'font-medium text-primary' : 'text-foreground')}>{id}</div>
-                    ))}
-                  </div>
-                  <div className="mt-1.5 text-[11px] text-muted-foreground">{ids.length} pessoas</div>
-                </div>
-              ))}
-            </div>
-          </div>
-
-          {/* Route lookup */}
-          <div>
-            <SectionLabel className="mb-2">Rota de um participante</SectionLabel>
-            <Input value={routeQuery} onChange={e => setRouteQuery(e.target.value)} placeholder="Digite o ID (ex.: P12)" className="h-9 w-48 text-[13px] tnum" />
-            {route && (
-              <div className="mt-3 flex flex-wrap gap-1.5">
-                {route.map((r, i) => (
-                  <div key={i} className="flex items-center gap-1.5 text-[12px]">
-                    <span className="rounded-md border border-border px-2 py-1 tnum">Rodada {r.round} · Mesa {r.table}</span>
-                    {i < route.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
-                  </div>
-                ))}
-              </div>
-            )}
-          </div>
-        </>
-      )}
+      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
+      {result && <>
+        <section aria-label="Resultado da distribuição" className="border-y border-border py-4 text-sm space-y-1">
+          <p>Seed utilizada: <strong>{result.seed}</strong> · {result.analise.pairs.length} duplas com reencontro · {result.analise.sameTable} duplas na mesma mesa · máximo de {result.analise.maxMeet} encontros por dupla.</p>
+          <p className="text-muted-foreground">Reencontros entre pessoas e retornos à mesa são indicadores diferentes. A análise abaixo mostra cada dupla.</p>
+        </section>
+        <section aria-labelledby="plan-heading" className="space-y-3">
+          <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="plan-heading" className="font-medium">Planta da rodada {round}</h2><label className="text-xs">Rodada exibida<select aria-label="Rodada exibida" className={field} value={round} onChange={e => { setRound(Number(e.target.value)); setSelectedPerson(null); setSelectedTable(null); }}>{Array.from({ length: result.input.engine.R }, (_, r) => <option key={r} value={r + 1}>Rodada {r + 1}</option>)}</select></label></div>
+          <p className="text-xs text-muted-foreground">⚑ Fixo · ◇ Anfitrião rotativo · Casa: própria empresa · ↩ Retorno · ! Reencontro na mesma mesa · Tracejado: vazio. Selecione uma cadeira ou o centro da mesa.</p>
+          <div data-testid="table-grid" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">{result.input.tables.map((table, t) => <TablePlan key={table.id} table={table} round={round} occupants={occupants(result, round - 1, t)} onPerson={setSelectedPerson} onTable={() => setSelectedTable(t)} />)}</div>
+        </section>
+        <section aria-labelledby="routes-heading" className="space-y-3">
+          <h2 id="routes-heading" className="font-medium">Rotas individuais</h2>
+          <div className="flex flex-wrap gap-3 items-center"><label className="text-xs grow">Buscar nome, código ou empresa<input className={field} aria-label="Buscar rota" value={query} onChange={e => setQuery(e.target.value)} /></label><label className="text-xs flex gap-2 items-center"><input type="checkbox" checked={onlyConflict} onChange={e => setOnlyConflict(e.target.checked)} />Somente com conflito</label></div>
+          {!routes.length && <p className="text-sm text-muted-foreground">Nenhuma pessoa corresponde ao filtro.</p>}
+          {routes.map(person => <details key={person.id} data-testid="person-route" className="border border-border p-3"><summary className="cursor-pointer text-sm break-words">{person.name} · {person.code} · {roles[person.role]}</summary><ol className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">{personRoute(result, person).map(step => <li key={step.rodada} data-testid="route-step" className="border border-border p-2 text-xs">Rodada {step.rodada}<strong className="block break-words">{tableName(step)}</strong></li>)}</ol></details>)}
+        </section>
+        <section aria-labelledby="conflicts-heading" className="space-y-3">
+          <h2 id="conflicts-heading" className="font-medium">Análise de conflitos por dupla</h2>
+          <p className="text-xs text-muted-foreground">Primeiro, reencontros na mesma mesa. Depois, duplas com mais encontros. Esta análise considera quem circula; anfitriões fixos permanecem em suas mesas.</p>
+          {!result.analise.pairs.length && <p className="text-sm">Nenhuma dupla de pessoas que circulam se reencontra.</p>}
+          <details><summary className="cursor-pointer text-sm">Ver {result.analise.pairs.length} duplas</summary><ol className="space-y-3 mt-3">{result.analise.pairs.map(pair => <li key={`${pair.a}-${pair.b}`} data-testid="pair-conflict" data-same={pair.same} className="border-b border-border pb-3 text-sm">
+            <strong>{result.input.mobile[pair.a].name} + {result.input.mobile[pair.b].name}</strong><span className="block text-xs">{pair.same ? '! Reencontro na mesma mesa' : 'Reencontro em mesas diferentes'} · {pair.ev.length} encontros</span><p className="text-xs text-muted-foreground">{pair.ev.map(([r, t]) => `Rodada ${r + 1}: ${result.input.tables[t].name}`).join(' · ')}</p>
+          </li>)}</ol></details>
+        </section>
+      </>}
+      {result && selectedPerson && <Details title={selectedPerson.name} onClose={() => setSelectedPerson(null)}><dl className="space-y-2 text-sm">
+        <div><dt className="text-muted-foreground">Empresa</dt><dd>{selectedPerson.company || 'Não informada'}</dd></div>
+        <div><dt className="text-muted-foreground">Papel</dt><dd>{roles[selectedPerson.role]}</dd></div>
+        <div><dt className="text-muted-foreground">Código</dt><dd>{selectedPerson.code}</dd></div>
+        <div><dt className="text-muted-foreground">Mesa atual</dt><dd>{tableName(personRoute(result, selectedPerson)[round - 1])}</dd></div>
+        <div><dt className="text-muted-foreground">Próxima mesa</dt><dd>{tableName(personRoute(result, selectedPerson)[round])}</dd></div>
+      </dl></Details>}
+      {result && selectedTable !== null && <Details title={result.input.tables[selectedTable].name} onClose={() => setSelectedTable(null)}>
+        <p className="text-sm">{result.input.tables[selectedTable].company || 'Sem empresa vinculada'} · Capacidade: {result.input.tables[selectedTable].capacity} · {occupants(result, round - 1, selectedTable).length} ocupantes</p>
+        {occupants(result, round - 1, selectedTable).map(({ person }) => <button key={person.id} className={`${action} block w-full text-left`} onClick={() => { setSelectedTable(null); setSelectedPerson(person); }}>{person.name} · {roles[person.role]}</button>)}
+      </Details>}
     </div>
   );
 }

```

## src\pages\event\Participants.jsx

```diff
--- antes/src\pages\event\Participants.jsx
+++ depois/src\pages\event\Participants.jsx
@@ -2,14 +2,13 @@
 import { useSearchParams } from 'react-router-dom';
 import { useEvent } from '@/context/EventContext';
 import { capacitySummary } from '@/lib/selectors';
-import { SectionLabel, StatusPill, EmptyState } from '@/components/common/Primitives';
+import { EmptyState } from '@/components/common/Primitives';
 import { Input } from '@/components/ui/input';
 import { Button } from '@/components/ui/button';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
-import { Search, Upload, Plus } from 'lucide-react';
+import { Search, Upload } from 'lucide-react';
 import { useToast } from '@/components/ui/use-toast';
 import { uid } from '@/lib/format';
-import { cn } from '@/lib/utils';
 
 const TYPES = ['Participante','Convidado','VIP','Palestrante','Equipe','Patrocinador','Expositor','Outro'];
 const STATUSES = ['Confirmado','Pendente','Cancelado','Check-in realizado'];

```

## src\pages\event\Revenues.jsx

```diff
--- antes/src\pages\event\Revenues.jsx
+++ depois/src\pages\event\Revenues.jsx
@@ -7,7 +7,7 @@
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
-import { Plus, Ticket } from 'lucide-react';
+import { Plus } from 'lucide-react';
 import { useToast } from '@/components/ui/use-toast';
 
 function TicketCard({ t, ev, onUpdate }) {

```

## src\pages\event\Schedule.jsx

```diff
--- antes/src\pages\event\Schedule.jsx
+++ depois/src\pages\event\Schedule.jsx
@@ -2,12 +2,10 @@
 import { useEvent } from '@/context/EventContext';
 import { scheduleSummary } from '@/lib/selectors';
 import { minutesToTime, timeToMinutes, uid } from '@/lib/format';
-import { SectionLabel, InfoTip } from '@/components/common/Primitives';
 import { Input } from '@/components/ui/input';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { Button } from '@/components/ui/button';
 import { ArrowUp, ArrowDown, Copy, Trash2, Plus, AlertCircle } from 'lucide-react';
-import { cn } from '@/lib/utils';
 
 const TYPES = ['Credenciamento','Abertura','Palestra','Painel','Workshop','Intervalo','Almoço','Networking','Apresentação','Encerramento','Personalizado'];
 

```

## src\pages\event\Simulator.jsx

```diff
--- antes/src\pages\event\Simulator.jsx
+++ depois/src\pages\event\Simulator.jsx
@@ -4,7 +4,6 @@
 import { formatBRL, formatPercent } from '@/lib/format';
 import { SectionLabel, InfoTip } from '@/components/common/Primitives';
 import { Slider } from '@/components/ui/slider';
-import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Button } from '@/components/ui/button';
 import { CheckCircle2, AlertTriangle } from 'lucide-react';

```

## src\pages\event\Sponsors.jsx

```diff
--- antes/src\pages\event\Sponsors.jsx
+++ depois/src\pages\event\Sponsors.jsx
@@ -7,7 +7,7 @@
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
-import { Plus, Sparkles } from 'lucide-react';
+import { Plus } from 'lucide-react';
 import { useToast } from '@/components/ui/use-toast';
 
 export default function Sponsors() {

```

## src\pages\event\Suppliers.jsx

```diff
--- antes/src\pages\event\Suppliers.jsx
+++ depois/src\pages\event\Suppliers.jsx
@@ -2,7 +2,7 @@
 import { useEvent } from '@/context/EventContext';
 import { supplierSummary } from '@/lib/selectors';
 import { formatBRL, formatDateShort } from '@/lib/format';
-import { SectionLabel, StatusPill } from '@/components/common/Primitives';
+import { StatusPill } from '@/components/common/Primitives';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Check, Info } from 'lucide-react';

```

## src\pages\event\Tasks.jsx

```diff
--- antes/src\pages\event\Tasks.jsx
+++ depois/src\pages\event\Tasks.jsx
@@ -2,7 +2,7 @@
 import { useEvent } from '@/context/EventContext';
 import { taskSummary } from '@/lib/selectors';
 import { daysUntil, formatDateShort } from '@/lib/format';
-import { StatusPill, EmptyState } from '@/components/common/Primitives';
+import { EmptyState } from '@/components/common/Primitives';
 import { Input } from '@/components/ui/input';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { cn } from '@/lib/utils';

```

## src\components\layout\AddMenu.jsx

```diff
--- antes/src\components\layout\AddMenu.jsx
+++ depois/src\components\layout\AddMenu.jsx
@@ -5,7 +5,6 @@
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
-import { Textarea } from '@/components/ui/textarea';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
 import { Plus, User, ListChecks, Wallet, Ticket, Truck, CalendarDays, Sparkles } from 'lucide-react';

```

## src\components\layout\AppLayout.jsx

```diff
--- antes/src\components\layout\AppLayout.jsx
+++ depois/src\components\layout\AppLayout.jsx
@@ -1,6 +1,6 @@
 import React, { useState } from 'react';
 import { Outlet, useParams } from 'react-router-dom';
-import Sidebar, { SidebarContent } from './Sidebar';
+import { SidebarContent } from './Sidebar';
 import TopBar from './TopBar';
 import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
 import { useEvent } from '@/context/EventContext';

```

## src\components\layout\TopBar.jsx

```diff
--- antes/src\components\layout\TopBar.jsx
+++ depois/src\components\layout\TopBar.jsx
@@ -1,8 +1,8 @@
 import React, { useState } from 'react';
 import { useNavigate, useLocation } from 'react-router-dom';
 import { useEvent } from '@/context/EventContext';
-import { formatDateFull, daysUntil } from '@/lib/format';
-import { Search, Bell, Plus } from 'lucide-react';
+import { formatDateFull } from '@/lib/format';
+import { Search, Bell } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { StatusPill } from '@/components/common/Primitives';

```

## src\components\networking\browser.test.mjs

```diff
--- antes/src\components\networking\browser.test.mjs
+++ depois/src\components\networking\browser.test.mjs
@@ -0,0 +1,188 @@
+import assert from 'node:assert/strict';
+import { createRequire } from 'node:module';
+import process from 'node:process';
+import { mkdirSync, writeFileSync } from 'node:fs';
+import { fixture } from './model.test.mjs';
+import { networkingInput, generateNetworking, occupants } from './model.js';
+
+const require = createRequire(`${process.env.MCT_PLAYWRIGHT_ROOT}/test.cjs`);
+const { chromium } = require('playwright');
+const output = process.env.MCT_EVIDENCE_DIR;
+mkdirSync(output, { recursive: true });
+const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
+const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
+const page = await context.newPage();
+const errors = [];
+page.on('pageerror', e => errors.push(e.message));
+page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
+await context.route(url => url.pathname.startsWith('/api/'), route => {
+  const url = route.request().url();
+  const body = url.includes('public-settings') ? { id: 'mct-local-verification', public_settings: {} } : url.endsWith('/User/me') ? { id: 'local-review-user', full_name: 'Revisor local', email: 'review@example.test', role: 'admin' } : {};
+  return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
+});
+const checks = [];
+function pass(name) { checks.push(name); console.log(`PASS ${name}`); }
+async function load(event) {
+  await page.goto('http://127.0.0.1:5173/login');
+  await page.waitForLoadState('networkidle');
+  await page.evaluate(async event => {
+    const { demoEvent } = await import('/src/lib/demoData.js');
+    localStorage.setItem('base44_access_token', 'local-fixture-only');
+    localStorage.setItem('mesacerta_v1', JSON.stringify({ events: [{ ...demoEvent, ...event }], currentEventId: event.id }));
+  }, event);
+  await page.goto(`http://127.0.0.1:5173/event/${event.id}/networking`);
+  await page.getByRole('heading', { name: 'Networking', exact: true }).waitFor();
+}
+try {
+  const event = fixture();
+  await load(event);
+  assert.equal(await page.locator('vite-error-overlay').count(), 0);
+  pass('Servidor: tela completa, sem overlay Vite');
+  assert.ok((await page.getByRole('region', { name: 'Validação antes da geração' }).innerText()).includes('mesa sem anfitrião fixo'));
+  assert.equal(await page.getByTestId('table-plan').count(), 0);
+  pass('MCT-33.3 aviso sem fixo antes de gerar');
+  await page.getByRole('button', { name: 'Gerar distribuição', exact: true }).click();
+  await page.getByTestId('table-plan').first().waitFor();
+  const expected = generateNetworking(networkingInput(event));
+  for (let r = 0; r < 14; r++) {
+    await page.getByLabel('Rodada exibida').selectOption(String(r + 1));
+    for (let t = 0; t < 14; t++) {
+      const ids = await page.getByTestId('table-plan').nth(t).locator('[data-occupied="true"]').evaluateAll(nodes => nodes.map(node => node.getAttribute('data-person-id')));
+      assert.deepEqual(ids, occupants(expected, r, t).map(o => o.person.id));
+    }
+    assert.equal(await page.locator(`[data-testid="table-plan"][data-round="${r + 1}"]`).count(), 14);
+  }
+  pass('MCT-19.2 / MCT-32.3 todas as 196 mesas/rodadas pela UI identicas ao motor');
+  await page.getByLabel('Rodada exibida').selectOption('1');
+  await page.getByRole('heading', { name: 'Planta da rodada 1' }).scrollIntoViewIfNeeded();
+  await page.screenshot({ path: `${output}/networking-desktop.png` });
+  const chair = page.locator('[data-occupied="true"]').first();
+  const chairId = await chair.getAttribute('data-person-id');
+  assert.ok((await chair.getAttribute('aria-label')).includes(event.participants.find(p => p.id === chairId).name));
+  await chair.click();
+  const dialog = page.getByRole('dialog');
+  await dialog.waitFor();
+  for (const text of ['Empresa', 'Papel', 'Mesa atual', 'Próxima mesa']) assert.ok((await dialog.innerText()).includes(text));
+  await dialog.getByRole('button', { name: 'Fechar' }).click();
+  pass('MCT-19.4 / MCT-32.6 cadeira exibe nome cadastrado e abre empresa/papel/mesa atual/proxima');
+  await page.getByRole('button', { name: 'Abrir Mesa 1', exact: true }).click();
+  assert.ok((await page.getByRole('dialog').innerText()).includes('Capacidade: 7'));
+  await page.getByRole('dialog').getByRole('button', { name: 'Fechar' }).click();
+  pass('PRD51.13 centro abre dados da mesa');
+  await page.getByLabel('Buscar rota', { exact: true }).fill('GC-1');
+  const route = page.getByTestId('person-route').filter({ hasText: 'GC-1 ·' }).first();
+  await route.locator('summary').click();
+  const steps = await route.getByTestId('route-step').allTextContents();
+  assert.equal(steps.length, 14); assert.equal(new Set(steps.map(s => s.split('Mesa ')[1])).size, 14);
+  steps.forEach((step, i) => assert.ok(step.startsWith(`Rodada ${i + 1}`)));
+  pass('MCT-19.3 / MCT-33.1 rota na UI 14 rodadas em ordem / 14 mesas distintas');
+  await page.getByLabel('Buscar rota', { exact: true }).fill('Bruno Barbosa');
+  assert.equal(await page.getByTestId('person-route').count(), 1);
+  pass('MCT-33 busca por nome e codigo');
+  await page.getByLabel('Buscar rota', { exact: true }).fill('');
+  await page.getByLabel('Somente com conflito').check();
+  assert.ok(await page.getByTestId('person-route').count() > 0);
+  pass('MCT-33 filtro somente com conflito funciona');
+  const downloadPromise = page.waitForEvent('download');
+  await page.getByRole('button', { name: 'Exportar PDF' }).click();
+  const download = await downloadPromise; await download.saveAs(`${output}/ui-routes-76.pdf`);
+  pass('MCT-33.5 PDF baixado pelo botao da tela');
+  await page.setViewportSize({ width: 375, height: 812 });
+  await page.getByRole('heading', { name: 'Planta da rodada 1' }).scrollIntoViewIfNeeded();
+  const geometry = await page.getByTestId('table-plan').evaluateAll(nodes => nodes.map(n => ({ x: n.getBoundingClientRect().x, y: n.getBoundingClientRect().y, width: n.getBoundingClientRect().width })));
+  assert.ok(geometry.every(box => Math.abs(box.x - geometry[0].x) < 1));
+  assert.ok(geometry.slice(1).every((box, i) => box.y > geometry[i].y));
+  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
+  await page.screenshot({ path: `${output}/networking-mobile-375.png` });
+  pass('MCT-32.5 viewport375 uma mesa espacial por linha / sem scroll horizontal');
+  await page.setViewportSize({ width: 820, height: 1000 });
+  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
+  pass('PRD51.14 tablet sem scroll horizontal');
+  const fixed = fixture(8, 2, 2, 6);
+  fixed.networking.participantSettings = { 'guest-1': { role: 'fixed', tableId: 'table-1' }, 'guest-2': { role: 'fixed', tableId: 'table-2' } };
+  await load(fixed);
+  await page.getByRole('button', { name: 'Gerar distribuição', exact: true }).click();
+  await page.getByTestId('table-plan').first().waitFor();
+  const first = page.getByTestId('table-plan').first();
+  assert.equal(await first.getByTestId('chair').count(), 6);
+  assert.equal(await first.locator('[data-occupied="true"]').count(), 4);
+  assert.equal(await first.locator('[data-occupied="false"]').count(), 2);
+  assert.ok((await first.locator('[data-fixed="true"]').innerText()).includes('Fixo'));
+  await first.screenshot({ path: `${output}/table-4-of-6.png` });
+  pass('MCT-32.1/.2 seis cadeiras / quatro ocupadas / duas vazias / fixo com simbolo e texto');
+  await page.locator('summary').filter({ hasText: 'Editar nomes' }).click();
+  await page.getByLabel('Nome da mesa 1', { exact: true }).fill('Mesa Alfa');
+  await page.getByLabel('Capacidade da mesa 2', { exact: true }).fill('8');
+  assert.equal(await page.getByTestId('table-plan').count(), 0);
+  await page.getByRole('button', { name: 'Gerar distribuição', exact: true }).click();
+  await page.getByTestId('table-plan').first().waitFor();
+  assert.equal(await page.getByTestId('table-plan').nth(1).getByTestId('chair').count(), 8);
+  assert.ok((await page.getByTestId('table-plan').first().innerText()).includes('Mesa Alfa'));
+  pass('PRD51.1/.2 capacidade individual/nome editados e previa antiga invalidada');
+  const host = fixture(12, 3, 3, 6);
+  host.networking.participantSettings = { 'guest-1': { role: 'host', tableId: 'table-1' } };
+  await load(host);
+  assert.ok((await page.getByRole('region', { name: 'Validação antes da geração' }).innerText()).includes('no máximo 2 rodadas'));
+  pass('MCT-33.4 aviso R>=T inevitavel e T-1 visivel antes da geracao');
+  await page.getByRole('button', { name: 'Gerar distribuição', exact: true }).click();
+  await page.getByTestId('table-plan').first().waitFor();
+  let homeSeen = false;
+  for (let r = 1; r <= 3; r++) {
+    await page.getByLabel('Rodada exibida').selectOption(String(r));
+    const hostChair = page.locator('[data-testid="chair"][data-person-id="guest-1"]');
+    assert.ok((await hostChair.innerText()).includes('Anfitrião rotativo'));
+    homeSeen ||= (await hostChair.getAttribute('aria-label')).includes('Mesa da própria empresa');
+  }
+  assert.ok(homeSeen);
+  pass('PRD51 estados de anfitriao rotativo e propria mesa visiveis');
+  await load(fixture(12, 3, 5, 6));
+  await page.getByRole('button', { name: 'Gerar distribuição', exact: true }).click();
+  await page.getByTestId('table-plan').first().waitFor();
+  await page.getByLabel('Rodada exibida').selectOption('5');
+  assert.ok((await page.locator('[data-testid="chair"][aria-label*="Retorno à mesa"]').count()) > 0);
+  pass('PRD51 retorno a mesa identificado no desenho');
+  const same = await page.getByTestId('pair-conflict').evaluateAll(nodes => nodes.map(n => n.dataset.same));
+  assert.ok(same.includes('true')); assert.ok(same.slice(same.indexOf('false')).every(value => value === 'false'));
+  pass('MCT-33.2 pares na tela ordenados mesma-mesa primeiro');
+  await load(fixture(1));
+  assert.equal(await page.getByRole('button', { name: 'Gerar distribuição', exact: true }).isDisabled(), true);
+  assert.ok((await page.getByRole('region', { name: 'Validação antes da geração' }).innerText()).includes('pelo menos 2 pessoas'));
+  pass('MCT-33.6 UI bloqueia menos de duas pessoas');
+  await page.goto('http://127.0.0.1:5173/login');
+  await page.evaluate(async () => { const { mountTable } = await import('/src/components/networking/verification.jsx'); mountTable({ capacity: 6, count: 8 }); });
+  await page.getByTestId('table-plan').waitFor();
+  assert.equal(await page.getByTestId('chair').count(), 6);
+  assert.ok((await page.getByTestId('table-plan').innerText()).includes('Capacidade excedida em 2'));
+  await page.getByTestId('table-plan').screenshot({ path: `${output}/table-overflow-8-of-6.png` });
+  pass('MCT-32.4 componente real com8/cap6 indica excedente2 / seis cadeiras');
+  for (const capacity of [2, 30]) {
+    await page.evaluate(async capacity => { const { mountTable } = await import('/src/components/networking/verification.jsx'); mountTable({ capacity, count: 1 }); }, capacity);
+    await page.waitForFunction(capacity => document.querySelectorAll('[data-testid="chair"]').length === capacity, capacity);
+    const geometry = await page.getByTestId('table-plan').evaluate(node => {
+      const center = node.querySelector('button[aria-label^="Abrir"]').getBoundingClientRect();
+      return [...node.querySelectorAll('[data-testid="chair"]')].map(chair => {
+        const box = chair.getBoundingClientRect();
+        return { outside: box.right <= center.left || box.left >= center.right || box.bottom <= center.top || box.top >= center.bottom, left: box.left, right: box.right };
+      });
+    });
+    assert.ok(geometry.every(chair => chair.outside && chair.left >= 0 && chair.right <= 820));
+  }
+  pass('Review: limites2/30 cadeiras todas no perimetro / sem sobrepor centro');
+  const findings = await page.evaluate(async () => {
+    const { expenseTotal, financialSummary, scheduleSummary, capacitySummary, alerts } = await import('/src/lib/selectors.js');
+    const expense = { type: 'percent', unitValue: 10, qty: 1 };
+    const event = { expectedAudience: 100, expenses: [expense], revenues: [{ expected: 1000 }], modules: { networking: true }, schedule: [{ id: 'a', start: '09:00', duration: 30 }, { id: 'b', start: '11:00', duration: 30 }], capacity: 100, confirmed: 0, participants: [{ status: 'Confirmado' }] };
+    return { percentExpense: financialSummary(event).despesasPrevistas, zeroQuantity: expenseTotal({ type: 'fixed', unitValue: 25, qty: 0 }), secondComputedStart: scheduleSummary(event).computed[1].computedStart, reserved: capacitySummary(event).reserved, networkingAlert: alerts(event).find(a => a.to === 'networking').title };
+  });
+  assert.equal(findings.percentExpense, 10); assert.equal(findings.zeroQuantity, 25); assert.equal(findings.secondComputedStart, '09:30'); assert.equal(findings.reserved, 0);
+  console.log('MCT-1 achados reproduzidos:', JSON.stringify(findings));
+  assert.deepEqual(errors, []);
+  pass('Navegacao e fluxos: zero erros JS/console (APIs isoladas por mock de teste)');
+  writeFileSync(`${output}/browser-result.json`, JSON.stringify({ checks, errors, environment: 'Edge headless / auth API mocked / named fixtures' }, null, 2));
+  console.log(`${checks.length}/${checks.length} verificacoes de navegador PASS`);
+} catch (error) {
+  console.log('BROWSER FAILURE', error.message, 'errors=', errors, 'url=', page.url());
+  console.log((await page.locator('body').innerText()).slice(0, 3000));
+  await page.screenshot({ path: `${output}/browser-failure.png` });
+  throw error;
+} finally { await browser.close(); }

```

## src\components\networking\export.js

```diff
--- antes/src\components\networking\export.js
+++ depois/src\components\networking\export.js
@@ -0,0 +1,66 @@
+import { jsPDF } from 'jspdf';
+import { personRoute, roles } from './model.js';
+
+export function routesPdf(result, eventName) {
+  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
+  const margin = 12, columnWidth = 89, bottom = 280;
+  let column = 0, y = 25;
+  const header = () => {
+    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(12);
+    pdf.text('Mesa Certa | Roteiros de networking', margin, 12);
+    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9);
+    pdf.text(pdf.splitTextToSize(String(eventName), 185)[0], margin, 18);
+  };
+  header();
+  const advance = () => {
+    if (column === 0) column = 1;
+    else { pdf.addPage(); header(); column = 0; }
+    y = 25;
+  };
+  const wrap = (value, bold = false) => {
+    pdf.setFont('helvetica', bold ? 'bold' : 'normal'); pdf.setFontSize(9);
+    return pdf.splitTextToSize(String(value), columnWidth).map(text => ({ text, bold }));
+  };
+  const print = row => {
+    pdf.setFont('helvetica', row.bold ? 'bold' : 'normal'); pdf.setFontSize(9);
+    pdf.text(row.text, margin + column * 97, y); y += 4.5;
+  };
+  for (const person of [...result.input.mobile, ...result.input.fixed]) {
+    const rows = [...wrap(`${person.name} | ${person.code}`, true), ...wrap(`${person.company || 'Empresa não informada'} | ${roles[person.role]}`)];
+    for (const step of personRoute(result, person)) {
+      rows.push(...wrap(`Rodada ${step.rodada} - ${result.input.tables[step.mesa - 1].name}`));
+    }
+    const size = rows.length * 4.5 + 6;
+    if ((size <= bottom - 25 && y + size > bottom) || y + 22 > bottom) advance();
+    for (const row of rows) {
+      if (y + 4.5 > bottom) {
+        advance();
+        const continuation = wrap(`Continuação | ${person.code}`, true);
+        // Keep the code bounded in the continuation header; full code/name remain in the first block.
+        print(continuation[0]);
+        print(wrap(person.name, true)[0]);
+        y += 2;
+      }
+      print(row);
+    }
+    y += 6;
+  }
+  const count = pdf.getNumberOfPages();
+  for (let page = 1; page <= count; page++) {
+    pdf.setPage(page); pdf.setFontSize(8);
+    pdf.text(`Página ${page} de ${count} | ${result.input.engine.R} rodadas | seed ${result.seed}`, margin, 291);
+  }
+  return pdf;
+}
+
+export function routesCsv(result) {
+  const cell = value => {
+    const text = String(value ?? '');
+    return `"${(/^[=+@\-\t\r]/.test(text) ? "'" : '') + text.replaceAll('"', '""')}"`;
+  };
+  const lines = [['Nome', 'Código', 'Empresa', 'Papel', 'Rodada', 'Mesa']];
+  for (const person of [...result.input.mobile, ...result.input.fixed]) {
+    for (const route of personRoute(result, person)) lines.push([person.name, person.code, person.company, roles[person.role], route.rodada, result.input.tables[route.mesa - 1].name]);
+  }
+  return '\uFEFF' + lines.map(row => row.map(cell).join(';')).join('\r\n');
+}

```

## src\components\networking\model.js

```diff
--- antes/src\components\networking\model.js
+++ depois/src\components\networking\model.js
@@ -0,0 +1,109 @@
+import { gerarDistribuicao, rotaDoParticipante } from '../../lib/networking/engine.js';
+
+export const roles = { rotating: 'Participante', fixed: 'Anfitrião fixo', host: 'Anfitrião rotativo', out: 'Fora das rodadas' };
+const normalize = value => String(value || '').trim().toLocaleLowerCase('pt-BR');
+const validInteger = (n, min, max) => Number.isInteger(n) && n >= min && n <= max;
+
+export function networkingInput(event) {
+  const cfg = event.networking || {};
+  const count = validInteger(cfg.tables, 2, 40) ? cfg.tables : 0;
+  const tables = Array.from({ length: count }, (_, i) => ({
+    id: `table-${i + 1}`, name: `Mesa ${i + 1}`, company: '', capacity: cfg.capacityPerTable ?? 7,
+    ...cfg.tableList?.[i],
+  }));
+  const people = (event.participants || []).map(person => ({
+    ...person,
+    code: person.code || person.id,
+    role: person.status === 'Cancelado' ? 'out' : 'rotating',
+    tableId: '',
+    ...cfg.participantSettings?.[person.id],
+  }));
+  const mobile = people.filter(p => p.role === 'rotating' || p.role === 'host');
+  const fixed = people.filter(p => p.role === 'fixed');
+  const errors = [];
+  const warnings = [];
+  if (!validInteger(cfg.tables, 2, 40)) errors.push('Configure de 2 a 40 mesas.');
+  if (!validInteger(cfg.rounds, 1, 60)) errors.push('Configure de 1 a 60 rodadas.');
+  if (!validInteger(cfg.seedBase ?? 1, 1, 2147483647)) errors.push('A seed deve ser um inteiro positivo.');
+  if (mobile.length < 2) errors.push('É necessário ter pelo menos 2 pessoas rodando para gerar.');
+  if (mobile.length > 400) errors.push('O limite é de 400 pessoas rodando.');
+  if (new Set(people.map(p => p.id)).size !== people.length) errors.push('Há identificadores de pessoas repetidos; revise o cadastro.');
+  const included = people.filter(p => p.role !== 'out');
+  for (const person of included) {
+    if (!String(person.id ?? '').trim()) errors.push(`${person.name || 'Pessoa'}: identificador ausente no cadastro.`);
+    if (!normalize(person.name)) errors.push(`A pessoa ${person.code} está sem nome.`);
+    if (!roles[person.role]) errors.push(`Papel inválido para ${person.name}.`);
+    if (['fixed', 'host'].includes(person.role) && !tables.some(t => t.id === person.tableId)) {
+      errors.push(`${person.name}: escolha a mesa ${person.role === 'fixed' ? 'do anfitrião fixo' : 'da própria empresa'}.`);
+    }
+  }
+  const seen = new Set();
+  for (const person of included) {
+    const name = normalize(person.name);
+    if (seen.has(name)) warnings.push(`Nome repetido: ${person.name}. Confira se são pessoas diferentes.`);
+    seen.add(name);
+  }
+  if (new Set(tables.map(t => t.id)).size !== tables.length) errors.push('Há identificadores de mesas repetidos.');
+  tables.forEach(table => {
+    if (!String(table.id ?? '').trim()) errors.push('Toda mesa precisa de um identificador.');
+    if (!validInteger(table.capacity, 2, 30)) errors.push(`${table.name}: capacidade deve ser um inteiro de 2 a 30.`);
+    if (!normalize(table.name)) errors.push('Toda mesa precisa de um nome.');
+    if (!fixed.some(p => p.tableId === table.id)) warnings.push(`${table.name}: mesa sem anfitrião fixo.`);
+  });
+  const cap = tables.length ? Math.min(...tables.map(t => t.capacity)) : 0;
+  const fixosPorMesa = tables.map(t => fixed.filter(p => p.tableId === t.id).length);
+  if (tables.length && mobile.length + fixed.length > cap * tables.length) {
+    errors.push(`Faltam lugares para ${mobile.length + fixed.length} pessoas. A distribuição usa a menor capacidade (${cap}) em todas as mesas; aumente-a ou adicione mesas.`);
+  }
+  if (fixosPorMesa.some(n => n > cap)) errors.push('Uma mesa tem mais anfitriões fixos que a menor capacidade configurada.');
+  if (new Set(tables.map(t => t.capacity)).size > 1) warnings.push(`Capacidades diferentes: a distribuição usa ${cap} lugares por mesa para garantir o limite de todas; os lugares adicionais continuam visíveis.`);
+  if (cfg.rounds > tables.length && tables.length) warnings.push('Há mais rodadas que mesas: participantes precisarão repetir mesas. Reduza as rodadas para evitar retornos.');
+  if (mobile.some(p => p.role === 'host') && cfg.rounds >= tables.length && tables.length) {
+    warnings.push(`Com ${cfg.rounds} rodadas e ${tables.length} mesas, a passagem do anfitrião rotativo pela mesa da própria empresa é matematicamente inevitável em um percurso sem repetir mesas. Use no máximo ${tables.length - 1} rodadas para evitá-la.`);
+  }
+  return {
+    tables, people, mobile, fixed, errors, warnings,
+    engine: { P: mobile.length, T: tables.length, R: cfg.rounds, cap, fixosPorMesa,
+      mesaDaCasa: mobile.map(p => p.role === 'host' ? tables.findIndex(t => t.id === p.tableId) : null), seedBase: cfg.seedBase ?? 1 },
+  };
+}
+
+export function generateNetworking(input) {
+  if (input.errors.length) throw new Error(input.errors.join('\n'));
+  const result = { ...gerarDistribuicao(input.engine), input };
+  // Validate the engine output; never silently change its assignment.
+  for (let r = 0; r < input.engine.R; r++) {
+    for (let t = 0; t < input.tables.length; t++) {
+      if (occupants(result, r, t).length > input.tables[t].capacity) {
+        throw new Error(`A grade excedeu a capacidade de ${input.tables[t].name} na rodada ${r + 1}. Revise capacidade, anfitriões e rodadas.`);
+      }
+    }
+  }
+  return result;
+}
+
+export function personRoute(result, person) {
+  if (person.role === 'fixed') {
+    const mesa = result.input.tables.findIndex(t => t.id === person.tableId) + 1;
+    return Array.from({ length: result.input.engine.R }, (_, i) => ({ rodada: i + 1, mesa }));
+  }
+  const index = result.input.mobile.findIndex(p => p.id === person.id);
+  return index < 0 ? [] : rotaDoParticipante(result.tab, index);
+}
+
+export function occupants(result, round, table) {
+  const { input, analise } = result;
+  const fixed = input.fixed.filter(p => p.tableId === input.tables[table].id).map(person => ({ person, fixed: true, home: false, returning: false, conflict: false }));
+  const mobile = analise.at[round][table].map(index => ({
+    person: input.mobile[index], fixed: false,
+    home: input.engine.mesaDaCasa[index] === table,
+    returning: analise.visitNo[index][round] > 1,
+    conflict: analise.pairs.some(pair => pair.same && (pair.a === index || pair.b === index) && pair.ev.some(([r, t]) => r === round && t === table)),
+  }));
+  return [...fixed, ...mobile];
+}
+
+export function routeHasConflict(result, person) {
+  const i = result.input.mobile.findIndex(p => p.id === person.id);
+  return i >= 0 && (result.analise.person[i].again.length > 0 || result.analise.repByPart[i].reps.length > 0 || result.tab[i].includes(result.input.engine.mesaDaCasa[i]));
+}

```

## src\components\networking\model.test.mjs

```diff
--- antes/src\components\networking\model.test.mjs
+++ depois/src\components\networking\model.test.mjs
@@ -0,0 +1,99 @@
+import assert from 'node:assert/strict';
+import { createHash } from 'node:crypto';
+import { networkingInput, generateNetworking, personRoute, occupants, routeHasConflict } from './model.js';
+import { gerarDistribuicao } from '../../lib/networking/engine.js';
+import { routesCsv, routesPdf } from './export.js';
+import { writeFileSync } from 'node:fs';
+import process from 'node:process';
+import { Buffer } from 'node:buffer';
+
+const names = ['Ana', 'Bruno', 'Carla', 'Daniel', 'Elisa', 'Fabio', 'Gabriela', 'Hugo', 'Isabela', 'Joao', 'Karen', 'Lucas', 'Marina', 'Nicolas', 'Olivia', 'Paulo', 'Raquel', 'Sergio', 'Tatiana'];
+const surnames = ['Almeida', 'Barbosa', 'Costa', 'Dias'];
+export function fixture(count = 76, tables = 14, rounds = 14, capacity = 7) {
+  return { id: 'verification', name: 'Get Connected | verificacao 76/14/14/7', participants: Array.from({ length: count }, (_, i) => ({ id: `guest-${i + 1}`, code: `GC-${i + 1}`, name: `${names[i % names.length]} ${surnames[Math.floor(i / names.length) % surnames.length]}`, company: `Consultoria ${surnames[i % surnames.length]}`, status: 'Confirmado' })), networking: { tables, rounds, capacityPerTable: capacity, seedBase: 1 } };
+}
+
+if (process.argv[1]?.endsWith('model.test.mjs')) {
+  let total = 0;
+  const check = (name, fn) => { fn(); total++; console.log(`PASS ${name}`); };
+  const event = fixture();
+  const input = networkingInput(event);
+  const result = generateNetworking(input);
+  check('MCT-19.2 adaptador identico ao oraculo 76/14/14/7 seed1', () => assert.deepEqual(result.tab, gerarDistribuicao({ P: 76, T: 14, R: 14, cap: 7, seedBase: 1 }).tab));
+  console.log(`SHA256 grade=${createHash('sha256').update(JSON.stringify(result.tab)).digest('hex')}`);
+  check('MCT-19.3 / MCT-33.1 todas as 76 rotas em ordem e 14 mesas distintas', () => {
+    input.mobile.forEach(person => {
+      const route = personRoute(result, person);
+      assert.equal(route.length, 14); assert.equal(new Set(route.map(s => s.mesa)).size, 14);
+      assert.deepEqual(route.map(s => s.rodada), Array.from({ length: 14 }, (_, i) => i + 1));
+    });
+  });
+  check('MCT-19.4 nomes preservados, nenhum participante sintetizado no adaptador', () => assert.deepEqual(input.mobile.map(p => p.name), event.participants.map(p => p.name)));
+  check('MCT-33.3 avisos de mesa sem fixo existem antes da geracao', () => assert.equal(input.warnings.filter(s => s.includes('sem anfitrião fixo')).length, 14));
+  const fixedEvent = fixture(8, 2, 2, 6);
+  fixedEvent.networking.participantSettings = { 'guest-1': { role: 'fixed', tableId: 'table-1' }, 'guest-2': { role: 'fixed', tableId: 'table-2' } };
+  const fixedInput = networkingInput(fixedEvent), fixedResult = generateNetworking(fixedInput);
+  check('Fixos excluidos de P, incluidos nas cadeiras e rotas', () => {
+    assert.equal(fixedInput.engine.P, 6); assert.equal(fixedResult.tab.length, 6); assert.deepEqual(fixedInput.engine.fixosPorMesa, [1, 1]);
+    assert.equal(occupants(fixedResult, 0, 0).length, 4);
+    assert.deepEqual(personRoute(fixedResult, fixedInput.fixed[0]).map(s => s.mesa), [1, 1]);
+  });
+  const host = fixture(12, 3, 3, 6);
+  host.networking.participantSettings = { 'guest-1': { role: 'host', tableId: 'table-1' } };
+  check('MCT-33.4 R>=T explica inevitavel e sugere T-1', () => assert.ok(networkingInput(host).warnings.some(s => s.includes('matematicamente inevitável') && s.includes('no máximo 2 rodadas'))));
+  check('MCT-33.6 menos de 2 rotativos bloqueado', () => assert.throws(() => generateNetworking(networkingInput(fixture(1))), /pelo menos 2 pessoas/));
+  const invalid = fixture(4, 2, 2, 6);
+  invalid.participants[1].name = invalid.participants[0].name;
+  invalid.networking.participantSettings = { 'guest-1': { role: 'fixed' } };
+  check('Cadastro: fixo sem mesa bloqueia, nome duplicado avisa', () => {
+    const data = networkingInput(invalid);
+    assert.ok(data.errors.some(s => s.includes('anfitrião fixo'))); assert.ok(data.warnings.some(s => s.includes('Nome repetido')));
+  });
+  const repeats = generateNetworking(networkingInput(fixture(12, 3, 5, 6)));
+  check('MCT-33.2 analise original ordenada mesma mesa primeiro / mais encontros', () => {
+    assert.ok(repeats.analise.pairs.some(p => p.same));
+    repeats.analise.pairs.slice(1).forEach((p, i) => {
+      const before = repeats.analise.pairs[i];
+      assert.ok(Number(before.same) >= Number(p.same));
+      if (before.same === p.same) assert.ok(before.ev.length >= p.ev.length);
+    });
+    assert.ok(repeats.input.mobile.some(p => routeHasConflict(repeats, p)));
+  });
+  check('Limites: capacidades/rodadas invalidas bloqueadas sem executar motor', () => {
+    assert.throws(() => generateNetworking(networkingInput(fixture(10, 2, 0, 6))), /rodadas/);
+    assert.throws(() => generateNetworking(networkingInput(fixture(10, 2, 2, 2))), /Faltam lugares/);
+  });
+  check('Review: identificador ausente bloqueado', () => {
+    const noId = fixture(4, 2, 2, 6); delete noId.participants[0].id;
+    assert.throws(() => generateNetworking(networkingInput(noId)), /identificador ausente/);
+  });
+  check('Capacidade individual preservada e limite conservador explicito', () => {
+    const different = fixture(6, 2, 2, 6);
+    different.networking.tableList = [{ capacity: 4 }, { capacity: 6 }];
+    const data = networkingInput(different); assert.equal(data.engine.cap, 4); assert.deepEqual(data.tables.map(t => t.capacity), [4, 6]);
+    assert.ok(data.warnings.some(s => s.includes('Capacidades diferentes')));
+    const distribution = generateNetworking(data);
+    for (let r = 0; r < 2; r++) for (let t = 0; t < 2; t++) assert.ok(occupants(distribution, r, t).length <= data.tables[t].capacity);
+  });
+  check('MCT-33.5 CSV inclui pessoas/fixos e rodadas; protege formula', () => {
+    const csv = routesCsv(fixedResult); assert.equal(csv.trim().split('\r\n').length, 17);
+    fixedInput.fixed[0].name = '=2+2'; assert.ok(routesCsv(fixedResult).includes("\"'=2+2\""));
+  });
+  check('MCT-33.5 PDF de 76 pessoas x 14 rodadas e PDF com fixos gerados', () => {
+    const out = process.env.MCT_EVIDENCE_DIR;
+    if (out) {
+      writeFileSync(`${out}/routes-76.pdf`, Buffer.from(routesPdf(result, event.name).output('arraybuffer')));
+      writeFileSync(`${out}/routes-fixed.pdf`, Buffer.from(routesPdf(fixedResult, fixedEvent.name).output('arraybuffer')));
+    }
+    assert.ok(routesPdf(result, event.name).getNumberOfPages() > 1);
+  });
+  check('Review: PDF 60 rodadas e nomes/empresas extensos com continuacao', () => {
+    const long = fixture(2, 2, 60, 6);
+    long.participants.forEach(p => { p.name += ' de Albuquerque '.repeat(12); p.company += ' Tecnologia e Consultoria '.repeat(12); });
+    const distribution = generateNetworking(networkingInput(long));
+    const document = routesPdf(distribution, long.name);
+    assert.ok(document.getNumberOfPages() > 1);
+    if (process.env.MCT_EVIDENCE_DIR) writeFileSync(`${process.env.MCT_EVIDENCE_DIR}/routes-long-60.pdf`, Buffer.from(document.output('arraybuffer')));
+  });
+  console.log(`${total}/${total} verificacoes PASS (fixture de teste com nomes, nao lista real de convidados).`);
+}

```

## src\components\networking\pdf.test.py

```diff
--- antes/src\components\networking\pdf.test.py
+++ depois/src\components\networking\pdf.test.py
@@ -0,0 +1,26 @@
+"""Inspect actual PDF downloads/outputs; requires pypdf and an evidence directory."""
+import re
+import sys
+from pathlib import Path
+from pypdf import PdfReader
+
+root = Path(sys.argv[1])
+for filename, expected in [('ui-routes-76.pdf', 1064), ('routes-fixed.pdf', 16), ('routes-long-60.pdf', 120)]:
+    reader = PdfReader(root / filename)
+    text = '\n'.join(page.extract_text() for page in reader.pages)
+    count = text.count('Rodada ')
+    assert count == expected, (filename, count)
+    assert all(float(page.mediabox.width) > 590 and float(page.mediabox.height) > 840 for page in reader.pages)
+    print(f'PASS PDF {filename}: {len(reader.pages)} paginas A4; {count}/{expected} entradas de rodada; texto extraivel')
+    if filename == 'ui-routes-76.pdf':
+        codes = re.findall(r'\| GC-(\d+)\n', text)
+        assert sorted(map(int, codes)) == list(range(1, 77))
+        blocks = re.split(r'\| GC-\d+\n', text)[1:]
+        for block in blocks:
+            # Every complete participant block retains the ordered journey.
+            rounds = re.findall(r'Rodada (\d+) -', block)
+            assert list(map(int, rounds)) == list(range(1, 15)), rounds
+        print('PASS PDF 76/76 pessoas cadastradas / cada pessoa com rodadas1..14 em ordem')
+    if filename == 'routes-long-60.pdf':
+        assert 'Continua' in text
+        print('PASS PDF longo: continuacao identificada / nenhuma rodada perdida')

```

## src\components\networking\TablePlan.jsx

```diff
--- antes/src\components\networking\TablePlan.jsx
+++ depois/src\components\networking\TablePlan.jsx
@@ -0,0 +1,51 @@
+import React from 'react';
+import { roles } from './model.js';
+
+export default function TablePlan({ table, occupants, round, onPerson, onTable }) {
+  const capacity = table.capacity;
+  const overflow = Math.max(0, occupants.length - capacity);
+  const sideRows = Math.ceil(Math.max(0, capacity - 2) / 2);
+  const height = Math.max(300, sideRows * 58 + 100);
+  const position = index => {
+    if (index === 0) return { left: '50%', top: 24 };
+    if (index === capacity - 1) return { left: '50%', top: height - 24 };
+    const side = (index - 1) % 2;
+    const row = Math.floor((index - 1) / 2);
+    return { left: side ? '85%' : '15%', top: 78 + row * (height - 156) / Math.max(1, sideRows - 1) };
+  };
+  return (
+    <section data-testid="table-plan" data-table-id={table.id} data-round={round}
+      aria-label={`${table.name}, rodada ${round}, ${occupants.length} pessoas, capacidade ${capacity}`}
+      className={`min-w-0 border p-2 ${overflow ? 'border-destructive' : 'border-border'}`}>
+      <div className="flex flex-wrap justify-between gap-1 text-xs px-1 py-2">
+        <strong>{table.name}</strong><span>{occupants.length}/{capacity} lugares</span>
+      </div>
+      {overflow > 0 && <button type="button" onClick={onTable} className="w-full border border-destructive p-2 text-xs font-semibold text-destructive">Capacidade excedida em {overflow} — ver ocupantes</button>}
+      <div className="relative w-full" style={{ height }}>
+        <button type="button" onClick={onTable} aria-label={`Abrir ${table.name}`}
+          className="absolute border-2 border-border bg-muted/20 px-2 text-center text-xs break-words"
+          style={{ left: '34%', width: '32%', top: 68, bottom: 68 }}>
+          <strong className="block">{table.name}</strong>
+          <span className="block mt-2 text-muted-foreground">{table.company || 'Sem empresa vinculada'}</span>
+          <span className="block mt-2 text-[10px]">{occupants.length}/{capacity} lugares</span>
+          <span className="block mt-2 text-[10px]">Rodada {round}</span>
+        </button>
+        {Array.from({ length: capacity }, (_, index) => {
+          const occupant = occupants[index];
+          const state = occupant ? [roles[occupant.person.role], occupant.home && 'Mesa da própria empresa', occupant.returning && 'Retorno à mesa', occupant.conflict && 'Reencontro na mesma mesa'].filter(Boolean).join(' · ') : 'Lugar vazio';
+          return (
+            <button type="button" key={index} data-testid="chair" data-occupied={Boolean(occupant)}
+              data-person-id={occupant?.person.id} data-fixed={Boolean(occupant?.fixed)}
+              disabled={!occupant} onClick={() => occupant && onPerson(occupant.person)}
+              title={occupant ? `${occupant.person.name} | ${occupant.person.company || 'Empresa não informada'} | ${state}` : state}
+              aria-label={occupant ? `${occupant.person.name}, ${state}` : `Lugar ${index + 1} vazio`}
+              className={`absolute h-11 border text-[11px] leading-tight px-1 transition-colors duration-150 motion-reduce:transition-none ${occupant ? 'bg-background hover:border-foreground focus-visible:outline focus-visible:outline-2' : 'border-dashed text-muted-foreground bg-muted/20'} ${occupant?.fixed ? 'border-double border-[3px]' : ''} ${occupant?.conflict ? 'border-destructive' : 'border-border'}`}
+              style={{ ...position(index), width: '28%', maxWidth: 100, transform: 'translate(-50%, -50%)' }}>
+              {occupant ? <><span className="block truncate">{occupant.fixed ? '⚑ ' : occupant.person.role === 'host' ? '◇ ' : ''}{occupant.person.name}</span><span className="block text-[9px] truncate">{occupant.fixed ? 'Fixo' : occupant.person.role === 'host' ? 'Anfitrião rotativo' : 'Participante'}{occupant.home ? ' · Casa' : ''}{occupant.returning ? ' · ↩' : ''}{occupant.conflict ? ' · !' : ''}</span></> : <span>Vazio</span>}
+            </button>
+          );
+        })}
+      </div>
+    </section>
+  );
+}

```

## src\components\networking\verification.jsx

```diff
--- antes/src\components\networking\verification.jsx
+++ depois/src\components\networking\verification.jsx
@@ -0,0 +1,13 @@
+// Test harness imported only by browser.test.mjs; no application route.
+import React from 'react';
+import { createRoot } from 'react-dom/client';
+import TablePlan from './TablePlan';
+
+export function mountTable({ capacity, count }) {
+  const target = document.createElement('main');
+  target.style.cssText = 'max-width:360px;margin:auto;padding:10px';
+  document.body.replaceChildren(target);
+  createRoot(target).render(<TablePlan table={{ id: 'overflow', name: 'Mesa teste', company: 'Almeida', capacity }} round={1}
+    occupants={Array.from({ length: count }, (_, i) => ({ person: { id: `test-${i}`, name: `Pessoa ${i + 1}`, company: 'Almeida', role: i === 0 ? 'fixed' : 'rotating' }, fixed: i === 0 }))}
+    onPerson={() => {}} onTable={() => {}} />);
+}

```
