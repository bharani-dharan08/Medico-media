/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AppointmentStatus = 'Waiting' | 'In-Consultation' | 'Emergency' | 'Done';

export type TriageUrgency = 'Level 1 (Resuscitation)' | 'Level 2 (Emergent)' | 'Level 3 (Urgent)' | 'Level 4 (Routine)' | 'Level 5 (Non-urgent)';

export type AllergySeverity = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';

export interface Allergy {
  id: string;
  substance: string;
  reaction: string;
  severity: AllergySeverity;
  category: 'Drug' | 'Food' | 'Environmental';
  verifiedDate: string;
}

export interface Vitals {
  systolic: number;
  diastolic: number;
  heartRate: number;
  respRate: number;
  o2Sat: number;
  tempF: number;
  bmi: number;
  recordedAt: string;
  recordedBy: string;
  abnormalities: string[];
}

export interface VitalTrendPoint {
  visitDate: string;
  systolic: number;
  diastolic: number;
  heartRate: number;
  respRate: number;
  o2Sat: number;
  tempF: number;
  bmi?: number;
  weightLbs?: number;
  encounterType: string;
  clinicalNote?: string;
}

export interface Demographics {
  firstName: string;
  lastName: string;
  dob: string;
  age: number;
  gender: 'Female' | 'Male' | 'Other';
  bloodType: string;
  phone: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  preferredLanguage: string;
  insuranceProvider: string;
  pcp: string;
}

export interface ChronicCondition {
  id: string;
  code: string; // e.g., ICD-10
  name: string;
  status: 'Active' | 'Controlled' | 'Refractory';
  onsetDate: string;
  notes?: string;
}

export interface PharmacyRefillEvent {
  date: string;
  daysSupply: number;
  quantityDispensed: number;
  pharmacyName: string;
  rxNumber: string;
  status: 'Dispensed' | 'Refill Overdue' | 'Early Refill' | 'Refill Requested';
}

export type AdherenceCategory = 'OPTIMAL' | 'UNDER_UTILIZATION' | 'OVER_UTILIZATION';

export interface MedicationAdherence {
  pdcPercentage: number; // Proportion of Days Covered (e.g. 64% or 95% or 128%)
  status: AdherenceCategory;
  statusBadge: string;
  daysCovered: number;
  evaluationWindowDays: number;
  daysDelta: number; // Negative = overdue / missed doses, Positive = refilled early
  lastRefillDate: string;
  nextExpectedRefill: string;
  refillEvents: PharmacyRefillEvent[];
  clinicalRiskNote?: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  route: string;
  indication: string;
  prescriber: string;
  refillStatus: 'Active' | 'Refill Requested' | 'Expired';
  refillsRemaining: number;
  lastFilled: string;
  adherence?: MedicationAdherence;
}

export type LabStatus = 'NORMAL' | 'HIGH' | 'CRITICAL' | 'LOW';
export type LabCategory = 'Bloodwork' | 'Imaging' | 'Pathology' | 'Microbiology';

export interface LabDelta {
  previousValue: number | string;
  previousDate: string;
  numericDelta?: number;
  percentageDelta?: number;
  direction: 'up' | 'down' | 'unchanged';
  isSignificant: boolean;
  severity: 'CRITICAL' | 'WARNING' | 'NORMAL';
  deltaText: string;
}

export interface LabReport {
  id: string;
  name: string;
  category: LabCategory;
  value: number | string;
  unit: string;
  referenceMin?: number;
  referenceMax?: number;
  referenceRange: string;
  status: LabStatus;
  collectedAt: string;
  specimen: string;
  orderingMD: string;
  findingsNarrative: string;
  imagingType?: string;
  impression?: string;
  acknowledged?: boolean;
  delta?: LabDelta;
}

export interface AuditLogEntry {
  timestamp: string;
  action: string;
  actor: string;
  details?: string;
}

export interface PendingAction {
  id: string;
  title: string;
  type: 'refill' | 'critical_lab' | 'referral' | 'note' | 'vitals_recheck';
  description: string;
  urgency: 'urgent' | 'routine';
  status: 'pending' | 'completed';
  createdAt: string;
  auditTrail: AuditLogEntry[];
}

export interface ClinicalNote {
  id: string;
  timestamp: string;
  author: string;
  type: 'SOAP' | 'Rapid Note' | 'Triage Handoff';
  content: string;
  tags?: string[];
}

export interface OrganAcuityPeriod {
  period: string; // '6M Ago' | '3M Ago' | '1M Ago' | 'Last Wk' | 'Today'
  severity: 'Normal' | 'Mild' | 'Moderate' | 'Critical';
  testSummary: string;
  labValue: string;
}

export interface OrganSystemRisk {
  organ: 'Cardio' | 'Metabolic' | 'Renal' | 'Hepatic' | 'Resp';
  label: string;
  periods: OrganAcuityPeriod[];
}

export type UserRole = 'doctor' | 'caretaker' | 'admin';

export interface HospitalFacility {
  code: string; // 8-digit code e.g. '88492014'
  name: string;
  city: string;
  adminName: string;
  adminEmail: string;
}

export interface SpecialistDoctor {
  id: string;
  name: string;
  specialty: string;
  email: string;
  hospitalCode: string;
  availability: 'Available' | 'In-Consultation' | 'Off-Site / On-Call';
}

export interface DoctorSignOff {
  signedOff: boolean;
  signedOffBy: string;
  signedOffAt: string;
  clinicalComments: string;
  caretakerDirective: string;
  auditId: string;
}

export interface EmergencyNotification {
  id: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  hospitalCode: string;
  triggeredByCaretaker: string;
  triggeredAt: string;
  targetDoctorName: string;
  targetDoctorEmail: string;
  severityReason: string;
  vitalsSnapshot: string;
  emailSentStatus: 'Dispatched to Google Email' | 'Pending';
  acknowledgedByDoctor?: string;
  acknowledgedAt?: string;
}

export interface InterHospitalTransfer {
  id: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  ageGender: string;
  bloodType: string;
  chiefComplaint: string;
  triageLevel: TriageUrgency;
  fromHospitalCode: string;
  fromHospitalName: string;
  toHospitalCode: string;
  toHospitalName: string;
  initiatedByAdmin: string;
  initiatedAt: string;
  transferReason: string;
  previousRecordsSummary: string;
  vitalsSnapshot: string;
  assignedDoctorId?: string;
  assignedDoctorName?: string;
  assignedSpecialty?: string;
  status:
    | 'Pending Receiving Admin'
    | 'Forwarded to Doctor'
    | 'Accepted by Doctor'
    | 'Declined by Doctor'
    | 'Admitted to Hospital';
  doctorDecisionNotes?: string;
  decidedAt?: string;
}

export interface UserSession {
  role: UserRole;
  hospitalCode: string;
  hospitalName: string;
  userName: string;
  userEmail: string;
  specialty?: string;
}

export interface Patient {
  id: string;
  mrn: string;
  hospitalCode?: string; // 8-digit hospital code
  assignedDoctorId?: string;
  assignedDoctorName?: string;
  assignedSpecialty?: string;
  doctorSignOff?: DoctorSignOff;
  demographics: Demographics;
  allergies: Allergy[];
  vitals: Vitals;
  vitalTrends: VitalTrendPoint[];
  appointmentStatus: AppointmentStatus;
  timeSlot: string;
  chiefComplaint: string;
  triageLevel: TriageUrgency;
  chronicHistory: ChronicCondition[];
  medications: Medication[];
  labReports: LabReport[];
  pendingActions: PendingAction[];
  clinicalNotes: ClinicalNote[];
  vitalStabilityScore?: number; // e.g. 8.4 / 10
  organAcuityHistory?: OrganSystemRisk[];
  quickMetrics?: {
    medAdherencePercent: number;
    labCompletionPercent: number;
    followUpRisk: 'Low' | 'Moderate' | 'High';
    pendingSignOffs: number;
  };
}

export interface ClinicalPriority {
  id: string;
  level: 'critical' | 'urgent' | 'monitoring';
  headline: string;
  rationale: string;
  recommendedAction: string;
  sourceData: string;
}

export type EmailTriggerSource =
  | 'STATUS_FLAGGED_EMERGENCY'
  | 'CARETAKER_SOS_DISPATCH'
  | 'CRITICAL_INTAKE_AUTO';

export interface EmailDeliveryRecord {
  id: string;
  messageId: string;
  timestamp: string;
  isoTimestamp: string;
  provider: string;
  smtpResponse: string;
  deliveryStatus: 'DELIVERED' | 'QUEUED_RETRY';
  latencyMs: number;
  triggerSource: EmailTriggerSource;
  triggerActor: string;
  hospitalCode: string;
  hospitalName: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  triageLevel: TriageUrgency;
  recipientDoctorId: string;
  recipientDoctorName: string;
  recipientEmail: string;
  ccEmails: string[];
  subject: string;
  vitalsSummary: string;
  clinicalReason: string;
  textBody: string;
  htmlPreview: string;
  gmailComposeUrl: string;
  mailtoUrl: string;
}
