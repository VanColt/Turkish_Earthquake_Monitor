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

export { relativeTimeTR as relativeTime } from './datetime';
