/** Health ROI progress bar with full ARIA semantics. */
export default function ProgressBar({ value, label }) {
  const v = Math.round(Math.min(100, Math.max(0, value)));
  const tone = v >= 70 ? 'good' : v >= 35 ? 'mid' : 'low';
  return (
    <div className="progress">
      <div
        className={`progress__track progress__track--${tone}`}
        role="progressbar"
        aria-valuenow={v}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={`${v}%`}
        aria-label={label}
      >
        <div className="progress__fill" style={{ width: `${v}%` }} />
      </div>
      <p className="progress__caption">
        Вы сохранили <strong>{v}%</strong> дневного ресурса
      </p>
    </div>
  );
}
