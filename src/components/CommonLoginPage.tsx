/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Building2,
  Stethoscope,
  UserCheck,
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  HeartPulse,
  CheckCircle2,
  KeyRound,
  BarChart3,
  Database,
  Play,
} from 'lucide-react';
import { UserRole, UserSession } from '../types/clinical.ts';
import { HOSPITAL_FACILITIES, HOSPITAL_SPECIALISTS } from '../data/hospitalRegistry.ts';

interface CommonLoginPageProps {
  initialSession: UserSession;
  onAuthenticate: (session: UserSession) => void;
  onLaunchLiveStory?: () => void;
}

export const CommonLoginPage: React.FC<CommonLoginPageProps> = ({
  initialSession,
  onAuthenticate,
  onLaunchLiveStory,
}) => {
  const [hospitalCode, setHospitalCode] = useState<string>(
    initialSession.hospitalCode || '88492014'
  );
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialSession.role || 'doctor');
  const [email, setEmail] = useState<string>(
    initialSession.userEmail || 'ashwinsivasamy08@gmail.com'
  );
  const [password, setPassword] = useState<string>('MedVision@2026');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>(
    initialSession.userName || 'Dr. Sarah Chen, MD'
  );
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('doc-01');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const matchedHospital =
    HOSPITAL_FACILITIES.find((h) => h.code === hospitalCode) || {
      code: hospitalCode || '88492014',
      name: `Registered Hospital Facility #${hospitalCode || '88492014'}`,
      city: 'Regional Medical Network',
      adminName: 'Hospital Administrator',
      adminEmail: `admin.${hospitalCode || '88492014'}@medvision.org`,
    };

  const applyRolePreset = (role: UserRole, code = hospitalCode) => {
    setSelectedRole(role);
    setErrorMsg('');
    const fac = HOSPITAL_FACILITIES.find((h) => h.code === code) || matchedHospital;
    if (role === 'doctor') {
      const doc =
        HOSPITAL_SPECIALISTS.find((d) => d.id === selectedDoctorId) ||
        HOSPITAL_SPECIALISTS[0];
      setUserName(doc.name);
      setEmail(doc.email);
      setPassword('Doctor@88492014');
    } else if (role === 'caretaker') {
      setUserName('Caretaker Anjali Verma, RN');
      setEmail('anjali.caretaker@medvision.org');
      setPassword('Caretaker@88492014');
    } else {
      setUserName(fac.adminName);
      setEmail(fac.adminEmail);
      setPassword('Admin@88492014');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedCode = hospitalCode.replace(/\D/g, '');
    if (cleanedCode.length !== 8) {
      setErrorMsg('Please enter a valid 8-digit Hospital ID Code (e.g. 88492014).');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid institutional or Google email address.');
      return;
    }
    if (!password.trim() || password.trim().length < 4) {
      setErrorMsg('Please enter your security password (minimum 4 characters).');
      return;
    }

    const doc = HOSPITAL_SPECIALISTS.find((d) => d.id === selectedDoctorId);

    onAuthenticate({
      role: selectedRole,
      hospitalCode: cleanedCode,
      hospitalName: matchedHospital.name,
      userName:
        userName.trim() ||
        (selectedRole === 'doctor'
          ? doc?.name || 'Dr. Sarah Chen, MD'
          : selectedRole === 'caretaker'
          ? 'Caretaker Anjali Verma, RN'
          : matchedHospital.adminName),
      userEmail: email.trim(),
      specialty:
        selectedRole === 'doctor'
          ? doc?.specialty || 'Interventional Cardiology & Internal Medicine'
          : undefined,
    });
  };

  const handleQuickLaunch = (role: UserRole, code: string) => {
    const fac =
      HOSPITAL_FACILITIES.find((h) => h.code === code) || HOSPITAL_FACILITIES[0];
    if (role === 'doctor') {
      onAuthenticate({
        role: 'doctor',
        hospitalCode: fac.code,
        hospitalName: fac.name,
        userName: 'Dr. Sarah Chen, MD',
        userEmail: 'ashwinsivasamy08@gmail.com',
        specialty: 'Interventional Cardiology & Internal Medicine',
      });
    } else if (role === 'caretaker') {
      onAuthenticate({
        role: 'caretaker',
        hospitalCode: fac.code,
        hospitalName: fac.name,
        userName: 'Caretaker Anjali Verma, RN',
        userEmail: 'anjali.caretaker@medvision.org',
      });
    } else {
      onAuthenticate({
        role: 'admin',
        hospitalCode: fac.code,
        hospitalName: fac.name,
        userName: fac.adminName,
        userEmail: fac.adminEmail,
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1221] text-slate-900 flex items-center justify-center p-4 sm:p-6 relative overflow-y-auto">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 my-6">
        {/* Left Column (7 cols): Common Hospital Authentication Form */}
        <div className="lg:col-span-7 bg-white rounded-xl p-6 sm:p-8 border border-slate-200 shadow-xl flex flex-col justify-between">
          <div className="space-y-6">
            {/* Brand Header */}
            <div className="flex items-center justify-between gap-3 flex-wrap border-b border-slate-200 pb-5">
              <div className="flex items-center gap-3.5">
                <div className="relative flex items-center justify-center w-11 h-11 rounded-lg bg-[#0B1221] text-[#14B8A6] shrink-0">
                  <HeartPulse className="w-6 h-6" />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#0D9488] ring-2 ring-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base tracking-tight text-slate-900">
                      MEDICO-MEDIA
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                      OPERATIONS CENTRE
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Multi-Role Hospital Access · Doctor · Care Taker · Hospital Admin
                  </p>
                </div>
              </div>

              <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-right">
                <div className="text-[10px] font-mono text-slate-500 uppercase">
                  Active Facility ID
                </div>
                <div className="text-sm font-mono font-extrabold text-teal-700">
                  #{hospitalCode || '--------'}
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-bold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Field 1: 8-Digit Hospital ID */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-teal-600" />
                  1. Select or Enter 8-Digit Hospital ID Code *
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {HOSPITAL_FACILITIES.map((fac) => {
                    const isSelected = hospitalCode === fac.code;
                    return (
                      <button
                        type="button"
                        key={fac.code}
                        onClick={() => {
                          setHospitalCode(fac.code);
                          applyRolePreset(selectedRole, fac.code);
                        }}
                        className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-teal-50/70 border-[#0D9488] ring-1 ring-[#0D9488]'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-extrabold text-xs text-teal-800">
                            #{fac.code}
                          </span>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />}
                        </div>
                        <div className="text-[11px] font-bold text-slate-900 truncate mt-0.5">
                          {fac.name}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">{fac.city}</div>
                      </button>
                    );
                  })}
                </div>

                <div className="relative">
                  <KeyRound className="w-4 h-4 text-teal-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    maxLength={8}
                    required
                    value={hospitalCode}
                    onChange={(e) => {
                      setHospitalCode(e.target.value.replace(/\D/g, '').slice(0, 8));
                      setErrorMsg('');
                    }}
                    placeholder="Enter 8-digit Hospital Code (e.g. 88492014)"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-[#0D9488] focus:bg-white rounded-lg pl-10 pr-4 py-2.5 text-sm font-mono font-bold text-slate-900 focus:outline-hidden"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-500 hidden sm:inline">
                    {matchedHospital.name}
                  </span>
                </div>
              </div>

              {/* Field 2: Select Hospital Role */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  2. Select Your Platform Role *
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => applyRolePreset('doctor')}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      selectedRole === 'doctor'
                        ? 'bg-teal-50/70 border-[#0D9488] ring-1 ring-[#0D9488]'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="w-7 h-7 rounded-md bg-[#0B1221] flex items-center justify-center text-teal-400">
                        <Stethoscope className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-teal-800">
                        DOCTOR
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-900">Doctor Dashboard</div>
                    <div className="text-[10px] text-slate-600 mt-0.5">
                      Clinical analytics, EWS charts & sign-off
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyRolePreset('caretaker')}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      selectedRole === 'caretaker'
                        ? 'bg-teal-50/70 border-[#0D9488] ring-1 ring-[#0D9488]'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="w-7 h-7 rounded-md bg-emerald-600 flex items-center justify-center text-white">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-emerald-800">
                        CARE TAKER
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-900">Care Taker Dashboard</div>
                    <div className="text-[10px] text-slate-600 mt-0.5">
                      Intake charts, allot doctor & SOS Gmail
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyRolePreset('admin')}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      selectedRole === 'admin'
                        ? 'bg-teal-50/70 border-[#0D9488] ring-1 ring-[#0D9488]'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="w-7 h-7 rounded-md bg-slate-800 flex items-center justify-center text-white">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-800">
                        ADMIN
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-900">Hospital Admin</div>
                    <div className="text-[10px] text-slate-600 mt-0.5">
                      Transfer charts, 8-digit routing & audits
                    </div>
                  </button>
                </div>
              </div>

              {/* Specialist Profile selector when Doctor is chosen */}
              {selectedRole === 'doctor' && (
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Select Specialist Physician Profile (Auto-fills Registered Email)
                  </label>
                  <select
                    value={selectedDoctorId}
                    onChange={(e) => {
                      setSelectedDoctorId(e.target.value);
                      const doc = HOSPITAL_SPECIALISTS.find((d) => d.id === e.target.value);
                      if (doc) {
                        setUserName(doc.name);
                        setEmail(doc.email);
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-hidden focus:border-[#0D9488]"
                  >
                    {HOSPITAL_SPECIALISTS.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name} — {doc.specialty} ({doc.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Field 3 & 4: Registered Email & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                    3. Registered Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-teal-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setErrorMsg('');
                      }}
                      placeholder="doctor@gmail.com"
                      className="w-full bg-slate-50 border border-slate-300 focus:border-[#0D9488] focus:bg-white rounded-lg pl-10 pr-3 py-2.5 text-xs font-mono text-slate-900 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                    4. Security Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-teal-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrorMsg('');
                      }}
                      placeholder="Enter password"
                      className="w-full bg-slate-50 border border-slate-300 focus:border-[#0D9488] focus:bg-white rounded-lg pl-10 pr-9 py-2.5 text-xs font-mono text-slate-900 focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 px-5 rounded-lg bg-[#0B1221] hover:bg-slate-800 text-white font-bold text-sm shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>
                  Sign In to{' '}
                  {selectedRole === 'doctor'
                    ? 'Doctor Clinical Operations Centre'
                    : selectedRole === 'caretaker'
                    ? 'Care Taker Triage Operations'
                    : 'Hospital Admin Governance Centre'}
                </span>
                <ArrowRight className="w-4 h-4 text-teal-400" />
              </button>
            </form>
          </div>

          <div className="pt-4 mt-5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-teal-600" />
              Local Synthetic Clinical Dataset (No External PHI)
            </span>
            <span className="font-mono text-teal-700 font-semibold">
              Simulated Emergency Email Relay Active
            </span>
          </div>
        </div>

        {/* Right Column (5 cols): Role Architecture Overview & 1-Click Instant Access */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-5">
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Instant One-Click Role Launchers
              </h2>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Each role opens an isolated clinical workspace with role-specific Recharts & D3 visual analytics, local persistence, and 8-digit hospital facility governance:
            </p>

            {/* Featured 1-Click Live Guided Storyboard Demo Banner */}
            {onLaunchLiveStory && (
              <div className="p-4 rounded-xl bg-[#0B1221] text-white border-2 border-[#0D9488] shadow-md space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#0D9488] text-white text-[10px] font-mono font-extrabold uppercase tracking-wider inline-flex items-center gap-1">
                    <Play className="w-3 h-3 fill-current" />
                    <span>RECOMMENDED FOR LIVE PITCH / DEMO</span>
                  </span>
                  <span className="text-[10px] font-mono text-teal-300">
                    5-Step End-to-End Story
                  </span>
                </div>
                <div className="text-xs font-extrabold text-white">
                  Interactive Live Story: Emergency Cardiac Triage → AI PII Firewall → MD Sign-Off → Admin D3 Velocity
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Launches a guided presenter bar with talking points and 1-click live execution across Care Taker, Doctor, AI Co-Pilot Firewall, and Hospital Admin roles.
                </p>
                <button
                  type="button"
                  onClick={onLaunchLiveStory}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Launch 5-Step Live Guided Story Demo →</span>
                </button>
              </div>
            )}

            <div className="space-y-3">
              {/* Quick Card 1: Doctor */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-[#0D9488] transition-all space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-[#0B1221] flex items-center justify-center text-teal-400">
                      <Stethoscope className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        1. Doctor Clinical Operations Dashboard
                      </div>
                      <div className="text-[10px] font-mono text-teal-700 font-semibold">
                        ashwinsivasamy08@gmail.com · Hosp #88492014
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleQuickLaunch('doctor', hospitalCode || '88492014')}
                    className="px-3 py-1.5 rounded-lg bg-[#0D9488] hover:bg-[#0F766E] text-white text-[11px] font-bold cursor-pointer whitespace-nowrap"
                  >
                    Enter as Doctor →
                  </button>
                </div>
                <p className="text-[11px] text-slate-600">
                  Includes Patient EWS Risk & Acuity Bar Chart, Vitals Trajectory Wave, 5x5 Organ Heatmap, Lab Delta Donut, and Clinical Sign-Off & Audit Download.
                </p>
              </div>

              {/* Quick Card 2: Care Taker */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-600 transition-all space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        2. Care Taker Intake & Triage Dashboard
                      </div>
                      <div className="text-[10px] font-mono text-emerald-700 font-semibold">
                        anjali.caretaker@medvision.org · Hosp #88492014
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleQuickLaunch('caretaker', hospitalCode || '88492014')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold cursor-pointer whitespace-nowrap"
                  >
                    Enter as Care Taker →
                  </button>
                </div>
                <p className="text-[11px] text-slate-600">
                  Includes Hourly Intake & Vitals Triage Area Chart, Specialist Allotment Workload Bar Chart, Queue Status Donut, patient registration, and Emergency Gmail SOS.
                </p>
              </div>

              {/* Quick Card 3: Hospital Admin */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-800 transition-all space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-white">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        3. Hospital Admin Governance Dashboard
                      </div>
                      <div className="text-[10px] font-mono text-slate-700 font-semibold">
                        admin.88492014@medvision.org · Hosp #88492014
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleQuickLaunch('admin', hospitalCode || '88492014')}
                    className="px-3 py-1.5 rounded-lg bg-[#0B1221] hover:bg-slate-800 text-white text-[11px] font-bold cursor-pointer whitespace-nowrap"
                  >
                    Enter as Admin →
                  </button>
                </div>
                <p className="text-[11px] text-slate-600">
                  Includes D3 Sign-Off Velocity Bar Chart, Inter-Hospital 8-Digit Transfer Flow Chart, Audit Compliance Curve, Governance Donut, and master JSON export.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Info Card */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-lg flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div className="text-xs text-slate-600 leading-relaxed">
              <strong className="text-slate-900 block">
                Synchronized Multi-Role Clinical State
              </strong>
              Any patient registered by the Care Taker, signed off by the Doctor, or transferred by the Hospital Admin dynamically updates the charts across all three role dashboards.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
