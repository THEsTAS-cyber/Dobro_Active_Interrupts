import { useId } from 'react';

export default function ExerciseCard({ exercise, issueTitle, headingLevel = 3 }) {
  const id = useId();
  const H = `h${headingLevel}`;
  return (
    <article className="exercise" aria-labelledby={id}>
      <H id={id} className="exercise__title">{exercise.title}</H>
      <p className="exercise__meta">
        <span>⏱ {exercise.duration_sec} сек</span>
        {issueTitle && <span>· {issueTitle}</span>}
      </p>
      <p>{exercise.description}</p>
      <ol className="exercise__steps">
        {exercise.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      {exercise.contraindications && (
        <p className="exercise__warn">
          <span aria-hidden="true">⚠️ </span>
          {exercise.contraindications}
        </p>
      )}
    </article>
  );
}
