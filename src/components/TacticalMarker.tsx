'use client';

import { useEffect, useRef } from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import { magnitudeTier } from '@/lib/magnitude';

interface TacticalMarkerProps {
  position: [number, number];
  mag: number;
  depth: number;
  title: string;
  selected: boolean;
  onClick?: () => void;
}

function ringRadius(mag: number): number {
  // Compact scale: 10px for M<3, up to ~38px for M6+
  return Math.max(10, Math.min(38, 10 + (mag - 2) * 6));
}

function buildIcon(mag: number, depth: number, title: string, selected: boolean): L.DivIcon {
  const tier = magnitudeTier(mag);
  const color = `var(--mag-${tier})`;
  const outer = ringRadius(mag);
  const core = Math.max(3, Math.min(8, 3 + (mag - 2) * 0.8));
  const size = outer * 2 + 4;
  const half = size / 2;
  const strokeOpacity = Math.max(0.35, 1 - depth / 250);
  const dash = depth > 70 ? '2 2' : '0';
  const pulse = selected
    ? `<circle class="tm-pulse" cx="${half}" cy="${half}" r="${outer}" fill="none" stroke="${color}" stroke-width="1" />`
    : '';

  const html = `
    <div class="tm" data-selected="${selected}" style="width:${size}px;height:${size}px;">
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="overflow:visible;">
        ${pulse}
        <circle cx="${half}" cy="${half}" r="${outer}" fill="none"
          stroke="${color}" stroke-width="${selected ? 1.5 : 1}"
          stroke-opacity="${strokeOpacity}" stroke-dasharray="${dash}" />
        <circle cx="${half}" cy="${half}" r="${core}" fill="${color}" />
      </svg>
      <span class="tm-label mono">M${mag.toFixed(1)} · ${title}</span>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'tm-icon',
    iconSize: [size, size],
    iconAnchor: [half, half],
  });
}

const TacticalMarker: React.FC<TacticalMarkerProps> = ({
  position,
  mag,
  depth,
  title,
  selected,
  onClick,
}) => {
  const ref = useRef<L.Marker | null>(null);

  useEffect(() => {
    ref.current?.setIcon(buildIcon(mag, depth, title, selected));
  }, [mag, depth, title, selected]);

  return (
    <Marker
      position={position}
      icon={buildIcon(mag, depth, title, selected)}
      ref={ref}
      eventHandlers={{ click: onClick }}
    />
  );
};

export default TacticalMarker;
