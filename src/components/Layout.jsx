import { useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useApp } from '../AppContext.jsx';
import { useSessionContext } from '../SessionContext.jsx';
import BreakDialog from './BreakDialog.jsx';
import { formatCountdown } from '../utils/format.js';

const NAV = [
  { to: '/', label: 'Главная', end: true },
  { to: '/onboarding', label: 'Мой профиль' },
  { to: '/session', label: 'Сессия' },
  { to: '/stats', label: 'Статистика' },
  { to: '/jury', label: 'Для жюри' },
];

const TITLES = {
  '/': 'Активные перерывы',
  '/onboarding': 'Мой профиль — Активные перерывы',
  '/session': 'Сессия — Активные перерывы',
  '/stats': 'Статистика — Активные перерывы',
  '/jury': 'Для жюри — Активные перерывы',
};

export default function Layout() {
  const location = useLocation();
  const mainRef = useRef(null);
  const firstRender = useRef(true);
  const { settings, setSettings, storageError } = useApp();
  const { state, remainingMs, setDialogOpen } = useSessionContext();

  // SPA navigation: update the document title and move focus to the new page
  // so keyboard and screen-reader users start reading from the top.
  useEffect(() => {
    if (!document.title.startsWith('⏰')) document.title = TITLES[location.pathname] || TITLES['/'];
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const heading = mainRef.current?.querySelector('h1');
    (heading || mainRef.current)?.focus();
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <>
      <a className="skip-link" href="#main" onClick={(e) => { e.preventDefault(); mainRef.current?.focus(); }}>
        Перейти к содержимому
      </a>
      <header className="site-header">
        <div className="container site-header__inner">
          <NavLink to="/" className="logo" aria-label="Активные перерывы — на главную">
            <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" width="32" height="32" />
            <span>Активные перерывы</span>
          </NavLink>
          <nav aria-label="Основная навигация">
            <ul className="nav">
              {NAV.map((item) => (
                <li key={item.to}>
                  <NavLink to={item.to} end={item.end} className="nav__link">
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        {state.phase !== 'idle' && location.pathname !== '/session' && (
          <div className="session-strip" role="status">
            <div className="container session-strip__inner">
              {state.phase === 'work' ? (
                <span>До перерыва: <strong>{formatCountdown(remainingMs)}</strong></span>
              ) : (
                <>
                  <span><strong>Перерыв ждёт ответа</strong></span>
                  <button type="button" className="button button--small" onClick={() => setDialogOpen(true)}>Открыть</button>
                </>
              )}
              <NavLink to="/session" className="link-light">К сессии</NavLink>
            </div>
          </div>
        )}
      </header>

      {storageError && (
        <div className="container">
          <p className="alert alert--warn" role="alert">{storageError}</p>
        </div>
      )}

      <main id="main" ref={mainRef} tabIndex={-1}>
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="container site-footer__inner">
          <div>
            <p><strong>Активные перерывы</strong> — проект для конкурса «Добрые Сайты 2026» (ВО «ДоброБит»).</p>
            <p className="muted-light">Приложение не заменяет консультацию врача. Все данные хранятся только в вашем браузере.</p>
          </div>
          <div className="footer-settings">
            <label className="switch">
              <input
                type="checkbox"
                checked={!!settings.demo}
                onChange={(e) => setSettings((s) => ({ ...s, demo: e.target.checked }))}
              />
              <span>Демо-режим (20 сек вместо 52 мин)</span>
            </label>
            <label className="switch">
              <input
                type="checkbox"
                checked={settings.sound !== false}
                onChange={(e) => setSettings((s) => ({ ...s, sound: e.target.checked }))}
              />
              <span>Звук напоминаний</span>
            </label>
          </div>
        </div>
      </footer>

      <BreakDialog />
    </>
  );
}
