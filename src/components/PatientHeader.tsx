/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FileText } from 'lucide-react';
import { Patient, AppointmentStatus } from '../types/clinical.ts';
import { getPatientAvatarConfig } from '../utils/avatarHash.ts';

interface PatientHeaderProps {
  patient: Patient;
  onUpdateStatus: (patientId: string, status: AppointmentStatus) => void;
  onOpenNotes: () => void;
}

export const PatientHeader: React.FC<PatientHeaderProps> = ({
  patient,
  onUpdateStatus,
  onOpenNotes,
}) => {
  const { demographics } = patient;
  const isEmergent = patient.triageLevel.includes('Emergent');
  const avatar = getPatientAvatarConfig(
    patient.id,
    demographics.firstName,
    demographics.lastName
  );

  return (
    <div className="vision-card p-4 text-white">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-white/10">
        {/* Name and Basic Identifiers with ID-hashed unique avatar */}
        <div className="flex items-start gap-3.5">
          <div
            className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${avatar.gradientClass} border border-white/25 flex items-center justify-center text-white font-extrabold text-sm shrink-0 font-mono shadow-lg`}
            style={{ boxShadow: `0 0 18px ${avatar.glowColor}` }}
          >
            {avatar.initials}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base font-extrabold text-white tracking-tight">
                {demographics.lastName}, {demographics.firstName}
              </h1>
              <span className="text-xs font-mono text-[#2CD9FF] font-semibold bg-[#0075FF]/20 border border-[#0075FF]/40 px-2 py-0.5 rounded-lg">
                MRN: #{patient.mrn}
              </span>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg ${
                  isEmergent
                    ? 'bg-[#FF3B6B]/20 text-[#FF3B6B] border border-[#FF3B6B]/40'
                    : 'bg-[#FFB547]/20 text-[#FFB547] border border-[#FFB547]/40'
                }`}
              >
                [{patient.triageLevel.toUpperCase()}]
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-[#A0AEC0] font-medium mt-1 flex-wrap">
              <span>
                DOB: {demographics.dob} ({demographics.age}y {demographics.gender})
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-[#2CD9FF]">Blood: {demographics.bloodType}</span>
              <span aria-hidden="true">·</span>
              <span>Lang: {demographics.preferredLanguage}</span>
              <span aria-hidden="true">·</span>
              <span>Ins: {demographics.insuranceProvider}</span>
            </div>
          </div>
        </div>

        {/* Appointment Status & Quick Controls */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <div className="text-right">
            <span className="text-[10px] text-[#A0AEC0] block uppercase font-mono">
              Encounter Slot
            </span>
            <span className="text-xs font-bold text-white font-mono tabular-nums">
              {patient.timeSlot}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={patient.appointmentStatus}
              onChange={(e) =>
                onUpdateStatus(patient.id, e.target.value as AppointmentStatus)
              }
              className="bg-[#0B1437] border border-white/15 text-xs text-white rounded-xl px-3 py-1.5 font-semibold focus:outline-hidden focus:border-[#0075FF] cursor-pointer"
            >
              <option value="Waiting">Waiting</option>
              <option value="In-Consultation">In-Consultation</option>
              <option value="Done">Done (Discharged)</option>
            </select>

            <button
              onClick={onOpenNotes}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-[#2CD9FF]" />
              <span>Notes ({patient.clinicalNotes.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Chief Complaint Highlight */}
      <div className="pt-3 flex items-start gap-2.5 text-xs">
        <span className="font-bold uppercase tracking-wider text-[#2CD9FF] shrink-0 font-mono text-[11px] pt-0.5">
          Chief Complaint:
        </span>
        <p className="text-white font-medium leading-relaxed bg-[#0B1437]/80 p-2 rounded-xl border border-white/10 w-full">
          "{patient.chiefComplaint}"
        </p>
      </div>
    </div>
  );
};
