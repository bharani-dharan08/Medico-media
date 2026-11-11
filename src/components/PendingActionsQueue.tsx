/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ListChecks,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  FileCheck,
  Send,
  Pill,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { PendingAction, Patient } from '../types/clinical.ts';

interface PendingActionsQueueProps {
  patient: Patient;
  onlyUrgent: boolean;
  onToggleOnlyUrgent: () => void;
  onExecuteAction: (actionId: string) => void;
  onOpenQuickAdd: () => void;
}

export const PendingActionsQueue: React.FC<PendingActionsQueueProps> = ({
  patient,
  onlyUrgent,
  onToggleOnlyUrgent,
  onExecuteAction,
  onOpenQuickAdd,
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');

  const pendingList = patient.pendingActions.filter((a) => {
    if (a.status !== 'pending') return false;
    if (onlyUrgent && a.urgency !== 'urgent') return false;
    return true;
  });

  const completedList = patient.pendingActions.filter((a) => a.status === 'completed');

  const getActionLabel = (type: PendingAction['type']) => {
    switch (type) {
      case 'refill':
        return 'Approve Refill';
      case 'critical_lab':
        return 'Acknowledge Critical Lab';
      case 'referral':
        return 'Authorize Referral';
      default:
        return 'Sign & Complete';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-slate-100">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ListChecks className="w-4 h-4 text-teal-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
            Actionable Clinical Orders & Audit Log
          </h3>
          <span className="text-[10px] text-amber-400 font-mono font-bold tabular-nums">
            [{pendingList.length} PENDING]
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onToggleOnlyUrgent}
            className={`px-2.5 py-1 text-xs font-medium rounded border transition-colors flex items-center gap-1.5 cursor-pointer ${
              onlyUrgent
                ? 'bg-rose-950/70 border-rose-600 text-rose-200'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            <AlertCircle className="w-3 h-3 text-rose-400" />
            <span>Urgent Only</span>
            <span className="text-[10px] text-slate-400 font-mono">(Alt+U)</span>
          </button>

          <div className="flex items-center gap-1 p-0.5 bg-slate-950/60 rounded border border-slate-800">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-3 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer ${
                activeTab === 'pending'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Actionable ({patient.pendingActions.filter((a) => a.status === 'pending').length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-3 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer ${
                activeTab === 'completed'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Audit Trail ({completedList.length})
            </button>
          </div>
        </div>
      </div>

      {/* Action Items List */}
      {activeTab === 'pending' ? (
        <div className="space-y-2.5">
          {pendingList.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No pending orders requiring clinician sign-off at this time.
            </div>
          ) : (
            pendingList.map((action) => {
              const isUrgent = action.urgency === 'urgent';

              return (
                <div
                  key={action.id}
                  className={`p-3 rounded border flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs transition-colors ${
                    isUrgent
                      ? 'bg-rose-950/20 border-rose-900/70 hover:bg-rose-950/30'
                      : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white">
                        {action.title}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          isUrgent
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        [{action.urgency.toUpperCase()}]
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Queue Entry: {action.createdAt}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {action.description}
                    </p>
                  </div>

                  {/* Primary interactive execution button */}
                  <button
                    onClick={() => onExecuteAction(action.id)}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 active:scale-98 rounded transition-all shadow-xs shrink-0 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{getActionLabel(action.type)}</span>
                  </button>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Completed Actions with Audit Trail */
        <div className="space-y-3">
          {completedList.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No completed actions in audit history for this encounter.
            </div>
          ) : (
            completedList.map((action) => (
              <div
                key={action.id}
                className="p-3 bg-slate-950/60 border border-slate-800/80 rounded text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">
                    {action.title}
                  </span>
                  <span className="text-[10px] text-teal-400 font-mono font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    [EXECUTED & LOGGED]
                  </span>
                </div>

                <p className="text-[11px] text-slate-400">
                  {action.description}
                </p>

                {/* Audit Trail Log Entries */}
                <div className="p-2 bg-slate-900 border border-slate-800 rounded space-y-1">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
                    Electronic Medical Record Audit Signature:
                  </span>
                  {action.auditTrail.map((log, index) => (
                    <div
                      key={index}
                      className="text-[10px] text-slate-300 font-mono flex items-baseline gap-2"
                    >
                      <span className="text-teal-400 tabular-nums">[{log.timestamp}]</span>
                      <span className="font-semibold text-white">{log.actor}:</span>
                      <span>{log.action}</span>
                      {log.details && (
                        <span className="text-slate-500 italic">({log.details})</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
