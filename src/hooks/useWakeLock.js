import { useEffect } from 'react';

/** Keep the screen awake while `active` (best-effort; unsupported browsers just ignore it). */
export function useWakeLock(active) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return undefined;
    let lock = null;
    let cancelled = false;

    const acquire = async () => {
      try {
        const l = await navigator.wakeLock.request('screen');
        if (cancelled) l.release();
        else lock = l;
      } catch {
        /* denied (low battery, hidden tab) - not fatal */
      }
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible' && (!lock || lock.released)) acquire();
    };

    acquire();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      lock?.release();
    };
  }, [active]);
}
