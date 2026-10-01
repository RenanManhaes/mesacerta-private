import React, { useState } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { SidebarContent } from './Sidebar';
import TopBar from './TopBar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useEvent } from '@/context/EventContext';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AppLayout() {
  const { eventId } = useParams();
  const { setCurrentEventId } = useEvent();
  const [mobileOpen, setMobileOpen] = useState(false);

  React.useEffect(() => {
    if (eventId) setCurrentEventId(eventId);
  }, [eventId, setCurrentEventId]);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-60 flex-col border-r border-border bg-sidebar z-30">
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
        <SheetContent side="left" className="w-72 p-0">
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="lg:pl-60">
        <TopBar />
        <main className="px-5 sm:px-8 lg:px-12 py-6 lg:py-8 max-w-[1400px] mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
