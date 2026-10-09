export type Role = 
  | 'Submitter'
  | 'Rules Steward'
  | 'Clause Curator'
  | 'SME Reviewer'
  | 'Approver'
  | 'Platform Auditor';

export type CaseStatus = 
  | 'Draft'
  | 'Ingested'
  | 'Analyzing'
  | 'Analyzed'
  | 'In review'
  | 'IN_REVIEW'
  | 'Pending approval'
  | 'FLAGGED'
  | 'APPROVED'
  | 'Ratified'
  | 'Reported'
  | 'Learning captured';

export type RiskBand = 'Low' | 'Moderate' | 'High' | 'Critical' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type Severity = 'Low' | 'Medium' | 'High' | 'Critical' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface FindingItem {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: Severity;
  probability: number;
  exposure: number;
  expectedLoss: number;
  description: string;
  remediation: string;
}

export interface CaseItem {
  id: string;
  documentId: string;
  documentType: string;
  vendorName: string;
  submissionDate: string;
  claimValue: number;
  currency: string;
  status: CaseStatus;
  assignedAnalyst: string;
  overallScore: number;
  expectedLoss: number;
  riskCategory: RiskBand;
  hasCriticalGap: boolean;
  findings: FindingItem[];
  metadata: Record<string, any>;
  lineageId: string;
}

export interface PatternRule {
  id: string;
  name: string;
  category: string;
  regexPattern: string;
  confidenceThreshold: number;
  sampleMatches: string[];
  status: 'ACTIVE' | 'DEPRECATED' | 'DRAFT';
}

export interface ValidationRule {
  id: string;
  code: string;
  name: string;
  description: string;
  severity: Severity;
  enabled: boolean;
  weight: number;
  thresholdScore: number;
  actionOnFailure: 'BLOCK' | 'FLAG' | 'ESCALATE' | 'LOG';
}

export interface ScoringResult {
  caseScore: number;
  totalExpectedLoss: number;
  hasCriticalGap: boolean;
  recommendedAction: 'AUTO_APPROVE' | 'MANUAL_REVIEW' | 'REJECT' | 'ESCALATE_EXECUTIVE';
  requiresTier: 'T1' | 'T2' | 'T3';
  riskCategory: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface LineageNode {
  id: string;
  label: string;
  type: 'INPUT' | 'PROCESS' | 'OUTPUT';
  status: 'PASSED' | 'FAILED' | 'WARNING';
  details: string;
  dependencies?: string[];
}

export interface LearningFeedback {
  id: string;
  caseId: string;
  findingId: string;
  auditorName: string;
  originalScore: number;
  adjustedScore: number;
  auditorDecision: string;
  reasonCode: string;
  comment: string;
  timestamp: string;
  learningStatus: string;
}

export interface ExecutiveMetric {
  label: string;
  value: string;
  trend: string;
  status: 'POSITIVE' | 'NEUTRAL' | 'WARNING';
}

export interface DocumentFile {
  id: string;
  name: string;
  type: 'Charter Party' | 'Bill of Lading' | 'Fixture Recap' | 'Rider Clause' | 'Engagement Letter' | 'Addendum';
  fileUri: string;
  sha256: string;
  ocrQuality: number;
  pages: number;
  precedenceOrder: number;
  uploadedAt: string;
}

export interface ExtractedField {
  id: string;
  name: string;
  value: string;
  confidence: number;
  editedBy?: string;
}

export interface ClauseSpan {
  start: number;
  end: number;
  page: number;
}

export interface DocumentClause {
  id: string;
  docId: string;
  number: string;
  heading: string;
  text: string;
  span: ClauseSpan;
  category: string;
  amendsClauseId?: string;
}

export interface ComplianceRule {
  id: string;
  version: string;
  title: string;
  sourceRef: string;
  domain: 'Sanctions' | 'Environmental' | 'Safety' | 'Cargo Liability' | 'Commercial' | 'Insurance';
  jurisdiction: string;
  severity: Severity;
  logicDescription: string;
  modelClause: string;
  validFrom: string;
  validTo?: string;
  status: 'Draft' | 'Active' | 'Superseded' | 'Retired';
}

export interface ClausePattern {
  id: string;
  version: string;
  category: string;
  canonicalText: string;
  disputeRate: number;
  successRate: number;
  impactBand: RiskBand;
  medianImpactUsd: number;
  confidence: number;
  kAnonymityLevel: number;
  status: 'Candidate' | 'Active' | 'Deprecated';
}

export interface Finding {
  id: string;
  runId: string;
  clauseId: string;
  docId: string;
  type: 'Compliance gap' | 'Conflict' | 'Weak safeguard' | 'Safeguard opportunity' | 'Best practice';
  status: 'Open' | 'Accepted' | 'Rejected' | 'Modified' | 'Needs review';
  ruleIds: string[];
  patternIds: string[];
  severity: Severity;
  probability: number;
  exposureUsd: { low: number; likely: number; high: number };
  findingScore: number;
  confidence: number;
  recommendationAction: 'add' | 'amend' | 'delete' | 'negotiate' | 'accept_with_mitigation';
  proposedText: string;
  rationale: string;
  estimatedEffort: number;
  smeComment?: string;
}

export interface WhatIfScenario {
  id: string;
  name: string;
  changes: Record<string, { newText?: string; modifiedExposureUsd?: number; acceptedWithMitigation?: boolean }>;
  caseScore: number;
  expectedLossUsd: number;
  createdBy: string;
  createdAt: string;
}

export interface RatificationDecision {
  id: string;
  caseId: string;
  scenarioId: string;
  version: string;
  tier: 'T1 Standard' | 'T2 Elevated' | 'T3 Critical';
  status: 'Pending' | 'Ratified' | 'Returned' | 'Rejected';
  note: string;
  approverLevel1?: string;
  approverLevel2?: string;
  ratifiedAt?: string;
  snapshotHash?: string;
}

export interface LineageEvent {
  id: string;
  prevHash: string;
  hash: string;
  actor: string;
  role: Role;
  action: string;
  objectRef: string;
  diff: string;
  timestamp: string;
}

export interface LearningPackage {
  id: string;
  sourceDecisionId: string;
  clauseCategory: string;
  anonymizedPayload: string;
  privacyCheckPassed: boolean;
  kLevelAchieved: number;
  proposedPatternId?: string;
  curatorAction: 'Pending' | 'Approved' | 'Merged' | 'Rejected';
}

export interface GeneratedReport {
  id: string;
  decisionId: string;
  type: 'Executive Summary' | 'Detailed Audit Report' | 'DOCX Redline Pack';
  createdAt: string;
  fileUri: string;
  redacted: boolean;
  shareUrl?: string;
}

export interface CaseData {
  id: string;
  title: string;
  trade: string;
  charterType: 'Voyage Charter' | 'Time Charter' | 'Bareboat Charter' | 'COA';
  effectiveDate: string;
  status: CaseStatus;
  riskScore: number;
  riskBand: RiskBand;
  owner: string;
  documents: DocumentFile[];
  extractedFields: ExtractedField[];
  clauses: DocumentClause[];
  findings: Finding[];
  scenarios: WhatIfScenario[];
  decision?: RatificationDecision;
}
