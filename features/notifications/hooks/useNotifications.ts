import { useState, useEffect, useCallback, useRef } from 'react';
import { getUnreadCountApi } from '../../../api/notifications';

/**
 * Live unread-notification counter with optional polling.
 */
export function useUnreadCount(pollIntervalMs?: number) {
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(() => {
    getUnreadCountApi()
      .then((data) => setUnread(data.unread))
      .catch(() => {})
      .then(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();

    if (pollIntervalMs) {
      timerRef.current = setInterval(refresh, pollIntervalMs);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [refresh, pollIntervalMs]);

  return { unread, loading, refresh };
}
