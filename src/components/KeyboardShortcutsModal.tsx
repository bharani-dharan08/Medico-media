/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Keyboard, Command } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: '1 – 5', description: 'Switch immediately to Patient #1 through #5 in queue' },
    { key: 'Alt + A', description: 'Toggle "Show Only Abnormal Labs" filter' },
    { key: 'Alt + U', description: 'Toggle "Show Urgent Pending Actions" filter' },
    { key: 'Alt + N', description: 'Open Quick Clinical Order & SOAP Note modal' },
    { key: 'Alt + K', description: 'Show / hide this Keyboard Shortcuts cheat sheet' },
    { key: 'Escape', description: 'Close any active dialog or full report modal' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-md w-full text-slate-100 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-teal-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              Clinician Rapid Keyboard Shortcuts
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close shortcuts modal"
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-2 text-xs">
          <p className="text-slate-400 text-[11px] mb-3">
            Designed for rapid hands-on-keyboard chart review during high-volume ambulatory and emergency encounters.
          </p>

          <div className="space-y-2">
            {shortcuts.map((sc, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800/80"
              >
                <span className="text-slate-300">{sc.description}</span>
                <kbd className="px-2 py-1 rounded bg-slate-800 border border-slate-700 font-mono text-[11px] font-semibold text-teal-300 shadow-xs shrink-0">
                  {sc.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        <div className="p-3 border-t border-slate-800 bg-slate-950/70 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors cursor-pointer"
          >
            Got it (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};
