/**
 * Health ROI — "return on investment" in health for one session.
 *
 *   HealthScore = clamp(breaksDone × 15 − breaksMissed × 25, 0, 100)
 *
 * A missed break costs more than a done break earns: skipping is punished
 * harder to motivate regular pauses. 7 done breaks without misses = 100%.
 */
export const POINTS_PER_BREAK = 15;
export const PENALTY_PER_MISS = 25;

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function healthScore(breaksDone, breaksMissed) {
  const done = Math.max(0, Number(breaksDone) || 0);
  const missed = Math.max(0, Number(breaksMissed) || 0);
  return clamp(done * POINTS_PER_BREAK - missed * PENALTY_PER_MISS, 0, 100);
}

/** Short verbal verdict for the stats screen. */
export function scoreVerdict(score) {
  if (score >= 80) return 'Отличный день — тело скажет спасибо.';
  if (score >= 45) return 'Хороший результат, но есть куда расти.';
  if (score > 0) return 'Перерывов было мало — попробуйте не пропускать следующие.';
  return 'Сегодня перерывы не случились. Начните с одного — это уже победа.';
}
