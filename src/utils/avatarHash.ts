/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PatientAvatarConfig {
  gradientClass: string;
  glowColor: string;
  accentHex: string;
  secondaryHex: string;
  initials: string;
  ringColor: string;
  iconType: number;
  hashHex: string;
  charSum: number;
  hueAngle: number;
  patternBits: boolean[];
}

const PALETTES = [
  {
    gradientClass: 'from-[#0075FF] via-[#00A3FF] to-[#2CD9FF]',
    glowColor: 'rgba(0, 117, 255, 0.45)',
    accentHex: '#0075FF',
    secondaryHex: '#2CD9FF',
    ringColor: 'border-[#2CD9FF]/50',
  },
  {
    gradientClass: 'from-[#01B574] via-[#10B981] to-[#2CD9FF]',
    glowColor: 'rgba(1, 181, 116, 0.45)',
    accentHex: '#01B574',
    secondaryHex: '#2CD9FF',
    ringColor: 'border-[#01B574]/50',
  },
  {
    gradientClass: 'from-[#7928CA] via-[#9030EB] to-[#FF0080]',
    glowColor: 'rgba(121, 40, 202, 0.45)',
    accentHex: '#7928CA',
    secondaryHex: '#FF0080',
    ringColor: 'border-[#FF0080]/50',
  },
  {
    gradientClass: 'from-[#FF3B6B] via-[#FF5E62] to-[#FFB547]',
    glowColor: 'rgba(255, 59, 107, 0.45)',
    accentHex: '#FF3B6B',
    secondaryHex: '#FFB547',
    ringColor: 'border-[#FF3B6B]/50',
  },
  {
    gradientClass: 'from-[#3B82F6] via-[#6366F1] to-[#8B5CF6]',
    glowColor: 'rgba(99, 102, 241, 0.45)',
    accentHex: '#6366F1',
    secondaryHex: '#8B5CF6',
    ringColor: 'border-[#6366F1]/50',
  },
  {
    gradientClass: 'from-[#00F2FE] via-[#4FACFE] to-[#0075FF]',
    glowColor: 'rgba(0, 242, 254, 0.45)',
    accentHex: '#00F2FE',
    secondaryHex: '#0075FF',
    ringColor: 'border-[#00F2FE]/50',
  },
  {
    gradientClass: 'from-[#F59E0B] via-[#FFB547] to-[#FF3B6B]',
    glowColor: 'rgba(255, 181, 71, 0.45)',
    accentHex: '#FFB547',
    secondaryHex: '#FF3B6B',
    ringColor: 'border-[#FFB547]/50',
  },
  {
    gradientClass: 'from-[#06B6D4] via-[#0075FF] to-[#7928CA]',
    glowColor: 'rgba(6, 182, 212, 0.45)',
    accentHex: '#06B6D4',
    secondaryHex: '#7928CA',
    ringColor: 'border-[#06B6D4]/50',
  },
];

/**
 * Computes a deterministic string-sum + FNV/bitwise hash for a patient MRN/ID
 * and returns a consistent avatar color palette, SVG user avatar geometry, and hex digest.
 */
export function getPatientAvatarConfig(
  idOrMrn: string,
  firstName: string,
  lastName: string,
  mrn?: string
): PatientAvatarConfig {
  const primaryKey = (mrn || idOrMrn || '').trim();
  const seedString = `${primaryKey}:${idOrMrn}:${firstName}:${lastName}`;

  // 1. Weighted ASCII string sum + 32-bit rolling hash
  let charSum = 0;
  let hash = 2166136261;
  for (let i = 0; i < seedString.length; i++) {
    const code = seedString.charCodeAt(i);
    charSum += code * (i + 1);
    hash ^= code;
    hash = Math.imul(hash, 16777619);
  }

  const positiveHash = Math.abs(hash ^ charSum);
  const paletteIndex = positiveHash % PALETTES.length;
  const iconType = (positiveHash >> 3) % 4;
  const hueAngle = positiveHash % 360;
  const hashHex = (positiveHash >>> 0).toString(16).toUpperCase().padStart(8, '0').slice(0, 6);
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  // 9-bit symmetric pattern for deterministic avatar visual accents
  const patternBits: boolean[] = [];
  for (let bit = 0; bit < 9; bit++) {
    patternBits.push(((positiveHash >> bit) & 1) === 1);
  }

  return {
    ...PALETTES[paletteIndex],
    initials,
    iconType,
    hashHex,
    charSum,
    hueAngle,
    patternBits,
  };
}

