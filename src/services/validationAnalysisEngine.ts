import { CaseItem, ValidationRule, PatternRule, ValidationAnalysisRun, VoyagePublishResponse, CrossDocumentFinding, LaytimeAssessmentData } from '../types/tdv';

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

  // 3. Cross-Document Verification Engine Findings
  const docId = targetCase.documentId;
  const crossDocFindings: CrossDocumentFinding[] = [
    {
      id: `CROSS-01-${Date.now()}`,
      sourceDocA: `Charter Party Agreement (${docId})`,
      sourceDocB: `Demurrage Claim Invoice (INV-${docId})`,
      parameterName: 'Demurrage Daily Rate',
      valueDocA: '$25,000 / day (CP Rider Cl. 14)',
      valueDocB: '$28,500 / day (Invoiced Claim)',
      varianceStatus: 'CRITICAL_MISMATCH',
      financialExposure: 14000,
      severity: 'CRITICAL',
      rationale: 'Invoiced demurrage daily rate exceeds agreed Charter Party Rider Clause 14 rate by $3,500/day over 4.0 days laytime overrun.',
      recommendedSafeguard: 'Reconcile invoice rate back to CP Rider Clause rate of $25,000/day. Reject $14,000 surcharge.',
    },
    {
      id: `CROSS-02-${Date.now()}`,
      sourceDocA: `Notice of Readiness (NOR) (${docId})`,
      sourceDocB: `AIS Vessel Location Log (Vessel: MV VISBY)`,
      parameterName: 'NOR Tender Timestamp vs AIS Arrival',
      valueDocA: '2026-10-01 04:00 hrs',
      valueDocB: '2026-10-01 06:15 hrs (Anchorage)',
      varianceStatus: 'DISCREPANCY_DETECTED',
      financialExposure: 6250,
      severity: 'HIGH',
      rationale: 'NOR was tendered at 04:00 hrs prior to vessel reaching Tanjung Selor anchorage at 06:15 hrs. Premature NOR tender invalidates 2h 15m laytime commencement.',
      recommendedSafeguard: 'Adjust laytime commencement timestamp to 12:15 hrs (6h turn time from actual AIS anchorage arrival).',
    },
    {
      id: `CROSS-03-${Date.now()}`,
      sourceDocA: `Statement of Facts (SOF) (${docId})`,
      sourceDocB: `Port Met Station Log (Tanjung Selor)`,
      parameterName: 'Weather Working Day (WWD) Rain Exclusions',
      valueDocA: '14.5 hrs Rain Exclusion Claimed',
      valueDocB: '0.0 mm Precipitation Recorded',
      varianceStatus: 'DISCREPANCY_DETECTED',
      financialExposure: 15100,
      severity: 'HIGH',
      rationale: 'SOF claims 14.5 hours laytime deduction due to heavy rain. Tanjung Selor Port Met Office official records confirm zero rainfall during berth operations.',
      recommendedSafeguard: 'Disallow 14.5 hours rain exclusion. Count full berth operational hours toward laytime calculation.',
    },
    {
      id: `CROSS-04-${Date.now()}`,
      sourceDocA: `Bill of Lading (B/L) (${docId})`,
      sourceDocB: `Port Outturn Draft Survey Certificate`,
      parameterName: 'Discharged Cargo Quantity (MT)',
      valueDocA: '55,000 MT (B/L Load)',
      valueDocB: '54,320 MT (Outturn Discharge)',
      varianceStatus: 'DISCREPANCY_DETECTED',
      financialExposure: 9900,
      severity: 'MEDIUM',
      rationale: 'Discharged cargo quantity per outturn draft survey is 680 MT lower than B/L quantity, altering pro-rata laytime allowance by 2.97 hours.',
      recommendedSafeguard: 'Recalculate total allowed laytime based on actual discharged outturn tonnage (54,320 MT).',
    },
  ];

  // 4. Laytime & Despatch Assessment Data (VISBY Tanjung Selor Sample Alignment)
  const laytimeAssessment: LaytimeAssessmentData = {
    vesselName: 'MV VISBY / Tanjung Selor',
    portName: 'Tanjung Selor Port, Indonesia',
    cargoQuantityMT: 55000,
    agreedLaytimeHours: 132.0, // 5.5 Days
    usedLaytimeHours: 156.5,
    allowedDemurrageRate: 25000,
    claimedDemurrageTotal: 87500,
    adjustedDemurrageTotal: 42250,
    netSafeguardedSavings: 45250,
    sofEvents: [
      {
        date: '2026-10-01',
        eventDescription: 'Notice of Readiness (NOR) Tendered',
        timeFrom: '04:00',
        timeTo: '04:00',
        laytimePct: 0,
        hoursCounted: 0.0,
        remarks: 'Premature NOR Tender (Discrepancy vs AIS)',
      },
      {
        date: '2026-10-01',
        eventDescription: 'Vessel Arrived Tanjung Selor Anchorage',
        timeFrom: '06:15',
        timeTo: '06:15',
        laytimePct: 0,
        hoursCounted: 0.0,
        remarks: 'AIS Confirmed Anchorage Position',
      },
      {
        date: '2026-10-01',
        eventDescription: 'Laytime Commenced (6h Turn Time Clause)',
        timeFrom: '12:15',
        timeTo: '24:00',
        laytimePct: 100,
        hoursCounted: 11.75,
        remarks: 'Laytime Running WWD SHINC',
      },
      {
        date: '2026-10-02',
        eventDescription: 'Vessel Berthed & Discharge Commenced',
        timeFrom: '00:00',
        timeTo: '24:00',
        laytimePct: 100,
        hoursCounted: 24.0,
        remarks: 'Continuous Bulk Discharge at 1,000 MT/hr',
      },
      {
        date: '2026-10-03',
        eventDescription: 'Claimed Rain Delay (Disallowed by Met Log)',
        timeFrom: '08:00',
        timeTo: '22:30',
        laytimePct: 100,
        hoursCounted: 14.5,
        remarks: 'Disallowed 14.5h deduction per Met Record',
      },
      {
        date: '2026-10-04',
        eventDescription: 'Discharge Operations Completed',
        timeFrom: '00:00',
        timeTo: '18:15',
        laytimePct: 100,
        hoursCounted: 18.25,
        remarks: 'Final Draft Survey Completed',
      },
    ],
  };

  const executionTimeMs = Math.round(performance.now() - startTime);

  return {
    runId: `RUN-VAL-${Date.now()}`,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    documentId: targetCase.documentId,
    riskScoreGrade: targetCase.overallScore,
    riskBand: targetCase.riskCategory,
    gapFindings,
    crossDocFindings,
    laytimeAssessment,
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
