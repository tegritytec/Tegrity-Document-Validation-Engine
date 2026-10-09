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
  | 'REJECTED'
  | 'PUBLISHED_TO_VOYAGE'
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

export interface AnonymizedHistoricalCase {
  anonymizedId: string;
  documentType: string;
  sector: 'Maritime & Freight' | 'Energy & Utilities' | 'Manufacturing' | 'Technology & Services';
  claimValue: number;
  currency: string;
  originalRiskScore: number;
  originalExpectedLoss: number;
  vatStatus: 'VALID' | 'REVOKED' | 'EXPIRED' | 'UNCHECKED';
  rateDiscrepancyPct: number;
  aisLocationMismatch: boolean;
  sanctionsMatchRatio: number;
  historicalOutcome: 'APPROVED' | 'REJECTED' | 'ESCALATED';
}

export interface HistoricalFilter {
  sector: string;
  documentType: string;
  minValue: number;
  maxValue: number;
  riskBand: string;
}

export interface WhatIfScenarioParams {
  name: string;
  vatStrictnessWeight: number;
  rateTolerancePct: number;
  aisMismatchStrictness: number;
  sanctionsFuzzyThreshold: number;
  autoApproveScoreFloor: number;
}

export interface ScenarioSimulationResult {
  scopedTotalCount: number;
  scopedTotalValue: number;
  baselineAutoApproveCount: number;
  baselineAutoApprovePct: number;
  baselineTotalExpectedLoss: number;
  scenarioAutoApproveCount: number;
  scenarioAutoApprovePct: number;
  scenarioTotalExpectedLoss: number;
  netLossDelta: number;
  recommendedWeightUpdates: { ruleId: string; recommendedWeight: number; rationale: string }[];
}

// Ingestion Validation Analysis Run
export interface ValidationAnalysisRun {
  runId: string;
  timestamp: string;
  documentId: string;
  riskScoreGrade: number; // 0 - 100
  riskBand: RiskBand;
  gapFindings: {
    ruleId: string;
    title: string;
    gapType: 'COMPLIANCE_GAP' | 'PATTERN_MISMATCH' | 'FINANCIAL_EXPOSURE';
    severity: Severity;
    safeguardOpportunity: string;
  }[];
  patternMatches: {
    patternId: string;
    patternName: string;
    status: 'MATCHED' | 'FAILED';
    confidence: number;
  }[];
  executionTimeMs: number;
}

export type ReportFormat = 'PPTX' | 'PDF' | 'DOCX';
export type ReportType = 'Executive Summary' | 'Detailed Audit Report';

export interface VoyagePublishResponse {
  publishId: string;
  txHash: string;
  publishedAt: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  targetSystem: 'Tegrity Voyage Management Core';
}
