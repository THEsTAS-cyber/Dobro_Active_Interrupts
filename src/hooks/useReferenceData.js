import { useEffect, useState } from 'react';

/**
 * Loads the JSON reference data from public/data/.
 * Paths are built from import.meta.env.BASE_URL — an absolute "/data/..." path
 * would point outside the repository folder on GitHub Pages and return 404.
 */
const FILES = {
  issues: 'data/health-issues.json',
  exercises: 'data/exercises.json',
  tips: 'data/tips.json',
};

let cache = null; // loaded once per page view

export function dataUrl(path) {
  return `${import.meta.env.BASE_URL}${path}`;
}

async function loadAll() {
  const entries = await Promise.all(
    Object.entries(FILES).map(async ([name, path]) => {
      const response = await fetch(dataUrl(path));
      if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
      const json = await response.json();
      if (!Array.isArray(json)) throw new Error(`${path}: ожидался массив`);
      return [name, json];
    }),
  );
  return Object.fromEntries(entries);
}

export function useReferenceData() {
  const [state, setState] = useState(() =>
    cache ? { ...cache, loading: false, error: null } : { issues: [], exercises: [], tips: [], loading: true, error: null },
  );

  useEffect(() => {
    if (cache) return undefined;
    let cancelled = false;
    loadAll()
      .then((data) => {
        cache = data;
        if (!cancelled) setState({ ...data, loading: false, error: null });
      })
      .catch((error) => {
        console.error('[data] failed to load reference data', error);
        if (!cancelled) setState((s) => ({ ...s, loading: false, error: 'Не удалось загрузить справочники. Проверьте соединение и обновите страницу.' }));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

export { FILES as DATA_FILES };
