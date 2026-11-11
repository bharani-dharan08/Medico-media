/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  AlertTriangle,
  Pill,
  FileText,
  Clock,
  CheckCircle2,
  HelpCircle,
  Database,
} from 'lucide-react';
import { Patient, AppointmentStatus } from '../types/clinical.ts';
import { getPatientAvatarConfig } from '../utils/avatarHash.ts';

interface VisionPatientHeroCardProps {
  patient: Patient;
  onUpdateStatus: (patientId: string, status: AppointmentStatus) => void;
  onOpenNotes: () => void;
}

export const VisionPatientHeroCard: React.FC<VisionPatientHeroCardProps> = ({
  patient,
  onUpdateStatus,
  onOpenNotes,
}) => {
  const { demographics, allergies, chronicHistory, medications } = patient;
  const avatar = getPatientAvatarConfig(
    patient.mrn,
    demographics.firstName,
    demographics.lastName,
    patient.mrn
  );

  const genderShort =
    demographics.gender === 'Female'
      ? 'F'
      : demographics.gender === 'Male'
      ? 'M'
      : 'O';
  const hasDocumentedAllergies =
    allergies.length > 0 && allergies.some((a) => !a.substance.includes('NKDA'));
  const hasExplicitNkda =
    allergies.length > 0 && allergies.every((a) => a.substance.includes('NKDA'));

  const gradientId = `pat-avatar-grad-${patient.id.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <div className="vision-card p-5 flex flex-col justify-between h-full min-h-[260px]">
      {/* Top Section: Patient Identity + Unique MRN-Hashed User Avatar + Encounter Status */}
      <div className="space-y-3.5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3.5">
            {/* Dynamically Generated Unique MRN-Hashed User Avatar */}
            <div
              className="relative w-14 h-14 rounded-xl bg-[#0B1221] p-0.5 flex items-center justify-center border border-slate-300 shrink-0 shadow-xs"
              title={`MRN #${patient.mrn} · Deterministic Hash #${avatar.hashHex} (Sum: ${avatar.charSum})`}
            >
              <div className="relative w-full h-full rounded-[10px] bg-[#0B1221] flex items-center justify-center overflow-hidden">
                <svg
                  viewBox="0 0 64 64"
                  className="w-full h-full"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient
                      id={gradientId}
                      x1="0"
                      y1="0"
                      x2="64"
                      y2="64"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop offset="0%" stopColor={avatar.accentHex} />
                      <stop offset="100%" stopColor={avatar.secondaryHex} />
                    </linearGradient>
                  </defs>

                  <circle cx="32" cy="32" r="28" fill={`url(#${gradientId})`} opacity="0.22" />

                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    stroke={`url(#${gradientId})`}
                    strokeWidth="1.5"
                    strokeDasharray={
                      avatar.iconType === 0
                        ? '6 3'
                        : avatar.iconType === 1
                        ? '10 4'
                        : avatar.iconType === 2
                        ? '4 2 8 2'
                        : '14 4'
                    }
                    opacity="0.8"
                  />

                  <circle
                    cx="32"
                    cy="23"
                    r="9.5"
                    fill={`url(#${gradientId})`}
                    stroke="#FFFFFF"
                    strokeWidth="1.2"
                    strokeOpacity="0.6"
                  />
                  <path
                    d="M15 53C15 43.6 22.6 36 32 36C41.4 36 49 43.6 49 53"
                    fill={`url(#${gradientId})`}
                    fillOpacity="0.85"
                    stroke="#FFFFFF"
                    strokeWidth="1.2"
                    strokeOpacity="0.5"
                    strokeLinecap="round"
                  />
                </svg>

                <span className="absolute inset-0 flex items-center justify-center text-[11px] font-mono font-extrabold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] tracking-tighter">
                  {avatar.initials}
                </span>
              </div>

              {/* Blood Type Badge */}
              <span className="absolute -bottom-1.5 -right-1.5 px-1.5 py-0.5 rounded bg-[#0B1221] border border-slate-700 flex items-center justify-center text-[9px] font-mono font-bold text-teal-300">
                {demographics.bloodType}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-600">
                <span className="font-semibold text-[#0D9488]">Active Encounter</span>
                <span aria-hidden="true">·</span>
                <span
                  className="font-mono font-semibold text-slate-600"
                  title="Deterministic MRN Color Hash Digest"
                >
                  ID HASH <strong className="text-slate-900">#{avatar.hashHex}</strong>
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-slate-600 inline-flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#0D9488]" />
                  {patient.timeSlot}
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                {demographics.firstName} {demographics.lastName}, {demographics.age}
                {genderShort}
              </h2>

              <p className="text-xs text-slate-600 font-medium">
                MRN <span className="text-slate-900 font-mono font-bold">#{patient.mrn}</span> · Blood:{' '}
                <span className="text-[#0D9488] font-mono font-bold">
                  {demographics.bloodType}
                </span>{' '}
                · <span className="font-semibold text-slate-800">{patient.triageLevel}</span>
              </p>
            </div>
          </div>

          {/* Encounter Status & Notes Trigger */}
          <div className="flex items-center gap-2">
            <label htmlFor={`hero-status-${patient.id}`} className="sr-only">
              Appointment Status
            </label>
            <select
              id={`hero-status-${patient.id}`}
              value={patient.appointmentStatus}
              onChange={(e) =>
                onUpdateStatus(patient.id, e.target.value as AppointmentStatus)
              }
              aria-label="Appointment Status"
              className={`border text-xs rounded-lg px-2.5 py-1.5 font-semibold cursor-pointer ${
                patient.appointmentStatus === 'Emergency'
                  ? 'bg-red-50 border-red-300 text-red-800 font-bold'
                  : 'bg-white border-slate-300 text-slate-900 focus:border-[#0D9488]'
              }`}
            >
              <option value="Waiting">Waiting</option>
              <option value="In-Consultation">In-Consultation</option>
              <option value="Emergency">Emergency (Auto-Email MD)</option>
              <option value="Done">Done</option>
            </select>

            <button
              type="button"
              onClick={onOpenNotes}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-semibold text-slate-800 transition-colors cursor-pointer whitespace-nowrap"
            >
              <FileText className="w-3.5 h-3.5 text-[#0D9488]" />
              <span>SOAP ({patient.clinicalNotes.length})</span>
            </button>
          </div>
        </div>

        {/* Allergy Status — Explicit Distinction Between Documented Allergy, Explicit NKDA, and Not Recorded */}
        <div className="flex items-center gap-2 flex-wrap">
          {hasDocumentedAllergies ? (
            allergies.map((allergy) => (
              <span
                key={allergy.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-red-50 text-red-800 border border-red-200"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                <span>
                  Allergy: {allergy.substance} ({allergy.reaction.split(',')[0]})
                </span>
              </span>
            ))
          ) : hasExplicitNkda ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Verified: No Known Drug Allergies (NKDA)</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200">
              <HelpCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Allergy Status: Not Recorded in Chart (Confirm with Patient)</span>
            </span>
          )}
        </div>

        {/* Chief Complaint Strip */}
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
          <span className="text-[#0D9488] font-bold uppercase tracking-wider text-[10px] mr-2">
            Chief Complaint:
          </span>
          <span className="text-slate-900 font-medium">
            {patient.chiefComplaint ? `"${patient.chiefComplaint}"` : 'Not recorded'}
          </span>
        </div>
      </div>

      {/* Bottom Section: Quick History Summary, Active Meds & Data Provenance */}
      <div className="pt-3 mt-3 border-t border-slate-200 space-y-2">
        <div className="text-xs text-slate-700 leading-snug">
          <span className="text-slate-900 font-bold mr-1.5">History:</span>
          {chronicHistory.length > 0 ? (
            chronicHistory
              .map((c) => `${c.name} (${c.onsetDate.slice(0, 4)})`)
              .join(' · ')
          ) : (
            <span className="text-amber-800 font-medium">
              No longitudinal condition history recorded in local chart
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
            <Pill className="w-3.5 h-3.5 text-[#0D9488]" />
            Active Regimen:
          </span>
          {medications.length > 0 ? (
            medications.map((med, i) => (
              <React.Fragment key={med.id}>
                {i > 0 && <span className="text-slate-300">·</span>}
                <span className="text-xs font-semibold text-slate-900 font-mono">
                  {med.name.split(' ')[0]} {med.dosage}
                </span>
              </React.Fragment>
            ))
          ) : (
            <span className="text-xs text-amber-800 font-medium">
              No active medications recorded at intake (reconciliation pending)
            </span>
          )}
        </div>

        {/* Honest Clinical Data Source Status */}
        <div className="pt-1.5 flex items-center justify-between gap-2 text-[10px] font-mono text-slate-500">
          <span className="inline-flex items-center gap-1">
            <Database className="w-3 h-3 text-[#0D9488]" />
            Source: Local Synthetic Chart · Vitals recorded {patient.vitals.recordedAt}
          </span>
          <span>PCP: {demographics.pcp || 'Unassigned'}</span>
        </div>
      </div>
    </div>
  );
};
