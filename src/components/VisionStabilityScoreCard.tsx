/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { Patient } from '../types/clinical.ts';
import { calculateEWSTrend } from '../utils/triage.ts';

interface VisionStabilityScoreCardProps {
  patient: Patient;
}

export const VisionStabilityScoreCard: React.FC<VisionStabilityScoreCardProps> = ({
  patient,
}) => {
  const score = patient.vitalStabilityScore ?? 8.4;
  const ewsTrend = calculateEWSTrend(patient.vitalTrends || [], patient.vitals);
  const ewsScore = ewsTrend.currentResult.totalScore;

  const primaryLab = patient.labReports[0];
  const labLabel = primaryLab
    ? primaryLab.name.includes('HbA1c')
      ? 'Last HbA1c'
      : primaryLab.name.split(' ')[0] + ' ' + (primaryLab.name.split(' ')[1] || '')
    : 'Last HbA1c';
  const labDisplayValue = primaryLab
    ? `${primaryLab.value}${primaryLab.unit === '%' ? '%' : ' ' + primaryLab.unit}`
    : '8.2%';
  const labStatusText = primaryLab
    ? primaryLab.status === 'CRITICAL'
      ? 'Critical'
      : primaryLab.status === 'HIGH'
      ? 'High'
      : 'Normal'
    : 'High';

  // SVG 270-degree Radial Arc Gauge parameters
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75; // 270 degrees
  const progressLength = (score / 10) * arcLength;

  const statusConfig =
    score >= 7.5
      ? {
          label: 'STABLE',
          badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          strokeColor: '#0D9488',
        }
      : score >= 5.5
      ? {
          label: 'WATCH',
          badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
          strokeColor: '#D97706',
        }
      : {
          label: 'CRITICAL',
          badgeClass: 'bg-red-50 text-red-800 border-red-200',
          strokeColor: '#DC2626',
        };

  return (
    <div className="vision-card p-5 flex flex-col justify-between h-full min-h-[260px]">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#0D9488]" />
            Clinical Stability & Triage Score
          </h3>
          <p className="text-[11px] text-slate-500">
            Composite stability & NEWS2 ({ewsScore} pts)
          </p>
        </div>

        <span
          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${statusConfig.badgeClass}`}
        >
          {statusConfig.label}
        </span>
      </div>

      {/* Main Content: Left Sub-Cards + Right 270-Degree Radial Arc Gauge */}
      <div className="grid grid-cols-12 gap-3 items-center my-2">
        <div className="col-span-6 space-y-2.5">
          {/* Sub-Card 1: Primary Biomarker */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-600 font-semibold block truncate">
              {labLabel}
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5 flex-wrap">
              <span className="text-sm font-extrabold text-slate-900 font-mono tabular-nums">
                {labDisplayValue}
              </span>
              <span
                className={`text-[10px] font-bold ${
                  labStatusText === 'Normal' ? 'text-emerald-700' : 'text-red-700'
                }`}
              >
                ({labStatusText})
              </span>
            </div>
          </div>

          {/* Sub-Card 2: Blood Pressure */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-600 font-semibold block">
              Blood Pressure (BP)
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-sm font-extrabold text-slate-900 font-mono tabular-nums">
                {patient.vitals.systolic}/{patient.vitals.diastolic}
              </span>
              <span className="text-[10px] text-[#0D9488] font-mono font-semibold">
                mmHg
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: 270-Degree Radial Arc Gauge */}
        <div className="col-span-6 flex flex-col items-center justify-center relative">
          <div className="relative w-34 h-34 flex items-center justify-center">
            <svg className="w-full h-full rotate-[135deg]" viewBox="0 0 140 140">
              {/* Background Track Arc */}
              <circle
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke="#E2E8F0"
                strokeWidth="11"
                strokeDasharray={`${arcLength} ${circumference}`}
                strokeLinecap="round"
              />

              {/* Foreground Progress Arc */}
              <circle
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke={statusConfig.strokeColor}
                strokeWidth="11"
                strokeDasharray={`${progressLength} ${circumference}`}
                strokeLinecap="round"
              />
            </svg>

            {/* Center Readout */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pt-1">
              <span className="text-[10px] text-slate-500 font-semibold">Safety</span>
              <div className="flex items-baseline gap-0.5">
                <span className="text-2xl font-extrabold text-slate-900 tracking-tight font-mono tabular-nums">
                  {score.toFixed(1)}
                </span>
                <span className="text-[10px] text-slate-500 font-bold">/10</span>
              </div>
              <span className="text-[9px] text-[#0D9488] font-bold tracking-wider uppercase mt-0.5">
                Vital Stability
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Strip */}
      <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-200 text-slate-600">
        <span>
          SpO2: <strong className="text-slate-900 font-mono">{patient.vitals.o2Sat}%</strong>
        </span>
        <span>
          HR: <strong className="text-slate-900 font-mono">{patient.vitals.heartRate} bpm</strong>
        </span>
        <span>
          Temp: <strong className="text-slate-900 font-mono">{patient.vitals.tempF}°F</strong>
        </span>
      </div>
    </div>
  );
};
