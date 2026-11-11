/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Download,
  Siren,
  ArrowLeftRight,
  Stethoscope,
  MessageSquareText,
  Mail,
  ShieldCheck,
  Check,
  XCircle,
} from 'lucide-react';
import {
  Patient,
  EmergencyNotification,
  InterHospitalTransfer,
} from '../types/clinical.ts';

interface DoctorSignOffCardProps {
  patient: Patient;
  hospitalCode: string;
  hospitalName: string;
  doctorName: string;
  emergencyAlerts: EmergencyNotification[];
  forwardedTransfers: InterHospitalTransfer[];
  onSignOffPatient: (
    patientId: string,
    clinicalComments: string,
    caretakerDirective: string
  ) => void;
  onDownloadAudit: (patient: Patient) => void;
  onAcknowledgeEmergency: (alertId: string, patientId: string) => void;
  onDoctorDecideTransfer: (
    transferId: string,
    decision: 'Accepted by Doctor' | 'Declined by Doctor',
    notes: string
  ) => void;
}

export const DoctorSignOffCard: React.FC<DoctorSignOffCardProps> = ({
  patient,
  hospitalCode,
  doctorName,
  emergencyAlerts,
  forwardedTransfers,
  onSignOffPatient,
  onDownloadAudit,
  onAcknowledgeEmergency,
  onDoctorDecideTransfer,
}) => {
  const [clinicalComments, setClinicalComments] = useState<string>(
    patient.doctorSignOff?.clinicalComments || ''
  );
  const [caretakerDirective, setCaretakerDirective] = useState<string>(
    patient.doctorSignOff?.caretakerDirective || ''
  );
  const [transferNotes, setTransferNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    setClinicalComments(
      patient.doctorSignOff?.clinicalComments ||
        `Reviewed ${patient.demographics.firstName} ${patient.demographics.lastName} (${patient.triageLevel}). Vitals BP ${patient.vitals.systolic}/${patient.vitals.diastolic} mmHg, Stability Score ${patient.vitalStabilityScore ?? 8.4}/10.`
    );
    setCaretakerDirective(
      patient.doctorSignOff?.caretakerDirective ||
        `Monitor vitals q2h, verify dispense of active medications, and update triage chart prior to discharge.`
    );
  }, [patient]);

  const unacknowledgedAlerts = emergencyAlerts.filter((a) => !a.acknowledgedByDoctor);
  const isSignedOff =
    patient.appointmentStatus === 'Done' || patient.doctorSignOff?.signedOff;

  return (
    <div className="space-y-4">
      {/* 1. Live Emergency SOS Banner (if Care Taker dispatched a critical alert) */}
      {unacknowledgedAlerts.length > 0 && (
        <div className="rounded-xl p-4 bg-red-50 border-2 border-red-600 shadow-sm space-y-3">
          {unacknowledgedAlerts.map((alert) => (
            <div
              key={alert.id}
              className="flex flex-col lg:flex-row lg:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-red-600 text-white text-[11px] font-extrabold tracking-wide uppercase">
                    <Siren className="w-3.5 h-3.5" />
                    EMERGENCY CRITICALITY SOS
                  </span>
                  <span className="text-xs font-mono font-bold text-red-900 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-red-700" />
                    Automated Email Dispatch Logged for: {alert.targetDoctorEmail}
                  </span>
                  <span className="text-[11px] text-red-800 font-mono">
                    · Dispatched {alert.triggeredAt} by {alert.triggeredByCaretaker}
                  </span>
                </div>

                <h4 className="text-sm font-extrabold text-slate-900">
                  Critical Patient: {alert.patientName} (MRN #{alert.patientMrn}) —{' '}
                  <span className="text-red-700">{alert.vitalsSnapshot}</span>
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {alert.severityReason}
                </p>
              </div>

              <button
                onClick={() => onAcknowledgeEmergency(alert.id, alert.patientId)}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold shadow-xs transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Respond & Take Over Emergency Case</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 2. Incoming Inter-Hospital Transfer Cases Forwarded by Admin for Doctor Decision */}
      {forwardedTransfers.length > 0 && (
        <div className="vision-card p-4 border-l-4 border-l-[#0D9488] space-y-3">
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-teal-600" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                Incoming Inter-Hospital Transfer Review (Forwarded by Hospital Admin #{hospitalCode})
              </h3>
            </div>
            <span className="text-[11px] font-mono text-teal-800 font-bold">
              {forwardedTransfers.length} Case(s) Awaiting Physician Decision
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {forwardedTransfers.map((trf) => (
              <div
                key={trf.id}
                className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-extrabold text-slate-900">
                      {trf.patientName} ({trf.ageGender} · Blood {trf.bloodType})
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 font-semibold">
                      From Hospital #{trf.fromHospitalCode} ({trf.fromHospitalName})
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 font-bold">
                      {trf.triageLevel}
                    </span>
                  </div>

                  <p className="text-xs text-slate-800 font-medium">
                    <strong className="text-teal-800">Chief Complaint:</strong> {trf.chiefComplaint}
                  </p>
                  <p className="text-[11px] text-slate-600">
                    <strong className="text-slate-900">Previous Hospital Records:</strong>{' '}
                    {trf.previousRecordsSummary}
                  </p>
                  <p className="text-[11px] font-mono text-amber-800 font-semibold">
                    Transfer Vitals: {trf.vitalsSnapshot}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                  <input
                    type="text"
                    placeholder="Doctor decision note for Admin..."
                    value={transferNotes[trf.id] || ''}
                    onChange={(e) =>
                      setTransferNotes((prev) => ({ ...prev, [trf.id]: e.target.value }))
                    }
                    className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-hidden focus:border-[#0D9488] w-56"
                  />
                  <button
                    onClick={() =>
                      onDoctorDecideTransfer(
                        trf.id,
                        'Accepted by Doctor',
                        transferNotes[trf.id] ||
                          `Case accepted by ${doctorName}. Cath lab / specialty bed ready.`
                      )
                    }
                    className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold cursor-pointer whitespace-nowrap flex items-center justify-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Carry Case (Accept)</span>
                  </button>
                  <button
                    onClick={() =>
                      onDoctorDecideTransfer(
                        trf.id,
                        'Declined by Doctor',
                        transferNotes[trf.id] ||
                          `Unable to carry case currently; recommend tertiary bypass.`
                      )
                    }
                    className="px-3 py-2 rounded-lg bg-red-50 hover:bg-red-600 text-red-700 hover:text-white border border-red-200 text-xs font-bold cursor-pointer whitespace-nowrap flex items-center justify-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Decline</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Doctor Sign-Off, Comments for Care Taker & Mandatory Audit Record Download */}
      <div className="vision-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0B1221] flex items-center justify-center text-teal-400 shadow-xs">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Physician Sign-Off, Care Taker Directives & Hospital Audit Export
                </h3>
                {isSignedOff ? (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-mono font-bold">
                    [✓ SIGNED OFF · AUDIT READY]
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-mono font-bold">
                    [AWAITING FINAL SIGN-OFF]
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-600">
                Active Patient: <strong className="text-slate-900">{patient.demographics.firstName} {patient.demographics.lastName}</strong> (MRN #{patient.mrn}) · Allotted Specialist: <strong className="text-teal-700">{patient.assignedDoctorName || doctorName}</strong>
              </p>
            </div>
          </div>

          {/* Mandatory Audit Download Button for Signed-Off / Finished Records */}
          <button
            onClick={() => onDownloadAudit(patient)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Download Signed Audit Record (HTML/PDF)</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-4 items-end">
          <div className="lg:col-span-5 space-y-1">
            <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
              <MessageSquareText className="w-3.5 h-3.5 text-teal-600" />
              Physician Clinical Assessment & Sign-Off Comment
            </label>
            <textarea
              rows={2}
              value={clinicalComments}
              onChange={(e) => setClinicalComments(e.target.value)}
              placeholder="Enter clinical severity synthesis & sign-off rationale..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-[#0D9488] focus:bg-white"
            />
          </div>

          <div className="lg:col-span-5 space-y-1">
            <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Actionable Instructions for Hospital Care Taker
            </label>
            <textarea
              rows={2}
              value={caretakerDirective}
              onChange={(e) => setCaretakerDirective(e.target.value)}
              placeholder="Instructions for Care Taker (vitals frequency, medication administration, follow-up)..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-[#0D9488] focus:bg-white"
            />
          </div>

          <div className="lg:col-span-2 flex flex-col gap-2">
            <button
              onClick={() =>
                onSignOffPatient(patient.id, clinicalComments, caretakerDirective)
              }
              className="w-full py-2.5 px-3 rounded-lg bg-[#0B1221] hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-teal-400" />
              <span>{isSignedOff ? 'Update Sign-Off' : 'Sign Off Case'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
