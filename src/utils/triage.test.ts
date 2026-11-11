/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_PATIENTS } from '../data/mockPatients.ts';
import { getPatientAvatarConfig } from './avatarHash.ts';
import {
  computeClinicalPriorities,
  evaluateVital,
  filterLabReports,
  filterPatients,
  executePendingAction,
  addNewPendingAction,
  addClinicalNote,
  updatePatientAppointmentStatus,
  assessVitalsStability,
  calculateEWS,
  calculateEWSTrend,
  categorizeAdherence,
  calculateRegimenAdherenceSummary,
} from './triage.ts';

test('getPatientAvatarConfig generates consistent deterministic colors and initials', () => {
  const avatar1 = getPatientAvatarConfig('pat-001', 'Rajeshwari', 'Iyer');
  const avatar2 = getPatientAvatarConfig('pat-001', 'Rajeshwari', 'Iyer');
  assert.equal(avatar1.initials, 'RI');
  assert.equal(avatar1.gradientClass, avatar2.gradientClass);
  assert.equal(avatar1.glowColor, avatar2.glowColor);
});

test('categorizeAdherence accurately identifies under-utilization, optimal, and over-utilization', () => {
  const under = categorizeAdherence(62);
  assert.equal(under.status, 'UNDER_UTILIZATION');
  assert.equal(under.isFlagged, true);
  assert.equal(under.statusBadge, '[UNDER-UTILIZATION]');

  const optimal = categorizeAdherence(95);
  assert.equal(optimal.status, 'OPTIMAL');
  assert.equal(optimal.isFlagged, false);
  assert.equal(optimal.statusBadge, '[OPTIMAL ADHERENCE]');

  const over = categorizeAdherence(128);
  assert.equal(over.status, 'OVER_UTILIZATION');
  assert.equal(over.isFlagged, true);
  assert.equal(over.statusBadge, '[OVER-UTILIZATION]');
});

test('calculateRegimenAdherenceSummary computes overall statistics across medications', () => {
  const testMeds: any[] = [
    { id: 'm1', name: 'Drug A', adherence: { pdcPercentage: 90 } },
    { id: 'm2', name: 'Drug B', adherence: { pdcPercentage: 55 } }, // under
    { id: 'm3', name: 'Drug C', adherence: { pdcPercentage: 125 } }, // over
  ];
  const summary = calculateRegimenAdherenceSummary(testMeds);
  assert.equal(summary.underutilizedCount, 1);
  assert.equal(summary.overutilizedCount, 1);
  assert.equal(summary.optimalCount, 1);
  assert.equal(summary.overallPdc, 90);
  assert.equal(summary.statusBadge, '[MIXED ADHERENCE RISKS]');
});

test('calculateEWS accurately scores normal vitals as 0 (Low Risk)', () => {
  const normal = calculateEWS({
    systolic: 120,
    heartRate: 72,
    respRate: 16,
    o2Sat: 98,
    tempF: 98.6,
  });
  assert.equal(normal.totalScore, 0);
  assert.equal(normal.riskLevel, 'LOW');
  assert.equal(normal.badgeText, '[LOW RISK]');
});

test('calculateEWS accurately detects elevated clinical risk for Harold Finch (HFrEF)', () => {
  const patient = INITIAL_PATIENTS[3]; // Harold Finch: RR 24, SpO2 91%, HR 98, SBP 168
  const ews = calculateEWS(patient.vitals);
  assert.ok(ews.totalScore >= 5);
  assert.equal(ews.riskLevel, 'MEDIUM');
});

test('calculateEWSTrend calculates delta against previous visit for Harold Finch', () => {
  const patient = INITIAL_PATIENTS[3];
  const trend = calculateEWSTrend(patient.vitalTrends, patient.vitals);
  assert.ok(trend.currentResult.totalScore >= 5);
  assert.equal(trend.trendDirection, 'worsening');
});

test('assessVitalsStability detects febrile spike for Sarah Jenkins', () => {
  const patient = INITIAL_PATIENTS[2]; // Sarah Jenkins
  const assessment = assessVitalsStability(patient.vitalTrends);
  assert.equal(assessment.stability, 'ACUTE_EXCURSION');
  assert.equal(assessment.deltaHeartRate, 32); // 104 - 72
});

test('computeClinicalPriorities catches severe hyperglycemia for Marcus Chen', () => {
  const patient = INITIAL_PATIENTS[1]; // Marcus Chen
  const priorities = computeClinicalPriorities(patient);
  assert.equal(priorities.length, 3);
  assert.ok(priorities[0].headline.includes('Hyperglycemia'));
  assert.ok(priorities[0].sourceData.includes('342'));
});

test('evaluateVital accurately classifies blood pressure and heart rate thresholds', () => {
  const htnCrisis = evaluateVital('bp', 184, 102);
  assert.equal(htnCrisis.status, 'CRITICAL');
  assert.equal(htnCrisis.badgeText, '[CRITICAL HTN]');
  assert.equal(htnCrisis.isAbnormal, true);

  const normalBp = evaluateVital('bp', 118, 76);
  assert.equal(normalBp.status, 'NORMAL');
  assert.equal(normalBp.badgeText, '[NORMAL]');
  assert.equal(normalBp.isAbnormal, false);

  const tachy = evaluateVital('hr', 108);
  assert.equal(tachy.status, 'WARNING');
  assert.equal(tachy.badgeText, '[TACHYCARDIA]');
  assert.equal(tachy.isAbnormal, true);

  const hypoxia = evaluateVital('spo2', 88);
  assert.equal(hypoxia.status, 'CRITICAL');
  assert.equal(hypoxia.badgeText, '[CRITICAL HYPOXIA]');
});

test('filterLabReports filters by category and abnormal flag correctly', () => {
  const labs = INITIAL_PATIENTS[0].labReports; // Rajeshwari Iyer: 3 abnormal (HbA1c, FBG, LDL), 2 normal (Creatinine, ECG)

  const abnormalOnly = filterLabReports(labs, 'All', true);
  assert.equal(abnormalOnly.length, 3);
  assert.ok(!abnormalOnly.some((l) => l.status === 'NORMAL'));

  const imaging = filterLabReports(labs, 'Imaging', false);
  assert.equal(imaging.length, 1);
  assert.equal(imaging[0].name, '12-Lead Diagnostic Electrocardiogram');
});

test('filterPatients filters by status, search term, and urgent flags', () => {
  const waitingPatients = filterPatients(INITIAL_PATIENTS, 'Waiting', '');
  assert.equal(waitingPatients.length, 3);

  const searched = filterPatients(INITIAL_PATIENTS, 'All', 'Marcus');
  assert.equal(searched.length, 1);
  assert.equal(searched[0].demographics.firstName, 'Marcus');

  const mrnSearch = filterPatients(INITIAL_PATIENTS, 'All', '88492');
  assert.equal(mrnSearch.length, 1);
  assert.equal(mrnSearch[0].id, 'pat-001');
});

test('executePendingAction updates status to completed and appends audit log entry', () => {
  const patientId = 'pat-001';
  const actionId = 'act-02'; // critical_lab action
  const updated = executePendingAction(
    INITIAL_PATIENTS,
    patientId,
    actionId,
    'Dr. Sarah Chen, MD'
  );
  const targetPatient = updated.find((p) => p.id === patientId)!;
  const targetAction = targetPatient.pendingActions.find((a) => a.id === actionId)!;

  assert.equal(targetAction.status, 'completed');
  assert.ok(targetAction.auditTrail.length >= 1);
  const lastLog = targetAction.auditTrail[targetAction.auditTrail.length - 1];
  assert.equal(lastLog.actor, 'Dr. Sarah Chen, MD');
  assert.ok(lastLog.action.includes('Acknowledged Critical Result'));
});

test('addNewPendingAction and addClinicalNote append records cleanly', () => {
  const patientId = 'pat-002';
  const withAction = addNewPendingAction(INITIAL_PATIENTS, patientId, {
    title: 'Order Stat Potassium Recheck',
    type: 'critical_lab',
    description: 'Recheck K+ in 2 hours',
    urgency: 'urgent',
  });
  const targetPatient = withAction.find((p) => p.id === patientId)!;
  assert.equal(targetPatient.pendingActions[0].title, 'Order Stat Potassium Recheck');

  const withNote = addClinicalNote(withAction, patientId, {
    type: 'Rapid Note',
    content: 'Discussed diabetes management and sliding scale insulin with patient.',
  });
  const notePatient = withNote.find((p) => p.id === patientId)!;
  assert.equal(
    notePatient.clinicalNotes[0].content,
    'Discussed diabetes management and sliding scale insulin with patient.'
  );

  const updatedStatus = updatePatientAppointmentStatus(withNote, patientId, 'Done');
  const donePatient = updatedStatus.find((p) => p.id === patientId)!;
  assert.equal(donePatient.appointmentStatus, 'Done');

  const emergencyStatus = updatePatientAppointmentStatus(withNote, patientId, 'Emergency');
  const emgPatient = emergencyStatus.find((p) => p.id === patientId)!;
  assert.equal(emgPatient.appointmentStatus, 'Emergency');
});

test('Email Integration Service resolves physician email and dispatches automated alert when Emergency is flagged', async () => {
  const {
    resolvePhysicianForPatient,
    dispatchAutomatedEmergencyEmail,
  } = await import('../services/emailNotificationService.ts');

  const patient = INITIAL_PATIENTS[0]; // Rajeshwari Iyer -> doc-01 (Dr. Sarah Chen, MD, ashwinsivasamy08@gmail.com)
  const resolved = resolvePhysicianForPatient(patient);
  assert.equal(resolved.registeredEmail, 'ashwinsivasamy08@gmail.com');
  assert.ok(resolved.doctorName.includes('Sarah Chen'));

  const deliveryRecord = dispatchAutomatedEmergencyEmail({
    patient: { ...patient, appointmentStatus: 'Emergency' },
    hospitalCode: '88492014',
    hospitalName: 'Apollo Metro Heart & General Hospital',
    triggeredBy: 'Caretaker Anjali Verma, RN',
    triggerSource: 'STATUS_FLAGGED_EMERGENCY',
  });

  assert.equal(deliveryRecord.deliveryStatus, 'DELIVERED');
  assert.equal(deliveryRecord.recipientEmail, 'ashwinsivasamy08@gmail.com');
  assert.equal(deliveryRecord.triggerSource, 'STATUS_FLAGGED_EMERGENCY');
  assert.ok(deliveryRecord.smtpResponse.includes('250 2.0.0 OK'));
  assert.ok(deliveryRecord.subject.includes('Rajeshwari Iyer'));
  assert.ok(deliveryRecord.textBody.includes(patient.mrn));
});

