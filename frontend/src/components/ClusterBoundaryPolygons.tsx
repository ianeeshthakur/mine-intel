import { useEffect, useState } from 'react';
import { Polygon, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';

interface ClusterData {
  id: number;
  positions: L.LatLng[];
  count: number;
  avgScore: number;
  minScore: number;
  maxScore: number;
  centroid: L.LatLng;
  opacity: number;
  color: string;
}

// Generate a small circular polygon around a point for degenerate hulls (e.g. 2 points)
function generateFallbackPolygon(center: L.LatLng, radiusMeters: number = 300): L.LatLng[] {
  const points: L.LatLng[] = [];
  const earthRadius = 6378137; // meters
  for (let i = 0; i < 360; i += 30) {
    const rad = i * (Math.PI / 180);
    const lat = center.lat + (radiusMeters / earthRadius) * (180 / Math.PI) * Math.cos(rad);
    const lng = center.lng + (radiusMeters / earthRadius) * (180 / Math.PI) * Math.sin(rad) / Math.cos(center.lat * Math.PI / 180);
    points.push(new L.LatLng(lat, lng));
  }
  return points;
}

// Very rough approximation of polygon area in square meters (shoelace on lat/lng isn't exact, 
// but sufficient for relative density heuristics within a small region)
function getApproxAreaMeters(points: L.LatLng[]): number {
  if (points.length < 3) return 0;
  let area = 0;
  const earthRadius = 6378137;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    // Convert to rough meters from equator/meridian
    const x1 = points[i].lng * (Math.PI / 180) * earthRadius * Math.cos(points[i].lat * Math.PI / 180);
    const y1 = points[i].lat * (Math.PI / 180) * earthRadius;
    const x2 = points[j].lng * (Math.PI / 180) * earthRadius * Math.cos(points[j].lat * Math.PI / 180);
    const y2 = points[j].lat * (Math.PI / 180) * earthRadius;
    area += (x1 * y2 - x2 * y1);
  }
  return Math.abs(area / 2.0);
}

export default function ClusterBoundaryPolygons({ clusterGroupRef }: { clusterGroupRef: any }) {
  const [clusters, setClusters] = useState<ClusterData[]>([]);
  const map = useMap();

  useEffect(() => {
    if (!clusterGroupRef || !clusterGroupRef.current) return;
    const group = clusterGroupRef.current;

    const updateClusters = () => {
      // Small timeout to allow Leaflet to finish internal DOM clustering updates
      setTimeout(() => {
        const visibleLayers = group.getLayers();
        const clusterData: ClusterData[] = [];

        visibleLayers.forEach((layer: any) => {
          // Identify if this layer is a cluster (has child markers)
          if (typeof layer.getChildCount === 'function' && layer.getChildCount() > 0) {
            const count = layer.getChildCount();
            const children = layer.getAllChildMarkers();
            
            let minScore = 100;
            let maxScore = 0;
            let sumScore = 0;
            let validCount = 0;

            children.forEach((marker: any) => {
              const target = marker.options?.targetData;
              if (target && typeof target.prospectivityScore === 'number') {
                const score = target.prospectivityScore;
                if (score < minScore) minScore = score;
                if (score > maxScore) maxScore = score;
                sumScore += score;
                validCount++;
              }
            });

            const avgScore = validCount > 0 ? Math.round(sumScore / validCount) : 0;
            
            // Map average to color
            const color = avgScore >= 80 ? '#dc2626'
                        : avgScore >= 60 ? '#f97316'
                        : avgScore >= 35 ? '#facc15'
                        : '#22c55e';

            // Extract hull
            let hull: L.LatLng[] = [];
            if (typeof layer.getConvexHull === 'function') {
              hull = layer.getConvexHull();
            }

            // Fallback for degenerate hulls (e.g., 2 points)
            if (!hull || hull.length < 3) {
              hull = generateFallbackPolygon(layer.getLatLng(), 300); // 300m radius
            }

            // Density calculation for opacity
            const areaMeters = getApproxAreaMeters(hull);
            const areaSqKm = areaMeters / 1_000_000;
            let opacity = 0.4;
            
            if (areaSqKm > 0) {
              const density = count / areaSqKm; // targets per sq km
              // Heuristic clamp: max solid at ~10 targets/km2, sparse at ~1 target/km2
              const normalizedDensity = Math.min(Math.max((density - 1) / 9, 0), 1);
              // Map to opacity [0.25, 0.65]
              opacity = 0.25 + (normalizedDensity * 0.40);
            } else {
              opacity = 0.65; // fallback for very small/degenerate areas
            }

            clusterData.push({
              id: layer._leaflet_id,
              positions: hull,
              count,
              avgScore,
              minScore,
              maxScore,
              centroid: layer.getLatLng(),
              opacity,
              color
            });
          }
        });

        setClusters(clusterData);
      }, 50);
    };

    // Listen to map zoom/pan and cluster animation events
    group.on('animationend', updateClusters);
    group.on('layeradd', updateClusters);
    map.on('zoomend', updateClusters);
    map.on('moveend', updateClusters);

    // Initial calculation
    updateClusters();

    return () => {
      group.off('animationend', updateClusters);
      group.off('layeradd', updateClusters);
      map.off('zoomend', updateClusters);
      map.off('moveend', updateClusters);
    };
  }, [clusterGroupRef, map]);

  return (
    <>
      {clusters.map((cluster) => {
        // Text styling
        const textColor = cluster.avgScore >= 60 ? '#ffffff' : '#1e293b';

        return (
          <Polygon
            key={cluster.id}
            positions={cluster.positions}
            pathOptions={{
              fillColor: cluster.color,
              fillOpacity: cluster.opacity,
              color: cluster.color, // solid border matching fill family
              weight: 2,
              opacity: 0.9,
            }}
            eventHandlers={{
              click: () => {
                const group = clusterGroupRef.current;
                if (group) {
                  const layer = group.getLayer(cluster.id);
                  if (layer && typeof layer.zoomToBounds === 'function') {
                    layer.zoomToBounds();
                  }
                }
              }
            }}
          >
            {/* Overlay label at centroid */}
            <Tooltip
              direction="center"
              permanent
              interactive
              className="cluster-boundary-tooltip"
              opacity={1}
            >
              <div 
                className="flex flex-col items-center justify-center rounded px-2 py-1 shadow-sm"
                style={{ 
                  backgroundColor: cluster.color, 
                  color: textColor,
                  border: '1.5px solid rgba(255,255,255,0.8)',
                  pointerEvents: 'none'
                }}
                title={`${cluster.count} targets · avg ${cluster.avgScore}/100 · range ${cluster.minScore}–${cluster.maxScore}`}
              >
                <span className="font-bold text-[11px] leading-tight">{cluster.count} targets</span>
                <span className="font-semibold text-[9px] leading-tight opacity-90">avg {cluster.avgScore}</span>
              </div>
            </Tooltip>
          </Polygon>
        );
      })}
    </>
  );
}
