/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, FileText, Plus, User, Clock, Tag } from 'lucide-react';
import { Patient } from '../types/clinical.ts';

interface NotesHistoryModalProps {
  isOpen: boolean;
  patient: Patient;
  onClose: () => void;
  onOpenQuickAdd: () => void;
}

export const NotesHistoryModal: React.FC<NotesHistoryModalProps> = ({
  isOpen,
  patient,
  onClose,
  onOpenQuickAdd,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-2xl w-full text-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-teal-500/20 text-teal-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Encounter Notes & SOAP Documentation
              </h3>
              <p className="text-[11px] text-slate-400">
                Patient: {patient.demographics.lastName}, {patient.demographics.firstName} ({patient.mrn})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenQuickAdd();
              }}
              className="flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Note</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {patient.clinicalNotes.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No notes logged for this encounter yet. Click "Add Note" to record clinical documentation.
            </div>
          ) : (
            patient.clinicalNotes.map((note) => (
              <div
                key={note.id}
                className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-lg space-y-2 text-xs"
              >
                <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-teal-300 font-mono text-[11px]">
                      [{note.type.toUpperCase()}]
                    </span>
                    <span className="text-white font-medium">{note.author}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono tabular-nums flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {note.timestamp}
                  </span>
                </div>

                <p className="text-slate-200 text-xs whitespace-pre-line leading-relaxed font-sans">
                  {note.content}
                </p>

                {note.tags && note.tags.length > 0 && (
                  <div className="flex items-center gap-2 pt-1 text-[10px] text-slate-400">
                    <Tag className="w-3 h-3 text-slate-500" />
                    <span>Tags:</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {note.tags.map((tag, i) => (
                        <span key={i} className="text-slate-300 font-mono">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/70 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
