import { useCallback, useState } from 'react';
import { readJSON, writeJSON } from '../utils/storage.js';

/**
 * React state mirrored to localStorage.
 * Returns [value, setValue, error] — `error` holds a user-facing message when the
 * last write failed (quota exceeded, storage unavailable); the in-memory value is
 * still updated so the app keeps working for the current visit.
 */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => readJSON(key, initialValue));
  const [error, setError] = useState(null);

  const update = useCallback(
    (next) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? next(prev) : next;
        const result = writeJSON(key, resolved);
        setError(result.ok ? null : result.message);
        return resolved;
      });
    },
    [key],
  );

  return [value, update, error];
}
