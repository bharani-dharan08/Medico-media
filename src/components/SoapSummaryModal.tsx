/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  X,
  Sparkles,
  Copy,
  Check,
  FilePlus,
  ShieldCheck,
  ShieldAlert,
  EyeOff,
  Eye,
  Lock,
} from 'lucide-react';
import { Patient } from '../types/clinical.ts';
import { evaluatePromptAndMaskPii } from '../utils/aiSecurityEngine.ts';

interface SoapSummaryModalProps {
  isOpen: boolean;
  patient: Patient;
  onClose: () => void;
  onSaveSoapToNotes: (soapText: string) => void;
}

export const SoapSummaryModal: React.FC<SoapSummaryModalProps> = ({
  isOpen,
  patient,
  onClose,
  onSaveSoapToNotes,
}) => {
  const [copied, setCopied] = useState(false);
  const [enablePiiMasking, setEnablePiiMasking] = useState(true);
  const [customInstruction, setCustomInstruction] = useState(
    'Highlight acute hemodynamic risks and prioritize evidence-based cardiology follow-up.'
  );

  if (!isOpen) return null;

  const {
    demographics,
    vitals,
    allergies,
    chronicHistory,
    medications,
    labReports,
    pendingActions,
  } = patient;

  const abnormalLabs = labReports.filter((l) => l.status !== 'NORMAL');
  const pendingItems = pendingActions.filter((a) => a.status === 'pending');

  const rawSoapText = `SUBJECTIVE (S):
Patient ${demographics.firstName} ${demographics.lastName}, ${demographics.age}yo ${demographics.gender} (MRN #${patient.mrn}, DOB ${demographics.dob}, Phone ${demographics.phone}) presents for ${patient.timeSlot} encounter (${patient.triageLevel}) with chief complaint: "${patient.chiefComplaint}".
Allergies: ${allergies.map((a) => `${a.substance} (${a.reaction})`).join('; ') || 'None recorded'}.
Active History: ${chronicHistory.map((c) => c.name).join(', ') || 'None recorded'}.

OBJECTIVE (O):
Vitals (${vitals.recordedAt}): BP ${vitals.systolic}/${vitals.diastolic} mmHg | HR ${vitals.heartRate} bpm | RR ${vitals.respRate}/min | SpO2 ${vitals.o2Sat}% | Temp ${vitals.tempF}°F | BMI ${vitals.bmi}.
Vital Stability Score: ${patient.vitalStabilityScore ?? 8.4}/10.
Abnormal Diagnostic Labs:
${
  abnormalLabs.length > 0
    ? abnormalLabs
        .map(
          (l) =>
            `- ${l.name}: ${l.value} ${l.unit} [${l.status}] ${
              l.delta ? `(Delta: ${l.delta.deltaText} vs ${l.delta.previousDate})` : ''
            }`
        )
        .join('\n')
    : '- All current laboratory panels within normal reference intervals.'
}

ASSESSMENT (A):
${demographics.age}yo ${demographics.gender} presenting with ${patient.chiefComplaint.toLowerCase()}.
Key clinical priorities: ${vitals.abnormalities.join(', ') || 'Stable hemodynamics'}.
Active Regimen: ${medications.map((m) => `${m.name} ${m.dosage} (${m.frequency})`).join('; ')}.

PLAN (P):
${
  pendingItems.length > 0
    ? pendingItems.map((p, idx) => `${idx + 1}. ${p.title} — ${p.description}`).join('\n')
    : '1. Continue current medical regimen and routine outpatient surveillance.'
}

CO-PILOT DIRECTIVE:
${customInstruction}`;

  // Screen custom prompt + SOAP context through the Prompt Injection Firewall & PII Masking Gateway
  const securityCheck = evaluatePromptAndMaskPii(rawSoapText, [
    `${demographics.firstName} ${demographics.lastName}`,
    demographics.firstName,
    demographics.lastName,
  ]);

  const displayedSoapText = enablePiiMasking
    ? securityCheck.piiMaskedPrompt
    : securityCheck.sanitizedPrompt;

  const handleCopy = () => {
    navigator.clipboard.writeText(displayedSoapText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="vision-card w-full max-w-3xl bg-white border border-slate-200 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0B1221] text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#0D9488] flex items-center justify-center text-white shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-white tracking-tight">
                  MEDICO-MEDIA AI Clinical Co-Pilot — Protected SOAP Synthesis
                </h3>
                <span className="px-2 py-0.5 rounded bg-teal-500/20 border border-teal-400/40 text-teal-300 text-[10px] font-mono font-bold">
                  PII GATEWAY + FIREWALL ACTIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-mono mt-0.5">
                {demographics.firstName} {demographics.lastName} · MRN #{patient.mrn}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto bg-white">
          {/* Inline AI Security Firewall & PII Masking Controls */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {securityCheck.isBlocked ? (
                  <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-[#0D9488] shrink-0" />
                )}
                <span className="text-xs font-extrabold text-slate-900">
                  Prompt Injection Firewall & Inline PII Tokenization Gateway
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                    securityCheck.isBlocked
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}
                >
                  {securityCheck.isBlocked
                    ? `INJECTION BLOCKED (Score ${securityCheck.threatScore}/100)`
                    : `VERIFIED SAFE (${securityCheck.maskedEntities.length} PII Tokens Scrubbed)`}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setEnablePiiMasking((prev) => !prev)}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1.5 cursor-pointer transition-colors ${
                  enablePiiMasking
                    ? 'bg-[#0B1221] text-white border-[#0B1221]'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {enablePiiMasking ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-[#14B8A6]" />
                    <span>PII Masking ON (Tokenized Context)</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 text-amber-600" />
                    <span>PII Masking OFF (Raw Clinical Chart)</span>
                  </>
                )}
              </button>
            </div>

            {/* Custom Co-Pilot Prompt Input (Screened in real-time by Prompt Firewall) */}
            <div>
              <label
                htmlFor="soap-custom-prompt"
                className="text-[11px] font-bold text-slate-700 block mb-1"
              >
                Co-Pilot Custom Prompt Instruction (Monitored by Prompt Injection Firewall):
              </label>
              <input
                id="soap-custom-prompt"
                type="text"
                value={customInstruction}
                onChange={(e) => setCustomInstruction(e.target.value)}
                placeholder="Add clinical synthesis instruction..."
                className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 font-mono"
              />
            </div>
          </div>

          {/* Synthesized SOAP Output */}
          <div className="p-4 rounded-xl bg-[#0B1221] border border-slate-800 font-mono text-xs text-slate-100 whitespace-pre-wrap leading-relaxed">
            {displayedSoapText}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-xs font-bold text-slate-800 transition-colors cursor-pointer"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <Copy className="w-4 h-4 text-[#0D9488]" />
            )}
            <span>{copied ? 'Copied to Clipboard' : 'Copy SOAP Note'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              disabled={securityCheck.isBlocked}
              onClick={() => {
                onSaveSoapToNotes(displayedSoapText);
                onClose();
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-xs font-bold transition-colors cursor-pointer ${
                securityCheck.isBlocked
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-[#0D9488] hover:bg-[#0F766E]'
              }`}
            >
              {securityCheck.isBlocked ? (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Blocked by Prompt Firewall</span>
                </>
              ) : (
                <>
                  <FilePlus className="w-4 h-4" />
                  <span>Commit to Patient Chart</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
