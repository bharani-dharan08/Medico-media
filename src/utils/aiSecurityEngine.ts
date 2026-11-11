// AI Security, PIM/PAM & Supply Chain Defense Engine for MEDICO-MEDIA

export interface PromptFirewallResult {
  originalPrompt: string;
  sanitizedPrompt: string;
  piiMaskedPrompt: string;
  isBlocked: boolean;
  threatScore: number; // 0 - 100
  severity: 'SAFE' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  detectedVectors: {
    category: 'System Override' | 'Jailbreak Roleplay' | 'Exfiltration Probe' | 'SQL/FHIR Injection' | 'Obfuscated Payload';
    pattern: string;
    description: string;
  }[];
  maskedEntities: {
    type: 'PATIENT_NAME' | 'MRN' | 'PHONE' | 'EMAIL' | 'NATIONAL_ID' | 'DOB';
    original: string;
    token: string;
  }[];
  latencyMs: number;
}

export interface PoisoningDatasetScan {
  id: string;
  datasetName: string;
  domain: string;
  samplesCount: number;
  klDivergenceDrift: number; // e.g., 0.012 normal, >0.15 anomalous
  backdoorSignatures: number;
  labelFlipRate: number; // percentage
  integrityHash: string;
  status: 'VERIFIED_CLEAN' | 'ANOMALOUS_SHIFT' | 'QUARANTINED_BACKDOOR';
  lastScanned: string;
}

export interface ModelWeightAsset {
  id: string;
  modelName: string;
  architecture: string;
  sizeGb: number;
  sha256Fingerprint: string;
  registryLocation: string;
  egressRateLimitMbps: number;
  downloadAttempts24h: number;
  blockedExfiltrations: number;
  protectionStatus: 'CRYPTO_LOCKED' | 'EGRESS_THROTTLED' | 'ALERT_ACTIVE';
}

export interface JitAccessRequest {
  id: string;
  requesterName: string;
  requesterRole: string;
  targetResource: string;
  accessScope: 'Modify Production Weights' | 'Raw Training Data Read' | 'RLHF Checkpoint Promotion' | 'Tokenizer Config Override';
  justification: string;
  durationMinutes: number;
  remainingMinutes: number;
  mfaVerified: boolean;
  pimApprovalTicket: string;
  status: 'ACTIVE_GRANTED' | 'PENDING_APPROVAL' | 'EXPIRED_REVOKED';
}

export interface ApiKeyGuardRecord {
  id: string;
  provider: 'Gemini Clinical Endpoint' | 'OpenAI Enterprise Fallback' | 'HuggingFace Private Hub' | 'Internal FHIR Vector DB';
  keyPrefix: string;
  entropyBits: number;
  rotationIntervalDays: number;
  daysSinceRotation: number;
  repoSweepStatus: 'CLEAN_0_LEAKS' | 'ROTATION_DUE' | 'HARDCODED_LEAK_BLOCKED';
  lastRotatedAt: string;
  endpointUrl: string;
}

export interface AttributedModelAuditEntry {
  id: string;
  timestamp: string;
  actorName: string;
  actorBadgeId: string;
  actionType: 'LoRA Fine-Tuning Run' | 'Weight Registry Promotion' | 'System Prompt Guardrail Update' | 'Temperature/Top-P Config Tweak';
  targetModel: string;
  commitSignature: string;
  prevChainHash: string;
  parameterDiff: string;
  verifiedSignature: boolean;
}

export interface ShadowAiEndpoint {
  id: string;
  detectedProcessOrHost: string;
  department: string;
  workstationIp: string;
  destinationEndpoint: string;
  modelSignature: string;
  egressPayloadsCount: number;
  piiExposureRisk: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  policyAction: 'BLOCKED_AT_GATEWAY' | 'ISOLATED_HOST' | 'UNDER_REVIEW' | 'SANCTIONED';
  lastSeen: string;
}

export interface AiPackageVulnerability {
  id: string;
  packageName: string;
  currentVersion: string;
  fixedVersion: string;
  layerType: 'AI Framework' | 'Container Base Image' | 'Inference Engine' | 'Python Dependency';
  cveId: string;
  cvssScore: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  exploitability: string;
  status: 'UNPATCHED' | 'PATCHED' | 'MITIGATED';
}

// Deterministic hash generator for tokenizing PII
function shortDeterministicHash(input: string): string {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).toUpperCase().padStart(6, '0').slice(0, 6);
}

/**
 * 1. Real-Time Prompt Injection & Jailbreak Firewall + Inline PII & Data Masking Gateway
 */
export function evaluatePromptAndMaskPii(
  rawInput: string,
  knownPatientNames: string[] = ['Eleanor Vance', 'Marcus Thorne', 'Elena Rostova', 'Julian Vance', 'Vikramaditya Singh']
): PromptFirewallResult {
  const detectedVectors: PromptFirewallResult['detectedVectors'] = [];
  let sanitizedPrompt = rawInput;

  const rules: {
    regex: RegExp;
    category: PromptFirewallResult['detectedVectors'][0]['category'];
    pattern: string;
    description: string;
    weight: number;
  }[] = [
    {
      regex: /ignore\s+(all\s+)?(previous|prior|above|system)\s+(instructions|prompts|rules|guardrails)/gi,
      category: 'System Override',
      pattern: 'IGNORE_PRIOR_INSTRUCTIONS',
      description: 'Direct attempt to nullify foundational clinical system instructions and safety constraints.',
      weight: 55,
    },
    {
      regex: /(you\s+are\s+now\s+DAN|do\s+anything\s+now|developer\s+mode\s+enabled|unrestricted\s+mode|jailbreak)/gi,
      category: 'Jailbreak Roleplay',
      pattern: 'DAN_PERSONA_ESCALATION',
      description: 'Persona hijack attempting to bypass medical ethical guardrails via unrestricted roleplay.',
      weight: 60,
    },
    {
      regex: /(print|output|reveal|dump|export|repeat)\s+(your\s+)?(system\s+prompt|model\s+weights|hidden\s+instructions|api\s+key|training\s+data)/gi,
      category: 'Exfiltration Probe',
      pattern: 'SYSTEM_CONTEXT_EXTRACTION',
      description: 'Probe attempting to exfiltrate system prompt instructions, API credentials, or model weights.',
      weight: 50,
    },
    {
      regex: /(DROP\s+TABLE|UNION\s+SELECT|;\s*DELETE\s+FROM|--\s*admin|\$where|\{\s*"\$gt"\s*:)/gi,
      category: 'SQL/FHIR Injection',
      pattern: 'DOWNSTREAM_QUERY_INJECTION',
      description: 'Embedded SQL/NoSQL/FHIR query payload attempting to manipulate downstream clinical database queries.',
      weight: 65,
    },
    {
      regex: /(base64\s+decode|eval\s*\(|<script[\s>]|javascript:|\\x[0-9a-fA-F]{2}){1,}/gi,
      category: 'Obfuscated Payload',
      pattern: 'ENCODED_SHELL_OR_XSS',
      description: 'Obfuscated encoding or script payload designed to evade lexical security filters.',
      weight: 45,
    },
  ];

  let score = 4; // baseline nominal noise
  for (const rule of rules) {
    if (rule.regex.test(rawInput)) {
      detectedVectors.push({
        category: rule.category,
        pattern: rule.pattern,
        description: rule.description,
      });
      score += rule.weight;
      sanitizedPrompt = sanitizedPrompt.replace(rule.regex, `[FIREWALL_REDACTED:${rule.pattern}]`);
    }
  }

  const threatScore = Math.min(100, score);
  const isBlocked = threatScore >= 45;
  const severity: PromptFirewallResult['severity'] =
    threatScore >= 75 ? 'CRITICAL' : threatScore >= 45 ? 'HIGH' : threatScore >= 20 ? 'MODERATE' : 'SAFE';

  // Inline PII & PHI Masking Gateway
  let piiMaskedPrompt = sanitizedPrompt;
  const maskedEntities: PromptFirewallResult['maskedEntities'] = [];

  // Mask known patient names
  for (const name of knownPatientNames) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const nameRegex = new RegExp(`\\b${escaped}\\b`, 'gi');
    if (nameRegex.test(piiMaskedPrompt)) {
      const token = `[TOKEN_PT_${shortDeterministicHash(name.toLowerCase())}]`;
      maskedEntities.push({ type: 'PATIENT_NAME', original: name, token });
      piiMaskedPrompt = piiMaskedPrompt.replace(nameRegex, token);
    }
  }

  // Mask MRN patterns (#482-9104, MRN-12345, etc.)
  const mrnRegex = /(#\d{3}-\d{4}|\bMRN[-:\s]?\d{3,8}\b)/gi;
  const mrnMatches = piiMaskedPrompt.match(mrnRegex) || [];
  for (const match of Array.from(new Set(mrnMatches))) {
    const token = `[TOKEN_MRN_${shortDeterministicHash(match)}]`;
    maskedEntities.push({ type: 'MRN', original: match, token });
    piiMaskedPrompt = piiMaskedPrompt.split(match).join(token);
  }

  // Mask Aadhaar / SSN / National ID (e.g. 1234-5678-9012 or 123-45-6789)
  const idRegex = /\b(\d{4}[-\s]\d{4}[-\s]\d{4}|\d{3}-\d{2}-\d{4})\b/g;
  const idMatches = piiMaskedPrompt.match(idRegex) || [];
  for (const match of Array.from(new Set(idMatches))) {
    const token = `[TOKEN_GOVID_${shortDeterministicHash(match)}]`;
    maskedEntities.push({ type: 'NATIONAL_ID', original: match, token });
    piiMaskedPrompt = piiMaskedPrompt.split(match).join(token);
  }

  // Mask Phone Numbers (+91 98765 43210, 555-123-4567, etc.)
  const phoneRegex = /(\+\d{1,3}[-\s]?)?\b\d{3,5}[-\s]\d{3,5}([0-9-\s]{2,5})?\b/g;
  const phoneMatches = piiMaskedPrompt.match(phoneRegex) || [];
  for (const match of Array.from(new Set(phoneMatches))) {
    if (match.replace(/\D/g, '').length >= 10) {
      const token = `[TOKEN_TEL_${shortDeterministicHash(match)}]`;
      maskedEntities.push({ type: 'PHONE', original: match, token });
      piiMaskedPrompt = piiMaskedPrompt.split(match).join(token);
    }
  }

  // Mask Emails
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
  const emailMatches = piiMaskedPrompt.match(emailRegex) || [];
  for (const match of Array.from(new Set(emailMatches))) {
    const token = `[TOKEN_MAIL_${shortDeterministicHash(match)}]`;
    maskedEntities.push({ type: 'EMAIL', original: match, token });
    piiMaskedPrompt = piiMaskedPrompt.split(match).join(token);
  }

  // Mask Dates of Birth (DOB: YYYY-MM-DD or DD/MM/YYYY)
  const dobRegex = /\b(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})\b/g;
  const dobMatches = piiMaskedPrompt.match(dobRegex) || [];
  for (const match of Array.from(new Set(dobMatches))) {
    const token = `[TOKEN_DOB_${shortDeterministicHash(match)}]`;
    maskedEntities.push({ type: 'DOB', original: match, token });
    piiMaskedPrompt = piiMaskedPrompt.split(match).join(token);
  }

  return {
    originalPrompt: rawInput,
    sanitizedPrompt,
    piiMaskedPrompt,
    isBlocked,
    threatScore,
    severity,
    detectedVectors,
    maskedEntities,
    latencyMs: 6 + (rawInput.length % 7),
  };
}

// Initial Telemetry Datasets for all 3 Pillars

export const INITIAL_POISONING_SCANS: PoisoningDatasetScan[] = [
  {
    id: 'ds-01',
    datasetName: 'Cardio-Telemetry-Corpus-2026Q1',
    domain: 'Cardiology ICU Waveform & Troponin Notes',
    samplesCount: 148200,
    klDivergenceDrift: 0.014,
    backdoorSignatures: 0,
    labelFlipRate: 0.02,
    integrityHash: 'sha256:9f84c2b1e77d...4a91',
    status: 'VERIFIED_CLEAN',
    lastScanned: '04m ago',
  },
  {
    id: 'ds-02',
    datasetName: 'Sepsis-EarlyWarning-RLHF-v3',
    domain: 'Emergency Triage & Lactate Trajectory',
    samplesCount: 64500,
    klDivergenceDrift: 0.284,
    backdoorSignatures: 3,
    labelFlipRate: 4.18,
    integrityHash: 'sha256:3c19a0f8b21e...88e0',
    status: 'QUARANTINED_BACKDOOR',
    lastScanned: '11m ago',
  },
  {
    id: 'ds-03',
    datasetName: 'Nephro-Dialysis-Dosing-Set',
    domain: 'Renal Function & eGFR Longitudinal Records',
    samplesCount: 91400,
    klDivergenceDrift: 0.089,
    backdoorSignatures: 0,
    labelFlipRate: 0.94,
    integrityHash: 'sha256:7d55e11c094a...12f4',
    status: 'ANOMALOUS_SHIFT',
    lastScanned: '19m ago',
  },
  {
    id: 'ds-04',
    datasetName: 'Radiology-DICOM-Caption-Base',
    domain: 'Thoracic CT & Pulmonary Embolism Findings',
    samplesCount: 215000,
    klDivergenceDrift: 0.011,
    backdoorSignatures: 0,
    labelFlipRate: 0.01,
    integrityHash: 'sha256:e41b87d33f10...9c22',
    status: 'VERIFIED_CLEAN',
    lastScanned: '26m ago',
  },
];

export const INITIAL_MODEL_WEIGHTS: ModelWeightAsset[] = [
  {
    id: 'mw-01',
    modelName: 'MedVision-Clinical-7B-v2.4.safetensors',
    architecture: 'Transformer-7B (FP16 Signed)',
    sizeGb: 14.2,
    sha256Fingerprint: '8a4e91f0c2...d173b90e',
    registryLocation: 'kms://india-south1/medico-vault-prod',
    egressRateLimitMbps: 25,
    downloadAttempts24h: 4,
    blockedExfiltrations: 1,
    protectionStatus: 'CRYPTO_LOCKED',
  },
  {
    id: 'mw-02',
    modelName: 'CardioRisk-LoRA-Adapter-v4.bin',
    architecture: 'Low-Rank Adapter (Rank-64)',
    sizeGb: 0.64,
    sha256Fingerprint: '2f9c04e18b...a9024c11',
    registryLocation: 'kms://india-south1/medico-vault-prod',
    egressRateLimitMbps: 15,
    downloadAttempts24h: 9,
    blockedExfiltrations: 2,
    protectionStatus: 'EGRESS_THROTTLED',
  },
  {
    id: 'mw-03',
    modelName: 'DICOM-DenseNet-Oncology-v1.9.onnx',
    architecture: '3D-ConvNet Vision Backbone',
    sizeGb: 4.85,
    sha256Fingerprint: '5c81d77a3f...60e12b44',
    registryLocation: 'kms://india-south1/medico-imaging-enclave',
    egressRateLimitMbps: 20,
    downloadAttempts24h: 2,
    blockedExfiltrations: 0,
    protectionStatus: 'CRYPTO_LOCKED',
  },
];

export const INITIAL_JIT_ACCESS_REQUESTS: JitAccessRequest[] = [
  {
    id: 'PIM-9401',
    requesterName: 'Dr. Vikram Nair (MLOps Lead)',
    requesterRole: 'Principal Clinical AI Architect',
    targetResource: 'MedVision-Clinical-7B-v2.4.safetensors',
    accessScope: 'RLHF Checkpoint Promotion',
    justification: 'Promote validated Q1 Cardiology Troponin calibration checkpoint after IRB sign-off.',
    durationMinutes: 45,
    remainingMinutes: 28,
    mfaVerified: true,
    pimApprovalTicket: 'CAB-IND-8821',
    status: 'ACTIVE_GRANTED',
  },
  {
    id: 'PIM-9402',
    requesterName: 'Ananya Deshmukh (Data Eng)',
    requesterRole: 'Senior Clinical NLP Engineer',
    targetResource: 'Sepsis-EarlyWarning-RLHF-v3 Corpus',
    accessScope: 'Raw Training Data Read',
    justification: 'Forensic inspection of quarantined backdoor trigger tokens in batch #409.',
    durationMinutes: 60,
    remainingMinutes: 60,
    mfaVerified: true,
    pimApprovalTicket: 'SEC-INC-4109',
    status: 'PENDING_APPROVAL',
  },
  {
    id: 'PIM-9403',
    requesterName: 'Rohan Kulkarni (DevSecOps)',
    requesterRole: 'AI Infrastructure Engineer',
    targetResource: 'CardioRisk-LoRA-Adapter-v4.bin',
    accessScope: 'Modify Production Weights',
    justification: 'Emergency weight rollback test for ICU telemetry latency optimization.',
    durationMinutes: 30,
    remainingMinutes: 30,
    mfaVerified: true,
    pimApprovalTicket: 'OPS-CHG-1194',
    status: 'PENDING_APPROVAL',
  },
  {
    id: 'PIM-9398',
    requesterName: 'Dr. Sarah Chen (Chief Medical Officer)',
    requesterRole: 'Clinical Governance Approver',
    targetResource: 'Inline PII Tokenizer Ruleset v3',
    accessScope: 'Tokenizer Config Override',
    justification: 'Added ABHA Health ID regex masking rule to clinical prompt gateway.',
    durationMinutes: 30,
    remainingMinutes: 0,
    mfaVerified: true,
    pimApprovalTicket: 'GOV-AUD-7730',
    status: 'EXPIRED_REVOKED',
  },
];

export const INITIAL_API_KEYS: ApiKeyGuardRecord[] = [
  {
    id: 'key-01',
    provider: 'Gemini Clinical Endpoint',
    keyPrefix: 'AIzaSyD9...8f2Q',
    entropyBits: 256,
    rotationIntervalDays: 30,
    daysSinceRotation: 6,
    repoSweepStatus: 'CLEAN_0_LEAKS',
    lastRotatedAt: '2026-03-30 08:15 UTC',
    endpointUrl: 'https://generativelanguage.googleapis.com/v1beta',
  },
  {
    id: 'key-02',
    provider: 'HuggingFace Private Hub',
    keyPrefix: 'hf_MedV...91xK',
    entropyBits: 248,
    rotationIntervalDays: 14,
    daysSinceRotation: 13,
    repoSweepStatus: 'ROTATION_DUE',
    lastRotatedAt: '2026-03-23 14:20 UTC',
    endpointUrl: 'https://huggingface.co/api/medico-media-private',
  },
  {
    id: 'key-03',
    provider: 'OpenAI Enterprise Fallback',
    keyPrefix: 'sk-proj...44mP',
    entropyBits: 252,
    rotationIntervalDays: 14,
    daysSinceRotation: 2,
    repoSweepStatus: 'HARDCODED_LEAK_BLOCKED',
    lastRotatedAt: '2026-04-03 19:02 UTC',
    endpointUrl: 'https://api.openai.com/v1/chat/completions',
  },
  {
    id: 'key-04',
    provider: 'Internal FHIR Vector DB',
    keyPrefix: 'med_vec...77zR',
    entropyBits: 256,
    rotationIntervalDays: 7,
    daysSinceRotation: 3,
    repoSweepStatus: 'CLEAN_0_LEAKS',
    lastRotatedAt: '2026-04-02 11:40 UTC',
    endpointUrl: 'https://vector.medico-media.internal:8443',
  },
];

export const INITIAL_ATTRIBUTED_AUDIT_LOG: AttributedModelAuditEntry[] = [
  {
    id: 'AUD-8824',
    timestamp: '2026-04-05 15:42:18 UTC',
    actorName: 'Dr. Vikram Nair',
    actorBadgeId: 'PIM-ID-0419',
    actionType: 'LoRA Fine-Tuning Run',
    targetModel: 'CardioRisk-LoRA-Adapter-v4.bin',
    commitSignature: 'sig_ed25519:4f9a82c1...77e0',
    prevChainHash: '0x71c9...38a2',
    parameterDiff: 'lr: 2e-4 -> 1.5e-4, epochs: 3, dataset: Cardio-Telemetry-Corpus-2026Q1',
    verifiedSignature: true,
  },
  {
    id: 'AUD-8823',
    timestamp: '2026-04-05 14:19:05 UTC',
    actorName: 'Dr. Sarah Chen',
    actorBadgeId: 'CMO-ID-0012',
    actionType: 'System Prompt Guardrail Update',
    targetModel: 'MedVision-Clinical-7B-v2.4',
    commitSignature: 'sig_ed25519:9c31b04e...12a8',
    prevChainHash: '0x49e1...90f4',
    parameterDiff: 'enforce_pii_tokenization=TRUE, max_diagnostic_certainty_cap=0.92',
    verifiedSignature: true,
  },
  {
    id: 'AUD-8822',
    timestamp: '2026-04-05 11:08:44 UTC',
    actorName: 'Ananya Deshmukh',
    actorBadgeId: 'NLP-ID-0883',
    actionType: 'Temperature/Top-P Config Tweak',
    targetModel: 'SOAP-Summarizer-Gateway-v2',
    commitSignature: 'sig_ed25519:1d77e59a...84b1',
    prevChainHash: '0x82b0...11c7',
    parameterDiff: 'temperature: 0.35 -> 0.10, top_p: 0.90 -> 0.75 (deterministic clinical output)',
    verifiedSignature: true,
  },
  {
    id: 'AUD-8821',
    timestamp: '2026-04-04 22:51:12 UTC',
    actorName: 'Rohan Kulkarni',
    actorBadgeId: 'SEC-ID-0310',
    actionType: 'Weight Registry Promotion',
    targetModel: 'DICOM-DenseNet-Oncology-v1.9.onnx',
    commitSignature: 'sig_ed25519:6e20f11c...59d3',
    prevChainHash: '0x15f4...62d9',
    parameterDiff: 'promoted stagingdigest sha256:5c81d77a3f to kms://medico-imaging-enclave',
    verifiedSignature: true,
  },
];

export const INITIAL_SHADOW_AI_ENDPOINTS: ShadowAiEndpoint[] = [
  {
    id: 'shw-01',
    detectedProcessOrHost: 'Workstation-Rad-09 (Local Ollama Daemon)',
    department: 'Radiology West Wing',
    workstationIp: '10.42.18.109:11434',
    destinationEndpoint: 'http://localhost:11434/api/generate',
    modelSignature: 'llama-3-8b-instruct-uncensored.gguf (Unapproved)',
    egressPayloadsCount: 37,
    piiExposureRisk: 'CRITICAL',
    policyAction: 'UNDER_REVIEW',
    lastSeen: '02m ago',
  },
  {
    id: 'shw-02',
    detectedProcessOrHost: 'Chrome Extension: "QuickMed-Summarize-Free"',
    department: 'Outpatient Triage Desk 4',
    workstationIp: '10.42.12.044:443',
    destinationEndpoint: 'https://api.unverified-llm-proxy.io/v1/chat',
    modelSignature: 'External Unsanctioned Commercial LLM API',
    egressPayloadsCount: 14,
    piiExposureRisk: 'CRITICAL',
    policyAction: 'BLOCKED_AT_GATEWAY',
    lastSeen: '09m ago',
  },
  {
    id: 'shw-03',
    detectedProcessOrHost: 'JupyterLab Pod #7 (Research Sandbox)',
    department: 'Biomedical Data Science Lab',
    workstationIp: '10.42.90.211:8888',
    destinationEndpoint: 'https://api.deepseek.com/v1/completions',
    modelSignature: 'DeepSeek-V3 External Endpoint (Unsanctioned)',
    egressPayloadsCount: 8,
    piiExposureRisk: 'HIGH',
    policyAction: 'UNDER_REVIEW',
    lastSeen: '16m ago',
  },
  {
    id: 'shw-04',
    detectedProcessOrHost: 'MEDICO-MEDIA Clinical Gateway (Prod)',
    department: 'Hospital Operations Core',
    workstationIp: '10.42.01.010:443',
    destinationEndpoint: 'https://generativelanguage.googleapis.com/v1beta',
    modelSignature: 'Gemini Enterprise Clinical Enclave (PII-Masked)',
    egressPayloadsCount: 1420,
    piiExposureRisk: 'LOW',
    policyAction: 'SANCTIONED',
    lastSeen: 'Live',
  },
];

export const INITIAL_SCA_VULNERABILITIES: AiPackageVulnerability[] = [
  {
    id: 'sca-01',
    packageName: 'torch (PyTorch Distributed RPC)',
    currentVersion: '2.4.0+cu121',
    fixedVersion: '2.5.1+cu124',
    layerType: 'AI Framework',
    cveId: 'CVE-2024-5480',
    cvssScore: 9.8,
    severity: 'CRITICAL',
    exploitability: 'Remote Code Execution via untrusted pickle/torch.load deserialization in distributed eval.',
    status: 'UNPATCHED',
  },
  {
    id: 'sca-02',
    packageName: 'vllm (Inference Serving Engine)',
    currentVersion: '0.6.1',
    fixedVersion: '0.6.4.post1',
    layerType: 'Inference Engine',
    cveId: 'CVE-2024-9052',
    cvssScore: 8.4,
    severity: 'HIGH',
    exploitability: 'KV-Cache cross-request memory bleed under malformed multi-tenant batching.',
    status: 'UNPATCHED',
  },
  {
    id: 'sca-03',
    packageName: 'tensorflow-cpu',
    currentVersion: '2.16.1',
    fixedVersion: '2.17.1',
    layerType: 'AI Framework',
    cveId: 'CVE-2024-3660',
    cvssScore: 8.8,
    severity: 'HIGH',
    exploitability: 'Arbitrary code execution when loading SavedModel/Keras archives with Lambda layers.',
    status: 'MITIGATED',
  },
  {
    id: 'sca-04',
    packageName: 'nvidia/cuda:12.2.0-runtime-ubuntu22.04',
    currentVersion: '12.2.0-base',
    fixedVersion: '12.4.1-patched',
    layerType: 'Container Base Image',
    cveId: 'CVE-2024-0132',
    cvssScore: 7.8,
    severity: 'HIGH',
    exploitability: 'NVIDIA Container Toolkit privilege escalation via crafted OCI image mount.',
    status: 'UNPATCHED',
  },
  {
    id: 'sca-05',
    packageName: 'transformers (HuggingFace)',
    currentVersion: '4.43.2',
    fixedVersion: '4.46.3',
    layerType: 'Python Dependency',
    cveId: 'CVE-2024-11392',
    cvssScore: 7.5,
    severity: 'HIGH',
    exploitability: 'Unsafe deserialization in custom tokenizer / checkpoint conversion scripts.',
    status: 'PATCHED',
  },
];

export const FIREWALL_TELEMETRY_SERIES = [
  { time: '08:00', cleanPrompts: 310, piiScrubbed: 142, blockedInjections: 4 },
  { time: '10:00', cleanPrompts: 485, piiScrubbed: 218, blockedInjections: 9 },
  { time: '12:00', cleanPrompts: 612, piiScrubbed: 294, blockedInjections: 14 },
  { time: '14:00', cleanPrompts: 540, piiScrubbed: 265, blockedInjections: 19 },
  { time: '16:00', cleanPrompts: 690, piiScrubbed: 340, blockedInjections: 11 },
  { time: '18:00', cleanPrompts: 420, piiScrubbed: 198, blockedInjections: 6 },
];
