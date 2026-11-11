/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sliders,
  Eye,
  Calendar,
  User,
  FlaskConical,
} from 'lucide-react';
import { LabReport, Patient } from '../types/clinical.ts';

interface LabReportModalProps {
  report: LabReport | null;
  patient: Patient;
  onClose: () => void;
  onAcknowledge: (reportId: string) => void;
}

export const LabReportModal: React.FC<LabReportModalProps> = ({
  report,
  patient,
  onClose,
  onAcknowledge,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [inverted, setInverted] = useState(false);
  const [contrastLevel, setContrastLevel] = useState(100);

  if (!report) return null;

  const isImaging = report.category === 'Imaging';
  const isCritical = report.status === 'CRITICAL';
  const isHigh = report.status === 'HIGH' || report.status === 'LOW';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-3xl w-full text-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-teal-500/20 text-teal-400">
              {isImaging ? <Eye className="w-4 h-4" /> : <FlaskConical className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wide">
                  {report.name}
                </h3>
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    isCritical
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : isHigh
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}
                >
                  [{report.status}]
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Patient: {patient.demographics.lastName}, {patient.demographics.firstName} · MRN: {patient.mrn}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close diagnostic report modal"
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-950/60 border border-slate-800 rounded">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-mono">Collected Time</span>
              <span className="font-semibold text-white font-mono">{report.collectedAt}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-mono">Specimen / Modality</span>
              <span className="font-semibold text-white">{report.specimen}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-mono">Ordering Physician</span>
              <span className="font-semibold text-white">{report.orderingMD}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-mono">Standard Range</span>
              <span className="font-semibold text-teal-400 font-mono">{report.referenceRange}</span>
            </div>
          </div>

          {/* Current Value Callout */}
          <div className="p-3 bg-slate-800/40 border border-slate-700/80 rounded flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400">Quantitative Observed Finding:</span>
              <div className="text-lg font-bold text-white font-mono tabular-nums">
                {report.value} <span className="text-xs text-slate-400 font-normal">{report.unit}</span>
              </div>
            </div>

            {report.acknowledged ? (
              <div className="flex items-center gap-1.5 text-xs text-teal-400 font-semibold bg-teal-950/60 border border-teal-800 px-3 py-1.5 rounded">
                <CheckCircle2 className="w-4 h-4" />
                <span>Acknowledged by Clinician</span>
              </div>
            ) : (
              <button
                onClick={() => onAcknowledge(report.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Sign & Acknowledge Result</span>
              </button>
            )}
          </div>

          {/* Imaging DICOM Viewport Simulation (if Imaging) */}
          {isImaging && (
            <div className="bg-black border border-slate-800 rounded p-3 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-teal-400 font-semibold">DICOM VIEWPORT #1</span>
                  <span>{report.imagingType || 'Radiological Series'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setInverted(!inverted)}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
                  >
                    {inverted ? 'Standard' : 'Invert Grayscale'}
                  </button>
                  <button
                    onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.2))}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono text-slate-400 text-[10px]">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    onClick={() => setZoomLevel((z) => Math.min(2.0, z + 0.2))}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Anatomical Diagnostic Simulation Viewport */}
              <div
                className="relative h-64 bg-slate-950 rounded overflow-hidden flex items-center justify-center border border-slate-900"
                style={{
                  filter: `${inverted ? 'invert(1)' : 'invert(0)'} contrast(${contrastLevel}%)`,
                }}
              >
                {/* SVG Diagnostic Radiograph Canvas */}
                <div
                  className="transition-transform duration-200 flex items-center justify-center"
                  style={{ transform: `scale(${zoomLevel})` }}
                >
                  <svg width="280" height="220" viewBox="0 0 280 220" className="text-slate-300">
                    <rect width="280" height="220" fill="#080c14" />
                    {/* Thoracic cage / lungs outline simulation */}
                    <path
                      d="M 140 10 L 140 210 M 130 30 Q 80 40 60 90 Q 50 140 70 190 Q 110 200 135 185"
                      fill="#1e293b"
                      stroke="#475569"
                      strokeWidth="2"
                      opacity="0.85"
                    />
                    <path
                      d="M 140 10 L 140 210 M 150 30 Q 200 40 220 90 Q 230 140 210 190 Q 170 200 145 185"
                      fill="#1e293b"
                      stroke="#475569"
                      strokeWidth="2"
                      opacity="0.85"
                    />
                    {/* Cardiac silhouette */}
                    <path
                      d="M 130 90 Q 95 120 115 170 Q 140 185 160 170 Q 155 120 130 90 Z"
                      fill="#0f172a"
                      stroke="#64748b"
                      strokeWidth="2"
                    />
                    {/* Diaphragm */}
                    <path
                      d="M 40 195 Q 90 170 140 185 Q 190 170 240 195"
                      fill="none"
                      stroke="#334155"
                      strokeWidth="3"
                    />
                    {/* Rib markings */}
                    {[50, 75, 100, 125, 150].map((y, i) => (
                      <g key={i} opacity="0.35">
                        <path d={`M 135 ${y} Q 90 ${y - 10} 60 ${y + 15}`} stroke="#94a3b8" strokeWidth="2" fill="none" />
                        <path d={`M 145 ${y} Q 190 ${y - 10} 220 ${y + 15}`} stroke="#94a3b8" strokeWidth="2" fill="none" />
                      </g>
                    ))}
                    {/* Diagnostic Reticle overlay */}
                    <circle cx="140" cy="110" r="80" stroke="#0ea5e9" strokeDasharray="3 3" strokeWidth="0.75" fill="none" opacity="0.4" />
                    <line x1="140" y1="20" x2="140" y2="200" stroke="#0ea5e9" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.3" />
                    <line x1="50" y1="110" x2="230" y2="110" stroke="#0ea5e9" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.3" />
                  </svg>
                </div>

                <div className="absolute top-2 left-2 text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded">
                  LAT: R / PA ERECT
                </div>
                <div className="absolute bottom-2 right-2 text-[10px] font-mono text-teal-400 bg-slate-900/80 px-2 py-0.5 rounded">
                  kVp: 120 · mA: 3.2
                </div>
              </div>

              {/* Window / Contrast Level Control */}
              <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400">
                <Sliders className="w-3.5 h-3.5 text-teal-400" />
                <span>Window / Contrast Level:</span>
                <input
                  type="range"
                  min="60"
                  max="160"
                  value={contrastLevel}
                  onChange={(e) => setContrastLevel(Number(e.target.value))}
                  className="w-32 accent-teal-500 cursor-pointer"
                />
                <span className="font-mono text-white text-[10px]">{contrastLevel}%</span>
              </div>
            </div>
          )}

          {/* Impression Callout */}
          {report.impression && (
            <div className="p-3 bg-teal-950/20 border border-teal-800/60 rounded">
              <span className="font-bold text-teal-300 block mb-1 uppercase tracking-wider text-[11px]">
                Radiologist Diagnostic Impression:
              </span>
              <p className="text-white text-xs whitespace-pre-line leading-relaxed">
                {report.impression}
              </p>
            </div>
          )}

          {/* Detailed Narrative Findings */}
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded">
            <span className="font-bold text-slate-300 block mb-1 uppercase tracking-wider text-[11px]">
              Detailed Clinical Findings Narrative:
            </span>
            <p className="text-slate-300 text-xs leading-relaxed">
              {report.findingsNarrative}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Certified Laboratory Information System (LIS) Secure Record
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors cursor-pointer"
            >
              Close
            </button>
            {!report.acknowledged && (
              <button
                onClick={() => {
                  onAcknowledge(report.id);
                  onClose();
                }}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded transition-colors cursor-pointer"
              >
                Acknowledge & Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
