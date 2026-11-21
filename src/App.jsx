import { HashRouter, Route, Routes } from 'react-router-dom';
import { AppProvider } from './AppContext.jsx';
import { SessionProvider } from './SessionContext.jsx';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Onboarding from './pages/Onboarding.jsx';
import Session from './pages/Session.jsx';
import Stats from './pages/Stats.jsx';
import Jury from './pages/Jury.jsx';
import NotFound from './pages/NotFound.jsx';

/**
 * HashRouter instead of BrowserRouter: GitHub Pages has no server-side SPA
 * fallback, so /session would return 404 on reload. With #/session the server
 * always serves index.html and routing happens in the browser.
 */
export default function App() {
  return (
    <HashRouter>
      <AppProvider>
        <SessionProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="onboarding" element={<Onboarding />} />
              <Route path="session" element={<Session />} />
              <Route path="stats" element={<Stats />} />
              <Route path="jury" element={<Jury />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </SessionProvider>
      </AppProvider>
    </HashRouter>
  );
}
