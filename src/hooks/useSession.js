import { useCallback, useEffect, useRef, useState } from 'react';
import { transition, idleState, EVENTS } from '../utils/stateMachine.js';
import { readJSON, writeJSON, removeKey, KEYS } from '../utils/storage.js';

/**
 * Drives the "health debt" state machine with real time.
 *
 * The countdown is computed from an absolute `deadline` timestamp, never by counting
 * ticks: background tabs throttle setInterval (down to once a minute), so a tick
 * counter would drift. On every tick and on `visibilitychange` we compare
 * Date.now() with the deadline and fire the due event.
 * The state is persisted, so reloading the page does not lose the session.
 */
export function useSession(timings, { onAlert } = {}) {
  const [state, setState] = useState(() => {
    const saved = readJSON(KEYS.activeSession, null);
    return saved && saved.phase && saved.phase !== 'idle' ? saved : idleState();
  });
  const [now, setNow] = useState(() => Date.now());
  const stateRef = useRef(state);
  stateRef.current = state;
  const onAlertRef = useRef(onAlert);
  onAlertRef.current = onAlert;

  const dispatch = useCallback(
    (event) => {
      const t = Date.now();
      const prev = stateRef.current;
      const next = transition(prev, event, t, timings);
      if (next === prev) return prev;
      stateRef.current = next;
      setState(next);
      setNow(t);
      if (next.phase === 'idle') removeKey(KEYS.activeSession);
      else writeJSON(KEYS.activeSession, next);
      if (next.phase === 'alert' && prev.phase !== 'alert') onAlertRef.current?.(next);
      return next;
    },
    [timings],
  );

  // Fires the due event when the deadline has passed.
  const check = useCallback(() => {
    const t = Date.now();
    setNow(t);
    const s = stateRef.current;
    if (!s.deadline || t < s.deadline) return;
    if (s.phase === 'work') dispatch(EVENTS.WORK_ELAPSED);
    else if (s.phase === 'alert') dispatch(EVENTS.IGNORE_TIMEOUT);
  }, [dispatch]);

  useEffect(() => {
    if (state.phase === 'idle') return undefined;
    const id = setInterval(check, 1000);
    document.addEventListener('visibilitychange', check);
    check();
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', check);
    };
  }, [state.phase, check]);

  const remainingMs = state.deadline ? Math.max(0, state.deadline - now) : 0;
  return { state, dispatch, remainingMs, now };
}
