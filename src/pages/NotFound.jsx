import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container page">
      <h1 tabIndex={-1}>Страница не найдена</h1>
      <p>Такой страницы нет. <Link to="/">Вернуться на главную</Link></p>
    </div>
  );
}
