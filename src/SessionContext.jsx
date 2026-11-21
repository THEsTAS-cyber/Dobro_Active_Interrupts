import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useApp } from './AppContext.jsx';
import { useSession } from './hooks/useSession.js';
import { useNotifications } from './hooks/useNotifications.js';
import { getTimings } from './utils/config.js';
import { EVENTS, LEVELS } from './utils/stateMachine.js';
import { pickExercises } from './utils/exercises.js';
import { healthScore } from './utils/healthROI.js';

const SessionContext = createContext(null);

/**
 * Session lives at the app level (not inside the Session page), so reminders keep
 * firing while the user browses the stats or the jury page.
 */
export function SessionProvider({ children }) {
  const { settings, profile, data, setSessions, announce } = useApp();
  const timings = getTimings(settings.demo);
  const notifications = useNotifications({ soundEnabled: settings.sound });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const onAlert = useCallback(
    (s) => {
      const lvl = LEVELS[s.level];
      setDialogOpen(true);
      notifications.remind(s.level, `Уровень «${lvl.name}»: ${lvl.exercises} упр., около ${lvl.restMin} мин. Нажмите, чтобы открыть.`);
      announce(`Пора сделать перерыв. Уровень срочности: ${lvl.name}.`);
    },
    [notifications, announce],
  );

  const { state, dispatch, remainingMs } = useSession(timings, { onAlert });

  // Exercises for the current break; the seed rotates them between breaks.
  const exercises = useMemo(() => {
    const count = LEVELS[state.level].exercises;
    const seed = state.breaksDone + state.breaksMissed;
    return pickExercises(data.exercises, profile?.issues || [], state.level, count, seed);
  }, [data.exercises, profile, state.level, state.breaksDone, state.breaksMissed]);

  const start = useCallback(async () => {
    await notifications.prime(); // inside the click: unlocks audio + asks permission
    dispatch(EVENTS.START);
    announce('Сессия началась. Мы напомним о перерыве.');
  }, [notifications, dispatch, announce]);

  const answer = useCallback(
    (event) => {
      const next = dispatch(event);
      setDialogOpen(false);
      notifications.stopBlink();
      if (event === EVENTS.CHECKED_IN) announce('Отлично! Уровень срочности сброшен до нормы.');
      else announce(`Перерыв пропущен. Уровень срочности: ${LEVELS[next.level].name}. Следующий перерыв раньше.`);
    },
    [dispatch, notifications, announce],
  );

  /** Ends the session and saves it to history. Returns the saved record (or null if nothing happened). */
  const stop = useCallback(() => {
    const s = state;
    const minutes = s.startedAt ? Math.round((Date.now() - s.startedAt) / 60000) : 0;
    dispatch(EVENTS.STOP);
    setDialogOpen(false);
    notifications.stopBlink();
    const record = {
      id: `s-${s.startedAt || Date.now()}`,
      date: new Date(s.startedAt || Date.now()).toISOString(),
      duration: minutes,
      breaksDone: s.breaksDone,
      breaksMissed: s.breaksMissed,
      healthScore: healthScore(s.breaksDone, s.breaksMissed),
    };
    setLastResult(record);
    if (s.breaksDone + s.breaksMissed > 0 || minutes >= 1) {
      setSessions((prev) => [record, ...(Array.isArray(prev) ? prev : []).filter((x) => x.id !== record.id)]);
    }
    announce(`Сессия завершена. Вы сохранили ${record.healthScore}% дневного ресурса.`);
    return record;
  }, [state, dispatch, notifications, setSessions, announce]);

  // In-dialog early break: lets the user (and the jury) trigger a break now.
  const breakNow = useCallback(() => dispatch(EVENTS.WORK_ELAPSED), [dispatch]);

  const value = {
    state,
    remainingMs,
    timings,
    exercises,
    dialogOpen,
    setDialogOpen,
    permission: notifications.permission,
    start,
    stop,
    breakNow,
    checkIn: () => answer(EVENTS.CHECKED_IN),
    cant: () => answer(EVENTS.CANT),
    lastResult,
    // Unlocks audio inside the click (without asking for notifications) and plays a sample.
    testSound: async (level = 0) => {
      await notifications.prime({ askPermission: false });
      notifications.playSound(level);
    },
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSessionContext() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSessionContext must be used inside <SessionProvider>');
  return ctx;
}
