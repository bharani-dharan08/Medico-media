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
  KeyRound,
  ArrowRight,
  X,
  CheckCircle2,
  Mail,
} from 'lucide-react';
import { UserRole, UserSession } from '../types/clinical.ts';
import { HOSPITAL_FACILITIES, HOSPITAL_SPECIALISTS } from '../data/hospitalRegistry.ts';

interface HospitalLoginModalProps {
  isOpen: boolean;
  currentSession: UserSession;
  onLogin: (session: UserSession) => void;
  onClose: () => void;
}

export const HospitalLoginModal: React.FC<HospitalLoginModalProps> = ({
  isOpen,
  currentSession,
  onLogin,
  onClose,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentSession.role);
  const [hospitalCode, setHospitalCode] = useState<string>(currentSession.hospitalCode || '88492014');
  const [userName, setUserName] = useState<string>(currentSession.userName);
  const [userEmail, setUserEmail] = useState<string>(currentSession.userEmail);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('doc-01');
  const [codeError, setCodeError] = useState<string>('');

  if (!isOpen) return null;

  const matchedHospital =
    HOSPITAL_FACILITIES.find((h) => h.code === hospitalCode) || {
      code: hospitalCode,
      name: `Registered Medical Facility #${hospitalCode}`,
      city: 'Regional Health Network',
      adminName: 'Hospital Administrator',
      adminEmail: `admin.${hospitalCode}@medvision.org`,
    };

  const handleRolePreset = (role: UserRole, code = hospitalCode) => {
    setSelectedRole(role);
    const fac = HOSPITAL_FACILITIES.find((h) => h.code === code) || matchedHospital;
    if (role === 'doctor') {
      setUserName('Dr. Sarah Chen, MD');
      setUserEmail('ashwinsivasamy08@gmail.com');
    } else if (role === 'caretaker') {
      setUserName('Caretaker Anjali Verma, RN');
      setUserEmail('anjali.caretaker@medvision.org');
    } else {
      setUserName(fac.adminName);
      setUserEmail(fac.adminEmail);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = hospitalCode.replace(/\D/g, '');
    if (cleaned.length !== 8) {
      setCodeError('Hospital Code must be an exact 8-digit numerical identifier (e.g. 88492014).');
      return;
    }
    setCodeError('');

    const doc = HOSPITAL_SPECIALISTS.find((d) => d.id === selectedDoctorId);

    onLogin({
      role: selectedRole,
      hospitalCode: cleaned,
      hospitalName: matchedHospital.name,
      userName:
        selectedRole === 'doctor' && doc
          ? doc.name
          : userName ||
            (selectedRole === 'caretaker'
              ? 'Caretaker Anjali Verma, RN'
              : matchedHospital.adminName),
      userEmail:
        selectedRole === 'doctor' && doc
          ? doc.email
          : userEmail || 'ashwinsivasamy08@gmail.com',
      specialty: selectedRole === 'doctor' && doc ? doc.specialty : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
      <div className="vision-card w-full max-w-2xl border border-white/15 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#0B1437] via-[#101944] to-[#0075FF]/30 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0075FF] to-[#2CD9FF] flex items-center justify-center text-white shadow-[0_0_20px_rgba(0,117,255,0.6)]">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white tracking-tight">
                MEDICO-MEDIA Multi-Role Hospital Access Gateway
              </h2>
              <p className="text-xs text-[#2CD9FF] font-mono">
                8-Digit Hospital Code Authentication · Care Taker · Doctor · Hospital Admin
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#A0AEC0] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {/* Step 1: Select Hospital 8-Digit Code */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[#A0AEC0] flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-[#2CD9FF]" />
              1. Enter or Select Unique 8-Digit Hospital Code
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
                      setCodeError('');
                      if (selectedRole === 'admin') {
                        setUserName(fac.adminName);
                        setUserEmail(fac.adminEmail);
                      }
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#0075FF]/20 border-[#2CD9FF] shadow-[0_0_15px_rgba(0,117,255,0.3)]'
                        : 'bg-[#0B1437]/80 border-white/10 hover:border-white/25'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-extrabold text-sm text-[#2CD9FF]">
                        #{fac.code}
                      </span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-[#01B574]" />}
                    </div>
                    <div className="text-xs font-bold text-white mt-1 truncate">
                      {fac.name}
                    </div>
                    <div className="text-[10px] text-[#A0AEC0] truncate">{fac.city}</div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3 pt-1">
              <input
                type="text"
                maxLength={8}
                value={hospitalCode}
                onChange={(e) => {
                  setHospitalCode(e.target.value.replace(/\D/g, '').slice(0, 8));
                  setCodeError('');
                }}
                placeholder="Enter 8-digit code (e.g. 88492014)"
                className="w-48 bg-[#050A1F] border border-white/15 rounded-xl px-3.5 py-2 text-sm font-mono font-bold text-[#2CD9FF] focus:outline-hidden focus:border-[#0075FF]"
              />
              <span className="text-xs text-[#A0AEC0]">
                Active Facility: <strong className="text-white">{matchedHospital.name}</strong>
              </span>
            </div>
            {codeError && <p className="text-xs text-[#FF3B6B] font-semibold">{codeError}</p>}
          </div>

          {/* Step 2: Select Role */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[#A0AEC0] block">
              2. Select Hospital Platform Role
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Role 1: Doctor */}
              <button
                type="button"
                onClick={() => handleRolePreset('doctor')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedRole === 'doctor'
                    ? 'bg-gradient-to-br from-[#0075FF]/25 to-[#2CD9FF]/10 border-[#2CD9FF] shadow-[0_0_16px_rgba(0,117,255,0.3)]'
                    : 'bg-[#0B1437]/80 border-white/10 hover:border-white/25'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="w-8 h-8 rounded-lg bg-[#0075FF] flex items-center justify-center text-white">
                    <Stethoscope className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono text-[#2CD9FF] font-bold">
                    PHYSICIAN
                  </span>
                </div>
                <div className="text-xs font-extrabold text-white">Doctor Login</div>
                <p className="text-[10px] text-[#A0AEC0] mt-1 leading-relaxed">
                  View severity charts, accept hospital transfers, sign off visits, comment for caretaker & download audit records.
                </p>
              </button>

              {/* Role 2: Care Taker */}
              <button
                type="button"
                onClick={() => handleRolePreset('caretaker')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedRole === 'caretaker'
                    ? 'bg-gradient-to-br from-[#01B574]/25 to-[#2CD9FF]/10 border-[#01B574] shadow-[0_0_16px_rgba(1,181,116,0.3)]'
                    : 'bg-[#0B1437]/80 border-white/10 hover:border-white/25'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="w-8 h-8 rounded-lg bg-[#01B574] flex items-center justify-center text-white">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono text-[#01B574] font-bold">
                    INTAKE / RN
                  </span>
                </div>
                <div className="text-xs font-extrabold text-white">Care Taker Login</div>
                <p className="text-[10px] text-[#A0AEC0] mt-1 leading-relaxed">
                  Enter new patient records, update status, allot to specialist & doctor, and trigger emergency Gmail alerts.
                </p>
              </button>

              {/* Role 3: Hospital Admin */}
              <button
                type="button"
                onClick={() => handleRolePreset('admin')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedRole === 'admin'
                    ? 'bg-gradient-to-br from-[#7928CA]/25 to-[#FF0080]/10 border-[#FF0080] shadow-[0_0_16px_rgba(121,40,202,0.3)]'
                    : 'bg-[#0B1437]/80 border-white/10 hover:border-white/25'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="w-8 h-8 rounded-lg bg-[#7928CA] flex items-center justify-center text-white">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono text-[#FF3B6B] font-bold">
                    SINGLE ADMIN
                  </span>
                </div>
                <div className="text-xs font-extrabold text-white">Hospital Admin</div>
                <p className="text-[10px] text-[#A0AEC0] mt-1 leading-relaxed">
                  Single admin for hospital #{hospitalCode}. Transfer patients across hospitals, route records to doctors & manage audits.
                </p>
              </button>
            </div>
          </div>

          {/* Step 3: Practitioner / Staff Identity */}
          <div className="p-4 rounded-xl bg-[#0B1437]/90 border border-white/10 space-y-3">
            {selectedRole === 'doctor' ? (
              <div>
                <label className="text-[11px] font-bold text-[#A0AEC0] block mb-1.5">
                  Select Attending Specialist Profile (Hospital #{hospitalCode})
                </label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => {
                    setSelectedDoctorId(e.target.value);
                    const doc = HOSPITAL_SPECIALISTS.find((d) => d.id === e.target.value);
                    if (doc) {
                      setUserName(doc.name);
                      setUserEmail(doc.email);
                    }
                  }}
                  className="w-full bg-[#050A1F] border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-hidden focus:border-[#0075FF]"
                >
                  {HOSPITAL_SPECIALISTS.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} — {doc.specialty} ({doc.email})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#A0AEC0] block mb-1">
                    {selectedRole === 'caretaker' ? 'Care Taker Name' : 'Hospital Admin Name (1 per Hospital)'}
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full bg-[#050A1F] border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#A0AEC0] flex items-center gap-1 mb-1">
                    <Mail className="w-3 h-3 text-[#2CD9FF]" />
                    Official Google Email
                  </label>
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="w-full bg-[#050A1F] border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-[#A0AEC0]">
              Encrypted Hospital Session · Code <strong className="text-[#2CD9FF] font-mono">#{hospitalCode}</strong>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#A0AEC0] hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0075FF] to-[#2CD9FF] text-white text-xs font-extrabold shadow-[0_4px_20px_rgba(0,117,255,0.5)] hover:brightness-110 transition-all cursor-pointer"
              >
                <span>Enter {selectedRole.toUpperCase()} Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
