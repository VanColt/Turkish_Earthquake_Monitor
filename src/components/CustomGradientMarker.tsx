'use client';

import { useEffect, useRef } from 'react';
import { Marker, useMap } from 'react-leaflet';
import L from 'leaflet';

interface CustomGradientMarkerProps {
  position: [number, number];
  radius: number;
  color: string;
  opacity: number;
  onClick?: () => void;
}

const CustomGradientMarker: React.FC<CustomGradientMarkerProps> = ({
  position,
  radius,
  color,
  opacity,
  onClick
}) => {
  const markerRef = useRef<L.Marker | null>(null);
  const map = useMap();

  useEffect(() => {
    if (!markerRef.current) return;

    // Create a canvas element for the gradient
    const canvas = document.createElement('canvas');
    const size = radius * 2.5; // Make canvas slightly larger than the visible gradient
    canvas.width = size;
    canvas.height = size;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Create a radial gradient
    const gradient = ctx.createRadialGradient(
      size / 2, 
      size / 2, 
      0, 
      size / 2, 
      size / 2, 
      radius
    );
    
    // Parse the color to get RGB values
    let r = 0, g = 200, b = 255; // Default blue
    if (color.includes('rgb')) {
      const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (match) {
        r = parseInt(match[1]);
        g = parseInt(match[2]);
        b = parseInt(match[3]);
      }
    }
    
    // Add color stops to create a soft gradient
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${opacity})`);
    gradient.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, ${opacity * 0.7})`);
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
    
    // Fill the canvas with the gradient
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    // Create a custom icon using the canvas
    const icon = L.divIcon({
      html: `<div style="
        width: ${size}px; 
        height: ${size}px; 
        background-image: url(${canvas.toDataURL()}); 
        background-size: contain;
        filter: drop-shadow(0 0 ${radius/2}px rgba(${r}, ${g}, ${b}, 0.8));
      "></div>`,
      className: 'custom-gradient-marker',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2]
    });
    
    // Update the marker with the new icon
    markerRef.current.setIcon(icon);
  }, [position, radius, color, opacity]);
  
  return (
    <Marker
      position={position}
      ref={markerRef}
      eventHandlers={{
        click: onClick
      }}
    />
  );
};

export default CustomGradientMarker;
