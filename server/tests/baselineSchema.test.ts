import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';

const sql = readFileSync(resolve(__dirname, '..', 'drizzle', '0000_full_schema.sql'), 'utf8');
const journal = JSON.parse(readFileSync(resolve(__dirname, '..', 'drizzle', 'meta', '_journal.json'), 'utf8'));
const snapshot = JSON.parse(readFileSync(resolve(__dirname, '..', 'drizzle', 'meta', '0000_snapshot.json'), 'utf8'));

function count(pattern: RegExp): number {
  return sql.match(pattern)?.length ?? 0;
}

describe('fresh database baseline', () => {
  it('contains all tables, indexes, and foreign keys from the current schema', () => {
    expect(count(/CREATE TABLE IF NOT EXISTS/g)).toBe(68);
    expect(count(/CREATE UNIQUE INDEX IF NOT EXISTS/g)).toBe(60);
    expect(count(/CREATE INDEX IF NOT EXISTS/g)).toBe(157);
    expect(count(/ADD CONSTRAINT .* FOREIGN KEY/g)).toBe(81);
  });

  it('creates unique indexes before foreign keys that depend on them', () => {
    const firstForeignKey = sql.indexOf('ADD CONSTRAINT');
    const lastUniqueIndex = sql.lastIndexOf('CREATE UNIQUE INDEX IF NOT EXISTS');
    expect(lastUniqueIndex).toBeGreaterThan(-1);
    expect(lastUniqueIndex).toBeLessThan(firstForeignKey);
  });

  it('keeps the bootstrap DDL idempotent', () => {
    expect(sql).not.toMatch(/CREATE TABLE "/);
    expect(sql).not.toMatch(/CREATE UNIQUE INDEX "/);
    expect(sql).not.toMatch(/CREATE INDEX "/);
  });

  it('stores user scope, roles, and permissions as jsonb', () => {
    const usersDdl = sql.match(/CREATE TABLE IF NOT EXISTS "users" \([\s\S]*?\n\);/)?.[0] ?? '';
    expect(usersDdl).toMatch(/"scope" jsonb DEFAULT '\{\}'::jsonb/);
    expect(usersDdl).toMatch(/"permissions" jsonb DEFAULT '\[\]'::jsonb/);
    expect(usersDdl).toMatch(/"roles" jsonb DEFAULT '\[\]'::jsonb/);
    expect(usersDdl).not.toMatch(/"scope" text/);
    expect(usersDdl).not.toMatch(/"permissions" text/);
  });

  it('has a single, consistent Drizzle migration entry', () => {
    expect(journal.entries).toHaveLength(1);
    expect(journal.entries[0]).toMatchObject({ idx: 0, tag: '0000_full_schema' });
    expect(snapshot.prevId).toBe('00000000-0000-0000-0000-000000000000');
    expect(Object.keys(snapshot.tables)).toHaveLength(68);
  });
});
