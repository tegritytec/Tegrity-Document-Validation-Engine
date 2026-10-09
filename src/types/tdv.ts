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

// Anonymized Historical Case for What-If Scenarios
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
  vatStrictnessWeight: number; // 0.5x to 2.0x
  rateTolerancePct: number; // 0% to 10%
  aisMismatchStrictness: number; // 1.0x to 3.0x
  sanctionsFuzzyThreshold: number; // 70% to 95%
  autoApproveScoreFloor: number; // 80 to 95
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
  netLossDelta: number; // Positive = savings, negative = increased exposure
  recommendedWeightUpdates: { ruleId: string; recommendedWeight: number; rationale: string }[];
}
