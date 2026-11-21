/**
 * "Health debt" state machine.
 *
 * The session cycles between two phases:
 *   - "work":  the user is working, a countdown runs until the next break;
 *   - "alert": the break is due, the user is asked to do exercises.
 *
 * Every ignored or declined break raises the urgency level (max 2):
 * the next work interval gets shorter and the break gets more exercises.
 * Doing the break ("Отметился") pays the debt off and resets the level to 0.
 *
 * | Level | Work interval  | Exercises | Recommended rest |
 * |-------|----------------|-----------|------------------|
 * | 0     | base (52 min)  | 1–2       | 5 min            |
 * | 1     | base × 0.6     | 3         | 10 min           |
 * | 2     | base × 0.3     | 4–5       | 15 min           |
 *
 * All functions are pure: time is passed in explicitly, which makes the
 * machine deterministic and unit-testable (see tests/stateMachine.test.js).
 */

export const MAX_LEVEL = 2;

export const LEVELS = [
  { level: 0, name: 'Норма', workFactor: 1, exercises: 2, restMin: 5 },
  { level: 1, name: 'Долг', workFactor: 0.6, exercises: 3, restMin: 10 },
  { level: 2, name: 'Критический', workFactor: 0.3, exercises: 5, restMin: 15 },
];

export const EVENTS = Object.freeze({
  START: 'START',
  WORK_ELAPSED: 'WORK_ELAPSED', // work countdown reached zero
  CHECKED_IN: 'CHECKED_IN', // "Отметился": the break was done
  CANT: 'CANT', // "Не могу": the user declined the break
  IGNORE_TIMEOUT: 'IGNORE_TIMEOUT', // no answer within the ignore window
  STOP: 'STOP',
});

/** Work interval length for a given level, in milliseconds. */
export function workDurationMs(level, timings) {
  return Math.round(timings.baseWorkMs * LEVELS[level].workFactor);
}

export function idleState() {
  return { phase: 'idle', level: 0, deadline: null, breaksDone: 0, breaksMissed: 0, startedAt: null, alertAt: null };
}

function startWork(state, level, now, timings) {
  return { ...state, phase: 'work', level, deadline: now + workDurationMs(level, timings), alertAt: null };
}

/**
 * Returns the next state. Unknown or out-of-phase events leave the state unchanged,
 * so a late timer tick can never corrupt the session.
 */
export function transition(state, event, now, timings) {
  switch (event) {
    case EVENTS.START:
      if (state.phase !== 'idle') return state;
      return startWork({ ...idleState(), startedAt: now }, 0, now, timings);

    case EVENTS.WORK_ELAPSED:
      if (state.phase !== 'work') return state;
      // The break is due: give the user `ignoreMs` to react.
      return { ...state, phase: 'alert', alertAt: now, deadline: now + timings.ignoreMs };

    case EVENTS.CHECKED_IN:
      if (state.phase !== 'alert') return state;
      // Debt paid: back to the normal level.
      return startWork({ ...state, breaksDone: state.breaksDone + 1 }, 0, now, timings);

    case EVENTS.CANT:
    case EVENTS.IGNORE_TIMEOUT: {
      if (state.phase !== 'alert') return state;
      // Debt grows: escalate (capped at MAX_LEVEL) and shorten the next interval.
      const level = Math.min(state.level + 1, MAX_LEVEL);
      return startWork({ ...state, breaksMissed: state.breaksMissed + 1 }, level, now, timings);
    }

    case EVENTS.STOP:
      return idleState();

    default:
      return state;
  }
}
