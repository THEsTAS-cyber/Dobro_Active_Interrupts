import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pickExercises } from '../src/utils/exercises.js';

const exercises = JSON.parse(readFileSync(new URL('../public/data/exercises.json', import.meta.url)));
const issues = JSON.parse(readFileSync(new URL('../public/data/health-issues.json', import.meta.url)));

test('reference data is consistent', () => {
  const issueIds = new Set([...issues.map((i) => i.id), 'general']);
  const ids = new Set();
  for (const ex of exercises) {
    assert.ok(issueIds.has(ex.issue_id), `${ex.id}: unknown issue_id ${ex.issue_id}`);
    assert.ok([0, 1, 2].includes(ex.urgency_level), `${ex.id}: bad urgency_level`);
    assert.ok(ex.duration_sec > 0 && ex.steps.length > 0, `${ex.id}: empty`);
    assert.ok(!ids.has(ex.id), `${ex.id}: duplicate id`);
    ids.add(ex.id);
  }
  assert.ok(exercises.length >= 20);
});

test('level 0 picks only light exercises, personal ones first', () => {
  const picked = pickExercises(exercises, ['eyes'], 0, 2);
  assert.equal(picked.length, 2);
  assert.ok(picked.every((e) => e.urgency_level === 0 && e.issue_id === 'eyes'));
});

test('level 2 picks 5 exercises and may include intense ones', () => {
  const picked = pickExercises(exercises, ['back'], 2, 5);
  assert.equal(picked.length, 5);
  assert.ok(picked.some((e) => e.urgency_level === 2));
});

test('empty profile falls back to general exercises', () => {
  assert.equal(pickExercises(exercises, [], 1, 3).length, 3);
});
