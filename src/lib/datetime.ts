// All timestamps in this app are presented in Türkiye local time
// (Europe/Istanbul = UTC+3, no DST since 2016) and DD/MM/YYYY format.

const TZ = 'Europe/Istanbul';

/**
 * Parse a naive Istanbul-local datetime string from the Kandilli API
 * (e.g. "2026-04-15 14:55:24") into a real Date that represents the
 * same UTC instant. Without this, the browser would interpret it in
 * its OWN local timezone, which is wrong for visitors outside Türkiye.
 */
export function parseTRDate(input: string | Date | number): Date {
  if (input instanceof Date) return input;
  if (typeof input === 'number') return new Date(input);
  const m = input.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return new Date(input);
  const [, y, mo, d, h, mi, s] = m;
  // Türkiye = UTC+3 fixed, no DST
  return new Date(Date.UTC(+y, +mo - 1, +d, +h - 3, +mi, +(s ?? 0)));
}

const fmtDate = new Intl.DateTimeFormat('en-GB', {
  timeZone: TZ,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});
const fmtTime = new Intl.DateTimeFormat('en-GB', {
  timeZone: TZ,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});
const fmtTimeSec = new Intl.DateTimeFormat('en-GB', {
  timeZone: TZ,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

/** "15/04/2026" */
export function formatTRDate(input: string | Date | number): string {
  return fmtDate.format(parseTRDate(input));
}
/** "14:55" */
export function formatTRTime(input: string | Date | number): string {
  return fmtTime.format(parseTRDate(input));
}
/** "14:55:24" */
export function formatTRTimeWithSec(input: string | Date | number): string {
  return fmtTimeSec.format(parseTRDate(input));
}
/** "15/04/2026 · 14:55" */
export function formatTRDateTime(input: string | Date | number): string {
  const d = parseTRDate(input);
  return `${fmtDate.format(d)} · ${fmtTime.format(d)}`;
}
/** "15/04/2026 · 14:55:24" */
export function formatTRDateTimeFull(input: string | Date | number): string {
  const d = parseTRDate(input);
  return `${fmtDate.format(d)} · ${fmtTimeSec.format(d)}`;
}

/** "3m ago", "2h ago", "5d ago" — wall-clock relative to now */
export function relativeTimeTR(input: string | Date | number): string {
  const d = parseTRDate(input);
  const diffMs = Date.now() - d.getTime();
  const s = Math.max(0, Math.floor(diffMs / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}
