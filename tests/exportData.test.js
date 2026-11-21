import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toJSON, toCSV, parseImport, mergeSessions } from '../src/utils/exportData.js';

const session = { id: 's1', date: '2026-11-18T09:00:00.000Z', duration: 300, breaksDone: 4, breaksMissed: 1, healthScore: 35 };

test('JSON export round-trips through import', () => {
  const text = toJSON({ issues: ['neck'] }, [session]);
  const result = parseImport(text, 'stats.json', ['neck', 'eyes']);
  assert.deepEqual(result.sessions, [session]);
  assert.deepEqual(result.healthProfile, { issues: ['neck'] });
  assert.equal(result.skipped.length, 0);
});

test('CSV export has BOM and round-trips through import', () => {
  const csv = toCSV([session]);
  assert.ok(csv.startsWith('﻿'));
  const result = parseImport(csv, 'stats.csv');
  assert.deepEqual(result.sessions, [session]);
});

test('invalid records are skipped with reasons, wrong score is recomputed', () => {
  const text = JSON.stringify({
    schemaVersion: 1,
    sessions: [
      session,
      { ...session, id: 's1' }, // duplicate
      { ...session, id: 's2', date: 'not-a-date' },
      { ...session, id: 's3', breaksDone: 2.5 },
      { ...session, id: 's4', healthScore: 999 },
      { ...session, id: 's5', healthScore: 90 }, // inconsistent → fixed to 35
    ],
  });
  const r = parseImport(text, 'x.json');
  assert.equal(r.sessions.length, 2);
  assert.equal(r.skipped.length, 4);
  assert.equal(r.fixed, 1);
  assert.equal(r.sessions[1].healthScore, 35);
});

test('wrong schema version and broken JSON are rejected with a message', () => {
  assert.throws(() => parseImport('{"schemaVersion":99,"sessions":[]}', 'a.json'), /версия формата/);
  assert.throws(() => parseImport('{broken', 'a.json'), /не корректный JSON/);
  assert.throws(() => parseImport('', 'a.json'), /пуст/);
});

test('merge does not duplicate ids and sorts newest first', () => {
  const older = { ...session, id: 'old', date: '2026-11-10T09:00:00.000Z' };
  const { merged, added, duplicates } = mergeSessions([session], [session, older]);
  assert.equal(added, 1);
  assert.equal(duplicates, 1);
  assert.deepEqual(merged.map((s) => s.id), ['s1', 'old']);
});
