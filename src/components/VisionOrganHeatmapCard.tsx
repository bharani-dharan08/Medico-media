/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Grid3X3, Info } from 'lucide-react';
import { Patient, OrganSystemRisk } from '../types/clinical.ts';

interface VisionOrganHeatmapCardProps {
  patient: Patient;
}

const COLUMNS = ['6M Ago', '3M Ago', '1M Ago', 'Last Wk', 'Today'];

export const VisionOrganHeatmapCard: React.FC<VisionOrganHeatmapCardProps> = ({
  patient,
}) => {
  const [hoveredCell, setHoveredCell] = useState<{
    organ: string;
    period: string;
    severity: string;
    testSummary: string;
    labValue: string;
  } | null>(null);

  const organRows: OrganSystemRisk[] = patient.organAcuityHistory || [];
  const quickMetrics = patient.quickMetrics || {
    medAdherencePercent: 94,
    labCompletionPercent: 88,
    followUpRisk: 'Low',
    pendingSignOffs: 3,
  };

  const pendingSignOffCount = patient.pendingActions.filter((a) => a.status === 'pending').length;

  const getSeverityStyle = (severity: 'Normal' | 'Mild' | 'Moderate' | 'Critical') => {
    switch (severity) {
      case 'Critical':
        return {
          cellClass:
            'bg-red-600 text-white border-red-700 font-extrabold shadow-xs',
          badge: 'CRITICAL',
        };
      case 'Moderate':
        return {
          cellClass:
            'bg-amber-500 text-slate-950 font-extrabold border-amber-600',
          badge: 'MOD',
        };
      case 'Mild':
        return {
          cellClass:
            'bg-teal-50 text-teal-900 border-teal-300 font-bold',
          badge: 'MILD',
        };
      default:
        return {
          cellClass: 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300',
          badge: 'NORM',
        };
    }
  };

  return (
    <div className="vision-card p-5 flex flex-col justify-between h-full min-h-[340px] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5 truncate">
            <Grid3X3 className="w-4 h-4 text-teal-600 shrink-0" />
            <span className="truncate">Patient Organ-System Risk & Acuity Heatmap</span>
          </h3>
          <p className="text-[11px] text-slate-600 truncate">
            Multi-system longitudinal severity matrix
          </p>
        </div>

        {/* Severity Legend */}
        <div className="hidden xl:flex items-center gap-2 text-[9px] font-mono shrink-0">
          <span className="flex items-center gap-1 text-slate-600">
            <span className="w-2 h-2 rounded-xs bg-slate-100 border border-slate-300" /> Norm
          </span>
          <span className="flex items-center gap-1 text-teal-800">
            <span className="w-2 h-2 rounded-xs bg-teal-200 border border-teal-400" /> Mild
          </span>
          <span className="flex items-center gap-1 text-amber-800">
            <span className="w-2 h-2 rounded-xs bg-amber-500" /> Mod
          </span>
          <span className="flex items-center gap-1 text-red-700">
            <span className="w-2 h-2 rounded-xs bg-red-600" /> Crit
          </span>
        </div>
      </div>

      {/* Interactive 2D Clinical Heatmap Grid (Aligned 5-Column Period Matrix) */}
      <div className="space-y-2">
        {/* Column Headers */}
        <div className="grid grid-cols-[84px_repeat(5,minmax(0,1fr))] items-center gap-2 text-[10px] font-mono text-slate-500 text-center pb-0.5">
          <div className="text-left pl-1 font-semibold truncate">System</div>
          {COLUMNS.map((col) => (
            <div
              key={col}
              className={`truncate flex items-center justify-center ${
                col === 'Today' ? 'text-teal-700 font-bold' : ''
              }`}
            >
              {col}
            </div>
          ))}
        </div>

        {/* Organ Rows */}
        {organRows.map((row) => (
          <div
            key={row.organ}
            className="grid grid-cols-[84px_repeat(5,minmax(0,1fr))] items-center gap-2"
          >
            <div className="text-xs font-bold text-slate-800 pl-1 truncate" title={row.label}>
              {row.organ}
            </div>
            {row.periods.map((cell) => {
              const style = getSeverityStyle(cell.severity);
              return (
                <div
                  key={`${row.organ}-${cell.period}`}
                  onMouseEnter={() =>
                    setHoveredCell({
                      organ: row.organ,
                      period: cell.period,
                      severity: cell.severity,
                      testSummary: cell.testSummary,
                      labValue: cell.labValue,
                    })
                  }
                  onMouseLeave={() => setHoveredCell(null)}
                  className={`h-8 rounded-md border flex items-center justify-center text-center text-[10px] font-mono font-bold transition-all cursor-pointer select-none px-1.5 truncate ${style.cellClass}`}
                  title={`${cell.period} - ${row.organ}: ${cell.testSummary}`}
                >
                  <span className="truncate">{cell.labValue}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Dynamic Hover Readout Bar */}
      <div className="my-2.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] flex items-center min-h-[34px] min-w-0 overflow-hidden">
        {hoveredCell ? (
          <div className="flex items-center gap-1.5 min-w-0 w-full overflow-hidden">
            <span className="font-bold text-teal-800 font-mono whitespace-nowrap shrink-0">
              [{hoveredCell.period} · {hoveredCell.organ}]:
            </span>
            <span className="text-slate-900 font-semibold truncate">
              {hoveredCell.testSummary}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-slate-600 min-w-0 w-full overflow-hidden">
            <Info className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span className="whitespace-nowrap shrink-0">Today - Metabolic:</span>
            <strong className="text-red-700 truncate">
              {organRows.find((r) => r.organ === 'Metabolic')?.periods[4]?.testSummary ||
                'Fasting Glucose 218 mg/dL [HIGH]'}
            </strong>
          </div>
        )}
      </div>

      {/* Bottom Section: 4 Mini Metric Bars — Centered & Evenly Aligned */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2.5 border-t border-slate-200">
        {/* Metric 1: Med Adherence */}
        <div className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 flex flex-col justify-center min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] text-slate-600 truncate">Adherence</span>
            <span className="text-[11px] font-mono font-bold text-emerald-700 shrink-0 tabular-nums">
              {quickMetrics.medAdherencePercent}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-slate-200 rounded-full mt-1.5 overflow-hidden">
            <div
              style={{ width: `${quickMetrics.medAdherencePercent}%` }}
              className="h-full bg-emerald-600 rounded-full"
            />
          </div>
        </div>

        {/* Metric 2: Lab Completion */}
        <div className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 flex flex-col justify-center min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] text-slate-600 truncate">Labs Done</span>
            <span className="text-[11px] font-mono font-bold text-teal-700 shrink-0 tabular-nums">
              {quickMetrics.labCompletionPercent}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-slate-200 rounded-full mt-1.5 overflow-hidden">
            <div
              style={{ width: `${quickMetrics.labCompletionPercent}%` }}
              className="h-full bg-teal-600 rounded-full"
            />
          </div>
        </div>

        {/* Metric 3: Follow-up Risk */}
        <div className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 flex flex-col justify-center min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] text-slate-600 truncate">Risk Level</span>
            <span
              className={`text-[11px] font-mono font-bold shrink-0 ${
                quickMetrics.followUpRisk === 'Low'
                  ? 'text-emerald-700'
                  : quickMetrics.followUpRisk === 'Moderate'
                  ? 'text-amber-700'
                  : 'text-red-700'
              }`}
            >
              {quickMetrics.followUpRisk}
            </span>
          </div>
          <div className="h-1.5 w-full bg-slate-200 rounded-full mt-1.5 overflow-hidden">
            <div
              style={{
                width:
                  quickMetrics.followUpRisk === 'Low'
                    ? '28%'
                    : quickMetrics.followUpRisk === 'Moderate'
                    ? '62%'
                    : '90%',
              }}
              className={`h-full rounded-full ${
                quickMetrics.followUpRisk === 'Low'
                  ? 'bg-emerald-600'
                  : quickMetrics.followUpRisk === 'Moderate'
                  ? 'bg-amber-500'
                  : 'bg-red-600'
              }`}
            />
          </div>
        </div>

        {/* Metric 4: Pending Sign-offs */}
        <div className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 flex flex-col justify-center min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] text-slate-600 truncate">Sign-offs</span>
            <span className="text-[11px] font-mono font-bold text-amber-700 shrink-0 tabular-nums">
              {pendingSignOffCount}
            </span>
          </div>
          <div className="h-1.5 w-full bg-slate-200 rounded-full mt-1.5 overflow-hidden">
            <div
              style={{ width: `${Math.min(100, pendingSignOffCount * 25)}%` }}
              className="h-full bg-amber-500 rounded-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
