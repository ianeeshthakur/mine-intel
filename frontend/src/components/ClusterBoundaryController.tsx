import { useEffect } from 'react';
import { useClusterBoundary } from '../hooks/useClusterBoundary';

interface Props {
  /** The react-leaflet-cluster MarkerClusterGroup instance ref */
  clusterGroupRef: React.RefObject<any>;
  /**
   * Optional color for the boundary polygon.
   * Computed per-cluster from the average prospectivity score when omitted.
   */
  color?: string;
}

/**
 * ClusterBoundaryController
 *
 * Must be rendered INSIDE a <MapContainer> so it can call useMap().
 * Attaches a single `clusterclick` listener to the provided
 * MarkerClusterGroup and draws a persistent geo-coordinate boundary
 * polygon around the clicked cluster.
 *
 * Behavior:
 *  - Triggered on CLICK, never on hover.
 *  - Polygon is built from real [lat, lng] of child markers (convex hull).
 *  - Persists across zoom, pan, and viewreset — not removed on map events.
 *  - Clicking a different cluster replaces the previous boundary.
 *  - Color is derived from the cluster's average prospectivity score
 *    (matches the ProspectivityLegend tiers) unless overridden via `color`.
 */
export default function ClusterBoundaryController({ clusterGroupRef, color }: Props) {
  const { drawBoundary, clearBoundary } = useClusterBoundary();

  useEffect(() => {
    const clusterGroup = clusterGroupRef.current;
    if (!clusterGroup) return;

    const handleClusterClick = (e: any) => {
      const cluster = e.layer; // MarkerCluster instance
      const childMarkers = cluster.getAllChildMarkers();

      // Derive color from average prospectivity score (same tiers as legend)
      let resolvedColor = color;
      if (!resolvedColor) {
        let sum = 0;
        let count = 0;
        childMarkers.forEach((m: any) => {
          const score = m.options?.targetData?.prospectivityScore;
          if (typeof score === 'number') { sum += score; count++; }
        });
        const avg = count > 0 ? sum / count : 0;
        resolvedColor =
          avg >= 80 ? '#dc2626' :  // Very High — red
          avg >= 60 ? '#f97316' :  // High — orange
          avg >= 35 ? '#eab308' :  // Medium — yellow (darker for visibility)
                      '#16a34a';  // Low — green
      }

      drawBoundary(childMarkers, resolvedColor);
    };

    clusterGroup.on('clusterclick', handleClusterClick);

    return () => {
      clusterGroup.off('clusterclick', handleClusterClick);
      clearBoundary();
    };
  }, [clusterGroupRef, color, drawBoundary, clearBoundary]);

  return null;
}
