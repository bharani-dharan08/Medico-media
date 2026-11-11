/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  ClipboardCheck,
  Pill,
  FileWarning,
  Send,
  CheckCircle2,
  Plus,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { Patient, PendingAction } from '../types/clinical.ts';

interface VisionPendingTimelineCardProps {
  patient: Patient;
  onlyUrgent: boolean;
  onToggleOnlyUrgent: () => void;
  onExecuteAction: (actionId: string) => void;
  onOpenQuickAdd: () => void;
}

export const VisionPendingTimelineCard: React.FC<VisionPendingTimelineCardProps> = ({
  patient,
  onlyUrgent,
  onToggleOnlyUrgent,
  onExecuteAction,
  onOpenQuickAdd,
}) => {
  const actions = patient.pendingActions.filter((a) =>
    onlyUrgent ? a.urgency === 'urgent' : true
  );

  const pendingCount = patient.pendingActions.filter((a) => a.status === 'pending').length;

  const getActionConfig = (action: PendingAction) => {
    switch (action.type) {
      case 'refill':
        return {
          icon: <Pill className="w-3.5 h-3.5 text-white" />,
          iconBg: 'bg-[#0D9488]',
          buttonText: 'Approve',
          btnClass:
            'bg-[#0B1221] text-white hover:bg-slate-800 shadow-xs',
        };
      case 'critical_lab':
        return {
          icon: <FileWarning className="w-3.5 h-3.5 text-white" />,
          iconBg: 'bg-red-600',
          buttonText: 'Sign Lab',
          btnClass:
            'bg-red-600 text-white hover:bg-red-700 shadow-xs',
        };
      case 'referral':
        return {
          icon: <Send className="w-3.5 h-3.5 text-white" />,
          iconBg: 'bg-amber-600',
          buttonText: 'Send Referral',
          btnClass:
            'bg-amber-500 text-slate-950 font-extrabold hover:bg-amber-400 shadow-xs',
        };
      default:
        return {
          icon: <ClipboardCheck className="w-3.5 h-3.5 text-white" />,
          iconBg: 'bg-emerald-600',
          buttonText: 'Complete',
          btnClass: 'bg-emerald-600 text-white hover:bg-emerald-700',
        };
    }
  };

  return (
    <div className="vision-card p-5 flex flex-col justify-between h-full">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <ClipboardCheck className="w-4 h-4 text-teal-600" />
              Pending Actions & Sign-Offs
            </h3>
            <p className="text-[11px] text-slate-600">
              {pendingCount} active physician orders for {patient.demographics.firstName}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onToggleOnlyUrgent}
              className={`px-2 py-1 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
                onlyUrgent
                  ? 'bg-amber-50 border-amber-300 text-amber-800'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              Urgent Only
            </button>
            <button
              onClick={onOpenQuickAdd}
              title="Add new pending order"
              className="p-1.5 rounded-md bg-teal-50 hover:bg-[#0D9488] text-teal-800 hover:text-white border border-teal-200 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Vertical Timeline List */}
        <div className="relative pl-4 mt-4 space-y-4 before:content-[''] before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {actions.map((action) => {
            const cfg = getActionConfig(action);
            const isCompleted = action.status === 'completed';
            const latestAudit = action.auditTrail[action.auditTrail.length - 1];

            return (
              <div key={action.id} className="relative pl-5 group">
                {/* Timeline Node Icon */}
                <div
                  className={`absolute -left-[9px] top-0.5 w-6 h-6 rounded-md flex items-center justify-center z-10 shadow-xs ${
                    isCompleted
                      ? 'bg-emerald-600'
                      : cfg.iconBg
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  ) : (
                    cfg.icon
                  )}
                </div>

                {/* Card Body */}
                <div
                  className={`p-3 rounded-lg border transition-all ${
                    isCompleted
                      ? 'bg-emerald-50/40 border-emerald-200 opacity-85'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {action.urgency === 'urgent' && !isCompleted && (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                            [STAT]
                          </span>
                        )}
                        <h4
                          className={`text-xs font-bold leading-snug ${
                            isCompleted ? 'line-through text-slate-500' : 'text-slate-900'
                          }`}
                        >
                          {action.title}
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {action.description}
                      </p>
                    </div>

                    {/* One-Click Sign-Off Button */}
                    <div className="shrink-0">
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          Signed
                        </span>
                      ) : (
                        <button
                          onClick={() => onExecuteAction(action.id)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all active:scale-95 cursor-pointer whitespace-nowrap ${cfg.btnClass}`}
                        >
                          {cfg.buttonText}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Timestamp & Audit Log Footer */}
                  <div className="mt-2 pt-1.5 border-t border-slate-200/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-teal-600" />
                      Created {action.createdAt}
                    </span>
                    {latestAudit && (
                      <span className="text-emerald-700 font-semibold truncate max-w-[170px]">
                        ✓ {latestAudit.action} ({latestAudit.timestamp})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Audit Compliance Footer */}
      <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
          Local Physician Sign-Off & Audit Log
        </span>
        <span className="font-mono text-slate-900 font-bold">Dr. S. Chen, MD</span>
      </div>
    </div>
  );
};
