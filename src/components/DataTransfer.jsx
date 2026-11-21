import { useRef, useState } from 'react';
import Modal from './Modal.jsx';
import { useApp } from '../AppContext.jsx';
import { toJSON, toCSV, parseImport, mergeSessions } from '../utils/exportData.js';

function download(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * "Скачать статистику" (JSON / CSV) and "Загрузить статистику" (File API + validation).
 * Before changing data the user chooses: merge with current history or replace it.
 */
export default function DataTransfer() {
  const { profile, setProfile, sessions, setSessions, data, announce } = useApp();
  const fileRef = useRef(null);
  const [pending, setPending] = useState(null); // parsed file awaiting confirmation
  const [message, setMessage] = useState(null); // { type: 'ok' | 'error', text }

  const stamp = new Date().toISOString().slice(0, 10);

  const onExportJSON = () => {
    download(`active-breaks-${stamp}.json`, toJSON(profile, sessions), 'application/json');
    announce('Файл JSON скачан.');
  };
  const onExportCSV = () => {
    download(`active-breaks-${stamp}.csv`, toCSV(sessions), 'text/csv;charset=utf-8');
    announce('Файл CSV скачан.');
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow choosing the same file again
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parseImport(text, file.name, data.issues.map((i) => i.id));
      if (parsed.sessions.length === 0 && !parsed.healthProfile) {
        throw new Error(`В файле нет корректных записей.${parsed.skipped.length ? ` Пропущено: ${parsed.skipped.length}.` : ''}`);
      }
      setPending({ ...parsed, fileName: file.name });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Не удалось прочитать файл.' });
    }
  };

  const apply = (mode) => {
    const p = pending;
    let added = p.sessions.length;
    let duplicates = 0;
    if (mode === 'replace') {
      setSessions([...p.sessions].sort((a, b) => new Date(b.date) - new Date(a.date)));
    } else {
      const result = mergeSessions(sessions, p.sessions);
      added = result.added;
      duplicates = result.duplicates;
      setSessions(result.merged);
    }
    if (p.healthProfile) setProfile(p.healthProfile);
    const parts = [`Импортировано записей: ${added}`];
    if (duplicates) parts.push(`уже были в истории: ${duplicates}`);
    if (p.skipped.length) parts.push(`пропущено как некорректные: ${p.skipped.length}`);
    if (p.fixed) parts.push(`исправлен Health ROI: ${p.fixed}`);
    setMessage({ type: 'ok', text: parts.join(', ') + '.', details: p.skipped });
    setPending(null);
  };

  return (
    <section className="card" aria-labelledby="transfer-title">
      <h2 id="transfer-title">Мои данные</h2>
      <p className="muted">Скачайте историю, чтобы перенести её на другое устройство или открыть в Excel. Данные никуда не отправляются.</p>
      <div className="button-row">
        <button type="button" className="button" onClick={onExportJSON} disabled={!sessions.length && !profile}>
          Скачать статистику (JSON)
        </button>
        <button type="button" className="button" onClick={onExportCSV} disabled={!sessions.length}>
          Скачать таблицу (CSV)
        </button>
        <button type="button" className="button button--ghost" onClick={() => fileRef.current?.click()}>
          Загрузить статистику
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,.csv,application/json,text/csv"
          className="visually-hidden"
          tabIndex={-1}
          aria-hidden="true"
          onChange={onFile}
        />
      </div>

      {message && (
        <div className={`alert alert--${message.type === 'ok' ? 'ok' : 'error'}`} role={message.type === 'ok' ? 'status' : 'alert'}>
          <p>{message.text}</p>
          {message.details?.length > 0 && (
            <details>
              <summary>Почему записи пропущены</summary>
              <ul>
                {message.details.slice(0, 20).map((d) => <li key={d}>{d}</li>)}
              </ul>
            </details>
          )}
        </div>
      )}

      <Modal open={!!pending} title="Загрузить статистику?" onClose={() => setPending(null)}>
        {pending && (
          <>
            <p>
              Файл <strong>{pending.fileName}</strong>: корректных сессий — {pending.sessions.length}
              {pending.skipped.length > 0 && `, некорректных (будут пропущены) — ${pending.skipped.length}`}
              {pending.healthProfile && ', профиль здоровья — есть'}.
            </p>
            <p>Сейчас в истории сессий: {sessions.length}.</p>
            <div className="button-row">
              <button type="button" className="button button--primary" onClick={() => apply('merge')}>Добавить к истории</button>
              <button type="button" className="button button--danger" onClick={() => apply('replace')}>Заменить историю</button>
              <button type="button" className="button button--ghost" onClick={() => setPending(null)}>Отмена</button>
            </div>
          </>
        )}
      </Modal>
    </section>
  );
}
