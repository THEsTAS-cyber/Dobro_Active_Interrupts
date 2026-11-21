import { test } from 'node:test';
import assert from 'node:assert/strict';
import { transition, idleState, EVENTS, workDurationMs, MAX_LEVEL } from '../src/utils/stateMachine.js';
import { TIMINGS } from '../src/utils/config.js';

const T = TIMINGS.normal;
const MIN = 60 * 1000;

test('START begins level-0 work with a 52-minute deadline', () => {
  const s = transition(idleState(), EVENTS.START, 0, T);
  assert.equal(s.phase, 'work');
  assert.equal(s.level, 0);
  assert.equal(s.deadline, 52 * MIN);
});

test('work intervals shrink by level: 52 → ~31 → ~16 minutes', () => {
  assert.equal(workDurationMs(0, T), 52 * MIN);
  assert.equal(Math.round(workDurationMs(1, T) / MIN), 31);
  assert.equal(Math.round(workDurationMs(2, T) / MIN), 16);
});

test('WORK_ELAPSED opens an alert with a 5-minute ignore window', () => {
  let s = transition(idleState(), EVENTS.START, 0, T);
  s = transition(s, EVENTS.WORK_ELAPSED, 100, T);
  assert.equal(s.phase, 'alert');
  assert.equal(s.deadline, 100 + 5 * MIN);
});

test('IGNORE_TIMEOUT and CANT escalate up to level 2 and count misses', () => {
  let s = transition(idleState(), EVENTS.START, 0, T);
  for (const [i, ev] of [EVENTS.IGNORE_TIMEOUT, EVENTS.CANT, EVENTS.CANT].entries()) {
    s = transition(s, EVENTS.WORK_ELAPSED, i, T);
    s = transition(s, ev, i, T);
  }
  assert.equal(s.level, MAX_LEVEL);
  assert.equal(s.breaksMissed, 3);
  assert.equal(s.phase, 'work');
});

test('CHECKED_IN resets to level 0 and counts a done break', () => {
  let s = transition(idleState(), EVENTS.START, 0, T);
  s = transition(transition(s, EVENTS.WORK_ELAPSED, 0, T), EVENTS.CANT, 0, T);
  assert.equal(s.level, 1);
  s = transition(transition(s, EVENTS.WORK_ELAPSED, 0, T), EVENTS.CHECKED_IN, 1000, T);
  assert.equal(s.level, 0);
  assert.equal(s.breaksDone, 1);
  assert.equal(s.deadline, 1000 + 52 * MIN);
});

test('out-of-phase events are ignored (late timer ticks are safe)', () => {
  const work = transition(idleState(), EVENTS.START, 0, T);
  assert.equal(transition(work, EVENTS.CHECKED_IN, 5, T), work);
  assert.equal(transition(work, EVENTS.IGNORE_TIMEOUT, 5, T), work);
  assert.equal(transition(idleState(), EVENTS.WORK_ELAPSED, 5, T).phase, 'idle');
});
