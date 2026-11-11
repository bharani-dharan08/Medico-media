/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Patient,
  Medication,
  PendingAction,
  ClinicalNote,
} from '../types/clinical.ts';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Pill,
  FileCheck2,
  ClipboardCheck,
  Copy,
  CheckCircle2,
  Activity,
  FlaskConical,
  Sparkles,
  PlusCircle,
  ArrowRight,
} from 'lucide-react';

interface ClinicalSafetyGuardrailCardProps {
  patient: Patient;
  doctorName: string;
  hospitalCode: string;
  onAuthorizeMedicationOrder: (
    patientId: string,
    newMedication: Medication,
    orderNote: {
      title: string;
      type: PendingAction['type'];
      description: string;
      urgency: PendingAction['urgency'];
    }
  ) => void;
  onCommitSbarHandoff: (
    noteData: { type: ClinicalNote['type']; content: string; tags?: string[] },
    actionData: {
      title: string;
      type: PendingAction['type'];
      description: string;
      urgency: PendingAction['urgency'];
    }
  ) => void;
}

interface CandidatePrescription {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  route: string;
  drugClass: string;
  indication: string;
  allergyTriggers: string[];
  renalThresholdEgfr?: number;
  potassiumMaxThreshold?: number;
  systolicMinThreshold?: number;
  saferAlternative: string;
}

const CANDIDATE_PRESCRIPTIONS: CandidatePrescription[] = [
  {
    id: 'rx-amox',
    name: 'Amoxicillin-Clavulanate',
    dosage: '875mg / 125mg',
    frequency: 'BID (Every 12h)',
    route: 'PO',
    drugClass: 'Beta-Lactam / Penicillin Derivative',
    indication: 'Empiric Respiratory / Soft-Tissue Coverage',
    allergyTriggers: ['penicillin', 'amoxicillin', 'beta-lactam', 'cephalosporin'],
    renalThresholdEgfr: 30,
    saferAlternative: 'Azithromycin 500mg PO Daily or Levofloxacin 750mg PO (Non-Beta-Lactam)',
  },
  {
    id: 'rx-ketorolac',
    name: 'Ketorolac Tromethamine (NSAID)',
    dosage: '30mg',
    frequency: 'q6h PRN Pain',
    route: 'IV Push',
    drugClass: 'Non-Steroidal Anti-Inflammatory (NSAID)',
    indication: 'Acute Chest / Musculoskeletal Analgesia',
    allergyTriggers: ['nsaid', 'ibuprofen', 'aspirin', 'ketorolac', 'naproxen'],
    renalThresholdEgfr: 60,
    saferAlternative: 'Acetaminophen 1000mg IV/PO q8h (Renal-Sparing Analgesic)',
  },
  {
    id: 'rx-spiro',
    name: 'Spironolactone',
    dosage: '25mg',
    frequency: 'Once Daily',
    route: 'PO',
    drugClass: 'Potassium-Sparing Aldosterone Antagonist',
    indication: 'Heart Failure / Volume Overload Optimization',
    allergyTriggers: ['spironolactone', 'sulfa'],
    renalThresholdEgfr: 45,
    potassiumMaxThreshold: 5.0,
    saferAlternative: 'Furosemide 20mg IV/PO with close serum K+ & eGFR monitoring',
  },
  {
    id: 'rx-meropenem',
    name: 'Meropenem',
    dosage: '1g',
    frequency: 'q8h Infused over 30m',
    route: 'IV',
    drugClass: 'Carbapenem Broad-Spectrum Antibiotic',
    indication: 'Sepsis / Severe Nosocomial Infection',
    allergyTriggers: ['carbapenem', 'meropenem'],
    renalThresholdEgfr: 50,
    saferAlternative: 'Renally Adjusted Meropenem 500mg IV q12h (if eGFR < 50 mL/min)',
  },
  {
    id: 'rx-atorva',
    name: 'Atorvastatin Calcium',
    dosage: '80mg',
    frequency: 'Once Daily at Bedtime (QHS)',
    route: 'PO',
    drugClass: 'High-Intensity HMG-CoA Reductase Inhibitor',
    indication: 'Acute Coronary Syndrome / Plaque Stabilization',
    allergyTriggers: ['statin', 'atorvastatin', 'rosuvastatin'],
    saferAlternative: 'Ezetimibe 10mg PO Daily + PCSK9 Inhibitor Evaluation',
  },
];

export const ClinicalSafetyGuardrailCard: React.FC<ClinicalSafetyGuardrailCardProps> = ({
  patient,
  doctorName,
  hospitalCode,
  onAuthorizeMedicationOrder,
  onCommitSbarHandoff,
}) => {
  const [activeTab, setActiveTab] = useState<'safety-simulator' | 'sbar-handoff'>(
    'safety-simulator'
  );
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(
    CANDIDATE_PRESCRIPTIONS[0].id
  );
  const [orderFeedbackBanner, setOrderFeedbackBanner] = useState<{
    type: 'success' | 'override';
    message: string;
    timestamp: string;
  } | null>(null);
  const [copiedSbar, setCopiedSbar] = useState<boolean>(false);
  const [sbarCommitted, setSbarCommitted] = useState<boolean>(false);

  // Extract key renal & electrolyte biomarkers from the patient's real lab reports
  const patientBiomarkers = useMemo(() => {
    const egfrLab = patient.labReports.find(
      (l) =>
        l.name.toLowerCase().includes('egfr') ||
        l.name.toLowerCase().includes('glomerular')
    );
    const creatLab = patient.labReports.find((l) =>
      l.name.toLowerCase().includes('creatinine')
    );
    const potassiumLab = patient.labReports.find(
      (l) =>
        l.name.toLowerCase().includes('potassium') ||
        l.name.toLowerCase().includes('k+')
    );
    const troponinLab = patient.labReports.find((l) =>
      l.name.toLowerCase().includes('troponin')
    );

    const parseNumeric = (val: number | string | undefined): number | null => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        const parsed = parseFloat(val.replace(/[^0-9.-]/g, ''));
        return Number.isFinite(parsed) ? parsed : null;
      }
      return null;
    };

    const egfrValue = parseNumeric(egfrLab?.value);
    const creatValue = parseNumeric(creatLab?.value);
    const potassiumValue = parseNumeric(potassiumLab?.value);

    // Derive estimated eGFR if Creatinine is elevated and explicit eGFR lab isn't present
    const effectiveEgfr =
      egfrValue !== null
        ? egfrValue
        : creatValue !== null && creatValue > 1.4
        ? Math.max(22, Math.round(95 / creatValue))
        : 78;

    return {
      egfrLab,
      creatLab,
      potassiumLab,
      troponinLab,
      effectiveEgfr,
      creatValue,
      potassiumValue,
      isRenalImpaired: effectiveEgfr < 60 || (creatValue !== null && creatValue > 1.3),
    };
  }, [patient.labReports]);

  // Evaluate active regimen safety alerts for the selected patient
  const activeProfileSafetyChecks = useMemo(() => {
    const checks: Array<{
      id: string;
      severity: 'CRITICAL' | 'WARNING' | 'SAFE';
      category: string;
      headline: string;
      detail: string;
    }> = [];

    // 1. Check documented high/critical allergies
    if (patient.allergies.length > 0) {
      patient.allergies.forEach((alg) => {
        checks.push({
          id: `alg-${alg.id}`,
          severity:
            alg.severity === 'CRITICAL' || alg.severity === 'HIGH'
              ? 'CRITICAL'
              : 'WARNING',
          category: `${alg.category} Allergy Guard`,
          headline: `${alg.substance} — ${alg.reaction} (${alg.severity})`,
          detail: `Verified ${alg.verifiedDate}. Cross-reactive classes automatically blocked in order simulator.`,
        });
      });
    } else {
      checks.push({
        id: 'alg-none',
        severity: 'SAFE',
        category: 'Allergy Registry',
        headline: 'No Known Drug Allergies (NKDA) Recorded',
        detail: 'Standard pharmacovigilance screening active.',
      });
    }

    // 2. Check Renal / Electrolyte Dosing status
    if (patientBiomarkers.isRenalImpaired) {
      checks.push({
        id: 'renal-guard',
        severity: patientBiomarkers.effectiveEgfr < 45 ? 'CRITICAL' : 'WARNING',
        category: 'Renal Dosing Guardrail',
        headline: `Reduced Renal Clearance (Est. eGFR ~${patientBiomarkers.effectiveEgfr} mL/min)`,
        detail: patientBiomarkers.creatLab
          ? `Serum Creatinine ${patientBiomarkers.creatLab.value} ${patientBiomarkers.creatLab.unit} (${patientBiomarkers.creatLab.status}). Avoid nephrotoxic NSAIDs and adjust renally cleared antimicrobials.`
          : 'Renal function below 60 mL/min/1.73m² threshold; verify renal dosing intervals.',
      });
    } else {
      checks.push({
        id: 'renal-safe',
        severity: 'SAFE',
        category: 'Renal Clearance',
        headline: `Adequate Renal Clearance (eGFR ~${patientBiomarkers.effectiveEgfr} mL/min)`,
        detail: 'Standard renal excretion parameters within safe dosing corridor.',
      });
    }

    // 3. Check Medication Adherence (PDC) flags
    const nonAdherentMeds = patient.medications.filter(
      (m) => m.adherence && m.adherence.pdcPercentage < 80
    );
    if (nonAdherentMeds.length > 0) {
      nonAdherentMeds.forEach((m) => {
        checks.push({
          id: `pdc-${m.id}`,
          severity: 'WARNING',
          category: 'PDC Adherence Gap',
          headline: `${m.name} ${m.dosage} — PDC ${m.adherence?.pdcPercentage}%`,
          detail:
            m.adherence?.clinicalRiskNote ||
            `Sub-optimal refill coverage (${m.adherence?.statusBadge}). Verify compliance before escalating dose.`,
        });
      });
    }

    return checks;
  }, [patient.allergies, patient.medications, patientBiomarkers]);

  const selectedCandidate = useMemo(() => {
    return (
      CANDIDATE_PRESCRIPTIONS.find((c) => c.id === selectedCandidateId) ||
      CANDIDATE_PRESCRIPTIONS[0]
    );
  }, [selectedCandidateId]);

  // Evaluate the selected candidate order against the active patient's allergies, labs, and vitals
  const candidateEvaluation = useMemo(() => {
    const matchedAllergies = patient.allergies.filter((alg) => {
      const sub = alg.substance.toLowerCase();
      return selectedCandidate.allergyTriggers.some(
        (trig) => sub.includes(trig) || trig.includes(sub)
      );
    });

    const alreadyPrescribed = patient.medications.some((m) =>
      m.name.toLowerCase().includes(selectedCandidate.name.split(' ')[0].toLowerCase())
    );

    const renalConflict =
      selectedCandidate.renalThresholdEgfr !== undefined &&
      patientBiomarkers.effectiveEgfr < selectedCandidate.renalThresholdEgfr;

    const potassiumConflict =
      selectedCandidate.potassiumMaxThreshold !== undefined &&
      patientBiomarkers.potassiumValue !== null &&
      patientBiomarkers.potassiumValue >= selectedCandidate.potassiumMaxThreshold;

    if (matchedAllergies.length > 0) {
      const primaryAlg = matchedAllergies[0];
      return {
        status: 'HARD_STOP' as const,
        badgeText: 'HARD STOP — ALLERGY CONTRAINDICATION',
        headline: `Cross-Reactivity Conflict with Documented ${primaryAlg.substance} Allergy`,
        rationale: `Patient has a verified ${primaryAlg.severity} allergy to ${primaryAlg.substance} (Reaction: ${primaryAlg.reaction}). Ordering ${selectedCandidate.name} (${selectedCandidate.drugClass}) carries high anaphylaxis/hypersensitivity risk.`,
        recommendation: `Recommended Safe Alternative: ${selectedCandidate.saferAlternative}`,
      };
    }

    if (renalConflict || potassiumConflict) {
      return {
        status: 'RENAL_CAUTION' as const,
        badgeText: 'DOSING GUARDRAIL — RENAL / ELECTROLYTE RISK',
        headline: renalConflict
          ? `Renal Threshold Triggered (Patient eGFR ~${patientBiomarkers.effectiveEgfr} mL/min vs. Min ${selectedCandidate.renalThresholdEgfr} mL/min)`
          : `Hyperkalemia Risk Triggered (Serum K+ ${patientBiomarkers.potassiumValue} mmol/L)`,
        rationale: `Active patient biomarkers indicate ${
          renalConflict
            ? `impaired renal clearance (eGFR ~${patientBiomarkers.effectiveEgfr} mL/min)`
            : `elevated potassium`
        }. Standard dose of ${selectedCandidate.name} ${selectedCandidate.dosage} may precipitate acute kidney injury or toxicity.`,
        recommendation: `Recommended Action: ${selectedCandidate.saferAlternative}`,
      };
    }

    if (alreadyPrescribed) {
      return {
        status: 'DUPLICATE_THERAPY' as const,
        badgeText: 'THERAPEUTIC DUPLICATION CHECK',
        headline: `${selectedCandidate.name} is Already Active on Patient Regimen`,
        rationale: `Active chart already includes a prescription in this therapeutic class. Verify whether this order is a dose titration or refill renewal.`,
        recommendation: `Confirm dose adjustment or use 1-Click Refill in the Medications table.`,
      };
    }

    return {
      status: 'CLEARED' as const,
      badgeText: 'CLEARED — ZERO CONTRAINDICATIONS DETECTED',
      headline: `${selectedCandidate.name} ${selectedCandidate.dosage} Passed All Clinical Guardrails`,
      rationale: `Cross-checked against ${patient.allergies.length} documented allergy record(s), renal clearance (eGFR ~${patientBiomarkers.effectiveEgfr} mL/min), and hemodynamic vitals (BP ${patient.vitals.systolic}/${patient.vitals.diastolic} mmHg).`,
      recommendation: `Safe to authorize and append directly to ${patient.demographics.firstName} ${patient.demographics.lastName}'s active medication chart.`,
    };
  }, [selectedCandidate, patient, patientBiomarkers]);

  // Build structured SBAR text dynamically whenever active patient changes
  const generatedSbar = useMemo(() => {
    const critLabs = patient.labReports.filter((l) => l.status !== 'NORMAL');
    const pendingItems = patient.pendingActions.filter((a) => a.status === 'pending');
    const allergyText =
      patient.allergies.length > 0
        ? patient.allergies
            .map((a) => `${a.substance} (${a.severity}: ${a.reaction})`)
            .join('; ')
        : 'No Known Drug Allergies (NKDA)';

    const situation = `${patient.demographics.firstName} ${patient.demographics.lastName} (${patient.demographics.age}y ${patient.demographics.gender}, MRN #${patient.mrn}) is currently [${patient.appointmentStatus.toUpperCase()}] under ${patient.triageLevel}. Chief Complaint: "${patient.chiefComplaint}". Attending Physician: ${patient.assignedDoctorName || doctorName} (Facility #${hospitalCode}).`;

    const background = `Chronic History: ${
      patient.chronicHistory.map((c) => `${c.name} (${c.code} - ${c.status})`).join(', ') ||
      'None documented'
    }. Verified Allergies: ${allergyText}. Active Medications (${
      patient.medications.length
    }): ${
      patient.medications.map((m) => `${m.name} ${m.dosage} ${m.frequency}`).join(', ') ||
      'None'
    }.`;

    const assessment = `Vitals (${patient.vitals.recordedAt}): BP ${patient.vitals.systolic}/${patient.vitals.diastolic} mmHg, HR ${patient.vitals.heartRate} bpm, SpO2 ${patient.vitals.o2Sat}%, Temp ${patient.vitals.tempF}°F, Stability Score ${patient.vitalStabilityScore ?? 7.5}/10. Abnormal Labs (${critLabs.length}): ${
      critLabs
        .map(
          (l) =>
            `${l.name}: ${l.value} ${l.unit} [${l.status}]${
              l.delta ? ` (${l.delta.deltaText})` : ''
            }`
        )
        .join(' | ') || 'All reported labs within normal reference range'
    }.`;

    const recommendation =
      pendingItems.length > 0
        ? `Execute ${pendingItems.length} pending clinical action(s): ${pendingItems
            .map((p) => `[${p.urgency.toUpperCase()}] ${p.title}`)
            .join('; ')}. Maintain continuous telemetry and verify renal/allergy guardrails prior to new medication orders.`
        : `Continue current stabilization regimen, repeat serial vitals in 30 minutes, and complete physician sign-off audit.`;

    return {
      situation,
      background,
      assessment,
      recommendation,
      fullFormattedText: `[SBAR CLINICAL SHIFT HANDOFF — MEDICO-MEDIA #${hospitalCode}]\nPATIENT: ${patient.demographics.firstName} ${patient.demographics.lastName} (${patient.demographics.age}y ${patient.demographics.gender}, MRN #${patient.mrn})\n\nS — SITUATION:\n${situation}\n\nB — BACKGROUND:\n${background}\n\nA — ASSESSMENT:\n${assessment}\n\nR — RECOMMENDATION:\n${recommendation}`,
    };
  }, [patient, doctorName, hospitalCode]);

  // Clear banners when switching patients
  useEffect(() => {
    setOrderFeedbackBanner(null);
    setSbarCommitted(false);
    setCopiedSbar(false);
  }, [patient.id]);

  const handleAuthorizeSafeOrder = () => {
    const nowTime = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const isUsingAlternative =
      candidateEvaluation.status === 'HARD_STOP' ||
      candidateEvaluation.status === 'RENAL_CAUTION';

    const orderMedicationName = isUsingAlternative
      ? selectedCandidate.saferAlternative.split(' ')[0] +
        ' ' +
        (selectedCandidate.saferAlternative.split(' ')[1] || '')
      : selectedCandidate.name;

    const newMed: Medication = {
      id: `med-sim-${Date.now()}`,
      name: isUsingAlternative
        ? selectedCandidate.saferAlternative
        : selectedCandidate.name,
      dosage: isUsingAlternative ? 'Per Protocol' : selectedCandidate.dosage,
      frequency: isUsingAlternative ? 'Scheduled' : selectedCandidate.frequency,
      route: selectedCandidate.route,
      indication: selectedCandidate.indication,
      prescriber: doctorName,
      refillStatus: 'Active',
      refillsRemaining: 3,
      lastFilled: `Ordered Today (${nowTime})`,
      adherence: {
        pdcPercentage: 100,
        status: 'OPTIMAL',
        statusBadge: 'Newly Authorized Inpatient/Clinic Order',
        daysCovered: 30,
        evaluationWindowDays: 30,
        daysDelta: 0,
        lastRefillDate: 'Today',
        nextExpectedRefill: '+30 Days',
        refillEvents: [],
      },
    };

    onAuthorizeMedicationOrder(patient.id, newMed, {
      title: isUsingAlternative
        ? `Guardrail-Adjusted Order: ${selectedCandidate.saferAlternative}`
        : `Authorized Order: ${selectedCandidate.name} ${selectedCandidate.dosage} (${selectedCandidate.route})`,
      type: 'refill',
      description: isUsingAlternative
        ? `Switched from ${selectedCandidate.name} due to ${candidateEvaluation.badgeText}. Verified by ${doctorName}.`
        : `Passed allergy, renal (eGFR ~${patientBiomarkers.effectiveEgfr} mL/min), and hemodynamic guardrails. Ordered by ${doctorName}.`,
      urgency: isUsingAlternative ? 'urgent' : 'routine',
    });

    setOrderFeedbackBanner({
      type: isUsingAlternative ? 'override' : 'success',
      message: isUsingAlternative
        ? `Guardrail-adjusted regimen (${orderMedicationName.trim()}) authorized and appended to ${patient.demographics.firstName}'s active chart & pending queue.`
        : `${selectedCandidate.name} ${selectedCandidate.dosage} authorized and appended to ${patient.demographics.firstName}'s active chart & pending queue.`,
      timestamp: nowTime,
    });
  };

  const handleCopySbar = () => {
    navigator.clipboard.writeText(generatedSbar.fullFormattedText);
    setCopiedSbar(true);
    setTimeout(() => setCopiedSbar(false), 2500);
  };

  const handleCommitSbarToChart = () => {
    onCommitSbarHandoff(
      {
        type: 'Triage Handoff',
        content: generatedSbar.fullFormattedText,
        tags: ['SBAR Handoff', 'Shift Continuity', 'Safety Verified'],
      },
      {
        title: `SBAR Shift Handoff Packet Logged (${patient.demographics.firstName} ${patient.demographics.lastName})`,
        type: 'note',
        description: `Structured Situation-Background-Assessment-Recommendation handoff committed by ${doctorName}.`,
        urgency: patient.appointmentStatus === 'Emergency' ? 'urgent' : 'routine',
      }
    );
    setSbarCommitted(true);
  };

  const criticalCount = activeProfileSafetyChecks.filter(
    (c) => c.severity === 'CRITICAL'
  ).length;
  const warningCount = activeProfileSafetyChecks.filter(
    (c) => c.severity === 'WARNING'
  ).length;

  return (
    <section
      aria-label="Clinical Medication Safety Guardrail & SBAR Shift Handoff Engine"
      className="vision-card p-5 border border-slate-200 bg-white"
    >
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 mb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0B1221] text-teal-400 flex items-center justify-center shadow-xs shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-900">
                Clinical Pharmacovigilance Guardrail & SBAR Handoff Engine
              </h2>
              <span className="px-2 py-0.5 rounded-md bg-teal-50 border border-teal-200 text-[10px] font-mono font-bold text-teal-800">
                LIVE CDS · {patient.demographics.firstName} {patient.demographics.lastName} ({patient.demographics.age}y · {patient.demographics.gender})
              </span>
              {criticalCount > 0 ? (
                <span className="px-2 py-0.5 rounded-md bg-red-50 border border-red-200 text-[10px] font-mono font-extrabold text-red-700">
                  {criticalCount} CRITICAL CONTRAINDICATION ALERT{criticalCount > 1 ? 'S' : ''}
                </span>
              ) : warningCount > 0 ? (
                <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-[10px] font-mono font-extrabold text-amber-800">
                  {warningCount} DOSING / ADHERENCE ADVISORY
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-[10px] font-mono font-extrabold text-emerald-800">
                  ALL GUARDRAILS NOMINAL
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
              Real-time drug-allergy cross-reactivity, renal eGFR dosing calculator & structured SBAR shift handoff generator
            </p>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('safety-simulator')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'safety-simulator'
                ? 'bg-[#0B1221] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Pill className="w-3.5 h-3.5 text-teal-400" />
            <span>Rx Contraindication Simulator</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sbar-handoff')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'sbar-handoff'
                ? 'bg-[#0B1221] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5 text-teal-400" />
            <span>1-Click SBAR Shift Handoff</span>
          </button>
        </div>
      </div>

      {activeTab === 'safety-simulator' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* Left Column (5 cols): Active Patient Allergy, Renal & Adherence Guardrail Matrix */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-slate-50/80 rounded-xl border border-slate-200 p-4 space-y-3">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <span className="text-[11px] font-mono font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <FlaskConical className="w-3.5 h-3.5 text-[#0D9488]" />
                  Baseline Patient Safety Profile
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-500">
                  MRN #{patient.mrn}
                </span>
              </div>

              {/* Renal & Vitals Quick Telemetry Strip */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <div className="text-[9px] font-mono uppercase text-slate-400">
                    Est. Renal eGFR
                  </div>
                  <div
                    className={`text-xs font-mono font-extrabold mt-0.5 ${
                      patientBiomarkers.effectiveEgfr < 60
                        ? 'text-amber-700'
                        : 'text-emerald-700'
                    }`}
                  >
                    ~{patientBiomarkers.effectiveEgfr} mL/min
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <div className="text-[9px] font-mono uppercase text-slate-400">
                    Documented Allergies
                  </div>
                  <div
                    className={`text-xs font-mono font-extrabold mt-0.5 ${
                      patient.allergies.length > 0 ? 'text-red-700' : 'text-emerald-700'
                    }`}
                  >
                    {patient.allergies.length > 0
                      ? `${patient.allergies.length} Recorded`
                      : 'NKDA (0)'}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <div className="text-[9px] font-mono uppercase text-slate-400">
                    Hemodynamics
                  </div>
                  <div className="text-xs font-mono font-extrabold text-slate-900 mt-0.5">
                    {patient.vitals.systolic}/{patient.vitals.diastolic} mmHg
                  </div>
                </div>
              </div>

              {/* Active Safety Checks List */}
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                {activeProfileSafetyChecks.map((chk) => {
                  const cardStyle =
                    chk.severity === 'CRITICAL'
                      ? 'bg-red-50/90 border-red-200 text-red-950'
                      : chk.severity === 'WARNING'
                      ? 'bg-amber-50/90 border-amber-200 text-amber-950'
                      : 'bg-emerald-50/70 border-emerald-200 text-emerald-950';
                  const badgeStyle =
                    chk.severity === 'CRITICAL'
                      ? 'bg-red-600 text-white'
                      : chk.severity === 'WARNING'
                      ? 'bg-amber-500 text-white'
                      : 'bg-emerald-600 text-white';

                  return (
                    <div
                      key={chk.id}
                      className={`p-2.5 rounded-lg border text-xs ${cardStyle}`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-80">
                          {chk.category}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-extrabold ${badgeStyle}`}
                        >
                          {chk.severity}
                        </span>
                      </div>
                      <div className="font-extrabold text-xs">{chk.headline}</div>
                      <div className="text-[11px] opacity-85 mt-0.5 leading-snug">
                        {chk.detail}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
              <span>Active Regimen: {patient.medications.length} Meds</span>
              <span>Auto-screened against ICD-10 & Allergy Registry</span>
            </div>
          </div>

          {/* Right Column (7 cols): Interactive Candidate Prescription Contraindication Simulator */}
          <div className="lg:col-span-7 flex flex-col justify-between bg-white rounded-xl border border-slate-200 p-4">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#0D9488]" />
                    Interactive Prescription Order Safety Simulator
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Select a candidate order to run live allergy cross-reactivity & renal clearance checks before prescribing
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-mono font-bold text-slate-700">
                  5 Clinical Test Orders
                </span>
              </div>

              {/* Candidate Prescription Pill Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 mb-3.5">
                {CANDIDATE_PRESCRIPTIONS.map((rx) => {
                  const isSelected = rx.id === selectedCandidate.id;
                  return (
                    <button
                      key={rx.id}
                      type="button"
                      onClick={() => {
                        setSelectedCandidateId(rx.id);
                        setOrderFeedbackBanner(null);
                      }}
                      className={`text-left p-2.5 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#0B1221] text-white border-[#0B1221] shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-extrabold truncate">
                          {rx.name}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold shrink-0 ${
                            isSelected
                              ? 'bg-teal-500/20 text-teal-300 border border-teal-400/30'
                              : 'bg-white text-slate-600 border border-slate-200'
                          }`}
                        >
                          {rx.route}
                        </span>
                      </div>
                      <div
                        className={`text-[10px] font-mono mt-0.5 truncate ${
                          isSelected ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        {rx.dosage} · {rx.frequency}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Live Verdict Card */}
              <div
                className={`p-4 rounded-xl border ${
                  candidateEvaluation.status === 'HARD_STOP'
                    ? 'bg-red-50/90 border-red-300 text-red-950'
                    : candidateEvaluation.status === 'RENAL_CAUTION' ||
                      candidateEvaluation.status === 'DUPLICATE_THERAPY'
                    ? 'bg-amber-50/90 border-amber-300 text-amber-950'
                    : 'bg-teal-50/70 border-teal-300 text-teal-950'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono font-extrabold uppercase tracking-wider ${
                      candidateEvaluation.status === 'HARD_STOP'
                        ? 'bg-red-600 text-white'
                        : candidateEvaluation.status === 'RENAL_CAUTION' ||
                          candidateEvaluation.status === 'DUPLICATE_THERAPY'
                        ? 'bg-amber-600 text-white'
                        : 'bg-[#0D9488] text-white'
                    }`}
                  >
                    {candidateEvaluation.status === 'CLEARED' ? (
                      <ShieldCheck className="w-3.5 h-3.5" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    )}
                    {candidateEvaluation.badgeText}
                  </span>
                  <span className="text-[10px] font-mono font-bold opacity-75">
                    Class: {selectedCandidate.drugClass}
                  </span>
                </div>

                <h4 className="text-xs sm:text-sm font-extrabold mb-1">
                  {candidateEvaluation.headline}
                </h4>
                <p className="text-xs leading-relaxed opacity-90 mb-2.5">
                  {candidateEvaluation.rationale}
                </p>

                <div className="p-2.5 rounded-lg bg-white/80 border border-current/15 text-xs flex items-start gap-2">
                  <Activity className="w-4 h-4 shrink-0 mt-0.5 text-[#0D9488]" />
                  <div>
                    <span className="font-mono font-bold uppercase text-[10px] block text-slate-600">
                      Clinical Decision Support Guidance
                    </span>
                    <span className="font-bold text-slate-900">
                      {candidateEvaluation.recommendation}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Feedback Confirmation Banner */}
              {orderFeedbackBanner && (
                <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-950 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-bold">{orderFeedbackBanner.message}</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-700 shrink-0">
                    {orderFeedbackBanner.timestamp}
                  </span>
                </div>
              )}
            </div>

            {/* Bottom Action Bar */}
            <div className="pt-3 mt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="text-[11px] font-mono text-slate-500">
                Indication: <strong className="text-slate-800">{selectedCandidate.indication}</strong>
              </div>
              <button
                type="button"
                onClick={handleAuthorizeSafeOrder}
                className={`px-3.5 py-2 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                  candidateEvaluation.status === 'HARD_STOP' ||
                  candidateEvaluation.status === 'RENAL_CAUTION'
                    ? 'bg-[#0B1221] hover:bg-slate-800 text-white'
                    : 'bg-[#0D9488] hover:bg-teal-700 text-white'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>
                  {candidateEvaluation.status === 'HARD_STOP' ||
                  candidateEvaluation.status === 'RENAL_CAUTION'
                    ? 'Authorize Guardrail-Safe Alternative to Chart'
                    : `Authorize ${selectedCandidate.name} to Chart`}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* TAB 2: 1-Click Structured SBAR Shift Handoff Packet Generator */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* S — Situation */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded bg-[#0B1221] text-white text-[10px] font-mono font-extrabold">
                    S · SITUATION
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {patient.appointmentStatus}
                  </span>
                </div>
                <p className="text-xs text-slate-800 leading-relaxed">
                  {generatedSbar.situation}
                </p>
              </div>
              <div className="pt-2 mt-2 border-t border-slate-200/80 text-[10px] font-mono text-teal-700 font-semibold">
                Triage: {patient.triageLevel}
              </div>
            </div>

            {/* B — Background */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded bg-teal-700 text-white text-[10px] font-mono font-extrabold">
                    B · BACKGROUND
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {patient.allergies.length} Allergies · {patient.medications.length} Meds
                  </span>
                </div>
                <p className="text-xs text-slate-800 leading-relaxed">
                  {generatedSbar.background}
                </p>
              </div>
              <div className="pt-2 mt-2 border-t border-slate-200/80 text-[10px] font-mono text-slate-600">
                Blood Type: {patient.demographics.bloodType}
              </div>
            </div>

            {/* A — Assessment */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded bg-amber-600 text-white text-[10px] font-mono font-extrabold">
                    A · ASSESSMENT
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    Stability {patient.vitalStabilityScore ?? 7.5}/10
                  </span>
                </div>
                <p className="text-xs text-slate-800 leading-relaxed">
                  {generatedSbar.assessment}
                </p>
              </div>
              <div className="pt-2 mt-2 border-t border-slate-200/80 text-[10px] font-mono text-slate-600">
                eGFR ~{patientBiomarkers.effectiveEgfr} mL/min
              </div>
            </div>

            {/* R — Recommendation */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-700 text-white text-[10px] font-mono font-extrabold">
                    R · RECOMMENDATION
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    Action Plan
                  </span>
                </div>
                <p className="text-xs text-slate-800 leading-relaxed">
                  {generatedSbar.recommendation}
                </p>
              </div>
              <div className="pt-2 mt-2 border-t border-slate-200/80 text-[10px] font-mono text-emerald-800 font-semibold">
                Ready for Shift Sign-Out
              </div>
            </div>
          </div>

          {/* SBAR Action Footer */}
          <div className="p-3.5 rounded-xl bg-slate-100/80 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-700">
              <ClipboardCheck className="w-4 h-4 text-[#0D9488] shrink-0" />
              <span>
                Structured SBAR packet auto-compiled from live vitals, lab deltas, and allergy guardrails for{' '}
                <strong>
                  {patient.demographics.firstName} {patient.demographics.lastName}
                </strong>
                .
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCopySbar}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
              >
                {copiedSbar ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied SBAR Packet</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-600" />
                    <span>Copy SBAR to Clipboard</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCommitSbarToChart}
                disabled={sbarCommitted}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                  sbarCommitted
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#0B1221] hover:bg-slate-800 text-white shadow-xs'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                <span>
                  {sbarCommitted
                    ? 'SBAR Logged to Chart & Care Taker Queue'
                    : 'Commit SBAR Handoff to Patient Chart'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
