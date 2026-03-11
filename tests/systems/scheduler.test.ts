import { describe, it, expect } from 'vitest';
import { shouldRun } from '../../src/systems/scheduler.js';

describe('shouldRun', () => {
  it('handles @every Ns expressions', () => {
    const now = Date.now();
    expect(shouldRun('@every 30s', null, now)).toBe(true);
    expect(shouldRun('@every 30s', now - 31_000, now)).toBe(true);
    expect(shouldRun('@every 30s', now - 10_000, now)).toBe(false);
  });

  it('handles @every Nm expressions', () => {
    const now = Date.now();
    expect(shouldRun('@every 5m', null, now)).toBe(true);
    expect(shouldRun('@every 5m', now - 6 * 60_000, now)).toBe(true);
    expect(shouldRun('@every 5m', now - 2 * 60_000, now)).toBe(false);
  });

  it('handles @every Nh expressions', () => {
    const now = Date.now();
    expect(shouldRun('@every 1h', null, now)).toBe(true);
    expect(shouldRun('@every 1h', now - 2 * 3_600_000, now)).toBe(true);
    expect(shouldRun('@every 1h', now - 30 * 60_000, now)).toBe(false);
  });

  it('first run always triggers for cron', () => {
    expect(shouldRun('* * * * *', null, Date.now())).toBe(true);
  });

  it('rejects invalid cron format', () => {
    expect(shouldRun('invalid', 0, Date.now())).toBe(false);
  });
});
