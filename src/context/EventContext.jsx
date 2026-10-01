import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { demoEvent, demoEvents, emptyEventTemplate } from '@/lib/demoData';

const EventContext = createContext(null);
const STORAGE_KEY = 'mesacerta_v1';

function seed() {
  return {
    events: [
      { ...demoEvent },
      ...demoEvents.filter(e => e.id !== demoEvent.id).map(e => ({ ...e, modules: { tickets: true, sponsors: false, suppliers: true, schedule: true, networking: false }, tasks: [], participants: [], expenses: [], revenues: [], tickets: [], sponsors: [], suppliers: [], schedule: [], sponsorPlans: [], networking: { enabled: false } }))
    ],
    currentEventId: demoEvent.id
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return seed();
}

export function EventProvider({ children }) {
  const [state, setState] = useState(load);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }, [state]);

  const events = state.events;
  const currentEventId = state.currentEventId;
  const currentEvent = useMemo(
    () => events.find(e => e.id === currentEventId) || events[0] || null,
    [events, currentEventId]
  );

  const setCurrentEventId = useCallback((id) => setState(s => ({ ...s, currentEventId: id })), []);

  const updateCurrent = useCallback((updater) => {
    setState(s => {
      const idx = s.events.findIndex(e => e.id === s.currentEventId);
      if (idx < 0) return s;
      const ev = s.events[idx];
      const next = typeof updater === 'function' ? updater(ev) : { ...ev, ...updater };
      const events = [...s.events];
      events[idx] = next;
      return { ...s, events };
    });
  }, []);

  const updateEventById = useCallback((id, updater) => {
    setState(s => {
      const idx = s.events.findIndex(e => e.id === id);
      if (idx < 0) return s;
      const ev = s.events[idx];
      const next = typeof updater === 'function' ? updater(ev) : { ...ev, ...updater };
      const events = [...s.events];
      events[idx] = next;
      return { ...s, events };
    });
  }, []);

  const addEvent = useCallback((data) => {
    const ev = emptyEventTemplate(data);
    setState(s => ({ events: [...s.events, ev], currentEventId: ev.id }));
    return ev;
  }, []);

  const resetDemo = useCallback(() => {
    const fresh = seed();
    setState(fresh);
  }, []);

  const value = { events, currentEvent, currentEventId, setCurrentEventId, updateCurrent, updateEventById, addEvent, resetDemo };
  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
}

export function useEvent() {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error('useEvent must be used within EventProvider');
  return ctx;
}
