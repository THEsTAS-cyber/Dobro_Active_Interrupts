import { healthScore } from './healthROI.js';

/** Generates realistic sessions for the last `days` working days — used by the jury page. */
export function generateDemoSessions(days = 10, now = new Date()) {
  const sessions = [];
  const pattern = [
    [6, 0], [5, 1], [7, 0], [3, 2], [6, 1], [4, 0], [7, 1], [2, 3], [5, 0], [6, 0],
  ];
  let d = new Date(now);
  let i = 0;
  while (sessions.length < days) {
    d = new Date(d.getTime() - 24 * 3600 * 1000);
    if (d.getDay() === 0 || d.getDay() === 6) continue; // weekdays only
    const [done, missed] = pattern[i % pattern.length];
    const start = new Date(d);
    start.setHours(9 + (i % 2), 15 * (i % 4), 0, 0);
    sessions.push({
      id: `demo-${start.toISOString().slice(0, 10)}`,
      date: start.toISOString(),
      duration: 300 + (i % 5) * 30,
      breaksDone: done,
      breaksMissed: missed,
      healthScore: healthScore(done, missed),
    });
    i += 1;
  }
  return sessions;
}
