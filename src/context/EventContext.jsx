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
import { demoEvent, demoEvents, emptyEventTemplate } from '@/lib/demoData';

const EventContext = createContext(null);
const STORAGE_KEY = 'mesacerta_v1';

function seed() {
  return {
    events: [
      { ...demoEvent },
      ...demoEvents
        .filter((e) => e.id !== demoEvent.id)
        .map((e) => ({
          ...e,
          modules: {
            tickets: true,
            sponsors: false,
            suppliers: true,
            schedule: true,
            networking: false,
          },
          tasks: [],
          participants: [],
          expenses: [],
          revenues: [],
          tickets: [],
          sponsors: [],
          suppliers: [],
          schedule: [],
          sponsorPlans: [],
          networking: { enabled: false },
        })),
    ],
    currentEventId: demoEvent.id,
  };
}

export function EventProvider({ children }) {
  const { user, memberships } = useAuth();
  const {pathname} = useLocation();
  const privatePage = pathname.startsWith('/event') || pathname === '/novo';
  const orgId = memberships[0]?.organization_id;
  const [state, setState] = useState(seed);
  const [loadedScope, setLoadedScope] = useState('');
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved');
  const [saveError, setSaveError] = useState('');
  const [legacy, setLegacy] = useState(null);
  const identity = useRef('');
  const revision = useRef(0);
  const acknowledged = useRef('');
  const latest = useRef(state.events);
  const writing = useRef(null);
  const importing = useRef(false);
  latest.current = state.events;
  const scope = `${user?.id || ''}:${orgId || ''}`;

  useEffect(() => {
    identity.current = scope;
    acknowledged.current = '';
    revision.current = 0;
    setState(seed());
    setLegacy(null);
    setSaveError('');
    if (!user || !orgId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        let { data, error } = await supabase
          .from('platform_workspaces')
          .select('events,revision')
          .eq('organization_id', orgId)
          .maybeSingle();
        if (error) throw error;
        if (!data) {
          const fresh = seed();
          const inserted = await supabase
            .from('platform_workspaces')
            .insert({ organization_id: orgId, events: fresh.events })
            .select('events,revision')
            .single();
          if (inserted.error?.code === '23505') {
            const existing = await supabase
              .from('platform_workspaces')
              .select('events,revision')
              .eq('organization_id', orgId)
              .single();
            if (existing.error) throw existing.error;
            data = existing.data;
          } else {
            if (inserted.error) throw inserted.error;
            data = inserted.data;
          }
        }
        if (cancelled) return;
        revision.current = data.revision;
        acknowledged.current = JSON.stringify(data.events);
        setState({
          events: data.events,
          currentEventId: data.events[0]?.id || '',
        });
        setSaveStatus('saved');
        setLoadedScope(scope);
        try {
          const previous = JSON.parse(localStorage.getItem(STORAGE_KEY));
          if (
            previous?.events?.length &&
            !localStorage.getItem(`mesacerta_imported_${orgId}`)
          )
            setLegacy(previous);
        } catch {}
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
  }, [scope, orgId, user?.id]);

  const flush = useCallback(async () => {
    if (!user || !orgId || loading || !revision.current) return;
    if (writing.current) {
      await writing.current;
      return flush();
    }
    const snapshot = JSON.stringify(latest.current);
    if (snapshot === acknowledged.current) return;
    const startedScope = identity.current;
    setSaveStatus('saving');
    setSaveError('');
    const operation = (async () => {
      const { data, error } = await supabase
        .from('platform_workspaces')
        .update({ events: JSON.parse(snapshot) })
        .eq('organization_id', orgId)
        .eq('revision', revision.current)
        .abortSignal(AbortSignal.timeout(15000))
        .select('revision')
        .maybeSingle();
      if (identity.current !== startedScope) return;
      if (error) throw error;
      if (!data)
        throw new Error(
          'Outra pessoa atualizou os eventos. Recarregue antes de continuar; suas alterações podem ser exportadas.',
        );
      revision.current = data.revision;
      acknowledged.current = snapshot;
      setSaveStatus('saved');
      if (importing.current && snapshot === JSON.stringify(latest.current)) {
        try {
          localStorage.setItem(`mesacerta_imported_${orgId}`, '1');
        } catch {}
        importing.current = false;
      }
    })();
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
      writing.current = null;
    }
    if (
      identity.current === startedScope &&
      JSON.stringify(latest.current) !== acknowledged.current
    )
      return flush();
  }, [orgId, user?.id, loading]);

  useEffect(() => {
    if (
      loading ||
      !user ||
      !orgId ||
      !revision.current ||
      JSON.stringify(state.events) === acknowledged.current
    )
      return;
    setSaveStatus('saving');
    const timer = setTimeout(() => {
      flush().catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [state.events, loading, orgId, user?.id, flush]);
  useEffect(() => {
    const guard = (e) => {
      if (
        JSON.stringify(latest.current) !== acknowledged.current &&
        revision.current
      ) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, []);
  const importLegacy = () => {
    if (!legacy) return;
    importing.current = true;
    setState((s) => ({
      ...s,
      events: [
        ...s.events.filter((e) => !legacy.events.some((l) => l.id === e.id)),
        ...legacy.events,
      ],
    }));
    setLegacy(null);
    // Keep original browser data as a recoverable backup; it is no longer the source of truth.
  };

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
      return { ...s, events };
    });
  }, []);

  const updateEventById = useCallback((id, updater) => {
    setState((s) => {
      const idx = s.events.findIndex((e) => e.id === id);
      if (idx < 0) return s;
      const ev = s.events[idx];
      const next =
        typeof updater === 'function' ? updater(ev) : { ...ev, ...updater };
      const events = [...s.events];
      events[idx] = next;
      return { ...s, events };
    });
  }, []);

  const addEvent = useCallback((data) => {
    const ev = emptyEventTemplate(data);
    setState((s) => ({ events: [...s.events, ev], currentEventId: ev.id }));
    return ev;
  }, []);

  const resetDemo = useCallback(() => {
    const fresh = seed();
    setState(fresh);
  }, []);

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
    currentEvent,
    currentEventId,
    setCurrentEventId,
    updateCurrent,
    updateEventById,
    addEvent,
    resetDemo,
    loading,
    saveStatus,
    saveError,
    flush,
    orgId,
    exportBackup,
  };
  return (
    <EventContext.Provider value={value}>
      {privatePage && user && saveError && (
        <div
          className="fixed bottom-4 left-4 right-4 z-50 bg-card border border-danger rounded-xl p-4 text-sm shadow-lg"
          role="alert"
        >
          <p>{saveError}</p>
          <div className="flex gap-4 mt-2">
            <button onClick={() => flush().catch(() => {})}>
              Tentar salvar novamente
            </button>
            <button onClick={exportBackup}>Exportar alterações</button>
            <button onClick={() => window.location.reload()}>Recarregar</button>
          </div>
        </div>
      )}
      {privatePage && user && legacy && (
        <div className="bg-secondary p-3 text-sm relative z-40">
          Há {legacy.events.length} eventos anteriores neste navegador.{' '}
          <button className="underline font-semibold" onClick={importLegacy}>
            Importar para esta organização
          </button>
          <button className="ml-4" onClick={() => setLegacy(null)}>
            Agora não
          </button>
        </div>
      )}
      {privatePage && (loading || (user && orgId && loadedScope !== scope)) ? (
        <div className="p-8" role="status">
          {saveError ? 'Os eventos não foram carregados. Recarregue para tentar novamente.' : 'Carregando seus eventos…'}
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
