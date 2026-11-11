/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  UserPlus,
  Siren,
  CheckCircle2,
  Mail,
  ExternalLink,
  ClipboardList,
  Send,
  Download,
} from 'lucide-react';
import {
  Patient,
  AppointmentStatus,
  TriageUrgency,
  EmergencyNotification,
  UserSession,
} from '../types/clinical.ts';
import { HOSPITAL_SPECIALISTS } from '../data/hospitalRegistry.ts';
import { getPatientAvatarConfig } from '../utils/avatarHash.ts';
import { buildEmergencyGmailUrl } from '../utils/auditExport.ts';
import { CaretakerRoleCharts } from './CaretakerRoleCharts.tsx';

interface CaretakerWorkspaceProps {
  patients: Patient[];
  session: UserSession;
  emergencyAlerts: EmergencyNotification[];
  onAddPatientRecord: (newPatient: Patient) => void;
  onUpdateStatus: (patientId: string, status: AppointmentStatus) => void;
  onAllotSpecialist: (
    patientId: string,
    doctorId: string,
    doctorName: string,
    specialty: string
  ) => void;
  onTriggerEmergencyAlert: (alert: EmergencyNotification) => void;
  onDownloadAudit: (patient: Patient) => void;
  onSelectPatientForDoctorView: (patientId: string) => void;
}

export const CaretakerWorkspace: React.FC<CaretakerWorkspaceProps> = ({
  patients,
  session,
  emergencyAlerts,
  onAddPatientRecord,
  onUpdateStatus,
  onAllotSpecialist,
  onTriggerEmergencyAlert,
  onDownloadAudit,
  onSelectPatientForDoctorView,
}) => {
  // New Patient Entry Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('46');
  const [gender, setGender] = useState<'Female' | 'Male' | 'Other'>('Male');
  const [bloodType, setBloodType] = useState('O+');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [triageLevel, setTriageLevel] = useState<TriageUrgency>('Level 2 (Emergent)');
  const [systolic, setSystolic] = useState('164');
  const [diastolic, setDiastolic] = useState('98');
  const [heartRate, setHeartRate] = useState('112');
  const [o2Sat, setO2Sat] = useState('92');
  const [tempF, setTempF] = useState('99.4');
  const [allergySubstance, setAllergySubstance] = useState('Penicillin');
  const [selectedDocId, setSelectedDocId] = useState('doc-01');
  const [intakeSuccessMsg, setIntakeSuccessMsg] = useState('');

  // Emergency Modal State
  const [emergencyTargetPatient, setEmergencyTargetPatient] = useState<Patient | null>(
    null
  );
  const [targetDoctorEmail, setTargetDoctorEmail] = useState('ashwinsivasamy08@gmail.com');
  const [targetDoctorName, setTargetDoctorName] = useState(
    'Dr. Sarah Chen, MD & On-Call Emergency Physician Pool'
  );
  const [emergencyReason, setEmergencyReason] = useState('');
  const [lastDispatchedGmailLinks, setLastDispatchedGmailLinks] = useState<{
    gmailComposeUrl: string;
    mailtoUrl: string;
    patientName: string;
    email: string;
  } | null>(null);

  const handleCreatePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !chiefComplaint.trim()) return;

    const doc =
      HOSPITAL_SPECIALISTS.find((d) => d.id === selectedDocId) || HOSPITAL_SPECIALISTS[0];
    const mrn = `${Math.floor(100 + Math.random() * 899)}-${Math.floor(
      1000 + Math.random() * 8999
    )}`;
    const sysNum = parseInt(systolic, 10) || 120;
    const diaNum = parseInt(diastolic, 10) || 80;
    const hrNum = parseInt(heartRate, 10) || 80;
    const spo2Num = parseInt(o2Sat, 10) || 98;
    const tempNum = parseFloat(tempF) || 98.6;

    const abnormalities: string[] = [];
    if (sysNum >= 140 || diaNum >= 90)
      abnormalities.push(`HYPERTENSION (${sysNum}/${diaNum})`);
    if (hrNum > 100) abnormalities.push(`TACHYCARDIA (${hrNum} bpm)`);
    if (spo2Num < 94) abnormalities.push(`HYPOXEMIA (SpO2 ${spo2Num}%)`);
    if (tempNum >= 100.4) abnormalities.push(`FEVER (${tempNum}°F)`);

    const nowTime = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const newPat: Patient = {
      id: `pat-${Date.now()}`,
      mrn,
      hospitalCode: session.hospitalCode,
      assignedDoctorId: doc.id,
      assignedDoctorName: doc.name,
      assignedSpecialty: doc.specialty,
      demographics: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dob: `${2026 - (parseInt(age, 10) || 45)}-05-14`,
        age: parseInt(age, 10) || 45,
        gender,
        bloodType,
        phone: '(555) 901-4420',
        emergencyContact: {
          name: `${lastName.trim()} Family Contact`,
          relationship: 'Spouse',
          phone: '(555) 901-4421',
        },
        preferredLanguage: 'English',
        insuranceProvider: 'Hospital Network Priority Care',
        pcp: doc.name,
      },
      appointmentStatus: 'Waiting',
      timeSlot: nowTime,
      chiefComplaint: chiefComplaint.trim(),
      triageLevel,
      allergies: allergySubstance.trim()
        ? [
            {
              id: `alg-${Date.now()}`,
              substance: allergySubstance.trim(),
              reaction: 'Documented hypersensitivity at intake',
              severity: 'HIGH',
              category: 'Drug',
              verifiedDate: '2026-10-24',
            },
          ]
        : [],
      vitals: {
        systolic: sysNum,
        diastolic: diaNum,
        heartRate: hrNum,
        respRate: 20,
        o2Sat: spo2Num,
        tempF: tempNum,
        bmi: 26.4,
        recordedAt: nowTime,
        recordedBy: session.userName,
        abnormalities,
      },
      vitalStabilityScore: spo2Num < 94 || sysNum > 165 ? 5.2 : 8.1,
      quickMetrics: {
        medAdherencePercent: 90,
        labCompletionPercent: 85,
        followUpRisk: spo2Num < 94 ? 'High' : 'Moderate',
        pendingSignOffs: 1,
      },
      vitalTrends: [
        {
          visitDate: 'Prior Baseline',
          systolic: 126,
          diastolic: 80,
          heartRate: 76,
          respRate: 16,
          o2Sat: 98,
          tempF: 98.6,
          encounterType: 'Baseline Record',
        },
        {
          visitDate: 'Today Intake',
          systolic: sysNum,
          diastolic: diaNum,
          heartRate: hrNum,
          respRate: 20,
          o2Sat: spo2Num,
          tempF: tempNum,
          encounterType: 'Caretaker Intake',
        },
      ],
      chronicHistory: [
        {
          id: `cond-${Date.now()}`,
          code: 'R69',
          name: `Acute Intake Presentation (${doc.specialty.split(' ')[0]})`,
          status: 'Active',
          onsetDate: '2026-10-24',
        },
      ],
      medications: [],
      labReports: [
        {
          id: `lab-${Date.now()}`,
          name: 'Point-of-Care Triage Panel (Lactate & Glucose)',
          category: 'Bloodwork',
          value: 194,
          unit: 'mg/dL',
          referenceMin: 70,
          referenceMax: 99,
          referenceRange: '70 - 99 mg/dL',
          status: 'HIGH',
          collectedAt: nowTime,
          specimen: 'Capillary Whole Blood',
          orderingMD: doc.name,
          findingsNarrative: `Collected at Caretaker intake by ${session.userName}. Allotted to ${doc.name}.`,
          acknowledged: false,
          delta: {
            previousValue: 110,
            previousDate: 'Baseline',
            numericDelta: 84,
            direction: 'up',
            isSignificant: true,
            severity: 'WARNING',
            deltaText: '+84 mg/dL vs Baseline',
          },
        },
      ],
      organAcuityHistory: [
        {
          organ: 'Cardio',
          label: 'Cardiovascular',
          periods: [
            { period: '6M Ago', severity: 'Normal', testSummary: 'Normal', labValue: '124/78' },
            { period: '3M Ago', severity: 'Normal', testSummary: 'Normal', labValue: '126/80' },
            { period: '1M Ago', severity: 'Mild', testSummary: 'Mild drift', labValue: '132/84' },
            { period: 'Last Wk', severity: 'Moderate', testSummary: 'Elevated', labValue: '142/88' },
            {
              period: 'Today',
              severity: sysNum >= 160 ? 'Critical' : 'Moderate',
              testSummary: `Intake BP ${sysNum}/${diaNum}, HR ${hrNum}`,
              labValue: `${sysNum}/${diaNum}`,
            },
          ],
        },
        {
          organ: 'Metabolic',
          label: 'Metabolic',
          periods: [
            { period: '6M Ago', severity: 'Normal', testSummary: 'Normal', labValue: '96' },
            { period: '3M Ago', severity: 'Normal', testSummary: 'Normal', labValue: '102' },
            { period: '1M Ago', severity: 'Mild', testSummary: 'Borderline', labValue: '128' },
            { period: 'Last Wk', severity: 'Moderate', testSummary: 'Elevated', labValue: '154' },
            { period: 'Today', severity: 'Moderate', testSummary: 'POC Glucose 194 mg/dL', labValue: '194' },
          ],
        },
        {
          organ: 'Renal',
          label: 'Renal',
          periods: [
            { period: '6M Ago', severity: 'Normal', testSummary: 'Normal', labValue: '0.9' },
            { period: '3M Ago', severity: 'Normal', testSummary: 'Normal', labValue: '0.9' },
            { period: '1M Ago', severity: 'Normal', testSummary: 'Normal', labValue: '1.0' },
            { period: 'Last Wk', severity: 'Normal', testSummary: 'Normal', labValue: '1.0' },
            { period: 'Today', severity: 'Normal', testSummary: 'Cr 1.02 mg/dL', labValue: '1.02' },
          ],
        },
        {
          organ: 'Hepatic',
          label: 'Hepatic',
          periods: [
            { period: '6M Ago', severity: 'Normal', testSummary: 'Normal', labValue: 'ALT 22' },
            { period: '3M Ago', severity: 'Normal', testSummary: 'Normal', labValue: 'ALT 22' },
            { period: '1M Ago', severity: 'Normal', testSummary: 'Normal', labValue: 'ALT 23' },
            { period: 'Last Wk', severity: 'Normal', testSummary: 'Normal', labValue: 'ALT 24' },
            { period: 'Today', severity: 'Normal', testSummary: 'ALT 24 U/L', labValue: 'ALT 24' },
          ],
        },
        {
          organ: 'Resp',
          label: 'Respiratory',
          periods: [
            { period: '6M Ago', severity: 'Normal', testSummary: 'Normal', labValue: '99%' },
            { period: '3M Ago', severity: 'Normal', testSummary: 'Normal', labValue: '98%' },
            { period: '1M Ago', severity: 'Normal', testSummary: 'Normal', labValue: '98%' },
            { period: 'Last Wk', severity: 'Normal', testSummary: 'Normal', labValue: '97%' },
            {
              period: 'Today',
              severity: spo2Num < 94 ? 'Critical' : 'Normal',
              testSummary: `SpO2 ${spo2Num}%`,
              labValue: `${spo2Num}%`,
            },
          ],
        },
      ],
      pendingActions: [
        {
          id: `act-${Date.now()}`,
          title: `Initial Specialist Evaluation (${doc.specialty.split(' ')[0]})`,
          type: 'critical_lab',
          description: `New intake patient allotted by ${session.userName} to ${doc.name}.`,
          urgency: 'urgent',
          status: 'pending',
          createdAt: nowTime,
          auditTrail: [],
        },
      ],
      clinicalNotes: [
        {
          id: `note-${Date.now()}`,
          timestamp: nowTime,
          author: session.userName,
          type: 'Triage Handoff',
          content: `Patient registered by Care Taker (${session.userName}) under Hospital #${session.hospitalCode}. Allotted to ${doc.name} (${doc.specialty}). Chief complaint: ${chiefComplaint.trim()}.`,
          tags: ['Caretaker Intake', doc.specialty.split(' ')[0]],
        },
      ],
    };

    onAddPatientRecord(newPat);
    setFirstName('');
    setLastName('');
    setChiefComplaint('');
    setIntakeSuccessMsg(
      `✓ Registered ${newPat.demographics.firstName} ${newPat.demographics.lastName} (MRN #${newPat.mrn}) and allotted to ${doc.name}!`
    );
    setTimeout(() => setIntakeSuccessMsg(''), 5000);
  };

  const openEmergencyModalForPatient = (pat: Patient) => {
    setEmergencyTargetPatient(pat);
    const assignedDoc = HOSPITAL_SPECIALISTS.find((d) => d.id === pat.assignedDoctorId);
    setTargetDoctorEmail(assignedDoc?.email || 'ashwinsivasamy08@gmail.com');
    setTargetDoctorName(
      `${pat.assignedDoctorName || 'Dr. Sarah Chen, MD'} & On-Call Physician Pool`
    );
    setEmergencyReason(
      `CRITICAL DETERIORATION: ${pat.demographics.firstName} ${pat.demographics.lastName} (MRN #${pat.mrn}) presenting with "${pat.chiefComplaint}". Vitals: BP ${pat.vitals.systolic}/${pat.vitals.diastolic} mmHg, HR ${pat.vitals.heartRate} bpm, SpO2 ${pat.vitals.o2Sat}%. Allotted doctor unavailable at bedside — immediate life-saving physician takeover required!`
    );
  };

  const handleDispatchEmergency = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emergencyTargetPatient) return;

    const nowTime = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    const vitalsStr = `BP ${emergencyTargetPatient.vitals.systolic}/${emergencyTargetPatient.vitals.diastolic} mmHg · HR ${emergencyTargetPatient.vitals.heartRate} bpm · SpO2 ${emergencyTargetPatient.vitals.o2Sat}%`;

    const newAlert: EmergencyNotification = {
      id: `emg-${Date.now()}`,
      patientId: emergencyTargetPatient.id,
      patientName: `${emergencyTargetPatient.demographics.firstName} ${emergencyTargetPatient.demographics.lastName}`,
      patientMrn: emergencyTargetPatient.mrn,
      hospitalCode: session.hospitalCode,
      triggeredByCaretaker: session.userName,
      triggeredAt: nowTime,
      targetDoctorName,
      targetDoctorEmail,
      severityReason: emergencyReason,
      vitalsSnapshot: vitalsStr,
      emailSentStatus: 'Dispatched to Google Email',
    };

    onTriggerEmergencyAlert(newAlert);

    const links = buildEmergencyGmailUrl({
      doctorEmail: targetDoctorEmail,
      doctorName: targetDoctorName,
      patientName: newAlert.patientName,
      patientMrn: newAlert.patientMrn,
      hospitalCode: session.hospitalCode,
      hospitalName: session.hospitalName,
      severityReason: emergencyReason,
      vitalsSnapshot: vitalsStr,
      caretakerName: session.userName,
    });

    setLastDispatchedGmailLinks({
      ...links,
      patientName: newAlert.patientName,
      email: targetDoctorEmail,
    });
    setEmergencyTargetPatient(null);
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Care Taker Role Header Banner */}
      <div className="vision-card p-5 border-l-4 border-l-emerald-600 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-mono font-extrabold">
              CARE TAKER INTAKE & TRIAGE COMMAND · HOSPITAL #{session.hospitalCode}
            </span>
            <span className="text-xs text-slate-600 font-mono">
              Logged in as: <strong className="text-slate-900">{session.userName}</strong>
            </span>
          </div>
          <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
            Patient Record Entry, Specialist Allotment & Emergency Doctor Dispatch
          </h1>
          <p className="text-xs text-slate-600">
            Enter new patient records, update encounter statuses, allot patients to specialist doctors, verify physician sign-off directives, and trigger emergency Google Email + In-App SOS alerts.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => openEmergencyModalForPatient(patients[0])}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold shadow-xs transition-all cursor-pointer whitespace-nowrap"
          >
            <Siren className="w-4 h-4" />
            <span>Trigger Emergency Doctor Alert (App + Gmail)</span>
          </button>
        </div>
      </div>

      {/* Confirmation Banner when Emergency Gmail Dispatch is triggered */}
      {lastDispatchedGmailLinks && (
        <div className="rounded-xl p-4 bg-emerald-50 border border-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span className="text-xs font-extrabold text-slate-900">
                Emergency SOS Alert Dispatched In-App & Queued for Google Email ({lastDispatchedGmailLinks.email})
              </span>
            </div>
            <p className="text-xs text-slate-700">
              Critical alert for <strong className="text-slate-900">{lastDispatchedGmailLinks.patientName}</strong> is now active on the Doctor Dashboard. You can also launch the pre-filled Google Mail message directly:
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={lastDispatchedGmailLinks.gmailComposeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-lg bg-[#0B1221] hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 whitespace-nowrap"
            >
              <Mail className="w-3.5 h-3.5 text-teal-400" />
              <span>Open in Google Mail (Gmail)</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href={lastDispatchedGmailLinks.mailtoUrl}
              className="px-3 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold whitespace-nowrap"
            >
              Default Mail App
            </a>
          </div>
        </div>
      )}

      {/* Care Taker Role Analytics Charts (Hourly Intake Velocity, Specialist Allotment & Queue Donut) */}
      <CaretakerRoleCharts
        patients={patients}
        emergencyAlerts={emergencyAlerts}
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Left Column (4 cols): Enter New Patient Record & Specialist Allotment Form */}
        <div className="xl:col-span-4 vision-card p-5 space-y-4 h-fit">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Enter New Patient Record & Allot Specialist
              </h2>
            </div>
            <span className="text-[10px] font-mono text-teal-700 font-bold">#{session.hospitalCode}</span>
          </div>

          {intakeSuccessMsg && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold">
              {intakeSuccessMsg}
            </div>
          )}

          <form onSubmit={handleCreatePatient} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] text-slate-700 font-bold block mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Karthik"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-[#0D9488] focus:bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-700 font-bold block mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Subramanian"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-[#0D9488] focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-slate-700 font-bold block mb-1">Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-700 font-bold block mb-1">Sex</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as 'Female' | 'Male' | 'Other')}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-slate-900"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-700 font-bold block mb-1">Blood</label>
                <select
                  value={bloodType}
                  onChange={(e) => setBloodType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-slate-900 font-mono"
                >
                  {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-700 font-bold block mb-1">
                Allot to Respective Specialist & Doctor *
              </label>
              <select
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-semibold"
              >
                {HOSPITAL_SPECIALISTS.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} — {doc.specialty} ({doc.availability})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-700 font-bold block mb-1">
                Triage Criticality Level
              </label>
              <select
                value={triageLevel}
                onChange={(e) => setTriageLevel(e.target.value as TriageUrgency)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-semibold"
              >
                <option value="Level 1 (Resuscitation)">Level 1 (Resuscitation)</option>
                <option value="Level 2 (Emergent)">Level 2 (Emergent)</option>
                <option value="Level 3 (Urgent)">Level 3 (Urgent)</option>
                <option value="Level 4 (Routine)">Level 4 (Routine)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-700 font-bold block mb-1">
                Presenting Chief Complaint & Clinical Notes *
              </label>
              <textarea
                rows={2}
                required
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                placeholder="Describe acute symptoms, onset duration, radiating pain..."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
              />
            </div>

            {/* Vitals Input Strip */}
            <div className="grid grid-cols-5 gap-1.5 pt-1">
              <div>
                <label className="text-[9px] text-slate-600 font-mono block">Sys BP</label>
                <input
                  type="number"
                  value={systolic}
                  onChange={(e) => setSystolic(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-md px-2 py-1 text-slate-900 font-mono text-[11px]"
                />
              </div>
              <div>
                <label className="text-[9px] text-slate-600 font-mono block">Dia BP</label>
                <input
                  type="number"
                  value={diastolic}
                  onChange={(e) => setDiastolic(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-md px-2 py-1 text-slate-900 font-mono text-[11px]"
                />
              </div>
              <div>
                <label className="text-[9px] text-slate-600 font-mono block">HR bpm</label>
                <input
                  type="number"
                  value={heartRate}
                  onChange={(e) => setHeartRate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-md px-2 py-1 text-slate-900 font-mono text-[11px]"
                />
              </div>
              <div>
                <label className="text-[9px] text-slate-600 font-mono block">SpO2 %</label>
                <input
                  type="number"
                  value={o2Sat}
                  onChange={(e) => setO2Sat(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-md px-2 py-1 text-slate-900 font-mono text-[11px]"
                />
              </div>
              <div>
                <label className="text-[9px] text-slate-600 font-mono block">Temp °F</label>
                <input
                  type="text"
                  value={tempF}
                  onChange={(e) => setTempF(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-md px-2 py-1 text-slate-900 font-mono text-[11px]"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-700 font-bold block mb-1">
                Known Drug Allergy
              </label>
              <input
                type="text"
                value={allergySubstance}
                onChange={(e) => setAllergySubstance(e.target.value)}
                placeholder="e.g. Penicillin, Sulfa, NSAIDs, or NKDA"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-lg bg-[#0B1221] hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4 text-teal-400" />
              <span>Register Patient & Allot to Doctor</span>
            </button>
          </form>
        </div>

        {/* Right Column (8 cols): Care Taker Patient Registry, Specialist Allotment & Doctor Directives */}
        <div className="xl:col-span-8 vision-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-teal-600" />
                Hospital #{session.hospitalCode} Patient Roster, Specialist Allotment & Doctor Directives
              </h2>
              <p className="text-[11px] text-slate-600">
                Update status for doctors, reassign specialists, review physician sign-off comments, or dispatch emergency alerts.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700">
              {patients.length} Total Records
            </span>
          </div>

          <div className="space-y-3">
            {patients.map((pat) => {
              const avatar = getPatientAvatarConfig(
                pat.id,
                pat.demographics.firstName,
                pat.demographics.lastName
              );
              const isCritical =
                pat.triageLevel.includes('Emergent') || pat.triageLevel.includes('Resuscitation');
              const isSignedOff =
                pat.appointmentStatus === 'Done' || pat.doctorSignOff?.signedOff;

              return (
                <div
                  key={pat.id}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all space-y-3"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    {/* Patient Identity & Vitals */}
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg bg-gradient-to-tr ${avatar.gradientClass} flex items-center justify-center text-white font-extrabold text-xs shrink-0`}
                      >
                        {avatar.initials}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-extrabold text-slate-900">
                            {pat.demographics.firstName} {pat.demographics.lastName}
                          </h3>
                          <span className="text-[11px] font-mono text-teal-700 font-bold">
                            MRN #{pat.mrn}
                          </span>
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                              isCritical
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-teal-50 text-teal-800 border-teal-200'
                            }`}
                          >
                            {pat.triageLevel}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">{pat.chiefComplaint}</p>
                        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-700 mt-1 flex-wrap">
                          <span>
                            BP:{' '}
                            <strong className="text-slate-900">
                              {pat.vitals.systolic}/{pat.vitals.diastolic}
                            </strong>
                          </span>
                          <span>
                            HR: <strong className="text-slate-900">{pat.vitals.heartRate} bpm</strong>
                          </span>
                          <span>
                            SpO2: <strong className="text-emerald-700">{pat.vitals.o2Sat}%</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Controls: Allot Specialist, Update Status, Emergency SOS */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {/* Specialist Allotment Selector */}
                      <select
                        value={pat.assignedDoctorId || 'doc-01'}
                        onChange={(e) => {
                          const doc = HOSPITAL_SPECIALISTS.find((d) => d.id === e.target.value);
                          if (doc) {
                            onAllotSpecialist(pat.id, doc.id, doc.name, doc.specialty);
                          }
                        }}
                        title="Allot patient to Specialist Doctor"
                        className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-900 font-semibold focus:outline-hidden"
                      >
                        {HOSPITAL_SPECIALISTS.map((doc) => (
                          <option key={doc.id} value={doc.id}>
                            Allot: {doc.name} ({doc.specialty.split(' ')[0]})
                          </option>
                        ))}
                      </select>

                      {/* Status Selector */}
                      <select
                        value={pat.appointmentStatus}
                        onChange={(e) =>
                          onUpdateStatus(pat.id, e.target.value as AppointmentStatus)
                        }
                        className={`border rounded-lg px-2.5 py-1.5 text-[11px] font-bold cursor-pointer ${
                          pat.appointmentStatus === 'Emergency'
                            ? 'bg-red-50 border-red-300 text-red-700'
                            : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      >
                        <option value="Waiting">Waiting</option>
                        <option value="In-Consultation">In-Consultation</option>
                        <option value="Emergency">🚨 Emergency (Auto-Email MD)</option>
                        <option value="Done">Done (Signed Off)</option>
                      </select>

                      {/* Emergency Notify Doctor Button */}
                      <button
                        onClick={() => openEmergencyModalForPatient(pat)}
                        className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-600 text-red-700 hover:text-white border border-red-200 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap"
                      >
                        <Siren className="w-3.5 h-3.5" />
                        <span>SOS + Gmail</span>
                      </button>

                      <button
                        onClick={() => onSelectPatientForDoctorView(pat.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#0B1221] text-slate-800 hover:text-white text-[11px] font-bold border border-slate-300 transition-all cursor-pointer whitespace-nowrap"
                      >
                        Clinical Notes
                      </button>
                    </div>
                  </div>

                  {/* Doctor Sign-Off & Comments Box visible to Care Taker */}
                  {pat.doctorSignOff && (
                    <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-emerald-800 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>
                            Doctor Signed Off ({pat.doctorSignOff.signedOffBy} at{' '}
                            {pat.doctorSignOff.signedOffAt})
                          </span>
                        </div>
                        <p className="text-slate-800 text-[11px]">
                          <strong className="text-teal-800">Doctor Clinical Comment:</strong>{' '}
                          {pat.doctorSignOff.clinicalComments}
                        </p>
                        <p className="text-amber-900 text-[11px] font-semibold">
                          <strong>Care Taker Action Directive:</strong>{' '}
                          {pat.doctorSignOff.caretakerDirective}
                        </p>
                      </div>

                      {isSignedOff && (
                        <button
                          onClick={() => onDownloadAudit(pat)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold whitespace-nowrap shrink-0 flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Audit Record</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Emergency Criticality Notification Modal (In-App + Google Email) */}
      {emergencyTargetPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-xl w-full max-w-lg border-2 border-red-600 overflow-hidden shadow-2xl">
            <div className="px-6 py-4 bg-red-600 flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <Siren className="w-5 h-5" />
                <div>
                  <h3 className="text-sm font-extrabold uppercase tracking-wider">
                    Emergency Criticality Dispatch (App + Google Email)
                  </h3>
                  <p className="text-[11px] text-white/90 font-mono">
                    Patient: {emergencyTargetPatient.demographics.firstName}{' '}
                    {emergencyTargetPatient.demographics.lastName} (MRN #{emergencyTargetPatient.mrn})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEmergencyTargetPatient(null)}
                className="text-white/80 hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDispatchEmergency} className="p-6 space-y-4 text-xs text-slate-900">
              <p className="text-slate-600 leading-relaxed">
                When the allotted doctor is away or the patient enters critical instability, this emergency dispatch alerts all on-call doctors in-app AND prepares an immediate notification to their Google Email.
              </p>

              <div>
                <label className="text-[11px] font-bold text-slate-800 block mb-1">
                  Target Doctor / On-Call Pool
                </label>
                <input
                  type="text"
                  required
                  value={targetDoctorName}
                  onChange={(e) => setTargetDoctorName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-semibold"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-teal-800 flex items-center gap-1.5 mb-1">
                  <Mail className="w-3.5 h-3.5 text-teal-600" />
                  Doctor's Google Email Address (Gmail Notification Recipient) *
                </label>
                <input
                  type="email"
                  required
                  value={targetDoctorEmail}
                  onChange={(e) => setTargetDoctorEmail(e.target.value)}
                  placeholder="doctor@gmail.com"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-800 block mb-1">
                  Criticality Details & Life-Saving Intervention Needed *
                </label>
                <textarea
                  rows={3}
                  required
                  value={emergencyReason}
                  onChange={(e) => setEmergencyReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEmergencyTargetPatient(null)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-extrabold shadow-xs cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Dispatch Emergency Alert + Gmail</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
