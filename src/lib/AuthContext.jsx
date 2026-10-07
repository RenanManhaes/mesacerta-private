import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { supabase, releaseTabSession } from '@/api/supabaseClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [memberships, setMemberships] = useState([]);
  const [membershipsLoading, setMembershipsLoading] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [membershipError, setMembershipError] = useState('');
  const identity = useRef(null);
  const explicitSignOut = useRef(false);
  const membershipRequest = useRef(0);

  // RLS (is_org_member) already scopes `memberships` to organizations the
  // caller belongs to; filtering by user_id here keeps this specifically to
  // "my own membership rows" (an org can have teammates whose rows would
  // otherwise also come back). Zero rows means: authenticated, but no
  // organization yet — see docs/modelo-de-dados.md, "Vulnerabilidade crítica
  // corrigida" for why there is no bootstrap exception in the policy anymore.
  const loadMemberships = useCallback(async (userId, initial = false) => {
    if (!userId) {
      setMemberships([]);
      return;
    }
    const request = ++membershipRequest.current;
    if (initial) setMembershipsLoading(true);
    setMembershipError('');
    try {
      const { data, error } = await supabase
        .from('memberships')
        .select('id, organization_id, role, organizations ( id, nome )')
        .eq('user_id', userId);
      if (request !== membershipRequest.current || identity.current !== userId) return;
      if (error) throw error;
      setMemberships(data || []);
    } catch {
      if (request === membershipRequest.current && identity.current === userId) {
        setMembershipError('Não foi possível atualizar suas organizações. Tente novamente.');
      }
    } finally {
      if (request === membershipRequest.current) setMembershipsLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    identity.current = null;
    let observedAuthEvent = false;
    const timers = new Set();
    const applySession = (newSession) => {
      if (!mounted) return;
      const userId = newSession?.user?.id;
      if (!userId && identity.current && !explicitSignOut.current) {
        // Keep the mounted form and its identity in memory. The Supabase client
        // has already lost the credential: retaining the UI grants no API access.
        setSessionExpired(true);
        setAuthChecked(true);
        return;
      }
      setSession(newSession);
      setSessionExpired(false);
      if (identity.current !== (userId || null)) {
        identity.current = userId || null;
        ++membershipRequest.current;
        setMemberships([]);
        setMembershipError('');
        setMembershipsLoading(!!userId);
        if (userId) {
          // Never call another Supabase operation inside the auth callback's
          // lock. Defer the initial lookup until that callback has returned.
          const timer = setTimeout(() => {
            timers.delete(timer);
            if (mounted && identity.current === userId) loadMemberships(userId, true);
          }, 0);
          timers.add(timer);
        }
      }
      setAuthChecked(true);
    };
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      observedAuthEvent = true;
      applySession(newSession);
    });
    supabase.auth.getSession().then(({ data, error }) => {
      if (!observedAuthEvent) applySession(error ? null : data.session);
    }).catch(() => {
      if (!observedAuthEvent) applySession(null);
    });

    return () => {
      mounted = false;
      ++membershipRequest.current;
      timers.forEach(clearTimeout);
      listener.subscription.unsubscribe();
    };
  }, [loadMemberships]);

  const signOut = useCallback(async () => {
    explicitSignOut.current = true;
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) {
        // Current Supabase SDK can clear local storage even if remote revocation
        // fails. Only report a failed logout when the session still exists.
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || data.session) throw error;
      }
      releaseTabSession();
      ++membershipRequest.current;
      identity.current = null;
      setSession(null);
      setMemberships([]);
      setSessionExpired(false);
    } finally {
      explicitSignOut.current = false;
    }
  }, []);

  const refreshMemberships = useCallback(() => {
    return loadMemberships(session?.user?.id);
  }, [loadMemberships, session]);

  const value = {
    session,
    user: session?.user ?? null,
    isAuthenticated: !!session && !sessionExpired,
    sessionExpired,
    membershipError,
    authChecked,
    memberships,
    membershipsLoading,
    refreshMemberships,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
