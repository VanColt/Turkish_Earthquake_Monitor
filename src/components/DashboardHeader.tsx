'use client';

import React, { useEffect, useRef } from 'react';
import { Button } from 'antd';
import { InfoCircleOutlined, GithubOutlined, LinkedinOutlined } from '@ant-design/icons';
import Image from 'next/image';

interface DashboardHeaderProps {
  loading: boolean;
  lastUpdated: Date | null;
  nextRefreshTime?: Date | null;
  onAbout?: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  loading,
  lastUpdated,
  nextRefreshTime,
  onAbout,
}) => {
  const countdownRef = useRef<HTMLSpanElement>(null);
  const nextRef = useRef<Date | null>(null);

  useEffect(() => {
    nextRef.current = nextRefreshTime ?? null;
  }, [nextRefreshTime]);

  useEffect(() => {
    const tick = () => {
      const el = countdownRef.current;
      const next = nextRef.current;
      if (!el || !next) return;
      const diff = next.getTime() - Date.now();
      if (diff <= 0) {
        el.textContent = '—';
        return;
      }
      const m = Math.floor(diff / 60_000);
      const s = Math.floor((diff % 60_000) / 1000);
      el.textContent = `${m}:${s < 10 ? '0' : ''}${s}`;
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 border border-line bg-bg-1">
      <div className="flex items-center gap-4 min-w-0">
        <Image
          src="/tr.png"
          alt="Turkey"
          width={40}
          height={40}
          style={{ filter: 'brightness(0) invert(1)', opacity: 0.85 }}
        />
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <h1 className="text-[15px] font-medium text-fg-0 leading-none m-0">
              Turkish Earthquake Monitor
            </h1>
            <span
              className="mono text-[10px] uppercase tracking-[0.1em]"
              style={{
                color: loading ? 'var(--accent)' : 'var(--fg-2)',
              }}
            >
              {loading ? '● LIVE · syncing' : '● LIVE'}
            </span>
          </div>
          <div className="mono text-[10px] text-fg-2 mt-1 flex items-center gap-3">
            {lastUpdated && (
              <span>
                UPDATED <span className="text-fg-1 tabular-nums">{lastUpdated.toLocaleTimeString()}</span>
              </span>
            )}
            {nextRefreshTime && (
              <span>
                NEXT <span className="text-fg-1 tabular-nums" ref={countdownRef}>—</span>
              </span>
            )}
            <span className="text-fg-3">·</span>
            <span>Kandilli Observatory</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Button
          type="text"
          icon={<GithubOutlined />}
          href="https://github.com/VanColt/Turkish_Earthquake_Monitor"
          target="_blank"
          className="text-fg-1 hover:text-fg-0"
          title="GitHub"
        />
        <Button
          type="text"
          icon={<LinkedinOutlined />}
          href="https://www.linkedin.com/in/mert-uysal/"
          target="_blank"
          className="text-fg-1 hover:text-fg-0"
          title="LinkedIn"
        />
        {onAbout && (
          <Button
            type="text"
            icon={<InfoCircleOutlined />}
            onClick={onAbout}
            className="text-fg-1 hover:text-fg-0"
            title="About"
          />
        )}
      </div>
    </div>
  );
};

export default DashboardHeader;
