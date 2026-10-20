import { describe, expect, it } from 'vitest';
import {
  DEFAULTS,
  estimateRemainingSeconds,
  firstNumber,
  formatDuration,
  isLast,
  normalizeSettings,
  restAfter,
  restMarkers,
  totalReps,
} from './workout.js';

const base = { ...DEFAULTS };

describe('range helpers', () => {
  it('counts reps and finds first/last number in both directions', () => {
    expect(totalReps(base)).toBe(100);
    expect(firstNumber(base)).toBe(1);
    expect(isLast(base, 100)).toBe(true);
    const down = { ...base, countDirection: 'down' };
    expect(firstNumber(down)).toBe(100);
    expect(isLast(down, 1)).toBe(true);
  });
});

describe('restAfter', () => {
  it('rests every N reps but never after the final rep', () => {
    expect(restAfter(base, 9)).toBe(false);
    expect(restAfter(base, 10)).toBe(true);
    expect(restAfter(base, 20)).toBe(true);
    expect(restAfter(base, 100)).toBe(false);
  });

  it('measures reps from the origin when counting down', () => {
    const down = { ...base, countDirection: 'down' };
    expect(restAfter(down, 91)).toBe(true);
    expect(restAfter(down, 90)).toBe(false);
  });

  it('never rests when duration is 0', () => {
    expect(restAfter({ ...base, gapDuration: 0 }, 10)).toBe(false);
  });
});

describe('restMarkers', () => {
  it('places a marker at every rest, excluding the end', () => {
    expect(restMarkers(base)).toHaveLength(9);
    expect(restMarkers({ ...base, gapDuration: 0 })).toEqual([]);
  });
});

describe('estimateRemainingSeconds', () => {
  it('sums count time and rests for a fresh session', () => {
    expect(estimateRemainingSeconds(base, 0)).toBe(100 * 1 + 9 * 3);
  });

  it('is zero once everything is complete', () => {
    expect(estimateRemainingSeconds(base, 100)).toBe(0);
  });

  it('includes the rest currently in progress', () => {
    expect(estimateRemainingSeconds(base, 10, true)).toBe(90 * 1 + 9 * 3);
  });
});

describe('formatDuration', () => {
  it('formats as m:ss', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(65)).toBe('1:05');
    expect(formatDuration(-4)).toBe('0:00');
  });
});

describe('normalizeSettings', () => {
  it('falls back to defaults for junk input', () => {
    expect(normalizeSettings(null)).toEqual(DEFAULTS);
    expect(normalizeSettings({ endNum: 'abc', countInterval: NaN })).toEqual(DEFAULTS);
  });

  it('clamps values and keeps end above start', () => {
    const s = normalizeSettings({ startNum: 50, endNum: 10, countInterval: 99, gapEvery: 0 });
    expect(s.endNum).toBeGreaterThan(s.startNum);
    expect(s.countInterval).toBe(5);
    expect(s.gapEvery).toBe(1);
  });

  it('rejects an invalid direction', () => {
    expect(normalizeSettings({ countDirection: 'sideways' }).countDirection).toBe('up');
  });
});
