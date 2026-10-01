import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Navigate } from 'react-router-dom';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import { EventProvider } from '@/context/EventContext';
import Events from '@/pages/Events';
import CreateEvent from '@/pages/CreateEvent';
import AppLayout from '@/components/layout/AppLayout';
import Dashboard from '@/pages/event/Dashboard';
import Financial from '@/pages/event/Financial';
import Schedule from '@/pages/event/Schedule';
import Tasks from '@/pages/event/Tasks';
import Participants from '@/pages/event/Participants';
import Suppliers from '@/pages/event/Suppliers';
import Revenues from '@/pages/event/Revenues';
import Expenses from '@/pages/event/Expenses';
import Sponsors from '@/pages/event/Sponsors';
import Capacity from '@/pages/event/Capacity';
import Simulator from '@/pages/event/Simulator';
import Networking from '@/pages/event/Networking';
import EventSettings from '@/pages/event/EventSettings';
import DesignSystem from '@/pages/DesignSystem';

const AuthenticatedApp = () => {
  const { authChecked } = useAuth();

  // Show loading spinner while the initial Supabase session check runs
  if (!authChecked) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Render the main app
  return (
    <EventProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/design-system" element={<DesignSystem />} />
        <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
          <Route path="/" element={<Events />} />
          <Route path="/novo" element={<CreateEvent />} />
          <Route path="/event/:eventId" element={<AppLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="programacao" element={<Schedule />} />
            <Route path="tarefas" element={<Tasks />} />
            <Route path="participantes" element={<Participants />} />
            <Route path="fornecedores" element={<Suppliers />} />
            <Route path="financeiro" element={<Financial />} />
            <Route path="receitas" element={<Revenues />} />
            <Route path="despesas" element={<Expenses />} />
            <Route path="patrocinios" element={<Sponsors />} />
            <Route path="capacidade" element={<Capacity />} />
            <Route path="simulador" element={<Simulator />} />
            <Route path="networking" element={<Networking />} />
            <Route path="configuracoes" element={<EventSettings />} />
          </Route>
        </Route>
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </EventProvider>
  );
};

function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
