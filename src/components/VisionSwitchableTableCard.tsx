/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Users,
  FlaskConical,
  HeartPulse,
  ArrowUpRight,
  Eye,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Download,
  Stethoscope,
  CheckCircle2,
} from 'lucide-react';
import { Patient, LabReport } from '../types/clinical.ts';
import { getPatientAvatarConfig } from '../utils/avatarHash.ts';
import { MedicationAdherenceTracker } from './MedicationAdherenceTracker.tsx';

export type ClinicalTableTab = 'appointments' | 'labs' | 'history';

interface VisionSwitchableTableCardProps {
  patients: Patient[];
  activePatient: Patient;
  onSelectPatient: (patientId: string) => void;
  onSelectLabReport: (report: LabReport) => void;
  onQuickRefill: (medName: string) => void;
  onlyAbnormalLabs: boolean;
  onToggleOnlyAbnormalLabs: () => void;
  onDownloadAuditRecord?: (patient: Patient) => void;
  externalTab?: ClinicalTableTab;
  onTabChange?: (tab: ClinicalTableTab) => void;
}

export const VisionSwitchableTableCard: React.FC<VisionSwitchableTableCardProps> = ({
  patients,
  activePatient,
  onSelectPatient,
  onSelectLabReport,
  onQuickRefill,
  onlyAbnormalLabs,
  onToggleOnlyAbnormalLabs,
  onDownloadAuditRecord,
  externalTab,
  onTabChange,
}) => {
  const [internalTab, setInternalTab] = useState<ClinicalTableTab>('appointments');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [showLabDelta, setShowLabDelta] = useState<boolean>(true);

  const activeTab = externalTab || internalTab;
  const handleSetTab = (tab: ClinicalTableTab) => {
    setInternalTab(tab);
    onTabChange?.(tab);
  };

  const filteredAppointments = patients.filter((p) =>
    statusFilter === 'All' ? true : p.appointmentStatus === statusFilter
  );

  const displayedLabs = activePatient.labReports.filter((lab) =>
    onlyAbnormalLabs ? lab.status !== 'NORMAL' : true
  );

  return (
    <div className="vision-card p-5 flex flex-col justify-between h-full">
      {/* Header & Switchable Tabs — Single-Line with whitespace-nowrap */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 overflow-x-auto max-w-full">
          <button
            onClick={() => handleSetTab('appointments')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'appointments'
                ? 'bg-[#0B1221] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span>Encounters ({patients.length})</span>
          </button>

          <button
            onClick={() => handleSetTab('labs')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'labs'
                ? 'bg-[#0B1221] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5 shrink-0" />
            <span>Diagnostic Labs ({activePatient.labReports.length})</span>
          </button>

          <button
            onClick={() => handleSetTab('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'history'
                ? 'bg-[#0B1221] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5 shrink-0" />
            <span>History & Adherence</span>
          </button>
        </div>

        {/* Contextual Sub-Filters — Strictly whitespace-nowrap */}
        {activeTab === 'appointments' && (
          <div className="flex items-center gap-1 text-[11px] overflow-x-auto">
            {['All', 'Emergency', 'Waiting', 'In-Consultation', 'Done'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 border ${
                  statusFilter === st
                    ? st === 'Emergency'
                      ? 'bg-red-50 text-red-700 border-red-300 font-bold'
                      : 'bg-[#0B1221] text-white border-[#0B1221]'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        )}

        {activeTab === 'labs' && (
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Delta Toggle Switch */}
            <button
              type="button"
              role="switch"
              aria-checked={showLabDelta}
              aria-label="View Delta"
              onClick={() => setShowLabDelta((prev) => !prev)}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold border transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                showLabDelta
                  ? 'bg-teal-50 border-teal-300 text-teal-900'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className={`w-3.5 h-3.5 ${showLabDelta ? 'text-teal-700' : 'text-slate-500'}`} />
              <span>View Delta</span>
              <span
                className={`w-6 h-3.5 rounded-full p-0.5 transition-colors flex items-center ${
                  showLabDelta ? 'bg-[#0D9488] justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-white shadow-xs" />
              </span>
            </button>

            <button
              type="button"
              onClick={onToggleOnlyAbnormalLabs}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                onlyAbnormalLabs
                  ? 'bg-red-50 border-red-300 text-red-700'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Abnormal Only</span>
            </button>
          </div>
        )}
      </div>

      {/* Tab Content 1: Today's Appointments Table */}
      {activeTab === 'appointments' && (
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 font-mono">
                <th className="py-2.5 px-2 whitespace-nowrap">Patient Identity</th>
                <th className="py-2.5 px-2 whitespace-nowrap">Allotted Specialist & Chief Complaint</th>
                <th className="py-2.5 px-2 whitespace-nowrap">Slot / Status</th>
                <th className="py-2.5 px-2 whitespace-nowrap">Acuity</th>
                <th className="py-2.5 px-2 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredAppointments.map((pat) => {
                const isSelected = pat.id === activePatient.id;
                const avatar = getPatientAvatarConfig(
                  pat.mrn,
                  pat.demographics.firstName,
                  pat.demographics.lastName,
                  pat.mrn
                );
                const isEmergent = pat.triageLevel.includes('Emergent');
                const isUrgent = pat.triageLevel.includes('Urgent');
                const isSignedOff =
                  pat.appointmentStatus === 'Done' || pat.doctorSignOff?.signedOff;

                return (
                  <tr
                    key={pat.id}
                    onClick={() => onSelectPatient(pat.id)}
                    className={`transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-teal-50/70 border-l-2 border-l-[#0D9488]'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3 px-2 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${avatar.gradientClass} flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs`}
                        >
                          {avatar.initials}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>
                              {pat.demographics.firstName} {pat.demographics.lastName}
                            </span>
                            <span className="text-[10px] text-slate-500 font-normal">
                              ({pat.demographics.age}
                              {pat.demographics.gender[0]})
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-teal-700 font-semibold">
                            MRN #{pat.mrn}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-2 max-w-[250px]">
                      <div className="flex items-center gap-1 text-[10px] text-teal-800 font-semibold mb-0.5 truncate">
                        <Stethoscope className="w-3 h-3 shrink-0" />
                        <span className="truncate">
                          {pat.assignedDoctorName || 'Dr. Sarah Chen, MD'} ·{' '}
                          {pat.assignedSpecialty?.split(' ')[0] || 'Cardiology'}
                        </span>
                      </div>
                      <p className="text-slate-600 line-clamp-1 text-[11px] leading-snug">
                        {pat.chiefComplaint}
                      </p>
                    </td>

                    <td className="py-3 px-2 whitespace-nowrap">
                      <div className="font-mono font-bold text-slate-900 text-[11px]">
                        {pat.timeSlot}
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 mt-0.5 text-[10px] font-semibold ${
                          pat.appointmentStatus === 'Emergency'
                            ? 'text-red-700 font-extrabold'
                            : pat.appointmentStatus === 'Waiting'
                            ? 'text-amber-700'
                            : pat.appointmentStatus === 'In-Consultation'
                            ? 'text-teal-700'
                            : 'text-emerald-700'
                        }`}
                      >
                        {isSignedOff && <CheckCircle2 className="w-3 h-3" />}
                        {pat.appointmentStatus === 'Emergency' ? '🚨 Emergency' : pat.appointmentStatus}
                      </span>
                    </td>

                    <td className="py-3 px-2 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${
                          isEmergent
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : isUrgent
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {pat.triageLevel.split(' ')[1]?.replace(/[()]/g, '') || pat.triageLevel}
                      </span>
                    </td>

                    <td className="py-3 px-2 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        {isSignedOff && onDownloadAuditRecord && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDownloadAuditRecord(pat);
                            }}
                            title="Download signed-off clinical record for hospital audit"
                            className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white border border-emerald-200 transition-all cursor-pointer inline-flex items-center gap-1"
                          >
                            <Download className="w-3 h-3" />
                            <span>Audit PDF/HTML</span>
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectPatient(pat.id);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1 ${
                            isSelected
                              ? 'bg-[#0D9488] text-white shadow-xs'
                              : 'bg-[#0B1221] text-white hover:bg-slate-800'
                          }`}
                        >
                          <span>{isSelected ? 'Loaded' : 'Load Patient'}</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab Content 2: Diagnostic Reports Table with View Delta Toggle & Amber / Rose Highlights */}
      {activeTab === 'labs' && (
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 font-mono">
                <th className="py-2.5 px-2 whitespace-nowrap">Diagnostic Test</th>
                <th className="py-2.5 px-2 whitespace-nowrap">Result</th>
                {showLabDelta && <th className="py-2.5 px-2 whitespace-nowrap">Delta vs Prior Visit</th>}
                <th className="py-2.5 px-2 whitespace-nowrap">Reference & Severity</th>
                <th className="py-2.5 px-2 text-right whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {displayedLabs.map((lab) => {
                const isCritical = lab.status === 'CRITICAL';
                const isHigh = lab.status === 'HIGH' || lab.status === 'LOW';
                const delta = lab.delta;
                const isDeltaCritical = delta?.severity === 'CRITICAL';
                const isDeltaWarning = delta?.severity === 'WARNING';

                const barPercent = isCritical ? 92 : isHigh ? 74 : 42;
                const barColor = isCritical
                  ? 'bg-red-600'
                  : isHigh
                  ? 'bg-amber-500'
                  : 'bg-teal-600';

                return (
                  <tr
                    key={lab.id}
                    onClick={() => onSelectLabReport(lab)}
                    className={`transition-all cursor-pointer ${
                      showLabDelta && isDeltaCritical
                        ? 'bg-rose-50/70 hover:bg-rose-100/70'
                        : showLabDelta && isDeltaWarning
                        ? 'bg-amber-50/70 hover:bg-amber-100/70'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3 px-2">
                      <div className="font-bold text-slate-900">{lab.name}</div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {lab.category} · {lab.collectedAt}
                      </span>
                    </td>

                    <td className="py-3 px-2 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-mono font-extrabold text-sm tabular-nums ${
                            isCritical
                              ? 'text-red-700'
                              : isHigh
                              ? 'text-amber-700'
                              : 'text-emerald-700'
                          }`}
                        >
                          {lab.value} {lab.unit}
                        </span>
                        <span
                          className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                            isCritical
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : isHigh
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          [{lab.status}]
                        </span>
                      </div>
                    </td>

                    {showLabDelta && (
                      <td className="py-3 px-2 whitespace-nowrap">
                        {delta ? (
                          <div className="flex flex-col">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-extrabold border w-fit ${
                                isDeltaCritical
                                  ? 'bg-[#FF3B6B]/15 text-[#BE123C] border-[#FF3B6B]'
                                  : isDeltaWarning
                                  ? 'bg-[#FFB547]/20 text-[#B45309] border-[#FFB547]'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              }`}
                            >
                              {delta.direction === 'up' && <TrendingUp className="w-3 h-3" />}
                              {delta.direction === 'down' && <TrendingDown className="w-3 h-3" />}
                              {delta.direction === 'unchanged' && <Minus className="w-3 h-3" />}
                              <span>{delta.deltaText}</span>
                              {delta.isSignificant && (
                                <span
                                  className={`ml-1 px-1 py-0.2 rounded text-[8px] uppercase font-extrabold ${
                                    isDeltaCritical
                                      ? 'bg-red-600 text-white'
                                      : 'bg-amber-500 text-slate-950'
                                  }`}
                                >
                                  {isDeltaCritical ? 'CRITICAL' : 'WARNING'}
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                              Prior: <strong className="text-slate-800">{delta.previousValue} {lab.unit}</strong> ({delta.previousDate})
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500">No baseline</span>
                        )}
                      </td>
                    )}

                    <td className="py-3 px-2 min-w-[140px]">
                      <div className="text-[10px] text-slate-500 font-mono mb-1">
                        Ref: {lab.referenceRange}
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${barPercent}%` }}
                          className={`h-full ${barColor} rounded-full`}
                        />
                      </div>
                    </td>

                    <td className="py-3 px-2 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectLabReport(lab);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-[#0B1221] text-slate-800 hover:text-white text-[11px] font-semibold border border-slate-200 transition-all inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Full Report</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab Content 3: Medical History & Pharmacy Refill Adherence Tracker */}
      {activeTab === 'history' && (
        <div className="mt-4 space-y-4">
          <MedicationAdherenceTracker
            medications={activePatient.medications}
            onQuickRefill={onQuickRefill}
          />
        </div>
      )}
    </div>
  );
};
