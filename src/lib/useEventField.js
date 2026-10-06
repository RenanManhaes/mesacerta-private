import { useCallback } from 'react';
import { useEvent } from '@/context/EventContext';
import { useAuth } from '@/lib/AuthContext';

/** Persist a user's event draft/filter in the same Supabase document as the event.
 * @param {string} key
 * @param {any} initial
 * @returns {[any, (value: any) => void]}
 */
export function useEventField(key, initial) {
  const { currentEvent, updateEventById } = useEvent();
  const { user } = useAuth();
  const eventId = currentEvent?.id;
  const userId = user?.id;
  const fallback = () => typeof initial === 'function' ? initial() : initial;
  const fields = currentEvent?.uiState?.[userId] || {};
  const value = Object.hasOwn(fields, key) ? fields[key] : fallback();
  const setValue = useCallback((next) => {
    if (!eventId || !userId) return;
    updateEventById(eventId, event => {
      const previous = event.uiState?.[userId] || {};
      const oldValue = Object.hasOwn(previous, key) ? previous[key] : fallback();
      return {...event, uiState: {...event.uiState, [userId]: {
        ...previous, [key]: typeof next === 'function' ? next(oldValue) : next,
      }}};
    });
  }, [eventId, userId, key, updateEventById, initial]);
  return [value, setValue];
}
