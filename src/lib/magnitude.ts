export type MagnitudeTier = 'low' | 'mid' | 'high' | 'max';

export function magnitudeTier(mag: number): MagnitudeTier {
  if (mag >= 6) return 'max';
  if (mag >= 5) return 'high';
  if (mag >= 3) return 'mid';
  return 'low';
}

export function magnitudeVar(mag: number): string {
  return `var(--mag-${magnitudeTier(mag)})`;
}

export function magnitudeLabel(mag: number): string {
  if (mag >= 6) return 'major';
  if (mag >= 5) return 'strong';
  if (mag >= 4) return 'moderate';
  if (mag >= 3) return 'light';
  return 'minor';
}

export function relativeTime(input: string | Date | number): string {
  const d = typeof input === 'string' || typeof input === 'number' ? new Date(input) : input;
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
