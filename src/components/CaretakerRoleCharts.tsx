/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { Activity, Stethoscope, PieChart as PieIcon } from 'lucide-react';
import { Patient, EmergencyNotification } from '../types/clinical.ts';
import { HOSPITAL_SPECIALISTS } from '../data/hospitalRegistry.ts';

interface CaretakerRoleChartsProps {
  patients: Patient[];
  emergencyAlerts: EmergencyNotification[];
}

export const CaretakerRoleCharts: React.FC<CaretakerRoleChartsProps> = ({
  patients,
  emergencyAlerts,
}) => {
  // 1. Live Queue Status Distribution for Donut Chart
  const statusData = useMemo(() => {
    const waiting = patients.filter((p) => p.appointmentStatus === 'Waiting').length;
    const consult = patients.filter(
      (p) => p.appointmentStatus === 'In-Consultation'
    ).length;
    const emergency = patients.filter((p) => p.appointmentStatus === 'Emergency').length;
    const done = patients.filter((p) => p.appointmentStatus === 'Done').length;

    return [
      { name: 'Waiting Triage', value: waiting, color: '#D97706' },
      { name: 'In-Consultation', value: consult, color: '#0D9488' },
      {
        name: 'Emergency Flagged',
        value: Math.max(
          emergency,
          emergencyAlerts.filter((a) => !a.acknowledgedByDoctor).length
        ),
        color: '#DC2626',
      },
      { name: 'Signed Off (Done)', value: done, color: '#059669' },
    ];
  }, [patients, emergencyAlerts]);

  // 2. Specialist Allotment Workload Bar Chart
  const specialistWorkloadData = useMemo(() => {
    return HOSPITAL_SPECIALISTS.map((doc) => {
      const allottedCount = patients.filter(
        (p) =>
          p.assignedDoctorId === doc.id ||
          (p.assignedDoctorName && p.assignedDoctorName.includes(doc.name.split(',')[0]))
      ).length;
      const shortDoc = doc.name.replace('Dr. ', '').split(',')[0];
      const shortSpec = doc.specialty.split(' ')[0];
      return {
        doctor: shortDoc,
        specialty: shortSpec,
        allotted: allottedCount,
        critical: patients.filter(
          (p) =>
            p.assignedDoctorId === doc.id &&
            (p.triageLevel.includes('Emergent') ||
              p.triageLevel.includes('Resuscitation') ||
              p.appointmentStatus === 'Emergency')
        ).length,
      };
    });
  }, [patients]);

  // 3. Hourly Shift Intake & Vitals Triage Velocity Area Chart
  const intakeVelocityData = useMemo(() => {
    const dynamicCurrent = patients.length;
    const abnormalCount = patients.filter(
      (p) => p.vitals.abnormalities.length > 0
    ).length;
    return [
      { shiftHour: '06:00', intakes: 2, abnormalVitals: 1 },
      { shiftHour: '08:00', intakes: 4, abnormalVitals: 2 },
      { shiftHour: '10:00', intakes: 6, abnormalVitals: 3 },
      { shiftHour: '12:00', intakes: 5, abnormalVitals: 2 },
      { shiftHour: '14:00', intakes: 7, abnormalVitals: 4 },
      {
        shiftHour: 'Now',
        intakes: dynamicCurrent,
        abnormalVitals: abnormalCount,
      },
    ];
  }, [patients]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Chart 1 (4 cols): Hourly Intake & Vitals Triage Velocity */}
      <div className="lg:col-span-4 vision-card p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Shift Intake & Triage Velocity
              </h3>
            </div>
            <p className="text-[11px] text-slate-600">
              Patient registrations vs. abnormal vitals flagged
            </p>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200 text-[10px] font-mono font-bold">
            LIVE SHIFT
          </span>
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={intakeVelocityData}
              margin={{ top: 8, right: 8, left: -22, bottom: 0 }}
            >
              <defs>
                <linearGradient id="ctIntakeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0D9488" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#0D9488" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="ctAbnGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D97706" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#D97706" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#E2E8F0"
                vertical={false}
              />
              <XAxis
                dataKey="shiftHour"
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
                dataKey="intakes"
                name="Total Intakes"
                stroke="#0D9488"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#ctIntakeGrad)"
              />
              <Area
                type="monotone"
                dataKey="abnormalVitals"
                name="Abnormal Vitals Flagged"
                stroke="#D97706"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#ctAbnGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-200 text-[11px]">
          <span className="text-teal-700 font-bold">
            ● {patients.length} Active Records Registered
          </span>
          <span className="text-amber-700 font-mono font-semibold">
            ● {patients.filter((p) => p.vitals.abnormalities.length > 0).length} Vitals Alerts
          </span>
        </div>
      </div>

      {/* Chart 2 (4 cols): Specialist Doctor Allotment Workload */}
      <div className="lg:col-span-4 vision-card p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-1.5">
              <Stethoscope className="w-4 h-4 text-slate-900" />
              <h3 className="text-sm font-bold text-slate-900">
                Specialist Allotment Workload
              </h3>
            </div>
            <p className="text-[11px] text-slate-600">
              Patients allotted per specialist physician
            </p>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200 text-[10px] font-mono font-bold">
            {HOSPITAL_SPECIALISTS.length} DOCTORS
          </span>
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={specialistWorkloadData}
              margin={{ top: 8, right: 8, left: -24, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#E2E8F0"
                vertical={false}
              />
              <XAxis
                dataKey="doctor"
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
                allowDecimals={false}
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
                dataKey="allotted"
                name="Allotted Patients"
                fill="#0B1221"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="critical"
                name="Critical / Emergent"
                fill="#DC2626"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-200 text-[11px]">
          <span className="text-slate-900 font-bold">● Total Allotted</span>
          <span className="text-red-700 font-bold">● High-Criticality Cases</span>
        </div>
      </div>

      {/* Chart 3 (4 cols): Care Taker Live Queue Status Donut */}
      <div className="lg:col-span-4 vision-card p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="flex items-center gap-1.5">
              <PieIcon className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Roster Status & Sign-Off Mix
              </h3>
            </div>
            <p className="text-[11px] text-slate-600">
              Real-time Care Taker queue & doctor directives
            </p>
          </div>
          <span className="text-xs font-mono font-extrabold text-slate-900">
            {patients.length} Total
          </span>
        </div>

        <div className="grid grid-cols-12 items-center gap-2 my-auto">
          <div className="col-span-6 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={36}
                  outerRadius={58}
                  paddingAngle={4}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B1221',
                    borderColor: '#1E293B',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#FFFFFF',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="col-span-6 space-y-2 text-xs">
            {statusData.map((s) => (
              <div key={s.name} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="text-[11px] text-slate-600 truncate">{s.name}</span>
                </div>
                <span className="font-mono font-extrabold text-slate-900 text-xs">
                  {s.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-200 text-[11px]">
          <span className="text-slate-600">Doctor Directives Ready:</span>
          <span className="font-mono font-bold text-emerald-700">
            {patients.filter((p) => p.doctorSignOff?.signedOff).length} Signed Off
          </span>
        </div>
      </div>
    </div>
  );
};
