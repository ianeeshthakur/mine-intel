import { useEffect, useRef, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

/**
 * Computes the convex hull of a set of [lat, lng] points using the
 * Graham scan algorithm. Returns the hull ring as [lat, lng][] so it
 * can be passed directly to a Leaflet Polygon.
 */
function convexHull(points: [number, number][]): [number, number][] {
  const unique = Array.from(
    new Map(points.map(p => [`${p[0]},${p[1]}`, p])).values()
  );
  if (unique.length < 3) return unique;

  const sorted = [...unique].sort((a, b) =>
    a[1] !== b[1] ? a[1] - b[1] : a[0] - b[0]
  );

  const cross = (
    o: [number, number],
    a: [number, number],
    b: [number, number]
  ) => (a[1] - o[1]) * (b[0] - o[0]) - (a[0] - o[0]) * (b[1] - o[1]);

  const lower: [number, number][] = [];
  for (const p of sorted) {
    while (
      lower.length >= 2 &&
      cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0
    ) lower.pop();
    lower.push(p);
  }

  const upper: [number, number][] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (
      upper.length >= 2 &&
      cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0
    ) upper.pop();
    upper.push(p);
  }

  lower.pop();
  upper.pop();
  return [...lower, ...upper];
}

/**
 * Pads each hull vertex outward from the centroid by `padDeg` degrees.
 */
function padHull(hull: [number, number][], padDeg = 0.01): [number, number][] {
  if (hull.length === 0) return hull;
  const clat = hull.reduce((s, p) => s + p[0], 0) / hull.length;
  const clng = hull.reduce((s, p) => s + p[1], 0) / hull.length;
  return hull.map(([lat, lng]) => {
    const dlat = lat - clat;
    const dlng = lng - clng;
    const len = Math.sqrt(dlat * dlat + dlng * dlng) || 1;
    return [lat + (dlat / len) * padDeg, lng + (dlng / len) * padDeg] as [number, number];
  });
}

interface UseClusterBoundaryOptions {
  /** Default stroke / fill color. Default: '#3b82f6' */
  color?: string;
  /** Fill opacity. Default: 0.08 */
  fillOpacity?: number;
  /** Stroke weight in pixels. Default: 2.5 */
  weight?: number;
  /** SVG dash-array string. Default: '8 5' */
  dashArray?: string;
}

/**
 * useClusterBoundary
 *
 * Creates ONE persistent L.layerGroup on the Leaflet map that holds the
 * active cluster boundary polygon (built from real lat/lng coordinates).
 *
 * Rules:
 *  - The layer group is NEVER cleared on zoomend / moveend / viewreset.
 *  - `drawBoundary` clears the previous polygon then draws the new one.
 *  - `clearBoundary` removes the current polygon.
 *  - The polygon is `interactive: false` so clicks fall through.
 *
 * @returns { drawBoundary, clearBoundary }
 */
export function useClusterBoundary(opts: UseClusterBoundaryOptions = {}) {
  const map = useMap();
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!map) return;
    const group = L.layerGroup().addTo(map);
    layerGroupRef.current = group;
    return () => {
      group.clearLayers();
      map.removeLayer(group);
      layerGroupRef.current = null;
    };
  }, [map]);

  const clearBoundary = useCallback(() => {
    layerGroupRef.current?.clearLayers();
  }, []);

  /**
   * drawBoundary
   * @param childMarkers  Leaflet CircleMarker[] from cluster.getAllChildMarkers()
   * @param color         Per-call color override (any CSS color string)
   */
  const drawBoundary = useCallback(
    (childMarkers: L.CircleMarker[], color?: string) => {
      const group = layerGroupRef.current;
      if (!group) return;

      const points: [number, number][] = childMarkers.map(m => {
        const ll = m.getLatLng();
        return [ll.lat, ll.lng];
      });
      if (points.length === 0) return;

      const hull = padHull(convexHull(points));
      if (hull.length === 0) return;

      const strokeColor = color ?? opts.color ?? '#3b82f6';

      // Clear previous, draw new — never on zoom/pan events
      group.clearLayers();
      L.polygon(hull, {
        color:       strokeColor,
        fillColor:   strokeColor,
        fillOpacity: opts.fillOpacity ?? 0.08,
        weight:      opts.weight      ?? 2.5,
        dashArray:   opts.dashArray   ?? '8 5',
        interactive: false,
      }).addTo(group);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [opts.color, opts.fillOpacity, opts.weight, opts.dashArray]
  );

  return { drawBoundary, clearBoundary };
}
