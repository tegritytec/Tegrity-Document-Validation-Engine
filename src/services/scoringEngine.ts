import { FindingItem, CaseItem, ScoringResult } from '../types/tdv';

/**
 * Section 18 Mathematical Scoring Engine
 * Computes Expected Loss, Finding Scores, Compounded Case Score with Noisy-OR,
 * Critical Gap Floor capping, and OPA Approval Routing.
 */

export function calculateFindingLoss(probability: number, exposure: number): number {
  return probability * exposure;
}

export function calculateFindingScore(probability: number, weight: number = 1.0): number {
  // Finding score degrades as risk probability increases
  const baseScore = 100 - (probability * 100 * weight);
  return Math.min(100, Math.max(0, Math.round(baseScore)));
}

export function evaluateCaseScoring(findings: FindingItem[], totalClaimValue: number): ScoringResult {
  if (!findings || findings.length === 0) {
    return {
      caseScore: 100,
      totalExpectedLoss: 0,
      hasCriticalGap: false,
      recommendedAction: 'AUTO_APPROVE',
      requiresTier: 'T1',
      riskCategory: 'LOW'
    };
  }

  // 1. Calculate Expected Loss for each finding and sum
  let totalExpectedLoss = 0;
  let hasCriticalGap = false;

  const findingRiskProbabilities: number[] = [];

  findings.forEach(f => {
    const el = calculateFindingLoss(f.probability, f.exposure);
    totalExpectedLoss += el;
    findingRiskProbabilities.push(f.probability);

    if (f.severity === 'CRITICAL' || f.probability >= 0.85) {
      hasCriticalGap = true;
    }
  });

  // 2. Compounded Noisy-OR Risk Probability: P_risk = 1 - PROD(1 - p_i)
  const nonRiskProduct = findingRiskProbabilities.reduce((acc, p) => acc * (1 - p), 1.0);
  const compoundedRiskProb = 1 - nonRiskProduct;

  // Raw Case Score based on risk probability
  let rawCaseScore = Math.round((1 - compoundedRiskProb) * 100);

  // 3. Apply Critical Gap Floor (Section 18.3: If critical finding exists, max score = 75)
  let finalCaseScore = rawCaseScore;
  if (hasCriticalGap) {
    finalCaseScore = Math.min(finalCaseScore, 75);
  }

  // Ensure bounds [0, 100]
  finalCaseScore = Math.max(0, Math.min(100, finalCaseScore));

  // 4. Determine Action & Tier Routing
  let recommendedAction: 'AUTO_APPROVE' | 'MANUAL_REVIEW' | 'REJECT' | 'ESCALATE_EXECUTIVE' = 'MANUAL_REVIEW';
  let requiresTier: 'T1' | 'T2' | 'T3' = 'T1';
  let riskCategory: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM';

  if (finalCaseScore >= 90 && !hasCriticalGap && totalExpectedLoss < 5000) {
    recommendedAction = 'AUTO_APPROVE';
    requiresTier = 'T1';
    riskCategory = 'LOW';
  } else if (totalExpectedLoss >= 50000 || (hasCriticalGap && finalCaseScore < 50)) {
    recommendedAction = 'ESCALATE_EXECUTIVE';
    requiresTier = 'T3';
    riskCategory = 'CRITICAL';
  } else if (finalCaseScore < 60) {
    recommendedAction = 'REJECT';
    requiresTier = 'T2';
    riskCategory = 'HIGH';
  } else {
    recommendedAction = 'MANUAL_REVIEW';
    requiresTier = totalExpectedLoss > 20000 ? 'T3' : 'T2';
    riskCategory = hasCriticalGap ? 'HIGH' : 'MEDIUM';
  }

  return {
    caseScore: finalCaseScore,
    totalExpectedLoss: Math.round(totalExpectedLoss),
    hasCriticalGap,
    recommendedAction,
    requiresTier,
    riskCategory
  };
}
