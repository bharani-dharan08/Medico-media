/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Gauge,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  AlertCircle,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import { Patient } from '../types/clinical.ts';
import { calculateEWSTrend } from '../utils/triage.ts';

interface RiskScoringCardProps {
  patient: Patient;
}

export const RiskScoringCard: React.FC<RiskScoringCardProps> = ({ patient }) => {
  const [showCriteria, setShowCriteria] = useState(false);

  const ewsData = calculateEWSTrend(patient.vitalTrends || [], patient.vitals);
  const { currentResult, previousResult, scoreDelta, trendDirection, trendLabel, priorVisitDate } =
    ewsData;

  const score = currentResult.totalScore;
  const isHigh = currentResult.riskLevel === 'HIGH';
  const isMedium = currentResult.riskLevel === 'MEDIUM';
  const isMedLow = currentResult.riskLevel === 'MEDIUM_LOW';
  const isLow = currentResult.riskLevel === 'LOW';

  // Semicircular Gauge needle calculation
  // Total gauge range 0 to 14 points mapped across 180 degrees (-90 to +90 deg)
  const maxScale = 14;
  const clampedScore = Math.min(maxScale, Math.max(0, score));
  const needleAngle = -90 + (clampedScore / maxScale) * 180;

  // Color tokens
  const scoreColor = isHigh
    ? '#f43f5e' // Rose-500
    : isMedium
    ? '#f97316' // Orange-500
    : isMedLow
    ? '#eab308' // Yellow-500
    : '#10b981'; // Emerald-500

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-slate-100 shadow-xs">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-teal-500/20 text-teal-400">
            <Gauge className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
                Clinical Risk Scoring · Early Warning Score (NEWS2)
              </h3>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                  isHigh
                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                    : isMedium
                    ? 'bg-orange-950 text-orange-300 border border-orange-800'
                    : isMedLow
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}
              >
                {isHigh ? (
                  <AlertCircle className="w-3 h-3 text-rose-400" />
                ) : isMedium || isMedLow ? (
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                ) : (
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                )}
                {currentResult.badgeText}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Standardized physiological deterioration index based on real-time vitals
            </p>
          </div>
        </div>

        {/* Trend Indicator Pill */}
        <div className="flex items-center gap-2 shrink-0">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-semibold border ${
              trendDirection === 'worsening'
                ? 'bg-rose-950/60 text-rose-300 border-rose-800'
                : trendDirection === 'improving'
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            {trendDirection === 'worsening' ? (
              <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
            ) : trendDirection === 'improving' ? (
              <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Minus className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>{trendLabel}</span>
          </div>

          <button
            onClick={() => setShowCriteria(!showCriteria)}
            className="flex items-center gap-1 px-2 py-1 text-[11px] text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors cursor-pointer"
            title="View NEWS2 scoring rubric criteria"
          >
            <Info className="w-3 h-3" />
            <span className="hidden sm:inline">Rubric</span>
            {showCriteria ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Main Grid: Semicircular Color-Coded Gauge + Breakdown Pillars */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        {/* Left: Calibrated Semicircular Gauge (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
          <div className="relative w-52 h-28 flex items-end justify-center">
            {/* SVG Semicircular Gauge Track with Color Zones */}
            <svg viewBox="0 0 200 110" className="w-full h-full overflow-visible">
              {/* Arc definitions: 180 degrees total from (-90 to 90) */}
              {/* Zone 1: Green (0-2) -> 0 to 25.7 deg */}
              <path
                d="M 20 100 A 80 80 0 0 1 45.4 43.4"
                fill="none"
                stroke="#10b981"
                strokeWidth="14"
                strokeLinecap="round"
                className="opacity-90"
              />
              {/* Zone 2: Yellow (3-4) -> 25.7 to 51.4 deg */}
              <path
                d="M 47 41.5 A 80 80 0 0 1 83.2 22.1"
                fill="none"
                stroke="#eab308"
                strokeWidth="14"
                className="opacity-90"
              />
              {/* Zone 3: Orange (5-6) -> 51.4 to 77.1 deg */}
              <path
                d="M 86 21.2 A 80 80 0 0 1 128.5 24.3"
                fill="none"
                stroke="#f97316"
                strokeWidth="14"
                className="opacity-90"
              />
              {/* Zone 4: Red (7-14) -> 77.1 to 180 deg */}
              <path
                d="M 131.5 25.8 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="#f43f5e"
                strokeWidth="14"
                strokeLinecap="round"
                className="opacity-90"
              />

              {/* Ticks and Zone Labels */}
              <text x="18" y="108" fill="#94a3b8" fontSize="8" fontFamily="monospace">0</text>
              <text x="50" y="32" fill="#10b981" fontSize="7" fontWeight="bold" fontFamily="monospace">LOW</text>
              <text x="100" y="14" fill="#f97316" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="monospace">MED</text>
              <text x="145" y="32" fill="#f43f5e" fontSize="7" fontWeight="bold" fontFamily="monospace">HIGH</text>
              <text x="178" y="108" fill="#94a3b8" fontSize="8" fontFamily="monospace">14+</text>

              {/* Needle Hub */}
              <circle cx="100" cy="100" r="7" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />

              {/* Gauge Needle Pointer */}
              <line
                x1="100"
                y1="100"
                x2="100"
                y2="30"
                stroke={scoreColor}
                strokeWidth="3.5"
                strokeLinecap="round"
                transform={`rotate(${needleAngle} 100 100)`}
                className="transition-transform duration-500 ease-out"
              />
            </svg>

            {/* Score Readout Overlay */}
            <div className="absolute bottom-0 flex flex-col items-center">
              <div
                className="text-3xl font-extrabold font-mono tabular-nums leading-none"
                style={{ color: scoreColor }}
              >
                {score}
              </div>
              <span className="text-[10px] font-mono text-slate-400 mt-0.5">
                POINTS / 14
              </span>
            </div>
          </div>

          <div className="text-center mt-2">
            <span
              className="text-xs font-bold tracking-wide"
              style={{ color: scoreColor }}
            >
              {currentResult.riskLabel}
            </span>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              Prior Encounter: <span className="text-slate-200 font-semibold">{previousResult?.totalScore ?? '0'} pts</span> ({priorVisitDate})
            </div>
          </div>
        </div>

        {/* Right: Physiological Breakdown (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block font-semibold">
            Parameter Points Contribution (NEWS2 Physiological Weights):
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {/* Resp Rate */}
            <div
              className={`p-2 rounded border text-left text-xs ${
                currentResult.breakdown.respRate.score > 0
                  ? currentResult.breakdown.respRate.score >= 3
                    ? 'bg-rose-950/40 border-rose-700'
                    : 'bg-amber-950/30 border-amber-700'
                  : 'bg-slate-950/60 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Resp Rate</span>
                <span
                  className={`font-mono font-bold ${
                    currentResult.breakdown.respRate.score > 0 ? 'text-amber-400' : 'text-slate-400'
                  }`}
                >
                  +{currentResult.breakdown.respRate.score}
                </span>
              </div>
              <div className="font-bold text-white font-mono tabular-nums mt-0.5">
                {currentResult.breakdown.respRate.value} <span className="text-[10px] font-normal text-slate-400">rpm</span>
              </div>
              <div className="text-[9px] text-slate-400 truncate mt-0.5">
                {currentResult.breakdown.respRate.label}
              </div>
            </div>

            {/* SpO2 */}
            <div
              className={`p-2 rounded border text-left text-xs ${
                currentResult.breakdown.spo2.score > 0
                  ? currentResult.breakdown.spo2.score >= 3
                    ? 'bg-rose-950/40 border-rose-700'
                    : 'bg-amber-950/30 border-amber-700'
                  : 'bg-slate-950/60 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>SpO2</span>
                <span
                  className={`font-mono font-bold ${
                    currentResult.breakdown.spo2.score > 0 ? 'text-rose-400' : 'text-slate-400'
                  }`}
                >
                  +{currentResult.breakdown.spo2.score}
                </span>
              </div>
              <div className="font-bold text-white font-mono tabular-nums mt-0.5">
                {currentResult.breakdown.spo2.value}%
              </div>
              <div className="text-[9px] text-slate-400 truncate mt-0.5">
                {currentResult.breakdown.spo2.label}
              </div>
            </div>

            {/* Systolic BP */}
            <div
              className={`p-2 rounded border text-left text-xs ${
                currentResult.breakdown.systolic.score > 0
                  ? currentResult.breakdown.systolic.score >= 3
                    ? 'bg-rose-950/40 border-rose-700'
                    : 'bg-amber-950/30 border-amber-700'
                  : 'bg-slate-950/60 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Systolic BP</span>
                <span
                  className={`font-mono font-bold ${
                    currentResult.breakdown.systolic.score > 0 ? 'text-rose-400' : 'text-slate-400'
                  }`}
                >
                  +{currentResult.breakdown.systolic.score}
                </span>
              </div>
              <div className="font-bold text-white font-mono tabular-nums mt-0.5">
                {currentResult.breakdown.systolic.value} <span className="text-[10px] font-normal text-slate-400">mmHg</span>
              </div>
              <div className="text-[9px] text-slate-400 truncate mt-0.5">
                {currentResult.breakdown.systolic.label}
              </div>
            </div>

            {/* Heart Rate */}
            <div
              className={`p-2 rounded border text-left text-xs ${
                currentResult.breakdown.heartRate.score > 0
                  ? currentResult.breakdown.heartRate.score >= 3
                    ? 'bg-rose-950/40 border-rose-700'
                    : 'bg-amber-950/30 border-amber-700'
                  : 'bg-slate-950/60 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Heart Rate</span>
                <span
                  className={`font-mono font-bold ${
                    currentResult.breakdown.heartRate.score > 0 ? 'text-amber-400' : 'text-slate-400'
                  }`}
                >
                  +{currentResult.breakdown.heartRate.score}
                </span>
              </div>
              <div className="font-bold text-white font-mono tabular-nums mt-0.5">
                {currentResult.breakdown.heartRate.value} <span className="text-[10px] font-normal text-slate-400">bpm</span>
              </div>
              <div className="text-[9px] text-slate-400 truncate mt-0.5">
                {currentResult.breakdown.heartRate.label}
              </div>
            </div>

            {/* Temp */}
            <div
              className={`p-2 rounded border text-left text-xs ${
                currentResult.breakdown.temp.score > 0
                  ? 'bg-amber-950/30 border-amber-700'
                  : 'bg-slate-950/60 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Temp</span>
                <span
                  className={`font-mono font-bold ${
                    currentResult.breakdown.temp.score > 0 ? 'text-amber-400' : 'text-slate-400'
                  }`}
                >
                  +{currentResult.breakdown.temp.score}
                </span>
              </div>
              <div className="font-bold text-white font-mono tabular-nums mt-0.5">
                {currentResult.breakdown.temp.value}°F
              </div>
              <div className="text-[9px] text-slate-400 truncate mt-0.5">
                {currentResult.breakdown.temp.label}
              </div>
            </div>
          </div>

          {/* Action Protocol Directive */}
          <div
            className={`p-2.5 rounded border text-xs flex items-start gap-2 ${
              isHigh
                ? 'bg-rose-950/30 border-rose-800/80 text-rose-200'
                : isMedium || isMedLow
                ? 'bg-amber-950/20 border-amber-800/80 text-amber-200'
                : 'bg-slate-950/70 border-slate-800 text-slate-300'
            }`}
          >
            <span className="font-bold uppercase tracking-wider font-mono text-[10px] shrink-0 text-white pt-0.5">
              Clinical Protocol:
            </span>
            <p className="leading-relaxed text-[11px]">
              {currentResult.actionProtocol}
            </p>
          </div>
        </div>
      </div>

      {/* Collapsible NEWS2 Rubric Reference */}
      {showCriteria && (
        <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-300 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-white font-mono uppercase text-[10px]">
              Royal College of Physicians NEWS2 Standard Scoring Thresholds:
            </span>
            <span className="text-[10px] text-teal-400">Validated Inpatient & Ambulatory Tool</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[10px] font-mono">
            <div className="p-2 bg-emerald-950/30 border border-emerald-800/60 rounded">
              <span className="font-bold text-emerald-400 block mb-0.5">SCORE 0 – 2 (LOW)</span>
              <span>Ward/clinic routine monitoring q4-6h. Stable envelope.</span>
            </div>
            <div className="p-2 bg-amber-950/30 border border-amber-800/60 rounded">
              <span className="font-bold text-amber-400 block mb-0.5">SCORE 3 – 4 (LOW-MED)</span>
              <span>Single red flag (3 pts in 1 vital) or combined 3-4. Recheck q1h.</span>
            </div>
            <div className="p-2 bg-orange-950/30 border border-orange-800/60 rounded">
              <span className="font-bold text-orange-400 block mb-0.5">SCORE 5 – 6 (MEDIUM)</span>
              <span>Urgent physician assessment. Acute intervention & q30m monitoring.</span>
            </div>
            <div className="p-2 bg-rose-950/30 border border-rose-800/60 rounded">
              <span className="font-bold text-rose-400 block mb-0.5">SCORE 7+ (CRITICAL)</span>
              <span>Emergency team activation / ICU triage transfer immediately.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
