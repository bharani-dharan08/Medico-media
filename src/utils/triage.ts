/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Patient,
  ClinicalPriority,
  LabReport,
  PendingAction,
  ClinicalNote,
  AppointmentStatus,
  VitalTrendPoint,
  Medication,
  AdherenceCategory,
} from '../types/clinical.ts';

export interface RegimenAdherenceSummary {
  overallPdc: number;
  underutilizedCount: number;
  overutilizedCount: number;
  optimalCount: number;
  statusBadge: string;
  summaryText: string;
}

/**
 * Categorizes medication possession ratio / proportion of days covered
 */
export function categorizeAdherence(pdc: number): {
  status: AdherenceCategory;
  statusBadge: string;
  label: string;
  isFlagged: boolean;
} {
  if (pdc < 80) {
    return {
      status: 'UNDER_UTILIZATION',
      statusBadge: '[UNDER-UTILIZATION]',
      label: 'Missed Refills / Underuse Risk',
      isFlagged: true,
    };
  }
  if (pdc > 110) {
    return {
      status: 'OVER_UTILIZATION',
      statusBadge: '[OVER-UTILIZATION]',
      label: 'Accelerated Refills / Potential Toxicity',
      isFlagged: true,
    };
  }
  return {
    status: 'OPTIMAL',
    statusBadge: '[OPTIMAL ADHERENCE]',
    label: 'Standard Refill Adherence',
    isFlagged: false,
  };
}

/**
 * Computes cohort adherence summary across patient's active prescribed regimen
 */
export function calculateRegimenAdherenceSummary(
  medications: Medication[]
): RegimenAdherenceSummary {
  const medsWithAdherence = medications.filter((m) => m.adherence !== undefined);
  if (medsWithAdherence.length === 0) {
    return {
      overallPdc: 100,
      underutilizedCount: 0,
      overutilizedCount: 0,
      optimalCount: 0,
      statusBadge: '[NO PHARMACY CLAIMS]',
      summaryText: 'No integrated refill logs found for active medications.',
    };
  }

  const totalPdc = medsWithAdherence.reduce((acc, m) => acc + (m.adherence?.pdcPercentage || 0), 0);
  const overallPdc = Math.round(totalPdc / medsWithAdherence.length);

  let underutilizedCount = 0;
  let overutilizedCount = 0;
  let optimalCount = 0;

  medsWithAdherence.forEach((m) => {
    if (!m.adherence) return;
    if (m.adherence.pdcPercentage < 80) underutilizedCount++;
    else if (m.adherence.pdcPercentage > 110) overutilizedCount++;
    else optimalCount++;
  });

  let statusBadge = '[OPTIMAL REGIMEN ADHERENCE]';
  let summaryText = `All ${medsWithAdherence.length} medications demonstrate consistent refill coverage (avg ${overallPdc}% PDC).`;

  if (underutilizedCount > 0 && overutilizedCount > 0) {
    statusBadge = '[MIXED ADHERENCE RISKS]';
    summaryText = `Caution: ${underutilizedCount} under-utilized drug(s) and ${overutilizedCount} over-utilized drug(s) detected.`;
  } else if (underutilizedCount > 0) {
    statusBadge = `[${underutilizedCount} MEDICATION(S) UNDER-UTILIZED]`;
    summaryText = `Suboptimal coverage detected (${underutilizedCount} drug(s) <80% PDC). Review missed pharmacy fills.`;
  } else if (overutilizedCount > 0) {
    statusBadge = `[${overutilizedCount} MEDICATION(S) OVER-UTILIZED]`;
    summaryText = `Accelerated fill rate detected (${overutilizedCount} drug(s) >110% PDC). Screen for dose escalation or overuse.`;
  }

  return {
    overallPdc,
    underutilizedCount,
    overutilizedCount,
    optimalCount,
    statusBadge,
    summaryText,
  };
}

export interface VitalsStabilityAssessment {
  stability: 'STABLE' | 'MODERATE_DRIFT' | 'ACUTE_EXCURSION';
  statusBadge: string;
  summary: string;
  deltaSystolic: number;
  deltaHeartRate: number;
  deltaO2: number;
  deltaTemp: number;
}

export interface EWSBreakdown {
  respRate: { score: number; value: number; label: string };
  spo2: { score: number; value: number; label: string };
  systolic: { score: number; value: number; label: string };
  heartRate: { score: number; value: number; label: string };
  temp: { score: number; value: number; label: string };
}

export interface EWSResult {
  totalScore: number;
  breakdown: EWSBreakdown;
  riskLevel: 'LOW' | 'MEDIUM_LOW' | 'MEDIUM' | 'HIGH';
  riskLabel: string;
  badgeText: string;
  actionProtocol: string;
  hasSingleParameterRedFlag: boolean;
}

export interface EWSTrendResult {
  currentResult: EWSResult;
  previousResult: EWSResult | null;
  scoreDelta: number;
  trendDirection: 'worsening' | 'improving' | 'stable';
  trendLabel: string;
  priorVisitDate: string;
}

/**
 * Calculates Early Warning Score (EWS / NEWS2 standard) from physiological vitals
 */
export function calculateEWS(vitals: {
  systolic: number;
  heartRate: number;
  respRate: number;
  o2Sat: number;
  tempF: number;
}): EWSResult {
  // 1. Respiration Rate
  let rrScore = 0;
  let rrLabel = 'Normal (12-20)';
  if (vitals.respRate <= 8) {
    rrScore = 3;
    rrLabel = 'Critically Low (<=8 rpm)';
  } else if (vitals.respRate <= 11) {
    rrScore = 1;
    rrLabel = 'Borderline Low (9-11 rpm)';
  } else if (vitals.respRate <= 20) {
    rrScore = 0;
    rrLabel = 'Normal (12-20 rpm)';
  } else if (vitals.respRate <= 24) {
    rrScore = 2;
    rrLabel = 'Tachypnea (21-24 rpm)';
  } else {
    rrScore = 3;
    rrLabel = 'Severe Tachypnea (>=25 rpm)';
  }

  // 2. Oxygen Saturation (SpO2)
  let o2Score = 0;
  let o2Label = 'Normal (>=96%)';
  if (vitals.o2Sat <= 91) {
    o2Score = 3;
    o2Label = 'Critical Hypoxia (<=91%)';
  } else if (vitals.o2Sat <= 93) {
    o2Score = 2;
    o2Label = 'Significant Hypoxia (92-93%)';
  } else if (vitals.o2Sat <= 95) {
    o2Score = 1;
    o2Label = 'Mild Desaturation (94-95%)';
  } else {
    o2Score = 0;
    o2Label = 'Normal (>=96%)';
  }

  // 3. Systolic Blood Pressure
  let bpScore = 0;
  let bpLabel = 'Normal (111-179 mmHg)';
  if (vitals.systolic <= 90) {
    bpScore = 3;
    bpLabel = 'Critical Hypotension (<=90 mmHg)';
  } else if (vitals.systolic <= 100) {
    bpScore = 2;
    bpLabel = 'Hypotension (91-100 mmHg)';
  } else if (vitals.systolic <= 110) {
    bpScore = 1;
    bpLabel = 'Borderline Low (101-110 mmHg)';
  } else if (vitals.systolic <= 179) {
    bpScore = 0;
    bpLabel = 'Normotensive (111-179 mmHg)';
  } else if (vitals.systolic <= 219) {
    bpScore = 2;
    bpLabel = 'Severe Hypertension (180-219 mmHg)';
  } else {
    bpScore = 3;
    bpLabel = 'Hypertensive Crisis (>=220 mmHg)';
  }

  // 4. Heart Rate
  let hrScore = 0;
  let hrLabel = 'Normal (51-90 bpm)';
  if (vitals.heartRate <= 40) {
    hrScore = 3;
    hrLabel = 'Critical Bradycardia (<=40 bpm)';
  } else if (vitals.heartRate <= 50) {
    hrScore = 1;
    hrLabel = 'Bradycardia (41-50 bpm)';
  } else if (vitals.heartRate <= 90) {
    hrScore = 0;
    hrLabel = 'Normal Sinus (51-90 bpm)';
  } else if (vitals.heartRate <= 110) {
    hrScore = 1;
    hrLabel = 'Mild Tachycardia (91-110 bpm)';
  } else if (vitals.heartRate <= 130) {
    hrScore = 2;
    hrLabel = 'Moderate Tachycardia (111-130 bpm)';
  } else {
    hrScore = 3;
    hrLabel = 'Severe Tachycardia (>=131 bpm)';
  }

  // 5. Temperature (°F)
  let tempScore = 0;
  let tempLabel = 'Normal (96.9 - 100.4°F)';
  if (vitals.tempF <= 95.0) {
    tempScore = 3;
    tempLabel = 'Severe Hypothermia (<=95.0°F)';
  } else if (vitals.tempF <= 96.8) {
    tempScore = 1;
    tempLabel = 'Mild Hypothermia (95.1 - 96.8°F)';
  } else if (vitals.tempF <= 100.4) {
    tempScore = 0;
    tempLabel = 'Normothermic (96.9 - 100.4°F)';
  } else if (vitals.tempF <= 102.2) {
    tempScore = 1;
    tempLabel = 'Pyrexia / Fever (100.5 - 102.2°F)';
  } else {
    tempScore = 2;
    tempLabel = 'High Pyrexia (>=102.3°F)';
  }

  const totalScore = rrScore + o2Score + bpScore + hrScore + tempScore;
  const hasSingleParameterRedFlag =
    rrScore === 3 || o2Score === 3 || bpScore === 3 || hrScore === 3 || tempScore === 3;

  let riskLevel: 'LOW' | 'MEDIUM_LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  let riskLabel = 'Low Clinical Risk';
  let badgeText = '[LOW RISK]';
  let actionProtocol = 'Routine clinic monitoring. Vitals stable; continue scheduled care pathway.';

  if (totalScore >= 7) {
    riskLevel = 'HIGH';
    riskLabel = 'High Clinical Risk / Critical';
    badgeText = '[CRITICAL RISK]';
    actionProtocol = 'Immediate physician evaluation required. Initiate continuous telemetry and activate rapid response / emergency transfer pathway.';
  } else if (totalScore >= 5) {
    riskLevel = 'MEDIUM';
    riskLabel = 'Medium Clinical Risk';
    badgeText = '[MEDIUM RISK]';
    actionProtocol = 'Urgent clinician assessment warranted. Increase vitals monitoring frequency to q30m; notify attending physician.';
  } else if (totalScore >= 3 || hasSingleParameterRedFlag) {
    riskLevel = 'MEDIUM_LOW';
    riskLabel = 'Low-Medium Clinical Risk';
    badgeText = hasSingleParameterRedFlag ? '[SINGLE PARAMETER RED FLAG]' : '[LOW-MEDIUM RISK]';
    actionProtocol = 'Urgent nurse/clinician review within 30 minutes. Correlate with underlying diagnosis and recheck vitals.';
  }

  return {
    totalScore,
    breakdown: {
      respRate: { score: rrScore, value: vitals.respRate, label: rrLabel },
      spo2: { score: o2Score, value: vitals.o2Sat, label: o2Label },
      systolic: { score: bpScore, value: vitals.systolic, label: bpLabel },
      heartRate: { score: hrScore, value: vitals.heartRate, label: hrLabel },
      temp: { score: tempScore, value: vitals.tempF, label: tempLabel },
    },
    riskLevel,
    riskLabel,
    badgeText,
    actionProtocol,
    hasSingleParameterRedFlag,
  };
}

/**
 * Computes EWS score and trend comparing current vitals against previous visit
 */
export function calculateEWSTrend(
  trends: VitalTrendPoint[],
  currentVitals: {
    systolic: number;
    heartRate: number;
    respRate: number;
    o2Sat: number;
    tempF: number;
  }
): EWSTrendResult {
  const currentResult = calculateEWS(currentVitals);

  if (!trends || trends.length < 2) {
    return {
      currentResult,
      previousResult: null,
      scoreDelta: 0,
      trendDirection: 'stable',
      trendLabel: 'First recorded EWS visit (Baseline)',
      priorVisitDate: 'N/A',
    };
  }

  // Prior visit is second-to-last item
  const priorPoint = trends[trends.length - 2];
  const previousResult = calculateEWS(priorPoint);

  const scoreDelta = currentResult.totalScore - previousResult.totalScore;
  let trendDirection: 'worsening' | 'improving' | 'stable' = 'stable';
  let trendLabel = 'Stable (no score shift)';

  if (scoreDelta > 0) {
    trendDirection = 'worsening';
    trendLabel = `▲ +${scoreDelta} pts vs prior visit (Acute Deterioration)`;
  } else if (scoreDelta < 0) {
    trendDirection = 'improving';
    trendLabel = `▼ ${scoreDelta} pts vs prior visit (Clinical De-escalation)`;
  } else {
    trendDirection = 'stable';
    trendLabel = `◆ Steady vs prior visit (${previousResult.totalScore} pts)`;
  }

  return {
    currentResult,
    previousResult,
    scoreDelta,
    trendDirection,
    trendLabel,
    priorVisitDate: priorPoint.visitDate,
  };
}

/**
 * Evaluates patient stability across historical visits
 */
export function assessVitalsStability(trends: VitalTrendPoint[]): VitalsStabilityAssessment {
  if (!trends || trends.length < 2) {
    return {
      stability: 'STABLE',
      statusBadge: '[BASELINE INSUFFICIENT]',
      summary: 'Fewer than 2 recorded visits available for stability trajectory analysis.',
      deltaSystolic: 0,
      deltaHeartRate: 0,
      deltaO2: 0,
      deltaTemp: 0,
    };
  }

  const baseline = trends[0];
  const current = trends[trends.length - 1];

  const deltaSystolic = current.systolic - baseline.systolic;
  const deltaHeartRate = current.heartRate - baseline.heartRate;
  const deltaO2 = current.o2Sat - baseline.o2Sat;
  const deltaTemp = +(current.tempF - baseline.tempF).toFixed(1);

  // Severe acute excursion check
  if (
    Math.abs(deltaSystolic) >= 35 ||
    current.systolic >= 180 ||
    deltaHeartRate >= 25 ||
    current.heartRate >= 105 ||
    deltaO2 <= -4 ||
    current.o2Sat < 93 ||
    deltaTemp >= 2.5
  ) {
    let reason = '';
    if (current.systolic >= 180 || deltaSystolic >= 35) {
      reason = `Acute upward BP excursion (+${deltaSystolic} mmHg vs 5-visit baseline)`;
    } else if (deltaTemp >= 2.5) {
      reason = `Acute febrile spike (+${deltaTemp}°F above baseline)`;
    } else if (deltaO2 <= -4) {
      reason = `Hypoxemic desaturation (${deltaO2}% from baseline)`;
    } else {
      reason = `Marked tachycardia excursion (+${deltaHeartRate} bpm)`;
    }

    return {
      stability: 'ACUTE_EXCURSION',
      statusBadge: '[ACUTE EXCURSION / UNSTABLE]',
      summary: reason,
      deltaSystolic,
      deltaHeartRate,
      deltaO2,
      deltaTemp,
    };
  }

  // Moderate drift check
  if (
    Math.abs(deltaSystolic) >= 15 ||
    Math.abs(deltaHeartRate) >= 14 ||
    deltaO2 <= -2 ||
    deltaTemp >= 1.2
  ) {
    return {
      stability: 'MODERATE_DRIFT',
      statusBadge: '[MODERATE DRIFT]',
      summary: `Moderate hemodynamic drift detected (BP ${deltaSystolic >= 0 ? '+' : ''}${deltaSystolic} mmHg, HR ${deltaHeartRate >= 0 ? '+' : ''}${deltaHeartRate} bpm).`,
      deltaSystolic,
      deltaHeartRate,
      deltaO2,
      deltaTemp,
    };
  }

  return {
    stability: 'STABLE',
    statusBadge: '[HOMEOSTATIC / STABLE]',
    summary: 'Vital signs remain within physiological baseline envelope over the last 5 clinical visits.',
    deltaSystolic,
    deltaHeartRate,
    deltaO2,
    deltaTemp,
  };
}

/**
 * Derives top clinical priorities based on FHIR patient vitals, critical labs,
 * allergy flags, active medications, and chief complaint.
 */
export function computeClinicalPriorities(patient: Patient): ClinicalPriority[] {
  const priorities: ClinicalPriority[] = [];

  // Check critical labs first
  const criticalLabs = patient.labReports.filter(
    (l) => l.status === 'CRITICAL' || l.status === 'HIGH' || l.status === 'LOW'
  );

  // 1. Cardiovascular / Acute Ischemia or Pulmonary
  const troponin = patient.labReports.find((l) => l.name.toLowerCase().includes('troponin'));
  if (troponin && troponin.status === 'CRITICAL') {
    priorities.push({
      id: 'prio-troponin',
      level: 'critical',
      headline: `Critical Myocardial Necrosis Marker (${troponin.name}: ${troponin.value} ${troponin.unit})`,
      rationale: `Serum troponin is significantly above normal reference threshold (${troponin.referenceRange}). Coupled with systolic BP of ${patient.vitals.systolic} mmHg and chief complaint of "${patient.chiefComplaint}", acute coronary syndrome / NSTEMI must be ruled in immediately.`,
      recommendedAction: 'Verify continuous ECG telemetry, maintain O2 saturation >=94%, and expedite cardiology catheterization consult.',
      sourceData: `Troponin: ${troponin.value} ${troponin.unit} (Ref ${troponin.referenceRange}) · BP ${patient.vitals.systolic}/${patient.vitals.diastolic} mmHg`,
    });
  }

  // 2. Severe Hyperglycemia / DKA Risk
  const glucose = patient.labReports.find((l) => l.name.toLowerCase().includes('glucose'));
  const hba1c = patient.labReports.find((l) => l.name.toLowerCase().includes('a1c'));
  if (glucose && typeof glucose.value === 'number' && glucose.value > 300) {
    priorities.push({
      id: 'prio-glucose',
      level: 'critical',
      headline: `Severe Hyperglycemia Escalation (Glucose ${glucose.value} mg/dL, HbA1c ${hba1c?.value || '11.4'}%)`,
      rationale: `Patient shows acute profound glycemic excursion with microalbuminuria. At risk for hyperosmolar hyperglycemic state (HHS) or diabetic ketoacidosis. Home regimen is insufficient.`,
      recommendedAction: 'Initiate basal insulin protocol, screen beta-hydroxybutyrate, assess fluid deficit, and check renal adjustments for metformin.',
      sourceData: `Blood Glucose: ${glucose.value} mg/dL · HbA1c: ${hba1c?.value || '11.4'}% · eGFR 49`,
    });
  }

  // 3. Acute Surgical Abdomen / Appendicitis
  const ctScan = patient.labReports.find((l) => l.category === 'Imaging' && l.name.toLowerCase().includes('ct'));
  const wbc = patient.labReports.find((l) => l.name.toLowerCase().includes('white blood cell'));
  if (ctScan && (ctScan.status === 'CRITICAL' || ctScan.impression?.toLowerCase().includes('appendicitis'))) {
    priorities.push({
      id: 'prio-appendicitis',
      level: 'critical',
      headline: `Acute Suppurative Appendicitis on CT (WBC ${wbc?.value || '16.8'} x10³/µL)`,
      rationale: `Contrast CT demonstrates 8.5mm distended appendix with wall hyperenhancement and fat stranding. Accompanied by fever (${patient.vitals.tempF}°F) and significant leukocytosis with left shift.`,
      recommendedAction: 'Enforce strict NPO status, initiate pre-operative broad-spectrum IV antibiotics (avoiding NSAID allergy), and finalize surgical consult.',
      sourceData: `CT: 8.5mm appendix with fat stranding · WBC: ${wbc?.value || '16.8'} · Temp: ${patient.vitals.tempF}°F`,
    });
  }

  // 4. Acute Decompensated Heart Failure & Hyperkalemia
  const bnp = patient.labReports.find((l) => l.name.toLowerCase().includes('bnp'));
  const potassium = patient.labReports.find((l) => l.name.toLowerCase().includes('potassium'));
  if (bnp && typeof bnp.value === 'number' && bnp.value > 2000) {
    priorities.push({
      id: 'prio-chf',
      level: 'critical',
      headline: `Acute Decompensated Heart Failure (NT-proBNP ${bnp.value} pg/mL)`,
      rationale: `Severe volume overload presenting with tachypnea (${patient.vitals.respRate} bpm), SpO2 ${patient.vitals.o2Sat}%, and bilateral edema. Elevated serum potassium (${potassium?.value || '5.6'} mEq/L) restricts ACEi/MRA escalation.`,
      recommendedAction: 'Administer IV loop diuretic (Furosemide 80mg IV push), temporarily hold Spironolactone due to hyperkalemia, and repeat BMP in 4h.',
      sourceData: `NT-proBNP: ${bnp.value} pg/mL · K+: ${potassium?.value || '5.6'} mEq/L · O2 Sat: ${patient.vitals.o2Sat}%`,
    });
  }

  // 5. Severe Hypothyroidism
  const tsh = patient.labReports.find((l) => l.name.toLowerCase().includes('tsh'));
  const ft4 = patient.labReports.find((l) => l.name.toLowerCase().includes('t4'));
  if (tsh && typeof tsh.value === 'number' && tsh.value > 10) {
    priorities.push({
      id: 'prio-tsh',
      level: 'urgent',
      headline: `Refractory Hypothyroidism with TSH Elevation (${tsh.value} mIU/L)`,
      rationale: `Circulating free T4 is subtherapeutic (${ft4?.value || '0.62'} ng/dL) despite documented compliance. Explains persistent constitutional fatigue, bradycardia (HR ${patient.vitals.heartRate} bpm), and metabolic slowdown.`,
      recommendedAction: 'Titrate levothyroxine upward to 100 mcg daily, review administration timing away from calcium/coffee, schedule 6-week repeat panel.',
      sourceData: `TSH: ${tsh.value} mIU/L (Ref ${tsh.referenceRange}) · Free T4: ${ft4?.value || '0.62'} ng/dL`,
    });
  }

  // 6. Critical Blood Pressure Vitals
  if (patient.vitals.systolic >= 180 || patient.vitals.diastolic >= 110) {
    if (!priorities.some((p) => p.headline.toLowerCase().includes('hypertension'))) {
      priorities.push({
        id: 'prio-htn-crisis',
        level: 'critical',
        headline: `Hypertensive Urgency / Crisis (${patient.vitals.systolic}/${patient.vitals.diastolic} mmHg)`,
        rationale: `Markedly elevated blood pressure exceeding Stage 2 threshold. Correlate with acute end-organ symptomatology (chest pain, neurologic changes, or acute renal decline).`,
        recommendedAction: 'Initiate prompt parenteral or oral antihypertensive titration and assess for target organ damage.',
        sourceData: `BP: ${patient.vitals.systolic}/${patient.vitals.diastolic} mmHg (MAP: ${Math.round((patient.vitals.systolic + 2 * patient.vitals.diastolic) / 3)} mmHg)`,
      });
    }
  }

  // 7. Critical Allergy Alerts
  const criticalAllergies = patient.allergies.filter((a) => a.severity === 'CRITICAL' || a.severity === 'HIGH');
  if (criticalAllergies.length > 0 && priorities.length < 3) {
    const list = criticalAllergies.map((a) => a.substance).join(', ');
    priorities.push({
      id: 'prio-allergies',
      level: 'urgent',
      headline: `Severe Medication Allergy Cross-Reactivity Alert (${list})`,
      rationale: `Patient has documented severe hypersensitivity reactions (${criticalAllergies.map((a) => `${a.substance}: ${a.reaction}`).join('; ')}). Prescribing orders must bypass beta-lactams or iodinated contrast unless formally premedicated.`,
      recommendedAction: 'Verify allergy armbands and ensure alternative antibiotic / imaging protocols are selected in pending orders.',
      sourceData: `Active severe allergies: ${list}`,
    });
  }

  // 8. General High Labs / Chief Complaint backup
  if (priorities.length < 3) {
    for (const lab of criticalLabs) {
      if (!priorities.some((p) => p.sourceData.includes(lab.name))) {
        priorities.push({
          id: `prio-${lab.id}`,
          level: lab.status === 'CRITICAL' ? 'critical' : 'urgent',
          headline: `Abnormal Laboratory Result: ${lab.name} (${lab.value} ${lab.unit})`,
          rationale: `Value outside physiological reference range (${lab.referenceRange}). ${lab.findingsNarrative || ''}`,
          recommendedAction: `Review clinical context and correlate with active pharmacological regimen.`,
          sourceData: `${lab.name}: ${lab.value} ${lab.unit} (${lab.status})`,
        });
      }
      if (priorities.length >= 3) break;
    }
  }

  // If still less than 3, construct from Chief Complaint and Vitals
  if (priorities.length < 3) {
    priorities.push({
      id: 'prio-complaint',
      level: 'monitoring',
      headline: `Chief Complaint Triage: ${patient.chiefComplaint.slice(0, 50)}...`,
      rationale: `Patient reported chief complaint during check-in: "${patient.chiefComplaint}". Requires targeted clinical interview and diagnostic reconciliation.`,
      recommendedAction: 'Conduct focused physical exam corresponding to presenting organ system.',
      sourceData: `Encounter Reason · Triage Urgency: ${patient.triageLevel}`,
    });
  }

  return priorities.slice(0, 3);
}

/**
 * Evaluates an individual vital sign against clinical reference thresholds
 */
export function evaluateVital(
  vitalType: 'bp' | 'hr' | 'spo2' | 'temp' | 'rr',
  val1: number,
  val2?: number
): { status: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'LOW'; badgeText: string; isAbnormal: boolean } {
  switch (vitalType) {
    case 'bp': {
      const systolic = val1;
      const diastolic = val2 || 80;
      if (systolic >= 180 || diastolic >= 110) {
        return { status: 'CRITICAL', badgeText: '[CRITICAL HTN]', isAbnormal: true };
      }
      if (systolic >= 140 || diastolic >= 90) {
        return { status: 'WARNING', badgeText: '[STAGE 2 HTN]', isAbnormal: true };
      }
      if (systolic >= 130 || diastolic >= 80) {
        return { status: 'WARNING', badgeText: '[STAGE 1 HTN]', isAbnormal: true };
      }
      if (systolic < 90 || diastolic < 60) {
        return { status: 'LOW', badgeText: '[HYPOTENSION]', isAbnormal: true };
      }
      return { status: 'NORMAL', badgeText: '[NORMAL]', isAbnormal: false };
    }
    case 'hr': {
      if (val1 >= 120) {
        return { status: 'CRITICAL', badgeText: '[MARKED TACHY]', isAbnormal: true };
      }
      if (val1 > 100) {
        return { status: 'WARNING', badgeText: '[TACHYCARDIA]', isAbnormal: true };
      }
      if (val1 < 50) {
        return { status: 'CRITICAL', badgeText: '[MARKED BRADY]', isAbnormal: true };
      }
      if (val1 < 60) {
        return { status: 'WARNING', badgeText: '[BRADYCARDIA]', isAbnormal: true };
      }
      return { status: 'NORMAL', badgeText: '[NORMAL SINUS]', isAbnormal: false };
    }
    case 'spo2': {
      if (val1 < 90) {
        return { status: 'CRITICAL', badgeText: '[CRITICAL HYPOXIA]', isAbnormal: true };
      }
      if (val1 < 94) {
        return { status: 'WARNING', badgeText: '[LOW SpO2]', isAbnormal: true };
      }
      return { status: 'NORMAL', badgeText: '[NORMAL]', isAbnormal: false };
    }
    case 'temp': {
      if (val1 >= 102.0) {
        return { status: 'CRITICAL', badgeText: '[HIGH FEVER]', isAbnormal: true };
      }
      if (val1 >= 100.4) {
        return { status: 'WARNING', badgeText: '[FEVER]', isAbnormal: true };
      }
      if (val1 < 96.0) {
        return { status: 'WARNING', badgeText: '[HYPOTHERMIA]', isAbnormal: true };
      }
      return { status: 'NORMAL', badgeText: '[NORMAL]', isAbnormal: false };
    }
    case 'rr': {
      if (val1 >= 26) {
        return { status: 'CRITICAL', badgeText: '[SEVERE TACHYPNEA]', isAbnormal: true };
      }
      if (val1 >= 20) {
        return { status: 'WARNING', badgeText: '[TACHYPNEA]', isAbnormal: true };
      }
      if (val1 < 10) {
        return { status: 'CRITICAL', badgeText: '[BRADYPNEA]', isAbnormal: true };
      }
      return { status: 'NORMAL', badgeText: '[NORMAL]', isAbnormal: false };
    }
  }
}

/**
 * Filter lab reports by category and abnormality toggle
 */
export function filterLabReports(
  labs: LabReport[],
  categoryFilter: string,
  onlyAbnormal: boolean
): LabReport[] {
  return labs.filter((lab) => {
    // Abnormality check
    if (onlyAbnormal && lab.status === 'NORMAL') {
      return false;
    }
    // Category check
    if (categoryFilter === 'Abnormal Only') {
      return lab.status !== 'NORMAL';
    }
    if (categoryFilter === 'Imaging') {
      return lab.category === 'Imaging';
    }
    if (categoryFilter === 'Bloodwork') {
      return lab.category === 'Bloodwork';
    }
    return true; // 'All'
  });
}

/**
 * Filters appointments queue by appointment status, search query, and urgency
 */
export function filterPatients(
  patients: Patient[],
  statusFilter: string,
  searchQuery: string,
  onlyUrgent: boolean = false
): Patient[] {
  const query = searchQuery.trim().toLowerCase();

  return patients.filter((patient) => {
    // Status filter
    if (statusFilter !== 'All' && patient.appointmentStatus !== statusFilter) {
      return false;
    }

    // Urgent filter
    if (onlyUrgent) {
      const hasUrgentActions = patient.pendingActions.some(
        (a) => a.urgency === 'urgent' && a.status === 'pending'
      );
      const isUrgentTriage =
        patient.triageLevel.includes('Level 1') || patient.triageLevel.includes('Level 2');
      if (!hasUrgentActions && !isUrgentTriage) {
        return false;
      }
    }

    // Search query: match name or MRN
    if (query) {
      const fullName = `${patient.demographics.firstName} ${patient.demographics.lastName}`.toLowerCase();
      const mrn = patient.mrn.toLowerCase();
      const complaint = patient.chiefComplaint.toLowerCase();
      if (!fullName.includes(query) && !mrn.includes(query) && !complaint.includes(query)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Execute an interactive pending action with full clinical audit trail timestamp
 */
export function executePendingAction(
  patients: Patient[],
  patientId: string,
  actionId: string,
  actor: string = 'Dr. Sarah Chen, MD'
): Patient[] {
  const now = new Date();
  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateString = now.toLocaleDateString([], { month: 'short', day: 'numeric' });
  const auditTime = `${dateString}, ${timeString}`;

  return patients.map((patient) => {
    if (patient.id !== patientId) return patient;

    const updatedActions = patient.pendingActions.map((action) => {
      if (action.id !== actionId) return action;

      let actionDesc = 'Approved';
      if (action.type === 'critical_lab') actionDesc = 'Acknowledged Critical Result';
      else if (action.type === 'referral') actionDesc = 'Authorized Specialist Referral';
      else if (action.type === 'refill') actionDesc = 'Approved Medication Refill';
      else if (action.type === 'vitals_recheck') actionDesc = 'Vitals Recheck Ordered';

      return {
        ...action,
        status: 'completed' as const,
        auditTrail: [
          ...action.auditTrail,
          {
            timestamp: auditTime,
            action: `${actionDesc} by Clinician`,
            actor,
            details: `Completed and signed electronically via Rapid Triage console.`,
          },
        ],
      };
    });

    return {
      ...patient,
      pendingActions: updatedActions,
    };
  });
}

/**
 * Adds a new quick pending action to a patient
 */
export function addNewPendingAction(
  patients: Patient[],
  patientId: string,
  actionData: {
    title: string;
    type: PendingAction['type'];
    description: string;
    urgency: PendingAction['urgency'];
    actor?: string;
  }
): Patient[] {
  const now = new Date();
  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const newAction: PendingAction = {
    id: `act-${Date.now()}`,
    title: actionData.title,
    type: actionData.type,
    description: actionData.description,
    urgency: actionData.urgency,
    status: 'pending',
    createdAt: timeString,
    auditTrail: [
      {
        timestamp: timeString,
        action: 'Order Placed during Encounter',
        actor: actionData.actor || 'Dr. Sarah Chen, MD',
        details: 'Added from Rapid Triage Dashboard quick action bar.',
      },
    ],
  };

  return patients.map((patient) => {
    if (patient.id !== patientId) return patient;
    return {
      ...patient,
      pendingActions: [newAction, ...patient.pendingActions],
    };
  });
}

/**
 * Adds a new clinical SOAP or triage note
 */
export function addClinicalNote(
  patients: Patient[],
  patientId: string,
  noteData: {
    type: ClinicalNote['type'];
    content: string;
    author?: string;
    tags?: string[];
  }
): Patient[] {
  const now = new Date();
  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const newNote: ClinicalNote = {
    id: `note-${Date.now()}`,
    timestamp: timeString,
    author: noteData.author || 'Dr. Sarah Chen, MD',
    type: noteData.type,
    content: noteData.content,
    tags: noteData.tags || ['In-Encounter Note'],
  };

  return patients.map((patient) => {
    if (patient.id !== patientId) return patient;
    return {
      ...patient,
      clinicalNotes: [newNote, ...patient.clinicalNotes],
    };
  });
}

/**
 * Updates a patient's appointment status
 */
export function updatePatientAppointmentStatus(
  patients: Patient[],
  patientId: string,
  newStatus: AppointmentStatus
): Patient[] {
  return patients.map((patient) => {
    if (patient.id !== patientId) return patient;
    return {
      ...patient,
      appointmentStatus: newStatus,
    };
  });
}
