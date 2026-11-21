/**
 * Export / import of user data (File API on the UI side, pure logic here).
 *
 * JSON export format (schemaVersion 1):
 *   { schemaVersion, exportedAt, app, healthProfile: { issues: string[] } | null, sessions: Session[] }
 *
 * Session:
 *   { id: string, date: ISO string, duration: minutes, breaksDone: int, breaksMissed: int, healthScore: 0..100 }
 *
 * Import never trusts the file: every record is validated, invalid ones are
 * skipped with a reason, healthScore is recomputed from the formula so the
 * data stays consistent, and duplicates (same id) are not created.
 */
import { healthScore } from './healthROI.js';

export const SCHEMA_VERSION = 1;
export const APP_ID = 'dobro-active-interrupts';
export const CSV_COLUMNS = ['id', 'date', 'duration', 'breaksDone', 'breaksMissed', 'healthScore'];
const MAX_IMPORT_BYTES = 1024 * 1024; // 1 MB is far more than a year of sessions

export function buildExport(healthProfile, sessions, now = new Date()) {
  return {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    app: APP_ID,
    healthProfile: healthProfile || null,
    sessions: sessions || [],
  };
}

export function toJSON(healthProfile, sessions, now) {
  return JSON.stringify(buildExport(healthProfile, sessions, now), null, 2);
}

/** CSV with a UTF-8 BOM so Excel opens Cyrillic text correctly. */
export function toCSV(sessions) {
  const escape = (value) => {
    const s = String(value ?? '');
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = (sessions || []).map((s) => CSV_COLUMNS.map((c) => escape(s[c])).join(','));
  return '﻿' + [CSV_COLUMNS.join(','), ...rows].join('\r\n');
}

const isNonNegInt = (v) => Number.isInteger(v) && v >= 0;

/**
 * Validates one session. Returns { session } or { error }.
 * `fixed` is true when healthScore did not match the formula and was recomputed.
 */
export function validateSession(raw) {
  if (!raw || typeof raw !== 'object') return { error: 'запись не является объектом' };
  const id = typeof raw.id === 'string' ? raw.id.trim() : '';
  if (!id) return { error: 'нет поля id' };

  const date = new Date(raw.date);
  if (typeof raw.date !== 'string' || Number.isNaN(date.getTime())) return { error: `${id}: некорректная дата` };
  if (date.getTime() > Date.now() + 24 * 3600 * 1000) return { error: `${id}: дата в будущем` };

  const duration = Number(raw.duration);
  const breaksDone = Number(raw.breaksDone);
  const breaksMissed = Number(raw.breaksMissed);
  if (!Number.isFinite(duration) || duration < 0 || duration > 24 * 60) return { error: `${id}: длительность вне диапазона 0–1440 мин` };
  if (!isNonNegInt(breaksDone) || !isNonNegInt(breaksMissed)) return { error: `${id}: число перерывов должно быть целым ≥ 0` };

  const score = Number(raw.healthScore);
  if (raw.healthScore !== undefined && (!Number.isFinite(score) || score < 0 || score > 100)) {
    return { error: `${id}: healthScore вне диапазона 0–100` };
  }

  const expected = healthScore(breaksDone, breaksMissed);
  return {
    session: { id, date: date.toISOString(), duration: Math.round(duration), breaksDone, breaksMissed, healthScore: expected },
    fixed: raw.healthScore !== undefined && score !== expected,
  };
}

function parseCSV(text) {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) throw new Error('Файл пуст.');
  const header = lines[0].split(',').map((h) => h.trim());
  const missing = CSV_COLUMNS.filter((c) => c !== 'healthScore' && !header.includes(c));
  if (missing.length) throw new Error(`В CSV нет колонок: ${missing.join(', ')}.`);
  return lines.slice(1).map((line) => {
    const cells = line.split(',');
    const row = {};
    header.forEach((h, i) => {
      row[h] = cells[i];
    });
    ['duration', 'breaksDone', 'breaksMissed', 'healthScore'].forEach((k) => {
      if (row[k] !== undefined && row[k] !== '') row[k] = Number(row[k]);
      else delete row[k];
    });
    return row;
  });
}

function validateProfile(raw, knownIssueIds) {
  if (raw == null) return null;
  if (typeof raw !== 'object' || !Array.isArray(raw.issues)) return undefined;
  const issues = raw.issues.filter((id) => typeof id === 'string' && (!knownIssueIds || knownIssueIds.includes(id)));
  return { issues: [...new Set(issues)] };
}

/**
 * Parses an imported file (JSON or CSV).
 * Returns { sessions, healthProfile, skipped: string[], fixed: number } or throws Error with a user-facing message.
 */
export function parseImport(text, fileName = '', knownIssueIds = null) {
  if (typeof text !== 'string' || !text.trim()) throw new Error('Файл пуст.');
  if (text.length > MAX_IMPORT_BYTES) throw new Error('Файл слишком большой (больше 1 МБ).');

  let rawSessions;
  let healthProfile;
  const looksLikeJSON = /^\s*[[{]/.test(text.replace(/^﻿/, ''));

  if (fileName.toLowerCase().endsWith('.csv') || !looksLikeJSON) {
    rawSessions = parseCSV(text);
  } else {
    let data;
    try {
      data = JSON.parse(text.replace(/^﻿/, ''));
    } catch {
      throw new Error('Файл повреждён: это не корректный JSON.');
    }
    if (Array.isArray(data)) {
      rawSessions = data; // bare array of sessions is accepted too
    } else {
      if (data.schemaVersion !== SCHEMA_VERSION) {
        throw new Error(`Неподдерживаемая версия формата: ${data.schemaVersion ?? 'не указана'} (ожидается ${SCHEMA_VERSION}).`);
      }
      if (!Array.isArray(data.sessions)) throw new Error('В файле нет массива sessions.');
      rawSessions = data.sessions;
      healthProfile = validateProfile(data.healthProfile, knownIssueIds);
    }
  }

  const sessions = [];
  const skipped = [];
  const seen = new Set();
  let fixed = 0;
  for (const raw of rawSessions) {
    const result = validateSession(raw);
    if (result.error) {
      skipped.push(result.error);
    } else if (seen.has(result.session.id)) {
      skipped.push(`${result.session.id}: дубликат внутри файла`);
    } else {
      seen.add(result.session.id);
      sessions.push(result.session);
      if (result.fixed) fixed += 1;
    }
  }
  return { sessions, healthProfile, skipped, fixed };
}

/** Merges imported sessions into existing ones without duplicating ids. Newest first. */
export function mergeSessions(existing, incoming) {
  const byId = new Map((existing || []).map((s) => [s.id, s]));
  let added = 0;
  for (const s of incoming) {
    if (!byId.has(s.id)) {
      byId.set(s.id, s);
      added += 1;
    }
  }
  const merged = [...byId.values()].sort((a, b) => new Date(b.date) - new Date(a.date));
  return { merged, added, duplicates: incoming.length - added };
}
