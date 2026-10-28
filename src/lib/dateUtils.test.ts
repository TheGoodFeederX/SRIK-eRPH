import { describe, expect, it } from 'vitest';
import { getMalayDay, todayMalaysia } from './dateUtils';

describe('todayMalaysia', () => {
  it('returns the Malaysian date during the UTC morning gap (audit F-06)', () => {
    // 2026-10-26T23:30Z is already 2026-10-27 07:30 in Kuala Lumpur.
    expect(todayMalaysia(new Date('2026-10-26T23:30:00Z'))).toBe('2026-10-27');
  });

  it('returns the same date late in the Malaysian day', () => {
    expect(todayMalaysia(new Date('2026-10-27T15:59:00Z'))).toBe('2026-10-27');
  });
});

describe('getMalayDay', () => {
  it('names the weekday from the date itself, not the device timezone', () => {
    expect(getMalayDay('2026-10-27')).toBe('Selasa');
    expect(getMalayDay('')).toBe('');
  });
});
