const DEFAULT_TIMEZONE = 'Asia/Kolkata';

/**
 * Calendar date (YYYY-MM-DD) and weekday (0=Sun) for `instant` in `timeZone`.
 * Institutions are in a single local zone, so "today's timetable" must be the
 * institution's local day — UTC would roll over at 05:30 IST.
 */
export function localDateParts(instant: Date, timeZone: string): { date: string; dayOfWeek: number } {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: timeZone || DEFAULT_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  });
  const parts = fmt.formatToParts(instant);
  const get = (type: string) => parts.find((p) => p.type === type)?.value || '';
  const date = `${get('year')}-${get('month')}-${get('day')}`;
  const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  return { date, dayOfWeek: dayOfWeek < 0 ? instant.getUTCDay() : dayOfWeek };
}

export function todayInZone(timeZone: string, now: Date = new Date()): string {
  return localDateParts(now, timeZone).date;
}

/** Weekday (0=Sun) of a YYYY-MM-DD date — timezone-independent for date-only values. */
export function dayOfWeekForDate(dateStr: string): number {
  return new Date(`${dateStr}T00:00:00Z`).getUTCDay();
}

export function isValidTimeZone(timeZone: string): boolean {
  if (!timeZone) return false;
  try {
    new Intl.DateTimeFormat('en-CA', { timeZone });
    return true;
  } catch {
    return false;
  }
}
