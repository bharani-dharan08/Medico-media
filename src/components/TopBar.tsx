/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Activity,
  Plus,
  Keyboard,
  RefreshCw,
  Building2,
  Stethoscope,
  UserCheck,
  ShieldCheck,
  Download,
  Siren,
  LogOut,
  Mail,
  Lock,
  Search,
  Menu,
  X,
  Database,
  Play,
} from 'lucide-react';
import { Patient, UserSession } from '../types/clinical.ts';
import { HOSPITAL_FACILITIES } from '../data/hospitalRegistry.ts';
import { getPatientAvatarConfig } from '../utils/avatarHash.ts';

interface TopBarProps {
  activePatient: Patient;
  patients: Patient[];
  totalWaiting: number;
  totalInConsultation: number;
  session: UserSession;
  unacknowledgedEmergencyCount: number;
  emailOutboxCount?: number;
  searchQuery?: string;
  onSearchQueryChange?: (q: string) => void;
  onSelectPatient?: (patientId: string) => void;
  onSelectFacility?: (code: string, name: string) => void;
  onToggleMobileMenu?: () => void;
  onOpenLoginPortal: () => void;
  onOpenEmailOutbox?: () => void;
  onDownloadActiveAudit: () => void;
  onOpenQuickAdd: () => void;
  onOpenShortcuts: () => void;
  onResetDemoData: () => void;
  onOpenAiSecurity?: () => void;
  isLiveStoryOpen?: boolean;
  onToggleLiveStory?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activePatient,
  patients,
  totalWaiting,
  totalInConsultation,
  session,
  unacknowledgedEmergencyCount,
  emailOutboxCount = 0,
  searchQuery = '',
  onSearchQueryChange,
  onSelectPatient,
  onSelectFacility,
  onToggleMobileMenu,
  onOpenLoginPortal,
  onOpenEmailOutbox,
  onDownloadActiveAudit,
  onOpenQuickAdd,
  onOpenShortcuts,
  onResetDemoData,
  onOpenAiSecurity,
  isLiveStoryOpen,
  onToggleLiveStory,
}) => {
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const totalEmergency = patients.filter((p) => p.appointmentStatus === 'Emergency').length;
  const totalDone = patients.filter((p) => p.appointmentStatus === 'Done').length;
  const totalQueue = patients.length;

  const emergencyPercent =
    totalQueue > 0 ? Math.round((totalEmergency / totalQueue) * 100) : 0;
  const waitingPercent = totalQueue > 0 ? Math.round((totalWaiting / totalQueue) * 100) : 0;
  const inConsultPercent =
    totalQueue > 0 ? Math.round((totalInConsultation / totalQueue) * 100) : 0;
  const donePercent = totalQueue > 0 ? Math.round((totalDone / totalQueue) * 100) : 0;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchMatches = patients.filter((p) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const fullName = `${p.demographics.firstName} ${p.demographics.lastName}`.toLowerCase();
    return (
      fullName.includes(q) ||
      p.mrn.toLowerCase().includes(q) ||
      p.chiefComplaint.toLowerCase().includes(q) ||
      p.appointmentStatus.toLowerCase().includes(q)
    );
  });

  const roleBadgeConfig =
    session.role === 'doctor'
      ? {
          label: 'Doctor Console',
          icon: <Stethoscope className="w-3.5 h-3.5 shrink-0 text-[#0D9488]" />,
          badgeStyle: 'bg-teal-50 border-teal-200 text-slate-900',
        }
      : session.role === 'caretaker'
      ? {
          label: 'Care Taker Console',
          icon: <UserCheck className="w-3.5 h-3.5 shrink-0 text-emerald-700" />,
          badgeStyle: 'bg-emerald-50 border-emerald-200 text-slate-900',
        }
      : {
          label: 'Admin Console',
          icon: <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-amber-700" />,
          badgeStyle: 'bg-amber-50 border-amber-200 text-slate-900',
        };

  return (
    <header className="sticky top-0 z-30 w-full bg-white border-b border-slate-200 text-slate-900 px-4 sm:px-6 py-2.5 shadow-2xs">
      <div className="max-w-[1680px] mx-auto w-full grid grid-cols-1 xl:grid-cols-[1fr_auto_1fr] items-center gap-3">
        {/* Zone 1 (Left): Mobile Menu + Facility Selector + Role Badge + Patient Search */}
        <div className="flex items-center justify-start gap-2.5 min-w-0 flex-wrap sm:flex-nowrap">
          {onToggleMobileMenu && (
            <button
              type="button"
              onClick={onToggleMobileMenu}
              aria-label="Open clinical navigation menu"
              className="lg:hidden h-9 w-9 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-700 shrink-0 cursor-pointer"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}

          {/* Product Identity Badge */}
          <div className="h-9 flex items-center gap-2 px-2.5 rounded-lg bg-[#0B1221] text-white text-xs font-extrabold tracking-tight whitespace-nowrap shrink-0">
            <span className="w-2 h-2 rounded-full bg-[#14B8A6]" />
            <span>MEDICO-MEDIA</span>
          </div>

          {/* 8-Digit Facility Context Selector */}
          <div className="h-9 flex items-center gap-1.5 px-2.5 rounded-lg bg-slate-100 border border-slate-200 text-xs whitespace-nowrap shrink-0">
            <Building2 className="w-3.5 h-3.5 text-[#0D9488] shrink-0" />
            <label htmlFor="global-facility-select" className="sr-only">
              Select Hospital Facility
            </label>
            <select
              id="global-facility-select"
              value={session.hospitalCode}
              onChange={(e) => {
                const fac = HOSPITAL_FACILITIES.find((f) => f.code === e.target.value);
                if (fac && onSelectFacility) {
                  onSelectFacility(fac.code, fac.name);
                }
              }}
              aria-label="Active Hospital Facility"
              className="bg-transparent font-mono font-bold text-slate-900 text-xs focus:outline-hidden cursor-pointer"
            >
              {HOSPITAL_FACILITIES.map((fac) => (
                <option key={fac.code} value={fac.code}>
                  #{fac.code} · {fac.name.split(' ')[0]} {fac.name.split(' ')[1]}
                </option>
              ))}
            </select>
          </div>

          {/* Locked Single-Role Session Badge */}
          <div
            className={`hidden md:flex h-9 items-center gap-1.5 px-2.5 rounded-lg border text-xs font-semibold whitespace-nowrap shrink-0 ${roleBadgeConfig.badgeStyle}`}
            title={`Signed in as ${session.userName} (${roleBadgeConfig.label}).`}
          >
            {roleBadgeConfig.icon}
            <span>{roleBadgeConfig.label}</span>
            <span className="text-slate-400">·</span>
            <span className="text-[11px] font-medium text-slate-700 max-w-[130px] truncate">
              {session.userName}
            </span>
            <Lock className="w-3 h-3 text-slate-400 shrink-0" />
          </div>

          {/* Global Patient Search Input */}
          <div ref={searchContainerRef} className="relative flex-1 min-w-[180px] max-w-[260px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="global-patient-search-input"
              type="search"
              value={searchQuery}
              onFocus={() => setIsSearchDropdownOpen(true)}
              onChange={(e) => {
                onSearchQueryChange?.(e.target.value);
                setIsSearchDropdownOpen(true);
              }}
              placeholder="Search patient, MRN, complaint..."
              aria-label="Search patients by name, MRN, or chief complaint"
              className="w-full h-9 pl-8 pr-7 rounded-lg bg-slate-50 border border-slate-300 focus:border-[#0D9488] focus:bg-white text-xs text-slate-900 placeholder:text-slate-400 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchQueryChange?.('')}
                aria-label="Clear patient search"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Quick-Jump Search Dropdown */}
            {isSearchDropdownOpen && searchQuery.trim().length > 0 && (
              <div className="absolute left-0 right-0 top-10 z-50 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 max-h-64 overflow-y-auto">
                <div className="px-2 py-1 text-[10px] font-mono uppercase text-slate-500 border-b border-slate-100">
                  Matching Patients ({searchMatches.length})
                </div>
                {searchMatches.length > 0 ? (
                  searchMatches.map((pat) => {
                    const av = getPatientAvatarConfig(
                      pat.mrn,
                      pat.demographics.firstName,
                      pat.demographics.lastName,
                      pat.mrn
                    );
                    return (
                      <button
                        key={pat.id}
                        type="button"
                        onClick={() => {
                          onSelectPatient?.(pat.id);
                          setIsSearchDropdownOpen(false);
                        }}
                        className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg hover:bg-slate-100 text-left text-xs transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-6 h-6 rounded-md bg-[#0B1221] text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                            {av.initials}
                          </span>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate">
                              {pat.demographics.firstName} {pat.demographics.lastName}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono truncate">
                              MRN #{pat.mrn} · {pat.appointmentStatus}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-semibold text-[#0D9488] shrink-0">
                          Select →
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <div className="px-3 py-3 text-xs text-slate-500 text-center">
                    No matching patient records in active queue.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Zone 2 (Centered): 5 Patients Active — Acuity Distribution Bar */}
        <div className="flex items-center justify-center">
          <div className="h-9 flex items-center justify-center gap-3 px-3.5 rounded-lg bg-slate-50 border border-slate-200 whitespace-nowrap">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#0D9488] shrink-0" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold hidden sm:inline">
                Acuity Load
              </span>
              <span className="text-xs font-bold text-slate-900 tabular-nums">
                {totalQueue} Patients Active
              </span>
            </div>

            <div className="h-4 w-px bg-slate-200" />

            {/* Horizontal Stacked Distribution Bar */}
            <div className="w-24 sm:w-28 h-2.5 bg-slate-200 rounded-full overflow-hidden flex items-center gap-0.5 p-0.5 shrink-0">
              {totalEmergency > 0 && (
                <div
                  style={{ width: `${emergencyPercent}%` }}
                  className="h-full bg-red-600 rounded-full transition-all duration-300"
                  title={`Emergency: ${totalEmergency} (${emergencyPercent}%)`}
                />
              )}
              {totalWaiting > 0 && (
                <div
                  style={{ width: `${waitingPercent}%` }}
                  className="h-full bg-amber-500 rounded-full transition-all duration-300"
                  title={`Waiting: ${totalWaiting} (${waitingPercent}%)`}
                />
              )}
              {totalInConsultation > 0 && (
                <div
                  style={{ width: `${inConsultPercent}%` }}
                  className="h-full bg-[#0D9488] rounded-full transition-all duration-300"
                  title={`In-Consultation: ${totalInConsultation} (${inConsultPercent}%)`}
                />
              )}
              {totalDone > 0 && (
                <div
                  style={{ width: `${donePercent}%` }}
                  className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                  title={`Done / Signed Off: ${totalDone} (${donePercent}%)`}
                />
              )}
            </div>

            {/* Single-Line Tabular Counts */}
            <div className="hidden md:flex items-center justify-center gap-2.5 text-[11px] font-mono font-semibold tabular-nums">
              {totalEmergency > 0 && (
                <span className="text-red-700 font-bold">
                  {totalEmergency} Emg ({emergencyPercent}%)
                </span>
              )}
              <span className="text-amber-700">
                {totalWaiting} Wait ({waitingPercent}%)
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-[#0D9488]">
                {totalInConsultation} In-Consult ({inConsultPercent}%)
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-emerald-700">{totalDone} Done</span>
            </div>
          </div>
        </div>

        {/* Zone 3 (Right): Genuine Operational Status & Action Controls */}
        <div className="flex items-center justify-end gap-2 shrink-0 overflow-x-auto">
          {/* Genuine Data Source Status Indicator */}
          <div
            title="Synthetic clinical dataset persisted in browser localStorage. No external EHR/ABDM connection active."
            className="hidden 2xl:flex h-9 items-center gap-1.5 px-2.5 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-mono text-slate-600 whitespace-nowrap shrink-0"
          >
            <Database className="w-3.5 h-3.5 text-[#0D9488] shrink-0" />
            <span>Local Store</span>
          </div>

          {unacknowledgedEmergencyCount > 0 && (
            <div
              className="h-9 flex items-center gap-1.5 px-2.5 rounded-lg bg-red-50 border border-red-300 text-red-700 text-xs font-bold whitespace-nowrap shrink-0"
              title="Active Unacknowledged Emergency SOS Alert"
            >
              <Siren className="w-3.5 h-3.5 shrink-0" />
              <span>{unacknowledgedEmergencyCount} SOS</span>
            </div>
          )}

          {onOpenEmailOutbox && (
            <button
              type="button"
              onClick={onOpenEmailOutbox}
              title="Inspect Simulated Physician Email Relay & Dispatched Alerts"
              className="h-9 flex items-center gap-1.5 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Mail className="w-3.5 h-3.5 text-[#0D9488] shrink-0" />
              <span className="hidden 2xl:inline">Email Outbox</span>
              <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-900 font-mono text-[10px] font-bold leading-none">
                {emailOutboxCount}
              </span>
            </button>
          )}

          {onToggleLiveStory && (
            <button
              type="button"
              onClick={onToggleLiveStory}
              title="Toggle 5-Step Guided Live Demo Storyboard"
              className={`h-9 flex items-center gap-1.5 px-3 text-xs font-extrabold rounded-lg border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                isLiveStoryOpen
                  ? 'bg-[#0D9488] text-white border-[#0D9488]'
                  : 'bg-[#0B1221] text-white border-[#0B1221] hover:bg-slate-800'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current shrink-0" />
              <span>Live Story Demo</span>
            </button>
          )}

          {onOpenAiSecurity && (
            <button
              type="button"
              onClick={onOpenAiSecurity}
              title="Open AI Threat Defenses, PIM/PAM & Supply Chain Security Center"
              className="h-9 flex items-center gap-1.5 px-2.5 text-xs font-semibold text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#0D9488] shrink-0" />
              <span className="hidden xl:inline">AI Security & PIM</span>
            </button>
          )}

          <button
            type="button"
            onClick={onDownloadActiveAudit}
            title="Download Signed-Off Clinical Audit Record"
            className="h-9 flex items-center gap-1.5 px-2.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Audit Export</span>
          </button>

          <button
            type="button"
            onClick={onResetDemoData}
            title="Reset synthetic clinic demo data"
            aria-label="Reset synthetic clinic demo data"
            className="h-9 w-9 flex items-center justify-center text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5 shrink-0" />
          </button>

          <button
            type="button"
            onClick={onOpenShortcuts}
            title="Keyboard Shortcuts & System Status (Alt+K)"
            aria-label="Keyboard Shortcuts and System Status"
            className="hidden sm:flex h-9 w-9 items-center justify-center text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <Keyboard className="w-3.5 h-3.5 shrink-0" />
          </button>

          <button
            type="button"
            onClick={onOpenLoginPortal}
            title="Sign Out to Common Login Page"
            className="h-9 flex items-center gap-1.5 px-2.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden 2xl:inline">Sign Out</span>
          </button>

          <button
            type="button"
            onClick={onOpenQuickAdd}
            className="h-9 flex items-center gap-1.5 px-3 text-xs font-bold text-white bg-[#0B1221] hover:bg-slate-800 rounded-lg shadow-2xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5] shrink-0 text-[#14B8A6]" />
            <span>Quick Note / Order</span>
          </button>
        </div>
      </div>
    </header>
  );
};
