import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '@/api/supabaseClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [memberships, setMemberships] = useState([]);
  const [membershipsLoading, setMembershipsLoading] = useState(false);

  // RLS (is_org_member) already scopes `memberships` to organizations the
  // caller belongs to; filtering by user_id here keeps this specifically to
  // "my own membership rows" (an org can have teammates whose rows would
  // otherwise also come back). Zero rows means: authenticated, but no
  // organization yet — see docs/modelo-de-dados.md, "Vulnerabilidade crítica
  // corrigida" for why there is no bootstrap exception in the policy anymore.
  const loadMemberships = useCallback(async (userId) => {
    if (!userId) {
      setMemberships([]);
      return;
    }
    setMembershipsLoading(true);
    const { data, error } = await supabase
      .from('memberships')
      .select('id, organization_id, role, organizations ( id, nome )')
      .eq('user_id', userId);
    if (error) {
      console.error('Falha ao carregar organizações do usuário:', error);
      setMemberships([]);
    } else {
      setMemberships(data || []);
    }
    setMembershipsLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setAuthChecked(true);
      if (data.session?.user?.id) {
        loadMemberships(data.session.user.id);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setAuthChecked(true);
      if (newSession?.user?.id) {
        loadMemberships(newSession.user.id);
      } else {
        setMemberships([]);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [loadMemberships]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setMemberships([]);
  }, []);

  const refreshMemberships = useCallback(() => {
    return loadMemberships(session?.user?.id);
  }, [loadMemberships, session]);

  const value = {
    session,
    user: session?.user ?? null,
    isAuthenticated: !!session,
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
