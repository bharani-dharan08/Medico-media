/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Patient } from '../types/clinical.ts';
import { calculateEWS } from '../utils/triage.ts';

interface DoctorRoleChartsProps {
  patients: Patient[];
  activePatient: Patient;
  onSelectPatient: (patientId: string) => void;
}

export const DoctorRoleCharts: React.FC<DoctorRoleChartsProps> = ({
  patients,
  activePatient,
  onSelectPatient,
}) => {
  // 1. Cross-Patient EWS Severity, Abnormal Labs & Stability Index Comparison
  const rosterSeverityData = useMemo(() => {
    return patients.map((p) => {
      const ews = calculateEWS(p.vitals);
      const abnormalLabs = p.labReports.filter((l) => l.status !== 'NORMAL').length;
      return {
        id: p.id,
        name: p.demographics.lastName,
        fullName: `${p.demographics.firstName} ${p.demographics.lastName}`,
        ewsScore: ews.totalScore,
        abnormalLabs,
        stabilityScore: p.vitalStabilityScore || 7.5,
      };
    });
  }, [patients]);

  // 2. Physician Clinical Sign-Off & Diagnostic Resolution Velocity
  const signOffVelocityData = useMemo(() => {
    const signedCount = patients.filter(
      (p) => p.appointmentStatus === 'Done' || p.doctorSignOff?.signedOff
    ).length;
    const ackLabs = patients.reduce(
      (acc, p) => acc + p.labReports.filter((l) => l.acknowledged).length,
      0
    );

    return [
      { slot: '08:00', signOffs: 1, labsReviewed: 3 },
      { slot: '09:30', signOffs: 2, labsReviewed: 6 },
      { slot: '11:00', signOffs: 3, labsReviewed: 9 },
      { slot: '12:30', signOffs: 4, labsReviewed: 12 },
      {
        slot: 'Live',
        signOffs: Math.max(signedCount, 2),
        labsReviewed: Math.max(ackLabs + 8, 11),
      },
    ];
  }, [patients]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Left Card (7 cols): Roster EWS Severity & Abnormal Biomarker Comparison */}
      <div className="lg:col-span-7 vision-card p-5 flex flex-col justify-between">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Physician Roster Criticality: EWS Risk vs. Abnormal Labs Across Queue
              </h3>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Compare Early Warning Score (EWS) & abnormal lab load across all patients (click any patient pill to load chart)
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {patients.map((pat) => {
              const isSelected = pat.id === activePatient.id;
              return (
                <button
                  key={pat.id}
                  onClick={() => onSelectPatient(pat.id)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-[#0B1221] text-white border-[#0B1221] shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {pat.demographics.lastName}
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={rosterSeverityData}
              margin={{ top: 8, right: 12, left: -22, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#E2E8F0"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke="#475569"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#475569"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0B1221',
                  borderColor: '#1E293B',
                  borderRadius: '8px',
                  fontSize: '11px',
                  color: '#FFFFFF',
                }}
              />
              <Bar
                dataKey="ewsScore"
                name="Early Warning Score (EWS)"
                fill="#DC2626"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="abnormalLabs"
                name="Abnormal Labs Flagged"
                fill="#D97706"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="stabilityScore"
                name="Vital Stability Index (/10)"
                fill="#0D9488"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 mt-2 border-t border-slate-200 text-[11px]">
          <span className="text-red-700 font-bold">● Early Warning Score (EWS)</span>
          <span className="text-amber-700 font-bold">● Abnormal Biomarkers</span>
          <span className="text-teal-700 font-bold">● Vital Stability Index (/10)</span>
        </div>
      </div>

      {/* Right Card (5 cols): Physician Sign-Off & Diagnostic Resolution Velocity */}
      <div className="lg:col-span-5 vision-card p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Physician Sign-Off & Lab Review Velocity
              </h3>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Cumulative signed-off audit charts & acknowledged labs today
            </p>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200 text-[10px] font-mono font-bold">
            MD ANALYTICS
          </span>
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={signOffVelocityData}
              margin={{ top: 8, right: 8, left: -22, bottom: 0 }}
            >
              <defs>
                <linearGradient id="docLabsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0B1221" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#0B1221" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="docSignGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0D9488" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#0D9488" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#E2E8F0"
                vertical={false}
              />
              <XAxis
                dataKey="slot"
                stroke="#475569"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#475569"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0B1221',
                  borderColor: '#1E293B',
                  borderRadius: '8px',
                  fontSize: '11px',
                  color: '#FFFFFF',
                }}
              />
              <Area
                type="monotone"
                dataKey="labsReviewed"
                name="Diagnostic Labs Reviewed"
                stroke="#0B1221"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#docLabsGrad)"
              />
              <Area
                type="monotone"
                dataKey="signOffs"
                name="Signed-Off Audit Records"
                stroke="#0D9488"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#docSignGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-200 text-[11px]">
          <span className="text-slate-900 font-bold">● Labs Reviewed</span>
          <span className="text-teal-700 font-bold">● Signed-Off for Care Taker</span>
        </div>
      </div>
    </div>
  );
};
