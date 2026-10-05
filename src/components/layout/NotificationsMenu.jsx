import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useEvent } from '@/context/EventContext';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/api/supabaseClient';
import { eventNotifications, unreadOf } from '@/lib/notifications';

// MCT-53: sino com menu de notificações. Leitura persistida em public.notification_reads.
export default function NotificationsMenu() {
  const { currentEvent, orgId } = useEvent();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [readKeys, setReadKeys] = useState(() => new Set());
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const eventId = currentEvent?.id;

  const list = useMemo(() => eventNotifications(currentEvent), [currentEvent]);
  const unread = useMemo(() => unreadOf(list, readKeys), [list, readKeys]);

  useEffect(() => {
    if (!user?.id || !eventId) return undefined;
    let cancelled = false;
    setLoaded(false);
    setError('');
    (async () => {
      const { data, error: err } = await supabase
        .from('notification_reads')
        .select('notification_key')
        .eq('user_id', user.id)
        .eq('event_id', eventId);
      if (cancelled) return;
      if (err) setError('Não foi possível carregar o estado de leitura.');
      setReadKeys(new Set((data || []).map((r) => r.notification_key)));
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [user?.id, eventId]);

  const markAll = useCallback(async () => {
    if (!unread.length || !user?.id || !orgId) return;
    setError('');
    const rows = unread.map((n) => ({ user_id: user.id, organization_id: orgId, event_id: eventId, notification_key: n.key }));
    const { error: err } = await supabase
      .from('notification_reads')
      .upsert(rows, { onConflict: 'user_id,event_id,notification_key' });
    if (err) { setError('Não foi possível marcar como lidas. Tente novamente.'); return; }
    setReadKeys((prev) => new Set([...prev, ...rows.map((r) => r.notification_key)]));
  }, [unread, user?.id, orgId, eventId]);

  const go = (n) => { setOpen(false); navigate(`/event/${eventId}/${n.to}`); };
  const showDot = loaded && unread.length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 relative" aria-label={showDot ? `Notificações (${unread.length} não lidas)` : 'Notificações'}>
          <Bell className="h-4 w-4" />
          {showDot && <span data-testid="notification-dot" className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-danger" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <p className="text-[13px] font-semibold">Notificações</p>
          <Button variant="ghost" size="sm" className="h-7 text-xs" disabled={!unread.length} onClick={markAll}>Marcar como lidas</Button>
        </div>
        {error && <p role="alert" className="px-3 py-2 text-xs text-danger">{error}</p>}
        {list.length === 0 ? (
          <p role="status" className="px-3 py-6 text-center text-[13px] text-muted-foreground">Você não tem notificações por enquanto.</p>
        ) : (
          <ul className="max-h-80 overflow-auto p-1.5">
            {list.map((n) => {
              const isUnread = !readKeys.has(n.key);
              return (
                <li key={n.key}>
                  <button type="button" onClick={() => go(n)} className="flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left hover:bg-secondary">
                    <i aria-hidden className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${isUnread ? 'bg-danger' : 'bg-transparent'}`} />
                    <span className="min-w-0">
                      <span className={`block text-[13px] ${isUnread ? 'font-semibold' : ''}`}>{n.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">{n.detail}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
