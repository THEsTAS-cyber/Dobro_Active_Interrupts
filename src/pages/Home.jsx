import { Link } from 'react-router-dom';
import { useApp } from '../AppContext.jsx';

/**
 * Landing page — answers the jury's criterion 4.1 in 30 seconds:
 * what the problem is, who it affects, how the site solves it.
 * Figures are taken from WHO materials and linked to the source.
 */
// With HashRouter a plain href="#how" would be treated as a route, so we scroll and move focus manually.
function scrollToHow() {
  const el = document.getElementById('how');
  el?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  el?.focus({ preventScroll: true });
}

export default function Home() {
  const { profile } = useApp();
  return (
    <>
      <section className="hero">
        <div className="container hero__inner">
          <h1 tabIndex={-1}>Двигайтесь регулярно — даже за рабочим столом</h1>
          <p className="hero__lead">
            «Активные перерывы» напоминают делать короткие разминки во время работы и учёбы, подбирают упражнения под ваши «слабые места» и
            показывают, сколько здоровья вы сохранили за день.
          </p>
          <div className="button-row">
            <Link to={profile ? '/session' : '/onboarding'} className="button button--primary button--large">
              {profile ? 'Начать сессию' : 'Начать — это бесплатно'}
            </Link>
            <button type="button" className="button button--ghost-light button--large" onClick={scrollToHow}>
              Как это работает
            </button>
          </div>
          <p className="hero__note">Без регистрации. Работает в браузере на компьютере, планшете и телефоне.</p>
        </div>
      </section>

      <section className="section" aria-labelledby="problem-title">
        <div className="container">
          <h2 id="problem-title">Проблема: мы слишком много сидим</h2>
          <ul className="facts">
            <li className="fact">
              <p className="fact__number">31%</p>
              <p>взрослых в мире — около 1,8 млрд человек — двигаются меньше рекомендованного (данные ВОЗ за 2022 год).</p>
            </li>
            <li className="fact">
              <p className="fact__number">на 20–30%</p>
              <p>выше риск смерти у недостаточно активных людей по сравнению с теми, кто двигается достаточно.</p>
            </li>
            <li className="fact">
              <p className="fact__number">↑ риск</p>
              <p>сердечно-сосудистых заболеваний, диабета 2 типа и ряда видов рака связан с большим временем сидения.</p>
            </li>
          </ul>
          <p className="source">
            Источник:{' '}
            <a href="https://www.who.int/news-room/fact-sheets/detail/physical-activity" target="_blank" rel="noopener noreferrer">
              ВОЗ, информационный бюллетень «Физическая активность» (2024)
              <span className="visually-hidden"> (откроется в новой вкладке)</span>
            </a>
          </p>
          <p>
            Офисная работа и учёба за компьютером — это часы почти без движения. ВОЗ подчёркивает: <strong>любая активность лучше, чем никакой</strong>, а
            время сидения стоит прерывать. Но в потоке задач о перерывах легко забыть — даже если знаешь, что они нужны.
          </p>
        </div>
      </section>

      <section className="section section--alt" aria-labelledby="audience-title">
        <div className="container">
          <h2 id="audience-title">Для кого</h2>
          <ul className="cards-grid">
            <li className="card"><h3>Офисные сотрудники</h3><p>8 часов за монитором, совещания одно за другим, обед за столом.</p></li>
            <li className="card"><h3>Студенты и школьники</h3><p>Пары, домашние задания и подготовка к экзаменам — снова за экраном.</p></li>
            <li className="card"><h3>Коллективы</h3><p>Команды и учебные группы, которые хотят ввести привычку общих разминок.</p></li>
          </ul>
        </div>
      </section>

      <section className="section" id="how" aria-labelledby="how-title" tabIndex={-1}>
        <div className="container">
          <h2 id="how-title">Как это работает</h2>
          <ol className="steps">
            <li className="step">
              <h3>Отметьте, что беспокоит</h3>
              <p>Шея, глаза, спина, запястья, осанка, стресс или усталость — упражнения подберутся под вас.</p>
            </li>
            <li className="step">
              <h3>Запустите сессию и работайте</h3>
              <p>Через 52 минуты придёт напоминание — даже если вкладка свёрнута: системное уведомление, звук и мигающий заголовок.</p>
            </li>
            <li className="step">
              <h3>Сделайте разминку и отметьтесь</h3>
              <p>Пропустили перерыв? Растёт «долг здоровья»: следующий перерыв наступит раньше, а упражнений станет больше.</p>
            </li>
          </ol>
        </div>
      </section>

      <section className="section section--alt" aria-labelledby="debt-title">
        <div className="container">
          <h2 id="debt-title">«Долг здоровья»: умные напоминания</h2>
          <div className="table-wrap" role="region" aria-label="Таблица уровней срочности" tabIndex={0}>
            <table className="table">
              <caption className="visually-hidden">Уровни срочности напоминаний</caption>
              <thead>
                <tr><th scope="col">Уровень</th><th scope="col">Когда</th><th scope="col">Следующий перерыв</th><th scope="col">Упражнений</th></tr>
              </thead>
              <tbody>
                <tr><th scope="row">🟢 0 — Норма</th><td>Старт или «Отметился»</td><td>через 52 мин</td><td>1–2 лёгких</td></tr>
                <tr><th scope="row">🟠 1 — Долг</th><td>Перерыв пропущен или «Не могу»</td><td>через ~31 мин</td><td>3</td></tr>
                <tr><th scope="row">🔴 2 — Критический</th><td>Повторный пропуск</td><td>через ~16 мин</td><td>5, звук и вибрация</td></tr>
              </tbody>
            </table>
          </div>
          <p>
            В конце дня приложение считает <strong>Health ROI</strong> — сколько процентов дневного ресурса вы сохранили: каждый перерыв даёт +15%, каждый
            пропуск отнимает 25%.
          </p>
        </div>
      </section>

      <section className="section" aria-labelledby="privacy-title">
        <div className="container two-col">
          <div>
            <h2 id="privacy-title">Приватно и надёжно</h2>
            <p>Ваш профиль и статистика хранятся только в вашем браузере — без регистрации и серверов. Историю можно скачать в JSON или CSV и перенести на другое устройство.</p>
          </div>
          <div className="disclaimer" role="note">
            <h2>Важно</h2>
            <p>Приложение не заменяет консультацию врача. Если упражнение вызывает боль или головокружение — прекратите его. При хронических заболеваниях спины, суставов или давления посоветуйтесь со специалистом.</p>
          </div>
        </div>
      </section>
    </>
  );
}
