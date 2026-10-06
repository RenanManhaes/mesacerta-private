import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import CreateOrganization from '@/pages/CreateOrganization';

const DefaultFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

export default function ProtectedRoute({ fallback = <DefaultFallback />, unauthenticatedElement }) {
  const location = useLocation();
  const { isAuthenticated, authChecked, memberships, membershipsLoading, sessionExpired, membershipError, refreshMemberships } = useAuth();

  if (!authChecked) {
    return fallback;
  }

  if (!isAuthenticated && !sessionExpired) {
    return unauthenticatedElement;
  }

  if (membershipsLoading) {
    return fallback;
  }

  // Authenticated but no organization yet: RLS (is_org_member) means the
  // user sees nothing in any domain table until one exists. Gate on this
  // before rendering the protected tree, not after it renders empty.
  if (memberships.length === 0 && location.pathname === '/novo') {
    if (membershipError) return <div role="alert">{membershipError} <button onClick={refreshMemberships}>Tentar novamente</button></div>;
    return <CreateOrganization />;
  }

  // Keep this structure stable across auth events so Outlet never remounts.
  return <>
    {sessionExpired && <div role="alert" className="bg-destructive/10 text-destructive p-4">
      Sua sessão expirou. Seu trabalho continua nesta aba. Entre novamente em outra aba para continuar salvando.
      {' '}<a href="/login" target="_blank" rel="noopener noreferrer" className="underline">Entrar novamente</a>
    </div>}
    {membershipError && <div role="alert">{membershipError} <button onClick={refreshMemberships}>Tentar novamente</button></div>}
    <Outlet />
  </>;
}
