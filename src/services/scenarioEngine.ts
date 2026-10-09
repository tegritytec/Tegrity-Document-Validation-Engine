import { AnonymizedHistoricalCase, HistoricalFilter, WhatIfScenarioParams, ScenarioSimulationResult } from '../types/tdv';

export function filterHistoricalDataset(
  cases: AnonymizedHistoricalCase[],
  filter: HistoricalFilter
): AnonymizedHistoricalCase[] {
  return cases.filter(c => {
    // Filter by sector
    if (filter.sector && filter.sector !== 'ALL' && c.sector !== filter.sector) {
      return false;
    }
    // Filter by doc type
    if (filter.documentType && filter.documentType !== 'ALL' && c.documentType !== filter.documentType) {
      return false;
    }
    // Filter by claim value range
    if (c.claimValue < filter.minValue || c.claimValue > filter.maxValue) {
      return false;
    }
    // Filter by risk band
    if (filter.riskBand && filter.riskBand !== 'ALL') {
      if (filter.riskBand === 'HIGH_CRITICAL' && c.originalRiskScore >= 60) return false;
      if (filter.riskBand === 'LOW' && c.originalRiskScore < 85) return false;
    }
    return true;
  });
}

export function simulateWhatIfScenario(
  scopedCases: AnonymizedHistoricalCase[],
  params: WhatIfScenarioParams
): ScenarioSimulationResult {
  if (!scopedCases || scopedCases.length === 0) {
    return {
      scopedTotalCount: 0,
      scopedTotalValue: 0,
      baselineAutoApproveCount: 0,
      baselineAutoApprovePct: 0,
      baselineTotalExpectedLoss: 0,
      scenarioAutoApproveCount: 0,
      scenarioAutoApprovePct: 0,
      scenarioTotalExpectedLoss: 0,
      netLossDelta: 0,
      recommendedWeightUpdates: []
    };
  }

  const scopedTotalCount = scopedCases.length;
  const scopedTotalValue = scopedCases.reduce((acc, c) => acc + c.claimValue, 0);

  // 1. Calculate Baseline metrics
  let baselineAutoApproveCount = 0;
  let baselineTotalExpectedLoss = 0;

  scopedCases.forEach(c => {
    if (c.originalRiskScore >= 90 && c.originalExpectedLoss < 5000) {
      baselineAutoApproveCount++;
    }
    baselineTotalExpectedLoss += c.originalExpectedLoss;
  });

  const baselineAutoApprovePct = Math.round((baselineAutoApproveCount / scopedTotalCount) * 100);

  // 2. Simulate Scenario Perturbations
  let scenarioAutoApproveCount = 0;
  let scenarioTotalExpectedLoss = 0;

  scopedCases.forEach(c => {
    let simRiskScore = c.originalRiskScore;
    let simExpectedLoss = c.originalExpectedLoss;

    // VAT Strictness modifier
    if (c.vatStatus === 'REVOKED' || c.vatStatus === 'EXPIRED') {
      const vatPenalty = 20 * params.vatStrictnessWeight;
      simRiskScore = Math.max(0, simRiskScore - vatPenalty);
      simExpectedLoss += c.claimValue * 0.15 * params.vatStrictnessWeight;
    }

    // Line Item Rate Tolerance modifier
    if (c.rateDiscrepancyPct > params.rateTolerancePct) {
      const ratePenalty = (c.rateDiscrepancyPct - params.rateTolerancePct) * 5;
      simRiskScore = Math.max(0, simRiskScore - ratePenalty);
      simExpectedLoss += (c.claimValue * (c.rateDiscrepancyPct / 100));
    } else {
      // Waived within tolerance!
      simRiskScore = Math.min(100, simRiskScore + 5);
      simExpectedLoss = Math.max(0, simExpectedLoss - 3000);
    }

    // AIS Vessel Location Mismatch modifier
    if (c.aisLocationMismatch) {
      const aisPenalty = 30 * params.aisMismatchStrictness;
      simRiskScore = Math.max(0, simRiskScore - aisPenalty);
      simExpectedLoss += c.claimValue * 0.25 * params.aisMismatchStrictness;
    }

    // Sanctions Fuzzy Match modifier
    if (c.sanctionsMatchRatio >= params.sanctionsFuzzyThreshold) {
      simRiskScore = Math.min(simRiskScore, 40); // Hard cap on sanctions trigger
      simExpectedLoss += c.claimValue * 0.40;
    }

    // Check Auto Approve floor under scenario params
    if (simRiskScore >= params.autoApproveScoreFloor && simExpectedLoss < 5000) {
      scenarioAutoApproveCount++;
    }

    scenarioTotalExpectedLoss += simExpectedLoss;
  });

  const scenarioAutoApprovePct = Math.round((scenarioAutoApproveCount / scopedTotalCount) * 100);
  const netLossDelta = Math.round(baselineTotalExpectedLoss - scenarioTotalExpectedLoss);

  // Generate continuous learning weight recommendations based on simulation output
  const recommendedWeightUpdates = [
    {
      ruleId: 'RULE-TAX-004',
      recommendedWeight: parseFloat((1.5 * params.vatStrictnessWeight).toFixed(2)),
      rationale: `VAT Portal validation weight adjusted based on ${params.vatStrictnessWeight}x scenario strictness factor.`
    },
    {
      ruleId: 'RULE-AMT-002',
      recommendedWeight: parseFloat((1.2 * (1 - params.rateTolerancePct / 100)).toFixed(2)),
      rationale: `Rate variance weight tuned to reflect ${params.rateTolerancePct}% tolerance window.`
    },
    {
      ruleId: 'RULE-BOL-009',
      recommendedWeight: parseFloat((2.0 * params.aisMismatchStrictness).toFixed(2)),
      rationale: `AIS tracking strictness increased by ${params.aisMismatchStrictness}x in scenario research.`
    }
  ];

  return {
    scopedTotalCount,
    scopedTotalValue,
    baselineAutoApproveCount,
    baselineAutoApprovePct,
    baselineTotalExpectedLoss: Math.round(baselineTotalExpectedLoss),
    scenarioAutoApproveCount,
    scenarioAutoApprovePct,
    scenarioTotalExpectedLoss: Math.round(scenarioTotalExpectedLoss),
    netLossDelta,
    recommendedWeightUpdates
  };
}
