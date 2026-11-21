import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../AppContext.jsx';
import { useSessionContext } from '../SessionContext.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import DataTransfer from '../components/DataTransfer.jsx';
import Modal from '../components/Modal.jsx';
import { scoreVerdict } from '../utils/healthROI.js';
import { formatDate } from '../utils/format.js';

export default function Stats() {
  const { sessions, setSessions, data, announce } = useApp();
  const { lastResult } = useSessionContext();
  const [confirmClear, setConfirmClear] = useState(false);

  const latest = lastResult || sessions[0] || null;
  const totals = useMemo(() => {
    const done = sessions.reduce((s, x) => s + x.breaksDone, 0);
    const missed = sessions.reduce((s, x) => s + x.breaksMissed, 0);
    const avg = sessions.length ? Math.round(sessions.reduce((s, x) => s + x.healthScore, 0) / sessions.length) : 0;
    return { done, missed, avg };
  }, [sessions]);

  // Tip of the day: stable for a given date.
  const tip = data.tips.length ? data.tips[new Date().getDate() % data.tips.length] : null;

  return (
    <div className="container page">
      <h1 tabIndex={-1}>Статистика</h1>

      {latest ? (
        <section className="card" aria-labelledby="latest-title">
          <h2 id="latest-title">{lastResult ? 'Итог сессии' : 'Последняя сессия'}</h2>
          <ProgressBar value={latest.healthScore} label="Health ROI последней сессии" />
          <p>{scoreVerdict(latest.healthScore)}</p>
          <p className="muted">
            Перерывов: {latest.breaksDone}, пропущено: {latest.breaksMissed}, длительность: {latest.duration} мин.
            Формула: перерывы × 15 − пропуски × 25, в пределах 0–100%.
          </p>
        </section>
      ) : (
        <section className="card">
          <h2>Пока пусто</h2>
          <p>Здесь появится Health ROI после первой сессии.</p>
          <Link to="/session" className="button button--primary">Начать сессию</Link>
        </section>
      )}

      {sessions.length > 0 && (
        <>
          <section className="stats-row" aria-label="Итоги за всё время">
            <div className="stat"><p className="stat__value">{sessions.length}</p><p className="stat__label">сессий</p></div>
            <div className="stat"><p className="stat__value">{totals.done}</p><p className="stat__label">перерывов сделано</p></div>
            <div className="stat"><p className="stat__value">{totals.avg}%</p><p className="stat__label">средний Health ROI</p></div>
          </section>

          <section className="card" aria-labelledby="history-title">
            <h2 id="history-title">История сессий</h2>
            <div className="table-wrap" role="region" aria-label="Таблица истории сессий" tabIndex={0}>
              <table className="table">
                <caption className="visually-hidden">История сессий, новые сверху</caption>
                <thead>
                  <tr>
                    <th scope="col">Дата</th>
                    <th scope="col">Длительность</th>
                    <th scope="col">Сделано</th>
                    <th scope="col">Пропущено</th>
                    <th scope="col">Health ROI</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.slice(0, 50).map((s) => (
                    <tr key={s.id}>
                      <th scope="row">{formatDate(s.date)}</th>
                      <td>{s.duration} мин</td>
                      <td>{s.breaksDone}</td>
                      <td>{s.breaksMissed}</td>
                      <td>{s.healthScore}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" className="button button--ghost button--small" onClick={() => setConfirmClear(true)}>
              Очистить историю
            </button>
          </section>
        </>
      )}

      <DataTransfer />

      {tip && (
        <aside className="card card--tip" aria-label="Совет дня">
          <h2>Совет дня</h2>
          <p>{tip.text}</p>
        </aside>
      )}

      <Modal open={confirmClear} title="Очистить историю?" onClose={() => setConfirmClear(false)}>
        <p>Будут удалены все {sessions.length} сессий из этого браузера. Рекомендуем сначала скачать статистику.</p>
        <div className="button-row">
          <button
            type="button"
            className="button button--danger"
            onClick={() => {
              setSessions([]);
              setConfirmClear(false);
              announce('История очищена.');
            }}
          >
            Да, очистить
          </button>
          <button type="button" className="button button--ghost" onClick={() => setConfirmClear(false)}>Отмена</button>
        </div>
      </Modal>
    </div>
  );
}
