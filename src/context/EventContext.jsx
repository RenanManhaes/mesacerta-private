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

const EventContext = createContext(null);
function seed() { return {events: [], currentEventId: ''}; }

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
  const [loadAttempt, setLoadAttempt] = useState(0);
  const identity = useRef('');
  const revision = useRef(0);
  const acknowledged = useRef('');
  const latest = useRef(state.events);
  const writing = useRef(null);

  latest.current = state.events;
  const scope = `${user?.id || ''}:${orgId || ''}`;

  useEffect(() => {
    identity.current = scope;
    acknowledged.current = '';
    revision.current = 0;
    setState(seed());

    setSaveError('');
    setLoadedScope('');
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
  }, [scope, orgId, user?.id, loadAttempt]);

  const flush = useCallback(async () => {
    if (!user || !orgId || loading || !revision.current) throw new Error('Os eventos ainda não foram carregados; tente novamente após o carregamento.');
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
      setSaveStatus(snapshot === JSON.stringify(latest.current) ? 'saved' : 'saving');
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
      if (writing.current === operation) writing.current = null;
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

  const addEvent = useCallback((data) => {
    const ev = emptyEventTemplate(data);
    setState((s) => { const events = [...s.events, ev]; latest.current = events; return { events, currentEventId: ev.id }; });
    return ev;
  }, []);

  const importBackup = useCallback((backup) => {
    if (!Array.isArray(backup?.events) || !backup.events.length || backup.events.some(e => !e || typeof e.id !== 'string' || typeof e.name !== 'string')) {
      throw new Error('O arquivo não contém um backup válido de eventos.');
    }
    const ids = new Set(backup.events.map(e => e.id));
    if (ids.size !== backup.events.length || latest.current.some(e => ids.has(e.id))) {
      throw new Error('Há IDs de eventos repetidos. A importação foi recusada para não substituir dados existentes.');
    }
    if (!revision.current) throw new Error('Aguarde o carregamento antes de importar.');
    setState(s => {
      const events = [...s.events, ...backup.events];
      latest.current = events;
      return {...s, events};
    });
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
    importBackup,
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
            <button onClick={() => revision.current ? flush().catch(() => {}) : setLoadAttempt(n => n + 1)}>
              Tentar novamente
            </button>
            <button onClick={exportBackup}>Exportar alterações</button>

          </div>
        </div>
      )}
      {privatePage && (loading || (user && orgId && loadedScope !== scope)) ? (
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
