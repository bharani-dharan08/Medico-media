/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FlaskConical,
  Eye,
  CheckCircle2,
  AlertTriangle,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { LabReport, Patient } from '../types/clinical.ts';
import { filterLabReports } from '../utils/triage.ts';

interface DiagnosticLabsProps {
  patient: Patient;
  onlyAbnormal: boolean;
  onToggleOnlyAbnormal: () => void;
  onSelectReport: (report: LabReport) => void;
}

export const DiagnosticLabs: React.FC<DiagnosticLabsProps> = ({
  patient,
  onlyAbnormal,
  onToggleOnlyAbnormal,
  onSelectReport,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [showDelta, setShowDelta] = useState<boolean>(true);

  const filterTabs = ['All', 'Abnormal Only', 'Bloodwork', 'Imaging'];

  const filteredLabs = filterLabReports(
    patient.labReports,
    categoryFilter,
    onlyAbnormal
  );

  const calculateBarPosition = (
    value: number | string,
    min?: number,
    max?: number
  ) => {
    if (typeof value !== 'number' || min === undefined || max === undefined) {
      return null;
    }
    const span = max - min;
    if (span <= 0) return 50;

    const displayMin = min - span * 0.25;
    const displayMax = max + span * 0.5;
    const totalSpan = displayMax - displayMin;

    const clamped = Math.max(displayMin, Math.min(displayMax, value));
    const percent = ((clamped - displayMin) / totalSpan) * 100;
    return Math.round(percent);
  };

  return (
    <div className="vision-card p-5 text-white">
      {/* Module Header & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3.5 mb-3.5 border-b border-white/10">
        <div className="flex items-center gap-2.5 flex-wrap">
          <FlaskConical className="w-4 h-4 text-[#2CD9FF]" />
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">
            Diagnostic Reports & Laboratory Data
          </h3>
          <span className="text-[10px] text-[#A0AEC0] font-mono tabular-nums">
            ({filteredLabs.length} / {patient.labReports.length})
          </span>
        </div>

        {/* Filter Controls including Interactive "View Delta" Toggle Switch */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* View Delta Toggle Switch */}
          <button
            type="button"
            role="switch"
            aria-checked={showDelta}
            aria-label="View Delta"
            onClick={() => setShowDelta((prev) => !prev)}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all flex items-center gap-2 cursor-pointer ${
              showDelta
                ? 'bg-[#0075FF]/20 border-[#2CD9FF]/60 text-white shadow-[0_0_15px_rgba(44,217,255,0.25)]'
                : 'bg-white/5 border-white/10 text-[#A0AEC0] hover:text-white'
            }`}
          >
            <TrendingUp className={`w-3.5 h-3.5 ${showDelta ? 'text-[#2CD9FF]' : 'text-[#A0AEC0]'}`} />
            <span>View Delta</span>
            <span
              className={`w-7 h-4 rounded-full p-0.5 transition-colors flex items-center ${
                showDelta ? 'bg-gradient-to-r from-[#0075FF] to-[#2CD9FF] justify-end' : 'bg-[#1A1F37] justify-start'
              }`}
            >
              <span className="w-3 h-3 rounded-full bg-white shadow-sm" />
            </span>
          </button>

          <button
            type="button"
            onClick={onToggleOnlyAbnormal}
            className={`px-2.5 py-1.5 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
              onlyAbnormal
                ? 'bg-[#FFB547]/20 border-[#FFB547]/50 text-[#FFB547]'
                : 'bg-white/5 border-white/10 text-[#A0AEC0] hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-[#FFB547]" />
            <span>Abnormal Only</span>
          </button>

          <div className="flex items-center gap-1 p-1 bg-[#0B1437] rounded-xl border border-white/10">
            {filterTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setCategoryFilter(tab)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  categoryFilter === tab
                    ? 'bg-gradient-to-r from-[#0075FF] to-[#2CD9FF] text-white'
                    : 'text-[#A0AEC0] hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Delta Legend Banner when View Delta is Active */}
      {showDelta && (
        <div className="mb-3 px-3 py-2 rounded-xl bg-[#0B1437]/90 border border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-2 text-[#A0AEC0]">
            <TrendingUp className="w-3.5 h-3.5 text-[#2CD9FF]" />
            <span>
              Comparing <strong className="text-white">Current Lab Result</strong> vs.{' '}
              <strong className="text-white">Previous Visit Baseline</strong>
            </span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[10px] font-bold">
            <span className="inline-flex items-center gap-1 text-[#FF3B6B]">
              <span className="w-2 h-2 rounded-full bg-[#FF3B6B] animate-pulse" />
              Neon Rose: Critical Shift
            </span>
            <span className="inline-flex items-center gap-1 text-[#FFB547]">
              <span className="w-2 h-2 rounded-full bg-[#FFB547]" />
              Neon Amber: Warning Shift
            </span>
            <span className="inline-flex items-center gap-1 text-[#01B574]">
              <span className="w-2 h-2 rounded-full bg-[#01B574]" />
              Neon Emerald: Stable
            </span>
          </div>
        </div>
      )}

      {/* Structured Diagnostic Lab Results Table */}
      <div className="overflow-x-auto">
        {filteredLabs.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#A0AEC0]">
            No laboratory reports match current filter criteria.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-[#A0AEC0] font-mono">
                <th className="py-2.5 px-3 whitespace-nowrap">Diagnostic Assay</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Current Result</th>
                {showDelta && (
                  <th className="py-2.5 px-3 whitespace-nowrap">
                    Delta Shift vs. Previous Visit
                  </th>
                )}
                <th className="py-2.5 px-3 whitespace-nowrap">Reference Range</th>
                <th className="py-2.5 px-3 text-right whitespace-nowrap">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-xs">
              {filteredLabs.map((lab) => {
                const isCritical = lab.status === 'CRITICAL';
                const isHigh = lab.status === 'HIGH' || lab.status === 'LOW';
                const isImaging = lab.category === 'Imaging';
                const markerPos = calculateBarPosition(
                  lab.value,
                  lab.referenceMin,
                  lab.referenceMax
                );
                const delta = lab.delta;
                const isDeltaCritical = delta?.severity === 'CRITICAL';
                const isDeltaWarning = delta?.severity === 'WARNING';

                return (
                  <tr
                    key={lab.id}
                    onClick={() => onSelectReport(lab)}
                    className={`transition-colors cursor-pointer group ${
                      showDelta && isDeltaCritical
                        ? 'bg-[#FF3B6B]/[0.06] hover:bg-[#FF3B6B]/[0.12]'
                        : showDelta && isDeltaWarning
                        ? 'bg-[#FFB547]/[0.05] hover:bg-[#FFB547]/[0.10]'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    {/* Col 1: Lab Information */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-xl shrink-0 ${
                            isImaging
                              ? 'bg-[#0075FF]/20 text-[#2CD9FF]'
                              : isCritical
                              ? 'bg-[#FF3B6B]/20 text-[#FF3B6B]'
                              : isHigh
                              ? 'bg-[#FFB547]/20 text-[#FFB547]'
                              : 'bg-[#01B574]/20 text-[#01B574]'
                          }`}
                        >
                          {isImaging ? (
                            <FileText className="w-4 h-4" />
                          ) : (
                            <FlaskConical className="w-4 h-4" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-white group-hover:text-[#2CD9FF] transition-colors">
                              {lab.name}
                            </span>

                            <span
                              className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                                isCritical
                                  ? 'bg-[#FF3B6B]/20 text-[#FF3B6B] border-[#FF3B6B]/50'
                                  : isHigh
                                  ? 'bg-[#FFB547]/20 text-[#FFB547] border-[#FFB547]/50'
                                  : 'bg-[#01B574]/20 text-[#01B574] border-[#01B574]/40'
                              }`}
                            >
                              [{lab.status}]
                            </span>

                            {lab.acknowledged && (
                              <span className="text-[10px] text-[#01B574] flex items-center gap-0.5 font-mono">
                                <CheckCircle2 className="w-3 h-3" /> Ack
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-[#A0AEC0] mt-0.5 font-mono">
                            <span>{lab.category}</span>
                            <span>·</span>
                            <span>Collected: {lab.collectedAt}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Col 2: Current Value */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div
                        className={`text-sm font-extrabold font-mono tabular-nums ${
                          isCritical
                            ? 'text-[#FF3B6B]'
                            : isHigh
                            ? 'text-[#FFB547]'
                            : 'text-[#01B574]'
                        }`}
                      >
                        {lab.value} <span className="text-xs font-normal">{lab.unit}</span>
                      </div>
                    </td>

                    {/* Col 3: Delta Shift vs Previous Visit (Neon Rose for Critical, Neon Amber for Warning) */}
                    {showDelta && (
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {delta ? (
                          <div className="flex flex-col items-start gap-1">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-extrabold border ${
                                isDeltaCritical
                                  ? 'bg-[#FF3B6B]/25 text-[#FF3B6B] border-[#FF3B6B] shadow-[0_0_14px_rgba(255,59,107,0.4)]'
                                  : isDeltaWarning
                                  ? 'bg-[#FFB547]/25 text-[#FFB547] border-[#FFB547] shadow-[0_0_12px_rgba(255,181,71,0.35)]'
                                  : 'bg-[#01B574]/15 text-[#01B574] border-[#01B574]/40'
                              }`}
                            >
                              {delta.direction === 'up' && <TrendingUp className="w-3.5 h-3.5" />}
                              {delta.direction === 'down' && <TrendingDown className="w-3.5 h-3.5" />}
                              {delta.direction === 'unchanged' && <Minus className="w-3.5 h-3.5" />}
                              <span>{delta.deltaText}</span>
                              {delta.isSignificant && (
                                <span
                                  className={`ml-1 px-1.5 py-0.2 rounded text-[9px] uppercase tracking-wider font-extrabold ${
                                    isDeltaCritical
                                      ? 'bg-[#E31A1A] text-white'
                                      : 'bg-[#FFB547] text-[#060B28]'
                                  }`}
                                >
                                  {isDeltaCritical ? 'CRITICAL SHIFT' : 'WARNING SHIFT'}
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] text-[#A0AEC0] font-mono">
                              Prior: <strong className="text-white">{delta.previousValue} {lab.unit}</strong> ({delta.previousDate})
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-[#A0AEC0] font-mono">No prior baseline</span>
                        )}
                      </td>
                    )}

                    {/* Col 4: Reference Range & Visual Bar */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div className="text-[10px] text-[#A0AEC0] font-mono mb-1">
                        Ref: {lab.referenceRange}
                      </div>
                      {markerPos !== null && (
                        <div className="w-28">
                          <div className="h-1.5 w-full bg-[#1A1F37] rounded-full relative overflow-hidden">
                            <div
                              style={{ width: `${markerPos}%` }}
                              className={`h-full rounded-full ${
                                isCritical
                                  ? 'bg-[#FF3B6B]'
                                  : isHigh
                                  ? 'bg-[#FFB547]'
                                  : 'bg-[#01B574]'
                              }`}
                            />
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Col 5: Inspect Button */}
                    <td className="py-3.5 px-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        className="p-1.5 rounded-lg bg-white/5 group-hover:bg-[#0075FF] text-[#A0AEC0] group-hover:text-white transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

