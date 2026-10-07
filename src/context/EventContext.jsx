import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/api/supabaseClient';
import { emptyEventTemplate } from '@/lib/demoData';
import { mergeEventDocument } from '@/lib/mergeEventDocument';
import { saveEventWithMerge } from '@/lib/eventSync';
import { recordSignal, hasNewerSignal, decideRefresh, reconcileRemote, createMutationTracker } from '@/lib/realtimeRefresh';
import { watchEventSignals } from '@/lib/eventSignals';
import { toast } from '@/components/ui/use-toast';
import { friendlyCreateError } from '@/lib/eventLimit';

const EventContext = createContext(null);
function seed() { return {events: [], currentEventId: ''}; }

export function EventProvider({ children }) {
  const { user, memberships } = useAuth();
  const {pathname} = useLocation();
  const privatePage = pathname.startsWith('/event') || pathname === '/novo' || pathname === '/entrar';
  const orgId = memberships[0]?.organization_id;
  const [state, setState] = useState(seed);
  const [loadedScope, setLoadedScope] = useState('');
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved');
  const [saveError, setSaveError] = useState('');
  const [loadAttempt, setLoadAttempt] = useState(0);
  const identity = useRef('');
  const revision = useRef({});
  const [eventAccess, setEventAccess] = useState({});
  const [creationPermission, setCreationPermission] = useState({canCreate:false,multiEvent:false,eventLimit:0});
  const acknowledged = useRef('');
  const latest = useRef(state.events);
  const writing = useRef(null);
  const refreshing = useRef(false);
  // MCT-85: sinais de outras sessões (maior revisão por evento), pedido de nova rebusca e refresh atual.
  const signals = useRef({});
  const rerun = useRef(false);
  const forceRerun = useRef(false);
  const refreshRef = useRef(null);
  // Criar, importar e gravar mudam a lista fora da rebusca; a rebusca em voo descarta o que voltar nessa hora.
  const mutations = useRef(null);
  mutations.current ||= createMutationTracker();
  const [mergeNotice, setMergeNotice] = useState('');

  latest.current = state.events;
  const scope = user?.id || '';
  const ready = loadedScope === scope && !!user;

  useEffect(() => {
    identity.current = scope;
    acknowledged.current = '';
    revision.current = {};
    signals.current = {};
    rerun.current = false;
    forceRerun.current = false;
    setState(seed());

    setSaveError('');
    setLoadedScope('');
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const [result, permission] = await Promise.all([supabase.rpc('event_list'),supabase.rpc('event_creation_permission')]);
        const {data,error} = result;
        if (error) throw new Error(error.message);
        if (permission.error) throw new Error(permission.error.message);
        if (cancelled) return;
        setCreationPermission(permission.data);
        const events = data.map(row => row.document);
        revision.current = Object.fromEntries(data.map(row => [row.document.id, row.revision]));
        setEventAccess(Object.fromEntries(data.map(row => [row.document.id, row])));
        acknowledged.current = JSON.stringify(events);
        setState({events, currentEventId: events[0]?.id || ''});
        setSaveStatus('saved');
        setLoadedScope(scope);

      } catch (err) {
        if (!cancelled) {
          setSaveError(
            `Não foi possível carregar seus eventos: ${err.message}`,
          );
          setSaveStatus('error');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [scope, user?.id, loadAttempt]);

  const flush = useCallback(async () => {
    if (!user || loading || !ready) throw new Error('Os eventos ainda não foram carregados; tente novamente após o carregamento.');
    if (writing.current) {
      await writing.current;
      return flush();
    }
    const snapshot = JSON.stringify(latest.current);
    if (snapshot === acknowledged.current) {
      setSaveStatus("saved");
      setSaveError("");
      return;
    }
    const startedScope = identity.current;
    setSaveStatus('saving');
    setSaveError('');
    const operation = mutations.current.track(async () => {
      const previous = JSON.parse(acknowledged.current || '[]');
      let merged = false, conflictCount = 0;
      for (const document of JSON.parse(snapshot)) {
        if (JSON.stringify(document) === JSON.stringify(previous.find(e => e.id === document.id))) continue;
        // Em conflito de revisão (40001) junta com a versão do servidor e tenta de novo, até 3 vezes.
        const saved = await saveEventWithMerge({
          client: supabase, base: previous.find(e => e.id === document.id), document, revision: revision.current[document.id],
        });
        if (identity.current !== startedScope) return;
        revision.current[document.id] = saved.revision;
        if (saved.merged) {
          merged = true;
          conflictCount += saved.conflicts.length;
          // Mostra no app o que a outra pessoa alterou, preservando o que foi digitado durante a gravação.
          const applyMerged = (events) => events.map(e => e.id !== document.id || JSON.stringify(e) === JSON.stringify(saved.document)
            ? e
            : JSON.stringify(e) === JSON.stringify(document) ? saved.document : mergeEventDocument(document, e, saved.document).document);
          latest.current = applyMerged(latest.current);
          setState(s => { const events = applyMerged(s.events); latest.current = events; return {...s, events}; });
        }
        const index = previous.findIndex(e => e.id === document.id);
        if (index >= 0) previous[index] = saved.document; else previous.push(saved.document);
        acknowledged.current = JSON.stringify(previous);
      }
      if (!merged) acknowledged.current = snapshot;
      if (conflictCount > 0) setMergeNotice(conflictCount === 1
        ? '1 alteração feita por outra pessoa foi substituída pela sua.'
        : `${conflictCount} alterações feitas por outra pessoa foram substituídas pelas suas.`);
      setSaveStatus(snapshot === JSON.stringify(latest.current) ? 'saved' : 'saving');
    });
    writing.current = operation;
    try {
      await operation;
    } catch (err) {
      if (identity.current === startedScope) {
        setSaveStatus('error');
        setSaveError(`Alterações não salvas: ${err.message}`);
      }
      throw err;
    } finally {
      if (writing.current === operation) writing.current = null;
    }
    if (
      identity.current === startedScope &&
      JSON.stringify(latest.current) !== acknowledged.current
    )
      return flush();
    // Se outra pessoa salvou durante a gravação, a rebusca ficou adiada: confere agora (eco da própria gravação é ignorado).
    if (rerun.current && identity.current === startedScope) refreshRef.current?.();
  }, [user?.id, loading, ready]);

  useEffect(() => {
    if (
      loading ||
      !user ||
      !ready ||
      JSON.stringify(state.events) === acknowledged.current
    )
      return;
    setSaveStatus('saving');
    const timer = setTimeout(() => {
      flush().catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [state.events, loading, ready, user?.id, flush]);
  // Sincronização entre sessões (MCT-85). Três gatilhos levam à mesma rebusca (event_list, já com a projeção do papel):
  // sinal Realtime de outra pessoa, reconexão/volta da rede e foco da aba (reserva). Edição local pendente nunca é sobrescrita:
  // a decisão (aplicar, adiar ou mesclar) vem de realtimeRefresh.js. Só troca documentos e revisões; não remonta rotas.
  useEffect(() => {
    if (!user || !ready) return;
    let retryTimer = null, retries = 0, active = true;
    const dirty = () => JSON.stringify(latest.current) !== acknowledged.current;
    const refresh = async ({force = false} = {}) => {
      if (!active) return;
      if (force && document.visibilityState === 'hidden') return;
      if (refreshing.current) { rerun.current = true; forceRerun.current ||= force; return; }
      // Criação/importação em andamento: o servidor e a tela estão em momentos diferentes. Espera terminar (quem terminar chama a rebusca).
      if (mutations.current.busy()) { rerun.current = true; forceRerun.current ||= force; return; }
      const action = decideRefresh({newer: force || forceRerun.current || hasNewerSignal(signals.current, revision.current), writing: !!writing.current, dirty: dirty()});
      if (action === 'ignore') { rerun.current = false; forceRerun.current = false; return; }
      if (action === 'defer') { rerun.current = true; forceRerun.current ||= force; return; }
      rerun.current = false; forceRerun.current = false;
      const startedScope = identity.current;
      const startedEpoch = mutations.current.snapshot();
      refreshing.current = true;
      try {
        const {data, error} = await supabase.rpc('event_list').abortSignal(AbortSignal.timeout(15000));
        if (error) throw new Error(error.message);
        if (!active || identity.current !== startedScope) return;
        // Um evento foi criado/importado (ou algo foi gravado) enquanto buscava: a resposta pode estar velha e
        // faria o evento novo parecer "sem acesso". Descarta e busca de novo.
        if (mutations.current.changedSince(startedEpoch)) { rerun.current = true; forceRerun.current = true; return; }
        // Começou uma gravação enquanto buscava: o que veio pode não incluir a minha mudança. Confere de novo depois.
        if (writing.current) { rerun.current = true; forceRerun.current = true; return; }
        const result = reconcileRemote({acknowledged: JSON.parse(acknowledged.current || '[]'), local: latest.current, remote: data});
        revision.current = result.revisions;
        setEventAccess(Object.fromEntries(data.map(row => [row.document.id, row])));
        retries = 0;
        if (!result.changedIds.length && result.events.length === latest.current.length) return;
        acknowledged.current = JSON.stringify(result.acknowledged);
        latest.current = result.events;
        setState(s => ({events: result.events, currentEventId: result.events.some(e => e.id === s.currentEventId) ? s.currentEventId : result.events[0]?.id || ''}));
        if (result.conflicts.length) setMergeNotice(result.conflicts.length === 1
          ? '1 alteração feita por outra pessoa foi substituída pela sua.'
          : `${result.conflicts.length} alterações feitas por outra pessoa foram substituídas pelas suas.`);
        else toast({title: 'Atualizado por outra pessoa da equipe', duration: 3000});
      } catch {
        // Atualização silenciosa: falha de rede não incomoda. Tenta de novo algumas vezes; depois, no foco, na reconexão ou no próximo sinal.
        if (active && retries < 3 && hasNewerSignal(signals.current, revision.current)) {
          retryTimer = setTimeout(() => refresh(), 3000 * 2 ** retries++);
        }
      } finally {
        refreshing.current = false;
        if (active && rerun.current && !writing.current && !mutations.current.busy()) refresh();
      }
    };
    refreshRef.current = refresh;
    const onFocus = () => refresh({force: true});
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    window.addEventListener('online', onFocus);
    return () => {
      active = false;
      clearTimeout(retryTimer);
      if (refreshRef.current === refresh) refreshRef.current = null;
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
      window.removeEventListener('online', onFocus);
    };
  }, [user?.id, ready]);
  // Canal Realtime do sinal de mudança: um filtro por evento acessível. Recriado só quando a lista de eventos muda e removido ao desmontar.
  const watchedEvents = Object.keys(eventAccess).sort().join('\n');
  useEffect(() => {
    if (!user || !ready || !watchedEvents) return;
    return watchEventSignals({
      client: supabase,
      eventIds: watchedEvents.split('\n'),
      onSignal: ({eventId, revision: signalRevision}) => {
        signals.current = recordSignal(signals.current, eventId, signalRevision);
        refreshRef.current?.();
      },
      // Ao (re)conectar, uma rebusca cobre o que aconteceu enquanto o canal estava fora do ar.
      onSubscribed: () => refreshRef.current?.({force: true}),
    });
  }, [user?.id, ready, watchedEvents]);
  useEffect(() => {
    if (!mergeNotice) return;
    const timer = setTimeout(() => setMergeNotice(''), 10000);
    return () => clearTimeout(timer);
  }, [mergeNotice]);
  useEffect(() => {
    const guard = (e) => {
      if (
        JSON.stringify(latest.current) !== acknowledged.current &&
        acknowledged.current
      ) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, []);

  const events = state.events;
  const currentEventId = state.currentEventId;
  const currentEvent = useMemo(
    () => events.find((e) => e.id === currentEventId) || events[0] || null,
    [events, currentEventId],
  );

  const setCurrentEventId = useCallback(
    (id) => setState((s) => ({ ...s, currentEventId: id })),
    [],
  );

  const updateCurrent = useCallback((updater) => {
    setState((s) => {
      const idx = s.events.findIndex((e) => e.id === s.currentEventId);
      if (idx < 0) return s;
      const ev = s.events[idx];
      const next =
        typeof updater === 'function' ? updater(ev) : { ...ev, ...updater };
      const events = [...s.events];
      events[idx] = next;
      latest.current = events;
      return { ...s, events };
    });
  }, []);

  // Aplica a mudança e grava na hora; rejeita se a gravação falhar (o chamador pode desfazer).
  const commitCurrent = async (updater) => {
    updateCurrent(updater);
    const idx = latest.current.findIndex((e) => e.id === state.currentEventId);
    if (idx >= 0) {
      const next = [...latest.current];
      next[idx] = typeof updater === 'function' ? updater(next[idx]) : { ...next[idx], ...updater };
      latest.current = next;
    }
    return flush();
  };

  const updateEventById = useCallback((id, updater) => {
    setState((s) => {
      const idx = s.events.findIndex((e) => e.id === id);
      if (idx < 0) return s;
      const ev = s.events[idx];
      const next =
        typeof updater === 'function' ? updater(ev) : { ...ev, ...updater };
      const events = [...s.events];
      events[idx] = next;
      latest.current = events;
      return { ...s, events };
    });
  }, []);

  const addEvent = useCallback(async (data) => {
    if (!orgId) throw new Error('Crie uma organização antes de criar seu evento.');
    await flush();
    const ev = await mutations.current.track(async () => {
      const {data: row, error} = await supabase.rpc('event_create', {p_org: orgId, p_document: emptyEventTemplate(data)});
      if (error) throw friendlyCreateError(error);
      const created = row.document;
      setCreationPermission(row.creationPermission);
      revision.current[created.id] = row.revision;
      setEventAccess(access => ({...access, [created.id]: row}));
      acknowledged.current = JSON.stringify([...JSON.parse(acknowledged.current || '[]'), created]);
      setState(s => {const events = [...s.events, created]; latest.current = events; return {events, currentEventId: created.id};});
      return created;
    });
    if (rerun.current) refreshRef.current?.();
    return ev;
  }, [orgId, flush]);

  const importBackup = useCallback(async (backup) => {
    if (!Array.isArray(backup?.events) || !backup.events.length || backup.events.some(e => !e || typeof e.id !== 'string' || typeof e.name !== 'string')) throw new Error('O arquivo não contém um backup válido de eventos.');
    const ids = new Set(backup.events.map(e => e.id));
    if (ids.size !== backup.events.length || latest.current.some(e => ids.has(e.id))) throw new Error('Há IDs de eventos repetidos. A importação foi recusada para não substituir dados existentes.');
    if (!ready || !orgId) throw new Error('Aguarde o carregamento e crie uma organização antes de importar.');
    await flush();
    // Every imported record goes through the same authenticated creation transaction.
    try {
      await mutations.current.track(async () => {
        for (const document of backup.events) {
          const {data: row, error} = await supabase.rpc('event_create', {p_org: orgId, p_document: document});
          if (error) throw friendlyCreateError(error);
          revision.current[document.id] = row.revision;
          setCreationPermission(row.creationPermission);
          setEventAccess(access => ({...access, [document.id]: row}));
          acknowledged.current = JSON.stringify([...JSON.parse(acknowledged.current), row.document]);
          setState(s => {const events = [...s.events, row.document]; latest.current = events; return {...s, events};});
        }
      });
    } finally {
      if (rerun.current) refreshRef.current?.();
    }
  }, [ready, orgId, flush]);

  const exportBackup = useCallback(() => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify({ events: latest.current })], {
        type: 'application/json',
      }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mesa-certa-backup.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, []);
  const value = {
    events,
    eventAccess,
    canCreateEvent: creationPermission.canCreate,
    eventLimit: creationPermission.eventLimit,
    access: eventAccess[currentEvent?.id],
    reloadEvents: () => setLoadAttempt(n => n + 1),
    currentEvent,
    currentEventId,
    setCurrentEventId,
    updateCurrent,
    commitCurrent,
    updateEventById,
    addEvent,
    importBackup,
    loading,
    saveStatus,
    saveError,
    flush,
    orgId: eventAccess[currentEvent?.id]?.organizationId || orgId,
    exportBackup,
  };
  return (
    <EventContext.Provider value={value}>
      {privatePage && user && mergeNotice && !saveError && (
        <div
          className="fixed bottom-4 left-4 right-4 z-50 bg-card border border-border rounded-xl p-4 text-sm shadow-lg"
          role="status"
        >
          <p>{mergeNotice}</p>
          <div className="flex gap-4 mt-2">
            <button onClick={() => setMergeNotice('')}>Entendi</button>
          </div>
        </div>
      )}
      {privatePage && user && saveError && (
        <div
          className="fixed bottom-4 left-4 right-4 z-50 bg-card border border-danger rounded-xl p-4 text-sm shadow-lg"
          role="alert"
        >
          <p>{saveError}</p>
          <div className="flex gap-4 mt-2">
            <button onClick={() => ready ? flush().catch(() => {}) : setLoadAttempt(n => n + 1)}>
              Tentar novamente
            </button>
            <button onClick={exportBackup}>Exportar alterações</button>

          </div>
        </div>
      )}
      {privatePage && (loading || (user && loadedScope !== scope)) ? (
        <div className="p-8" role="status">
          {saveError ? 'Os eventos não foram carregados. Use Tentar novamente.' : 'Carregando seus eventos…'}
        </div>
      ) : (
        children
      )}
    </EventContext.Provider>
  );
}

export function useEvent() {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error('useEvent must be used within EventProvider');
  return ctx;
}

export function useOptionalEvent() {
  return useContext(EventContext);
}
