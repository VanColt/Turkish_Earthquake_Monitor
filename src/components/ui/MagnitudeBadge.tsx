import { magnitudeVar } from '@/lib/magnitude';

export function MagnitudeBadge({
  mag,
  size = 'sm',
}: {
  mag: number;
  size?: 'sm' | 'md' | 'lg';
}) {
  const px = size === 'lg' ? 'px-2 py-0.5 text-sm' : size === 'md' ? 'px-1.5 py-0.5 text-xs' : 'px-1.5 text-[11px]';
  return (
    <span
      className={`mono inline-flex items-center gap-1 border ${px}`}
      style={{
        color: magnitudeVar(mag),
        borderColor: magnitudeVar(mag),
        background: 'transparent',
      }}
    >
      <span className="opacity-60">M</span>
      <span className="tabular-nums font-medium">{mag.toFixed(1)}</span>
    </span>
  );
}

export function MagnitudeBar({ mag, className = '' }: { mag: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, (mag / 8) * 100));
  return (
    <div
      className={`h-1 w-14 bg-[var(--bg-2)] overflow-hidden ${className}`}
      style={{ borderRadius: 1 }}
    >
      <div
        className="h-full"
        style={{ width: `${pct}%`, background: magnitudeVar(mag) }}
      />
    </div>
  );
}
