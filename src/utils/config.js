/**
 * Timing configuration for normal and demo modes.
 * Demo mode lets the jury walk through all urgency levels in ~2 minutes
 * instead of waiting 52 minutes for the first reminder.
 */
export const TIMINGS = {
  normal: {
    baseWorkMs: 52 * 60 * 1000, // 52 minutes of focused work
    ignoreMs: 5 * 60 * 1000, // 5 minutes without an answer counts as "ignored"
  },
  demo: {
    baseWorkMs: 20 * 1000,
    ignoreMs: 15 * 1000,
  },
};

export function getTimings(demo) {
  return demo ? TIMINGS.demo : TIMINGS.normal;
}
