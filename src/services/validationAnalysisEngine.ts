import { CaseItem, ValidationRule, PatternRule, ValidationAnalysisRun, VoyagePublishResponse } from '../types/tdv';

export function runValidationAnalysis(
  targetCase: CaseItem,
  rules: ValidationRule[],
  patterns: PatternRule[]
): ValidationAnalysisRun {
  const startTime = performance.now();

  const gapFindings: ValidationAnalysisRun['gapFindings'] = [];
  const patternMatches: ValidationAnalysisRun['patternMatches'] = [];

  // 1. Evaluate against Compliance Rules
  rules.forEach(r => {
    if (!r.enabled) return;

    // Simulate rule validation check
    const isFailed = targetCase.findings.some(f => f.ruleId === r.id) || (r.severity === 'CRITICAL' && targetCase.hasCriticalGap);

    if (isFailed) {
      gapFindings.push({
        ruleId: r.id,
        title: r.name,
        gapType: r.code.startsWith('TAX') ? 'COMPLIANCE_GAP' : r.code.startsWith('MATH') ? 'FINANCIAL_EXPOSURE' : 'COMPLIANCE_GAP',
        severity: r.severity,
        safeguardOpportunity: `Enforce ${r.name} verification clause in Rider contract. Require counterparty bank indemnity.`
      });
    }
  });

  // 2. Evaluate against Pattern Library
  patterns.forEach(p => {
    if (p.status !== 'ACTIVE') return;

    // Check pattern match against case metadata
    const isMatched = Math.random() > 0.15; // 85% match rate simulation

    patternMatches.push({
      patternId: p.id,
      patternName: p.name,
      status: isMatched ? 'MATCHED' : 'FAILED',
      confidence: isMatched ? p.confidenceThreshold : 45
    });

    if (!isMatched) {
      gapFindings.push({
        ruleId: p.id,
        title: `Pattern Mismatch: ${p.name}`,
        gapType: 'PATTERN_MISMATCH',
        severity: 'HIGH',
        safeguardOpportunity: `Standardize ${p.category} text token format against ${p.regexPattern}.`
      });
    }
  });

  const executionTimeMs = Math.round(performance.now() - startTime);

  return {
    runId: `RUN-VAL-${Date.now()}`,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    documentId: targetCase.documentId,
    riskScoreGrade: targetCase.overallScore,
    riskBand: targetCase.riskCategory,
    gapFindings,
    patternMatches,
    executionTimeMs
  };
}

export function publishToVoyageManagement(targetCase: CaseItem): VoyagePublishResponse {
  const publishId = `PUB-VOYAGE-${Math.floor(100000 + Math.random() * 900000)}`;
  const txHash = `0x${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

  return {
    publishId,
    txHash,
    publishedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    status: 'SUCCESS',
    targetSystem: 'Tegrity Voyage Management Core'
  };
}
