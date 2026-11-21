/**
 * Safe wrapper around localStorage.
 *
 * localStorage can fail in several ways, and none of them may crash the app:
 *   - it is unavailable (private mode in some browsers, disabled cookies) → SecurityError;
 *   - it is full → QuotaExceededError;
 *   - a value was edited by hand / corrupted → JSON.parse throws.
 * Keys are namespaced and versioned (dab.v1.*) so a future format change can migrate cleanly.
 */
export const STORAGE_PREFIX = 'dab.v1.';

export const KEYS = Object.freeze({
  healthProfile: `${STORAGE_PREFIX}healthProfile`,
  sessions: `${STORAGE_PREFIX}sessions`,
  activeSession: `${STORAGE_PREFIX}activeSession`,
  settings: `${STORAGE_PREFIX}settings`,
});

const MAX_SESSIONS = 500; // keeps storage well below the ~5 MB browser quota

function getStore() {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null; // SecurityError when storage is blocked
  }
}

export function isQuotaError(error) {
  return (
    error instanceof DOMException &&
    (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED' || error.code === 22)
  );
}

/** Reads and parses a JSON value; returns `fallback` if missing or corrupted. */
export function readJSON(key, fallback) {
  const store = getStore();
  if (!store) return fallback;
  try {
    const raw = store.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch (error) {
    console.warn(`[storage] corrupted value under "${key}", using default`, error);
    return fallback;
  }
}

/**
 * Writes a JSON value. Returns { ok: true } or { ok: false, reason, message }.
 * On QuotaExceededError for the sessions list, the oldest sessions are trimmed and the write retried once.
 */
export function writeJSON(key, value) {
  const store = getStore();
  if (!store) return { ok: false, reason: 'unavailable', message: 'Хранилище браузера недоступно (возможно, приватный режим). Данные не сохранятся после закрытия вкладки.' };
  try {
    store.setItem(key, JSON.stringify(value));
    return { ok: true };
  } catch (error) {
    if (isQuotaError(error)) {
      if (key === KEYS.sessions && Array.isArray(value) && value.length > 10) {
        // Keep the newest half and retry once.
        return writeJSON(key, value.slice(0, Math.floor(value.length / 2)));
      }
      return { ok: false, reason: 'quota', message: 'Хранилище браузера переполнено. Скачайте статистику и очистите старые данные.' };
    }
    return { ok: false, reason: 'unknown', message: 'Не удалось сохранить данные.' };
  }
}

export function removeKey(key) {
  const store = getStore();
  try {
    store?.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function loadSessions() {
  const value = readJSON(KEYS.sessions, []);
  return Array.isArray(value) ? value : [];
}

export function saveSessions(sessions) {
  return writeJSON(KEYS.sessions, sessions.slice(0, MAX_SESSIONS));
}

/** Snapshot of all app keys — used by the jury page. */
export function dumpAll() {
  return Object.entries(KEYS).map(([name, key]) => {
    const store = getStore();
    let raw = null;
    try {
      raw = store?.getItem(key) ?? null;
    } catch {
      raw = null;
    }
    return { name, key, raw, bytes: raw ? new Blob([raw]).size : 0 };
  });
}

export function clearAll() {
  Object.values(KEYS).forEach(removeKey);
}
