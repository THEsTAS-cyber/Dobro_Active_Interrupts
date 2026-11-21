import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage.js';
import { useReferenceData } from './hooks/useReferenceData.js';
import { KEYS } from './utils/storage.js';

const AppContext = createContext(null);

/** Demo mode can be switched on by ?demo=1 either before or inside the hash (#/session?demo=1). */
function demoFromUrl() {
  const fromSearch = new URLSearchParams(window.location.search).get('demo');
  const hashQuery = window.location.hash.split('?')[1] || '';
  const fromHash = new URLSearchParams(hashQuery).get('demo');
  const v = fromHash ?? fromSearch;
  return v === null ? null : v === '1' || v === 'true';
}

export function AppProvider({ children }) {
  const data = useReferenceData();
  const [settings, setSettings, settingsError] = useLocalStorage(KEYS.settings, { demo: false, sound: true });
  const [profile, setProfile, profileError] = useLocalStorage(KEYS.healthProfile, null);
  const [sessions, setSessions, sessionsError] = useLocalStorage(KEYS.sessions, []);

  // Apply ?demo=1 once on first render.
  const urlApplied = useRef(false);
  if (!urlApplied.current) {
    urlApplied.current = true;
    const demo = demoFromUrl();
    if (demo !== null && demo !== settings.demo) setTimeout(() => setSettings((s) => ({ ...s, demo })), 0);
  }

  // Global polite live region for screen-reader announcements.
  const [announcement, setAnnouncement] = useState('');
  const announce = useCallback((text) => {
    setAnnouncement('');
    setTimeout(() => setAnnouncement(text), 50); // re-set so identical messages are re-announced
  }, []);

  const value = useMemo(
    () => ({
      data,
      settings,
      setSettings,
      profile,
      setProfile,
      sessions: Array.isArray(sessions) ? sessions : [],
      setSessions,
      storageError: settingsError || profileError || sessionsError,
      announce,
    }),
    [data, settings, setSettings, profile, setProfile, sessions, setSessions, settingsError, profileError, sessionsError, announce],
  );

  return (
    <AppContext.Provider value={value}>
      {children}
      <div className="visually-hidden" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
