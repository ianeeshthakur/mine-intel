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
export function createProspectivityClusterIcon(cluster: any) {
  const count = cluster.getChildCount();
  const children = cluster.getAllChildMarkers();

  let minScore = 100;
  let maxScore = 0;
  let sumScore = 0;
  let validCount = 0;

  children.forEach((marker: any) => {
    // targetData is set as a custom prop on each CircleMarker
    const target = marker.options.targetData;
    if (target && typeof target.prospectivityScore === 'number') {
      const score = target.prospectivityScore;
      if (score < minScore) minScore = score;
      if (score > maxScore) maxScore = score;
      sumScore += score;
      validCount++;
    }
  });

  const avgScore = validCount > 0 ? Math.round(sumScore / validCount) : 0;

  // Map average to the same 4-tier color scale as ProspectivityLegend
  const bgColor = avgScore >= 80 ? '#dc2626'  // Very High — red
                : avgScore >= 60 ? '#f97316'  // High — orange
                : avgScore >= 35 ? '#facc15'  // Medium — yellow
                :                  '#22c55e'; // Low — green

  // Text should be white on dark backgrounds (red/orange), dark on light backgrounds (yellow/green)
  const textColor = avgScore >= 60 ? '#ffffff' : '#1e293b';

  // Tooltip on hover — detailed breakdown
  const rangeText = validCount > 0 ? `range ${minScore}–${maxScore}` : 'no scores';
  const tooltipText = `${count} targets · avg ${avgScore}/100 · ${rangeText}`;

  // Size scales with count
  const width  = count > 15 ? 88 : count > 8 ? 80 : 72;
  const height = count > 15 ? 44 : count > 8 ? 40 : 36;

  return L.divIcon({
    html: `
      <div
        title="${tooltipText}"
        style="
          width: ${width}px; height: ${height}px;
          background: ${bgColor};
          border: 2.5px solid white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.3);
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          color: ${textColor}; font-family: system-ui, sans-serif;
          cursor: pointer;
        "
      >
        <span style="font-weight: 700; font-size: 12px; line-height: 1;">${count} targets</span>
        <span style="font-weight: 600; font-size: 10px; line-height: 1; margin-top: 2px; opacity: 0.85;">avg ${avgScore}</span>
      </div>`,
    className: '',
    iconSize: [width, height],
    iconAnchor: [width / 2, height / 2],
  });
}
