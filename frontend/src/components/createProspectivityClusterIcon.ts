import L from 'leaflet';

/**
 * Shared cluster icon factory — colors clusters by average prospectivity score.
 *
 * Color tiers match the ProspectivityLegend exactly:
 *   Very High (≥80): #dc2626 (red)
 *   High (≥60):      #f97316 (orange)
 *   Medium (≥35):    #facc15 (yellow)
 *   Low (<35):       #22c55e (green)
 *
 * Shape: rounded rectangle (distinct from individual target circles).
 * Label: "N targets · avg XX"
 * Tooltip: "N targets · avg XX/100 · range min–max"
 */
export function createProspectivityClusterIcon(_cluster: any) {
  // The actual boundary polygon and label are now rendered by ClusterBoundaryPolygons.tsx
  // This just returns an invisible/empty icon so MarkerClusterGroup doesn't render its default icons on top
  return L.divIcon({
    html: `<div></div>`,
    className: '',
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}
