/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  HospitalFacility,
  SpecialistDoctor,
  InterHospitalTransfer,
  EmergencyNotification,
} from '../types/clinical.ts';

export const HOSPITAL_FACILITIES: HospitalFacility[] = [
  {
    code: '88492014',
    name: 'Apollo Metro Heart & General Hospital',
    city: 'Chennai / Metro Health District',
    adminName: 'Admin Rajesh Khanna',
    adminEmail: 'admin.apollo88492014@medvision.org',
  },
  {
    code: '77319022',
    name: 'St. Jude Regional Medical Center',
    city: 'Bengaluru / Central Specialty Wing',
    adminName: 'Admin Priya Nair',
    adminEmail: 'admin.stjude77319022@medvision.org',
  },
  {
    code: '66204198',
    name: 'Mount Sinai Tertiary Care Institute',
    city: 'Mumbai / Coastal Critical Care',
    adminName: 'AdminVikramaditya Rao',
    adminEmail: 'admin.sinai66204198@medvision.org',
  },
];

export const HOSPITAL_SPECIALISTS: SpecialistDoctor[] = [
  {
    id: 'doc-01',
    name: 'Dr. Sarah Chen, MD',
    specialty: 'Interventional Cardiology & Internal Medicine',
    email: 'ashwinsivasamy08@gmail.com',
    hospitalCode: '88492014',
    availability: 'Available',
  },
  {
    id: 'doc-02',
    name: 'Dr. Vikram Mehta, MD',
    specialty: 'Endocrinology & Metabolic Disorders',
    email: 'vikram.mehta.md@gmail.com',
    hospitalCode: '88492014',
    availability: 'In-Consultation',
  },
  {
    id: 'doc-03',
    name: 'Dr. Elena Rostova, FACS',
    specialty: 'Acute Care & General Surgery',
    email: 'elena.rostova.surg@gmail.com',
    hospitalCode: '88492014',
    availability: 'Off-Site / On-Call',
  },
  {
    id: 'doc-04',
    name: 'Dr. Marcus Vance, MD',
    specialty: 'Pulmonology & Critical Care',
    email: 'marcus.vance.icu@gmail.com',
    hospitalCode: '88492014',
    availability: 'Available',
  },
  {
    id: 'doc-05',
    name: 'Dr. Ananya Sharma, DM',
    specialty: 'Cardiothoracic & Vascular Care',
    email: 'ananya.sharma@stjude-med.org',
    hospitalCode: '77319022',
    availability: 'Available',
  },
];

export const INITIAL_TRANSFERS: InterHospitalTransfer[] = [
  {
    id: 'trf-1001',
    patientId: 'pat-trf-01',
    patientName: 'Devendra Kulkarni',
    patientMrn: '904-7721',
    ageGender: '64y Male',
    bloodType: 'AB+',
    chiefComplaint:
      'Refractory NSTEMI with rising Troponin I (0.42 ng/mL) and dynamic ST depression in V4-V6 requiring tertiary catheterization lab',
    triageLevel: 'Level 2 (Emergent)',
    fromHospitalCode: '77319022',
    fromHospitalName: 'St. Jude Regional Medical Center',
    toHospitalCode: '88492014',
    toHospitalName: 'Apollo Metro Heart & General Hospital',
    initiatedByAdmin: 'Admin Priya Nair (#77319022)',
    initiatedAt: '08:40 AM',
    transferReason:
      'Cath lab at originating facility (#77319022) under maintenance; urgent interventional cardiology takeover requested.',
    previousRecordsSummary:
      'Prior History: CAD, T2DM, CKD Stage 3a (Cr 1.4 mg/dL). Loading dose Aspirin 325mg + Ticagrelor 180mg + Heparin IV bolus administered at 08:15 AM at St. Jude (#77319022). Serial ECGs attached.',
    vitalsSnapshot: 'BP 158/94 mmHg · HR 96 bpm · SpO2 95% (2L NC) · Temp 98.4°F',
    assignedDoctorId: 'doc-01',
    assignedDoctorName: 'Dr. Sarah Chen, MD',
    assignedSpecialty: 'Interventional Cardiology & Internal Medicine',
    status: 'Forwarded to Doctor',
  },
  {
    id: 'trf-1002',
    patientId: 'pat-trf-02',
    patientName: 'Meenakshi Sundaram',
    patientMrn: '741-3390',
    ageGender: '51y Female',
    bloodType: 'O+',
    chiefComplaint:
      'Severe thyrotoxicosis crisis with atrial fibrillation (HR 134 bpm) and high-output cardiac strain',
    triageLevel: 'Level 2 (Emergent)',
    fromHospitalCode: '66204198',
    fromHospitalName: 'Mount Sinai Tertiary Care Institute',
    toHospitalCode: '88492014',
    toHospitalName: 'Apollo Metro Heart & General Hospital',
    initiatedByAdmin: 'Admin Vikramaditya Rao (#66204198)',
    initiatedAt: '09:05 AM',
    transferReason:
      'Requires combined Endocrine-Cardiology ICU co-management.',
    previousRecordsSummary:
      'Graves disease diagnosed 2024; non-adherent to Methimazole for 6 weeks. TSH <0.01 mIU/L, Free T4 4.8 ng/dL. Propranolol 40mg PO given prior to transport.',
    vitalsSnapshot: 'BP 142/88 mmHg · HR 128 bpm · SpO2 97% · Temp 100.8°F',
    status: 'Pending Receiving Admin',
  },
];

export const INITIAL_EMERGENCY_ALERTS: EmergencyNotification[] = [
  {
    id: 'emg-01',
    patientId: 'pat-004',
    patientName: 'Harold Finch',
    patientMrn: '719-5832',
    hospitalCode: '88492014',
    triggeredByCaretaker: 'Caretaker Anjali Verma, RN',
    triggeredAt: '09:19 AM',
    targetDoctorName: 'Dr. Sarah Chen, MD (Allotted) & On-Call Pool',
    targetDoctorEmail: 'ashwinsivasamy08@gmail.com',
    severityReason:
      'CRITICAL HYPOXEMIA (SpO2 91% RA) & Acute Pulmonary Edema (NT-proBNP 4,210 pg/mL). Allotted physician in cath procedure — immediate backup physician intervention needed!',
    vitalsSnapshot: 'BP 168/96 mmHg · HR 98 bpm · RR 24/min · SpO2 91%',
    emailSentStatus: 'Dispatched to Google Email',
  },
];
