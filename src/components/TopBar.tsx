'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

interface TopBarProps {
  loading: boolean;
  eventCount: number;
  onAbout: () => void;
}

export default function TopBar({ loading, eventCount, onAbout }: TopBarProps) {
  const [now, setNow] = useState<string>('');

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setNow(
        `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')} ` +
          `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}:${String(d.getUTCSeconds()).padStart(2, '0')} UTC`
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="pointer-events-none absolute top-0 left-0 right-0 z-30 flex items-start justify-between p-4">
      {/* Left: logo + mission name */}
      <div className="glass pointer-events-auto flex items-center gap-3 px-3 py-2">
        <Image
          src="/tr.png"
          alt="TR"
          width={28}
          height={28}
          style={{ filter: 'brightness(0) invert(1)', opacity: 0.95 }}
          priority
        />
        <div className="flex flex-col">
          <div className="display tracked text-[13px] font-semibold text-ink leading-none">
            KANDILLI
          </div>
          <div className="display tracked text-[9px] text-ink-2 leading-none mt-1">
            ORBITAL SEISMIC MONITOR · TR
          </div>
        </div>
      </div>

      {/* Center: live / clock / count */}
      <div className="glass pointer-events-auto hidden md:flex items-center gap-5 px-4 py-2">
        <div className="flex items-center gap-2">
          <span
            className={`inline-block w-1.5 h-1.5 rounded-full ${loading ? 'sig-pulse' : ''}`}
            style={{ background: 'var(--sig)' }}
          />
          <span className="display tracked text-[10px] text-sig">
            {loading ? 'SYNCING' : 'LIVE'}
          </span>
        </div>
        <div className="h-4 w-px bg-line" />
        <div className="mono text-[11px] text-ink-1">{now}</div>
        <div className="h-4 w-px bg-line" />
        <div className="flex items-baseline gap-1.5">
          <span className="mono tabular-nums text-[13px] text-ink">{eventCount}</span>
          <span className="display tracked text-[9px] text-ink-2">EVENTS / 24H</span>
        </div>
      </div>

      {/* Right: socials + about */}
      <div className="glass pointer-events-auto flex items-center gap-1 px-2 py-1.5">
        <a
          href="https://github.com/VanColt/Turkish_Earthquake_Monitor"
          target="_blank"
          rel="noreferrer"
          className="p-1.5 text-ink-2 hover:text-sig transition-colors"
          title="GitHub"
        >
          <IconGithub />
        </a>
        <a
          href="https://www.linkedin.com/in/mert-uysal/"
          target="_blank"
          rel="noreferrer"
          className="p-1.5 text-ink-2 hover:text-sig transition-colors"
          title="LinkedIn"
        >
          <IconLinkedin />
        </a>
        <button
          onClick={onAbout}
          className="display tracked text-[10px] text-ink-1 hover:text-sig transition-colors px-2 py-1 border border-line hover:border-sig ml-1"
        >
          ABOUT
        </button>
      </div>
    </div>
  );
}

function IconGithub() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38v-1.33c-2.22.48-2.69-1.07-2.69-1.07-.36-.92-.89-1.17-.89-1.17-.73-.5.06-.49.06-.49.81.06 1.23.83 1.23.83.72 1.23 1.87.88 2.33.67.07-.52.28-.88.5-1.08-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

function IconLinkedin() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M13.63 13.63h-2.37v-3.71c0-.88-.02-2.02-1.23-2.02-1.23 0-1.42.96-1.42 1.95v3.78H6.25V5.75h2.28v1.08h.03c.32-.6 1.09-1.23 2.25-1.23 2.4 0 2.85 1.58 2.85 3.64v4.39zM3.56 4.67a1.38 1.38 0 1 1 0-2.75 1.38 1.38 0 0 1 0 2.75zm1.19 8.96H2.38V5.75h2.37v7.88zM14.82 0H1.18C.53 0 0 .52 0 1.15v13.7C0 15.48.53 16 1.18 16h13.64c.65 0 1.18-.52 1.18-1.15V1.15C16 .52 15.47 0 14.82 0z" />
    </svg>
  );
}
