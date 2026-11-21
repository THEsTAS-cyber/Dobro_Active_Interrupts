/**
 * Picks exercises for a break.
 *
 * Priority: exercises for the user's health issues first, then general ones.
 * Level 0 uses only light exercises (urgency_level 0); higher levels may also
 * include more active ones (urgency_level ≤ current level), most intense first.
 * `seed` rotates the choice so consecutive breaks do not repeat.
 */
export function pickExercises(all, issueIds, level, count, seed = 0) {
  const wanted = new Set(issueIds && issueIds.length ? issueIds : []);
  const allowed = all.filter((ex) => ex.urgency_level <= level);

  const personal = allowed.filter((ex) => wanted.has(ex.issue_id));
  const general = allowed.filter((ex) => !wanted.has(ex.issue_id));

  const rotate = (list) => {
    if (list.length === 0) return list;
    // Most intense exercises first on higher levels, then rotate by seed.
    const sorted = [...list].sort((a, b) => b.urgency_level - a.urgency_level || a.id.localeCompare(b.id));
    const shift = seed % sorted.length;
    return [...sorted.slice(shift), ...sorted.slice(0, shift)];
  };

  return [...rotate(personal), ...rotate(general)].slice(0, count);
}

export function totalDurationSec(exercises) {
  return exercises.reduce((sum, ex) => sum + (ex.duration_sec || 0), 0);
}
