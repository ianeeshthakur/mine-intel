import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { FileText, Download, TrendingUp, Calculator, BarChart3, AlertTriangle, Target, Shield, Clock } from 'lucide-react';
import jsPDF from 'jspdf';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

interface TargetData {
  id: number;
  targetId: string;
  prospectivityScore: number;
  priority: string;
  fieldStatus: string;
  mlScored: boolean;
  explanationText?: string;
  featureContributionsJson?: string;
  latitude: number;
  longitude: number;
}

export default function ReportsImpact() {
  const [targets, setTargets] = useState<TargetData[]>([]);
  const [costPerTarget, setCostPerTarget] = useState(15); // ₹ lakh
  const [budgetTargets, setBudgetTargets] = useState(20); // how many targets budget covers

  useEffect(() => {
    fetch(`${API_BASE}/api/targets`)
      .then(res => res.json())
      .then(data => setTargets(data))
      .catch(console.error);
  }, []);

  // ── Section 1: Prioritization Impact Calculator ──────────────────────
  const calculations = useMemo(() => {
    if (targets.length === 0) return null;

    const allScores = targets.map(t => t.prospectivityScore);
    const avgAllTargets = allScores.reduce((a, b) => a + b, 0) / allScores.length;

    // AI-ranked: top N by score (already sorted DESC from API)
    const topN = targets.slice(0, budgetTargets);
    const topNScores = topN.map(t => t.prospectivityScore);
    const avgTopN = topNScores.length > 0
      ? topNScores.reduce((a, b) => a + b, 0) / topNScores.length
      : 0;

    // Random-order baseline: expected average is the overall average
    const avgRandom = avgAllTargets;

    // Score difference as % improvement
    const scoreDiffPct = avgRandom > 0 ? ((avgTopN - avgRandom) / avgRandom) * 100 : 0;

    // Illustrative value protected:
    // If AI-ranked targets have higher avg score, fewer "wasted" drills
    // Cost avoided = budget × cost × (1 - avgRandom/avgTopN)
    // i.e. the fraction of budget that would have gone to lower-quality targets
    const totalBudgetCost = budgetTargets * costPerTarget;
    const qualityRatio = avgTopN > 0 ? (avgTopN - avgRandom) / avgTopN : 0;
    const valueProtected = totalBudgetCost * Math.max(0, qualityRatio);

    // Very High priority targets in the dataset
    const veryHighTargets = targets.filter(t => t.priority === 'VERY_HIGH');
    const veryHighCount = veryHighTargets.length;

    // Expected verifications to find first Very High target
    // Random order: if K out of N are VH, expected trials = (N+1)/(K+1)
    const randomTrialsForVH = veryHighCount > 0
      ? (targets.length + 1) / (veryHighCount + 1)
      : targets.length;

    // AI-ranked: VH targets are at the top, so first one is found in position 1
    // (or position of first VH in the sorted list)
    const aiTrialsForVH = targets.findIndex(t => t.priority === 'VERY_HIGH') + 1 || 1;

    return {
      avgAllTargets: Math.round(avgAllTargets * 10) / 10,
      avgTopN: Math.round(avgTopN * 10) / 10,
      avgRandom: Math.round(avgRandom * 10) / 10,
      scoreDiffPct: Math.round(scoreDiffPct * 10) / 10,
      totalBudgetCost,
      valueProtected: Math.round(valueProtected * 10) / 10,
      qualityRatio: Math.round(qualityRatio * 1000) / 10,
      veryHighCount,
      randomTrialsForVH: Math.round(randomTrialsForVH * 10) / 10,
      aiTrialsForVH,
      topN,
    };
  }, [targets, costPerTarget, budgetTargets]);

  // ── Section 2: Impact Comparison Chart Data ──────────────────────
  const chartData = useMemo(() => {
    if (!calculations) return [];
    return [
      {
        metric: 'Avg Score (Top-N)',
        'Random Order': calculations.avgRandom,
        'AI-Ranked': calculations.avgTopN,
      },
      {
        metric: 'Verifications to find VH',
        'Random Order': calculations.randomTrialsForVH,
        'AI-Ranked': calculations.aiTrialsForVH,
      },
    ];
  }, [calculations]);

  // ── Section 3: Executive Report Data ──────────────────────
  const reportData = useMemo(() => {
    if (targets.length === 0) return null;

    const topTarget = targets[0]; // #1 ranked target
    let topContributor = { label: 'N/A', contribution_pct: 0 };
    let secondContributor = { label: 'N/A', contribution_pct: 0 };

    if (topTarget.featureContributionsJson) {
      try {
        const contribs = JSON.parse(topTarget.featureContributionsJson);
        if (contribs.length > 0) topContributor = contribs[0];
        if (contribs.length > 1) secondContributor = contribs[1];
      } catch (e) {}
    }

    // Top 5 targets for the table
    const top5 = targets.slice(0, 5).map(t => {
      let topFactor = 'N/A';
      if (t.featureContributionsJson) {
        try {
          const c = JSON.parse(t.featureContributionsJson);
          if (c.length > 0) topFactor = c[0].label;
        } catch (e) {}
      }
      return {
        targetId: t.targetId,
        score: t.prospectivityScore,
        priority: t.priority,
        topFactor,
        fieldStatus: t.fieldStatus,
        mlScored: t.mlScored,
      };
    });

    return { topTarget, topContributor, secondContributor, top5 };
  }, [targets]);

  // ── PDF Export ──────────────────────
  const downloadPDF = () => {
    if (!reportData || !calculations) return;

    const doc = new jsPDF();
    const margin = 20;
    let y = margin;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('MINE-INTEL: Executive Evidence Brief', margin, y);
    y += 10;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120);
    doc.text(`Generated: ${new Date().toLocaleString()} | Region: Balaghat, Madhya Pradesh`, margin, y);
    y += 4;
    doc.text('SIMULATED DEMO DATA — Prospectivity is likelihood, not confirmed reserves.', margin, y);
    doc.setTextColor(0);
    y += 10;

    // Executive Summary
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Executive Summary', margin, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const summaryLines = doc.splitTextToSize(
      `${reportData.topTarget.targetId} is the highest-priority verification target in the current run, ` +
      `with a prospectivity score of ${reportData.topTarget.prospectivityScore}/100. ` +
      `The strongest contributing factor is ${reportData.topContributor.label} ` +
      `(${reportData.topContributor.contribution_pct}% of model evidence weighting). ` +
      `${reportData.secondContributor.label} is the second contributor ` +
      `(${reportData.secondContributor.contribution_pct}%). ` +
      `Field verification is required before any operational decision.`,
      170
    );
    doc.text(summaryLines, margin, y);
    y += summaryLines.length * 5 + 6;

    // Prioritization Impact
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Prioritization Impact (Illustrative)', margin, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const impactLines = [
      `Budget: ${calculations.totalBudgetCost} lakh (${budgetTargets} targets x ${costPerTarget} lakh/target)`,
      `Average score of AI-ranked top-${budgetTargets}: ${calculations.avgTopN}/100`,
      `Average score (random/unprioritized): ${calculations.avgRandom}/100`,
      `Score improvement: +${calculations.scoreDiffPct}%`,
      `Illustrative value protected: Rs ${calculations.valueProtected} lakh`,
    ];
    impactLines.forEach(line => {
      doc.text(line, margin, y);
      y += 5;
    });
    y += 6;

    // Top Targets Table
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Top Priority Targets', margin, y);
    y += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Target', margin, y);
    doc.text('Score', margin + 30, y);
    doc.text('Priority', margin + 52, y);
    doc.text('Top Contributor', margin + 85, y);
    doc.text('Field Status', margin + 140, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    reportData.top5.forEach(t => {
      doc.text(t.targetId, margin, y);
      doc.text(`${t.score}/100`, margin + 30, y);
      doc.text(t.priority.replace('_', ' '), margin + 52, y);
      doc.text(t.topFactor, margin + 85, y);
      doc.text(t.fieldStatus, margin + 140, y);
      y += 5;
    });
    y += 6;

    // Disclaimer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      'Disclaimer: All values are Simulated Demo Data. Prospectivity scores are ML model outputs, not confirmed reserves.',
      margin, y
    );
    y += 4;
    doc.text(
      'Field verification is required before any operational or investment decision. Illustrative impact values are based on stated assumptions.',
      margin, y
    );

    doc.save('MINE-INTEL_Evidence_Brief.pdf');
  };

  if (targets.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-500 text-sm">Loading report data…</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <FileText className="w-7 h-7 text-blue-600" />
            Reports & Impact
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Evidence-based prioritization impact, computed from real ML output.
          </p>
        </div>
        <button
          onClick={downloadPDF}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold text-sm rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" />
          Download PDF Report
        </button>
      </div>

      {/* ═══════════ Section 1: Prioritization Impact Calculator ═══════════ */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-blue-600" />
          <h2 className="font-bold text-slate-800">Prioritization Impact Calculator</h2>
          <span className="ml-auto text-[10px] uppercase tracking-wider text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded">
            Illustrative · Simulated Demo Data
          </span>
        </div>

        <div className="p-6">
          {/* Sliders */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Cost per drilling verification (₹ lakh)
              </label>
              <input
                type="range"
                min={5}
                max={50}
                value={costPerTarget}
                onChange={e => setCostPerTarget(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>₹5L</span>
                <span className="font-bold text-blue-700 text-sm">₹{costPerTarget}L</span>
                <span>₹50L</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 italic">
                Labeled assumption — editable. Real cost varies by terrain and method.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Targets your budget can cover this cycle
              </label>
              <input
                type="range"
                min={5}
                max={100}
                value={budgetTargets}
                onChange={e => setBudgetTargets(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>5</span>
                <span className="font-bold text-blue-700 text-sm">{budgetTargets} targets</span>
                <span>100</span>
              </div>
            </div>
          </div>

          {/* Results Cards */}
          {calculations && (
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
                <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">AI-Ranked Top-{budgetTargets} Avg</div>
                <div className="text-3xl font-extrabold text-blue-800">{calculations.avgTopN}</div>
                <div className="text-xs text-blue-500 mt-1">/100 prospectivity</div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Random Order Avg</div>
                <div className="text-3xl font-extrabold text-slate-600">{calculations.avgRandom}</div>
                <div className="text-xs text-slate-400 mt-1">/100 (all {targets.length} targets)</div>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-4">
                <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Score Improvement</div>
                <div className="text-3xl font-extrabold text-emerald-700">+{calculations.scoreDiffPct}%</div>
                <div className="text-xs text-emerald-500 mt-1">vs. unprioritized</div>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-4">
                <div className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Illustrative Value Protected</div>
                <div className="text-3xl font-extrabold text-amber-700">₹{calculations.valueProtected}L</div>
                <div className="text-xs text-amber-500 mt-1">
                  = {budgetTargets} × ₹{costPerTarget}L × {calculations.qualityRatio}% quality gain
                </div>
              </div>
            </div>
          )}

          {/* Transparent Methodology */}
          <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100 text-[11px] text-slate-500 leading-relaxed">
            <strong className="text-slate-600">How this is computed:</strong> The AI-ranked average is the mean prospectivity score of the top-{budgetTargets}
            targets sorted by ML score. The random-order average is the mean of all {targets.length} targets. Value protected = total budget ×
            (AI avg − random avg) / AI avg. All scores come from the trained ML model's real output via <code>/api/targets</code>. This is
            illustrative — actual exploration outcomes depend on field conditions.
          </div>
        </div>
      </div>

      {/* ═══════════ Section 2: Impact Comparison Chart ═══════════ */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h2 className="font-bold text-slate-800">Impact Comparison</h2>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-8">
            {/* Chart */}
            <div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} barGap={8}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="metric" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{
                      background: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Bar dataKey="Random Order" radius={[4, 4, 0, 0]} fill="#94a3b8" />
                  <Bar dataKey="AI-Ranked" radius={[4, 4, 0, 0]} fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex items-center justify-center gap-6 mt-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-slate-400" />
                  <span className="text-slate-500">Random/Unprioritized</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-blue-600" />
                  <span className="text-slate-500">MINE-INTEL (AI-Ranked)</span>
                </div>
              </div>
            </div>

            {/* Metric Cards */}
            {calculations && (
              <div className="space-y-4">
                <MetricComparisonCard
                  icon={<Target className="w-5 h-5 text-blue-500" />}
                  label={`Avg score of first ${budgetTargets} targets investigated`}
                  randomValue={`${calculations.avgRandom}/100`}
                  aiValue={`${calculations.avgTopN}/100`}
                  improvement={`+${calculations.scoreDiffPct}%`}
                  note="Computed from real ML prospectivity scores"
                />
                <MetricComparisonCard
                  icon={<Shield className="w-5 h-5 text-emerald-500" />}
                  label="Verifications to find first Very High target"
                  randomValue={`~${calculations.randomTrialsForVH}`}
                  aiValue={`${calculations.aiTrialsForVH}`}
                  improvement={`${Math.round((1 - calculations.aiTrialsForVH / calculations.randomTrialsForVH) * 100)}% fewer`}
                  note={`${calculations.veryHighCount} Very High targets exist in ${targets.length} total`}
                />
                <MetricComparisonCard
                  icon={<Clock className="w-5 h-5 text-amber-500" />}
                  label="Estimated time-to-decision"
                  randomValue="6–12 months"
                  aiValue="2–4 months"
                  improvement="~60% faster"
                  note="Illustrative estimate — not computed from app data"
                  isEstimate
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════ Section 3: Executive Report / Evidence Brief ═══════════ */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <h2 className="font-bold text-slate-800">Executive Evidence Brief</h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Auto-generated narrative */}
          {reportData && (
            <>
              <div className="prose prose-sm max-w-none">
                <p className="text-slate-700 leading-relaxed">
                  <strong>{reportData.topTarget.targetId}</strong> is the highest-priority verification target
                  in the current run, with a prospectivity score of{' '}
                  <strong className="text-blue-700">{reportData.topTarget.prospectivityScore}/100</strong>.
                  The strongest contributing factor is{' '}
                  <strong>{reportData.topContributor.label}</strong>{' '}
                  ({reportData.topContributor.contribution_pct}% of model evidence weighting).{' '}
                  <strong>{reportData.secondContributor.label}</strong> is the second contributor
                  ({reportData.secondContributor.contribution_pct}%).
                  {reportData.topTarget.mlScored
                    ? ' This target has been scored by the trained ML model with SHAP-based explainability.'
                    : ' ML scoring has not yet been applied — run Regional AI Analysis first.'}
                  {' '}Field verification is required before any operational decision.
                </p>
              </div>

              {/* Top targets table */}
              <div className="overflow-hidden border border-slate-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
                      <th className="text-left px-4 py-3 font-bold">Priority Area</th>
                      <th className="text-left px-4 py-3 font-bold">Score</th>
                      <th className="text-left px-4 py-3 font-bold">Priority</th>
                      <th className="text-left px-4 py-3 font-bold">Top Contributor</th>
                      <th className="text-left px-4 py-3 font-bold">Field Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.top5.map((t, idx) => (
                      <tr key={t.targetId} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                        <td className="px-4 py-2.5 font-semibold text-slate-800">{t.targetId}</td>
                        <td className="px-4 py-2.5">
                          <span className={`font-bold ${t.score >= 80 ? 'text-red-600' : t.score >= 60 ? 'text-orange-600' : 'text-slate-600'}`}>
                            {t.score}/100
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                            t.priority === 'VERY_HIGH' ? 'bg-red-100 text-red-700' :
                            t.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                            t.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {t.priority.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-600">{t.topFactor}</td>
                        <td className="px-4 py-2.5">
                          <span className={`text-xs font-semibold ${
                            t.fieldStatus === 'CONFIRMED' ? 'text-emerald-600' :
                            t.fieldStatus === 'NOT_CONFIRMED' ? 'text-red-500' :
                            'text-slate-400'
                          }`}>
                            {t.fieldStatus.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Disclaimer */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700 leading-relaxed">
              <strong>Disclaimer:</strong> All values are Simulated Demo Data. Prospectivity scores are ML model
              outputs representing likelihood of mineralization, not confirmed reserves. Field verification is
              required before any operational or investment decision. Illustrative impact values are based on
              the stated cost assumptions and real ML score distributions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────

function MetricComparisonCard({
  icon,
  label,
  randomValue,
  aiValue,
  improvement,
  note,
  isEstimate = false,
}: {
  icon: React.ReactNode;
  label: string;
  randomValue: string;
  aiValue: string;
  improvement: string;
  note: string;
  isEstimate?: boolean;
}) {
  return (
    <div className="border border-slate-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="text-sm font-semibold text-slate-700">{label}</span>
        {isEstimate && (
          <span className="text-[9px] uppercase tracking-wider text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded">
            Estimate
          </span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <div className="text-xs text-slate-400 mb-0.5">Random</div>
          <div className="text-lg font-bold text-slate-500">{randomValue}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-400 mb-0.5">AI-Ranked</div>
          <div className="text-lg font-bold text-blue-700">{aiValue}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-400 mb-0.5">Improvement</div>
          <div className="text-lg font-bold text-emerald-600">{improvement}</div>
        </div>
      </div>
      <p className="text-[10px] text-slate-400 mt-2 italic">{note}</p>
    </div>
  );
}
