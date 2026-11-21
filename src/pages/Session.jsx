import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext.jsx';
import { useSessionContext } from '../SessionContext.jsx';
import LevelBadge from '../components/LevelBadge.jsx';
import { LEVELS, workDurationMs } from '../utils/stateMachine.js';
import { formatCountdown, spokenDuration } from '../utils/format.js';
import { healthScore } from '../utils/healthROI.js';

const PERMISSION_TEXT = {
  denied: 'Системные уведомления запрещены в настройках браузера. Напоминания придут звуком и миганием заголовка вкладки — держите вкладку открытой.',
  unsupported: 'Ваш браузер не поддерживает системные уведомления. Напоминания придут звуком и миганием заголовка вкладки.',
};

export default function Session() {
  const { data, profile, settings } = useApp();
  const { state, remainingMs, timings, start, stop, breakNow, setDialogOpen, permission, testSound } = useSessionContext();
  const navigate = useNavigate();
  const issues = (profile?.issues || []).map((id) => data.issues.find((i) => i.id === id)?.title).filter(Boolean);

  const onStop = () => {
    stop();
    navigate('/stats');
  };

  if (state.phase === 'idle') {
    return (
      <div className="container page">
        <h1 tabIndex={-1}>Рабочая сессия</h1>
        <p className="lead">
          Запустите сессию в начале работы и оставьте вкладку открытой. Напоминание о перерыве придёт через{' '}
          {settings.demo ? '20 секунд (демо-режим)' : '52 минуты'}.
        </p>

        <div className="card">
          <h2>Ваш профиль</h2>
          {profile ? (
            <p>{issues.length ? `Упражнения подбираются для: ${issues.join(', ')}.` : 'Профиль не заполнен — будут общие упражнения.'}</p>
          ) : (
            <p>Профиль ещё не заполнен.</p>
          )}
          <Link to="/onboarding">{profile ? 'Изменить профиль' : 'Заполнить профиль (1 минута)'}</Link>
        </div>

        <div className="card">
          <h2>Перед стартом</h2>
          <ul>
            <li>После нажатия «Начать сессию» браузер спросит разрешение на уведомления — разрешите, чтобы напоминания приходили, даже когда вкладка свёрнута.</li>
            <li>Не закрывайте вкладку: при закрытой вкладке напоминания не работают.</li>
            {settings.demo && <li><strong>Включён демо-режим:</strong> работа — 20 сек, ожидание ответа — 15 сек.</li>}
          </ul>
          <div className="button-row">
            <button type="button" className="button button--primary button--large" onClick={start}>
              ▶ Начать сессию
            </button>
            <button type="button" className="button button--ghost" onClick={() => testSound(0)}>
              🔊 Проверить звук
            </button>
          </div>
        </div>
      </div>
    );
  }

  const lvl = LEVELS[state.level];
  const intervalMs = state.phase === 'work' ? workDurationMs(state.level, timings) : timings.ignoreMs;
  const progress = intervalMs ? Math.round(100 - (remainingMs / intervalMs) * 100) : 0;

  return (
    <div className="container page">
      <h1 tabIndex={-1}>Рабочая сессия</h1>

      {PERMISSION_TEXT[permission] && <p className="alert alert--warn">{PERMISSION_TEXT[permission]}</p>}

      <section className={`timer-card timer-card--level${state.level}`} aria-labelledby="timer-title">
        <LevelBadge level={state.level} />
        <h2 id="timer-title" className="timer-card__title">
          {state.phase === 'work' ? 'До следующего перерыва' : 'Перерыв! Ожидаем ответа'}
        </h2>
        <p className="timer" role="timer" aria-live="off" aria-label={`Осталось ${spokenDuration(remainingMs)}`}>
          {formatCountdown(remainingMs)}
        </p>
        <div className="timer-bar" aria-hidden="true"><div style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} /></div>
        <p className="muted">
          {state.phase === 'work'
            ? `Интервал работы на этом уровне: ${Math.round(workDurationMs(state.level, timings) / 60000) || '<1'} мин. На перерыве — ${lvl.exercises} упр.`
            : 'Если не ответить, перерыв засчитается как пропущенный и «долг здоровья» вырастет.'}
        </p>
        <div className="button-row button-row--center">
          {state.phase === 'work' ? (
            <button type="button" className="button button--primary" onClick={breakNow}>Сделать перерыв сейчас</button>
          ) : (
            <button type="button" className="button button--primary" onClick={() => setDialogOpen(true)}>Открыть упражнения</button>
          )}
          <button type="button" className="button button--ghost" onClick={onStop}>Завершить сессию</button>
        </div>
      </section>

      <section className="stats-row" aria-label="Показатели текущей сессии">
        <div className="stat"><p className="stat__value">{state.breaksDone}</p><p className="stat__label">перерывов сделано</p></div>
        <div className="stat"><p className="stat__value">{state.breaksMissed}</p><p className="stat__label">пропущено</p></div>
        <div className="stat"><p className="stat__value">{healthScore(state.breaksDone, state.breaksMissed)}%</p><p className="stat__label">Health ROI сейчас</p></div>
      </section>
    </div>
  );
}
