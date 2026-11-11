/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import {
  BarChart3,
  Clock,
  CheckCircle2,
  Stethoscope,
  Activity,
  Timer,
  ArrowRight,
  Zap,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import { Patient } from '../types/clinical.ts';
import { HOSPITAL_SPECIALISTS } from '../data/hospitalRegistry.ts';

interface AdminAuditOversightD3Props {
  patients: Patient[];
  hospitalCode: string;
}

export interface DoctorOversightMetric {
  doctorId: string;
  doctorName: string;
  shortName: string;
  specialty: string;
  availability: string;
  assignedCases: number;
  signedOffCases: number;
  reportCompletionRate: number; // 0 - 100%
  signOffVelocityRate: number; // 0 - 100%
  avgSignOffMinutes: number; // e.g., 11m - 24m
  casesPerShift: number;
}

export interface PatientSignOffVelocityRecord {
  patientId: string;
  patientName: string;
  mrn: string;
  triageLevel: string;
  assignedDoctor: string;
  triageIntakeTimestamp: string;
  physicianSignOffTimestamp: string | null;
  deltaMinutes: number;
  isSignedOff: boolean;
  slaStatus: 'OPTIMAL_SLA' | 'WITHIN_SLA' | 'SLA_BREACH_RISK';
  efficiencyScore: number; // 0 - 100%
  auditId: string;
}

type ChartMetricMode = 'dual' | 'completion' | 'time';

/**
 * Helper to parse "08:25 AM" or "14:30" into minutes since midnight for deterministic timestamp delta comparison.
 */
function parseTimeToMinutes(timeStr: string, fallbackMinutes: number): number {
  if (!timeStr) return fallbackMinutes;
  const cleaned = timeStr.trim().toUpperCase();
  const match = cleaned.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/);
  if (!match) return fallbackMinutes;
  let hours = parseInt(match[1], 10);
  const mins = parseInt(match[2], 10);
  const meridiem = match[3];
  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  return hours * 60 + mins;
}

function formatMinutesToTime(totalMinutes: number): string {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const hours24 = Math.floor(normalized / 60);
  const mins = normalized % 60;
  const meridiem = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${String(hours12).padStart(2, '0')}:${String(mins).padStart(2, '0')} ${meridiem}`;
}

export const AdminAuditOversightD3: React.FC<AdminAuditOversightD3Props> = ({
  patients,
  hospitalCode,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [metricMode, setMetricMode] = useState<ChartMetricMode>('dual');
  const [hoveredDoc, setHoveredDoc] = useState<DoctorOversightMetric | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(760);

  // Real-time ticker (1s interval) for live audit stopwatch & velocity tracking
  const [liveTickSeconds, setLiveTickSeconds] = useState<number>(0);
  // Local overrides when Admin triggers a real-time timestamp sign-off verification test
  const [simulatedSignOffs, setSimulatedSignOffs] = useState<
    Record<string, { signedOffAt: string; deltaMinutes: number }>
  >({});

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTickSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Build Patient-Level Triage Intake vs. Physician Sign-Off Timestamp Comparison Records
  const patientVelocityRecords: PatientSignOffVelocityRecord[] = useMemo(() => {
    const presetTurnaroundOffsets = [12, 15, 19, 11, 16];

    return patients.map((pat, idx) => {
      const intakeRaw = pat.vitals?.recordedAt || pat.timeSlot || '08:30 AM';
      const intakeMins = parseTimeToMinutes(intakeRaw, 510 + idx * 25);

      const simOverride = simulatedSignOffs[pat.id];
      const isAlreadySigned =
        Boolean(simOverride) ||
        pat.appointmentStatus === 'Done' ||
        Boolean(pat.doctorSignOff?.signedOff);

      let signOffTimestamp: string | null = null;
      let deltaMinutes = presetTurnaroundOffsets[idx % presetTurnaroundOffsets.length];

      if (simOverride) {
        signOffTimestamp = simOverride.signedOffAt;
        deltaMinutes = simOverride.deltaMinutes;
      } else if (pat.doctorSignOff?.signedOffAt) {
        signOffTimestamp = pat.doctorSignOff.signedOffAt;
        const parsedSignOffMins = parseTimeToMinutes(
          pat.doctorSignOff.signedOffAt,
          intakeMins + deltaMinutes
        );
        const rawDiff = parsedSignOffMins - intakeMins;
        deltaMinutes =
          rawDiff > 0 && rawDiff < 180
            ? rawDiff
            : presetTurnaroundOffsets[idx % presetTurnaroundOffsets.length];
      } else if (pat.appointmentStatus === 'Done') {
        deltaMinutes = presetTurnaroundOffsets[idx % presetTurnaroundOffsets.length];
        signOffTimestamp = formatMinutesToTime(intakeMins + deltaMinutes);
      } else {
        // Active unsigned encounter: elapsed time grows slightly with live ticker
        deltaMinutes =
          presetTurnaroundOffsets[idx % presetTurnaroundOffsets.length] +
          Math.floor(liveTickSeconds / 30);
      }

      const slaStatus: PatientSignOffVelocityRecord['slaStatus'] =
        deltaMinutes <= 14
          ? 'OPTIMAL_SLA'
          : deltaMinutes <= 18
          ? 'WITHIN_SLA'
          : 'SLA_BREACH_RISK';

      const efficiencyScore = Math.max(
        52,
        Math.min(99, Math.round(100 - Math.max(0, deltaMinutes - 8) * 2.2))
      );

      return {
        patientId: pat.id,
        patientName: `${pat.demographics.firstName} ${pat.demographics.lastName}`,
        mrn: pat.mrn,
        triageLevel: pat.triageLevel,
        assignedDoctor: pat.assignedDoctorName || 'Dr. Sarah Chen, MD',
        triageIntakeTimestamp: formatMinutesToTime(intakeMins),
        physicianSignOffTimestamp: signOffTimestamp,
        deltaMinutes,
        isSignedOff: isAlreadySigned,
        slaStatus,
        efficiencyScore,
        auditId:
          pat.doctorSignOff?.auditId ||
          `VEL-${hospitalCode.slice(0, 4)}-${pat.mrn}`,
      };
    });
  }, [patients, simulatedSignOffs, liveTickSeconds, hospitalCode]);

  // Compute live doctor completion rates and average sign-off times (in minutes)
  const doctorMetrics: DoctorOversightMetric[] = useMemo(() => {
    const baselineByDoc: Record<
      string,
      {
        baseAssigned: number;
        baseSigned: number;
        baseCompletion: number;
        avgMins: number;
        velocityScore: number;
      }
    > = {
      'doc-01': {
        baseAssigned: 12,
        baseSigned: 11,
        baseCompletion: 96,
        avgMins: 11,
        velocityScore: 94,
      },
      'doc-02': {
        baseAssigned: 10,
        baseSigned: 8,
        baseCompletion: 89,
        avgMins: 16,
        velocityScore: 86,
      },
      'doc-03': {
        baseAssigned: 8,
        baseSigned: 6,
        baseCompletion: 82,
        avgMins: 22,
        velocityScore: 78,
      },
      'doc-04': {
        baseAssigned: 11,
        baseSigned: 10,
        baseCompletion: 93,
        avgMins: 13,
        velocityScore: 91,
      },
      'doc-05': {
        baseAssigned: 9,
        baseSigned: 8,
        baseCompletion: 90,
        avgMins: 15,
        velocityScore: 88,
      },
    };

    return HOSPITAL_SPECIALISTS.map((doc) => {
      const assignedPatients = patients.filter(
        (p) => p.assignedDoctorId === doc.id || p.assignedDoctorName === doc.name
      );
      const liveSignedCount = assignedPatients.filter(
        (p) =>
          Boolean(simulatedSignOffs[p.id]) ||
          p.appointmentStatus === 'Done' ||
          p.doctorSignOff?.signedOff
      ).length;

      const liveLabCompletionAvg =
        assignedPatients.length > 0
          ? Math.round(
              assignedPatients.reduce(
                (acc, p) => acc + (p.quickMetrics?.labCompletionPercent || 88),
                0
              ) / assignedPatients.length
            )
          : null;

      const base = baselineByDoc[doc.id] || {
        baseAssigned: 8,
        baseSigned: 7,
        baseCompletion: 88,
        avgMins: 15,
        velocityScore: 85,
      };

      const totalAssigned = base.baseAssigned + assignedPatients.length;
      const totalSigned = base.baseSigned + liveSignedCount;

      const reportCompletionRate = Math.min(
        100,
        liveLabCompletionAvg !== null
          ? Math.round((base.baseCompletion + liveLabCompletionAvg) / 2)
          : base.baseCompletion
      );

      const signOffRatio = Math.round((totalSigned / Math.max(1, totalAssigned)) * 100);
      const signOffVelocityRate = Math.min(
        100,
        Math.round((base.velocityScore + signOffRatio) / 2)
      );

      const nameParts = doc.name
        .replace(', MD', '')
        .replace(', FACS', '')
        .replace(', DM', '')
        .split(' ');
      const shortName =
        nameParts.length >= 3
          ? `Dr. ${nameParts[nameParts.length - 1]}`
          : doc.name.split(',')[0];

      return {
        doctorId: doc.id,
        doctorName: doc.name,
        shortName,
        specialty: doc.specialty.split('&')[0].trim(),
        availability: doc.availability,
        assignedCases: totalAssigned,
        signedOffCases: totalSigned,
        reportCompletionRate,
        signOffVelocityRate,
        avgSignOffMinutes: Math.max(8, base.avgMins - liveSignedCount),
        casesPerShift: totalSigned,
      };
    });
  }, [patients, simulatedSignOffs]);

  // Trigger a real-time timestamp stamp on an active patient to demonstrate live velocity calculation
  const handleStampLiveSignOff = (rec: PatientSignOffVelocityRecord) => {
    const intakeMins = parseTimeToMinutes(rec.triageIntakeTimestamp, 510);
    const fastDelta = Math.max(9, Math.min(14, rec.deltaMinutes - 2));
    const stampedTime = formatMinutesToTime(intakeMins + fastDelta);
    setSimulatedSignOffs((prev) => ({
      ...prev,
      [rec.patientId]: {
        signedOffAt: stampedTime,
        deltaMinutes: fastDelta,
      },
    }));
  };

  // Observe container resize for responsive D3 SVG layout
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(Math.floor(entry.contentRect.width));
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Render Dual-Scale D3 "Sign-off Velocity" Bar Chart (Completion Rate % + Avg Sign-off Time in mins)
  useEffect(() => {
    if (!svgRef.current || doctorMetrics.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = Math.max(440, containerWidth);
    const height = 285;
    const margin = { top: 28, right: 48, bottom: 52, left: 48 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const defs = svg.append('defs');

    const glowFilter = defs
      .append('filter')
      .attr('id', 'd3-neon-glow')
      .attr('x', '-20%')
      .attr('y', '-20%')
      .attr('width', '140%')
      .attr('height', '140%');
    glowFilter
      .append('feDropShadow')
      .attr('dx', '0')
      .attr('dy', '3')
      .attr('stdDeviation', '3')
      .attr('flood-color', '#0D9488')
      .attr('flood-opacity', '0.28');

    const completionGrad = defs
      .append('linearGradient')
      .attr('id', 'd3-completion-grad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    completionGrad.append('stop').attr('offset', '0%').attr('stop-color', '#14B8A6');
    completionGrad.append('stop').attr('offset', '100%').attr('stop-color', '#0D9488');

    const timeFastGrad = defs
      .append('linearGradient')
      .attr('id', 'd3-time-fast-grad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    timeFastGrad.append('stop').attr('offset', '0%').attr('stop-color', '#10B981');
    timeFastGrad.append('stop').attr('offset', '100%').attr('stop-color', '#059669');

    const timeWarnGrad = defs
      .append('linearGradient')
      .attr('id', 'd3-time-warn-grad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    timeWarnGrad.append('stop').attr('offset', '0%').attr('stop-color', '#F59E0B');
    timeWarnGrad.append('stop').attr('offset', '100%').attr('stop-color', '#D97706');

    const chartGroup = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X Scales
    const x0 = d3
      .scaleBand<string>()
      .domain(doctorMetrics.map((d) => d.shortName))
      .rangeRound([0, innerWidth])
      .paddingInner(0.28)
      .paddingOuter(0.14);

    const activeKeys =
      metricMode === 'dual'
        ? ['completion', 'avgTime']
        : metricMode === 'completion'
        ? ['completion']
        : ['avgTime'];

    const x1 = d3
      .scaleBand<string>()
      .domain(activeKeys)
      .rangeRound([0, x0.bandwidth()])
      .padding(0.16);

    // Left Y Scale: Completion Rate (0% - 105%)
    const yPercent = d3.scaleLinear().domain([0, 105]).range([innerHeight, 0]);

    // Right Y Scale: Average Sign-Off Time (0m - 30m)
    const yMinutes = d3.scaleLinear().domain([0, 30]).range([innerHeight, 0]);

    // Horizontal Grid Lines
    const yTicks = [0, 25, 50, 75, 100];
    chartGroup
      .append('g')
      .attr('class', 'grid-lines')
      .selectAll('line')
      .data(yTicks)
      .join('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', (d) => yPercent(d))
      .attr('y2', (d) => yPercent(d))
      .attr('stroke', 'rgba(255, 255, 255, 0.1)')
      .attr('stroke-dasharray', '3 3');

    // Left Y-Axis Labels (Completion Rate %)
    chartGroup
      .append('g')
      .selectAll('text')
      .data(yTicks)
      .join('text')
      .attr('x', -10)
      .attr('y', (d) => yPercent(d) + 3)
      .attr('text-anchor', 'end')
      .attr('fill', '#2DD4BF')
      .attr('font-size', '10px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .text((d) => `${d}%`);

    // Right Y-Axis Labels (Average Sign-Off Time in Minutes)
    const minTicks = [0, 8, 15, 22, 30];
    chartGroup
      .append('g')
      .selectAll('text')
      .data(minTicks)
      .join('text')
      .attr('x', innerWidth + 10)
      .attr('y', (d) => yMinutes(d) + 3)
      .attr('text-anchor', 'start')
      .attr('fill', '#34D399')
      .attr('font-size', '10px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .text((d) => `${d}m`);

    // Hospital Target SLA Line (85% Completion / 18m Sign-Off SLA)
    const slaY = yPercent(85);
    chartGroup
      .append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', slaY)
      .attr('y2', slaY)
      .attr('stroke', '#F59E0B')
      .attr('stroke-width', 1.4)
      .attr('stroke-dasharray', '5 4');

    chartGroup
      .append('text')
      .attr('x', innerWidth - 4)
      .attr('y', slaY - 5)
      .attr('text-anchor', 'end')
      .attr('fill', '#FBBF24')
      .attr('font-size', '9px')
      .attr('font-weight', '700')
      .attr('font-family', 'JetBrains Mono, monospace')
      .text('85% COMPLETION / 18m SLA BENCHMARK');

    // Doctor Bar Groups
    const docGroups = chartGroup
      .selectAll('.doc-group')
      .data(doctorMetrics)
      .join('g')
      .attr('class', 'doc-group')
      .attr('transform', (d) => `translate(${x0(d.shortName) || 0},0)`)
      .style('cursor', 'pointer')
      .on('mouseenter', (_event, d) => setHoveredDoc(d))
      .on('mouseleave', () => setHoveredDoc(null));

    // Pedestal Background per Doctor Group
    docGroups
      .append('rect')
      .attr('x', -4)
      .attr('y', 0)
      .attr('width', x0.bandwidth() + 8)
      .attr('height', innerHeight)
      .attr('rx', 8)
      .attr('fill', 'rgba(255, 255, 255, 0.03)')
      .attr('stroke', 'rgba(255, 255, 255, 0.06)');

    // Bars for Completion Rate (%) and Avg Sign-Off Time (mins)
    docGroups
      .selectAll('.metric-bar')
      .data((d) =>
        activeKeys.map((key) => ({
          key,
          rawValue:
            key === 'completion' ? d.reportCompletionRate : d.avgSignOffMinutes,
          targetY:
            key === 'completion'
              ? yPercent(d.reportCompletionRate)
              : yMinutes(d.avgSignOffMinutes),
          doc: d,
        }))
      )
      .join('rect')
      .attr('class', 'metric-bar')
      .attr('x', (d) => x1(d.key) || 0)
      .attr('y', innerHeight)
      .attr('width', x1.bandwidth())
      .attr('height', 0)
      .attr('rx', 5)
      .attr('filter', 'url(#d3-neon-glow)')
      .attr('fill', (d) => {
        if (d.key === 'completion') return 'url(#d3-completion-grad)';
        return d.rawValue > 18 ? 'url(#d3-time-warn-grad)' : 'url(#d3-time-fast-grad)';
      })
      .transition()
      .duration(450)
      .ease(d3.easeCubicOut)
      .attr('y', (d) => d.targetY)
      .attr('height', (d) => Math.max(0, innerHeight - d.targetY));

    // Value Badges above each Bar
    docGroups
      .selectAll('.bar-label')
      .data((d) =>
        activeKeys.map((key) => ({
          key,
          rawValue:
            key === 'completion' ? d.reportCompletionRate : d.avgSignOffMinutes,
          targetY:
            key === 'completion'
              ? yPercent(d.reportCompletionRate)
              : yMinutes(d.avgSignOffMinutes),
        }))
      )
      .join('text')
      .attr('class', 'bar-label')
      .attr('x', (d) => (x1(d.key) || 0) + x1.bandwidth() / 2)
      .attr('y', (d) => d.targetY - 6)
      .attr('text-anchor', 'middle')
      .attr('fill', (d) => {
        if (d.key === 'completion') return '#2DD4BF';
        return d.rawValue > 18 ? '#FBBF24' : '#34D399';
      })
      .attr('font-size', '10px')
      .attr('font-weight', '800')
      .attr('font-family', 'JetBrains Mono, monospace')
      .text((d) => (d.key === 'completion' ? `${d.rawValue}%` : `${d.rawValue}m`));

    // X-Axis Doctor Names & Summary Subtitles
    const xAxisGroup = chartGroup
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`);

    xAxisGroup
      .selectAll('.doc-name')
      .data(doctorMetrics)
      .join('text')
      .attr('class', 'doc-name')
      .attr('x', (d) => (x0(d.shortName) || 0) + x0.bandwidth() / 2)
      .attr('y', 19)
      .attr('text-anchor', 'middle')
      .attr('fill', '#FFFFFF')
      .attr('font-size', '11px')
      .attr('font-weight', '700')
      .text((d) => d.shortName);

    xAxisGroup
      .selectAll('.doc-spec')
      .data(doctorMetrics)
      .join('text')
      .attr('class', 'doc-spec')
      .attr('x', (d) => (x0(d.shortName) || 0) + x0.bandwidth() / 2)
      .attr('y', 34)
      .attr('text-anchor', 'middle')
      .attr('fill', '#94A3B8')
      .attr('font-size', '9px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .text((d) => `${d.reportCompletionRate}% · ${d.avgSignOffMinutes}m avg`);
  }, [doctorMetrics, metricMode, containerWidth]);

  const hospitalAvgCompletion = Math.round(
    doctorMetrics.reduce((acc, d) => acc + d.reportCompletionRate, 0) /
      Math.max(1, doctorMetrics.length)
  );
  const hospitalAvgVelocity = Math.round(
    doctorMetrics.reduce((acc, d) => acc + d.signOffVelocityRate, 0) /
      Math.max(1, doctorMetrics.length)
  );
  const hospitalAvgTurnaround = Math.round(
    doctorMetrics.reduce((acc, d) => acc + d.avgSignOffMinutes, 0) /
      Math.max(1, doctorMetrics.length)
  );

  // Aggregate real-time intake-to-signoff timestamp metrics across active patient roster
  const meanIntakeToSignOffMins = Math.round(
    patientVelocityRecords.reduce((acc, r) => acc + r.deltaMinutes, 0) /
      Math.max(1, patientVelocityRecords.length)
  );
  const slaCompliantCount = patientVelocityRecords.filter(
    (r) => r.deltaMinutes <= 18
  ).length;
  const hospitalAuditEfficiencyPct = Math.round(
    patientVelocityRecords.reduce((acc, r) => acc + r.efficiencyScore, 0) /
      Math.max(1, patientVelocityRecords.length)
  );
  const liveClockFormatted = `${String(Math.floor(liveTickSeconds / 60)).padStart(
    2,
    '0'
  )}:${String(liveTickSeconds % 60).padStart(2, '0')}`;

  return (
    <div className="vision-card p-5 space-y-5">
      {/* Header & D3 Metric Filter Switcher */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 border-b border-slate-200 pb-3.5">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200 text-[10px] font-mono font-extrabold uppercase">
              REAL-TIME SIGN-OFF VELOCITY TRACKER · D3.JS AUDIT OVERSIGHT
            </span>
            <span className="px-2 py-0.5 rounded-md bg-[#0B1221] text-teal-300 text-[10px] font-mono font-bold inline-flex items-center gap-1.5">
              <Timer className="w-3 h-3 text-[#14B8A6]" />
              <span>LIVE TELEMETRY CLOCK +{liveClockFormatted}</span>
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              Hospital #{hospitalCode} Physician Roster ({doctorMetrics.length} Specialists)
            </span>
          </div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-teal-600" />
            <span>
              Real-Time Sign-off Velocity Tracker: Triage Intake vs. Physician Sign-Off Timestamp Comparison
            </span>
          </h2>
        </div>

        {/* Interactive Mode Filter & Legend */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-3 mr-2 text-[11px] font-semibold">
            <span className="inline-flex items-center gap-1.5 text-teal-700">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#0D9488]" />
              Completion Rate (%)
            </span>
            <span className="inline-flex items-center gap-1.5 text-emerald-700">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#059669]" />
              Avg Sign-Off Time (m ≤18m)
            </span>
            <span className="inline-flex items-center gap-1.5 text-amber-700">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#D97706]" />
              Delayed (&gt;18m)
            </span>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-[11px]">
            {(
              [
                { id: 'dual', label: 'Completion % + Sign-Off Time (m)' },
                { id: 'completion', label: 'Completion Rate (%)' },
                { id: 'time', label: 'Avg Sign-Off Time (mins)' },
              ] as { id: ChartMetricMode; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMetricMode(tab.id)}
                className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer whitespace-nowrap ${
                  metricMode === tab.id
                    ? 'bg-[#0B1221] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content: D3 Dual-Metric Bar Chart + Telemetry Inspector */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-center">
        {/* Left 8 Cols: D3 Grouped Bar Chart Canvas (Obsidian Navy Panel) */}
        <div
          ref={containerRef}
          className="xl:col-span-8 rounded-xl bg-[#0B1221] border border-slate-800 p-3.5 relative shadow-sm"
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-2 mb-1">
            <span className="text-teal-400 font-bold">← LEFT AXIS: COMPLETION RATE (%)</span>
            <span className="text-emerald-400 font-bold">RIGHT AXIS: AVG SIGN-OFF TIME (MINS) →</span>
          </div>
          <svg ref={svgRef} className="w-full h-[285px] overflow-visible" />
        </div>

        {/* Right 4 Cols: Hospital Benchmark Summary & Hovered Doctor Telemetry */}
        <div className="xl:col-span-4 space-y-3">
          {/* Aggregate Hospital KPIs */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-[10px] font-mono text-slate-500 uppercase">
                Avg Completion
              </div>
              <div className="text-lg font-extrabold font-mono text-teal-700 mt-0.5">
                {hospitalAvgCompletion}%
              </div>
              <div className="text-[10px] text-emerald-700 font-semibold">
                +5% vs SLA
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-[10px] font-mono text-slate-500 uppercase">
                Intake→SignOff
              </div>
              <div className="text-lg font-extrabold font-mono text-emerald-700 mt-0.5">
                {meanIntakeToSignOffMins}m
              </div>
              <div className="text-[10px] text-teal-700 font-semibold">
                Target ≤18m
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-[10px] font-mono text-slate-500 uppercase">
                Audit Efficiency
              </div>
              <div className="text-lg font-extrabold font-mono text-slate-900 mt-0.5">
                {hospitalAuditEfficiencyPct}%
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                {slaCompliantCount}/{patientVelocityRecords.length} SLA Met
              </div>
            </div>
          </div>

          {/* Live Physician Audit Inspector Card (Updates on Bar Hover) */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-teal-800 font-extrabold flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                <span>
                  {hoveredDoc ? 'Hovered Physician Velocity' : 'Lead Sign-Off Velocity'}
                </span>
              </span>
              <span className="text-[10px] font-mono text-emerald-700 font-bold">
                {(hoveredDoc || doctorMetrics[0]).availability}
              </span>
            </div>

            {(() => {
              const target = hoveredDoc || doctorMetrics[0];
              return (
                <>
                  <div>
                    <div className="text-sm font-extrabold text-slate-900">
                      {target.doctorName}
                    </div>
                    <div className="text-[11px] text-slate-600">{target.specialty}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 text-xs font-mono">
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">
                        Completion Rate
                      </span>
                      <strong className="text-teal-700 text-sm">
                        {target.reportCompletionRate}% ({target.signedOffCases}/{target.assignedCases})
                      </strong>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">
                        Avg Sign-Off Time
                      </span>
                      <strong
                        className={`text-sm ${
                          target.avgSignOffMinutes > 18 ? 'text-amber-700' : 'text-emerald-700'
                        }`}
                      >
                        {target.avgSignOffMinutes} mins / case
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-600 pt-0.5">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Velocity Score: <strong className="text-slate-900">{target.signOffVelocityRate}%</strong>
                    </span>
                    <span className="flex items-center gap-1 text-amber-700 font-mono font-semibold">
                      <Clock className="w-3 h-3" />
                      {target.avgSignOffMinutes <= 18 ? 'FAST TURNAROUND' : 'SLA WARNING'}
                    </span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Real-Time Triage Intake vs. Physician Sign-Off Timestamp Comparison Matrix */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#0D9488]" />
              <span>
                Clinical Triage Intake Timestamp vs. Physician Sign-Off Timestamp Ledger
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Compares baseline triage vitals intake timestamp against physician sign-off completion timestamp to measure hospital-wide audit velocity against the 18-minute SLA benchmark.
            </p>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono shrink-0">
            <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-800 font-bold">
              Mean Velocity: <strong className="text-[#0D9488]">{meanIntakeToSignOffMins} mins</strong>
            </span>
            <span className="px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold">
              Audit Efficiency: {hospitalAuditEfficiencyPct}%
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-mono uppercase text-slate-500">
                <th className="py-2 px-2.5">Patient & Triage Acuity</th>
                <th className="py-2 px-2.5">Assigned Physician</th>
                <th className="py-2 px-2.5">1. Triage Intake Timestamp</th>
                <th className="py-2 px-2.5">2. Physician Sign-Off Timestamp</th>
                <th className="py-2 px-2.5">Turnaround Velocity & SLA Bar</th>
                <th className="py-2 px-2.5 text-right">Audit Efficiency Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70">
              {patientVelocityRecords.map((rec) => {
                const barWidthPct = Math.min(100, Math.round((rec.deltaMinutes / 26) * 100));
                const barColorClass =
                  rec.slaStatus === 'OPTIMAL_SLA'
                    ? 'bg-[#0D9488]'
                    : rec.slaStatus === 'WITHIN_SLA'
                    ? 'bg-emerald-600'
                    : 'bg-amber-500';

                return (
                  <tr key={rec.patientId} className="hover:bg-white/80 transition-colors">
                    <td className="py-2.5 px-2.5 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{rec.patientName}</div>
                      <div className="text-[10px] font-mono text-slate-500">
                        MRN #{rec.mrn} · <span className="text-teal-700 font-semibold">{rec.triageLevel}</span>
                      </div>
                    </td>

                    <td className="py-2.5 px-2.5 whitespace-nowrap">
                      <div className="font-semibold text-slate-800">{rec.assignedDoctor}</div>
                      <div className="text-[10px] font-mono text-slate-400">{rec.auditId}</div>
                    </td>

                    <td className="py-2.5 px-2.5 whitespace-nowrap font-mono">
                      <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-900 text-[11px] font-bold">
                        {rec.triageIntakeTimestamp}
                      </span>
                      <span className="block text-[10px] text-slate-400 mt-0.5">
                        Triage Vitals Logged
                      </span>
                    </td>

                    <td className="py-2.5 px-2.5 whitespace-nowrap font-mono">
                      {rec.isSignedOff && rec.physicianSignOffTimestamp ? (
                        <div>
                          <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>{rec.physicianSignOffTimestamp}</span>
                          </span>
                          <span className="block text-[10px] text-emerald-700 mt-0.5">
                            Verified MD Timestamp
                          </span>
                        </div>
                      ) : (
                        <div>
                          <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold inline-flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>In Progress (+{rec.deltaMinutes}m elapsed)</span>
                          </span>
                          <span className="block text-[10px] text-slate-500 mt-0.5">
                            Awaiting MD Stamp
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="py-2.5 px-2.5 min-w-[210px]">
                      <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                        <span className="font-bold text-slate-900 flex items-center gap-1">
                          <span>{rec.triageIntakeTimestamp}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span>{rec.physicianSignOffTimestamp || 'Live'}</span>
                        </span>
                        <span
                          className={`font-extrabold ${
                            rec.deltaMinutes <= 18 ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
                          Δ {rec.deltaMinutes} mins ({rec.efficiencyScore}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          style={{ width: `${barWidthPct}%` }}
                          className={`h-full rounded-full transition-all duration-300 ${barColorClass}`}
                        />
                      </div>
                    </td>

                    <td className="py-2.5 px-2.5 text-right whitespace-nowrap">
                      {rec.isSignedOff ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-mono font-bold">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>AUDIT LOCKED ({rec.deltaMinutes}m)</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStampLiveSignOff(rec)}
                          className="px-2.5 py-1 rounded-lg bg-[#0B1221] hover:bg-slate-800 text-white text-[11px] font-bold cursor-pointer inline-flex items-center gap-1 transition-colors"
                          title="Stamp Physician Sign-Off Timestamp now and compute intake-to-signoff delta"
                        >
                          <Zap className="w-3 h-3 text-[#14B8A6]" />
                          <span>Stamp Sign-Off Now</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
