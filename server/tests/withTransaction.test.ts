import { describe, it, expect, vi } from 'vitest';

// Force no-Postgres path: postgres() returns null → db === null regardless of DATABASE_URL.
vi.mock('postgres', () => ({
  default: () => null,
}));

vi.mock('dotenv/config', () => ({}));

import { withTransaction } from '../src/modules/shared/db/index.js';

describe('withTransaction', () => {
  it('throws DB_UNAVAILABLE when no Postgres client (dev no-DB mode)', async () => {
    await expect(withTransaction(async () => 'ok')).rejects.toMatchObject({
      code: 'DB_UNAVAILABLE',
      statusCode: 500,
    });
  });

  it('does not invoke callback when db is unavailable', async () => {
    let called = false;
    await withTransaction(async () => {
      called = true;
      return 1;
    }).catch(() => {});
    expect(called).toBe(false);
  });
});
