import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../AppContext.jsx';
import { dumpAll, clearAll, KEYS } from '../utils/storage.js';
import { generateDemoSessions } from '../utils/demoData.js';
import { mergeSessions } from '../utils/exportData.js';
import { dataUrl, DATA_FILES } from '../hooks/useReferenceData.js';
import DataTransfer from '../components/DataTransfer.jsx';
import Modal from '../components/Modal.jsx';

/**
 * Jury page: shows how data is stored and lets the jury verify it
 * (criterion 4.2 "Работа с данными" and rule 3.3 — full access to the data).
 */
export default function Jury() {
  const { data, sessions, setSessions, profile, setProfile, settings, setSettings, announce } = useApp();
  const [, refresh] = useState(0);
  const [confirmClear, setConfirmClear] = useState(false);
  const dump = dumpAll();

  const fillDemo = () => {
    const { merged, added } = mergeSessions(sessions, generateDemoSessions(10));
    setSessions(merged);
    if (!profile) setProfile({ issues: ['neck', 'eyes', 'back'] });
    announce(`Добавлено демо-сессий: ${added}.`);
    refresh((n) => n + 1);
  };

  const wipe = () => {
    clearAll();
    setSessions([]);
    setProfile(null);
    setSettings({ demo: settings.demo, sound: settings.sound });
    setConfirmClear(false);
    announce('Все данные приложения удалены.');
    refresh((n) => n + 1);
  };

  const base = `${window.location.origin}${import.meta.env.BASE_URL}`;

  return (
    <div className="container page">
      <h1 tabIndex={-1}>Для жюри</h1>
      <p className="lead">Эта страница показывает, как устроены данные приложения, и позволяет проверить все функции за несколько минут.</p>

      <section className="card" aria-labelledby="quick-title">
        <h2 id="quick-title">Быстрая проверка (3 минуты)</h2>
        <ol>
          <li>
            Включите <strong>демо-режим</strong>: {settings.demo ? 'уже включён ✅' : (
              <button type="button" className="button button--small" onClick={() => setSettings((s) => ({ ...s, demo: true }))}>Включить</button>
            )}{' '}
            — работа 20 сек вместо 52 мин, ожидание ответа 15 сек. Ссылка для проверки: <code>{base}?demo=1#/session</code>
          </li>
          <li>Откройте <Link to="/session">Сессию</Link> и нажмите «Начать сессию», разрешите уведомления.</li>
          <li>Переключитесь на другую вкладку — через 20 сек придут системное уведомление, звук, а заголовок вкладки начнёт мигать.</li>
          <li>В окне перерыва нажмите «Не могу» (или подождите 15 сек) — уровень вырастет до 1, затем до 2. «Отметился» сбрасывает уровень до 0.</li>
          <li>Нажмите «Завершить сессию» — на странице статистики появится Health ROI.</li>
          <li>Всё это можно пройти только клавиатурой: <kbd>Tab</kbd>, <kbd>Shift</kbd>+<kbd>Tab</kbd>, <kbd>Enter</kbd>, <kbd>Пробел</kbd>, <kbd>Esc</kbd>.</li>
        </ol>
      </section>

      <section className="card" aria-labelledby="storage-title">
        <h2 id="storage-title">Как хранятся данные</h2>
        <p>
          Серверная база данных не используется: сайт размещён на GitHub Pages и работает без внешних сервисов, данные пользователя не покидают его
          устройство. Справочники — статические JSON-файлы, пользовательские данные — <code>localStorage</code> с версионированными ключами.
        </p>
        <h3>Справочники (JSON)</h3>
        <ul>
          {Object.entries(DATA_FILES).map(([name, path]) => (
            <li key={name}>
              <a href={dataUrl(path)} target="_blank" rel="noopener noreferrer">
                {path}<span className="visually-hidden"> (откроется в новой вкладке)</span>
              </a>{' '}
              — записей: {data[name]?.length ?? 0}
            </li>
          ))}
        </ul>

        <h3>Хранилище браузера (localStorage)</h3>
        <div className="table-wrap" role="region" aria-label="Ключи localStorage" tabIndex={0}>
          <table className="table">
            <thead>
              <tr><th scope="col">Ключ</th><th scope="col">Назначение</th><th scope="col">Размер</th><th scope="col">Содержимое</th></tr>
            </thead>
            <tbody>
              {dump.map((row) => (
                <tr key={row.key}>
                  <th scope="row"><code>{row.key}</code></th>
                  <td>{PURPOSE[row.name]}</td>
                  <td>{row.bytes} Б</td>
                  <td className="cell-code">{row.raw ? <code>{truncate(row.raw)}</code> : <span className="muted">пусто</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3>Структура записи сессии</h3>
        <pre className="code-block" tabIndex={0}>{`{
  "id": "s-1763712000000",       // уникальный ключ, защищает от дублей при импорте
  "date": "2026-11-21T09:00:00Z", // ISO 8601
  "duration": 312,                // минуты
  "breaksDone": 5,                // целое ≥ 0
  "breaksMissed": 1,              // целое ≥ 0
  "healthScore": 50               // 0–100, всегда пересчитывается по формуле
}`}</pre>

        <div className="button-row">
          <button type="button" className="button button--primary" onClick={fillDemo}>Заполнить демо-данными</button>
          <button type="button" className="button button--danger" onClick={() => setConfirmClear(true)}>Удалить все данные</button>
        </div>
      </section>

      <DataTransfer />

      <section className="card" aria-labelledby="errors-title">
        <h2 id="errors-title">Обработка ошибок</h2>
        <ul>
          <li><strong>Переполнение хранилища</strong> (<code>QuotaExceededError</code>): старые сессии обрезаются, пользователь видит предупреждение.</li>
          <li><strong>Хранилище недоступно</strong> (приватный режим): приложение работает, но предупреждает, что данные не сохранятся.</li>
          <li><strong>Повреждённые данные</strong>: невалидный JSON в хранилище заменяется значением по умолчанию, приложение не падает.</li>
          <li><strong>Импорт</strong>: проверяются версия формата, типы, даты, диапазоны; некорректные записи пропускаются с объяснением, дубликаты не создаются.</li>
        </ul>
        <p>Логика покрыта автотестами (<code>npm test</code>): конечный автомат, формула Health ROI, экспорт/импорт, целостность справочников.</p>
      </section>

      <Modal open={confirmClear} title="Удалить все данные?" onClose={() => setConfirmClear(false)}>
        <p>Будут удалены профиль, история сессий и активная сессия из этого браузера (<code>{Object.values(KEYS).length}</code> ключей).</p>
        <div className="button-row">
          <button type="button" className="button button--danger" onClick={wipe}>Да, удалить</button>
          <button type="button" className="button button--ghost" onClick={() => setConfirmClear(false)}>Отмена</button>
        </div>
      </Modal>
    </div>
  );
}

const PURPOSE = {
  healthProfile: 'Профиль здоровья (выбранные проблемы)',
  sessions: 'История сессий',
  activeSession: 'Текущая сессия (переживает перезагрузку)',
  settings: 'Настройки: демо-режим, звук',
};

function truncate(text, max = 160) {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}
