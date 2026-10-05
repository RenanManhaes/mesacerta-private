import { Toaster } from "@/components/ui/toaster"
import './components/layout/platform.css';
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Navigate } from 'react-router-dom';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import LandingPage from '@/pages/LandingPage';
import { EventProvider } from '@/context/EventContext';
import Events from '@/pages/Events';
import CreateEvent from '@/pages/CreateEvent';
import AppLayout from '@/components/layout/AppLayout';
import Dashboard from '@/pages/event/Dashboard';
import Financial from '@/pages/event/Financial';
import Schedule from '@/pages/event/Schedule';
import Tasks from '@/pages/event/Tasks';
import Staff from '@/pages/event/Staff';
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
  return (
    <EventProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/design-system" element={<DesignSystem />} />
        <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
          <Route path="/eventos" element={<Events />} />
          <Route path="/novo" element={<CreateEvent />} />
          <Route path="/event/:eventId" element={<AppLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="programacao" element={<Schedule />} />
            <Route path="tarefas" element={<Tasks />} />
            <Route path="diretores-staffs" element={<Staff />} />
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
