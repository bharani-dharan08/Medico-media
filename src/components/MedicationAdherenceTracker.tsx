/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Pill,
  History,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Building2,
  Calendar,
  ExternalLink,
  ShieldAlert,
  Send,
} from 'lucide-react';
import { Medication, AdherenceCategory } from '../types/clinical.ts';
import { calculateRegimenAdherenceSummary } from '../utils/triage.ts';

interface MedicationAdherenceTrackerProps {
  medications: Medication[];
  onQuickRefill?: (medName: string) => void;
}

export const MedicationAdherenceTracker: React.FC<MedicationAdherenceTrackerProps> = ({
  medications,
  onQuickRefill,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'UNDER' | 'OVER' | 'OPTIMAL'>('ALL');
  const [expandedMedId, setExpandedMedId] = useState<string | null>(null);

  const summary = calculateRegimenAdherenceSummary(medications);

  const filteredMeds = medications.filter((m) => {
    if (!m.adherence) return filter === 'ALL';
    if (filter === 'UNDER') return m.adherence.status === 'UNDER_UTILIZATION';
    if (filter === 'OVER') return m.adherence.status === 'OVER_UTILIZATION';
    if (filter === 'OPTIMAL') return m.adherence.status === 'OPTIMAL';
    return true;
  });

  const toggleExpand = (id: string) => {
    setExpandedMedId(expandedMedId === id ? null : id);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-slate-100 shadow-xs space-y-3.5">
      {/* Top Header & Adherence Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-teal-500/20 text-teal-400">
            <Pill className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
                Pharmacy Refill Adherence & Utilization Tracker
              </h4>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                  summary.underutilizedCount > 0
                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                    : summary.overutilizedCount > 0
                    ? 'bg-purple-950 text-purple-300 border border-purple-800'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}
              >
                {summary.underutilizedCount > 0 ? (
                  <AlertCircle className="w-3 h-3 text-rose-400" />
                ) : summary.overutilizedCount > 0 ? (
                  <AlertTriangle className="w-3 h-3 text-purple-400" />
                ) : (
                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                )}
                {summary.statusBadge}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Refill telemetry: {summary.summaryText}
            </p>
          </div>
        </div>

        {/* Filter Segmented Buttons */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-950/80 rounded border border-slate-800 flex-wrap">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-2 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer ${
              filter === 'ALL'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({medications.length})
          </button>
          <button
            onClick={() => setFilter('UNDER')}
            className={`px-2 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer ${
              filter === 'UNDER'
                ? 'bg-rose-950 text-rose-200 font-semibold border border-rose-800'
                : 'text-slate-400 hover:text-rose-300'
            }`}
          >
            Under-utilized ({summary.underutilizedCount})
          </button>
          <button
            onClick={() => setFilter('OVER')}
            className={`px-2 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer ${
              filter === 'OVER'
                ? 'bg-purple-950 text-purple-200 font-semibold border border-purple-800'
                : 'text-slate-400 hover:text-purple-300'
            }`}
          >
            Over-utilized ({summary.overutilizedCount})
          </button>
          <button
            onClick={() => setFilter('OPTIMAL')}
            className={`px-2 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer ${
              filter === 'OPTIMAL'
                ? 'bg-emerald-950 text-emerald-200 font-semibold border border-emerald-800'
                : 'text-slate-400 hover:text-emerald-300'
            }`}
          >
            Optimal ({summary.optimalCount})
          </button>
        </div>
      </div>

      {/* List of Medications with Adherence Progress Gauges */}
      <div className="space-y-3">
        {filteredMeds.map((med) => {
          const adh = med.adherence;
          const isUnder = adh?.status === 'UNDER_UTILIZATION';
          const isOver = adh?.status === 'OVER_UTILIZATION';
          const isOptimal = adh?.status === 'OPTIMAL';
          const isExpanded = expandedMedId === med.id;

          // Normalized bar percentage for 0 to 140% scale
          const pdc = adh?.pdcPercentage || 100;
          const clampedPercent = Math.min(100, Math.max(0, (pdc / 140) * 100));

          return (
            <div
              key={med.id}
              className={`p-3 rounded-lg border text-xs transition-colors ${
                isUnder
                  ? 'bg-rose-950/20 border-rose-900/60'
                  : isOver
                  ? 'bg-purple-950/20 border-purple-900/60'
                  : 'bg-slate-950/60 border-slate-800'
              }`}
            >
              {/* Header Row: Drug Name, Dosage, and Adherence Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">
                      {med.name}
                    </span>
                    <span className="text-teal-300 font-mono text-xs">{med.dosage}</span>
                    <span className="text-slate-400 text-[11px]">({med.frequency})</span>
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        isUnder
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : isOver
                          ? 'bg-purple-950 text-purple-300 border border-purple-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {adh ? adh.statusBadge : '[UNVERIFIED]'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                    Indication: {med.indication} · Prescribed by: {med.prescriber}
                  </div>
                </div>

                {/* Score and Quick Refill Action */}
                <div className="flex items-center gap-2.5">
                  <div className="text-right font-mono tabular-nums">
                    <div
                      className={`text-base font-extrabold ${
                        isUnder
                          ? 'text-rose-400'
                          : isOver
                          ? 'text-purple-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {pdc}% <span className="text-[10px] text-slate-400 font-normal">PDC</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {adh ? `${adh.daysCovered}/${adh.evaluationWindowDays}d covered` : 'Active'}
                    </div>
                  </div>

                  {isUnder && onQuickRefill && (
                    <button
                      onClick={() => onQuickRefill(med.name)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Send className="w-3 h-3" />
                      <span>Order Refill</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Visual Adherence Bar (Under <80%, Optimal 80-110%, Over >110%) */}
              <div className="space-y-1 mb-2">
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span className="text-rose-400">Underuse (&lt;80%)</span>
                  <span className="text-emerald-400">Optimal Target (80% - 110%)</span>
                  <span className="text-purple-400">Overuse / Early (&gt;110%)</span>
                </div>

                <div className="relative h-2.5 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
                  {/* Under zone: 0 to 80% out of 140 = 57.1% */}
                  <div className="w-[57%] bg-rose-950/70 border-r border-slate-700/80" />
                  {/* Optimal zone: 80 to 110% out of 140 = 21.4% */}
                  <div className="w-[21.5%] bg-emerald-950/70 border-r border-slate-700/80" />
                  {/* Over zone: 110 to 140% = 21.5% */}
                  <div className="w-[21.5%] bg-purple-950/70" />
                </div>

                {/* Patient Value Marker Pointer */}
                <div className="relative h-2 w-full">
                  <div
                    className="absolute -top-1 -translate-x-1/2 flex flex-col items-center"
                    style={{ left: `${Math.min(97, Math.max(3, clampedPercent))}%` }}
                  >
                    <div
                      className={`w-2.5 h-2.5 rotate-45 border ${
                        isUnder
                          ? 'bg-rose-500 border-white'
                          : isOver
                          ? 'bg-purple-400 border-white'
                          : 'bg-emerald-400 border-white'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Clinical Risk Warning (if under or over utilized) */}
              {adh?.clinicalRiskNote && (
                <div
                  className={`p-2 rounded border mb-2 flex items-start gap-2 ${
                    isUnder
                      ? 'bg-rose-950/30 border-rose-800/80 text-rose-200'
                      : 'bg-purple-950/30 border-purple-800/80 text-purple-200'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    <strong>Adherence Alert:</strong> {adh.clinicalRiskNote}
                  </p>
                </div>
              )}

              {/* Sub-Metadata Strip & Refill Log Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-800/60 text-[10px] text-slate-400 font-mono">
                <div className="flex items-center gap-3 flex-wrap">
                  <span>Last Refill: {adh?.lastRefillDate || med.lastFilled}</span>
                  <span aria-hidden="true">·</span>
                  <span
                    className={
                      isUnder ? 'text-rose-400 font-bold' : isOver ? 'text-purple-400 font-bold' : 'text-slate-300'
                    }
                  >
                    Next Expected: {adh?.nextExpectedRefill || 'Routine'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>Days Delta: {adh ? (adh.daysDelta > 0 ? `+${adh.daysDelta}d` : `${adh.daysDelta}d`) : '0d'}</span>
                </div>

                {adh?.refillEvents && adh.refillEvents.length > 0 && (
                  <button
                    onClick={() => toggleExpand(med.id)}
                    className="flex items-center gap-1 text-teal-400 hover:text-teal-300 font-medium cursor-pointer"
                  >
                    <History className="w-3 h-3" />
                    <span>Pharmacy Refill Logs ({adh.refillEvents.length})</span>
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                )}
              </div>

              {/* Expandable Refill Logs Table */}
              {isExpanded && adh?.refillEvents && (
                <div className="mt-2.5 p-2 bg-slate-950 border border-slate-800 rounded overflow-x-auto">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold mb-1">
                    Pharmacy Claims Telemetry Log (e-Prescribing NCPDP SCRIPT Feed):
                  </span>
                  <table className="w-full text-[10px] font-mono text-left">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="py-1">Dispense Date</th>
                        <th className="py-1">Days Supply</th>
                        <th className="py-1">Qty</th>
                        <th className="py-1">Pharmacy Location</th>
                        <th className="py-1">Rx Number</th>
                        <th className="py-1 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-200">
                      {adh.refillEvents.map((event, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/50">
                          <td className="py-1 text-white">{event.date}</td>
                          <td className="py-1 tabular-nums">{event.daysSupply} days</td>
                          <td className="py-1 tabular-nums">{event.quantityDispensed}</td>
                          <td className="py-1 text-slate-300">{event.pharmacyName}</td>
                          <td className="py-1 text-slate-400">{event.rxNumber}</td>
                          <td className="py-1 text-right">
                            <span
                              className={`px-1.5 py-0.5 rounded font-bold ${
                                event.status === 'Refill Overdue'
                                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                  : event.status === 'Early Refill'
                                  ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              }`}
                            >
                              [{event.status.toUpperCase()}]
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
