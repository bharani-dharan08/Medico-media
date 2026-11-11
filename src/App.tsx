/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { INITIAL_PATIENTS } from './data/mockPatients.ts';
import {
  HOSPITAL_FACILITIES,
  INITIAL_TRANSFERS,
  INITIAL_EMERGENCY_ALERTS,
} from './data/hospitalRegistry.ts';
import {
  Patient,
  AppointmentStatus,
  LabReport,
  Medication,
  PendingAction,
  ClinicalNote,
  UserRole,
  UserSession,
  InterHospitalTransfer,
  EmergencyNotification,
  EmailDeliveryRecord,
} from './types/clinical.ts';
import {
  executePendingAction,
  addNewPendingAction,
  addClinicalNote,
  updatePatientAppointmentStatus,
} from './utils/triage.ts';
import {
  downloadPatientAuditReport,
  downloadHospitalMasterAuditJson,
} from './utils/auditExport.ts';
import {
  dispatchAutomatedEmergencyEmail,
  INITIAL_EMAIL_DELIVERY_LOGS,
} from './services/emailNotificationService.ts';
import { TopBar } from './components/TopBar.tsx';
import { VisionSidebar, VisionNavTab } from './components/VisionSidebar.tsx';
import { VisionKpiCards } from './components/VisionKpiCards.tsx';
import { VisionPatientHeroCard } from './components/VisionPatientHeroCard.tsx';
import { VisionLabDonutCard } from './components/VisionLabDonutCard.tsx';
import { VisionStabilityScoreCard } from './components/VisionStabilityScoreCard.tsx';
import { VisionVitalsTrajectoryCard } from './components/VisionVitalsTrajectoryCard.tsx';
import { VisionOrganHeatmapCard } from './components/VisionOrganHeatmapCard.tsx';
import {
  VisionSwitchableTableCard,
  ClinicalTableTab,
} from './components/VisionSwitchableTableCard.tsx';
import { VisionPendingTimelineCard } from './components/VisionPendingTimelineCard.tsx';
import { DoctorSignOffCard } from './components/DoctorSignOffCard.tsx';
import { CaretakerWorkspace } from './components/CaretakerWorkspace.tsx';
import { AdminHospitalWorkspace } from './components/AdminHospitalWorkspace.tsx';
import { HospitalLoginModal } from './components/HospitalLoginModal.tsx';
import { LabReportModal } from './components/LabReportModal.tsx';
import { QuickAddModal } from './components/QuickAddModal.tsx';
import { NotesHistoryModal } from './components/NotesHistoryModal.tsx';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal.tsx';
import { SoapSummaryModal } from './components/SoapSummaryModal.tsx';
import { EmailDeliveryInspectorModal } from './components/EmailDeliveryInspectorModal.tsx';
import { CommonLoginPage } from './components/CommonLoginPage.tsx';
import { DoctorRoleCharts } from './components/DoctorRoleCharts.tsx';
import { AiSecurityOperationsCenter } from './components/AiSecurityOperationsCenter.tsx';
import {
  LiveDemoStoryBar,
  LIVE_DEMO_STORY_STEPS,
} from './components/LiveDemoStoryBar.tsx';
import { ClinicalSafetyGuardrailCard } from './components/ClinicalSafetyGuardrailCard.tsx';
import { getPatientAvatarConfig } from './utils/avatarHash.ts';
import { Mail, CheckCircle2, ExternalLink, X, Users } from 'lucide-react';

export default function App() {
  const mainRef = useRef<HTMLElement>(null);
  const queueSectionRef = useRef<HTMLElement>(null);
  const patientSummaryRef = useRef<HTMLDivElement>(null);
  const heatmapSectionRef = useRef<HTMLDivElement>(null);
  const bottomSectionRef = useRef<HTMLDivElement>(null);
  const aiSecuritySectionRef = useRef<HTMLDivElement>(null);

  // Authentication Gate — starts at Common Login Page (Hospital ID, Role, Email, Password)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // User Session (Hospital 8-Digit Code + Role)
  const [session, setSession] = useState<UserSession>(() => {
    const saved = localStorage.getItem('medvision_session_v3');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {
      role: 'doctor',
      hospitalCode: '88492014',
      hospitalName: 'Apollo Metro Heart & General Hospital',
      userName: 'Dr. Sarah Chen, MD',
      userEmail: 'ashwinsivasamy08@gmail.com',
      specialty: 'Interventional Cardiology & Internal Medicine',
    };
  });

  // Patients State
  const [patients, setPatients] = useState<Patient[]>(() => {
    const saved = localStorage.getItem('medvision_patients_v3');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved patients', e);
      }
    }
    return INITIAL_PATIENTS;
  });

  // Inter-Hospital Transfers State
  const [transfers, setTransfers] = useState<InterHospitalTransfer[]>(() => {
    const saved = localStorage.getItem('medvision_transfers_v3');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_TRANSFERS;
  });

  // Emergency Notifications State
  const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyNotification[]>(() => {
    const saved = localStorage.getItem('medvision_emergencies_v3');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_EMERGENCY_ALERTS;
  });

  // Automated Email Delivery Service Outbox State
  const [emailLogs, setEmailLogs] = useState<EmailDeliveryRecord[]>(() => {
    const saved = localStorage.getItem('medvision_email_logs_v3');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_EMAIL_DELIVERY_LOGS;
  });

  const [latestAutoEmailToast, setLatestAutoEmailToast] =
    useState<EmailDeliveryRecord | null>(null);
  const [isEmailInspectorOpen, setIsEmailInspectorOpen] = useState<boolean>(false);

  const [selectedPatientId, setSelectedPatientId] = useState<string>('pat-001');
  const [activeNavTab, setActiveNavTab] = useState<VisionNavTab>('Patient Dashboard');
  const [tableTab, setTableTab] = useState<ClinicalTableTab>('appointments');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Filters
  const [onlyAbnormalLabs, setOnlyAbnormalLabs] = useState<boolean>(false);
  const [onlyUrgentActions, setOnlyUrgentActions] = useState<boolean>(false);
  const [rosterStatusFilters, setRosterStatusFilters] = useState<AppointmentStatus[]>([]);

  // Modals
  const [isLoginPortalOpen, setIsLoginPortalOpen] = useState<boolean>(false);
  const [activeReportForModal, setActiveReportForModal] = useState<LabReport | null>(null);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState<boolean>(false);
  const [quickAddInitialNote, setQuickAddInitialNote] = useState<string>('');
  const [isNotesHistoryOpen, setIsNotesHistoryOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [isSoapModalOpen, setIsSoapModalOpen] = useState<boolean>(false);

  // Live Guided 5-Step Storyboard State (Enabled by default so presenter can demo immediately)
  const [isLiveStoryOpen, setIsLiveStoryOpen] = useState<boolean>(true);
  const [activeStoryStep, setActiveStoryStep] = useState<number>(1);
  const [completedStorySteps, setCompletedStorySteps] = useState<number[]>([]);

  // Persist to local storage
  useEffect(() => {
    localStorage.setItem('medvision_session_v3', JSON.stringify(session));
  }, [session]);

  useEffect(() => {
    localStorage.setItem('medvision_patients_v3', JSON.stringify(patients));
  }, [patients]);

  useEffect(() => {
    localStorage.setItem('medvision_transfers_v3', JSON.stringify(transfers));
  }, [transfers]);

  useEffect(() => {
    localStorage.setItem('medvision_emergencies_v3', JSON.stringify(emergencyAlerts));
  }, [emergencyAlerts]);

  useEffect(() => {
    localStorage.setItem('medvision_email_logs_v3', JSON.stringify(emailLogs));
  }, [emailLogs]);

  // Active Patient lookup
  const activePatient = useMemo(() => {
    return patients.find((p) => p.id === selectedPatientId) || patients[0];
  }, [patients, selectedPatientId]);

  // Overall Clinic Counts
  const totalWaiting = useMemo(() => {
    return patients.filter((p) => p.appointmentStatus === 'Waiting').length;
  }, [patients]);

  const totalInConsultation = useMemo(() => {
    return patients.filter((p) => p.appointmentStatus === 'In-Consultation').length;
  }, [patients]);

  const abnormalLabsCount = useMemo(() => {
    return activePatient.labReports.filter((l) => l.status !== 'NORMAL').length;
  }, [activePatient]);

  const pendingActionsCount = useMemo(() => {
    return activePatient.pendingActions.filter((a) => a.status === 'pending').length;
  }, [activePatient]);

  const unacknowledgedEmergencyCount = useMemo(() => {
    return emergencyAlerts.filter((a) => !a.acknowledgedByDoctor).length;
  }, [emergencyAlerts]);

  const forwardedTransfersForDoctor = useMemo(() => {
    return transfers.filter((t) => t.status === 'Forwarded to Doctor');
  }, [transfers]);

  // Multi-select filter logic for Active Patient Queue Roster (+ optional searchQuery filtering)
  const toggleRosterStatusFilter = useCallback((status: AppointmentStatus) => {
    setRosterStatusFilters((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  }, []);

  const filteredRosterPatients = useMemo(() => {
    let list = patients;
    if (rosterStatusFilters.length > 0) {
      list = list.filter((p) => rosterStatusFilters.includes(p.appointmentStatus));
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          `${p.demographics.firstName} ${p.demographics.lastName}`
            .toLowerCase()
            .includes(q) ||
          p.mrn.toLowerCase().includes(q) ||
          p.chiefComplaint.toLowerCase().includes(q) ||
          p.triageLevel.toLowerCase().includes(q)
      );
    }
    return list;
  }, [patients, rosterStatusFilters, searchQuery]);

  // Switch Facility Context in TopBar
  const handleSelectFacility = useCallback(
    (code: string, name: string) => {
      setSession((prev) => ({
        ...prev,
        hospitalCode: code,
        hospitalName: name,
      }));
    },
    []
  );

  // Switch Role quickly
  const handleSwitchRole = useCallback(
    (role: UserRole) => {
      const fac =
        HOSPITAL_FACILITIES.find((f) => f.code === session.hospitalCode) ||
        HOSPITAL_FACILITIES[0];
      setSession((prev) => ({
        ...prev,
        role,
        userName:
          role === 'doctor'
            ? 'Dr. Sarah Chen, MD'
            : role === 'caretaker'
            ? 'Caretaker Anjali Verma, RN'
            : fac.adminName,
        userEmail:
          role === 'doctor'
            ? 'ashwinsivasamy08@gmail.com'
            : role === 'caretaker'
            ? 'anjali.caretaker@medvision.org'
            : fac.adminEmail,
      }));
      mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [session.hospitalCode]
  );

  // Handle sidebar navigation across all 8 clinical destinations
  const handleSelectNavTab = useCallback((tab: VisionNavTab) => {
    setActiveNavTab(tab);
    setIsMobileMenuOpen(false);
    if (tab === 'Patient Dashboard') {
      mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tab === 'Patient Search') {
      queueSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const searchEl = document.getElementById('global-patient-search-input');
      searchEl?.focus();
    } else if (tab === 'Patient Summary') {
      patientSummaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (tab === 'Clinical Heatmap') {
      heatmapSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (tab === 'Appointments Queue') {
      setTableTab('appointments');
      bottomSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (tab === 'Lab Reports') {
      setTableTab('labs');
      bottomSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (tab === 'Pending Actions') {
      bottomSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (tab === 'AI Security & PIM') {
      aiSecuritySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (tab === 'Settings') {
      setIsShortcutsOpen(true);
    }
  }, []);

  // Reset demo dataset
  const handleResetDemoData = useCallback(() => {
    localStorage.removeItem('medvision_patients_v3');
    localStorage.removeItem('medvision_transfers_v3');
    localStorage.removeItem('medvision_emergencies_v3');
    localStorage.removeItem('medvision_email_logs_v3');
    setPatients(INITIAL_PATIENTS);
    setTransfers(INITIAL_TRANSFERS);
    setEmergencyAlerts(INITIAL_EMERGENCY_ALERTS);
    setEmailLogs(INITIAL_EMAIL_DELIVERY_LOGS);
    setLatestAutoEmailToast(null);
    setSelectedPatientId('pat-001');
    setOnlyAbnormalLabs(false);
    setOnlyUrgentActions(false);
    setRosterStatusFilters([]);
    setSearchQuery('');
    setActiveNavTab('Patient Dashboard');
    setTableTab('appointments');
    setActiveStoryStep(1);
    setCompletedStorySteps([]);
  }, []);

  // Update status handler — automatically triggers physician email integration when 'Emergency' is flagged
  const handleUpdateStatus = useCallback(
    (patientId: string, status: AppointmentStatus) => {
      setPatients((prev) => updatePatientAppointmentStatus(prev, patientId, status));

      if (status === 'Emergency') {
        const targetPat = patients.find((p) => p.id === patientId);
        if (targetPat) {
          const emailRecord = dispatchAutomatedEmergencyEmail({
            patient: { ...targetPat, appointmentStatus: 'Emergency' },
            hospitalCode: session.hospitalCode,
            hospitalName: session.hospitalName,
            triggeredBy: session.userName,
            triggerSource: 'STATUS_FLAGGED_EMERGENCY',
          });
          setEmailLogs((prev) => [emailRecord, ...prev]);
          setLatestAutoEmailToast(emailRecord);

          const newSosAlert: EmergencyNotification = {
            id: `emg-auto-${Date.now()}`,
            patientId: targetPat.id,
            patientName: emailRecord.patientName,
            patientMrn: targetPat.mrn,
            hospitalCode: session.hospitalCode,
            triggeredByCaretaker: `${session.userName} (Emergency Status Flag)`,
            triggeredAt: emailRecord.timestamp,
            targetDoctorName: emailRecord.recipientDoctorName,
            targetDoctorEmail: emailRecord.recipientEmail,
            severityReason: emailRecord.clinicalReason,
            vitalsSnapshot: emailRecord.vitalsSummary,
            emailSentStatus: 'Dispatched to Google Email',
          };
          setEmergencyAlerts((prev) => [newSosAlert, ...prev]);
        }
      }
    },
    [patients, session.hospitalCode, session.hospitalName, session.userName]
  );

  // Care Taker: Add new patient record (auto-triggers email if Level 1 Resuscitation or Emergency)
  const handleAddPatientRecord = useCallback(
    (newPatient: Patient) => {
      setPatients((prev) => [newPatient, ...prev]);
      setSelectedPatientId(newPatient.id);

      if (
        newPatient.appointmentStatus === 'Emergency' ||
        newPatient.triageLevel === 'Level 1 (Resuscitation)'
      ) {
        const emailRecord = dispatchAutomatedEmergencyEmail({
          patient: newPatient,
          hospitalCode: session.hospitalCode,
          hospitalName: session.hospitalName,
          triggeredBy: session.userName,
          triggerSource: 'CRITICAL_INTAKE_AUTO',
        });
        setEmailLogs((prev) => [emailRecord, ...prev]);
        setLatestAutoEmailToast(emailRecord);
      }
    },
    [session.hospitalCode, session.hospitalName, session.userName]
  );

  // Care Taker: Allot specialist & doctor
  const handleAllotSpecialist = useCallback(
    (patientId: string, doctorId: string, doctorName: string, specialty: string) => {
      setPatients((prev) =>
        prev.map((pat) =>
          pat.id === patientId
            ? {
                ...pat,
                assignedDoctorId: doctorId,
                assignedDoctorName: doctorName,
                assignedSpecialty: specialty,
              }
            : pat
        )
      );
    },
    []
  );

  // Care Taker: Trigger emergency notification (App + Automated Email Service)
  const handleTriggerEmergencyAlert = useCallback(
    (alert: EmergencyNotification) => {
      setEmergencyAlerts((prev) => [alert, ...prev]);
      setPatients((prev) =>
        updatePatientAppointmentStatus(prev, alert.patientId, 'Emergency')
      );

      const targetPat =
        patients.find((p) => p.id === alert.patientId) || patients[0];
      if (targetPat) {
        const emailRecord = dispatchAutomatedEmergencyEmail({
          patient: { ...targetPat, appointmentStatus: 'Emergency' },
          hospitalCode: alert.hospitalCode || session.hospitalCode,
          hospitalName: session.hospitalName,
          triggeredBy: alert.triggeredByCaretaker,
          triggerSource: 'CARETAKER_SOS_DISPATCH',
          customReason: alert.severityReason,
          overrideRecipientEmail: alert.targetDoctorEmail,
          overrideRecipientName: alert.targetDoctorName,
        });
        setEmailLogs((prev) => [emailRecord, ...prev]);
        setLatestAutoEmailToast(emailRecord);
      }
    },
    [patients, session.hospitalCode, session.hospitalName]
  );

  // Manual trigger from Email Inspector Modal
  const handleTriggerManualEmergencyEmail = useCallback(
    (pat: Patient, customEmail?: string) => {
      setPatients((prev) => updatePatientAppointmentStatus(prev, pat.id, 'Emergency'));
      const emailRecord = dispatchAutomatedEmergencyEmail({
        patient: { ...pat, appointmentStatus: 'Emergency' },
        hospitalCode: session.hospitalCode,
        hospitalName: session.hospitalName,
        triggeredBy: session.userName,
        triggerSource: 'STATUS_FLAGGED_EMERGENCY',
        overrideRecipientEmail: customEmail,
      });
      setEmailLogs((prev) => [emailRecord, ...prev]);
      setLatestAutoEmailToast(emailRecord);
    },
    [session.hospitalCode, session.hospitalName, session.userName]
  );

  // Doctor: Acknowledge emergency alert & load patient
  const handleAcknowledgeEmergency = useCallback(
    (alertId: string, patientId: string) => {
      const nowTime = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      setEmergencyAlerts((prev) =>
        prev.map((a) =>
          a.id === alertId
            ? {
                ...a,
                acknowledgedByDoctor: session.userName,
                acknowledgedAt: nowTime,
              }
            : a
        )
      );
      setSelectedPatientId(patientId);
      setPatients((prev) =>
        updatePatientAppointmentStatus(prev, patientId, 'In-Consultation')
      );
    },
    [session.userName]
  );

  // Doctor: Sign Off Patient & Save Care Taker Directives
  const handleSignOffPatient = useCallback(
    (patientId: string, clinicalComments: string, caretakerDirective: string) => {
      const nowTime = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      setPatients((prev) =>
        prev.map((pat) => {
          if (pat.id !== patientId) return pat;
          return {
            ...pat,
            appointmentStatus: 'Done',
            doctorSignOff: {
              signedOff: true,
              signedOffBy: session.userName,
              signedOffAt: nowTime,
              clinicalComments,
              caretakerDirective,
              auditId: `AUD-${session.hospitalCode}-${pat.mrn}-${Date.now()
                .toString()
                .slice(-4)}`,
            },
            clinicalNotes: [
              {
                id: `note-${Date.now()}`,
                timestamp: nowTime,
                author: session.userName,
                type: 'SOAP',
                content: `PHYSICIAN SIGN-OFF: ${clinicalComments}\nCARETAKER DIRECTIVE: ${caretakerDirective}`,
                tags: ['Signed Off', 'Audit Verified'],
              },
              ...pat.clinicalNotes,
            ],
          };
        })
      );
    },
    [session.userName, session.hospitalCode]
  );

  // Admin: Initiate outbound transfer
  const handleInitiateOutboundTransfer = useCallback((newTrf: InterHospitalTransfer) => {
    setTransfers((prev) => [newTrf, ...prev]);
  }, []);

  // Admin: Forward incoming transfer to specialist doctor
  const handleForwardTransferToDoctor = useCallback(
    (transferId: string, doctorId: string, doctorName: string, specialty: string) => {
      setTransfers((prev) =>
        prev.map((t) =>
          t.id === transferId
            ? {
                ...t,
                assignedDoctorId: doctorId,
                assignedDoctorName: doctorName,
                assignedSpecialty: specialty,
                status: 'Forwarded to Doctor',
              }
            : t
        )
      );
    },
    []
  );

  // Doctor: Decide whether to carry transferred case
  const handleDoctorDecideTransfer = useCallback(
    (
      transferId: string,
      decision: 'Accepted by Doctor' | 'Declined by Doctor',
      notes: string
    ) => {
      const nowTime = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      setTransfers((prev) =>
        prev.map((t) =>
          t.id === transferId
            ? {
                ...t,
                status: decision,
                doctorDecisionNotes: notes,
                decidedAt: nowTime,
              }
            : t
        )
      );
    },
    []
  );

  // Admin: Finalize accepted transfer and admit patient to active queue
  const handleAdminFinalizeTransferAdmission = useCallback(
    (transferId: string) => {
      const trf = transfers.find((t) => t.id === transferId);
      if (!trf) return;

      const nowTime = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      const nameParts = trf.patientName.split(' ');
      const firstName = nameParts[0] || 'Transferred';
      const lastName = nameParts.slice(1).join(' ') || 'Patient';

      const admittedPatient: Patient = {
        id: `pat-trf-${Date.now()}`,
        mrn: trf.patientMrn,
        hospitalCode: session.hospitalCode,
        assignedDoctorId: trf.assignedDoctorId || 'doc-01',
        assignedDoctorName: trf.assignedDoctorName || 'Dr. Sarah Chen, MD',
        assignedSpecialty: trf.assignedSpecialty || 'Interventional Cardiology',
        demographics: {
          firstName,
          lastName,
          dob: '1962-03-19',
          age: parseInt(trf.ageGender, 10) || 64,
          gender: trf.ageGender.includes('Female') ? 'Female' : 'Male',
          bloodType: trf.bloodType,
          phone: '(555) 819-3011',
          emergencyContact: {
            name: `${lastName} Family`,
            relationship: 'Spouse',
            phone: '(555) 819-3012',
          },
          preferredLanguage: 'English',
          insuranceProvider: `Inter-Hospital Transfer (#${trf.fromHospitalCode})`,
          pcp: trf.assignedDoctorName || 'Dr. Sarah Chen, MD',
        },
        appointmentStatus: 'In-Consultation',
        timeSlot: nowTime,
        chiefComplaint: `[TRANSFER FROM #${trf.fromHospitalCode}] ${trf.chiefComplaint}`,
        triageLevel: trf.triageLevel,
        allergies: [],
        vitals: {
          systolic: 158,
          diastolic: 94,
          heartRate: 96,
          respRate: 20,
          o2Sat: 95,
          tempF: 98.4,
          bmi: 27.2,
          recordedAt: nowTime,
          recordedBy: `Transfer Intake (#${trf.fromHospitalCode})`,
          abnormalities: ['TRANSFERRED EMERGENT CASE'],
        },
        vitalStabilityScore: 6.4,
        quickMetrics: {
          medAdherencePercent: 90,
          labCompletionPercent: 92,
          followUpRisk: 'High',
          pendingSignOffs: 1,
        },
        vitalTrends: [
          {
            visitDate: `Origin #${trf.fromHospitalCode}`,
            systolic: 162,
            diastolic: 96,
            heartRate: 102,
            respRate: 22,
            o2Sat: 94,
            tempF: 98.6,
            encounterType: 'Originating Hospital',
          },
          {
            visitDate: 'Arrival Today',
            systolic: 158,
            diastolic: 94,
            heartRate: 96,
            respRate: 20,
            o2Sat: 95,
            tempF: 98.4,
            encounterType: 'Inter-Hospital Admission',
          },
        ],
        chronicHistory: [
          {
            id: `cond-trf-${Date.now()}`,
            code: 'I21.4',
            name: trf.previousRecordsSummary,
            status: 'Active',
            onsetDate: '2026-10-24',
          },
        ],
        medications: [],
        labReports: [
          {
            id: `lab-trf-${Date.now()}`,
            name: 'Transfer Biomarker Panel (Originating Hospital Dossier)',
            category: 'Bloodwork',
            value: 0.42,
            unit: 'ng/mL',
            referenceMin: 0.0,
            referenceMax: 0.04,
            referenceRange: '< 0.04 ng/mL',
            status: 'CRITICAL',
            collectedAt: nowTime,
            specimen: 'Transferred Serum Record',
            orderingMD: trf.assignedDoctorName || 'Dr. Sarah Chen, MD',
            findingsNarrative: trf.previousRecordsSummary,
            acknowledged: false,
          },
        ],
        organAcuityHistory: INITIAL_PATIENTS[0].organAcuityHistory,
        pendingActions: [
          {
            id: `act-trf-${Date.now()}`,
            title: `Complete Inter-Hospital Transfer Intake (${trf.patientName})`,
            type: 'referral',
            description: `Transferred from ${trf.fromHospitalName} (#${trf.fromHospitalCode}). Accepted by ${trf.assignedDoctorName}.`,
            urgency: 'urgent',
            status: 'pending',
            createdAt: nowTime,
            auditTrail: [],
          },
        ],
        clinicalNotes: [
          {
            id: `note-trf-${Date.now()}`,
            timestamp: nowTime,
            author: session.userName,
            type: 'Triage Handoff',
            content: `Inter-Hospital Transfer finalized from #${trf.fromHospitalCode} to #${session.hospitalCode}. Previous records: ${trf.previousRecordsSummary}. Doctor decision: ${trf.doctorDecisionNotes}`,
            tags: ['Inter-Hospital Transfer', `#${trf.fromHospitalCode}`],
          },
        ],
      };

      setPatients((prev) => [admittedPatient, ...prev]);
      setSelectedPatientId(admittedPatient.id);
      setTransfers((prev) =>
        prev.map((t) =>
          t.id === transferId ? { ...t, status: 'Admitted to Hospital' } : t
        )
      );
    },
    [transfers, session.hospitalCode, session.userName]
  );

  // Execute pending action handler
  const handleExecuteAction = useCallback(
    (actionId: string) => {
      setPatients((prev) =>
        executePendingAction(prev, selectedPatientId, actionId, session.userName)
      );
    },
    [selectedPatientId, session.userName]
  );

  // Add new pending action
  const handleAddAction = useCallback(
    (actionData: {
      title: string;
      type: PendingAction['type'];
      description: string;
      urgency: PendingAction['urgency'];
    }) => {
      setPatients((prev) =>
        addNewPendingAction(prev, selectedPatientId, {
          ...actionData,
          actor: session.userName,
        })
      );
    },
    [selectedPatientId, session.userName]
  );

  // Add clinical note
  const handleAddNote = useCallback(
    (noteData: { type: ClinicalNote['type']; content: string; tags?: string[] }) => {
      setPatients((prev) =>
        addClinicalNote(prev, selectedPatientId, {
          ...noteData,
          author: session.userName,
        })
      );
    },
    [selectedPatientId, session.userName]
  );

  // Acknowledge lab report
  const handleAcknowledgeReport = useCallback(
    (reportId: string) => {
      setPatients((prev) =>
        prev.map((pat) => {
          if (pat.id !== selectedPatientId) return pat;
          return {
            ...pat,
            labReports: pat.labReports.map((lab) => {
              if (lab.id !== reportId) return lab;
              return { ...lab, acknowledged: true };
            }),
          };
        })
      );
      if (activeReportForModal && activeReportForModal.id === reportId) {
        setActiveReportForModal((prev) => (prev ? { ...prev, acknowledged: true } : null));
      }
    },
    [selectedPatientId, activeReportForModal]
  );

  // Quick Refill trigger from Adherence Tracker
  const handleQuickRefill = useCallback(
    (medName: string) => {
      handleAddAction({
        title: `Approve 90-Day Refill & Adherence Sync: ${medName}`,
        type: 'refill',
        description: `Refill authorization generated via Pharmacy Refill Adherence Tracker.`,
        urgency: 'urgent',
      });
    },
    [handleAddAction]
  );

  // Save SOAP note directly to chart
  const handleSaveSoapToNotes = useCallback(
    (soapText: string) => {
      handleAddNote({
        type: 'SOAP',
        content: soapText,
        tags: ['AI Co-Pilot', 'SOAP Synthesis'],
      });
      setIsNotesHistoryOpen(true);
    },
    [handleAddNote]
  );

  // Authorize safe medication order from Clinical Safety Guardrail Simulator
  const handleAuthorizeMedicationOrder = useCallback(
    (
      patientId: string,
      newMedication: Medication,
      orderAction: {
        title: string;
        type: PendingAction['type'];
        description: string;
        urgency: PendingAction['urgency'];
      }
    ) => {
      setPatients((prev) =>
        prev.map((pat) => {
          if (pat.id !== patientId) return pat;
          return {
            ...pat,
            medications: [newMedication, ...pat.medications],
          };
        })
      );
      handleAddAction(orderAction);
    },
    [handleAddAction]
  );

  // Commit structured SBAR Shift Handoff Packet to Patient Chart & Pending Queue
  const handleCommitSbarHandoff = useCallback(
    (
      noteData: { type: ClinicalNote['type']; content: string; tags?: string[] },
      actionData: {
        title: string;
        type: PendingAction['type'];
        description: string;
        urgency: PendingAction['urgency'];
      }
    ) => {
      handleAddNote(noteData);
      handleAddAction(actionData);
    },
    [handleAddNote, handleAddAction]
  );

  // Download single patient audit report
  const handleDownloadPatientAudit = useCallback(
    (pat: Patient) => {
      downloadPatientAuditReport(pat, session.hospitalCode, session.hospitalName);
    },
    [session.hospitalCode, session.hospitalName]
  );

  // Download master hospital audit JSON
  const handleDownloadMasterAuditBundle = useCallback(() => {
    downloadHospitalMasterAuditJson(patients, session.hospitalCode, session.hospitalName);
  }, [patients, session.hospitalCode, session.hospitalName]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (['1', '2', '3', '4', '5'].includes(e.key)) {
        const index = parseInt(e.key, 10) - 1;
        if (patients[index]) {
          setSelectedPatientId(patients[index].id);
        }
      }

      if (e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        setOnlyAbnormalLabs((prev) => !prev);
      }

      if (e.altKey && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        setOnlyUrgentActions((prev) => !prev);
      }

      if (e.altKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        setQuickAddInitialNote('');
        setIsQuickAddOpen(true);
      }

      if ((e.altKey && (e.key === 'k' || e.key === 'K')) || e.key === '?') {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      }

      if (e.key === 'Escape') {
        setActiveReportForModal(null);
        setIsQuickAddOpen(false);
        setIsNotesHistoryOpen(false);
        setIsShortcutsOpen(false);
        setIsSoapModalOpen(false);
        setIsLoginPortalOpen(false);
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [patients]);

  // Select or jump to a step in the 5-Step Live Guided Story
  const handleSelectStoryStep = useCallback(
    (stepNumber: number) => {
      setActiveStoryStep(stepNumber);
      const stepConfig = LIVE_DEMO_STORY_STEPS.find((s) => s.stepNumber === stepNumber);
      if (stepConfig && session.role !== stepConfig.role) {
        handleSwitchRole(stepConfig.role);
      }
      setSelectedPatientId('pat-002');
    },
    [session.role, handleSwitchRole]
  );

  // Execute the live clinical & governance actions for each step of the Demo Story
  const handleExecuteStoryStep = useCallback(
    (stepNumber: number) => {
      const targetPatientId = 'pat-002'; // Marcus Thorne (67y Male, MRN #39104)
      setSelectedPatientId(targetPatientId);

      if (stepNumber === 1) {
        // Step 1: Switch to Care Taker, flag Marcus Thorne as Emergency, dispatch automated Gmail SOS
        handleSwitchRole('caretaker');
        handleUpdateStatus(targetPatientId, 'Emergency');
        mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (stepNumber === 2) {
        // Step 2: Switch to Doctor, acknowledge SOS alert, select Marcus Thorne & inspect Lab Deltas
        handleSwitchRole('doctor');
        setRosterStatusFilters([]);
        const unack = emergencyAlerts.find((a) => !a.acknowledgedByDoctor);
        if (unack) {
          handleAcknowledgeEmergency(unack.id, targetPatientId);
        } else {
          handleUpdateStatus(targetPatientId, 'In-Consultation');
        }
        setTableTab('labs');
        setOnlyAbnormalLabs(true);
        setTimeout(() => {
          bottomSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      } else if (stepNumber === 3) {
        // Step 3: Open AI Clinical Co-Pilot SOAP Synthesis with Inline PII Tokenization & Prompt Firewall
        handleSwitchRole('doctor');
        setIsSoapModalOpen(true);
      } else if (stepNumber === 4) {
        // Step 4: Commit SOAP & Execute Physician Sign-Off with Care Taker Directives
        handleSwitchRole('doctor');
        setIsSoapModalOpen(false);
        handleSignOffPatient(
          targetPatientId,
          'Acute NSTEMI stabilization protocol verified; Troponin delta reviewed and cath lab standby confirmed.',
          'Continue 12-lead ECG monitoring every 30m, maintain IV heparin infusion, and prepare transfer dossier.'
        );
        setTimeout(() => {
          mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }, 120);
      } else if (stepNumber === 5) {
        // Step 5: Switch to Hospital Admin, view Real-Time Sign-Off Velocity D3 & AI Defense Enclave
        handleSwitchRole('admin');
        setTimeout(() => {
          mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }, 120);
      }

      setCompletedStorySteps((prev) =>
        prev.includes(stepNumber) ? prev : [...prev, stepNumber]
      );
    },
    [
      handleSwitchRole,
      handleUpdateStatus,
      emergencyAlerts,
      handleAcknowledgeEmergency,
      handleSignOffPatient,
    ]
  );

  // Show Common Login Page (Hospital ID, Role, Email & Password) before entering role dashboards
  if (!isAuthenticated) {
    return (
      <CommonLoginPage
        initialSession={session}
        onAuthenticate={(newSession) => {
          setSession(newSession);
          setIsAuthenticated(true);
        }}
        onLaunchLiveStory={() => {
          setIsAuthenticated(true);
          setIsLiveStoryOpen(true);
          setActiveStoryStep(1);
          setCompletedStorySteps([]);
          handleSwitchRole('caretaker');
          setSelectedPatientId('pat-002');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-900 flex overflow-hidden relative selection:bg-[#0D9488] selection:text-white">
      {/* A. Left Deep Obsidian Navy Sidebar Navigation (Desktop) */}
      <div className="hidden lg:block h-screen sticky top-0 z-30">
        <VisionSidebar
          activeTab={activeNavTab}
          onSelectTab={handleSelectNavTab}
          onGenerateSoapSummary={() => setIsSoapModalOpen(true)}
          pendingActionsCount={pendingActionsCount}
          abnormalLabsCount={abnormalLabsCount}
          session={session}
          onOpenLoginPortal={() => setIsAuthenticated(false)}
        />
      </div>

      {/* Mobile Responsive Sidebar Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative z-10 h-full">
            <VisionSidebar
              activeTab={activeNavTab}
              onSelectTab={handleSelectNavTab}
              onGenerateSoapSummary={() => {
                setIsMobileMenuOpen(false);
                setIsSoapModalOpen(true);
              }}
              pendingActionsCount={pendingActionsCount}
              abnormalLabsCount={abnormalLabsCount}
              session={session}
              onOpenLoginPortal={() => {
                setIsMobileMenuOpen(false);
                setIsAuthenticated(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Right Main Viewport */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        {/* Global Command Bar with Facility Selector, Patient Search & 5-Patient Acuity Distribution */}
        <TopBar
          activePatient={activePatient}
          patients={patients}
          totalWaiting={totalWaiting}
          totalInConsultation={totalInConsultation}
          session={session}
          unacknowledgedEmergencyCount={unacknowledgedEmergencyCount}
          emailOutboxCount={emailLogs.length}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onSelectPatient={(id) => setSelectedPatientId(id)}
          onSelectFacility={handleSelectFacility}
          onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
          onOpenLoginPortal={() => setIsAuthenticated(false)}
          onOpenEmailOutbox={() => setIsEmailInspectorOpen(true)}
          onDownloadActiveAudit={() => handleDownloadPatientAudit(activePatient)}
          onOpenQuickAdd={() => {
            setQuickAddInitialNote('');
            setIsQuickAddOpen(true);
          }}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
          onResetDemoData={handleResetDemoData}
          onOpenAiSecurity={() => handleSelectNavTab('AI Security & PIM')}
          isLiveStoryOpen={isLiveStoryOpen}
          onToggleLiveStory={() => setIsLiveStoryOpen((prev) => !prev)}
        />

        {/* Guided 5-Step Live Demo Storyboard Controller */}
        <LiveDemoStoryBar
          isOpen={isLiveStoryOpen}
          activeStep={activeStoryStep}
          completedSteps={completedStorySteps}
          onSelectStep={handleSelectStoryStep}
          onExecuteCurrentStep={handleExecuteStoryStep}
          onResetStory={() => {
            handleResetDemoData();
            setIsLiveStoryOpen(true);
            setActiveStoryStep(1);
            setCompletedStorySteps([]);
            handleSwitchRole('caretaker');
            setSelectedPatientId('pat-002');
          }}
          onClose={() => setIsLiveStoryOpen(false)}
        />

        {/* Scrollable High-Density Analytics & Multi-Role Clinical Canvas */}
        <main
          ref={mainRef}
          className="flex-1 overflow-y-auto px-4 sm:px-6 py-5"
        >
          <div className="max-w-[1680px] mx-auto w-full space-y-5">
            {/* ROLE VIEW 1: CARE TAKER WORKSPACE */}
            {session.role === 'caretaker' && (
              <CaretakerWorkspace
                patients={patients}
                session={session}
                emergencyAlerts={emergencyAlerts}
                onAddPatientRecord={handleAddPatientRecord}
                onUpdateStatus={handleUpdateStatus}
                onAllotSpecialist={handleAllotSpecialist}
                onTriggerEmergencyAlert={handleTriggerEmergencyAlert}
                onDownloadAudit={handleDownloadPatientAudit}
                onSelectPatientForDoctorView={(id) => {
                  setSelectedPatientId(id);
                  setIsNotesHistoryOpen(true);
                }}
              />
            )}

            {/* ROLE VIEW 2: HOSPITAL ADMIN WORKSPACE */}
            {session.role === 'admin' && (
              <AdminHospitalWorkspace
                patients={patients}
                session={session}
                transfers={transfers}
                emergencyAlerts={emergencyAlerts}
                onInitiateOutboundTransfer={handleInitiateOutboundTransfer}
                onForwardTransferToDoctor={handleForwardTransferToDoctor}
                onAdminFinalizeTransferAdmission={handleAdminFinalizeTransferAdmission}
                onDownloadPatientAudit={handleDownloadPatientAudit}
                onDownloadMasterAuditBundle={handleDownloadMasterAuditBundle}
              />
            )}

            {/* ROLE VIEW 3: DOCTOR ANALYTICS & SIGN-OFF DASHBOARD */}
            {session.role === 'doctor' && (
              <>
                {/* Centered 5-Patient Active Queue Panel Row — Uniform 5-Column Grid with Multi-Select Status Filter */}
                <section
                  ref={queueSectionRef}
                  aria-label="5-Patient Active Triage Roster"
                  className="vision-card p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3.5 px-1">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                            Active Patient Queue Roster ({filteredRosterPatients.length}/{patients.length} Shown)
                          </h2>
                          {rosterStatusFilters.length > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-teal-50 border border-teal-200 text-[10px] font-mono font-bold text-teal-800">
                              {rosterStatusFilters.length} Filter{rosterStatusFilters.length > 1 ? 's' : ''} Active
                            </span>
                          )}
                          {searchQuery.trim() && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-300 text-[10px] font-mono font-bold text-slate-700">
                              Query: "{searchQuery.trim()}"
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                          Multi-select status pills to slice the active queue or press keys <strong className="text-teal-700">1–5</strong>
                        </p>
                      </div>
                    </div>

                    {/* Interactive Multi-Select Pill Filter (Waiting, In-Consultation, Emergency, Done) */}
                    <div
                      role="group"
                      aria-label="Filter Active Patient Queue by Status (Multi-Select)"
                      className="flex flex-wrap items-center gap-1.5"
                    >
                      <button
                        type="button"
                        onClick={() => setRosterStatusFilters([])}
                        aria-pressed={rosterStatusFilters.length === 0}
                        className={`h-7 px-2.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                          rosterStatusFilters.length === 0
                            ? 'bg-[#0B1221] text-white border-[#0B1221] shadow-xs'
                            : 'bg-slate-50 text-slate-600 hover:text-slate-900 border-slate-200'
                        }`}
                      >
                        <span>All</span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-extrabold ${
                            rosterStatusFilters.length === 0
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {patients.length}
                        </span>
                      </button>

                      {(
                        [
                          {
                            status: 'Waiting' as AppointmentStatus,
                            label: 'Waiting',
                            count: patients.filter((p) => p.appointmentStatus === 'Waiting').length,
                            activeClass:
                              'bg-amber-50 text-amber-900 border-amber-400 ring-1 ring-amber-400',
                            dotClass: 'bg-amber-500',
                          },
                          {
                            status: 'In-Consultation' as AppointmentStatus,
                            label: 'In-Consultation',
                            count: patients.filter((p) => p.appointmentStatus === 'In-Consultation')
                              .length,
                            activeClass:
                              'bg-teal-50 text-teal-900 border-[#0D9488] ring-1 ring-[#0D9488]',
                            dotClass: 'bg-[#0D9488]',
                          },
                          {
                            status: 'Emergency' as AppointmentStatus,
                            label: 'Emergency',
                            count: patients.filter((p) => p.appointmentStatus === 'Emergency')
                              .length,
                            activeClass:
                              'bg-red-50 text-red-900 border-red-400 ring-1 ring-red-400',
                            dotClass: 'bg-red-600',
                          },
                          {
                            status: 'Done' as AppointmentStatus,
                            label: 'Done',
                            count: patients.filter((p) => p.appointmentStatus === 'Done').length,
                            activeClass:
                              'bg-emerald-50 text-emerald-900 border-emerald-400 ring-1 ring-emerald-400',
                            dotClass: 'bg-emerald-600',
                          },
                        ] as const
                      ).map((pill) => {
                        const isSelected = rosterStatusFilters.includes(pill.status);
                        return (
                          <button
                            key={pill.status}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => toggleRosterStatusFilter(pill.status)}
                            className={`h-7 px-2.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                              isSelected
                                ? pill.activeClass
                                : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${pill.dotClass}`}
                            />
                            <span>{pill.label}</span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-extrabold ${
                                isSelected
                                  ? 'bg-slate-900/10 text-slate-900'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {pill.count}
                            </span>
                          </button>
                        );
                      })}

                      {(rosterStatusFilters.length > 0 || searchQuery.trim()) && (
                        <button
                          type="button"
                          onClick={() => {
                            setRosterStatusFilters([]);
                            setSearchQuery('');
                          }}
                          className="h-7 px-2 rounded-lg text-[10px] font-mono font-bold text-red-700 hover:text-white bg-red-50 hover:bg-red-600 border border-red-200 transition-all cursor-pointer whitespace-nowrap"
                          title="Clear all status and search filters"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {filteredRosterPatients.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-stretch">
                      {filteredRosterPatients.slice(0, 5).map((pat) => {
                        const queueIndex = patients.findIndex((p) => p.id === pat.id);
                        const isSelected = pat.id === activePatient.id;
                        const avatar = getPatientAvatarConfig(
                          pat.mrn,
                          pat.demographics.firstName,
                          pat.demographics.lastName,
                          pat.mrn
                        );
                        const statusStyle =
                          pat.appointmentStatus === 'Emergency'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : pat.appointmentStatus === 'Waiting'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : pat.appointmentStatus === 'In-Consultation'
                            ? 'bg-teal-50 text-teal-800 border-teal-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200';

                        return (
                          <button
                            key={pat.id}
                            type="button"
                            onClick={() => setSelectedPatientId(pat.id)}
                            className={`group relative flex flex-col items-center justify-between text-center p-3.5 rounded-xl border transition-all cursor-pointer h-full ${
                              isSelected
                                ? 'bg-teal-50/60 border-[#0D9488] ring-2 ring-[#0D9488]/30 shadow-xs'
                                : 'bg-slate-50/70 hover:bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {/* Top Row: Key Shortcut Badge & Status Pill */}
                            <div className="w-full flex items-center justify-between gap-1.5 mb-2">
                              <span className="w-5 h-5 rounded bg-white border border-slate-200 text-[10px] font-mono font-bold text-slate-600 flex items-center justify-center shrink-0">
                                #{queueIndex >= 0 ? queueIndex + 1 : 1}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border truncate ${statusStyle}`}
                              >
                                {pat.appointmentStatus}
                              </span>
                            </div>

                            {/* Centered Patient Avatar, Name, Age/Gender & MRN */}
                            <div className="flex flex-col items-center justify-center my-1 min-w-0 w-full">
                              <div
                                className={`w-10 h-10 rounded-lg bg-gradient-to-tr ${avatar.gradientClass} flex items-center justify-center text-white font-extrabold text-xs shadow-xs mb-2 ring-2 ${
                                  isSelected ? 'ring-[#0D9488]' : 'ring-white'
                                }`}
                              >
                                {avatar.initials}
                              </div>
                              <div className="flex items-center justify-center gap-1.5 max-w-full">
                                <span className="text-xs font-extrabold text-slate-900 truncate">
                                  {pat.demographics.firstName} {pat.demographics.lastName}
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-800 text-[10px] font-mono font-bold shrink-0">
                                  {pat.demographics.age}y · {pat.demographics.gender}
                                </span>
                              </div>
                              <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-teal-700 font-semibold mt-1">
                                <span>MRN #{pat.mrn}</span>
                                <span className="text-slate-300">|</span>
                                <span className="text-slate-600">
                                  {pat.demographics.age} yrs, {pat.demographics.gender}
                                </span>
                              </div>
                            </div>

                            {/* Bottom Centered Slot & Stability Footnote */}
                            <div className="w-full pt-2 mt-2 border-t border-slate-200/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
                              <span>{pat.timeSlot}</span>
                              <span className="text-slate-900 font-bold">
                                BP {pat.vitals.systolic}/{pat.vitals.diastolic}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                      <div className="text-slate-600">
                        No patients in the active queue match the selected filter(s):{' '}
                        <strong className="text-slate-900 font-mono">
                          {[...rosterStatusFilters, searchQuery].filter(Boolean).join(', ')}
                        </strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setRosterStatusFilters([]);
                          setSearchQuery('');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#0B1221] text-white font-bold text-xs cursor-pointer whitespace-nowrap"
                      >
                        Reset Queue Filters
                      </button>
                    </div>
                  )}
                </section>

                {/* Doctor Sign-Off, Caretaker Directives, Emergency SOS Response & Incoming Transfer Review */}
                <DoctorSignOffCard
                  patient={activePatient}
                  hospitalCode={session.hospitalCode}
                  hospitalName={session.hospitalName}
                  doctorName={session.userName}
                  emergencyAlerts={emergencyAlerts}
                  forwardedTransfers={forwardedTransfersForDoctor}
                  onSignOffPatient={handleSignOffPatient}
                  onDownloadAudit={handleDownloadPatientAudit}
                  onAcknowledgeEmergency={handleAcknowledgeEmergency}
                  onDoctorDecideTransfer={handleDoctorDecideTransfer}
                />

                {/* B. Top Row — 4 KPI Cards */}
                <VisionKpiCards
                  patients={patients}
                  activePatient={activePatient}
                  onCardClick={(section) => handleSelectNavTab(section)}
                />

                {/* C. Second Row — 3-Card Hero & Circular Visuals Grid (5 : 3.5 : 3.5 split via 24-col grid) */}
                <div
                  ref={patientSummaryRef}
                  className="grid grid-cols-1 lg:grid-cols-12 xl:grid-cols-24 gap-4 items-stretch"
                >
                  {/* Col 1 (5/12 = 10/24 cols): Active Patient Hero & Basic History Card */}
                  <div className="lg:col-span-12 xl:col-span-10 flex flex-col">
                    <VisionPatientHeroCard
                      patient={activePatient}
                      onUpdateStatus={handleUpdateStatus}
                      onOpenNotes={() => setIsNotesHistoryOpen(true)}
                    />
                  </div>

                  {/* Col 2 (3.5/12 = 7/24 cols): Interactive Clinical Pie / Donut Chart Card */}
                  <div className="lg:col-span-6 xl:col-span-7 flex flex-col">
                    <VisionLabDonutCard patient={activePatient} />
                  </div>

                  {/* Col 3 (3.5/12 = 7/24 cols): Clinical Stability & Triage Score Card (Radial Ring Gauge) */}
                  <div className="lg:col-span-6 xl:col-span-7 flex flex-col">
                    <VisionStabilityScoreCard patient={activePatient} />
                  </div>
                </div>

                {/* Clinical Pharmacovigilance Guardrail, Rx Contraindication Simulator & SBAR Shift Handoff Engine */}
                <ClinicalSafetyGuardrailCard
                  patient={activePatient}
                  doctorName={session.userName}
                  hospitalCode={session.hospitalCode}
                  onAuthorizeMedicationOrder={handleAuthorizeMedicationOrder}
                  onCommitSbarHandoff={handleCommitSbarHandoff}
                />

                {/* Doctor Role Cohort Criticality & Sign-Off Velocity Charts */}
                <DoctorRoleCharts
                  patients={patients}
                  activePatient={activePatient}
                  onSelectPatient={(id) => setSelectedPatientId(id)}
                />

                {/* D. Third Row — Graphical Trend Waves & Clinical Heatmap (7 : 5 split) */}
                <div
                  ref={heatmapSectionRef}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch"
                >
                  {/* Left Card (7 cols): Vitals & Biomarker Trajectory (Smooth Dual Area Wave Chart) */}
                  <div className="lg:col-span-7 flex flex-col">
                    <VisionVitalsTrajectoryCard patient={activePatient} />
                  </div>

                  {/* Right Card (5 cols): Patient Organ-System Risk & Clinic Acuity Heatmap */}
                  <div className="lg:col-span-5 flex flex-col">
                    <VisionOrganHeatmapCard patient={activePatient} />
                  </div>
                </div>

                {/* E. Bottom Row — Appointments/Reports Table & Pending Actions Timeline (8 : 4 split) */}
                <div
                  ref={bottomSectionRef}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch pb-6"
                >
                  {/* Left Card (8 cols): Interactive Switchable Clinical Table */}
                  <div className="lg:col-span-8 flex flex-col">
                    <VisionSwitchableTableCard
                      patients={patients}
                      activePatient={activePatient}
                      onSelectPatient={(id) => setSelectedPatientId(id)}
                      onSelectLabReport={(report) => setActiveReportForModal(report)}
                      onQuickRefill={handleQuickRefill}
                      onlyAbnormalLabs={onlyAbnormalLabs}
                      onToggleOnlyAbnormalLabs={() => setOnlyAbnormalLabs((prev) => !prev)}
                      onDownloadAuditRecord={handleDownloadPatientAudit}
                      externalTab={tableTab}
                      onTabChange={setTableTab}
                    />
                  </div>

                  {/* Right Card (4 cols): Pending Actions & One-Click Sign-Offs Vertical Timeline */}
                  <div className="lg:col-span-4 flex flex-col">
                    <VisionPendingTimelineCard
                      patient={activePatient}
                      onlyUrgent={onlyUrgentActions}
                      onToggleOnlyUrgent={() => setOnlyUrgentActions((prev) => !prev)}
                      onExecuteAction={handleExecuteAction}
                      onOpenQuickAdd={() => {
                        setQuickAddInitialNote('');
                        setIsQuickAddOpen(true);
                      }}
                    />
                  </div>
                </div>

                {/* F. AI Security, PIM/PAM & Supply Chain Defense Operations Center */}
                <div ref={aiSecuritySectionRef} className="pb-8">
                  <AiSecurityOperationsCenter session={session} />
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      <HospitalLoginModal
        isOpen={isLoginPortalOpen}
        currentSession={session}
        onLogin={(newSession) => setSession(newSession)}
        onClose={() => setIsLoginPortalOpen(false)}
      />

      <LabReportModal
        report={activeReportForModal}
        patient={activePatient}
        onClose={() => setActiveReportForModal(null)}
        onAcknowledge={handleAcknowledgeReport}
      />

      <QuickAddModal
        isOpen={isQuickAddOpen}
        patient={activePatient}
        initialNoteText={quickAddInitialNote}
        onClose={() => {
          setIsQuickAddOpen(false);
          setQuickAddInitialNote('');
        }}
        onAddAction={handleAddAction}
        onAddNote={handleAddNote}
      />

      <NotesHistoryModal
        isOpen={isNotesHistoryOpen}
        patient={activePatient}
        onClose={() => setIsNotesHistoryOpen(false)}
        onOpenQuickAdd={() => {
          setQuickAddInitialNote('');
          setIsQuickAddOpen(true);
        }}
      />

      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      <SoapSummaryModal
        isOpen={isSoapModalOpen}
        patient={activePatient}
        onClose={() => setIsSoapModalOpen(false)}
        onSaveSoapToNotes={handleSaveSoapToNotes}
      />

      <EmailDeliveryInspectorModal
        isOpen={isEmailInspectorOpen}
        emailLogs={emailLogs}
        activePatient={activePatient}
        onClose={() => setIsEmailInspectorOpen(false)}
        onTriggerManualEmergencyEmail={handleTriggerManualEmergencyEmail}
      />

      {/* Live Automated Email Dispatch Toast Notification */}
      {latestAutoEmailToast && (
        <div className="fixed bottom-5 right-5 z-50 w-full max-w-md rounded-xl bg-[#0B1221] border-2 border-[#0D9488] shadow-2xl p-4 text-xs text-white">
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                  <span className="font-bold text-white">
                    Automated Emergency Email Dispatched!
                  </span>
                </div>
                <span className="text-[10px] font-mono text-teal-300">
                  {latestAutoEmailToast.smtpResponse}
                </span>
              </div>
            </div>

            <button
              onClick={() => setLatestAutoEmailToast(null)}
              className="text-slate-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-2.5 p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1 text-[11px]">
            <div>
              <span className="text-slate-400">Physician Email: </span>
              <strong className="text-teal-300 font-mono">
                {latestAutoEmailToast.recipientDoctorName} &lt;
                {latestAutoEmailToast.recipientEmail}&gt;
              </strong>
            </div>
            <div>
              <span className="text-slate-400">Patient Flagged: </span>
              <strong className="text-white">
                {latestAutoEmailToast.patientName} (MRN #{latestAutoEmailToast.patientMrn})
              </strong>
            </div>
            <div className="text-[10px] font-mono text-amber-400 truncate">
              Vitals: {latestAutoEmailToast.vitalsSummary}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              onClick={() => {
                setIsEmailInspectorOpen(true);
                setLatestAutoEmailToast(null);
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] cursor-pointer whitespace-nowrap"
            >
              Inspect SMTP Payload
            </button>
            <a
              href={latestAutoEmailToast.gmailComposeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-[11px] flex items-center gap-1 whitespace-nowrap"
            >
              <span>Open Gmail</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
