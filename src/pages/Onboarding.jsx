import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext.jsx';

/** Health profile: the user picks pain points; exercises are then personalized. */
export default function Onboarding() {
  const { data, profile, setProfile, announce } = useApp();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(() => new Set(profile?.issues || []));
  const [error, setError] = useState('');

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setError('');
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (selected.size === 0) {
      setError('Выберите хотя бы один пункт или нажмите «Пропустить» — тогда подберём общие упражнения.');
      return;
    }
    setProfile({ issues: [...selected] });
    announce('Профиль сохранён.');
    navigate('/session');
  };

  const skip = () => {
    setProfile({ issues: [] });
    navigate('/session');
  };

  return (
    <div className="container page">
      <h1 tabIndex={-1}>Что вас беспокоит?</h1>
      <p className="lead">Отметьте всё, что подходит. Мы будем чаще предлагать упражнения именно для этих зон. Изменить выбор можно в любой момент.</p>

      {data.loading && <p role="status">Загружаем справочник…</p>}
      {data.error && <p className="alert alert--error" role="alert">{data.error}</p>}

      {!data.loading && !data.error && (
        <form onSubmit={onSubmit} noValidate>
          <fieldset className="issue-grid" aria-describedby={error ? 'issues-error' : undefined}>
            <legend className="visually-hidden">Проблемы со здоровьем</legend>
            {data.issues.map((issue) => (
              <label key={issue.id} className={`issue ${selected.has(issue.id) ? 'issue--checked' : ''}`}>
                <input type="checkbox" checked={selected.has(issue.id)} onChange={() => toggle(issue.id)} />
                <span className="issue__icon" aria-hidden="true">{issue.icon}</span>
                <span className="issue__text">
                  <strong>{issue.title}</strong>
                  <span>{issue.description}</span>
                </span>
              </label>
            ))}
          </fieldset>
          {error && <p id="issues-error" className="field-error" role="alert">{error}</p>}
          <div className="button-row">
            <button type="submit" className="button button--primary">Сохранить и перейти к сессии</button>
            <button type="button" className="button button--ghost" onClick={skip}>Пропустить</button>
          </div>
        </form>
      )}
    </div>
  );
}
