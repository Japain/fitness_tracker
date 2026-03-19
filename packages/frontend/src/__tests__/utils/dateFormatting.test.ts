import { describe, it, expect } from 'vitest';
import {
  calculateDuration,
  calculateDurationMinutes,
  formatSecondsToMinutesSeconds,
  formatDurationHours,
  formatMinutesForDisplay,
} from '../../utils/dateFormatting';

describe('calculateDuration', () => {
  it('returns "In progress" when endTime is null', () => {
    expect(calculateDuration(new Date(), null)).toBe('In progress');
  });

  it('returns "In progress" when endTime is undefined', () => {
    expect(calculateDuration(new Date())).toBe('In progress');
  });

  it('calculates a 45-minute duration correctly', () => {
    const start = new Date('2025-01-01T10:00:00Z');
    const end = new Date('2025-01-01T10:45:00Z');
    expect(calculateDuration(start, end)).toBe('45 min');
  });

  it('calculates a 1-hour duration correctly', () => {
    const start = new Date('2025-01-01T09:00:00Z');
    const end = new Date('2025-01-01T10:00:00Z');
    expect(calculateDuration(start, end)).toBe('60 min');
  });

  it('returns "0 min" for zero-length workouts', () => {
    const d = new Date('2025-01-01T10:00:00Z');
    expect(calculateDuration(d, d)).toBe('0 min');
  });

  it('accepts ISO string inputs', () => {
    const start = '2025-01-01T10:00:00Z';
    const end = '2025-01-01T10:30:00Z';
    expect(calculateDuration(start, end)).toBe('30 min');
  });

  it('clamps negative durations to 0', () => {
    const start = new Date('2025-01-01T10:30:00Z');
    const end = new Date('2025-01-01T10:00:00Z');
    expect(calculateDuration(start, end)).toBe('0 min');
  });
});

describe('calculateDurationMinutes', () => {
  it('returns 0 when endTime is null', () => {
    expect(calculateDurationMinutes(new Date(), null)).toBe(0);
  });

  it('returns correct minutes for a 45-minute workout', () => {
    const start = new Date('2025-01-01T10:00:00Z');
    const end = new Date('2025-01-01T10:45:00Z');
    expect(calculateDurationMinutes(start, end)).toBe(45);
  });

  it('clamps negative values to 0', () => {
    const start = new Date('2025-01-01T11:00:00Z');
    const end = new Date('2025-01-01T10:00:00Z');
    expect(calculateDurationMinutes(start, end)).toBe(0);
  });
});

describe('formatSecondsToMinutesSeconds', () => {
  it('formats seconds only when less than 60', () => {
    expect(formatSecondsToMinutesSeconds(45)).toBe('45s');
  });

  it('formats exactly 1 minute as "1m" (no seconds)', () => {
    expect(formatSecondsToMinutesSeconds(60)).toBe('1m');
  });

  it('formats 5 minutes exactly as "5m"', () => {
    expect(formatSecondsToMinutesSeconds(300)).toBe('5m');
  });

  it('formats 5 minutes 30 seconds as "5m 30s"', () => {
    expect(formatSecondsToMinutesSeconds(330)).toBe('5m 30s');
  });

  it('formats 0 seconds as "0s"', () => {
    expect(formatSecondsToMinutesSeconds(0)).toBe('0s');
  });

  it('formats 1 hour 1 minute 1 second as "61m 1s"', () => {
    expect(formatSecondsToMinutesSeconds(3661)).toBe('61m 1s');
  });
});

describe('formatDurationHours', () => {
  it('formats 1.5 hours', () => {
    expect(formatDurationHours(1.5)).toBe('1.5h');
  });

  it('formats 0.75 hours', () => {
    expect(formatDurationHours(0.75)).toBe('0.8h');
  });

  it('formats 0 hours', () => {
    expect(formatDurationHours(0)).toBe('0.0h');
  });
});

describe('formatMinutesForDisplay', () => {
  it('converts 45 to "45"', () => {
    expect(formatMinutesForDisplay(45)).toBe('45');
  });

  it('converts 0 to "0"', () => {
    expect(formatMinutesForDisplay(0)).toBe('0');
  });
});
