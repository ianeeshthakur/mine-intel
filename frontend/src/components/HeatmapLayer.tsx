import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

interface HeatmapLayerProps {
  points: [number, number, number][]; // [lat, lng, intensity]
}

export default function HeatmapLayer({ points }: HeatmapLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (!map || points.length === 0) return;

    // Normalize scores: data is already 0-1 but scores cluster 0.75-0.95.
    // Re-map into 0-1 range so the full gradient is visible.
    const scores = points.map(p => p[2]);
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    const range = maxScore - minScore || 0.01;

    const normalized = points.map(([lat, lng, s]) => [
      lat,
      lng,
      (s - minScore) / range // 0→1 across actual data range
    ] as [number, number, number]);

    // @ts-ignore - leaflet.heat extends L at runtime
    const heatLayer = L.heatLayer(normalized, {
      radius: 18,       // tighter radius → distinct zones not one big blob
      blur: 12,
      maxZoom: 17,
      max: 1.0,
      // Blue → Green → Yellow → Orange → Red (scientific prospectivity)
      gradient: {
        0.00: '#3b82f6', // blue   — low
        0.35: '#22c55e', // green  — low-medium
        0.55: '#facc15', // yellow — medium
        0.72: '#f97316', // orange — high
        1.00: '#dc2626'  // red    — very high
      }
    }).addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points]);

  return null;
}
