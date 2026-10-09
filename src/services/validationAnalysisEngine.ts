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

    // Check if finding exists for this rule
    const matchingFinding = targetCase.findings.find(f => f.ruleId === r.id);
    const isFailed = Boolean(matchingFinding) || (r.severity === 'CRITICAL' && targetCase.hasCriticalGap);

    if (isFailed) {
      const gapType = r.code.startsWith('TAX') 
        ? 'COMPLIANCE_GAP' 
        : r.code.startsWith('MATH') 
          ? 'FINANCIAL_EXPOSURE' 
          : 'COMPLIANCE_GAP';

      const rationaleText = matchingFinding?.description 
        ? `Validation rule [${r.code}] failed during OCR parser verification. ${matchingFinding.description}. Assessment indicates operational variance against BIMCO/Rule Catalog standards.`
        : `Validation rule [${r.code}] failed. Document contains unverified clause terms that exceed allowed risk threshold (${r.thresholdScore}). Counterparty verification pending.`;

      const sourceExcerptText = matchingFinding?.description 
        ? `"...Clause ${r.code}: ${matchingFinding.description}. Invoiced value: $${targetCase.claimValue.toLocaleString()}..."`
        : `"...Rule ${r.code} verification failed for vendor ${targetCase.vendorName} under document ${targetCase.documentId}..."`;

      gapFindings.push({
        ruleId: r.id,
        title: r.name,
        gapType,
        severity: r.severity,
        safeguardOpportunity: matchingFinding?.remediation || `Enforce ${r.name} verification clause in Rider contract. Require counterparty bank indemnity.`,
        rationale: rationaleText,
        sourceExcerpt: sourceExcerptText,
        scoreImpact: r.severity === 'CRITICAL' ? 25 : r.severity === 'HIGH' ? 15 : 10,
        expectedLoss: matchingFinding?.expectedLoss || Math.round(targetCase.claimValue * 0.12),
        clauseRef: `Clause ${r.code} (Sec 4.2)`,
        confidenceScore: 95.8,
        auditorAction: r.actionOnFailure === 'BLOCK' ? 'Halt Voyage Approval & Demand Counterparty Guarantee' : 'Require SME Reviewer Sign-off prior to publishing',
      });
    }
  });

  // 2. Evaluate against Pattern Library
  patterns.forEach(p => {
    if (p.status !== 'ACTIVE') return;

    const isMatched = Math.random() > 0.15; // 85% match rate simulation
    const regexPattern = p.regexPattern || '^[A-Z]{2}\\d{8}$';

    patternMatches.push({
      patternId: p.id,
      patternName: p.name,
      status: isMatched ? 'MATCHED' : 'FAILED',
      confidence: isMatched ? p.confidenceThreshold : 45,
      rationale: isMatched 
        ? `Extracted OCR text token matches pattern '${p.name}' with regex ${regexPattern}. High confidence match.` 
        : `Extracted OCR token failed regex structure test ${regexPattern} for pattern '${p.name}'.`,
      regexPattern
    });

    if (!isMatched) {
      gapFindings.push({
        ruleId: p.id,
        title: `Pattern Mismatch: ${p.name}`,
        gapType: 'PATTERN_MISMATCH',
        severity: 'HIGH',
        safeguardOpportunity: `Standardize ${p.category} text token format against pattern ${regexPattern}.`,
        rationale: `Pattern recognition engine failed to match document text against rule regex pattern '${regexPattern}'. Unrecognized token structure detected in ${p.category} field.`,
        sourceExcerpt: `"...Unverified token format detected in field '${p.name}'. Pattern expected: ${regexPattern}..."`,
        scoreImpact: 12,
        expectedLoss: Math.round(targetCase.claimValue * 0.08),
        clauseRef: `Pattern Ref: ${p.id}`,
        confidenceScore: 45.0,
        auditorAction: 'Standardize OCR token catalog and update pattern rules in continuous learning catalog.',
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
