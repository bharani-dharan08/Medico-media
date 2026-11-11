/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { FlaskConical } from 'lucide-react';
import { Patient } from '../types/clinical.ts';

interface VisionLabDonutCardProps {
  patient: Patient;
}

export const VisionLabDonutCard: React.FC<VisionLabDonutCardProps> = ({ patient }) => {
  const [scope, setScope] = useState<'cohort' | 'patient'>('cohort');

  // Patient specific lab distribution
  const patientNormal = patient.labReports.filter((l) => l.status === 'NORMAL').length;
  const patientBorderline = patient.labReports.filter(
    (l) => l.status === 'HIGH' || l.status === 'LOW'
  ).length;
  const patientCritical = patient.labReports.filter((l) => l.status === 'CRITICAL').length;
  const patientTotal = patient.labReports.length || 1;

  const data =
    scope === 'cohort'
      ? [
          {
            name: 'Normal Reports',
            value: 62,
            count: 15,
            color: '#0D9488',
          },
          {
            name: 'Borderline / Watch',
            value: 23,
            count: 5,
            color: '#D97706',
          },
          {
            name: 'Critical / Action Needed',
            value: 15,
            count: 4,
            color: '#DC2626',
          },
        ]
      : [
          {
            name: 'Normal Reports',
            value: Math.round((patientNormal / patientTotal) * 100),
            count: patientNormal,
            color: '#0D9488',
          },
          {
            name: 'Borderline / Watch',
            value: Math.round((patientBorderline / patientTotal) * 100),
            count: patientBorderline,
            color: '#D97706',
          },
          {
            name: 'Critical / Action Needed',
            value: Math.round((patientCritical / patientTotal) * 100),
            count: patientCritical,
            color: '#DC2626',
          },
        ];

  const totalLabel = scope === 'cohort' ? '24 Labs' : `${patient.labReports.length} Labs`;

  return (
    <div className="vision-card p-5 flex flex-col justify-between h-full min-h-[260px]">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
            <FlaskConical className="w-4 h-4 text-[#0D9488]" />
            Reports & Lab Distribution
          </h3>
          <p className="text-[11px] text-slate-500">Diagnostic severity stratification</p>
        </div>

        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px]">
          <button
            type="button"
            onClick={() => setScope('cohort')}
            className={`px-2 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
              scope === 'cohort'
                ? 'bg-[#0B1221] text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            24 Labs
          </button>
          <button
            type="button"
            onClick={() => setScope('patient')}
            className={`px-2 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
              scope === 'patient'
                ? 'bg-[#0B1221] text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Patient ({patient.labReports.length})
          </button>
        </div>
      </div>

      {/* Donut Chart with Center Label */}
      <div className="relative h-40 w-full flex items-center justify-center my-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={48}
              outerRadius={66}
              paddingAngle={3}
              dataKey="value"
              stroke="#FFFFFF"
              strokeWidth={2}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="bg-[#0B1221] text-white border border-slate-700 px-3 py-2 rounded-lg shadow-md text-xs">
                      <p className="font-bold">{item.name}</p>
                      <p className="text-slate-300 font-mono">
                        {item.value}% ({item.count} reports)
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Donut Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-lg font-extrabold text-slate-900 tracking-tight tabular-nums">
            {totalLabel}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
            Reviewed
          </span>
        </div>
      </div>

      {/* Legend Bar at Bottom */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 grid grid-cols-3 gap-1.5 text-center">
        {data.map((item) => (
          <div key={item.name} className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-[10px] text-slate-600 font-semibold">
              <span
                className="w-2 h-2 rounded-xs shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="truncate max-w-[72px]">{item.name.split(' ')[0]}</span>
            </div>
            <span className="text-xs font-extrabold text-slate-900 font-mono tabular-nums mt-0.5">
              {item.value}% ({item.count})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
