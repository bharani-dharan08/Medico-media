/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ArrowLeftRight,
  Send,
  Stethoscope,
  Download,
  CheckCircle2,
  FileCheck2,
  UserPlus,
} from 'lucide-react';
import {
  Patient,
  InterHospitalTransfer,
  EmergencyNotification,
  UserSession,
} from '../types/clinical.ts';
import { HOSPITAL_FACILITIES, HOSPITAL_SPECIALISTS } from '../data/hospitalRegistry.ts';
import { AdminRoleCharts } from './AdminRoleCharts.tsx';
import { AdminAuditOversightD3 } from './AdminAuditOversightD3.tsx';
import { AiSecurityOperationsCenter } from './AiSecurityOperationsCenter.tsx';

interface AdminHospitalWorkspaceProps {
  patients: Patient[];
  session: UserSession;
  transfers: InterHospitalTransfer[];
  emergencyAlerts: EmergencyNotification[];
  onInitiateOutboundTransfer: (transfer: InterHospitalTransfer) => void;
  onForwardTransferToDoctor: (
    transferId: string,
    doctorId: string,
    doctorName: string,
    specialty: string
  ) => void;
  onAdminFinalizeTransferAdmission: (transferId: string) => void;
  onDownloadPatientAudit: (patient: Patient) => void;
  onDownloadMasterAuditBundle: () => void;
}

export const AdminHospitalWorkspace: React.FC<AdminHospitalWorkspaceProps> = ({
  patients,
  session,
  transfers,
  emergencyAlerts,
  onInitiateOutboundTransfer,
  onForwardTransferToDoctor,
  onAdminFinalizeTransferAdmission,
  onDownloadPatientAudit,
  onDownloadMasterAuditBundle,
}) => {
  // Outbound Transfer Form State
  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    patients[0]?.id || 'pat-001'
  );
  const [targetHospitalCode, setTargetHospitalCode] = useState<string>('77319022');
  const [transferReason, setTransferReason] = useState<string>(
    'Requires specialized tertiary cardiac/metabolic co-management and ICU telemetry bed.'
  );
  const [outboundSuccess, setOutboundSuccess] = useState<string>('');

  // Doctor selection for incoming transfers
  const [selectedDoctorByTransfer, setSelectedDoctorByTransfer] = useState<
    Record<string, string>
  >({});

  const handleOutboundSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedCode = targetHospitalCode.replace(/\D/g, '');
    if (cleanedCode.length !== 8) return;

    const pat = patients.find((p) => p.id === selectedPatientId) || patients[0];
    if (!pat) return;

    const destFacility =
      HOSPITAL_FACILITIES.find((f) => f.code === cleanedCode) || {
        code: cleanedCode,
        name: `Partner Hospital Facility #${cleanedCode}`,
      };

    const nowTime = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const newTrf: InterHospitalTransfer = {
      id: `trf-${Date.now()}`,
      patientId: pat.id,
      patientName: `${pat.demographics.firstName} ${pat.demographics.lastName}`,
      patientMrn: pat.mrn,
      ageGender: `${pat.demographics.age}y ${pat.demographics.gender}`,
      bloodType: pat.demographics.bloodType,
      chiefComplaint: pat.chiefComplaint,
      triageLevel: pat.triageLevel,
      fromHospitalCode: session.hospitalCode,
      fromHospitalName: session.hospitalName,
      toHospitalCode: cleanedCode,
      toHospitalName: destFacility.name,
      initiatedByAdmin: `${session.userName} (#${session.hospitalCode})`,
      initiatedAt: nowTime,
      transferReason,
      previousRecordsSummary: `History: ${pat.chronicHistory
        .map((c) => c.name)
        .join(', ')}. Active Meds: ${pat.medications
        .map((m) => `${m.name} ${m.dosage}`)
        .join(', ')}. Allergies: ${pat.allergies
        .map((a) => a.substance)
        .join(', ')}. Labs: ${pat.labReports
        .map((l) => `${l.name} ${l.value}${l.unit} [${l.status}]`)
        .join('; ')}.`,
      vitalsSnapshot: `BP ${pat.vitals.systolic}/${pat.vitals.diastolic} mmHg · HR ${pat.vitals.heartRate} bpm · SpO2 ${pat.vitals.o2Sat}%`,
      status: 'Pending Receiving Admin',
    };

    onInitiateOutboundTransfer(newTrf);
    setOutboundSuccess(
      `✓ Transferred ${newTrf.patientName} (MRN #${newTrf.patientMrn}) with full clinical dossier to Hospital #${cleanedCode} (${destFacility.name})!`
    );
    setTimeout(() => setOutboundSuccess(''), 5000);
  };

  const signedOffPatients = patients.filter(
    (p) => p.appointmentStatus === 'Done' || p.doctorSignOff?.signedOff
  );

  return (
    <div className="space-y-5 pb-8">
      {/* Hospital Admin Header Card */}
      <div className="vision-card p-5 border-l-4 border-l-[#0B1221] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-900 border border-slate-300 text-[10px] font-mono font-extrabold">
              SINGLE HOSPITAL ADMIN AUTHORITY · CODE #{session.hospitalCode}
            </span>
            <span className="text-xs text-slate-600 font-mono">
              {session.hospitalName} · Admin: <strong className="text-slate-900">{session.userName}</strong>
            </span>
          </div>
          <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
            Hospital Command, Inter-Hospital 8-Digit Code Transfers & Audit Governance
          </h1>
          <p className="text-xs text-slate-600">
            Maintain unified records across Care Takers and Doctors, transfer patients between hospitals via 8-digit code, route incoming transfer records to specialists for case-carry decisions, and export signed audit dossiers.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onDownloadMasterAuditBundle}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0B1221] hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer whitespace-nowrap"
          >
            <Download className="w-4 h-4 text-teal-400" />
            <span>Export Master Hospital Audit Bundle (JSON)</span>
          </button>
        </div>
      </div>

      {/* Audit Oversight Module: D3 Bar Chart for Sign-Off Velocity & Report Completion Rates */}
      <AdminAuditOversightD3
        patients={patients}
        hospitalCode={session.hospitalCode}
      />

      {/* Hospital Admin Role Analytics Charts (8-Digit Transfer Flow, Audit Compliance & Governance Donut) */}
      <AdminRoleCharts
        patients={patients}
        transfers={transfers}
        emergencyAlerts={emergencyAlerts}
        hospitalCode={session.hospitalCode}
      />

      {/* AI-Specific Threat Defenses, PIM/PAM Access Control & Supply Chain Security */}
      <AiSecurityOperationsCenter session={session} />

      {/* Top Row: Outbound Transfer Form + Inbound / Inter-Hospital Transfer Workflow */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Left (4 cols): Transfer Patient to Another Hospital via 8-Digit Code */}
        <div className="xl:col-span-4 vision-card p-5 space-y-4 h-fit">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-teal-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Transfer Patient to Another Hospital
              </h2>
            </div>
            <span className="text-[10px] font-mono text-teal-700 font-bold">8-Digit Protocol</span>
          </div>

          {outboundSuccess && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold">
              {outboundSuccess}
            </div>
          )}

          <form onSubmit={handleOutboundSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                1. Select Patient from Hospital #{session.hospitalCode}
              </label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-semibold"
              >
                {patients.map((pat) => (
                  <option key={pat.id} value={pat.id}>
                    {pat.demographics.firstName} {pat.demographics.lastName} (MRN #{pat.mrn} ·{' '}
                    {pat.triageLevel})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-teal-800 block mb-1">
                2. Destination Hospital 8-Digit Code *
              </label>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {HOSPITAL_FACILITIES.filter((f) => f.code !== session.hospitalCode).map(
                  (fac) => (
                    <button
                      type="button"
                      key={fac.code}
                      onClick={() => setTargetHospitalCode(fac.code)}
                      className={`px-2.5 py-1 rounded-md font-mono text-[11px] font-bold border cursor-pointer ${
                        targetHospitalCode === fac.code
                          ? 'bg-[#0B1221] border-[#0B1221] text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      #{fac.code} ({fac.name.split(' ')[0]})
                    </button>
                  )
                )}
              </div>
              <input
                type="text"
                maxLength={8}
                required
                value={targetHospitalCode}
                onChange={(e) =>
                  setTargetHospitalCode(e.target.value.replace(/\D/g, '').slice(0, 8))
                }
                placeholder="Enter 8-digit hospital code (e.g. 77319022)"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                3. Clinical Transfer Reason & Previous Records Note *
              </label>
              <textarea
                rows={3}
                required
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-lg bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>Transmit Patient & Records via Code #{targetHospitalCode}</span>
            </button>
          </form>
        </div>

        {/* Right (8 cols): Inter-Hospital Transfer Queue & Admin -> Doctor Review Pipeline */}
        <div className="xl:col-span-8 vision-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-teal-600" />
                Inter-Hospital Transfer Pipeline (Admin Review → Doctor Case-Carry Decision → Admission)
              </h2>
              <p className="text-[11px] text-slate-600">
                Receive transferred patients from other hospitals, reach out to your hospital's specialist doctor with previous records, and execute the doctor's decision.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-teal-700">
              {transfers.length} Active Transfers
            </span>
          </div>

          <div className="space-y-3">
            {transfers.map((trf) => {
              const docChoiceId = selectedDoctorByTransfer[trf.id] || 'doc-01';

              return (
                <div
                  key={trf.id}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 text-[10px] font-mono font-bold">
                        FROM #{trf.fromHospitalCode} → TO #{trf.toHospitalCode}
                      </span>
                      <h3 className="text-sm font-extrabold text-slate-900">
                        {trf.patientName} ({trf.ageGender} · MRN #{trf.patientMrn})
                      </h3>
                      <span className="text-[10px] font-mono text-red-700 font-bold">
                        [{trf.triageLevel}]
                      </span>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-extrabold border ${
                        trf.status === 'Accepted by Doctor' ||
                        trf.status === 'Admitted to Hospital'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : trf.status === 'Declined by Doctor'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      STATUS: {trf.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <p className="text-slate-900 font-medium">
                      <strong className="text-teal-800">Chief Complaint & Transfer Reason:</strong>{' '}
                      {trf.chiefComplaint} — <em>{trf.transferReason}</em>
                    </p>
                    <p className="text-slate-600 text-[11px]">
                      <strong className="text-slate-900">Attached Previous Hospital Records:</strong>{' '}
                      {trf.previousRecordsSummary}
                    </p>
                    <p className="text-[11px] font-mono text-amber-800 font-semibold">
                      Vitals at Transfer: {trf.vitalsSnapshot}
                    </p>
                  </div>

                  {/* Doctor Decision Feedback (if doctor already responded) */}
                  {trf.doctorDecisionNotes && (
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs">
                      <span className="font-bold text-teal-800">
                        Specialist Decision ({trf.assignedDoctorName}):
                      </span>{' '}
                      <span className="text-slate-900">{trf.doctorDecisionNotes}</span>
                      {trf.decidedAt && (
                        <span className="text-[10px] font-mono text-slate-500 ml-2">
                          ({trf.decidedAt})
                        </span>
                      )}
                    </div>
                  )}

                  {/* Admin Action Bar based on Transfer Stage */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="text-[11px] text-slate-500 font-mono">
                      Initiated by {trf.initiatedByAdmin} at {trf.initiatedAt}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {trf.status === 'Pending Receiving Admin' && (
                        <>
                          <select
                            value={docChoiceId}
                            onChange={(e) =>
                              setSelectedDoctorByTransfer((prev) => ({
                                ...prev,
                                [trf.id]: e.target.value,
                              }))
                            }
                            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-900 font-semibold"
                          >
                            {HOSPITAL_SPECIALISTS.map((doc) => (
                              <option key={doc.id} value={doc.id}>
                                Consult: {doc.name} ({doc.specialty.split(' ')[0]})
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => {
                              const doc =
                                HOSPITAL_SPECIALISTS.find((d) => d.id === docChoiceId) ||
                                HOSPITAL_SPECIALISTS[0];
                              onForwardTransferToDoctor(
                                trf.id,
                                doc.id,
                                doc.name,
                                doc.specialty
                              );
                            }}
                            className="px-3.5 py-1.5 rounded-lg bg-[#0B1221] hover:bg-slate-800 text-white text-[11px] font-bold cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                          >
                            <Stethoscope className="w-3.5 h-3.5 text-teal-400" />
                            <span>Forward Previous Records to Doctor for Decision</span>
                          </button>
                        </>
                      )}

                      {trf.status === 'Forwarded to Doctor' && (
                        <span className="text-[11px] font-bold text-teal-800">
                          ⏳ Forwarded to {trf.assignedDoctorName} — Switch to Doctor View to Accept/Decline
                        </span>
                      )}

                      {trf.status === 'Accepted by Doctor' && (
                        <button
                          onClick={() => onAdminFinalizeTransferAdmission(trf.id)}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold cursor-pointer flex items-center gap-1.5 whitespace-nowrap shadow-xs"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Doctor Accepted — Admit Patient to Hospital #{session.hospitalCode} Queue</span>
                        </button>
                      )}

                      {trf.status === 'Admitted to Hospital' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Admitted to Active Hospital Roster
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Section: Master Hospital Documentation & Signed-Off Audit Vault */}
      <div className="vision-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-emerald-600" />
              Master Hospital #{session.hospitalCode} Documentation & Signed-Off Audit Vault
            </h2>
            <p className="text-[11px] text-slate-600">
              Unified compliance registry of Care Taker entries, Specialist allotments, Physician sign-off comments, and downloadable Hospital Audit Reports ({signedOffPatients.length} signed off / {patients.length} total).
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 font-mono">
                <th className="py-2.5 px-2 whitespace-nowrap">Patient & MRN</th>
                <th className="py-2.5 px-2 whitespace-nowrap">Hospital Code</th>
                <th className="py-2.5 px-2 whitespace-nowrap">Allotted Specialist</th>
                <th className="py-2.5 px-2 whitespace-nowrap">Status & Sign-Off</th>
                <th className="py-2.5 px-2">Doctor Comments & Care Taker Directive</th>
                <th className="py-2.5 px-2 text-right whitespace-nowrap">Audit Record Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {patients.map((pat) => {
                const isSigned =
                  pat.appointmentStatus === 'Done' || pat.doctorSignOff?.signedOff;
                return (
                  <tr key={pat.id} className="hover:bg-slate-50">
                    <td className="py-3 px-2 whitespace-nowrap">
                      <div className="font-bold text-slate-900">
                        {pat.demographics.firstName} {pat.demographics.lastName}
                      </div>
                      <div className="text-[10px] font-mono text-teal-700 font-semibold">
                        MRN #{pat.mrn} · {pat.demographics.age}
                        {pat.demographics.gender[0]}
                      </div>
                    </td>

                    <td className="py-3 px-2 whitespace-nowrap font-mono text-slate-900 font-bold">
                      #{pat.hospitalCode || session.hospitalCode}
                    </td>

                    <td className="py-3 px-2 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">
                        {pat.assignedDoctorName || 'Dr. Sarah Chen, MD'}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {pat.assignedSpecialty || 'Cardiology'}
                      </div>
                    </td>

                    <td className="py-3 px-2 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                          isSigned
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {isSigned ? '✓ SIGNED OFF' : pat.appointmentStatus.toUpperCase()}
                      </span>
                    </td>

                    <td className="py-3 px-2 max-w-[320px]">
                      {pat.doctorSignOff ? (
                        <div className="space-y-0.5 text-[11px]">
                          <p className="text-slate-900 truncate">
                            <strong>Doc:</strong> {pat.doctorSignOff.clinicalComments}
                          </p>
                          <p className="text-emerald-800 truncate">
                            <strong>Caretaker Directive:</strong>{' '}
                            {pat.doctorSignOff.caretakerDirective}
                          </p>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500">
                          In active consultation — awaiting physician sign-off
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-2 text-right whitespace-nowrap">
                      <button
                        onClick={() => onDownloadPatientAudit(pat)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Audit Record</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
