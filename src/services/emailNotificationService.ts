/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Patient,
  EmailDeliveryRecord,
  EmailTriggerSource,
  SpecialistDoctor,
} from '../types/clinical.ts';
import {
  HOSPITAL_SPECIALISTS,
  HOSPITAL_FACILITIES,
} from '../data/hospitalRegistry.ts';
import { buildEmergencyGmailUrl } from '../utils/auditExport.ts';
import { calculateEWS } from '../utils/triage.ts';

export interface TriggerEmergencyEmailInput {
  patient: Patient;
  hospitalCode: string;
  hospitalName?: string;
  triggeredBy: string;
  triggerSource: EmailTriggerSource;
  customReason?: string;
  overrideRecipientEmail?: string;
  overrideRecipientName?: string;
}

/**
 * Resolves the assigned physician and their registered email address from the hospital registry.
 */
export function resolvePhysicianForPatient(
  patient: Patient,
  overrideEmail?: string,
  overrideName?: string
): {
  doctorId: string;
  doctorName: string;
  registeredEmail: string;
  specialty: string;
  ccEmails: string[];
} {
  const matchedSpecialist: SpecialistDoctor | undefined =
    HOSPITAL_SPECIALISTS.find((d) => d.id === patient.assignedDoctorId) ||
    HOSPITAL_SPECIALISTS.find(
      (d) =>
        patient.assignedDoctorName &&
        d.name.toLowerCase() === patient.assignedDoctorName.toLowerCase()
    ) ||
    HOSPITAL_SPECIALISTS[0];

  const doctorId = matchedSpecialist?.id || 'doc-01';
  const doctorName =
    overrideName?.trim() ||
    patient.assignedDoctorName ||
    matchedSpecialist?.name ||
    'Dr. Sarah Chen, MD';
  const registeredEmail =
    overrideEmail?.trim() ||
    matchedSpecialist?.email ||
    'ashwinsivasamy08@gmail.com';
  const specialty =
    patient.assignedSpecialty ||
    matchedSpecialist?.specialty ||
    'Interventional Cardiology & Internal Medicine';

  // Include primary on-call lead in CC if the assigned specialist has a different address
  const ccSet = new Set<string>();
  if (registeredEmail.toLowerCase() !== 'ashwinsivasamy08@gmail.com') {
    ccSet.add('ashwinsivasamy08@gmail.com');
  }
  ccSet.add('rapid-response-desk@medvision-apollo.org');

  return {
    doctorId,
    doctorName,
    registeredEmail,
    specialty,
    ccEmails: Array.from(ccSet),
  };
}

/**
 * Email Integration Service (Mock SMTP / Google Workspace Relay Utility)
 * Automatically formats and dispatches an emergency clinical alert to the physician's registered email
 * whenever a patient's status is flagged as 'Emergency' or an SOS escalation is triggered.
 */
export function dispatchAutomatedEmergencyEmail(
  input: TriggerEmergencyEmailInput
): EmailDeliveryRecord {
  const {
    patient,
    hospitalCode,
    triggeredBy,
    triggerSource,
    customReason,
    overrideRecipientEmail,
    overrideRecipientName,
  } = input;

  const facility =
    HOSPITAL_FACILITIES.find((f) => f.code === hospitalCode) ||
    HOSPITAL_FACILITIES[0];
  const hospitalName = input.hospitalName || facility.name;

  const recipient = resolvePhysicianForPatient(
    patient,
    overrideRecipientEmail,
    overrideRecipientName
  );

  const ews = calculateEWS(patient.vitals);
  const fullName = `${patient.demographics.firstName} ${patient.demographics.lastName}`;
  const vitalsSummary = `BP ${patient.vitals.systolic}/${patient.vitals.diastolic} mmHg · HR ${patient.vitals.heartRate} bpm · RR ${patient.vitals.respRate}/min · SpO2 ${patient.vitals.o2Sat}% · Temp ${patient.vitals.tempF}°F (EWS: ${ews.totalScore}/15 ${ews.riskLevel})`;

  const clinicalReason =
    customReason?.trim() ||
    (triggerSource === 'STATUS_FLAGGED_EMERGENCY'
      ? `AUTO-TRIGGERED BY EMERGENCY STATUS FLAG: Patient ${fullName} (MRN #${patient.mrn}) was flagged with status "Emergency" by ${triggeredBy}. Presenting with "${patient.chiefComplaint}". Immediate bedside/remote physician evaluation required.`
      : triggerSource === 'CRITICAL_INTAKE_AUTO'
      ? `AUTO-TRIGGERED AT CRITICAL INTAKE: Patient ${fullName} registered at ${patient.triageLevel} acuity with abnormal vitals (${vitalsSummary}).`
      : `EMERGENCY SOS ESCALATION: Critical deterioration flagged by ${triggeredBy} for ${fullName}.`);

  const now = new Date();
  const timestamp = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const isoTimestamp = now.toISOString();
  const uniqueToken = `${Date.now().toString(36)}.${Math.random()
    .toString(36)
    .slice(2, 7)}`;
  const messageId = `<emg-${patient.mrn}-${uniqueToken}@smtp-relay.medvision.ai>`;
  const latencyMs = 118 + Math.floor(Math.random() * 95);

  const subject = `🚨 [MEDICO-MEDIA AUTO-ALERT · HOSP #${hospitalCode}] EMERGENCY STATUS: ${fullName} (MRN #${patient.mrn}) — Attn: ${recipient.doctorName}`;

  const links = buildEmergencyGmailUrl({
    doctorEmail: recipient.registeredEmail,
    doctorName: recipient.doctorName,
    patientName: fullName,
    patientMrn: patient.mrn,
    hospitalCode,
    hospitalName,
    severityReason: clinicalReason,
    vitalsSnapshot: vitalsSummary,
    caretakerName: triggeredBy,
  });

  const abnormalitiesList =
    patient.vitals.abnormalities.length > 0
      ? patient.vitals.abnormalities.join(', ')
      : 'Acute clinical instability flagged';

  const textBody = [
    `====================================================================`,
    `MEDICO-MEDIA — AUTOMATED EMERGENCY PHYSICIAN EMAIL DISPATCH`,
    `SMTP Relay: MedicoMedia-SMTP-Gateway v2.4 (250 2.0.0 OK)`,
    `Message-ID: ${messageId}`,
    `====================================================================`,
    `TO: ${recipient.doctorName} <${recipient.registeredEmail}>`,
    `CC: ${recipient.ccEmails.join(', ')}`,
    `HOSPITAL FACILITY: ${hospitalName} (8-Digit Code: #${hospitalCode})`,
    `TRIGGER EVENT: ${triggerSource.replace(/_/g, ' ')} (By: ${triggeredBy} at ${timestamp})`,
    ``,
    `PATIENT IDENTITY:`,
    `• Name: ${fullName} (${patient.demographics.age}y ${patient.demographics.gender}, Blood ${patient.demographics.bloodType})`,
    `• MRN: #${patient.mrn}`,
    `• Triage Acuity: ${patient.triageLevel}`,
    `• Chief Complaint: "${patient.chiefComplaint}"`,
    ``,
    `LIVE VITALS & EARLY WARNING SCORE:`,
    `• ${vitalsSummary}`,
    `• Flagged Abnormalities: ${abnormalitiesList}`,
    ``,
    `EMERGENCY CLINICAL ALERT REASON:`,
    `${clinicalReason}`,
    ``,
    `REQUIRED ACTION:`,
    `Please open the MedVision AI Doctor Dashboard (Hospital Code #${hospitalCode}) to acknowledge this Emergency alert, review diagnostic labs, or issue immediate Care Taker stabilization directives.`,
    `====================================================================`,
  ].join('\n');

  const htmlPreview = `
    <div style="font-family: 'Plus Jakarta Sans', Inter, sans-serif; background: #050A1F; color: #FFFFFF; border: 1px solid rgba(255,59,107,0.45); border-radius: 14px; overflow: hidden;">
      <div style="background: linear-gradient(90deg, #E31A1A 0%, #FF3B6B 100%); padding: 14px 18px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-size: 10px; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase; opacity: 0.9;">
            MEDVISION AI · AUTOMATED EMERGENCY PHYSICIAN DISPATCH
          </div>
          <div style="font-size: 15px; font-weight: 800; margin-top: 2px;">
            🚨 Emergency Status Flagged: ${fullName} (MRN #${patient.mrn})
          </div>
        </div>
        <span style="background: rgba(0,0,0,0.3); padding: 4px 10px; border-radius: 8px; font-family: monospace; font-size: 11px; font-weight: 700;">
          HOSP #${hospitalCode}
        </span>
      </div>
      <div style="padding: 16px 18px; font-size: 12px; line-height: 1.55; color: #E2E8F0;">
        <p style="margin: 0 0 10px 0;">
          <strong>Physician Recipient:</strong> ${recipient.doctorName} (<span style="color: #2CD9FF; font-family: monospace;">${recipient.registeredEmail}</span>)<br/>
          <strong>Trigger Source:</strong> <span style="color: #FFB547; font-family: monospace;">${triggerSource}</span> by ${triggeredBy}
        </p>
        <div style="background: #0B1437; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 12px; margin-bottom: 12px;">
          <div style="color: #2CD9FF; font-weight: 700; font-size: 11px; text-transform: uppercase; margin-bottom: 4px;">
            Live Vitals & Early Warning Score (EWS ${ews.totalScore}/15 — ${ews.riskLevel})
          </div>
          <div style="font-family: monospace; font-size: 12px; color: #FFFFFF;">
            ${vitalsSummary}
          </div>
          <div style="margin-top: 6px; font-size: 11px; color: #FF3B6B; font-weight: 700;">
            Flags: ${abnormalitiesList}
          </div>
        </div>
        <div style="background: rgba(227,26,26,0.12); border-left: 3px solid #FF3B6B; padding: 10px 12px; border-radius: 6px; margin-bottom: 10px;">
          <strong style="color: #FF3B6B;">Clinical Escalation Summary:</strong><br/>
          ${clinicalReason}
        </div>
        <div style="font-size: 11px; color: #A0AEC0; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 8px;">
          Dispatched automatically by MedVision AI Clinical SMTP Service · Message-ID: ${messageId}
        </div>
      </div>
    </div>
  `.trim();

  return {
    id: `mail-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    messageId,
    timestamp,
    isoTimestamp,
    provider: 'MedVision-SMTP-Relay v2.4 (Google-Workspace-MX)',
    smtpResponse: `250 2.0.0 OK ${uniqueToken} - gsmtp (Delivered in ${latencyMs}ms)`,
    deliveryStatus: 'DELIVERED',
    latencyMs,
    triggerSource,
    triggerActor: triggeredBy,
    hospitalCode,
    hospitalName,
    patientId: patient.id,
    patientName: fullName,
    patientMrn: patient.mrn,
    triageLevel: patient.triageLevel,
    recipientDoctorId: recipient.doctorId,
    recipientDoctorName: recipient.doctorName,
    recipientEmail: recipient.registeredEmail,
    ccEmails: recipient.ccEmails,
    subject,
    vitalsSummary,
    clinicalReason,
    textBody,
    htmlPreview,
    gmailComposeUrl: links.gmailComposeUrl,
    mailtoUrl: links.mailtoUrl,
  };
}

export const INITIAL_EMAIL_DELIVERY_LOGS: EmailDeliveryRecord[] = [
  {
    id: 'mail-init-001',
    messageId: '<emg-641-9932-m9x82k@smtp-relay.medvision.ai>',
    timestamp: '08:59:14 AM',
    isoTimestamp: '2026-10-24T08:59:14.000Z',
    provider: 'MedVision-SMTP-Relay v2.4 (Google-Workspace-MX)',
    smtpResponse: '250 2.0.0 OK m9x82k - gsmtp (Delivered in 142ms)',
    deliveryStatus: 'DELIVERED',
    latencyMs: 142,
    triggerSource: 'CARETAKER_SOS_DISPATCH',
    triggerActor: 'Caretaker Anjali Verma, RN',
    hospitalCode: '88492014',
    hospitalName: 'Apollo Metro Heart & General Hospital',
    patientId: 'pat-004',
    patientName: 'Harold Finch',
    patientMrn: '641-9932',
    triageLevel: 'Level 2 (Emergent)',
    recipientDoctorId: 'doc-01',
    recipientDoctorName: 'Dr. Sarah Chen, MD',
    recipientEmail: 'ashwinsivasamy08@gmail.com',
    ccEmails: ['rapid-response-desk@medvision-apollo.org'],
    subject:
      '🚨 [MEDVISION AUTO-ALERT · HOSP #88492014] EMERGENCY STATUS: Harold Finch (MRN #641-9932) — Attn: Dr. Sarah Chen, MD',
    vitalsSummary:
      'BP 168/98 mmHg · HR 98 bpm · RR 24/min · SpO2 91% · Temp 98.4°F (EWS: 6/15 MEDIUM)',
    clinicalReason:
      'Acute SpO2 drop to 91% on room air with severe orthopnea, +7 lbs fluid overload, and Digoxin toxicity risk (1.8 ng/mL). Immediate physician intervention required.',
    textBody: [
      `====================================================================`,
      `MEDVISION AI — AUTOMATED EMERGENCY PHYSICIAN EMAIL DISPATCH`,
      `SMTP Relay: MedVision-SMTP-Gateway v2.4 (250 2.0.0 OK)`,
      `Message-ID: <emg-641-9932-m9x82k@smtp-relay.medvision.ai>`,
      `====================================================================`,
      `TO: Dr. Sarah Chen, MD <ashwinsivasamy08@gmail.com>`,
      `CC: rapid-response-desk@medvision-apollo.org`,
      `HOSPITAL FACILITY: Apollo Metro Heart & General Hospital (8-Digit Code: #88492014)`,
      `TRIGGER EVENT: CARETAKER SOS DISPATCH (By: Caretaker Anjali Verma, RN at 08:59:14 AM)`,
      ``,
      `PATIENT IDENTITY:`,
      `• Name: Harold Finch (76y Male, Blood A-)`,
      `• MRN: #641-9932`,
      `• Triage Acuity: Level 2 (Emergent)`,
      `• Chief Complaint: "Worsening orthopnea, +7 lbs weight gain over 4 days, bilateral ankle edema"`,
      ``,
      `LIVE VITALS & EARLY WARNING SCORE:`,
      `• BP 168/98 mmHg · HR 98 bpm · RR 24/min · SpO2 91% · Temp 98.4°F (EWS: 6/15 MEDIUM)`,
      `• Flagged Abnormalities: HYPOXEMIA (SpO2 91%), TACHYPNEA (RR 24), STAGE 2 HTN (168/98)`,
      ``,
      `EMERGENCY CLINICAL ALERT REASON:`,
      `Acute SpO2 drop to 91% on room air with severe orthopnea, +7 lbs fluid overload, and Digoxin toxicity risk (1.8 ng/mL). Immediate physician intervention required.`,
      `====================================================================`,
    ].join('\n'),
    htmlPreview: `<div style="font-family: sans-serif; background: #050A1F; color: #FFFFFF; padding: 14px; border-radius: 12px; border: 1px solid #FF3B6B;"><strong>🚨 Automated Emergency Alert Dispatched to Dr. Sarah Chen, MD (ashwinsivasamy08@gmail.com)</strong><p style="margin-top:6px; font-size:12px; color:#A0AEC0;">Patient Harold Finch (MRN #641-9932) — SpO2 91%, BP 168/98 mmHg, RR 24/min. Acute decompensated HFrEF & Digoxin toxicity alert.</p></div>`,
    gmailComposeUrl:
      'https://mail.google.com/mail/?view=cm&fs=1&to=ashwinsivasamy08%40gmail.com&su=EMERGENCY+ALERT+Harold+Finch+MRN+641-9932',
    mailtoUrl: 'mailto:ashwinsivasamy08@gmail.com',
  },
];
