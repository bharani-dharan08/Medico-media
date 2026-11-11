/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  ShieldAlert,
  Heart,
  Activity,
  Wind,
  Thermometer,
  Pill,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { Patient } from '../types/clinical.ts';
import { evaluateVital } from '../utils/triage.ts';
import { VitalsTrendsChart } from './VitalsTrendsChart.tsx';
import { MedicationAdherenceTracker } from './MedicationAdherenceTracker.tsx';

interface MedicalHistoryVitalsProps {
  patient: Patient;
  onQuickRefill?: (medName: string) => void;
}

export const MedicalHistoryVitals: React.FC<MedicalHistoryVitalsProps> = ({
  patient,
  onQuickRefill,
}) => {
  const { vitals, allergies, chronicHistory, medications } = patient;

  // Evaluate vitals with clinical rules
  const bpStatus = evaluateVital('bp', vitals.systolic, vitals.diastolic);
  const hrStatus = evaluateVital('hr', vitals.heartRate);
  const o2Status = evaluateVital('spo2', vitals.o2Sat);
  const tempStatus = evaluateVital('temp', vitals.tempF);
  const rrStatus = evaluateVital('rr', vitals.respRate);

  // Mean Arterial Pressure (MAP) calculation
  const mapValue = Math.round((vitals.systolic + 2 * vitals.diastolic) / 3);

  const hasCriticalAllergy = allergies.some((a) => a.severity === 'CRITICAL' || a.severity === 'HIGH');
  const isNKDA = allergies.length === 1 && allergies[0].substance.toLowerCase().includes('no known');

  return (
    <div className="space-y-4">
      {/* 1. High-Contrast Allergy Banner */}
      <div
        className={`p-3.5 rounded-lg border text-xs ${
          isNKDA
            ? 'bg-emerald-950/20 border-emerald-800/60 text-emerald-200'
            : hasCriticalAllergy
            ? 'bg-rose-950/40 border-rose-800 text-rose-100'
            : 'bg-amber-950/30 border-amber-800 text-amber-100'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div
              className={`p-1.5 rounded shrink-0 ${
                isNKDA
                  ? 'bg-emerald-900/60 text-emerald-400'
                  : 'bg-rose-900/60 text-rose-300'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold tracking-wide uppercase text-white">
                  Allergies & Adverse Drug Reactions
                </span>
                {isNKDA ? (
                  <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    [VERIFIED NKDA]
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-rose-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    [CRITICAL CAUTION REQUIRED]
                  </span>
                )}
              </div>

              {isNKDA ? (
                <p className="text-[11px] text-emerald-300">
                  No Known Drug Allergies documented and verified on {allergies[0].verifiedDate}.
                </p>
              ) : (
                <div className="space-y-1 mt-1">
                  {allergies.map((allergy) => (
                    <div
                      key={allergy.id}
                      className="flex items-baseline gap-2 text-[11px] leading-relaxed"
                    >
                      <span className="font-semibold text-white">
                        {allergy.substance}:
                      </span>
                      <span className="text-slate-300">{allergy.reaction}</span>
                      <span className="text-slate-500 font-mono text-[10px]">
                        [{allergy.severity}]
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <span className="text-[10px] text-slate-400 font-mono shrink-0">
            Recorded: {vitals.recordedAt} by {vitals.recordedBy}
          </span>
        </div>
      </div>

      {/* 2. 4-Card High-Contrast Vitals Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Blood Pressure */}
        <div
          className={`p-3 rounded-lg border text-left ${
            bpStatus.isAbnormal
              ? bpStatus.status === 'CRITICAL'
                ? 'bg-rose-950/30 border-rose-700'
                : 'bg-amber-950/20 border-amber-700'
              : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-medium flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-teal-400" />
              Blood Pressure
            </span>
            <span
              className={`text-[10px] font-bold font-mono ${
                bpStatus.status === 'CRITICAL'
                  ? 'text-rose-400'
                  : bpStatus.status === 'WARNING'
                  ? 'text-amber-400'
                  : 'text-slate-400'
              }`}
            >
              {bpStatus.badgeText}
            </span>
          </div>
          <div className="text-lg font-bold font-mono tabular-nums text-white">
            {vitals.systolic}/{vitals.diastolic}
            <span className="text-xs font-normal text-slate-400 ml-1">mmHg</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-1">
            MAP: <span className="text-slate-200 font-semibold tabular-nums">{mapValue} mmHg</span> (Ref 70-100)
          </div>
        </div>

        {/* Heart Rate */}
        <div
          className={`p-3 rounded-lg border text-left ${
            hrStatus.isAbnormal
              ? 'bg-amber-950/20 border-amber-700'
              : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-medium flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-400" />
              Heart Rate
            </span>
            <span
              className={`text-[10px] font-bold font-mono ${
                hrStatus.status === 'CRITICAL'
                  ? 'text-rose-400'
                  : hrStatus.status === 'WARNING'
                  ? 'text-amber-400'
                  : 'text-slate-400'
              }`}
            >
              {hrStatus.badgeText}
            </span>
          </div>
          <div className="text-lg font-bold font-mono tabular-nums text-white">
            {vitals.heartRate}
            <span className="text-xs font-normal text-slate-400 ml-1">bpm</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-1">
            Sinus Rhythm · Ref 60-100 bpm
          </div>
        </div>

        {/* Oxygen Saturation */}
        <div
          className={`p-3 rounded-lg border text-left ${
            o2Status.isAbnormal
              ? 'bg-rose-950/30 border-rose-700'
              : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-medium flex items-center gap-1.5">
              <Wind className="w-3.5 h-3.5 text-cyan-400" />
              SpO2 Pulse Ox
            </span>
            <span
              className={`text-[10px] font-bold font-mono ${
                o2Status.status === 'CRITICAL'
                  ? 'text-rose-400'
                  : o2Status.status === 'WARNING'
                  ? 'text-amber-400'
                  : 'text-slate-400'
              }`}
            >
              {o2Status.badgeText}
            </span>
          </div>
          <div className="text-lg font-bold font-mono tabular-nums text-white">
            {vitals.o2Sat}
            <span className="text-xs font-normal text-slate-400 ml-1">%</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-1">
            {vitals.o2Sat < 94 ? 'Supplemental O2 Indicated' : 'Room Air Target >=95%'}
          </div>
        </div>

        {/* Temperature & Respiration */}
        <div
          className={`p-3 rounded-lg border text-left ${
            tempStatus.isAbnormal || rrStatus.isAbnormal
              ? 'bg-amber-950/20 border-amber-700'
              : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-medium flex items-center gap-1.5">
              <Thermometer className="w-3.5 h-3.5 text-amber-400" />
              Temp & Resp
            </span>
            <span className="text-[10px] font-bold font-mono text-amber-400">
              {tempStatus.isAbnormal ? tempStatus.badgeText : rrStatus.badgeText}
            </span>
          </div>
          <div className="text-lg font-bold font-mono tabular-nums text-white">
            {vitals.tempF}°F
            <span className="text-xs font-normal text-slate-400 mx-1.5">/</span>
            {vitals.respRate}
            <span className="text-xs font-normal text-slate-400 ml-1">rpm</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-1">
            BMI: <span className="text-slate-200 font-semibold tabular-nums">{vitals.bmi}</span>
          </div>
        </div>
      </div>

      {/* Historical Vitals Trends (5 Visits) using Recharts */}
      {patient.vitalTrends && patient.vitalTrends.length > 0 && (
        <VitalsTrendsChart
          trends={patient.vitalTrends}
          patientName={`${patient.demographics.lastName}, ${patient.demographics.firstName}`}
        />
      )}

      {/* 3. Split: Active Problem List & Active Medications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Active Problem List */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 text-slate-100">
          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-teal-400" />
              Active Problem List
            </h4>
            <span className="text-[10px] font-mono text-slate-400 tabular-nums">
              {chronicHistory.length} Conditions
            </span>
          </div>

          <div className="space-y-2">
            {chronicHistory.map((cond) => (
              <div
                key={cond.id}
                className="p-2 rounded bg-slate-950/60 border border-slate-800/80 text-xs flex items-start justify-between gap-2"
              >
                <div>
                  <div className="font-medium text-white leading-snug">
                    {cond.name}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                    <span>ICD-10: {cond.code}</span>
                    <span aria-hidden="true">·</span>
                    <span>Onset: {cond.onsetDate}</span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-semibold font-mono shrink-0 px-1.5 py-0.5 rounded ${
                    cond.status === 'Refractory'
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : cond.status === 'Active'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  [{cond.status.toUpperCase()}]
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Active Medications Regimen */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 text-slate-100">
          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white flex items-center gap-1.5">
              <Pill className="w-3.5 h-3.5 text-teal-400" />
              Active Medication Regimen
            </h4>
            <span className="text-[10px] font-mono text-slate-400 tabular-nums">
              {medications.length} Active Prescriptions
            </span>
          </div>

          <div className="space-y-2">
            {medications.map((med) => {
              const needsRefill = med.refillStatus === 'Refill Requested' || med.refillsRemaining === 0;

              return (
                <div
                  key={med.id}
                  className="p-2 rounded bg-slate-950/60 border border-slate-800/80 text-xs flex items-start justify-between gap-2"
                >
                  <div>
                    <div className="font-medium text-white flex items-center gap-2">
                      <span>{med.name}</span>
                      <span className="text-[11px] font-mono text-teal-300">{med.dosage}</span>
                    </div>
                    <div className="text-[11px] text-slate-300 mt-0.5">
                      {med.frequency} · {med.route}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                      <span>Ind: {med.indication}</span>
                      <span aria-hidden="true">·</span>
                      <span>Refills: {med.refillsRemaining}</span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-semibold font-mono shrink-0 px-1.5 py-0.5 rounded ${
                      needsRefill
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-teal-950 text-teal-300 border border-teal-800'
                    }`}
                  >
                    {needsRefill ? '[REFILL REQUESTED]' : '[ACTIVE]'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Visual Pharmacy Refill Adherence & Utilization Tracker */}
      <MedicationAdherenceTracker
        medications={medications}
        onQuickRefill={onQuickRefill}
      />
    </div>
  );
};
