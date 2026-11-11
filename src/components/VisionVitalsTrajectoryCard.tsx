/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Activity } from 'lucide-react';
import { Patient } from '../types/clinical.ts';

type TrajectoryMode = 'bp_hr' | 'glucose_a1c' | 'renal_egfr';

interface VisionVitalsTrajectoryCardProps {
  patient: Patient;
}

export const VisionVitalsTrajectoryCard: React.FC<VisionVitalsTrajectoryCardProps> = ({
  patient,
}) => {
  const [mode, setMode] = useState<TrajectoryMode>('bp_hr');

  const chartData = useMemo(() => {
    return patient.vitalTrends.map((pt, idx) => {
      // Synthesize longitudinal biomarker correlates from the patient's clinical profile
      const baseGlucose = patient.id === 'pat-001' ? 148 + idx * 17 : patient.id === 'pat-002' ? 190 + idx * 38 : 92 + idx * 3;
      const baseA1c = patient.id === 'pat-001' ? +(7.1 + idx * 0.27).toFixed(1) : patient.id === 'pat-002' ? +(8.1 + idx * 0.7).toFixed(1) : +(5.3 + idx * 0.1).toFixed(1);
      const baseEgfr = patient.id === 'pat-004' ? Math.max(32, 58 - idx * 5) : 74 - idx * 1.5;
      const baseCreatinine = patient.id === 'pat-004' ? +(1.22 + idx * 0.15).toFixed(2) : +(0.98 + idx * 0.03).toFixed(2);

      return {
        visitDate: pt.visitDate,
        encounterType: pt.encounterType,
        systolic: pt.systolic,
        diastolic: pt.diastolic,
        heartRate: pt.heartRate,
        glucose: Math.round(baseGlucose),
        hba1cScaled: Math.round(baseA1c * 20), // Scaled for dual wave visualization alongside glucose
        hba1cRaw: baseA1c,
        egfr: Math.round(baseEgfr),
        creatinineScaled: Math.round(baseCreatinine * 45),
        creatinineRaw: baseCreatinine,
      };
    });
  }, [patient]);

  const modeConfig = {
    bp_hr: {
      title: 'Blood Pressure & Heart Rate Wave',
      primaryKey: 'systolic',
      primaryLabel: 'Systolic BP',
      primaryUnit: 'mmHg',
      primaryRef: '90 - 120 mmHg',
      secondaryKey: 'heartRate',
      secondaryLabel: 'Heart Rate',
      secondaryUnit: 'bpm',
      secondaryRef: '60 - 100 bpm',
    },
    glucose_a1c: {
      title: 'Fasting Glucose & HbA1c Trajectory',
      primaryKey: 'glucose',
      primaryLabel: 'Fasting Glucose',
      primaryUnit: 'mg/dL',
      primaryRef: '70 - 99 mg/dL',
      secondaryKey: 'hba1cScaled',
      secondaryLabel: 'HbA1c Index',
      secondaryUnit: '%',
      secondaryRef: '< 5.7%',
    },
    renal_egfr: {
      title: 'Glomerular Filtration (eGFR) & Creatinine',
      primaryKey: 'egfr',
      primaryLabel: 'eGFR Clearance',
      primaryUnit: 'mL/min',
      primaryRef: '> 60 mL/min',
      secondaryKey: 'creatinineScaled',
      secondaryLabel: 'Serum Creatinine',
      secondaryUnit: 'mg/dL',
      secondaryRef: '0.50 - 1.10 mg/dL',
    },
  }[mode];

  return (
    <div className="vision-card p-5 flex flex-col justify-between h-full min-h-[340px]">
      {/* Header & Toggle Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Vitals & Biomarker Trajectory
            </h3>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            5-encounter longitudinal wave analysis •{' '}
            <span className="text-teal-700 font-semibold">Local Longitudinal Dataset (5 Encounters)</span>
          </p>
        </div>

        {/* Toggle Pills in Top-Right */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 border border-slate-200 self-start sm:self-auto">
          <button
            onClick={() => setMode('bp_hr')}
            className={`px-2.5 py-1.5 rounded-md text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
              mode === 'bp_hr'
                ? 'bg-[#0B1221] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Blood Pressure & HR
          </button>
          <button
            onClick={() => setMode('glucose_a1c')}
            className={`px-2.5 py-1.5 rounded-md text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
              mode === 'glucose_a1c'
                ? 'bg-[#0B1221] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Glucose & HbA1c
          </button>
          <button
            onClick={() => setMode('renal_egfr')}
            className={`px-2.5 py-1.5 rounded-md text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
              mode === 'renal_egfr'
                ? 'bg-[#0B1221] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Renal Panel (eGFR)
          </button>
        </div>
      </div>

      {/* Recharts Smooth Dual Area Wave Chart */}
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="navyPrimaryWave" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0B1221" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#0B1221" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="tealSecondaryWave" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0D9488" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#0D9488" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="4 4"
              stroke="#E2E8F0"
              vertical={false}
            />
            <XAxis
              dataKey="visitDate"
              stroke="#475569"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#475569"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              domain={['auto', 'auto']}
            />

            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const row = payload[0].payload;
                  const val1 =
                    mode === 'bp_hr'
                      ? `${row.systolic}/${row.diastolic} mmHg`
                      : mode === 'glucose_a1c'
                      ? `${row.glucose} mg/dL`
                      : `${row.egfr} mL/min`;
                  const val2 =
                    mode === 'bp_hr'
                      ? `${row.heartRate} bpm`
                      : mode === 'glucose_a1c'
                      ? `${row.hba1cRaw}%`
                      : `${row.creatinineRaw} mg/dL`;

                  return (
                    <div className="bg-[#0B1221] border border-slate-700 p-3 rounded-lg shadow-xl text-xs space-y-1.5 min-w-[205px] text-white">
                      <div className="flex items-center justify-between border-b border-slate-700 pb-1">
                        <span className="font-bold text-white">{label}</span>
                        <span className="text-[10px] text-teal-400 font-mono">
                          {row.encounterType}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-300 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-white" />
                          {modeConfig.primaryLabel}:
                        </span>
                        <span className="font-bold text-white font-mono">{val1}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono pl-3.5">
                        Ref: {modeConfig.primaryRef}
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-slate-300 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-teal-400" />
                          {modeConfig.secondaryLabel}:
                        </span>
                        <span className="font-bold text-teal-300 font-mono">{val2}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono pl-3.5">
                        Ref: {modeConfig.secondaryRef}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            <Area
              type="monotone"
              dataKey={modeConfig.primaryKey}
              stroke="#0B1221"
              strokeWidth={2.75}
              fillOpacity={1}
              fill="url(#navyPrimaryWave)"
              activeDot={{ r: 5, fill: '#0B1221', stroke: '#FFFFFF', strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey={modeConfig.secondaryKey}
              stroke="#0D9488"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#tealSecondaryWave)"
              activeDot={{ r: 5, fill: '#0D9488', stroke: '#FFFFFF', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Legend Bar */}
      <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-200 text-xs">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5 text-slate-700 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0B1221]" />
            {modeConfig.primaryLabel} ({modeConfig.primaryRef})
          </span>
          <span className="flex items-center gap-1.5 text-slate-700 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0D9488]" />
            {modeConfig.secondaryLabel} ({modeConfig.secondaryRef})
          </span>
        </div>

        <span className="text-[11px] font-mono text-teal-700 font-medium hidden sm:inline">
          Hover wave points for clinical range analysis
        </span>
      </div>
    </div>
  );
};
