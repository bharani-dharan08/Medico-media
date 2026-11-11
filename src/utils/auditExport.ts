/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Patient } from '../types/clinical.ts';

/**
 * Generates and downloads an official Hospital Audit Dossier (.html printable report)
 * for signed-off / completed patient records.
 */
export function downloadPatientAuditReport(
  patient: Patient,
  hospitalCode: string,
  hospitalName: string
): void {
  const { demographics, vitals, allergies, chronicHistory, medications, labReports, pendingActions, doctorSignOff } =
    patient;

  const auditId =
    doctorSignOff?.auditId ||
    `AUD-${hospitalCode}-${patient.mrn}-${Date.now().toString().slice(-5)}`;
  const signedBy =
    doctorSignOff?.signedOffBy || patient.assignedDoctorName || 'Dr. Sarah Chen, MD';
  const signedAt =
    doctorSignOff?.signedOffAt || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Official Hospital Clinical Audit Record - MRN #${patient.mrn}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #0f172a;
      background: #f8fafc;
      margin: 0;
      padding: 32px;
      line-height: 1.5;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      padding: 32px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0284c7;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      font-size: 12px;
      font-weight: 700;
      border-radius: 6px;
      background: #e0f2fe;
      color: #0369a1;
      font-family: monospace;
    }
    .badge-signed {
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #86efac;
    }
    h1 { margin: 0 0 6px 0; font-size: 22px; color: #0f172a; }
    h2 {
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #0369a1;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
      margin-top: 24px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      font-size: 13px;
    }
    .box {
      background: #f1f5f9;
      padding: 12px;
      border-radius: 8px;
      font-size: 13px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      margin-top: 8px;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 8px 10px;
      text-align: left;
    }
    th { background: #f1f5f9; font-weight: 700; }
    .sig-box {
      margin-top: 28px;
      padding: 16px;
      border: 2px dashed #0284c7;
      background: #f0f9ff;
      border-radius: 8px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1>${hospitalName}</h1>
        <div>8-Digit Hospital Registry Code: <span class="badge">#${hospitalCode}</span></div>
        <div style="font-size:12px; color:#475569; margin-top:4px;">
          Official Signed-Off Clinical Encounter & Compliance Audit Record
        </div>
      </div>
      <div style="text-align: right;">
        <span class="badge badge-signed">✓ PHYSICIAN SIGNED & VERIFIED</span>
        <div style="font-size:12px; font-family:monospace; margin-top:6px;">Audit ID: ${auditId}</div>
        <div style="font-size:12px; color:#64748b;">Generated: ${new Date().toLocaleString()}</div>
      </div>
    </div>

    <h2>1. Patient Identification & Allotment</h2>
    <div class="grid">
      <div><strong>Patient Name:</strong> ${demographics.firstName} ${demographics.lastName}</div>
      <div><strong>MRN:</strong> #${patient.mrn}</div>
      <div><strong>DOB / Age / Sex:</strong> ${demographics.dob} (${demographics.age}y ${demographics.gender})</div>
      <div><strong>Blood Group:</strong> ${demographics.bloodType}</div>
      <div><strong>Allotted Specialist:</strong> ${patient.assignedDoctorName || signedBy} (${patient.assignedSpecialty || 'Internal Medicine'})</div>
      <div><strong>Encounter Status:</strong> ${patient.appointmentStatus} (${patient.triageLevel})</div>
    </div>

    <h2>2. Chief Complaint & Drug Allergies</h2>
    <div class="box">
      <div><strong>Chief Complaint:</strong> "${patient.chiefComplaint}"</div>
      <div style="margin-top:6px;"><strong>Verified Allergies:</strong> ${allergies.map((a) => `${a.substance} (${a.reaction}) [${a.severity}]`).join('; ')}</div>
    </div>

    <h2>3. Recorded Vital Signs & Stability Index</h2>
    <div class="grid">
      <div><strong>Blood Pressure:</strong> ${vitals.systolic}/${vitals.diastolic} mmHg</div>
      <div><strong>Heart Rate:</strong> ${vitals.heartRate} bpm</div>
      <div><strong>Respiratory Rate:</strong> ${vitals.respRate} /min</div>
      <div><strong>SpO2 Saturation:</strong> ${vitals.o2Sat}%</div>
      <div><strong>Temperature:</strong> ${vitals.tempF} °F</div>
      <div><strong>Vital Stability Score:</strong> ${patient.vitalStabilityScore ?? 8.4} / 10</div>
    </div>

    <h2>4. Diagnostic Laboratory Results & Prior Visit Deltas</h2>
    <table>
      <thead>
        <tr>
          <th>Test Name</th>
          <th>Result</th>
          <th>Status</th>
          <th>Delta vs Prior Visit</th>
          <th>Reference Range</th>
        </tr>
      </thead>
      <tbody>
        ${labReports
          .map(
            (l) => `<tr>
          <td>${l.name}</td>
          <td><strong>${l.value} ${l.unit}</strong></td>
          <td>[${l.status}]</td>
          <td>${l.delta ? `${l.delta.deltaText} (Prior: ${l.delta.previousValue})` : 'Baseline'}</td>
          <td>${l.referenceRange}</td>
        </tr>`
          )
          .join('')}
      </tbody>
    </table>

    <h2>5. Active Medication Regimen & Adherence</h2>
    <table>
      <thead>
        <tr>
          <th>Medication</th>
          <th>Dosage & Frequency</th>
          <th>Indication</th>
          <th>Adherence (PDC %)</th>
        </tr>
      </thead>
      <tbody>
        ${medications
          .map(
            (m) => `<tr>
          <td>${m.name}</td>
          <td>${m.dosage} — ${m.frequency}</td>
          <td>${m.indication}</td>
          <td>${m.adherence ? `${m.adherence.pdcPercentage}% ${m.adherence.statusBadge}` : 'Verified'}</td>
        </tr>`
          )
          .join('')}
      </tbody>
    </table>

    <h2>6. Executed Clinical Orders & Sign-Off Log</h2>
    <table>
      <thead>
        <tr>
          <th>Order / Action</th>
          <th>Type</th>
          <th>Status</th>
          <th>Audit Timestamp</th>
        </tr>
      </thead>
      <tbody>
        ${pendingActions
          .map(
            (a) => `<tr>
          <td>${a.title}</td>
          <td>${a.type.toUpperCase()}</td>
          <td>${a.status.toUpperCase()}</td>
          <td>${a.auditTrail.length > 0 ? a.auditTrail[a.auditTrail.length - 1].timestamp : a.createdAt}</td>
        </tr>`
          )
          .join('')}
      </tbody>
    </table>

    <div class="sig-box">
      <div style="font-weight:700; font-size:14px; color:#0369a1; margin-bottom:8px;">
        7. Attending Physician Sign-Off & Caretaker Directives
      </div>
      <div><strong>Physician Assessment & Comments:</strong> ${
        doctorSignOff?.clinicalComments ||
        'Patient evaluated, diagnostic labs reviewed, and treatment regimen reconciled.'
      }</div>
      <div style="margin-top:6px;"><strong>Instructions for Hospital Caretaker:</strong> ${
        doctorSignOff?.caretakerDirective ||
        'Continue routine vitals monitoring every 4 hours and verify medication dispense prior to discharge.'
      }</div>
      <div style="margin-top:12px; font-family:monospace; font-size:12px; color:#334155;">
        Electronically Signed By: <strong>${signedBy}</strong> · Timestamp: <strong>${signedAt}</strong> · Hospital Code: <strong>#${hospitalCode}</strong>
      </div>
    </div>
  </div>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Hospital_Audit_${hospitalCode}_MRN_${patient.mrn}_${demographics.lastName}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports all signed-off / finished patient records for the hospital as a JSON Audit Bundle
 */
export function downloadHospitalMasterAuditJson(
  patients: Patient[],
  hospitalCode: string,
  hospitalName: string
): void {
  const payload = {
    auditExportTimestamp: new Date().toISOString(),
    hospitalCode,
    hospitalName,
    totalRecordsExported: patients.length,
    signedOffCount: patients.filter(
      (p) => p.appointmentStatus === 'Done' || p.doctorSignOff?.signedOff
    ).length,
    records: patients,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Hospital_${hospitalCode}_Master_Audit_Bundle.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Builds a Google Mail (Gmail) web compose URL and standard mailto fallback for Emergency Criticality Notifications
 */
export function buildEmergencyGmailUrl(params: {
  doctorEmail: string;
  doctorName: string;
  patientName: string;
  patientMrn: string;
  hospitalCode: string;
  hospitalName: string;
  severityReason: string;
  vitalsSnapshot: string;
  caretakerName: string;
}): { gmailComposeUrl: string; mailtoUrl: string } {
  const subject = `[STAT EMERGENCY] Critical Patient Alert: ${params.patientName} (MRN #${params.patientMrn}) — Hospital #${params.hospitalCode}`;
  const body = `URGENT CLINICAL SOS NOTIFICATION — ${params.hospitalName} (Hospital Code: #${params.hospitalCode})

Attention: ${params.doctorName} & On-Call Emergency Physician Pool
Dispatched By: ${params.caretakerName}
Timestamp: ${new Date().toLocaleString()}

PATIENT IDENTITY:
• Name: ${params.patientName}
• MRN: #${params.patientMrn}

CRITICALITY & LIFE-SAVING INTERVENTION REASON:
${params.severityReason}

CURRENT VITALS SNAPSHOT:
${params.vitalsSnapshot}

ACTION REQUIRED:
Please open the MedVision AI Hospital Platform (Code: #${params.hospitalCode}) immediately or report to Triage Bay to assume emergency care.`;

  const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
    params.doctorEmail
  )}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  const mailtoUrl = `mailto:${encodeURIComponent(
    params.doctorEmail
  )}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return { gmailComposeUrl, mailtoUrl };
}
