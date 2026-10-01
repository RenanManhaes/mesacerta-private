import { Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import CreateOrganization from '@/pages/CreateOrganization';

const DefaultFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

export default function ProtectedRoute({ fallback = <DefaultFallback />, unauthenticatedElement }) {
  const { isAuthenticated, authChecked, memberships, membershipsLoading } = useAuth();

  if (!authChecked) {
    return fallback;
  }

  if (!isAuthenticated) {
    return unauthenticatedElement;
  }

  if (membershipsLoading) {
    return fallback;
  }

  // Authenticated but no organization yet: RLS (is_org_member) means the
  // user sees nothing in any domain table until one exists. Gate on this
  // before rendering the protected tree, not after it renders empty.
  if (memberships.length === 0) {
    return <CreateOrganization />;
  }

  return <Outlet />;
}
