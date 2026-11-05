import { describe, it, expect } from 'vitest';
import {
  getBudgetMode,
  getBurnRate,
  getDailySafeToSpend,
  getFounderRunwayMonths,
  getPaylaterStreakDays,
  getMonthBounds,
} from '@/lib/budgetMode';

describe('getBudgetMode', () => {
  it('returns survival when income is exactly at threshold', () => {
    expect(getBudgetMode(2_000_000, 2_000_000)).toBe('survival');
  });

  it('returns surplus when income is just above threshold', () => {
    expect(getBudgetMode(2_000_001, 2_000_000)).toBe('surplus');
  });

  it('returns survival when income is below threshold', () => {
    expect(getBudgetMode(1_500_000, 2_000_000)).toBe('survival');
  });
});

describe('getBurnRate', () => {
  const threshold = 2_000_000;

  it('is safe below 75%', () => {
    const { level, ratio } = getBurnRate(1_000_000, threshold);
    expect(level).toBe('safe');
    expect(ratio).toBeCloseTo(0.5);
  });

  it('is warning exactly at 75%', () => {
    const { level } = getBurnRate(1_500_000, threshold);
    expect(level).toBe('warning');
  });

  it('is danger exactly at 90%', () => {
    const { level } = getBurnRate(1_800_000, threshold);
    expect(level).toBe('danger');
  });

  it('clamps ratio to max 1 even when overbudget', () => {
    const { ratio, level } = getBurnRate(5_000_000, threshold);
    expect(ratio).toBe(1);
    expect(level).toBe('danger');
  });

  it('returns ratio 0 when threshold is 0', () => {
    const { ratio } = getBurnRate(100_000, 0);
    expect(ratio).toBe(0);
  });
});

describe('getDailySafeToSpend', () => {
  it('clamps to 0 when expense already exceeds threshold (never negative)', () => {
    const date = new Date(2026, 0, 15); // Jan 15, 2026
    const result = getDailySafeToSpend(3_000_000, 2_000_000, date);
    expect(result).toBe(0);
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it('divides remaining budget by remaining days including today', () => {
    const date = new Date(2026, 0, 30); // Jan 30, 2026 (31 days in month)
    const result = getDailySafeToSpend(1_900_000, 2_000_000, date);
    // remaining budget = 100_000, days remaining = 31 - 30 + 1 = 2
    expect(result).toBe(50_000);
  });
});

describe('getMonthBounds', () => {
  it('computes correct day counts regardless of local timezone', () => {
    const date = new Date(2026, 1, 10); // Feb 10, 2026 (28 days, not a leap year)
    const bounds = getMonthBounds(date);
    expect(bounds.daysInMonth).toBe(28);
    expect(bounds.dayOfMonth).toBe(10);
    // startISO/endISO harus berada di sekitar bulan Februari (toleran terhadap shift UTC)
    expect(bounds.startISO.slice(0, 7) <= '2026-02').toBe(true);
    expect(bounds.endISO >= bounds.startISO).toBe(true);
  });
});

describe('getPaylaterStreakDays', () => {
  it('returns 0 or more, never negative', () => {
    const today = new Date().toISOString();
    const result = getPaylaterStreakDays(today, today);
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it('falls back to fallback date when lastDebtDateISO is null', () => {
    const fallback = new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString();
    const result = getPaylaterStreakDays(null, fallback);
    expect(result).toBe(5);
  });
});

describe('getFounderRunwayMonths', () => {
  it('returns 0 when monthlyOpex is 0 (not Infinity/NaN)', () => {
    const result = getFounderRunwayMonths(10_000_000, 0);
    expect(result).toBe(0);
    expect(Number.isFinite(result)).toBe(true);
  });

  it('returns 0 when monthlyOpex is negative', () => {
    const result = getFounderRunwayMonths(10_000_000, -500);
    expect(result).toBe(0);
  });

  it('computes correct runway months', () => {
    const result = getFounderRunwayMonths(4_000_000, 2_000_000);
    expect(result).toBe(2);
  });
});
