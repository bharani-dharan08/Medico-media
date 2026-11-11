/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Search, Clock, AlertTriangle, CheckCircle2, ChevronRight, User } from 'lucide-react';
import { Patient, AppointmentStatus } from '../types/clinical.ts';

interface PatientQueueProps {
  patients: Patient[];
  selectedPatientId: string;
  onSelectPatient: (patientId: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onUpdateStatus: (patientId: string, status: AppointmentStatus) => void;
}

export const PatientQueue: React.FC<PatientQueueProps> = ({
  patients,
  selectedPatientId,
  onSelectPatient,
  statusFilter,
  onStatusFilterChange,
  searchQuery,
  onSearchQueryChange,
  onUpdateStatus,
}) => {
  const filterTabs = ['All', 'Waiting', 'In-Consultation', 'Done'];

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 text-slate-200">
      {/* Queue Header */}
      <div className="p-3.5 border-b border-slate-800">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-sm font-semibold tracking-wide text-white uppercase flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-400" />
            Appointments Queue
          </h2>
          <span className="text-xs text-slate-400 font-mono tabular-nums">
            {patients.length} scheduled
          </span>
        </div>

        {/* Search Input */}
        <div className="relative mb-2.5">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search patient name, MRN..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-950/80 border border-slate-700 rounded text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-950/60 rounded border border-slate-800">
          {filterTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => onStatusFilterChange(tab)}
              className={`flex-1 py-1 text-[11px] font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === tab
                  ? 'bg-slate-800 text-white shadow-xs font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Patient List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80">
        {patients.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            No patients match current queue filters.
          </div>
        ) : (
          patients.map((p, idx) => {
            const isSelected = p.id === selectedPatientId;
            const pendingUrgentCount = p.pendingActions.filter(
              (a) => a.urgency === 'urgent' && a.status === 'pending'
            ).length;
            const isEmergent = p.triageLevel.includes('Emergent');

            return (
              <div
                key={p.id}
                onClick={() => onSelectPatient(p.id)}
                className={`p-3 text-left transition-colors cursor-pointer border-l-2 ${
                  isSelected
                    ? 'bg-slate-800/90 border-l-teal-400'
                    : 'bg-transparent border-l-transparent hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-mono text-slate-400">#{idx + 1}</span>
                    <span className="text-xs font-semibold text-white">
                      {p.demographics.lastName}, {p.demographics.firstName}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono tabular-nums text-slate-400 shrink-0">
                    {p.timeSlot}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-1.5">
                  <span>{p.demographics.age}y {p.demographics.gender[0]}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{p.mrn}</span>
                  <span aria-hidden="true">·</span>
                  <span
                    className={
                      p.appointmentStatus === 'Waiting'
                        ? 'text-amber-400 font-medium'
                        : p.appointmentStatus === 'In-Consultation'
                        ? 'text-teal-400 font-medium'
                        : 'text-slate-400'
                    }
                  >
                    {p.appointmentStatus}
                  </span>
                </div>

                {/* Chief Complaint snippet */}
                <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed mb-2">
                  {p.chiefComplaint}
                </p>

                {/* Badges and Quick Status Action */}
                <div className="flex items-center justify-between gap-1 text-[10px]">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {isEmergent && (
                      <span className="text-red-400 font-semibold flex items-center gap-0.5">
                        <AlertTriangle className="w-3 h-3 text-red-400" />
                        [EMERGENT]
                      </span>
                    )}
                    {pendingUrgentCount > 0 && (
                      <span className="text-amber-400 font-semibold tabular-nums">
                        [{pendingUrgentCount} URGENT ORDER{pendingUrgentCount > 1 ? 'S' : ''}]
                      </span>
                    )}
                  </div>

                  {/* Status update select */}
                  <select
                    value={p.appointmentStatus}
                    onChange={(e) => {
                      e.stopPropagation();
                      onUpdateStatus(p.id, e.target.value as AppointmentStatus);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-slate-900 border border-slate-700 text-slate-300 rounded px-1.5 py-0.5 text-[10px] cursor-pointer hover:border-slate-500 focus:outline-hidden"
                  >
                    <option value="Waiting">Waiting</option>
                    <option value="In-Consultation">In-Consult</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
