/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  LayoutDashboard,
  Users,
  FlaskConical,
  ClipboardCheck,
  Grid3X3,
  Zap,
  HeartPulse,
  UserCheck,
  ShieldCheck,
  LogOut,
  Lock,
  UserPlus,
  Siren,
  ArrowLeftRight,
  FileCheck2,
  BarChart3,
  Search,
  UserSquare2,
  Settings,
  FileText,
} from 'lucide-react';
import { UserSession } from '../types/clinical.ts';

export type VisionNavTab =
  | 'Patient Dashboard'
  | 'Patient Search'
  | 'Patient Summary'
  | 'Appointments Queue'
  | 'Lab Reports'
  | 'Pending Actions'
  | 'Clinical Heatmap'
  | 'AI Security & PIM'
  | 'Settings';

interface VisionSidebarProps {
  activeTab: VisionNavTab;
  onSelectTab: (tab: VisionNavTab) => void;
  onGenerateSoapSummary: () => void;
  pendingActionsCount: number;
  abnormalLabsCount: number;
  session: UserSession;
  onOpenLoginPortal: () => void;
  onOpenSettings?: () => void;
}

export const VisionSidebar: React.FC<VisionSidebarProps> = ({
  activeTab,
  onSelectTab,
  onGenerateSoapSummary,
  pendingActionsCount,
  abnormalLabsCount,
  session,
  onOpenLoginPortal,
  onOpenSettings,
}) => {
  const doctorNavItems: {
    id: VisionNavTab;
    displayLabel: string;
    subLabel: string;
    icon: React.ReactNode;
    badge?: string;
    badgeColor?: string;
  }[] = [
    {
      id: 'Patient Dashboard',
      displayLabel: 'Overview',
      subLabel: 'Operations Centre & KPIs',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'Patient Search',
      displayLabel: 'Patient Search',
      subLabel: 'Queue Roster & Filters',
      icon: <Search className="w-4 h-4" />,
    },
    {
      id: 'Patient Summary',
      displayLabel: 'Patient Summary',
      subLabel: 'Demographics, Allergies & Risk',
      icon: <UserSquare2 className="w-4 h-4" />,
    },
    {
      id: 'Appointments Queue',
      displayLabel: 'Encounters',
      subLabel: 'Appointments & Triage Queue',
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'Lab Reports',
      displayLabel: 'Investigations',
      subLabel: 'Diagnostic Labs & View Delta',
      icon: <FlaskConical className="w-4 h-4" />,
      badge: abnormalLabsCount > 0 ? `${abnormalLabsCount} Alert` : undefined,
      badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40',
    },
    {
      id: 'Pending Actions',
      displayLabel: 'Access & Audit',
      subLabel: 'Sign-Offs & Audit Export',
      icon: <ClipboardCheck className="w-4 h-4" />,
      badge: pendingActionsCount > 0 ? `${pendingActionsCount} Open` : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    },
    {
      id: 'Clinical Heatmap',
      displayLabel: 'Organ Acuity Matrix',
      subLabel: '5-System Longitudinal Risk',
      icon: <Grid3X3 className="w-4 h-4" />,
    },
    {
      id: 'AI Security & PIM',
      displayLabel: 'AI Security & PIM',
      subLabel: 'Firewall, JIT Access & SCA',
      icon: <ShieldCheck className="w-4 h-4" />,
      badge: '9 Guards',
      badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
    },
    {
      id: 'Settings',
      displayLabel: 'Settings',
      subLabel: 'Data Status & Shortcuts',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  const caretakerModules = [
    {
      label: 'Overview & Intake Charts',
      sub: 'Hourly velocity & specialist load',
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      label: 'Patient Intake & Vitals',
      sub: 'Register MRN & baseline triage',
      icon: <UserPlus className="w-4 h-4" />,
    },
    {
      label: 'Encounters & Allotment',
      sub: 'Assign MD & update queue status',
      icon: <UserCheck className="w-4 h-4" />,
    },
    {
      label: 'Emergency SOS + Email',
      sub: 'Critical physician notification',
      icon: <Siren className="w-4 h-4" />,
    },
  ];

  const adminModules = [
    {
      label: 'Overview & Audit D3 Chart',
      sub: 'Sign-off velocity & completion %',
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      label: 'AI Security, PIM & SCA',
      sub: 'Prompt Firewall, JIT & CVEs',
      icon: <ShieldCheck className="w-4 h-4" />,
    },
    {
      label: '8-Digit Hospital Transfers',
      sub: 'Inbound & outbound routing',
      icon: <ArrowLeftRight className="w-4 h-4" />,
    },
    {
      label: 'Doctor Case Review Loop',
      sub: 'Forward records for MD decision',
      icon: <ShieldCheck className="w-4 h-4" />,
    },
    {
      label: 'Access & Audit Vault',
      sub: 'Download clinical compliance files',
      icon: <FileCheck2 className="w-4 h-4" />,
    },
  ];

  const roleBadgeClass =
    session.role === 'doctor'
      ? 'text-teal-300 border-teal-500/40 bg-teal-500/15'
      : session.role === 'caretaker'
      ? 'text-emerald-300 border-emerald-500/40 bg-emerald-500/15'
      : 'text-amber-300 border-amber-500/40 bg-amber-500/15';

  return (
    <aside className="w-[268px] shrink-0 bg-[#0B1221] text-slate-100 border-r border-slate-800 flex flex-col justify-between px-4 py-5 h-full select-none overflow-y-auto">
      <div className="space-y-4">
        {/* Product Identity */}
        <div className="flex items-center gap-3 px-2.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#0D9488] text-white shrink-0 shadow-xs">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm tracking-tight text-white leading-none">
                MEDICO-MEDIA
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono truncate mt-1">
              Operations Centre · #{session.hospitalCode}
            </p>
          </div>
        </div>

        {/* Authenticated Session & Facility Context Card */}
        <div className="p-3.5 rounded-xl bg-[#111C33] border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span
              className={`px-2 py-0.5 rounded-md border text-[10px] uppercase tracking-wider font-mono font-bold inline-flex items-center gap-1.5 ${roleBadgeClass}`}
            >
              <Lock className="w-2.5 h-2.5 shrink-0" />
              <span>{session.role.toUpperCase()} ACCESS</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">Local Session</span>
          </div>
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-white truncate">{session.userName}</div>
            <div className="text-[11px] text-slate-400 font-mono truncate">
              {session.userEmail}
            </div>
            <div className="text-[11px] text-teal-400 font-medium truncate pt-0.5">
              {session.hospitalName}
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenLoginPortal}
            className="w-full h-8 px-3 rounded-lg bg-slate-800 hover:bg-red-600 text-slate-200 hover:text-white border border-slate-700 hover:border-red-500 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            <span>Sign Out ({session.role})</span>
          </button>
        </div>

        <div className="h-px bg-slate-800" />

        {/* Navigation Destinations */}
        {session.role === 'doctor' && (
          <nav aria-label="Clinical Operations Navigation" className="space-y-1">
            <span className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Clinical Operations
            </span>
            {doctorNavItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (item.id === 'Settings' && onOpenSettings) {
                      onOpenSettings();
                    }
                    onSelectTab(item.id);
                  }}
                  className={`w-full min-h-[42px] flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer text-left ${
                    isActive
                      ? 'bg-[#0D9488]/20 text-white border border-[#14B8A6]/40'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                        isActive
                          ? 'bg-[#0D9488] text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate leading-tight">
                        {item.displayLabel}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate leading-tight mt-0.5">
                        {item.subLabel}
                      </div>
                    </div>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        )}

        {session.role === 'caretaker' && (
          <div className="space-y-2">
            <span className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-teal-400 block mb-1.5">
              Care Taker Operations
            </span>
            {caretakerModules.map((mod) => (
              <div
                key={mod.label}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#111C33] border border-slate-800 text-white"
              >
                <div className="w-7 h-7 rounded-md bg-[#0D9488] flex items-center justify-center text-white shrink-0">
                  {mod.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold truncate">{mod.label}</div>
                  <div className="text-[10px] text-slate-400 truncate">{mod.sub}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {session.role === 'admin' && (
          <div className="space-y-2">
            <span className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-1.5">
              Hospital Admin Governance
            </span>
            {adminModules.map((mod) => (
              <div
                key={mod.label}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#111C33] border border-slate-800 text-white"
              >
                <div className="w-7 h-7 rounded-md bg-[#0D9488] flex items-center justify-center text-white shrink-0">
                  {mod.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold truncate">{mod.label}</div>
                  <div className="text-[10px] text-slate-400 truncate">{mod.sub}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Clinical Action / Status Card */}
      {session.role === 'doctor' ? (
        <div className="rounded-xl p-3.5 mt-4 bg-[#111C33] border border-slate-800 shrink-0 space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#0D9488] flex items-center justify-center text-white shrink-0">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-white tracking-tight">
              Structured SOAP Note
            </span>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed">
            Compile current encounter vitals, abnormal investigations, and chief complaint into a structured clinical note.
          </p>

          <button
            type="button"
            onClick={onGenerateSoapSummary}
            className="w-full h-9 px-3 rounded-lg bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Zap className="w-3.5 h-3.5 shrink-0" />
            <span>Generate SOAP Summary</span>
          </button>
        </div>
      ) : (
        <div className="rounded-xl p-3.5 mt-4 bg-[#111C33] border border-slate-800 shrink-0 space-y-1.5">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-teal-400" />
            <span className="text-xs font-bold text-white">
              Role-Scoped Session
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Isolated to <strong className="text-white">{session.role.toUpperCase()}</strong> access under Facility{' '}
            <strong className="text-teal-400 font-mono">#{session.hospitalCode}</strong>.
          </p>
        </div>
      )}
    </aside>
  );
};
