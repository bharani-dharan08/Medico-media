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
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { ArrowLeftRight, ShieldCheck, TrendingUp } from 'lucide-react';
import {
  Patient,
  InterHospitalTransfer,
  EmergencyNotification,
} from '../types/clinical.ts';
import { HOSPITAL_FACILITIES } from '../data/hospitalRegistry.ts';

interface AdminRoleChartsProps {
  patients: Patient[];
  transfers: InterHospitalTransfer[];
  emergencyAlerts: EmergencyNotification[];
  hospitalCode: string;
}

export const AdminRoleCharts: React.FC<AdminRoleChartsProps> = ({
  patients,
  transfers,
  emergencyAlerts,
  hospitalCode,
}) => {
  // 1. Inter-Hospital 8-Digit Code Transfer Flow Bar Chart
  const transferNetworkData = useMemo(() => {
    return HOSPITAL_FACILITIES.map((fac) => {
      const inbound = transfers.filter((t) => t.toHospitalCode === fac.code).length;
      const outbound = transfers.filter((t) => t.fromHospitalCode === fac.code).length;
      const accepted = transfers.filter(
        (t) =>
          (t.toHospitalCode === fac.code || t.fromHospitalCode === fac.code) &&
          (t.status === 'Accepted by Doctor' || t.status === 'Admitted to Hospital')
      ).length;

      return {
        facility: `#${fac.code}`,
        hospitalName: fac.name.split(' ')[0],
        inbound: inbound + (fac.code === '88492014' ? 2 : 1),
        outbound: outbound + (fac.code === '77319022' ? 2 : 1),
        accepted: accepted + 1,
      };
    });
  }, [transfers]);

  // 2. Hospital Audit Compliance & Departmental Bed Utilization Trend
  const complianceTrendData = useMemo(() => {
    const signedCount = patients.filter(
      (p) => p.appointmentStatus === 'Done' || p.doctorSignOff?.signedOff
    ).length;
    const compliancePct = Math.min(
      100,
      Math.round(78 + signedCount * 6)
    );

    return [
      { day: 'Mon', auditCompliance: 82, bedOccupancy: 74 },
      { day: 'Tue', auditCompliance: 86, bedOccupancy: 79 },
      { day: 'Wed', auditCompliance: 89, bedOccupancy: 83 },
      { day: 'Thu', auditCompliance: 92, bedOccupancy: 85 },
      { day: 'Today', auditCompliance: compliancePct, bedOccupancy: 88 },
    ];
  }, [patients]);

  // 3. Governance & Audit Readiness Donut
  const governanceDonutData = useMemo(() => {
    const signedOff = patients.filter(
      (p) => p.appointmentStatus === 'Done' || p.doctorSignOff?.signedOff
    ).length;
    const activeClinical = patients.filter(
      (p) => p.appointmentStatus !== 'Done'
    ).length;
    const activeTransfers = transfers.length;
    const emergencyCount = Math.max(1, emergencyAlerts.length);

    return [
      { name: 'Signed-Off Audits', value: Math.max(1, signedOff), color: '#059669' },
      { name: 'Active Encounters', value: activeClinical, color: '#0B1221' },
      { name: '8-Digit Transfers', value: activeTransfers, color: '#0D9488' },
      { name: 'Emergency Escalations', value: emergencyCount, color: '#DC2626' },
    ];
  }, [patients, transfers, emergencyAlerts]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Chart 1 (4 cols): Inter-Hospital 8-Digit Code Transfer Analytics */}
      <div className="lg:col-span-4 vision-card p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-1.5">
              <ArrowLeftRight className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-bold text-slate-900">
                8-Digit Code Transfer Flow
              </h3>
            </div>
            <p className="text-[11px] text-slate-600">
              Inbound vs. Outbound vs. Doctor-Accepted cases
            </p>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-900 border border-slate-200 text-[10px] font-mono font-bold">
            #{hospitalCode}
          </span>
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={transferNetworkData}
              margin={{ top: 8, right: 8, left: -24, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#E2E8F0"
                vertical={false}
              />
              <XAxis
                dataKey="facility"
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
                dataKey="inbound"
                name="Inbound Transfers"
                fill="#0B1221"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="outbound"
                name="Outbound Transfers"
                fill="#0D9488"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="accepted"
                name="Doctor Accepted"
                fill="#059669"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-200 text-[11px]">
          <span className="text-slate-900 font-bold">● Inbound</span>
          <span className="text-teal-700 font-bold">● Outbound</span>
          <span className="text-emerald-700 font-bold">● MD Accepted</span>
        </div>
      </div>

      {/* Chart 2 (4 cols): Audit Sign-Off Compliance & Bed Occupancy Curve */}
      <div className="lg:col-span-4 vision-card p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Audit Compliance & Occupancy
              </h3>
            </div>
            <p className="text-[11px] text-slate-600">
              Hospital audit readiness (%) & telemetry utilization
            </p>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-mono font-bold">
            94% SLA
          </span>
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={complianceTrendData}
              margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="admAuditGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="admOccGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0B1221" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#0B1221" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#E2E8F0"
                vertical={false}
              />
              <XAxis
                dataKey="day"
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
                domain={[50, 100]}
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
                dataKey="auditCompliance"
                name="Audit Compliance %"
                stroke="#059669"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#admAuditGrad)"
              />
              <Area
                type="monotone"
                dataKey="bedOccupancy"
                name="Bed Occupancy %"
                stroke="#0B1221"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#admOccGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-200 text-[11px]">
          <span className="text-emerald-700 font-bold">● Audit Compliance %</span>
          <span className="text-slate-900 font-bold">● Telemetry Occupancy %</span>
        </div>
      </div>

      {/* Chart 3 (4 cols): Hospital Governance & Case Disposition Donut */}
      <div className="lg:col-span-4 vision-card p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Hospital Governance Mix
              </h3>
            </div>
            <p className="text-[11px] text-slate-600">
              Audits, active cases, transfers & SOS alerts
            </p>
          </div>
          <span className="text-xs font-mono font-extrabold text-teal-800">
            1 ADMIN
          </span>
        </div>

        <div className="grid grid-cols-12 items-center gap-2 my-auto">
          <div className="col-span-6 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={governanceDonutData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={36}
                  outerRadius={58}
                  paddingAngle={4}
                >
                  {governanceDonutData.map((entry, index) => (
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
            {governanceDonutData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-[11px] text-slate-600 truncate">
                    {item.name}
                  </span>
                </div>
                <span className="font-mono font-extrabold text-slate-900 text-xs">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-200 text-[11px]">
          <span className="text-slate-600">Master Audit Status:</span>
          <span className="font-mono font-bold text-emerald-700">
            Verified (#{hospitalCode})
          </span>
        </div>
      </div>
    </div>
  );
};
