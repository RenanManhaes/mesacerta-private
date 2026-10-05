import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useEvent } from '@/context/EventContext';
import {
  networkingInput,
  generateNetworking,
  occupants,
  personRoute,
  routeHasConflict,
  roles,
  restoreNetworking,
  networkingSignature,
  encounterSummary,
} from '@/components/networking/model';
import NetworkingPlan from '@/components/networking/NetworkingPlan';
import {
  PageHeader,
  Kpi,
  Panel,
  initials,
} from '@/components/common/ReferenceUI';
import { Button } from '@/components/ui/button';
import {
  Armchair,
  Repeat,
  Handshake,
  ShieldCheck,
  RefreshCw,
  Download,
  Play,
  Pause,
  Settings,
  Search,
} from 'lucide-react';

const field =
  'w-full min-w-0 border border-border bg-background px-2 py-2 text-sm rounded-sm';
const action =
  'border border-border px-3 py-2 text-sm rounded-sm disabled:opacity-50';

function Details({ title, children, onClose }) {
  const dialog = useRef(null);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      aria-label={title}
      className="w-[calc(100%_-_32px)] max-w-lg border border-border bg-background p-5 text-foreground backdrop:bg-black/30"
    >
      <div className="flex justify-between items-start gap-3">
        <h2 className="font-display text-lg">{title}</h2>
        <button className={action} onClick={() => dialog.current?.close()}>
          Fechar
        </button>
      </div>
      <div className="mt-4 space-y-3">{children}</div>
    </dialog>
  );
}

export default function Networking() {
  const { currentEvent: ev, updateCurrent } = useEvent();
  const input = useMemo(() => networkingInput(ev), [ev]);
  const [result, setResult] = useState(null);
  const [round, setRound] = useState(1);
  const [query, setQuery] = useState('');
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const pendingGeneration = useRef(null);
  const analysisPanel = useRef(null);
  const repeatsList = useRef(null);
  const flashTimer = useRef(null);
  const [flashRepeats, setFlashRepeats] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const cfg = ev.networking || {};
  useEffect(() => {
    clearTimeout(pendingGeneration.current);
    setGenerating(false);
    setPlaying(false);
    setResult(restoreNetworking(input, ev.networkingDistribution));
    setSelectedPerson(null);
    setSelectedTable(null);
    setError('');
    return () => clearTimeout(pendingGeneration.current);
  }, [ev.id, ev.participants, ev.networking]);
  const setCfg = (patch) =>
    updateCurrent((event) => ({
      ...event,
      networking: { ...event.networking, ...patch },
    }));
  const setTable = (index, patch) =>
    setCfg({
      tableList: input.tables.map((t, i) =>
        i === index ? { ...t, ...patch } : t,
      ),
    });
  const setPerson = (id, patch) =>
    setCfg({
      participantSettings: {
        ...cfg.participantSettings,
        [id]: { ...cfg.participantSettings?.[id], ...patch },
      },
    });
  const generate = () => {
    setError('');
    if (input.errors.length) {
      setError(input.errors.join(' '));
      return;
    }
    setGenerating(true);
    pendingGeneration.current = setTimeout(() => {
      try {
        const generated = generateNetworking(input);
        setResult(generated);
        setRound(1);
        updateCurrent((e) => ({
          ...e,
          networkingDistribution: {
            signature: networkingSignature(input),
            tab: generated.tab,
            seed: generated.seed,
          },
        }));
      } catch (err) {
        setError(err.message);
      } finally {
        setGenerating(false);
      }
    }, 30);
  };
  const people = result ? [...result.input.mobile, ...result.input.fixed] : [];
  const matches = people.filter((p) =>
    `${p.name} ${p.company || ''}`
      .toLocaleLowerCase('pt-BR')
      .includes(query.toLocaleLowerCase('pt-BR')),
  );
  const activePerson = selectedPerson || matches[0] || people[0];
  useEffect(() => {
    if (!playing || !result) return;
    const timer = setInterval(
      () => setRound((r) => (r >= result.input.engine.R ? 1 : r + 1)),
      1600,
    );
    const visibility = () => {
      if (document.hidden) setPlaying(false);
    };
    document.addEventListener('visibilitychange', visibility);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [playing, result]);
  const meetings = useMemo(() => encounterSummary(result), [result]);
  useEffect(() => () => clearTimeout(flashTimer.current), []);
  // Repetitions indicator -> opens the analysis, scrolls to the list and
  // highlights it for ~1s. With prefers-reduced-motion: jump straight there,
  // no animated scroll and no colour flash (focus marks the destination).
  const goToRepeats = () => {
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (analysisPanel.current) analysisPanel.current.open = true;
    const target = repeatsList.current;
    if (!target) return;
    target.scrollIntoView({
      behavior: reduced ? 'auto' : 'smooth',
      block: 'start',
    });
    target.focus({ preventScroll: true });
    clearTimeout(flashTimer.current);
    if (reduced) {
      setFlashRepeats(false);
      return;
    }
    setFlashRepeats(true);
    flashTimer.current = setTimeout(() => setFlashRepeats(false), 1000);
  };
  const exportRoutes = async (format) => {
    setExporting(true);
    setError('');
    try {
      const { routesPdf, routesCsv } =
        await import('@/components/networking/export');
      if (format === 'pdf')
        routesPdf(result, ev.name).save('roteiros-networking.pdf');
      else {
        const url = URL.createObjectURL(
          new Blob([routesCsv(result)], { type: 'text/csv;charset=utf-8' }),
        );
        const link = document.createElement('a');
        link.href = url;
        link.download = 'roteiros-networking.csv';
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch (err) {
      setError(`Não foi possível exportar: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };
  return (
    <div className="reference-page">
      <PageHeader
        eyebrow="Operação"
        title="Rodadas de negócio"
        subtitle="Distribua os convidados e confira reencontros. Clique em um convidado para ver o roteiro."
        actions={
          <>
            <Button
              variant="outline"
              disabled={generating || input.errors.length > 0}
              onClick={generate}
            >
              <RefreshCw size={16} />
              {generating
                ? 'Gerando…'
                : result
                  ? 'Gerar novamente'
                  : 'Gerar distribuição'}
            </Button>
            <Button
              disabled={!result || exporting}
              onClick={() => exportRoutes('pdf')}
            >
              <Download size={16} />
              Exportar roteiros
            </Button>
          </>
        }
      />
      <div className="platform-kpis">
        <Kpi
          icon={Armchair}
          label="Mesas"
          value={input.tables.length}
          sub={`${input.fixed.length} anfitriões fixos`}
        />
        <Kpi
          icon={Repeat}
          label="Rodadas"
          value={Number(cfg.rounds) || 0}
          sub={
            cfg.roundMinutes
              ? `${cfg.roundMinutes} min cada`
              : 'Duração a definir'
          }
        />
        <Kpi
          icon={Handshake}
          label="Encontros únicos"
          value={result ? meetings.unique : '—'}
          sub={
            result
              ? `média por convidado: ${meetings.average}`
              : 'Gere a distribuição para calcular'
          }
          highlight
        />
        <Kpi
          icon={ShieldCheck}
          label="Repetições"
          value={result ? meetings.repeats : '—'}
          sub={
            result
              ? meetings.repeats
                ? 'Confira a análise abaixo'
                : 'Nenhum encontro repetido'
              : 'Aguardando distribuição'
          }
          onClick={result ? goToRepeats : undefined}
        />
      </div>
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
      {result ? (
        <>
          <div className="reference-toolbar">
            <div className="reference-segments reference-rounds">
              {Array.from({ length: result.input.engine.R }, (_, i) => (
                <button
                  key={i}
                  aria-pressed={round === i + 1}
                  className={round === i + 1 ? 'on' : ''}
                  onClick={() => {
                    setPlaying(false);
                    setRound(i + 1);
                  }}
                >
                  Rodada {i + 1}
                </button>
              ))}
            </div>
            <Button variant="outline" onClick={() => setPlaying((p) => !p)}>
              {playing ? <Pause size={16} /> : <Play size={16} />}{' '}
              {playing ? 'Pausar animação' : 'Animar rodadas'}
            </Button>
          </div>
          <div className="reference-grid-21">
            <NetworkingPlan
              result={result}
              round={round}
              selected={activePerson}
              onPerson={setSelectedPerson}
              onTable={setSelectedTable}
            />
            <Panel
              title="Roteiro do convidado"
              className="reference-route-panel"
            >
              <label className="reference-search">
                <Search size={16} />
                <input
                  aria-label="Buscar convidado"
                  placeholder="Buscar convidado"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedPerson(null);
                  }}
                />
              </label>
              {query && (
                <div className="reference-guest-results">
                  {matches.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedPerson(p);
                        setQuery('');
                      }}
                    >
                      {p.name}
                    </button>
                  ))}
                  {!matches.length && (
                    <small>Nenhum convidado encontrado.</small>
                  )}
                </div>
              )}
              {activePerson && (
                <>
                  <div className="reference-person">
                    <span className="reference-avatar coral">
                      {initials(activePerson.name)}
                    </span>
                    <div>
                      <b>{activePerson.name}</b>
                      <small>
                        {activePerson.company || roles[activePerson.role]}
                      </small>
                    </div>
                  </div>
                  <div className="reference-route-list">
                    {personRoute(result, activePerson).map((step) => {
                      const t = step.mesa - 1,
                        table = result.input.tables[t];
                      const mates = occupants(result, step.rodada - 1, t)
                        .filter((x) => x.person.id !== activePerson.id)
                        .map((x) => x.person.name.split(' ')[0]);
                      return (
                        <button
                          data-testid="route-step"
                          key={step.rodada}
                          className={round === step.rodada ? 'on' : ''}
                          onClick={() => {
                            setPlaying(false);
                            setRound(step.rodada);
                          }}
                        >
                          <small>R{step.rodada}</small>
                          <span>
                            <b>
                              {table.name} · {table.company || 'Sem empresa'}
                            </b>
                            <small>
                              {mates.length
                                ? `com ${mates.slice(0, 3).join(', ')}${mates.length > 3 ? ` e +${mates.length - 3}` : ''}`
                                : 'Sem outros convidados'}
                            </small>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {routeHasConflict(result, activePerson) && (
                    <p className="text-xs text-warning">
                      Há reencontros neste roteiro. Confira as duplas abaixo.
                    </p>
                  )}
                </>
              )}
            </Panel>
          </div>
          <details className="platform-panel" ref={analysisPanel}>
            <summary>Análise de reencontros e exportação</summary>
            <p className="text-sm text-muted-foreground my-3">
              Seed {result.seed} · {result.analise.sameTable} duplas reencontram
              na mesma mesa. Repetições incluem os encontros com anfitriões
              fixos, mas excluem duplas de fixos que permanecem juntas.
            </p>
            <Button
              variant="outline"
              disabled={exporting}
              onClick={() => exportRoutes('csv')}
            >
              Exportar CSV
            </Button>
            <ul
              id="networking-repeats-list"
              ref={repeatsList}
              tabIndex={-1}
              aria-label="Lista de repetições"
              data-testid="repeats-list"
              className={`mt-4 space-y-2 rounded-sm outline-offset-4 ${flashRepeats ? 'reference-repeats-flash' : ''}`}
            >
              {!result.analise.pairs.length && (
                <li className="text-sm text-muted-foreground">
                  Nenhuma dupla repetida.
                </li>
              )}
              {result.analise.pairs.map((pair) => (
                <li key={`${pair.a}-${pair.b}`} className="text-sm">
                  {result.input.mobile[pair.a].name} +{' '}
                  {result.input.mobile[pair.b].name}: {pair.ev.length} encontros
                  {pair.same ? ' · reencontro na mesma mesa' : ''}
                </li>
              ))}
            </ul>
          </details>
        </>
      ) : (
        <div className="reference-grid-21">
          <div className="reference-net-canvas reference-net-empty">
            <Armchair size={32} />
            <h2>Monte as mesas do evento</h2>
            <p>Confira as regras abaixo e clique em Gerar distribuição.</p>
          </div>
          <Panel title="Roteiro do convidado">
            <p className="text-muted-foreground">
              Os roteiros aparecem quando a distribuição estiver pronta.
            </p>
          </Panel>
        </div>
      )}
      <details className="reference-network-settings" open={!result}>
        <summary>
          <Settings size={16} /> Configurar mesas, participantes e regras
        </summary>
        <div className="space-y-4 mt-4">
          <section
            className="platform-panel space-y-3"
            aria-labelledby="rules-heading"
          >
            <h2 id="rules-heading" className="font-medium">
              Mesas e regras
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <label className="text-xs">
                Duração de cada rodada (min)
                <input
                  aria-label="Duração de cada rodada"
                  className={field}
                  type="number"
                  min="1"
                  max="240"
                  value={cfg.roundMinutes ?? 25}
                  onChange={(e) =>
                    setCfg({ roundMinutes: Number(e.target.value) })
                  }
                />
              </label>
              <label className="text-xs">
                Quantidade de mesas
                <input
                  aria-label="Quantidade de mesas"
                  className={field}
                  type="number"
                  min="2"
                  max="40"
                  value={cfg.tables ?? ''}
                  disabled={generating}
                  onChange={(e) => setCfg({ tables: Number(e.target.value) })}
                />
              </label>
              <label className="text-xs">
                Rodadas
                <input
                  aria-label="Rodadas"
                  className={field}
                  type="number"
                  min="1"
                  max="60"
                  value={cfg.rounds ?? ''}
                  disabled={generating}
                  onChange={(e) => setCfg({ rounds: Number(e.target.value) })}
                />
              </label>
              <label className="text-xs">
                Capacidade padrão
                <input
                  aria-label="Capacidade padrão"
                  className={field}
                  type="number"
                  min="2"
                  max="30"
                  value={cfg.capacityPerTable ?? 7}
                  disabled={generating}
                  onChange={(e) =>
                    setCfg({
                      capacityPerTable: Number(e.target.value),
                      tableList: input.tables.map((t) => ({
                        ...t,
                        capacity: Number(e.target.value),
                      })),
                    })
                  }
                />
              </label>
              <label className="text-xs">
                Variação da distribuição
                <input
                  aria-label="Variação da distribuição"
                  className={field}
                  type="number"
                  min="1"
                  value={cfg.seedBase ?? 1}
                  disabled={generating}
                  onChange={(e) => setCfg({ seedBase: Number(e.target.value) })}
                />
              </label>
            </div>
            <details>
              <summary className="cursor-pointer text-sm">
                Editar nomes, empresas e capacidades das mesas
              </summary>
              <div className="grid sm:grid-cols-2 gap-3 mt-3">
                {input.tables.map((table, i) => (
                  <fieldset
                    className="border border-border p-3 space-y-2 min-w-0"
                    key={table.id}
                    disabled={generating}
                  >
                    <legend className="text-xs px-1">Mesa {i + 1}</legend>
                    <label className="block text-xs">
                      Nome
                      <input
                        aria-label={`Nome da mesa ${i + 1}`}
                        className={field}
                        value={table.name}
                        onChange={(e) => setTable(i, { name: e.target.value })}
                      />
                    </label>
                    <label className="block text-xs">
                      Empresa
                      <input
                        aria-label={`Empresa da mesa ${i + 1}`}
                        className={field}
                        value={table.company}
                        onChange={(e) =>
                          setTable(i, { company: e.target.value })
                        }
                      />
                    </label>
                    <label className="block text-xs">
                      Capacidade
                      <input
                        aria-label={`Capacidade da mesa ${i + 1}`}
                        className={field}
                        type="number"
                        min="2"
                        max="30"
                        value={table.capacity}
                        onChange={(e) =>
                          setTable(i, { capacity: Number(e.target.value) })
                        }
                      />
                    </label>
                  </fieldset>
                ))}
              </div>
            </details>
          </section>
          <section
            className="platform-panel space-y-3"
            aria-labelledby="people-heading"
          >
            <h2 id="people-heading" className="font-medium">
              Pessoas cadastradas no evento
            </h2>
            <p className="text-xs text-muted-foreground">
              Os nomes vêm de Participantes. Escolha o papel e vincule os
              anfitriões à mesa de sua empresa.
            </p>
            <details>
              <summary className="cursor-pointer text-sm">
                Configurar {input.people.length} pessoas
              </summary>
              <div className="mt-3 space-y-2">
                {input.people.map((person) => (
                  <fieldset
                    disabled={generating}
                    key={person.id}
                    className="grid md:grid-cols-[1fr_190px_190px] gap-2 border-b border-border pb-2 min-w-0"
                  >
                    <div className="text-sm min-w-0">
                      <strong className="break-words">{person.name}</strong>
                      <span className="block text-xs text-muted-foreground break-words">
                        {person.company || 'Empresa não informada'} ·{' '}
                        {person.code}
                      </span>
                    </div>
                    <label className="text-xs">
                      Papel
                      <select
                        aria-label={`Papel de ${person.name}`}
                        className={field}
                        value={person.role}
                        onChange={(e) =>
                          setPerson(person.id, { role: e.target.value })
                        }
                      >
                        {Object.entries(roles).map(([value, text]) => (
                          <option key={value} value={value}>
                            {text}
                          </option>
                        ))}
                      </select>
                    </label>
                    {['fixed', 'host'].includes(person.role) && (
                      <label className="text-xs">
                        Mesa da empresa
                        <select
                          aria-label={`Mesa de ${person.name}`}
                          className={field}
                          value={person.tableId}
                          onChange={(e) =>
                            setPerson(person.id, { tableId: e.target.value })
                          }
                        >
                          <option value="">Escolha a mesa</option>
                          {input.tables.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                  </fieldset>
                ))}
              </div>
            </details>
          </section>
          {(input.errors.length > 0 || input.warnings.length > 0) && (
            <section
              aria-label="Validação antes da geração"
              className="platform-panel text-sm space-y-2"
            >
              <h2 className="font-medium">Confira antes de gerar</h2>
              {input.errors.map((text, i) => (
                <p key={`e${i}`} className="text-destructive">
                  ! {text}
                </p>
              ))}
              {input.warnings.map((text, i) => (
                <p key={`w${i}`} className="text-muted-foreground">
                  ⚠ {text}
                </p>
              ))}
            </section>
          )}
        </div>
      </details>
      {result && selectedTable !== null && (
        <Details
          title={result.input.tables[selectedTable].name}
          onClose={() => setSelectedTable(null)}
        >
          <p className="text-sm">
            {result.input.tables[selectedTable].company || 'Sem empresa'} ·
            Capacidade: {result.input.tables[selectedTable].capacity}
          </p>
          {occupants(result, round - 1, selectedTable).map(({ person }) => (
            <button
              className="reference-list-row"
              key={person.id}
              onClick={() => {
                setSelectedPerson(person);
                setSelectedTable(null);
              }}
            >
              {person.name}
            </button>
          ))}
        </Details>
      )}
    </div>
  );
}
