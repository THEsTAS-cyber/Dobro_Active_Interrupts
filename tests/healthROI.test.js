import { test } from 'node:test';
import assert from 'node:assert/strict';
import { healthScore } from '../src/utils/healthROI.js';

test('formula: done × 15 − missed × 25, clamped to 0..100', () => {
  assert.equal(healthScore(0, 0), 0);
  assert.equal(healthScore(4, 1), 35);
  assert.equal(healthScore(7, 0), 100);
  assert.equal(healthScore(10, 0), 100);
  assert.equal(healthScore(1, 3), 0);
});

test('invalid input is treated as zero', () => {
  assert.equal(healthScore(undefined, null), 0);
  assert.equal(healthScore(-3, 'x'), 0);
});
