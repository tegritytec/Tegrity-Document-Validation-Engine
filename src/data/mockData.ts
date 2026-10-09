import { CaseItem, PatternRule, ValidationRule, LineageNode, LearningFeedback, ExecutiveMetric, AnonymizedHistoricalCase } from '../types/tdv';

export const MOCK_CASES: CaseItem[] = [
  {
    id: 'TDV-2026-9041',
    documentId: 'DOC-INV-88392',
    documentType: 'Commercial Tax Invoice',
    vendorName: 'AeroMaritime Logistics Ltd',
    submissionDate: '2026-10-09 14:22:05',
    claimValue: 145000,
    currency: 'USD',
    status: 'IN_REVIEW',
    assignedAnalyst: 'Alex Morgan (T2 Auditor)',
    overallScore: 68,
    expectedLoss: 38500,
    riskCategory: 'HIGH',
    hasCriticalGap: true,
    findings: [
      {
        id: 'FND-01',
        ruleId: 'RULE-TAX-004',
        ruleName: 'VAT ID Cross-Validation vs Tax Portal',
        severity: 'CRITICAL',
        probability: 0.88,
        exposure: 25000,
        expectedLoss: 22000,
        description: 'Vendor VAT ID #GB99823010 is flagged as REVOKED in HMRC API response.',
        remediation: 'Require updated Tax Residency Certificate or tax clearance documentation.'
      },
      {
        id: 'FND-02',
        ruleId: 'RULE-AMT-002',
        ruleName: 'Line Item Quantity x Rate Discrepancy',
        severity: 'HIGH',
        probability: 0.65,
        exposure: 15000,
        expectedLoss: 9750,
        description: 'Item #4 line total $45,000 does not match calculated qty (500 units @ $75/unit = $37,500). $7,500 variance.',
        remediation: 'Issue purchase order line item reconciliation notice.'
      },
      {
        id: 'FND-03',
        ruleId: 'RULE-SIG-001',
        ruleName: 'Digital Signature Integrity Check',
        severity: 'MEDIUM',
        probability: 0.45,
        exposure: 15000,
        expectedLoss: 6750,
        description: 'PDF timestamp authority certificate expired 3 days prior to document creation date.',
        remediation: 'Re-request signed document with active timestamp token.'
      }
    ],
    metadata: {
      poNumber: 'PO-2026-8831',
      vatNumber: 'GB99823010',
      iban: 'GB82WEST12345698765432',
      swiftCode: 'WESTGB2L',
      lineItemCount: 14,
      ocrConfidence: 96.4
    },
    lineageId: 'LIN-9041-DAG'
  },
  {
    id: 'TDV-2026-9042',
    documentId: 'DOC-BOL-44102',
    documentType: 'Bill of Lading',
    vendorName: 'Pacific Rim Freight Lines',
    submissionDate: '2026-10-09 15:10:12',
    claimValue: 520000,
    currency: 'USD',
    status: 'FLAGGED',
    assignedAnalyst: 'Sarah Jenkins (T3 Lead)',
    overallScore: 42,
    expectedLoss: 182000,
    riskCategory: 'CRITICAL',
    hasCriticalGap: true,
    findings: [
      {
        id: 'FND-11',
        ruleId: 'RULE-BOL-009',
        ruleName: 'Vessel IMO Number AIS Tracking Mismatch',
        severity: 'CRITICAL',
        probability: 0.95,
        exposure: 140000,
        expectedLoss: 133000,
        description: 'Vessel IMO 9812341 reported position in Singapore Strait, document claims discharge at Rotterdam on same date.',
        remediation: 'Immediate hold on release order. Escalate to Maritime Security Compliance.'
      },
      {
        id: 'FND-12',
        ruleId: 'RULE-SAN-001',
        ruleName: 'OFAC Sanctions & SDN List Screening',
        severity: 'CRITICAL',
        probability: 0.70,
        exposure: 70000,
        expectedLoss: 49000,
        description: 'Intermediate charterer name matched 84% fuzzy ratio against OFAC SDN List entry.',
        remediation: 'Secondary manual review by Sanctions Desk required before payment approval.'
      }
    ],
    metadata: {
      poNumber: 'PO-2026-9920',
      vesselImo: 'IMO 9812341',
      portOfLoading: 'Shanghai',
      portOfDischarge: 'Rotterdam',
      lineItemCount: 8,
      ocrConfidence: 99.1
    },
    lineageId: 'LIN-9042-DAG'
  },
  {
    id: 'TDV-2026-9043',
    documentId: 'DOC-COO-11293',
    documentType: 'Certificate of Origin',
    vendorName: 'Nordic CleanEnergy Systems',
    submissionDate: '2026-10-09 16:04:44',
    claimValue: 34000,
    currency: 'EUR',
    status: 'APPROVED',
    assignedAnalyst: 'System (Auto-Approved)',
    overallScore: 96,
    expectedLoss: 0,
    riskCategory: 'LOW',
    hasCriticalGap: false,
    findings: [],
    metadata: {
      chamberId: 'CHAMBER-SE-9082',
      countryOfOrigin: 'Sweden',
      hsCode: '8504.40',
      lineItemCount: 2,
      ocrConfidence: 98.9
    },
    lineageId: 'LIN-9043-DAG'
  },
  {
    id: 'TDV-2026-9044',
    documentId: 'DOC-INS-77401',
    documentType: 'Marine Insurance Policy',
    vendorName: 'Allianz Global Corporate',
    submissionDate: '2026-10-09 16:30:00',
    claimValue: 890000,
    currency: 'USD',
    status: 'APPROVED',
    assignedAnalyst: 'Michael Vance (T1 Analyst)',
    overallScore: 91,
    expectedLoss: 4500,
    riskCategory: 'LOW',
    hasCriticalGap: false,
    findings: [
      {
        id: 'FND-21',
        ruleId: 'RULE-INS-003',
        ruleName: 'Clause Institute Cargo (A) Coverage Verification',
        severity: 'LOW',
        probability: 0.15,
        exposure: 30000,
        expectedLoss: 4500,
        description: 'Minor ambiguity in war risk endorsement sub-limit wording.',
        remediation: 'Standard policy renewal note logged.'
      }
    ],
    metadata: {
      policyNumber: 'AGCS-MAR-2026-009',
      insuredAmount: 980000,
      coverageType: 'Institute Cargo Clauses (A)',
      lineItemCount: 5,
      ocrConfidence: 97.8
    },
    lineageId: 'LIN-9044-DAG'
  }
];

export const MOCK_PATTERNS: PatternRule[] = [
  {
    id: 'PAT-TAX-01',
    name: 'European Community VAT Syntax Standard',
    category: 'Tax Identification',
    regexPattern: '^(ATU[0-9]{8}|BE0[0-9]{9}|BG[0-9]{9,10}|CY[0-9]{8}[A-Z]|CZ[0-9]{8,10}|DE[0-9]{9}|DK[0-9]{8}|EE[0-9]{9}|EL[0-9]{9}|ES[A-Z0-9][0-9]{7}[A-Z0-9]|FI[0-9]{8}|FR[A-Z0-9]{2}[0-9]{9}|GB([0-9]{9}|[0-9]{12}|GD[0-9]{3}|HA[0-9]{3})|HU[0-9]{8}|IE[0-9]{7}[A-W][A-I]?|IT[0-9]{11}|LT([0-9]{9}|[0-9]{12})|LU[0-9]{8}|LV[0-9]{11}|MT[0-9]{8}|NL[0-9]{9}B[0-9]{2}|PL[0-9]{10}|PT[0-9]{9}|RO[0-9]{2,10}|SE[0-9]{12}|SI[0-9]{8}|SK[0-9]{10})$',
    confidenceThreshold: 95,
    sampleMatches: ['GB99823010', 'DE123456789', 'FR88123456789'],
    status: 'ACTIVE'
  },
  {
    id: 'PAT-IBAN-02',
    name: 'SWIFT / IBAN Bank Account Format',
    category: 'Banking & Payments',
    regexPattern: '^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$',
    confidenceThreshold: 98,
    sampleMatches: ['GB82WEST12345698765432', 'DE89370400440532013000'],
    status: 'ACTIVE'
  },
  {
    id: 'PAT-IMO-03',
    name: 'Maritime IMO Vessel Number Validator',
    category: 'Logistics',
    regexPattern: '^IMO\\s?[0-9]{7}$',
    confidenceThreshold: 99,
    sampleMatches: ['IMO 9812341', 'IMO 9123456'],
    status: 'ACTIVE'
  },
  {
    id: 'PAT-HS-04',
    name: 'Harmonized System (HS) Tariff Code',
    category: 'Customs & Tariff',
    regexPattern: '^[0-9]{4}\\.[0-9]{2}(\\.[0-9]{2})?$',
    confidenceThreshold: 90,
    sampleMatches: ['8504.40', '8471.30.00'],
    status: 'ACTIVE'
  },
  // Tokenized Shipping Contractual Governance Patterns
  {
    id: 'PAT-BIMCO-01',
    name: 'BIMCO Standard Contractual Clause Token',
    category: 'Charter Party Governance',
    regexPattern: '^(BIMCO|NYPE2015|BALTIME|ASBATANKVOY)-[A-Z0-9-]{4,16}$',
    confidenceThreshold: 98,
    sampleMatches: ['BIMCO-SANCTIONS-2020', 'NYPE2015-CL-14', 'ASBATANKVOY-LAYTIME-02'],
    status: 'ACTIVE'
  },
  {
    id: 'PAT-MARPOL-02',
    name: 'MARPOL Annex VI Bunker Delivery Note Token',
    category: 'Port Compliance',
    regexPattern: '^BDN-[0-9]{4}-[A-Z0-9]{6}$',
    confidenceThreshold: 96,
    sampleMatches: ['BDN-2026-X99201', 'BDN-2026-MARPOL01'],
    status: 'ACTIVE'
  },
  {
    id: 'PAT-ISPS-03',
    name: 'ISPS Port Security Declaration Token (DOS)',
    category: 'Port Security',
    regexPattern: '^DOS-ISPS-L[1-3]-[0-9]{6}$',
    confidenceThreshold: 99,
    sampleMatches: ['DOS-ISPS-L1-992014', 'DOS-ISPS-L2-881203'],
    status: 'ACTIVE'
  },
  {
    id: 'PAT-SOLAS-04',
    name: 'SOLAS V/34 Passage Plan Governance Token',
    category: 'Master Instructions',
    regexPattern: '^SOLAS-V34-[0-9]{8}-[A-Z]{3}$',
    confidenceThreshold: 97,
    sampleMatches: ['SOLAS-V34-20261009-RTM', 'SOLAS-V34-20260812-SGP'],
    status: 'ACTIVE'
  }
];

export const MOCK_RULES: ValidationRule[] = [
  // General Financial & Compliance Rules
  {
    id: 'RULE-TAX-004',
    code: 'TAX_VAT_ONLINE_VERIFY',
    name: 'VAT ID Live Portal Verification',
    description: 'Queries national tax authority REST APIs to verify active registration state and legal entity match.',
    severity: 'CRITICAL',
    enabled: true,
    weight: 1.5,
    thresholdScore: 90,
    actionOnFailure: 'ESCALATE'
  },
  {
    id: 'RULE-AMT-002',
    code: 'MATH_LINE_ITEM_TOTAL',
    name: 'Line Item Rate x Qty Arithmetic Check',
    description: 'Recomputes extended line totals and verifies invoice subtotal + tax = grand total within $0.05 tolerance.',
    severity: 'HIGH',
    enabled: true,
    weight: 1.2,
    thresholdScore: 85,
    actionOnFailure: 'FLAG'
  },
  {
    id: 'RULE-BOL-009',
    code: 'LOGISTICS_AIS_CROSS_REF',
    name: 'Vessel AIS Tracking Cross-Reference',
    description: 'Cross-checks maritime automatic identification system vessel coordinates against bill of lading ports.',
    severity: 'CRITICAL',
    enabled: true,
    weight: 2.0,
    thresholdScore: 95,
    actionOnFailure: 'BLOCK'
  },
  {
    id: 'RULE-SAN-001',
    code: 'COMPLIANCE_OFAC_SDN',
    name: 'OFAC & International Sanctions Screening',
    description: 'Runs high-performance fuzzy match algorithms against Treasury SDN, EU, and UN consolidated lists.',
    severity: 'CRITICAL',
    enabled: true,
    weight: 2.5,
    thresholdScore: 98,
    actionOnFailure: 'BLOCK'
  },

  // Tokenized Shipping Industry Contractual Governance Standards
  // Group A: Charter Party Clauses (BIMCO / NYPE / ASBATANKVOY)
  {
    id: 'RULE-CP-001',
    code: 'CP_BIMCO_NYPE_LAYTIME',
    name: 'BIMCO NYPE Laytime & Demurrage Standard',
    description: 'Verifies Notice of Readiness (NOR) validity, SHINC/SHEX terms, and 90-day time-bar demurrage submission requirements under NYPE 2015 Clause 14.',
    severity: 'HIGH',
    enabled: true,
    weight: 1.6,
    thresholdScore: 90,
    actionOnFailure: 'FLAG'
  },
  {
    id: 'RULE-CP-002',
    code: 'CP_SPEED_CONSUMPTION_WARRANTY',
    name: 'Speed & Fuel Consumption Warranty Audit',
    description: 'Cross-references logbook data against charter agreement speed/consumption warranties under good weather conditions (Beaufort Scale <= 4).',
    severity: 'HIGH',
    enabled: true,
    weight: 1.4,
    thresholdScore: 88,
    actionOnFailure: 'FLAG'
  },
  {
    id: 'RULE-CP-003',
    code: 'CP_OFFHIRE_CESSATION',
    name: 'Off-Hire Cessation & Hire Withholding Audit',
    description: 'Validates off-hire breakdown notices, drydocking clauses, and prevents unauthorized hire deductions prior to SME audit sign-off.',
    severity: 'CRITICAL',
    enabled: true,
    weight: 1.8,
    thresholdScore: 92,
    actionOnFailure: 'BLOCK'
  },

  // Group B: Rider Clauses (Sanctions, War Risk, Bunker Quality, Cyber Security)
  {
    id: 'RULE-RIDER-010',
    code: 'RIDER_BIMCO_SANCTIONS_2020',
    name: 'BIMCO Sanctions Clause for Charter Parties 2020',
    description: 'Tokenizes sanctions termination rights, prohibited trade zones, designated entity exposure, and carrier indemnity obligations.',
    severity: 'CRITICAL',
    enabled: true,
    weight: 2.2,
    thresholdScore: 98,
    actionOnFailure: 'BLOCK'
  },
  {
    id: 'RULE-RIDER-011',
    code: 'RIDER_CONWAY_WAR_RISKS',
    name: 'CONWAY 2013 / BIMCO War Risks (VOYWAR/CONWAR)',
    description: 'Verifies war risk premium reimbursement terms, owner cancellation rights in high-threat areas, and mandatory hull war risk coverage limits.',
    severity: 'HIGH',
    enabled: true,
    weight: 1.5,
    thresholdScore: 90,
    actionOnFailure: 'ESCALATE'
  },
  {
    id: 'RULE-RIDER-012',
    code: 'RIDER_ISO8217_BUNKER_QUALITY',
    name: 'ISO 8217 Fuel Quality & Bunker Sampling Audit',
    description: 'Enforces joint sampling protocol (MARPOL representative sample), 90-day lab dispute retention, and off-spec fuel disclaimer clauses.',
    severity: 'HIGH',
    enabled: true,
    weight: 1.3,
    thresholdScore: 85,
    actionOnFailure: 'FLAG'
  },
  {
    id: 'RULE-RIDER-013',
    code: 'RIDER_CYBER_SECURITY_BIMCO',
    name: 'BIMCO Cyber Security Operational Technology Clause',
    description: 'Verifies carrier compliance with IMO MSC.428(98) cyber risk management and ISO 27001 operational technology safeguards.',
    severity: 'MEDIUM',
    enabled: true,
    weight: 1.1,
    thresholdScore: 80,
    actionOnFailure: 'LOG'
  },

  // Group C: Master Instructions & Cargo Operations
  {
    id: 'RULE-MAST-020',
    code: 'MASTER_SOLAS_PASSAGE_PLAN',
    name: 'SOLAS V/34 Berth-to-Berth Passage Planning',
    description: 'Validates Master passage plan tokenization, Under Keel Clearance (UKC) safety margins, and ECA environmental transit compliance.',
    severity: 'HIGH',
    enabled: true,
    weight: 1.5,
    thresholdScore: 90,
    actionOnFailure: 'FLAG'
  },
  {
    id: 'RULE-MAST-021',
    code: 'MASTER_EBL_BIMCO_STD',
    name: 'Electronic Bill of Lading (e-BL) Governance',
    description: 'Tokenizes UNCITRAL MLETR model law signatures, title registry state verification, and carrier liability transition points for e-BLs.',
    severity: 'CRITICAL',
    enabled: true,
    weight: 2.0,
    thresholdScore: 95,
    actionOnFailure: 'BLOCK'
  },
  {
    id: 'RULE-MAST-022',
    code: 'MASTER_STOWAGE_IMDG_SAFE',
    name: 'IMDG Code Dangerous Goods Stowage Audit',
    description: 'Cross-checks Dangerous Goods Declarations against master manifest stowage and segregation requirements under SOLAS Chapter VII.',
    severity: 'CRITICAL',
    enabled: true,
    weight: 2.5,
    thresholdScore: 98,
    actionOnFailure: 'BLOCK'
  },

  // Group D: Port & Environmental Compliance
  {
    id: 'RULE-PORT-030',
    code: 'PORT_MARPOL_ANNEX_VI_ECA',
    name: 'MARPOL Annex VI Sulphur Emission Cap (ECA 0.10%)',
    description: 'Audits Bunker Delivery Notes (BDNs) and logbook fuel switchovers for ECA (0.10% Sulphur) and global (0.50% Sulphur) compliance.',
    severity: 'CRITICAL',
    enabled: true,
    weight: 2.0,
    thresholdScore: 95,
    actionOnFailure: 'BLOCK'
  },
  {
    id: 'RULE-PORT-031',
    code: 'PORT_EU_ETS_MARITIME_ALLOW',
    name: 'EU ETS Maritime Allowance Transfer & Verification',
    description: 'Audits MRV GHG emissions reporting data and verifies EU Allowance (EUA) surrender obligations between charterer and shipowner.',
    severity: 'HIGH',
    enabled: true,
    weight: 1.6,
    thresholdScore: 90,
    actionOnFailure: 'ESCALATE'
  },
  {
    id: 'RULE-PORT-032',
    code: 'PORT_ISPS_SECURITY_LEVEL',
    name: 'ISPS Code Port Facility Security Level Verification',
    description: 'Verifies Declaration of Security (DOS) tokens for ship-to-port interface compliance under ISPS Security Levels 1, 2, and 3.',
    severity: 'HIGH',
    enabled: true,
    weight: 1.7,
    thresholdScore: 92,
    actionOnFailure: 'BLOCK'
  },
  {
    id: 'RULE-PORT-033',
    code: 'PORT_BWM_BALLAST_EXCHANGE',
    name: 'IMO D-2 Ballast Water Management Standard',
    description: 'Audits Ballast Water Record Book entries, D-2 biological discharge standard compliance, and BWTS operational status.',
    severity: 'MEDIUM',
    enabled: true,
    weight: 1.2,
    thresholdScore: 85,
    actionOnFailure: 'FLAG'
  }
];

export const MOCK_LINEAGE_GRAPH: LineageNode[] = [
  {
    id: 'NODE-1',
    label: 'Document Ingestion (OCR / PDF Parser)',
    type: 'INPUT',
    status: 'PASSED',
    details: 'Extracted 14 Key-Value Pairs and 3 Tables with 98.4% Confidence'
  },
  {
    id: 'NODE-2',
    label: 'Pattern Matching Engine (F2)',
    type: 'PROCESS',
    status: 'PASSED',
    details: 'Validated Regex Formats for VAT, IBAN, IMO, BIMCO, and MARPOL Tokens',
    dependencies: ['NODE-1']
  },
  {
    id: 'NODE-3',
    label: 'External API Cross-Validation (Tax & AIS)',
    type: 'PROCESS',
    status: 'FAILED',
    details: 'HMRC VAT API returned state: REVOKED',
    dependencies: ['NODE-2']
  },
  {
    id: 'NODE-4',
    label: 'Mathematical Scoring Engine (F5)',
    type: 'PROCESS',
    status: 'WARNING',
    details: 'Compounded Noisy-OR Score = 68; Critical Floor Capped at 75; Expected Loss = $38,500',
    dependencies: ['NODE-3']
  },
  {
    id: 'NODE-5',
    label: 'OPA Segregation of Duties Decision Routing',
    type: 'OUTPUT',
    status: 'WARNING',
    details: 'Routed to T2 Audit Queue. Enforcing zero self-approval policy.',
    dependencies: ['NODE-4']
  }
];

export const MOCK_FEEDBACK_QUEUE: LearningFeedback[] = [
  {
    id: 'FB-2026-001',
    caseId: 'TDV-2026-9041',
    findingId: 'FND-02',
    auditorName: 'Alex Morgan',
    originalScore: 68,
    adjustedScore: 78,
    auditorDecision: 'OVERRIDE_APPROVE',
    reasonCode: 'VENDOR_CREDIT_MEMO_ATTACHED',
    comment: 'Vendor provided valid credit note CN-8819 covering $7,500 rate discrepancy. Risk mitigated.',
    timestamp: '2026-10-09 16:45:10',
    learningStatus: 'PROPOSED_TRAINING_WEIGHT'
  },
  {
    id: 'FB-2026-002',
    caseId: 'TDV-2026-9042',
    findingId: 'FND-11',
    auditorName: 'Sarah Jenkins',
    originalScore: 42,
    adjustedScore: 42,
    auditorDecision: 'CONFIRM_REJECT',
    reasonCode: 'CONFIRMED_FRAUDULENT_DOCUMENT',
    comment: 'Carrier confirmed vessel name was falsified on original bill of lading. Case sent to Fraud Ops.',
    timestamp: '2026-10-09 17:02:18',
    learningStatus: 'APPLIED_TO_MODEL'
  }
];

export const MOCK_EXECUTIVE_METRICS: ExecutiveMetric[] = [
  {
    label: 'Total Documents Validated (30d)',
    value: '48,290',
    trend: '+12.4% vs last month',
    status: 'POSITIVE'
  },
  {
    label: 'Auto-Approval Ratio',
    value: '74.2%',
    trend: '+3.1% throughput gain',
    status: 'POSITIVE'
  },
  {
    label: 'Prevented Financial Loss (YTD)',
    value: '$4.85M',
    trend: '184 critical risks blocked',
    status: 'POSITIVE'
  },
  {
    label: 'Average Audit Resolution Time',
    value: '4.2 hrs',
    trend: '-38% handling time reduction',
    status: 'NEUTRAL'
  }
];

// Anonymized Dataset for What-If Scenario Research
export const MOCK_ANONYMIZED_HISTORICAL_CASES: AnonymizedHistoricalCase[] = [
  { anonymizedId: 'ANO-101', documentType: 'Commercial Tax Invoice', sector: 'Maritime & Freight', claimValue: 185000, currency: 'USD', originalRiskScore: 65, originalExpectedLoss: 42000, vatStatus: 'REVOKED', rateDiscrepancyPct: 4.5, aisLocationMismatch: false, sanctionsMatchRatio: 45, historicalOutcome: 'REJECTED' },
  { anonymizedId: 'ANO-102', documentType: 'Bill of Lading', sector: 'Maritime & Freight', claimValue: 640000, currency: 'USD', originalRiskScore: 38, originalExpectedLoss: 210000, vatStatus: 'VALID', rateDiscrepancyPct: 1.2, aisLocationMismatch: true, sanctionsMatchRatio: 88, historicalOutcome: 'REJECTED' },
  { anonymizedId: 'ANO-103', documentType: 'Certificate of Origin', sector: 'Energy & Utilities', claimValue: 45000, currency: 'EUR', originalRiskScore: 94, originalExpectedLoss: 0, vatStatus: 'VALID', rateDiscrepancyPct: 0, aisLocationMismatch: false, sanctionsMatchRatio: 12, historicalOutcome: 'APPROVED' },
  { anonymizedId: 'ANO-104', documentType: 'Marine Insurance Policy', sector: 'Maritime & Freight', claimValue: 920000, currency: 'USD', originalRiskScore: 91, originalExpectedLoss: 5000, vatStatus: 'VALID', rateDiscrepancyPct: 0.5, aisLocationMismatch: false, sanctionsMatchRatio: 25, historicalOutcome: 'APPROVED' },
  { anonymizedId: 'ANO-105', documentType: 'Commercial Tax Invoice', sector: 'Manufacturing', claimValue: 280000, currency: 'USD', originalRiskScore: 72, originalExpectedLoss: 28000, vatStatus: 'EXPIRED', rateDiscrepancyPct: 3.2, aisLocationMismatch: false, sanctionsMatchRatio: 30, historicalOutcome: 'ESCALATED' },
  { anonymizedId: 'ANO-106', documentType: 'Charter Party Agreement', sector: 'Maritime & Freight', claimValue: 1250000, currency: 'USD', originalRiskScore: 55, originalExpectedLoss: 380000, vatStatus: 'VALID', rateDiscrepancyPct: 6.8, aisLocationMismatch: true, sanctionsMatchRatio: 82, historicalOutcome: 'REJECTED' },
  { anonymizedId: 'ANO-107', documentType: 'Commercial Tax Invoice', sector: 'Technology & Services', claimValue: 88000, currency: 'USD', originalRiskScore: 88, originalExpectedLoss: 2500, vatStatus: 'VALID', rateDiscrepancyPct: 1.8, aisLocationMismatch: false, sanctionsMatchRatio: 15, historicalOutcome: 'APPROVED' },
  { anonymizedId: 'ANO-108', documentType: 'Bill of Lading', sector: 'Manufacturing', claimValue: 310000, currency: 'USD', originalRiskScore: 61, originalExpectedLoss: 75000, vatStatus: 'REVOKED', rateDiscrepancyPct: 0, aisLocationMismatch: false, sanctionsMatchRatio: 76, historicalOutcome: 'ESCALATED' },
  { anonymizedId: 'ANO-109', documentType: 'Certificate of Origin', sector: 'Manufacturing', claimValue: 22000, currency: 'EUR', originalRiskScore: 98, originalExpectedLoss: 0, vatStatus: 'VALID', rateDiscrepancyPct: 0, aisLocationMismatch: false, sanctionsMatchRatio: 5, historicalOutcome: 'APPROVED' },
  { anonymizedId: 'ANO-110', documentType: 'Commercial Tax Invoice', sector: 'Energy & Utilities', claimValue: 450000, currency: 'USD', originalRiskScore: 49, originalExpectedLoss: 165000, vatStatus: 'VALID', rateDiscrepancyPct: 8.4, aisLocationMismatch: false, sanctionsMatchRatio: 86, historicalOutcome: 'REJECTED' },
  { anonymizedId: 'ANO-111', documentType: 'Marine Insurance Policy', sector: 'Energy & Utilities', claimValue: 1100000, currency: 'USD', originalRiskScore: 89, originalExpectedLoss: 12000, vatStatus: 'VALID', rateDiscrepancyPct: 0.8, aisLocationMismatch: false, sanctionsMatchRatio: 40, historicalOutcome: 'APPROVED' },
  { anonymizedId: 'ANO-112', documentType: 'Commercial Tax Invoice', sector: 'Technology & Services', claimValue: 64000, currency: 'USD', originalRiskScore: 92, originalExpectedLoss: 0, vatStatus: 'VALID', rateDiscrepancyPct: 0.2, aisLocationMismatch: false, sanctionsMatchRatio: 10, historicalOutcome: 'APPROVED' }
];
