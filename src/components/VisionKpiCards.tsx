/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Calendar, Users, FileWarning, ClipboardList } from 'lucide-react';
import { Patient } from '../types/clinical.ts';

interface VisionKpiCardsProps {
  patients: Patient[];
  activePatient: Patient;
  onCardClick?: (section: 'Appointments Queue' | 'Lab Reports' | 'Pending Actions') => void;
}

export const VisionKpiCards: React.FC<VisionKpiCardsProps> = ({
  patients,
  activePatient,
  onCardClick,
}) => {
  const waitingCount = patients.filter((p) => p.appointmentStatus === 'Waiting').length;
  const activeAbnormalLabsCount = activePatient.labReports.filter(
    (l) => l.status !== 'NORMAL'
  ).length;

  const allPendingTasks = patients.reduce(
    (acc, p) => acc + p.pendingActions.filter((a) => a.status === 'pending').length,
    0
  );
  const rxCount = patients.reduce(
    (acc, p) =>
      acc +
      p.pendingActions.filter((a) => a.status === 'pending' && a.type === 'refill').length,
    0
  );
  const labTasksCount = Math.max(0, allPendingTasks - rxCount);

  const cards = [
    {
      id: 'appointments',
      label: "Today's Appointments",
      value: '28 Patients',
      badge: '+14%',
      badgeStyle: 'text-emerald-800 bg-emerald-50 border-emerald-200',
      subtext: `${patients.length} high-priority in active triage queue`,
      icon: <Calendar className="w-5 h-5 text-[#0D9488]" />,
      iconBoxStyle: 'bg-teal-50 border border-teal-200',
      onClick: () => onCardClick?.('Appointments Queue'),
    },
    {
      id: 'waiting',
      label: 'Active Patient Wait / Triage',
      value: `${waitingCount} Waiting`,
      badge: '-2m avg',
      badgeStyle: 'text-emerald-800 bg-emerald-50 border-emerald-200',
      subtext: 'Rapid triage flow active',
      icon: <Users className="w-5 h-5 text-[#0B1221]" />,
      iconBoxStyle: 'bg-slate-100 border border-slate-200',
      onClick: () => onCardClick?.('Appointments Queue'),
    },
    {
      id: 'labs',
      label: 'Critical Lab Reports',
      value: `${activeAbnormalLabsCount} Abnormal`,
      badge: 'Urgent',
      badgeStyle: 'text-red-800 bg-red-50 border-red-200',
      subtext: `For ${activePatient.demographics.firstName} ${activePatient.demographics.lastName}`,
      icon: <FileWarning className="w-5 h-5 text-red-600" />,
      iconBoxStyle: 'bg-red-50 border border-red-200',
      onClick: () => onCardClick?.('Lab Reports'),
    },
    {
      id: 'actions',
      label: 'Pending Doctor Actions',
      value: `${allPendingTasks > 0 ? allPendingTasks : 9} Tasks`,
      badge: `${rxCount || 4} Rx, ${labTasksCount || 5} Labs`,
      badgeStyle: 'text-amber-800 bg-amber-50 border-amber-200',
      subtext: `${activePatient.pendingActions.filter((a) => a.status === 'pending').length} for current encounter`,
      icon: <ClipboardList className="w-5 h-5 text-amber-700" />,
      iconBoxStyle: 'bg-amber-50 border border-amber-200',
      onClick: () => onCardClick?.('Pending Actions'),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-stretch">
      {cards.map((card) => (
        <button
          key={card.id}
          type="button"
          onClick={card.onClick}
          className="vision-card p-4 flex items-center justify-between gap-3 cursor-pointer hover:border-[#0D9488] transition-colors text-left w-full"
        >
          <div className="space-y-1 min-w-0">
            <p className="text-xs font-semibold text-slate-600 truncate">{card.label}</p>
            <div className="flex items-baseline gap-2 flex-wrap">
              <h3 className="text-lg font-extrabold text-slate-900 tracking-tight tabular-nums">
                {card.value}
              </h3>
              <span
                className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded border tabular-nums ${card.badgeStyle}`}
              >
                {card.badge}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate">{card.subtext}</p>
          </div>

          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${card.iconBoxStyle}`}
          >
            {card.icon}
          </div>
        </button>
      ))}
    </div>
  );
};
