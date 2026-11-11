/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sparkles, AlertCircle, AlertTriangle, Info, Check, RefreshCw, FileText } from 'lucide-react';
import { Patient, ClinicalPriority } from '../types/clinical.ts';
import { computeClinicalPriorities } from '../utils/triage.ts';

interface AiSynthesisCardProps {
  patient: Patient;
  onInsertToNotes: (text: string) => void;
}

export const AiSynthesisCard: React.FC<AiSynthesisCardProps> = ({
  patient,
  onInsertToNotes,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const priorities: ClinicalPriority[] = computeClinicalPriorities(patient);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 450);
  };

  const handleCopyAll = () => {
    const summary = priorities
      .map(
        (p, i) =>
          `Priority ${i + 1}: ${p.headline}\nRationale: ${p.rationale}\nRecommended: ${p.recommendedAction}\nEvidence: ${p.sourceData}`
      )
      .join('\n\n');
    onInsertToNotes(`AI Pre-Encounter Clinical Synthesis:\n${summary}`);
    setCopiedId('all');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-slate-900 border border-teal-800/80 rounded-lg p-4 shadow-xs text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-teal-500/20 text-teal-400 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-semibold tracking-wide text-white uppercase flex items-center gap-2">
              AI Pre-Encounter Clinical Synthesis
              <span className="text-[10px] text-teal-300 font-mono font-normal">
                [Top 3 Actionable Priorities]
              </span>
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-teal-400' : ''}`} />
            <span>Re-analyze</span>
          </button>

          <button
            onClick={handleCopyAll}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-teal-300 hover:text-teal-100 bg-teal-950/80 border border-teal-800 hover:bg-teal-900 rounded transition-colors cursor-pointer"
          >
            {copiedId === 'all' ? (
              <>
                <Check className="w-3 h-3 text-teal-400" />
                <span>Transferred to Notes</span>
              </>
            ) : (
              <>
                <FileText className="w-3 h-3 text-teal-400" />
                <span>Insert in Notes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3 Clinical Priorities */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {priorities.map((item, index) => {
          const isCritical = item.level === 'critical';
          const isUrgent = item.level === 'urgent';

          return (
            <div
              key={item.id}
              className={`p-3 rounded border text-left flex flex-col justify-between ${
                isCritical
                  ? 'bg-rose-950/30 border-rose-900/60'
                  : isUrgent
                  ? 'bg-amber-950/20 border-amber-900/50'
                  : 'bg-slate-800/40 border-slate-700/60'
              }`}
            >
              <div>
                {/* Level Badge and Index */}
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="text-[10px] font-mono font-bold text-slate-400">
                    PRIORITY 0{index + 1}
                  </span>
                  <span
                    className={`text-[10px] font-bold flex items-center gap-1 ${
                      isCritical
                        ? 'text-rose-400'
                        : isUrgent
                        ? 'text-amber-400'
                        : 'text-teal-400'
                    }`}
                  >
                    {isCritical ? (
                      <AlertCircle className="w-3 h-3 shrink-0" />
                    ) : isUrgent ? (
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                    ) : (
                      <Info className="w-3 h-3 shrink-0" />
                    )}
                    {isCritical
                      ? '[CRITICAL]'
                      : isUrgent
                      ? '[HIGH PRIORITY]'
                      : '[MONITORING]'}
                  </span>
                </div>

                {/* Headline */}
                <h4 className="text-xs font-semibold text-white leading-snug mb-1.5">
                  {item.headline}
                </h4>

                {/* Clinical Rationale */}
                <p className="text-[11px] text-slate-300 leading-relaxed mb-2">
                  {item.rationale}
                </p>
              </div>

              {/* Action and Source Evidence */}
              <div className="pt-2 border-t border-slate-800/80 mt-1">
                <div className="text-[10px] text-teal-300 font-medium mb-1">
                  <span className="text-slate-400">Recommended: </span>
                  {item.recommendedAction}
                </div>
                <div className="text-[10px] text-slate-400 font-mono tabular-nums truncate">
                  Evidence: {item.sourceData}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
