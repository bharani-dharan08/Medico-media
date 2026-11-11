import React from 'react';
import {
  Play,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Siren,
  Stethoscope,
  ShieldCheck,
  BarChart3,
  RotateCcw,
  X,
  FileCheck2,
} from 'lucide-react';
import { UserRole } from '../types/clinical.ts';

export interface DemoStoryStep {
  stepNumber: number;
  title: string;
  role: UserRole;
  roleLabel: string;
  headline: string;
  talkingPoint: string;
  ctaLabel: string;
}

export const LIVE_DEMO_STORY_STEPS: DemoStoryStep[] = [
  {
    stepNumber: 1,
    title: 'Step 1 · Care Taker Emergency Intake & Auto-Email SOS',
    role: 'caretaker',
    roleLabel: 'Care Taker Console',
    headline:
      'Patient Marcus Thorne (67y · Male, MRN #39104) deteriorates with acute NSTEMI & Troponin spike.',
    talkingPoint:
      'Care Taker Anjali Verma flags Marcus Thorne as EMERGENCY. MEDICO-MEDIA automatically dispatches a clinical SOS email with live vitals to Dr. Sarah Chen (ashwinsivasamy08@gmail.com).',
    ctaLabel: 'Execute Step 1: Flag Emergency & Send SOS Email',
  },
  {
    stepNumber: 2,
    title: 'Step 2 · Physician Queue Triage & Lab Delta Inspection',
    role: 'doctor',
    roleLabel: 'Doctor Console',
    headline:
      'Dr. Sarah Chen receives the SOS alert, selects Marcus Thorne (67y · Male), and inspects Diagnostic Lab Deltas.',
    talkingPoint:
      'The 5-Patient Queue Roster highlights age, gender, and MRN for rapid triage. Dr. Chen acknowledges the SOS alert and reviews abnormal biomarker shifts (+Delta) and organ acuity.',
    ctaLabel: 'Execute Step 2: Acknowledge SOS & Inspect Labs',
  },
  {
    stepNumber: 3,
    title: 'Step 3 · AI Co-Pilot SOAP Synthesis + Inline PII Firewall',
    role: 'doctor',
    roleLabel: 'Doctor + AI Firewall',
    headline:
      'Generate structured SOAP clinical summary while Inline PII Gateway scrubs patient identifiers.',
    talkingPoint:
      'Before patient context enters the LLM, MEDICO-MEDIA tokenizes Patient Name, MRN, DOB, and Phone into FPE-SHA256 tokens and screens custom prompts against Prompt Injection.',
    ctaLabel: 'Execute Step 3: Open PII-Protected AI SOAP Co-Pilot',
  },
  {
    stepNumber: 4,
    title: 'Step 4 · Physician Clinical Sign-Off & Care Taker Directive',
    role: 'doctor',
    roleLabel: 'Doctor Sign-Off',
    headline:
      'Dr. Sarah Chen signs off the encounter, locks the clinical chart, and issues post-triage directives.',
    talkingPoint:
      'One-click Physician Sign-Off transitions the patient to DONE, stamps the verified sign-off timestamp, and logs instructions for the Care Taker and Hospital Admin.',
    ctaLabel: 'Execute Step 4: Commit SOAP & Stamp MD Sign-Off',
  },
  {
    stepNumber: 5,
    title: 'Step 5 · Admin Sign-Off Velocity D3 Tracker & AI Defense Enclave',
    role: 'admin',
    roleLabel: 'Hospital Admin Console',
    headline:
      'Hospital Admin verifies Triage-to-Sign-Off Velocity (D3) and audits JIT PIM/PAM & AI Supply Chain.',
    talkingPoint:
      'Admin compares Triage Intake Timestamp vs. Physician Sign-Off Timestamp in real time, reviews D3 completion velocity, inspects Shadow AI / CVE scans, and exports the signed Audit Record.',
    ctaLabel: 'Execute Step 5: Open Admin Velocity D3 & Export Audit',
  },
];

interface LiveDemoStoryBarProps {
  isOpen: boolean;
  activeStep: number; // 1 to 5
  completedSteps: number[];
  onSelectStep: (stepNumber: number) => void;
  onExecuteCurrentStep: (stepNumber: number) => void;
  onResetStory: () => void;
  onClose: () => void;
}

export const LiveDemoStoryBar: React.FC<LiveDemoStoryBarProps> = ({
  isOpen,
  activeStep,
  completedSteps,
  onSelectStep,
  onExecuteCurrentStep,
  onResetStory,
  onClose,
}) => {
  if (!isOpen) return null;

  const currentStepObj =
    LIVE_DEMO_STORY_STEPS.find((s) => s.stepNumber === activeStep) ||
    LIVE_DEMO_STORY_STEPS[0];

  const isCurrentStepDone = completedSteps.includes(currentStepObj.stepNumber);

  const getStepIcon = (num: number) => {
    switch (num) {
      case 1:
        return <Siren className="w-4 h-4 text-red-400" />;
      case 2:
        return <Stethoscope className="w-4 h-4 text-teal-400" />;
      case 3:
        return <Sparkles className="w-4 h-4 text-teal-300" />;
      case 4:
        return <FileCheck2 className="w-4 h-4 text-emerald-400" />;
      default:
        return <BarChart3 className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div
      role="region"
      aria-label="Live Guided Demo Story Controller"
      className="bg-[#0B1221] text-white border-b-2 border-[#0D9488] px-4 sm:px-6 py-3 shadow-lg relative z-20"
    >
      <div className="max-w-[1680px] mx-auto w-full space-y-2.5">
        {/* Top Row: Story Title + 5 Stepper Pills + Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-md bg-[#0D9488] text-white text-[10px] font-mono font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
              <Play className="w-3 h-3 fill-current" />
              <span>LIVE STORYBOARD DEMO MODE</span>
            </span>
            <span className="text-xs font-extrabold text-white hidden md:inline">
              End-to-End Case: Acute Cardiac Triage → AI PII Firewall → MD Sign-Off → Admin Velocity D3
            </span>
          </div>

          {/* 5-Step Progress Selector */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {LIVE_DEMO_STORY_STEPS.map((s) => {
              const isSelected = s.stepNumber === activeStep;
              const isDone = completedSteps.includes(s.stepNumber);
              return (
                <button
                  key={s.stepNumber}
                  type="button"
                  onClick={() => onSelectStep(s.stepNumber)}
                  className={`h-7 px-2.5 rounded-lg text-[11px] font-mono font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#0D9488] text-white border-[#14B8A6] ring-2 ring-[#14B8A6]/40'
                      : isDone
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60 hover:bg-emerald-900/60'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                  ) : (
                    <span>#{s.stepNumber}</span>
                  )}
                  <span className="hidden sm:inline">
                    {s.stepNumber === 1
                      ? '1. SOS Intake'
                      : s.stepNumber === 2
                      ? '2. MD Triage'
                      : s.stepNumber === 3
                      ? '3. AI PII SOAP'
                      : s.stepNumber === 4
                      ? '4. MD Sign-Off'
                      : '5. Admin D3'}
                  </span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={onResetStory}
              title="Reset Story Demo to Step 1"
              className="h-7 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-mono flex items-center gap-1 cursor-pointer ml-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden lg:inline">Reset</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              title="Hide Live Demo Storyboard"
              className="h-7 w-7 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 flex items-center justify-center cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bottom Row: Active Step Presenter Script + 1-Click Live Action Button */}
        <div className="p-3 rounded-xl bg-[#111C33] border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
              {getStepIcon(currentStepObj.stepNumber)}
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-extrabold text-teal-300">
                  {currentStepObj.title}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-300">
                  Active Role: {currentStepObj.roleLabel}
                </span>
                {isCurrentStepDone && (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-mono font-bold text-emerald-300">
                    ✓ EXECUTED LIVE
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-white">{currentStepObj.headline}</p>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                <strong className="text-teal-400 font-mono uppercase text-[10px] mr-1">
                  Presenter Script:
                </strong>
                {currentStepObj.talkingPoint}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={activeStep <= 1}
              onClick={() => onSelectStep(Math.max(1, activeStep - 1))}
              className="h-9 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>

            <button
              type="button"
              onClick={() => onExecuteCurrentStep(currentStepObj.stepNumber)}
              className="h-9 px-4 rounded-lg bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-extrabold shadow-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{currentStepObj.ctaLabel}</span>
            </button>

            {activeStep < 5 && (
              <button
                type="button"
                onClick={() => {
                  onExecuteCurrentStep(currentStepObj.stepNumber);
                  onSelectStep(Math.min(5, activeStep + 1));
                }}
                className="h-9 px-3 rounded-lg bg-white hover:bg-slate-100 text-slate-900 text-xs font-extrabold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                title="Execute this step and advance to the next step"
              >
                <span>Run & Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
