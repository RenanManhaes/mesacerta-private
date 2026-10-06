import React, { useState } from 'react';
import { Outlet, useParams, useLocation, Link, Navigate } from 'react-router-dom';
import { SidebarContent } from './Sidebar';
import {canOpenModule,eventHome} from '@/lib/eventAccess';
import TopBar from './TopBar';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useEvent } from '@/context/EventContext';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AppLayout() {
  const { eventId } = useParams();
  const location = useLocation();
  const { setCurrentEventId, currentEvent, events, eventAccess } = useEvent();
  const [mobileOpen, setMobileOpen] = useState(false);

  React.useEffect(() => {
    if (eventId) setCurrentEventId(eventId);
  }, [eventId, setCurrentEventId]);

  const access = eventAccess[eventId];
  const route = location.pathname.split('/')[3] || 'dashboard';
  if (access && !canOpenModule(access.role,route)) return <Navigate to={eventHome(eventId,access)} replace />;

  return (
    <div className="platform-ui min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="platform-sidebar hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col border-r border-border bg-card z-30">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <div className="lg:hidden">
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="fixed left-3 top-2.5 z-40 h-9 w-9" aria-label="Menu">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
        </div>
        <SheetContent side="left" className="platform-ui platform-sidebar platform-mobile-sidebar w-72 p-0 bg-card">
          <SheetTitle className="sr-only">Menu do evento</SheetTitle>
          <SheetDescription className="sr-only">Navegue pelos módulos do seu evento.</SheetDescription>
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="lg:pl-64">
        <TopBar />
        <main key={location.pathname} className="platform-main platform-page-enter px-5 sm:px-8 lg:px-9 py-6 lg:py-8 max-w-[1400px] mx-auto">
          {!events.some(event => event.id === eventId) ? (
            <div><h1>Evento não encontrado</h1><Link to="/eventos" className="text-info">Voltar para meus eventos</Link></div>
          ) : currentEvent?.id === eventId ? <Outlet /> : <p role="status">Abrindo evento…</p>}
        </main>
      </div>
    </div>
  );
}
