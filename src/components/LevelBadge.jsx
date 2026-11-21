import { LEVELS } from '../utils/stateMachine.js';

const ICONS = ['🟢', '🟠', '🔴'];

/** Shows the urgency level with text + icon (color is never the only signal — WCAG 1.4.1). */
export default function LevelBadge({ level }) {
  return (
    <span className={`badge badge--level${level}`}>
      <span aria-hidden="true">{ICONS[level]}</span> Уровень {level}: {LEVELS[level].name}
    </span>
  );
}
