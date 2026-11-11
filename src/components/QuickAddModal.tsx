/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Plus, FileText, Send, AlertTriangle, Pill, ClipboardList } from 'lucide-react';
import { Patient, PendingAction, ClinicalNote } from '../types/clinical.ts';

interface QuickAddModalProps {
  isOpen: boolean;
  patient: Patient;
  initialNoteText?: string;
  onClose: () => void;
  onAddAction: (actionData: {
    title: string;
    type: PendingAction['type'];
    description: string;
    urgency: PendingAction['urgency'];
  }) => void;
  onAddNote: (noteData: {
    type: ClinicalNote['type'];
    content: string;
    tags?: string[];
  }) => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  patient,
  initialNoteText = '',
  onClose,
  onAddAction,
  onAddNote,
}) => {
  const [mode, setMode] = useState<'action' | 'note'>('action');

  // Action fields
  const [actionTitle, setActionTitle] = useState('');
  const [actionType, setActionType] = useState<PendingAction['type']>('refill');
  const [actionUrgency, setActionUrgency] = useState<PendingAction['urgency']>('routine');
  const [actionDesc, setActionDesc] = useState('');

  // Note fields
  const [noteType, setNoteType] = useState<ClinicalNote['type']>('SOAP');
  const [noteContent, setNoteContent] = useState(initialNoteText);
  const [noteTags, setNoteTags] = useState('In-Consultation');

  useEffect(() => {
    if (initialNoteText) {
      setMode('note');
      setNoteContent(initialNoteText);
    }
  }, [initialNoteText]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmitAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionTitle.trim()) return;

    onAddAction({
      title: actionTitle.trim(),
      type: actionType,
      description: actionDesc.trim() || 'No additional instructions provided.',
      urgency: actionUrgency,
    });

    setActionTitle('');
    setActionDesc('');
    onClose();
  };

  const handleSubmitNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    const tags = noteTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    onAddNote({
      type: noteType,
      content: noteContent.trim(),
      tags: tags.length ? tags : ['Encounter Note'],
    });

    setNoteContent('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-lg w-full text-slate-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/70">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              <Plus className="w-4 h-4 text-teal-400" />
              Quick Clinical Order or Progress Note
            </h3>
            <p className="text-[11px] text-slate-400">
              Active Patient: {patient.demographics.lastName}, {patient.demographics.firstName} ({patient.mrn})
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="p-3 bg-slate-950/40 border-b border-slate-800 flex gap-2">
          <button
            type="button"
            onClick={() => setMode('action')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'action'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Clinical Order / Action</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('note')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'note'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Progress / SOAP Note</span>
          </button>
        </div>

        {/* Action Form */}
        {mode === 'action' ? (
          <form onSubmit={handleSubmitAction} className="p-4 space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Order / Action Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Order Stat 12-Lead ECG Recheck, Authorize Nephrology Consult"
                value={actionTitle}
                onChange={(e) => setActionTitle(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded text-white focus:outline-hidden focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Action Classification
                </label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value as PendingAction['type'])}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded text-white focus:outline-hidden focus:border-teal-500"
                >
                  <option value="refill">Medication Refill / Prescription</option>
                  <option value="critical_lab">Stat Diagnostic / Lab Order</option>
                  <option value="referral">Specialist Referral</option>
                  <option value="vitals_recheck">Vitals Recheck</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Urgency Level
                </label>
                <select
                  value={actionUrgency}
                  onChange={(e) => setActionUrgency(e.target.value as PendingAction['urgency'])}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded text-white focus:outline-hidden focus:border-teal-500"
                >
                  <option value="urgent">Urgent Priority</option>
                  <option value="routine">Routine</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Clinical Instructions / Dosage / Protocol
              </label>
              <textarea
                rows={3}
                placeholder="Specific dosage, route, clinical reason, or STAT instructions..."
                value={actionDesc}
                onChange={(e) => setActionDesc(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded text-white focus:outline-hidden focus:border-teal-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded font-semibold text-white bg-teal-600 hover:bg-teal-500 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Submit Order</span>
              </button>
            </div>
          </form>
        ) : (
          /* Note Form */
          <form onSubmit={handleSubmitNote} className="p-4 space-y-3.5 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Note Format
                </label>
                <select
                  value={noteType}
                  onChange={(e) => setNoteType(e.target.value as ClinicalNote['type'])}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded text-white focus:outline-hidden focus:border-teal-500"
                >
                  <option value="SOAP">SOAP Note</option>
                  <option value="Rapid Note">Rapid Clinical Note</option>
                  <option value="Triage Handoff">Triage Handoff</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="Cardiology, Triage, Follow-up"
                  value={noteTags}
                  onChange={(e) => setNoteTags(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded text-white focus:outline-hidden focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Clinical Narrative / Findings <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={6}
                required
                placeholder="Enter clinical assessment, physical exam findings, or treatment plan..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded text-white font-mono text-[11px] focus:outline-hidden focus:border-teal-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded font-semibold text-white bg-teal-600 hover:bg-teal-500 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Save to Encounter Record</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
