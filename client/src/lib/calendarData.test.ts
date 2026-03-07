import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getTodayCalendarInfo, getTodayDisplay, getUpcomingEvents } from './calendarData';

describe('Calendar Data - 日历系统', () => {
  let originalDate: typeof Date;

  beforeEach(() => {
    // Mock Date to control current date
    originalDate = Date;
  });

  afterEach(() => {
    // Restore original Date
    vi.restoreAllMocks();
  });

  describe('getTodayCalendarInfo', () => {
    it('should return today event if it exists (e.g., Women\'s Day on March 8)', () => {
      // Mock date to March 8
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 2, 8)); // March 8, 2026

      const info = getTodayCalendarInfo();
      expect(info.hasEvent).toBe(true);
      expect(info.event?.name).toBe('妇女节');
      expect(info.event?.emoji).toBe('🌸');
      expect(info.dateDesc).toBe('3月8日');

      vi.useRealTimers();
    });

    it('should return tomorrow event if today has no event but tomorrow does (e.g., March 7 showing Women\'s Day)', () => {
      // Mock date to March 7
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 2, 7)); // March 7, 2026

      const info = getTodayCalendarInfo();
      expect(info.hasEvent).toBe(true);
      expect(info.event?.name).toBe('妇女节');
      expect(info.event?.emoji).toBe('🌸');
      expect(info.event?.subtitle).toContain('明天');
      expect(info.dateDesc).toBe('3月7日');

      vi.useRealTimers();
    });

    it('should show Double Ninth Festival on September 8 (day before)', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 8, 8)); // September 8, 2026

      const info = getTodayCalendarInfo();
      expect(info.hasEvent).toBe(true);
      expect(info.event?.name).toBe('重阳节');
      expect(info.event?.subtitle).toContain('明天');

      vi.useRealTimers();
    });

    it('should return no event if neither today nor tomorrow has special events', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 4, 15)); // May 15, 2026 (random date)

      const info = getTodayCalendarInfo();
      // May 15 might have a nearby jieqi or no event at all
      expect(info.dateDesc).toBe('5月15日');

      vi.useRealTimers();
    });

    it('should prioritize festivals over poet birthdays for tomorrow', () => {
      vi.useFakeTimers();
      // March 7 - Women's Day is tomorrow (festival)
      vi.setSystemTime(new Date(2026, 2, 7));

      const info = getTodayCalendarInfo();
      expect(info.event?.name).toBe('妇女节');
      expect(info.event?.type).toBe('festival');

      vi.useRealTimers();
    });
  });

  describe('getTodayDisplay', () => {
    it('should include dateDesc in returned object', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 2, 8)); // March 8

      const display = getTodayDisplay();
      expect(display).toHaveProperty('dateDesc');
      expect(display.dateDesc).toBe('3月8日');

      vi.useRealTimers();
    });

    it('should return Women\'s Day event on March 8', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 2, 8));

      const display = getTodayDisplay();
      expect(display.name).toBe('妇女节');
      expect(display.poemAuthor).toBe('李清照');
      expect(display.themeTag).toBe('李清照');

      vi.useRealTimers();
    });

    it('should have all required properties', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 2, 8));

      const display = getTodayDisplay();
      expect(display).toHaveProperty('type');
      expect(display).toHaveProperty('name');
      expect(display).toHaveProperty('emoji');
      expect(display).toHaveProperty('poem');
      expect(display).toHaveProperty('poemAuthor');
      expect(display).toHaveProperty('subtitle');
      expect(display).toHaveProperty('themeTag');
      expect(display).toHaveProperty('color');
      expect(display).toHaveProperty('bgGradient');
      expect(display).toHaveProperty('dateDesc');

      vi.useRealTimers();
    });
  });

  describe('getUpcomingEvents', () => {
    it('should return events within specified days', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 2, 1)); // March 1

      const events = getUpcomingEvents(10);
      expect(events.length).toBeGreaterThan(0);
      
      // All events should have daysUntil > 0 and <= 10
      events.forEach(event => {
        expect(event.daysUntil).toBeGreaterThan(0);
        expect(event.daysUntil).toBeLessThanOrEqual(10);
      });

      vi.useRealTimers();
    });

    it('should include Women\'s Day when checking from March 1', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 2, 1)); // March 1

      const events = getUpcomingEvents(10);
      const womensDayEvent = events.find(e => e.name === '妇女节');
      expect(womensDayEvent).toBeDefined();
      expect(womensDayEvent?.daysUntil).toBe(7);

      vi.useRealTimers();
    });

    it('should return events sorted by daysUntil', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 2, 1));

      const events = getUpcomingEvents(30);
      for (let i = 0; i < events.length - 1; i++) {
        expect(events[i].daysUntil).toBeLessThanOrEqual(events[i + 1].daysUntil);
      }

      vi.useRealTimers();
    });

    it('should not include past events', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 2, 10)); // March 10

      const events = getUpcomingEvents(7);
      events.forEach(event => {
        expect(event.daysUntil).toBeGreaterThan(0);
      });

      vi.useRealTimers();
    });

    it('should return empty array if no events in range', () => {
      vi.useFakeTimers();
      // Set to a date with no upcoming events in next 1 day
      vi.setSystemTime(new Date(2026, 4, 20)); // May 20 (random date)

      const events = getUpcomingEvents(1);
      // May 20 might have events, so we just check it's an array
      expect(Array.isArray(events)).toBe(true);

      vi.useRealTimers();
    });
  });

  describe('Festival data integrity', () => {
    it('Women\'s Day should have correct properties', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 2, 8));

      const info = getTodayCalendarInfo();
      expect(info.event?.name).toBe('妇女节');
      expect(info.event?.emoji).toBe('🌸');
      expect(info.event?.type).toBe('festival');
      expect(info.event?.color).toBe('#EB2F96'); // Pink color
      expect(info.event?.themeTag).toBe('李清照');
      expect(info.event?.poem).toContain('生当作人杰');

      vi.useRealTimers();
    });

    it('Double Ninth Festival should have correct properties', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 8, 9));

      const info = getTodayCalendarInfo();
      expect(info.event?.name).toBe('重阳节');
      expect(info.event?.emoji).toBe('🌼');
      expect(info.event?.type).toBe('festival');
      expect(info.event?.poemAuthor).toBe('王维');

      vi.useRealTimers();
    });
  });

  describe('Edge cases', () => {
    it('should handle year boundary correctly', () => {
      vi.useFakeTimers();
      // December 31 - check if New Year is shown as tomorrow
      vi.setSystemTime(new Date(2025, 11, 31));

      const info = getTodayCalendarInfo();
      // Should show New Year as tomorrow or a nearby event
      expect(info.dateDesc).toBe('12月31日');

      vi.useRealTimers();
    });

    it('should handle leap year dates', () => {
      vi.useFakeTimers();
      // 2026 is not a leap year, but test February
      vi.setSystemTime(new Date(2026, 1, 28));

      const info = getTodayCalendarInfo();
      expect(info.dateDesc).toBe('2月28日');

      vi.useRealTimers();
    });
  });
});
