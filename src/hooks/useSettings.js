import { useCallback, useEffect, useState } from 'react';
import { DEFAULTS, normalizeSettings } from '../lib/workout.js';

const STORAGE_KEY = 'workout-timer:settings:v1';

function load() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return normalizeSettings(raw ? JSON.parse(raw) : null);
  } catch {
    return { ...DEFAULTS };
  }
}

export function useSettings() {
  const [settings, setSettings] = useState(load);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      /* storage unavailable (private mode, quota) - settings just won't persist */
    }
  }, [settings]);

  const update = useCallback(
    (patch) => setSettings((prev) => normalizeSettings({ ...prev, ...patch })),
    [],
  );
  const restoreDefaults = useCallback(() => setSettings({ ...DEFAULTS }), []);

  return [settings, update, restoreDefaults];
}
