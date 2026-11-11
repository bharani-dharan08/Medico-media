/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Mail,
  CheckCircle2,
  Server,
  ExternalLink,
  Copy,
  Check,
  Send,
  Siren,
  X,
  Clock,
  FileCode,
  Eye,
  ShieldAlert,
} from 'lucide-react';
import { EmailDeliveryRecord, Patient } from '../types/clinical.ts';

interface EmailDeliveryInspectorModalProps {
  isOpen: boolean;
  emailLogs: EmailDeliveryRecord[];
  activePatient: Patient;
  onClose: () => void;
  onTriggerManualEmergencyEmail: (patient: Patient, customEmail?: string) => void;
}

export const EmailDeliveryInspectorModal: React.FC<EmailDeliveryInspectorModalProps> = ({
  isOpen,
  emailLogs,
  activePatient,
  onClose,
  onTriggerManualEmergencyEmail,
}) => {
  const [selectedLogId, setSelectedLogId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'formatted' | 'raw'>('formatted');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [overrideEmail, setOverrideEmail] = useState<string>('');

  if (!isOpen) return null;

  const selectedLog =
    emailLogs.find((l) => l.id === selectedLogId) || emailLogs[0] || null;

  const handleCopyPayload = (log: EmailDeliveryRecord) => {
    navigator.clipboard.writeText(log.textBody);
    setCopiedId(log.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="vision-card w-full max-w-5xl border border-[#2CD9FF]/40 overflow-hidden shadow-[0_0_50px_rgba(0,117,255,0.45)] flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#060B28] via-[#0B1437] to-[#060B28] border-b border-white/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0075FF] to-[#2CD9FF] flex items-center justify-center text-white shadow-[0_0_16px_rgba(0,117,255,0.5)] shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-extrabold text-white tracking-tight">
                  Automated Physician Email Integration Service & Outbox Log
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-[#01B574]/20 text-[#01B574] border border-[#01B574]/40 text-[10px] font-mono font-bold">
                  SMTP RELAY ONLINE · 250 2.0.0 OK
                </span>
              </div>
              <p className="text-xs text-[#A0AEC0]">
                Automatically dispatches real-time clinical alerts to the allotted physician's registered email whenever an <strong className="text-[#FF3B6B]">Emergency</strong> status is flagged for a patient.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#A0AEC0] hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Trigger Bar for Active Patient */}
        <div className="px-6 py-3 bg-[#0B1437]/90 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <Siren className="w-4 h-4 text-[#FF3B6B] shrink-0" />
            <span className="text-[#A0AEC0]">Active Patient:</span>
            <strong className="text-white">
              {activePatient.demographics.firstName} {activePatient.demographics.lastName}
            </strong>
            <span className="font-mono text-[#2CD9FF] text-[11px]">
              (MRN #{activePatient.mrn})
            </span>
            <span className="text-[#A0AEC0] hidden sm:inline">→</span>
            <span className="text-xs text-[#01B574] font-mono hidden sm:inline">
              Assigned MD: {activePatient.assignedDoctorName || 'Dr. Sarah Chen, MD'}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="email"
              value={overrideEmail}
              onChange={(e) => setOverrideEmail(e.target.value)}
              placeholder="Optional override physician email..."
              className="bg-[#050A1F] border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white font-mono w-56 focus:outline-hidden focus:border-[#2CD9FF]"
            />
            <button
              onClick={() =>
                onTriggerManualEmergencyEmail(
                  activePatient,
                  overrideEmail.trim() || undefined
                )
              }
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#E31A1A] to-[#FF3B6B] hover:brightness-110 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-[0_0_15px_rgba(227,26,26,0.4)] cursor-pointer whitespace-nowrap"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Flag Emergency & Auto-Dispatch Email Now</span>
            </button>
          </div>
        </div>

        {/* Main Split Body: Left Outbox List (4 cols) + Right Payload Inspector (8 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden min-h-[420px]">
          {/* Left Column: Dispatched Email Queue */}
          <div className="lg:col-span-5 border-r border-white/10 overflow-y-auto p-4 space-y-2.5 bg-[#050A1F]/60">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#A0AEC0] pb-1">
              <span>DISPATCHED PHYSICIAN ALERTS ({emailLogs.length})</span>
              <span className="text-[#2CD9FF]">AUTO-TRIGGER</span>
            </div>

            {emailLogs.map((log) => {
              const isSelected = selectedLog?.id === log.id;
              return (
                <button
                  key={log.id}
                  onClick={() => setSelectedLogId(log.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                    isSelected
                      ? 'bg-[#0075FF]/20 border-[#2CD9FF] shadow-[0_0_15px_rgba(0,117,255,0.25)]'
                      : 'bg-[#0B1437]/70 border-white/10 hover:border-white/25'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#01B574]/20 text-[#01B574] border border-[#01B574]/40 text-[10px] font-mono font-bold">
                      <CheckCircle2 className="w-3 h-3" />
                      {log.deliveryStatus} ({log.latencyMs}ms)
                    </span>
                    <span className="text-[10px] font-mono text-[#A0AEC0] flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#2CD9FF]" />
                      {log.timestamp}
                    </span>
                  </div>

                  <div className="text-xs font-extrabold text-white truncate">
                    {log.patientName}{' '}
                    <span className="font-mono text-[#2CD9FF] font-semibold">
                      (MRN #{log.patientMrn})
                    </span>
                  </div>

                  <div className="text-[11px] font-mono text-[#2CD9FF] truncate">
                    To: {log.recipientDoctorName} &lt;{log.recipientEmail}&gt;
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FF3B6B]/15 text-[#FF3B6B] border border-[#FF3B6B]/30">
                      {log.triggerSource.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] font-mono text-[#A0AEC0]">
                      HOSP #{log.hospitalCode}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column: Email Message & SMTP Transaction Inspector */}
          <div className="lg:col-span-7 overflow-y-auto p-5 space-y-4 bg-[#060B28]/90">
            {selectedLog ? (
              <>
                {/* SMTP Envelope Metadata Card */}
                <div className="p-4 rounded-xl bg-[#0B1437] border border-white/10 space-y-2 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Server className="w-4 h-4 text-[#01B574]" />
                      <span className="font-mono font-bold text-[#01B574] text-[11px]">
                        {selectedLog.smtpResponse}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setViewMode('formatted')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                          viewMode === 'formatted'
                            ? 'bg-[#0075FF] text-white'
                            : 'bg-white/5 text-[#A0AEC0] hover:text-white'
                        }`}
                      >
                        <Eye className="w-3 h-3" />
                        <span>HTML Card</span>
                      </button>
                      <button
                        onClick={() => setViewMode('raw')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                          viewMode === 'raw'
                            ? 'bg-[#0075FF] text-white'
                            : 'bg-white/5 text-[#A0AEC0] hover:text-white'
                        }`}
                      >
                        <FileCode className="w-3 h-3" />
                        <span>MIME / Raw Text</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-[#A0AEC0]">Physician Recipient: </span>
                      <strong className="text-white">{selectedLog.recipientDoctorName}</strong>
                    </div>
                    <div>
                      <span className="text-[#A0AEC0]">Registered Email: </span>
                      <strong className="text-[#2CD9FF] font-mono">
                        {selectedLog.recipientEmail}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#A0AEC0]">CC Escalation Pool: </span>
                      <span className="text-white/90 font-mono">
                        {selectedLog.ccEmails.join(', ')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#A0AEC0]">RFC-5322 Message-ID: </span>
                      <span className="text-[#FFB547] font-mono">
                        {selectedLog.messageId}
                      </span>
                    </div>
                  </div>

                  <div className="pt-1 border-t border-white/5">
                    <span className="text-[#A0AEC0] text-[11px]">Subject: </span>
                    <span className="text-white font-bold text-xs">
                      {selectedLog.subject}
                    </span>
                  </div>
                </div>

                {/* Email Content Preview */}
                {viewMode === 'formatted' ? (
                  <div className="rounded-2xl border border-[#FF3B6B]/40 overflow-hidden bg-[#050A1F]">
                    <div className="px-4 py-3 bg-gradient-to-r from-[#E31A1A] to-[#FF3B6B] flex items-center justify-between text-white">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4" />
                        <span className="text-xs font-extrabold uppercase tracking-wider">
                          Automated Emergency Clinical Alert — Hospital #{selectedLog.hospitalCode}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold bg-black/30 px-2 py-0.5 rounded">
                        {selectedLog.triageLevel}
                      </span>
                    </div>

                    <div className="p-4 space-y-3 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded-xl bg-[#0B1437] border border-white/10">
                        <div>
                          <div className="text-[10px] text-[#A0AEC0] uppercase font-bold">
                            Patient Identity
                          </div>
                          <div className="text-sm font-extrabold text-white mt-0.5">
                            {selectedLog.patientName} (MRN #{selectedLog.patientMrn})
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-[#A0AEC0] uppercase font-bold">
                            Triggered By & Source
                          </div>
                          <div className="text-xs font-bold text-[#FFB547] mt-0.5">
                            {selectedLog.triggerActor} ·{' '}
                            {selectedLog.triggerSource.replace(/_/g, ' ')}
                          </div>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-[#0B1437] border border-[#2CD9FF]/30">
                        <div className="text-[10px] font-bold uppercase text-[#2CD9FF] mb-1">
                          Live Vitals & Early Warning Snapshot
                        </div>
                        <div className="font-mono text-white font-bold text-xs">
                          {selectedLog.vitalsSummary}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-[#E31A1A]/15 border-l-4 border-l-[#FF3B6B] text-white/95 leading-relaxed">
                        <div className="text-[10px] font-extrabold uppercase text-[#FF3B6B] mb-1">
                          Emergency Escalation Reason
                        </div>
                        {selectedLog.clinicalReason}
                      </div>
                    </div>
                  </div>
                ) : (
                  <pre className="p-4 rounded-xl bg-[#050A1F] border border-white/15 text-[11px] font-mono text-[#2CD9FF] overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {selectedLog.textBody}
                  </pre>
                )}

                {/* Action Footer for Selected Email */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                  <button
                    onClick={() => handleCopyPayload(selectedLog)}
                    className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedId === selectedLog.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#01B574]" />
                        <span className="text-[#01B574]">Copied SMTP Payload</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#2CD9FF]" />
                        <span>Copy MIME Alert Text</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-2">
                    <a
                      href={selectedLog.gmailComposeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-[#0075FF] hover:bg-[#0062D6] text-white text-xs font-extrabold flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Open in Google Mail (Gmail)</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <a
                      href={selectedLog.mailtoUrl}
                      className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold whitespace-nowrap"
                    >
                      Default Mail Client
                    </a>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-16 text-sm text-[#A0AEC0]">
                No emergency emails dispatched yet. Flag any patient as "Emergency" to trigger an automated physician alert.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
