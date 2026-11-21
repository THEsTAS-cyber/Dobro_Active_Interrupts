import { useRef } from 'react';
import Modal from './Modal.jsx';
import ExerciseCard from './ExerciseCard.jsx';
import LevelBadge from './LevelBadge.jsx';
import { useSessionContext } from '../SessionContext.jsx';
import { useApp } from '../AppContext.jsx';
import { LEVELS } from '../utils/stateMachine.js';
import { formatCountdown } from '../utils/format.js';
import { totalDurationSec } from '../utils/exercises.js';

/** Global break dialog — opens on any page when a break is due. */
export default function BreakDialog() {
  const { state, remainingMs, exercises, dialogOpen, setDialogOpen, checkIn, cant } = useSessionContext();
  const { data } = useApp();
  const checkInRef = useRef(null);
  if (state.phase !== 'alert') return null;

  const lvl = LEVELS[state.level];
  const issueTitle = (id) => data.issues.find((i) => i.id === id)?.title || 'Для всех';
  const totalMin = Math.max(1, Math.round(totalDurationSec(exercises) / 60));

  return (
    <Modal
      open={dialogOpen}
      title="Пора сделать перерыв"
      onClose={() => setDialogOpen(false)}
      initialFocusRef={checkInRef}
      tone={`level${state.level}`}
      describedBy="break-desc"
    >
      <div id="break-desc" className="break-intro">
        <LevelBadge level={state.level} />
        <p>
          {state.level === 0 && 'Короткая разминка — тело скажет спасибо.'}
          {state.level === 1 && 'Перерыв уже пропускали — «долг здоровья» растёт. Упражнений больше, следующий перерыв раньше.'}
          {state.level === 2 && 'Критический уровень: вы давно не двигались. Пожалуйста, встаньте из-за стола прямо сейчас.'}
        </p>
        <p className="muted">
          Упражнения займут около {totalMin} мин. Рекомендуемый отдых — {lvl.restMin} мин.
        </p>
        <p className="muted">
          Если не ответить, через <strong>{formatCountdown(remainingMs)}</strong> перерыв засчитается как пропущенный.
        </p>
      </div>

      <div className="exercise-list">
        {exercises.map((ex) => (
          <ExerciseCard key={ex.id} exercise={ex} issueTitle={issueTitle(ex.issue_id)} />
        ))}
      </div>

      <div className="button-row button-row--sticky">
        <button ref={checkInRef} type="button" className="button button--primary" onClick={checkIn}>
          ✅ Отметился — сделал перерыв
        </button>
        <button type="button" className="button button--ghost" onClick={cant}>
          Не могу сейчас
        </button>
      </div>
    </Modal>
  );
}
