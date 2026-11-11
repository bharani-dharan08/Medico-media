/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, AlertTriangle, CheckCircle, Info, ChevronRight } from 'lucide-react';
import { VitalTrendPoint } from '../types/clinical.ts';
import { assessVitalsStability } from '../utils/triage.ts';

interface VitalsTrendsChartProps {
  trends: VitalTrendPoint[];
  patientName: string;
}

type MetricMode = 'bp' | 'hr_rr' | 'spo2' | 'temp_weight';

export const VitalsTrendsChart: React.FC<VitalsTrendsChartProps> = ({
  trends,
  patientName,
}) => {
  const [metricMode, setMetricMode] = useState<MetricMode>('bp');

  const assessment = assessVitalsStability(trends);

  // Custom high-contrast tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint: VitalTrendPoint = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 rounded-md p-3 text-xs shadow-xl text-slate-100 min-w-[200px] z-50">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1.5">
            <span className="font-bold text-white font-mono">{dataPoint.visitDate}</span>
            <span className="text-[10px] text-teal-400 font-medium">{dataPoint.encounterType}</span>
          </div>

          <div className="space-y-1 font-mono text-[11px] tabular-nums">
            <div className="flex justify-between">
              <span className="text-rose-400">Blood Pressure:</span>
              <span className="font-bold text-white">
                {dataPoint.systolic}/{dataPoint.diastolic} <span className="text-[10px] text-slate-400 font-normal">mmHg</span>
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-amber-400">Heart Rate:</span>
              <span className="font-bold text-white">
                {dataPoint.heartRate} <span className="text-[10px] text-slate-400 font-normal">bpm</span>
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-cyan-400">SpO2 Pulse Ox:</span>
              <span className="font-bold text-white">
                {dataPoint.o2Sat}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-emerald-400">Temperature:</span>
              <span className="font-bold text-white">
                {dataPoint.tempF}°F
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-400">Respiration:</span>
              <span className="font-bold text-white">
                {dataPoint.respRate} rpm
              </span>
            </div>
            {dataPoint.weightLbs && (
              <div className="flex justify-between">
                <span className="text-slate-400">Weight:</span>
                <span className="font-bold text-white">
                  {dataPoint.weightLbs} lbs
                </span>
              </div>
            )}
          </div>

          {dataPoint.clinicalNote && (
            <div className="mt-2 pt-1.5 border-t border-slate-800 text-[10px] text-slate-300 italic">
              "{dataPoint.clinicalNote}"
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-slate-100">
      {/* Header & Stability Assessment */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-teal-500/20 text-teal-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
                Historical Vitals Trends (Last 5 Visits)
              </h3>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                  assessment.stability === 'ACUTE_EXCURSION'
                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                    : assessment.stability === 'MODERATE_DRIFT'
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}
              >
                {assessment.stability === 'ACUTE_EXCURSION' ? (
                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                ) : (
                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                )}
                {assessment.statusBadge}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Trajectory: {assessment.summary}
            </p>
          </div>
        </div>

        {/* Metric Mode Selectors */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-950/80 rounded border border-slate-800 flex-wrap">
          <button
            onClick={() => setMetricMode('bp')}
            className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer whitespace-nowrap ${
              metricMode === 'bp'
                ? 'bg-slate-800 text-white font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Blood Pressure
          </button>
          <button
            onClick={() => setMetricMode('hr_rr')}
            className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer whitespace-nowrap ${
              metricMode === 'hr_rr'
                ? 'bg-slate-800 text-white font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            HR & Resp Rate
          </button>
          <button
            onClick={() => setMetricMode('spo2')}
            className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer whitespace-nowrap ${
              metricMode === 'spo2'
                ? 'bg-slate-800 text-white font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            SpO2 (%)
          </button>
          <button
            onClick={() => setMetricMode('temp_weight')}
            className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer whitespace-nowrap ${
              metricMode === 'temp_weight'
                ? 'bg-slate-800 text-white font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Temp & Weight
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-56 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trends} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.6} />
            <XAxis
              dataKey="visitDate"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#475569' }}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#475569' }}
              domain={
                metricMode === 'bp'
                  ? [60, 200]
                  : metricMode === 'hr_rr'
                  ? [10, 130]
                  : metricMode === 'spo2'
                  ? [88, 100]
                  : [96, 103]
              }
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Mode-specific lines and clinical threshold references */}
            {metricMode === 'bp' && (
              <>
                <ReferenceLine y={140} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Stage 2 HTN (140)', fill: '#f59e0b', fontSize: 10, position: 'insideTopLeft' }} />
                <ReferenceLine y={180} stroke="#f43f5e" strokeDasharray="4 4" label={{ value: 'Urgent HTN (180)', fill: '#f43f5e', fontSize: 10, position: 'insideTopLeft' }} />
                <Line
                  type="monotone"
                  dataKey="systolic"
                  name="Systolic BP"
                  stroke="#f43f5e"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#f43f5e', stroke: '#ffffff', strokeWidth: 1.5 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="diastolic"
                  name="Diastolic BP"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  dot={{ r: 3.5, fill: '#38bdf8', stroke: '#ffffff', strokeWidth: 1.5 }}
                  activeDot={{ r: 5 }}
                />
              </>
            )}

            {metricMode === 'hr_rr' && (
              <>
                <ReferenceLine y={100} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Tachycardia (>100)', fill: '#f59e0b', fontSize: 10, position: 'insideTopLeft' }} />
                <ReferenceLine y={60} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: 'Bradycardia (<60)', fill: '#94a3b8', fontSize: 10, position: 'insideBottomLeft' }} />
                <Line
                  type="monotone"
                  dataKey="heartRate"
                  name="Heart Rate (bpm)"
                  stroke="#fbbf24"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#fbbf24', stroke: '#ffffff', strokeWidth: 1.5 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="respRate"
                  name="Respiration Rate (rpm)"
                  stroke="#c084fc"
                  strokeWidth={2}
                  dot={{ r: 3.5, fill: '#c084fc', stroke: '#ffffff', strokeWidth: 1.5 }}
                  activeDot={{ r: 5 }}
                />
              </>
            )}

            {metricMode === 'spo2' && (
              <>
                <ReferenceLine y={94} stroke="#f43f5e" strokeDasharray="4 4" label={{ value: 'Hypoxia Target Threshold (94%)', fill: '#f43f5e', fontSize: 10, position: 'insideBottomLeft' }} />
                <Line
                  type="monotone"
                  dataKey="o2Sat"
                  name="SpO2 (%)"
                  stroke="#2dd4bf"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#2dd4bf', stroke: '#ffffff', strokeWidth: 1.5 }}
                  activeDot={{ r: 6 }}
                />
              </>
            )}

            {metricMode === 'temp_weight' && (
              <>
                <ReferenceLine y={100.4} stroke="#f43f5e" strokeDasharray="4 4" label={{ value: 'Fever Threshold (100.4°F)', fill: '#f43f5e', fontSize: 10, position: 'insideTopLeft' }} />
                <Line
                  type="monotone"
                  dataKey="tempF"
                  name="Temperature (°F)"
                  stroke="#fb923c"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#fb923c', stroke: '#ffffff', strokeWidth: 1.5 }}
                  activeDot={{ r: 6 }}
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Delta Metrics Strip Footer */}
      <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono flex-wrap gap-2">
        <div className="flex items-center gap-4 flex-wrap">
          <span>
            Baseline Delta:{' '}
            <strong className={`tabular-nums ${assessment.deltaSystolic > 20 ? 'text-rose-400' : 'text-slate-200'}`}>
              BP {assessment.deltaSystolic >= 0 ? '+' : ''}{assessment.deltaSystolic} mmHg
            </strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            HR Delta:{' '}
            <strong className={`tabular-nums ${Math.abs(assessment.deltaHeartRate) > 15 ? 'text-amber-400' : 'text-slate-200'}`}>
              {assessment.deltaHeartRate >= 0 ? '+' : ''}{assessment.deltaHeartRate} bpm
            </strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            SpO2 Delta:{' '}
            <strong className={`tabular-nums ${assessment.deltaO2 < 0 ? 'text-rose-400' : 'text-slate-200'}`}>
              {assessment.deltaO2 >= 0 ? '+' : ''}{assessment.deltaO2}%
            </strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Temp Delta:{' '}
            <strong className={`tabular-nums ${assessment.deltaTemp >= 1.5 ? 'text-amber-400' : 'text-slate-200'}`}>
              {assessment.deltaTemp >= 0 ? '+' : ''}{assessment.deltaTemp}°F
            </strong>
          </span>
        </div>

        <span className="text-[10px] text-slate-400">
          Source: Integrated Ambulatory & Acute Inpatient EHR Series
        </span>
      </div>
    </div>
  );
};
