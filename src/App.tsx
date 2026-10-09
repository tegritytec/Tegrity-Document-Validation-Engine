import React, { useState, useRef } from 'react';
import { MOCK_CASES, MOCK_PATTERNS, MOCK_RULES, MOCK_LINEAGE_GRAPH, MOCK_FEEDBACK_QUEUE, MOCK_EXECUTIVE_METRICS, MOCK_ANONYMIZED_HISTORICAL_CASES } from './data/mockData';
import { CaseItem, FindingItem, PatternRule, ValidationRule, LearningFeedback, HistoricalFilter, WhatIfScenarioParams, ValidationAnalysisRun, ReportFormat, ReportType, VoyagePublishResponse, ValidationDrillDownItem } from './types/tdv';
import { evaluateCaseScoring } from './services/scoringEngine';
import { filterHistoricalDataset, simulateWhatIfScenario } from './services/scenarioEngine';
import { runValidationAnalysis, publishToVoyageManagement } from './services/validationAnalysisEngine';
import { generateReportFile } from './services/reportGeneratorService';
import { ValidationDrillDownModal } from './components/ValidationDrillDownModal';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('F9');
  
  // Drill-Down Rationale Modal State
  const [selectedDrillDownItem, setSelectedDrillDownItem] = useState<ValidationDrillDownItem | null>(null);

  // Cases State (F1/F9)
  const [cases, setCases] = useState<CaseItem[]>(MOCK_CASES);
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // F1 Ingestion & OCR State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [activeF1CaseId, setActiveF1CaseId] = useState<string>(MOCK_CASES[0].id);

  // F1 Selection & Deselect State for Validation Trigger
  const [selectedF1FileIds, setSelectedF1FileIds] = useState<string[]>(MOCK_CASES.map(c => c.id));

  // F1 Trigger Validation Analysis & Report State
  const [activeAnalysisRun, setActiveAnalysisRun] = useState<ValidationAnalysisRun | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [selectedReportType, setSelectedReportType] = useState<ReportType>('Executive Summary');
  const [selectedReportFormat, setSelectedReportFormat] = useState<ReportFormat>('PDF');
  const [voyagePublishResult, setVoyagePublishResult] = useState<VoyagePublishResponse | null>(null);

  // Executive Analytics Filters State (F9)
  const [execStatusFilter, setExecStatusFilter] = useState<string>('ALL');
  const [execRiskBandFilter, setExecRiskBandFilter] = useState<string>('ALL');
  const [execDocTypeFilter, setExecDocTypeFilter] = useState<string>('ALL');
  const [execVendorFilter, setExecVendorFilter] = useState<string>('ALL');
  const [execSearchQuery, setExecSearchQuery] = useState<string>('');

  // Patterns State (F2)
  const [patterns, setPatterns] = useState<PatternRule[]>(MOCK_PATTERNS);
  const [testInput, setTestInput] = useState<string>('GB99823010');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [editingPattern, setEditingPattern] = useState<PatternRule | null>(null);
  const [isPatternModalOpen, setIsPatternModalOpen] = useState<boolean>(false);

  // Rules State (F3)
  const [rules, setRules] = useState<ValidationRule[]>(MOCK_RULES);
  const [editingRule, setEditingRule] = useState<ValidationRule | null>(null);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState<boolean>(false);

  // F5 Scoring Simulator State
  const [simProb, setSimProb] = useState<number>(0.85);
  const [simExposure, setSimExposure] = useState<number>(50000);
  const [simHasCritical, setSimHasCritical] = useState<boolean>(true);

  // F8 Learning Feedback State
  const [feedbackList, setFeedbackList] = useState<LearningFeedback[]>(MOCK_FEEDBACK_QUEUE);
  const [feedbackComment, setFeedbackComment] = useState<string>('');

  // F10 What-If Analytics State
  const [historicalFilter, setHistoricalFilter] = useState<HistoricalFilter>({
    sector: 'ALL',
    documentType: 'ALL',
    minValue: 0,
    maxValue: 2000000,
    riskBand: 'ALL'
  });

  const [scenarioParams, setScenarioParams] = useState<WhatIfScenarioParams>({
    name: 'Q4 Compliance Audit Scenario',
    vatStrictnessWeight: 1.2,
    rateTolerancePct: 3.0,
    aisMismatchStrictness: 1.5,
    sanctionsFuzzyThreshold: 80,
    autoApproveScoreFloor: 90
  });

  // New Case Modal state
  const [newCaseVendor, setNewCaseVendor] = useState<string>('');
  const [newCaseDocType, setNewCaseDocType] = useState<string>('Commercial Tax Invoice');
  const [newCaseValue, setNewCaseValue] = useState<number>(75000);
  const [isCaseModalOpen, setIsCaseModalOpen] = useState<boolean>(false);

  // Target Case for F1 Validation Analysis
  const currentF1Case = cases.find(c => c.id === activeF1CaseId) || cases[0] || MOCK_CASES[0];

  // Ingestion & Selection Handlers
  const processUploadedFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    const newCreatedCases: CaseItem[] = fileArray.map((file, idx) => {
      const docId = `DOC-INGEST-${Math.floor(10000 + Math.random() * 90000)}`;
      const caseId = `TDV-2026-${Math.floor(1000 + Math.random() * 9000 + idx)}`;

      const isPdf = file.name.endsWith('.pdf');
      const isDocx = file.name.endsWith('.docx');
      const docType = isPdf ? 'Charter Party Agreement' : isDocx ? 'Marine Insurance Policy' : 'Commercial Tax Invoice';

      return {
        id: caseId,
        documentId: docId,
        documentType: docType,
        vendorName: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
        submissionDate: new Date().toISOString().replace('T', ' ').slice(0, 19),
        claimValue: Math.floor(25000 + Math.random() * 200000),
        currency: 'USD',
        status: 'IN_REVIEW',
        assignedAnalyst: 'Ashwani Sethi (Lead Auditor)',
        overallScore: Math.floor(70 + Math.random() * 25),
        expectedLoss: Math.floor(5000 + Math.random() * 25000),
        riskCategory: 'MEDIUM',
        hasCriticalGap: false,
        findings: [
          {
            id: `FND-${Math.floor(10 + Math.random() * 90)}`,
            ruleId: 'RULE-CP-001',
            ruleName: 'BIMCO Laytime & Demurrage Check',
            severity: 'MEDIUM',
            probability: 0.25,
            exposure: 15000,
            expectedLoss: 3750,
            description: 'Notice of Readiness (NOR) timestamp validated against port log.',
            remediation: 'Confirm SHINC laytime deduction limits.'
          }
        ],
        metadata: {
          fileName: file.name,
          fileSize: `${(file.size / 1024).toFixed(1)} KB`,
          ocrConfidence: 98.2,
          lineItemCount: 8
        },
        lineageId: `LIN-${Math.floor(1000 + Math.random() * 9000)}-DAG`
      };
    });

    const updatedCases = [...newCreatedCases, ...cases];
    setCases(updatedCases);
    setActiveF1CaseId(newCreatedCases[0].id);

    // Auto-select newly uploaded files
    const newIds = newCreatedCases.map(c => c.id);
    setSelectedF1FileIds(prev => [...newIds, ...prev]);

    const names = fileArray.map(f => f.name).join(', ');
    setUploadedFileName(fileArray.length === 1 ? names : `${fileArray.length} files (${names})`);
    setActiveAnalysisRun(null);
    setVoyagePublishResult(null);
  };

  const handleFileBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processUploadedFiles(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processUploadedFiles(e.dataTransfer.files);
    }
  };

  // Selection / Deselection Handlers
  const handleToggleSelectFile = (id: string) => {
    if (selectedF1FileIds.includes(id)) {
      setSelectedF1FileIds(selectedF1FileIds.filter(i => i !== id));
    } else {
      setSelectedF1FileIds([...selectedF1FileIds, id]);
    }
  };

  const handleSelectAllF1Files = (selectAll: boolean) => {
    if (selectAll) {
      setSelectedF1FileIds(cases.map(c => c.id));
    } else {
      setSelectedF1FileIds([]);
    }
  };

  const handleRemoveF1File = (id: string) => {
    setCases(cases.filter(c => c.id !== id));
    setSelectedF1FileIds(selectedF1FileIds.filter(i => i !== id));
    if (activeF1CaseId === id && cases.length > 1) {
      setActiveF1CaseId(cases.find(c => c.id !== id)?.id || '');
    }
  };

  const handleClearAllF1Files = () => {
    if (window.confirm('Clear all ingested files from the F1 queue?')) {
      setCases([]);
      setSelectedF1FileIds([]);
      setActiveF1CaseId('');
      setActiveAnalysisRun(null);
      setUploadedFileName(null);
      setVoyagePublishResult(null);
    }
  };

  // Batch Trigger Validation Analysis Handler
  const handleTriggerValidationAnalysis = () => {
    if (selectedF1FileIds.length === 0) {
      alert('Please select at least one document to trigger validation analysis.');
      return;
    }

    setIsAnalyzing(true);
    setTimeout(() => {
      // Run analysis on current active target document or first selected document
      const target = cases.find(c => selectedF1FileIds.includes(c.id)) || currentF1Case;
      const runRes = runValidationAnalysis(target, rules, patterns);
      setActiveAnalysisRun(runRes);
      setIsAnalyzing(false);
    }, 800);
  };

  // Report Download Handler
  const handleDownloadReport = async (format: ReportFormat) => {
    try {
      if (!currentF1Case) {
        alert('Please select or ingest a case document first.');
        return;
      }
      await generateReportFile(currentF1Case, activeAnalysisRun, selectedReportType, format);
    } catch (err: any) {
      console.error('Failed to generate report file:', err);
      alert(`Report Generation Error: ${err?.message || err}`);
    }
  };

  // Publish to Tegrity Voyage Management Handler
  const handlePublishToVoyage = () => {
    const res = publishToVoyageManagement(currentF1Case);
    setVoyagePublishResult(res);

    setCases(cases.map(c => c.id === currentF1Case.id ? { ...c, status: 'PUBLISHED_TO_VOYAGE' } : c));
  };

  // Validation Assessment Drill Down Tile Handlers
  const handleOpenGapDrillDown = (gap: any) => {
    const drillItem: ValidationDrillDownItem = {
      id: gap.ruleId || `GAP-${Math.random().toString(36).substring(2, 7)}`,
      ruleId: gap.ruleId || 'RULE-CAT-01',
      title: gap.title || 'Validation Assessment Gap',
      gapType: gap.gapType || 'COMPLIANCE_GAP',
      severity: gap.severity || 'HIGH',
      safeguardOpportunity: gap.safeguardOpportunity || 'Enforce standard rider clause in contract.',
      rationale: gap.rationale || `Validation assessment flagged an operational variance against rule catalog ${gap.ruleId}. Technical compliance verification requires remediation.`,
      sourceExcerpt: gap.sourceExcerpt || `"...Extracted document clause text snippet: ${gap.title}. Verified under document ID ${currentF1Case.documentId}..."`,
      scoreImpact: gap.scoreImpact || 15,
      expectedLoss: gap.expectedLoss || Math.round(currentF1Case.claimValue * 0.1),
      clauseRef: gap.clauseRef || 'Clause 14.B (BIMCO Standard)',
      confidenceScore: gap.confidenceScore || 94.8,
      auditorAction: gap.auditorAction || 'Enforce rider clause endorsement and obtain SME sign-off.'
    };
    setSelectedDrillDownItem(drillItem);
  };

  const handleOpenFindingDrillDown = (finding: FindingItem, targetCase: CaseItem) => {
    const drillItem: ValidationDrillDownItem = {
      id: finding.id,
      ruleId: finding.ruleId,
      title: finding.ruleName || finding.description,
      gapType: finding.severity === 'CRITICAL' || finding.severity === 'HIGH' ? 'COMPLIANCE_GAP' : 'FINANCIAL_EXPOSURE',
      severity: finding.severity,
      safeguardOpportunity: finding.remediation || 'Enforce rider clause and require counterparty bank indemnity.',
      rationale: finding.description || `Rule [${finding.ruleId}] failed validation check. Claim exposure calculated at $${finding.exposure.toLocaleString()} with probability weight ${finding.probability}.`,
      sourceExcerpt: `"...Case ${targetCase.id} (${targetCase.vendorName}) - Invoiced claim value: $${targetCase.claimValue.toLocaleString()}..."`,
      scoreImpact: Math.round(finding.probability * 25),
      expectedLoss: finding.expectedLoss || Math.round(finding.exposure * finding.probability),
      clauseRef: `Rule ID: ${finding.ruleId}`,
      confidenceScore: Math.round(85 + finding.probability * 14),
      auditorAction: finding.severity === 'CRITICAL' ? 'Halt Approval & Demand Indemnity Guarantee' : 'Require SME Reviewer Sign-off'
    };
    setSelectedDrillDownItem(drillItem);
  };

  const handlePushToContinuousLearning = (item: ValidationDrillDownItem) => {
    const newFeedback: LearningFeedback = {
      id: `LFB-AUTO-${Date.now()}`,
      caseId: currentF1Case?.id || 'TDV-2026-001',
      findingId: item.id,
      auditorName: 'Continuous Learning Trigger',
      originalScore: currentF1Case?.overallScore || 75,
      adjustedScore: Math.max(0, (currentF1Case?.overallScore || 75) - item.scoreImpact),
      auditorDecision: 'RATIFIED_RULE_ADDITION',
      reasonCode: 'VALIDATION_DRILLDOWN_ENRICHMENT',
      comment: `Auto-enrolled from Drill Down Tile: ${item.title} - ${item.safeguardOpportunity}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      learningStatus: 'APPROVED_FOR_CATALOG'
    };
    setFeedbackList([newFeedback, ...feedbackList]);
  };

  // Case Handlers
  const handleCreateCase = () => {
    if (!newCaseVendor) return;
    const newCase: CaseItem = {
      id: `TDV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      documentId: `DOC-${Math.floor(10000 + Math.random() * 90000)}`,
      documentType: newCaseDocType,
      vendorName: newCaseVendor,
      submissionDate: new Date().toISOString().replace('T', ' ').slice(0, 19),
      claimValue: newCaseValue,
      currency: 'USD',
      status: 'IN_REVIEW',
      assignedAnalyst: 'Ashwani Sethi (Lead Auditor)',
      overallScore: 82,
      expectedLoss: Math.round(newCaseValue * 0.1),
      riskCategory: newCaseValue > 100000 ? 'HIGH' : 'MEDIUM',
      hasCriticalGap: false,
      findings: [
        {
          id: `FND-${Math.floor(10 + Math.random() * 90)}`,
          ruleId: 'RULE-AMT-002',
          ruleName: 'Line Item Quantity x Rate Check',
          severity: 'MEDIUM',
          probability: 0.35,
          exposure: newCaseValue * 0.1,
          expectedLoss: newCaseValue * 0.035,
          description: 'Standard arithmetic validation flag pending auditor confirmation.',
          remediation: 'Verify rate quote against SAP contract master.'
        }
      ],
      metadata: { ocrConfidence: 97.5, lineItemCount: 6 },
      lineageId: `LIN-${Math.floor(1000 + Math.random() * 9000)}-DAG`
    };

    setCases([newCase, ...cases]);
    setSelectedF1FileIds([newCase.id, ...selectedF1FileIds]);
    setActiveF1CaseId(newCase.id);
    setIsCaseModalOpen(false);
    setNewCaseVendor('');
  };

  const handleDeleteCase = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete case ${id}?`)) {
      setCases(cases.filter(c => c.id !== id));
      setSelectedF1FileIds(selectedF1FileIds.filter(i => i !== id));
      if (selectedCase?.id === id) setSelectedCase(null);
    }
  };

  // Pattern Handlers
  const handleSavePattern = () => {
    if (!editingPattern?.name || !editingPattern?.regexPattern) return;
    if (patterns.some(p => p.id === editingPattern.id)) {
      setPatterns(patterns.map(p => p.id === editingPattern.id ? editingPattern : p));
    } else {
      setPatterns([...patterns, editingPattern]);
    }
    setIsPatternModalOpen(false);
    setEditingPattern(null);
  };

  const handleDeletePattern = (id: string) => {
    if (window.confirm(`Delete pattern ${id}?`)) {
      setPatterns(patterns.filter(p => p.id !== id));
    }
  };

  // Rule Handlers
  const handleSaveRule = () => {
    if (!editingRule?.name || !editingRule?.code) return;
    if (rules.some(r => r.id === editingRule.id)) {
      setRules(rules.map(r => r.id === editingRule.id ? editingRule : r));
    } else {
      setRules([...rules, editingRule]);
    }
    setIsRuleModalOpen(false);
    setEditingRule(null);
  };

  const handleDeleteRule = (id: string) => {
    if (window.confirm(`Delete validation rule ${id}?`)) {
      setRules(rules.filter(r => r.id !== id));
    }
  };

  const handleToggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const handleTestPattern = (pat: PatternRule) => {
    try {
      const regex = new RegExp(pat.regexPattern);
      const isMatch = regex.test(testInput);
      setTestResult(isMatch ? `MATCH: "${testInput}" satisfies ${pat.name}` : `INVALID: "${testInput}" failed ${pat.name}`);
    } catch (e: any) {
      setTestResult(`REGEX ERROR: ${e.message}`);
    }
  };

  // What-If Scenario Evaluation
  const scopedHistoricalCases = filterHistoricalDataset(MOCK_ANONYMIZED_HISTORICAL_CASES, historicalFilter);
  const scenarioResult = simulateWhatIfScenario(scopedHistoricalCases, scenarioParams);

  const handlePublishScenarioToLearning = () => {
    const newFeedbacks: LearningFeedback[] = scenarioResult.recommendedWeightUpdates.map((rec, idx) => ({
      id: `FB-SCENARIO-${Date.now()}-${idx}`,
      caseId: 'HISTORICAL-BATCH-ANALYSIS',
      findingId: rec.ruleId,
      auditorName: 'What-If Scenario Sandbox Engine',
      originalScore: 75,
      adjustedScore: 88,
      auditorDecision: 'UPDATE_RULE_WEIGHT',
      reasonCode: 'SCENARIO_RESEARCH_OPTIMIZATION',
      comment: rec.rationale,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      learningStatus: 'PROPOSED_TRAINING_WEIGHT'
    }));

    setFeedbackList([...newFeedbacks, ...feedbackList]);
    alert(`Successfully published ${newFeedbacks.length} rule weight optimization recommendations to Continuous Learning (F8)!`);
    setActiveTab('F8');
  };

  const filteredCases = cases.filter(c => 
    c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.documentType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Executive Analytics Filters Calculations (F9)
  const execFilteredCases = cases.filter(c => {
    const matchesSearch = !execSearchQuery || 
      c.id.toLowerCase().includes(execSearchQuery.toLowerCase()) ||
      c.vendorName.toLowerCase().includes(execSearchQuery.toLowerCase()) ||
      c.documentType.toLowerCase().includes(execSearchQuery.toLowerCase());
    
    const matchesStatus = execStatusFilter === 'ALL' || c.status === execStatusFilter;
    const matchesRisk = execRiskBandFilter === 'ALL' || c.riskCategory.toUpperCase() === execRiskBandFilter.toUpperCase();
    const matchesDocType = execDocTypeFilter === 'ALL' || c.documentType === execDocTypeFilter;
    const matchesVendor = execVendorFilter === 'ALL' || c.vendorName === execVendorFilter;

    return matchesSearch && matchesStatus && matchesRisk && matchesDocType && matchesVendor;
  });

  const uniqueDocTypes = Array.from(new Set(cases.map(c => c.documentType)));
  const uniqueVendors = Array.from(new Set(cases.map(c => c.vendorName)));
  const uniqueStatuses = Array.from(new Set(cases.map(c => c.status)));
  const uniqueRiskBands = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'];

  const handleResetExecFilters = () => {
    setExecStatusFilter('ALL');
    setExecRiskBandFilter('ALL');
    setExecDocTypeFilter('ALL');
    setExecVendorFilter('ALL');
    setExecSearchQuery('');
  };

  const execTotalValue = execFilteredCases.reduce((acc, c) => acc + c.claimValue, 0);
  const execTotalLoss = execFilteredCases.reduce((acc, c) => acc + c.expectedLoss, 0);
  const execAvgScore = execFilteredCases.length ? Math.round(execFilteredCases.reduce((acc, c) => acc + c.overallScore, 0) / execFilteredCases.length) : 0;
  const execHighRiskCount = execFilteredCases.filter(c => c.riskCategory === 'HIGH' || c.riskCategory === 'CRITICAL' || c.hasCriticalGap).length;

  const isAllSelected = cases.length > 0 && selectedF1FileIds.length === cases.length;

  return (
    <div className="app-container">
      {/* Hidden File Input supporting Multiple Selection */}
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        accept=".pdf,.png,.jpg,.jpeg,.docx"
        multiple
        onChange={handleFileInputChange}
      />

      {/* Top Console Header */}
      <header className="top-bar">
        <div className="brand-title">
          <div className="brand-logo">T</div>
          <div>
            <span className="brand-text">TEGRITY DOCUMENT VALIDATION ENGINE</span>
            <span style={{ color: 'var(--text-dim)', fontSize: '12px', marginLeft: '8px' }}>v1.2 Enriched</span>
          </div>
          <span className="brand-badge">CLOUDRUN LIVE</span>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <input 
            type="text" 
            placeholder="Search cases, docs, vendors..." 
            className="search-box"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="btn btn-primary" onClick={() => setIsCaseModalOpen(true)}>+ New Case</button>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            User: <strong style={{ color: 'var(--text-main)' }}>Ashwani Sethi (Lead Auditor)</strong>
          </div>
        </div>
      </header>

      {/* Navigation Tabs F1 - F10 */}
      <nav className="nav-tabs">
        <button className={`nav-tab ${activeTab === 'F9' ? 'active' : ''}`} onClick={() => setActiveTab('F9')}>F9: Executive Analytics</button>
        <button className={`nav-tab ${activeTab === 'F1' ? 'active' : ''}`} onClick={() => setActiveTab('F1')}>F1: Ingestion & OCR</button>
        <button className={`nav-tab ${activeTab === 'F10' ? 'active' : ''}`} onClick={() => setActiveTab('F10')}>F10: What-If Analytics Sandbox</button>
        <button className={`nav-tab ${activeTab === 'F2' ? 'active' : ''}`} onClick={() => setActiveTab('F2')}>F2: Pattern Library</button>
        <button className={`nav-tab ${activeTab === 'F3' ? 'active' : ''}`} onClick={() => setActiveTab('F3')}>F3: Rule Catalog</button>
        <button className={`nav-tab ${activeTab === 'F4' ? 'active' : ''}`} onClick={() => setActiveTab('F4')}>F4: Cross-Validation API</button>
        <button className={`nav-tab ${activeTab === 'F5' ? 'active' : ''}`} onClick={() => setActiveTab('F5')}>F5: Scoring Engine (Math)</button>
        <button className={`nav-tab ${activeTab === 'F6' ? 'active' : ''}`} onClick={() => setActiveTab('F6')}>F6: Lineage & DAG</button>
        <button className={`nav-tab ${activeTab === 'F7' ? 'active' : ''}`} onClick={() => setActiveTab('F7')}>F7: OPA & SoD Audit</button>
        <button className={`nav-tab ${activeTab === 'F8' ? 'active' : ''}`} onClick={() => setActiveTab('F8')}>F8: Continuous Learning</button>
      </nav>

      {/* Main Panel Content */}
      <main className="main-content">
        {/* F9: Executive Dashboard & Analytics with Dynamic Filters */}
        {activeTab === 'F9' && (
          <div>
            {/* Filter Control Bar */}
            <div className="sub" style={{ marginBottom: '20px' }}>
              <div className="sub-header" style={{ marginBottom: '16px' }}>
                <div className="sub-title">
                  <span className="pip cyan"></span>
                  🔍 Executive Analytics Filter Panel
                  <span className="badge badge-indigo" style={{ marginLeft: '12px' }}>
                    Showing {execFilteredCases.length} of {cases.length} Cases
                  </span>
                </div>
                {(execStatusFilter !== 'ALL' || execRiskBandFilter !== 'ALL' || execDocTypeFilter !== 'ALL' || execVendorFilter !== 'ALL' || execSearchQuery) && (
                  <button className="btn btn-secondary" style={{ fontSize: '12px', border: '1px solid var(--amber)', color: 'var(--amber)' }} onClick={handleResetExecFilters}>
                    🔄 Reset All Filters
                  </button>
                )}
              </div>

              {/* Filter Controls Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>
                    🔍 Keyword Search
                  </label>
                  <input 
                    type="text" 
                    className="search-box" 
                    style={{ width: '100%', height: '36px' }} 
                    placeholder="Case ID, Vendor, Doc Type..." 
                    value={execSearchQuery}
                    onChange={(e) => setExecSearchQuery(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>
                    Workflow Status
                  </label>
                  <select 
                    className="search-box" 
                    style={{ width: '100%', height: '36px', backgroundColor: 'var(--surface-0)', color: 'var(--text-main)' }}
                    value={execStatusFilter}
                    onChange={(e) => setExecStatusFilter(e.target.value)}
                  >
                    <option value="ALL">All Statuses</option>
                    {uniqueStatuses.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>
                    Risk Category
                  </label>
                  <select 
                    className="search-box" 
                    style={{ width: '100%', height: '36px', backgroundColor: 'var(--surface-0)', color: 'var(--text-main)' }}
                    value={execRiskBandFilter}
                    onChange={(e) => setExecRiskBandFilter(e.target.value)}
                  >
                    <option value="ALL">All Risk Bands</option>
                    {uniqueRiskBands.map(rb => (
                      <option key={rb} value={rb}>{rb}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>
                    Document Type
                  </label>
                  <select 
                    className="search-box" 
                    style={{ width: '100%', height: '36px', backgroundColor: 'var(--surface-0)', color: 'var(--text-main)' }}
                    value={execDocTypeFilter}
                    onChange={(e) => setExecDocTypeFilter(e.target.value)}
                  >
                    <option value="ALL">All Document Types</option>
                    {uniqueDocTypes.map(dt => (
                      <option key={dt} value={dt}>{dt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>
                    Vendor / Counterparty
                  </label>
                  <select 
                    className="search-box" 
                    style={{ width: '100%', height: '36px', backgroundColor: 'var(--surface-0)', color: 'var(--text-main)' }}
                    value={execVendorFilter}
                    onChange={(e) => setExecVendorFilter(e.target.value)}
                  >
                    <option value="ALL">All Vendors</option>
                    {uniqueVendors.map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Dynamic Executive Metric Tiles (Recalculates based on Filter Scope) */}
            <div className="grid-metrics" style={{ marginBottom: '24px' }}>
              <div className="tile">
                <div className="tile-label">Scoped Ingested Cases</div>
                <div className="t-big">{execFilteredCases.length}</div>
                <div className="tile-sub" style={{ color: 'var(--cyan)' }}>
                  {((execFilteredCases.length / Math.max(1, cases.length)) * 100).toFixed(0)}% of total queue
                </div>
              </div>

              <div className="tile">
                <div className="tile-label">Scoped Financial Exposure</div>
                <div className="t-big">${(execTotalValue / 1000).toFixed(1)}k</div>
                <div className="tile-sub" style={{ color: 'var(--emerald)' }}>
                  Total claim value in scope
                </div>
              </div>

              <div className="tile">
                <div className="tile-label">Expected Financial Loss ($EL)</div>
                <div className="t-big" style={{ color: 'var(--crimson)' }}>${(execTotalLoss / 1000).toFixed(1)}k</div>
                <div className="tile-sub" style={{ color: 'var(--crimson)' }}>
                  Probability-weighted loss
                </div>
              </div>

              <div className="tile">
                <div className="tile-label">Average Compliance Score</div>
                <div className="t-big" style={{ color: execAvgScore >= 90 ? 'var(--emerald)' : execAvgScore >= 60 ? 'var(--amber)' : 'var(--crimson)' }}>
                  {execAvgScore} / 100
                </div>
                <div className="tile-sub" style={{ color: 'var(--text-muted)' }}>
                  High Risk Cases: {execHighRiskCount}
                </div>
              </div>
            </div>

            {/* Active Validation Work Queue Table */}
            <div className="sub">
              <div className="sub-header">
                <div className="sub-title">
                  <span className="pip cyan"></span>
                  Active Validation Work Queue ({execFilteredCases.length} Matching Cases)
                </div>
                <button className="btn btn-primary" onClick={() => setIsCaseModalOpen(true)}>+ Create Validation Case</button>
              </div>

              <div className="dtable-wrapper">
                <table className="dtable">
                  <thead>
                    <tr>
                      <th>Case ID</th>
                      <th>Document Type</th>
                      <th>Vendor Name</th>
                      <th>Claim Value</th>
                      <th>Compounded Score</th>
                      <th>Expected Loss</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {execFilteredCases.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                          No validation cases match the selected filter criteria. Click "Reset All Filters" to view all cases.
                        </td>
                      </tr>
                    ) : (
                      execFilteredCases.map(c => (
                        <tr key={c.id} onClick={() => setSelectedCase(c)}>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{c.id}</td>
                          <td>{c.documentType}</td>
                          <td style={{ fontWeight: 500 }}>{c.vendorName}</td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>${c.claimValue.toLocaleString()}</td>
                          <td>
                            <span className={`badge ${c.overallScore >= 90 ? 'badge-emerald' : c.overallScore >= 60 ? 'badge-amber' : 'badge-crimson'}`}>
                              {c.overallScore} / 100
                            </span>
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', color: c.expectedLoss > 20000 ? 'var(--crimson)' : 'var(--emerald)' }}>
                            ${c.expectedLoss.toLocaleString()}
                          </td>
                          <td>
                            <span className={`badge ${c.status === 'PUBLISHED_TO_VOYAGE' ? 'badge-indigo' : c.status === 'APPROVED' ? 'badge-emerald' : c.status === 'FLAGGED' ? 'badge-crimson' : 'badge-amber'}`}>
                              {c.status}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }}>Inspect</button>
                              <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={(e) => handleDeleteCase(c.id, e)}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* F1: Ingestion & OCR with Selection/Deselection File Table, Clear List, Drag & Drop, Multi-Format Reports & Voyage Publishing */}
        {activeTab === 'F1' && (
          <div>
            <div className="sub">
              <div className="sub-header">
                <div className="sub-title">
                  <span className="pip cyan"></span>
                  F1: Document Ingestion, OCR Parser & Validation Trigger Queue
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span className="badge badge-indigo">Selected: {selectedF1FileIds.length} / {cases.length}</span>
                  <button className="btn btn-primary" onClick={handleTriggerValidationAnalysis} disabled={isAnalyzing || selectedF1FileIds.length === 0}>
                    {isAnalyzing ? '⌛ Running Validation Analysis...' : `⚡ Trigger Validation (${selectedF1FileIds.length})`}
                  </button>
                  <button className="btn btn-secondary" style={{ backgroundColor: 'var(--indigo)', color: '#fff' }} onClick={handlePublishToVoyage} disabled={!currentF1Case}>
                    🚀 Publish to Tegrity Voyage
                  </button>
                  <button className="btn btn-danger" onClick={handleClearAllF1Files} disabled={cases.length === 0}>
                    🗑️ Clear File Queue
                  </button>
                </div>
              </div>

              {/* Upload Notification Banner */}
              {uploadedFileName && (
                <div className="callout" style={{ borderColor: 'var(--cyan)', backgroundColor: 'rgba(6, 182, 212, 0.1)' }}>
                  <div className="callout-title" style={{ color: 'var(--cyan)' }}>
                    ✓ Ingested Document Batch: {uploadedFileName}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Extracted metadata, verified checksum digests. Selected {selectedF1FileIds.length} file(s) for validation analysis.
                  </div>
                </div>
              )}

              {/* Published Confirmation Notification Banner */}
              {voyagePublishResult && (
                <div className="callout" style={{ borderColor: 'var(--emerald)', backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                  <div className="callout-title" style={{ color: 'var(--emerald)' }}>
                    ✓ Document Successfully Published to Tegrity Voyage Management!
                  </div>
                  <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                    Publish ID: {voyagePublishResult.publishId} | Tx Hash: {voyagePublishResult.txHash} | Target: {voyagePublishResult.targetSystem}
                  </div>
                </div>
              )}

              {/* Interactive Drag & Drop Area */}
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{ 
                  border: `2px dashed ${isDraggingOver ? 'var(--cyan)' : 'var(--surface-2)'}`, 
                  backgroundColor: isDraggingOver ? 'rgba(6, 182, 212, 0.08)' : 'transparent',
                  borderRadius: '8px', 
                  padding: '24px', 
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  marginBottom: '24px'
                }}
                onClick={handleFileBrowseClick}
              >
                <div style={{ fontSize: '32px', marginBottom: '6px' }}>📂</div>
                <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>
                  {isDraggingOver ? 'Drop Files Here to Ingest Documents' : 'Drag & Drop Multiple Files (PDF, PNG, DOCX)'}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '12px' }}>
                  Or click to browse and select multiple files from your computer.
                </div>
                <button className="btn btn-primary" onClick={(e) => { e.stopPropagation(); handleFileBrowseClick(); }}>
                  📁 Browse Multiple Files
                </button>
              </div>

              {/* Ingested Files Display Table with Checkboxes */}
              <div className="sub-header" style={{ marginBottom: '12px', borderBottom: 'none', paddingBottom: 0 }}>
                <div className="sub-title" style={{ fontSize: '14px' }}>
                  Ingested Files Queue ({cases.length} Documents)
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => handleSelectAllF1Files(!isAllSelected)}>
                    {isAllSelected ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
              </div>

              <div className="dtable-wrapper">
                <table className="dtable">
                  <thead>
                    <tr>
                      <th style={{ width: '40px', textAlign: 'center' }}>
                        <input 
                          type="checkbox" 
                          checked={isAllSelected}
                          onChange={(e) => handleSelectAllF1Files(e.target.checked)}
                        />
                      </th>
                      <th>Case ID / Doc ID</th>
                      <th>Document Type</th>
                      <th>Vendor Name</th>
                      <th>Value (USD)</th>
                      <th>OCR Quality</th>
                      <th>Target Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cases.map(c => {
                      const isSelected = selectedF1FileIds.includes(c.id);
                      const isActiveTarget = c.id === activeF1CaseId;

                      return (
                        <tr 
                          key={c.id} 
                          style={{ backgroundColor: isActiveTarget ? 'rgba(6, 182, 212, 0.08)' : 'transparent' }}
                          onClick={() => setActiveF1CaseId(c.id)}
                        >
                          <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              onChange={() => handleToggleSelectFile(c.id)}
                            />
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                            {c.id} <span style={{ color: 'var(--text-dim)', fontSize: '11px' }}>({c.documentId})</span>
                          </td>
                          <td>{c.documentType}</td>
                          <td style={{ fontWeight: 500 }}>{c.vendorName}</td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>${c.claimValue.toLocaleString()}</td>
                          <td>
                            <span className="badge badge-emerald">{c.metadata.ocrConfidence || 98.2}%</span>
                          </td>
                          <td>
                            <span className={`badge ${isSelected ? 'badge-emerald' : 'badge-amber'}`}>
                              {isSelected ? 'SELECTED FOR VALIDATION' : 'DESELECTED'}
                            </span>
                          </td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button 
                                className={`btn ${isSelected ? 'btn-secondary' : 'btn-primary'}`} 
                                style={{ padding: '3px 8px', fontSize: '11px' }}
                                onClick={() => handleToggleSelectFile(c.id)}
                              >
                                {isSelected ? 'Deselect' : 'Select'}
                              </button>
                              <button 
                                className="btn btn-danger" 
                                style={{ padding: '3px 8px', fontSize: '11px' }}
                                onClick={() => handleRemoveF1File(c.id)}
                              >
                                Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Validation Analysis Findings & Risk Grade Output */}
            {activeAnalysisRun && currentF1Case && (
              <div className="sub">
                <div className="sub-header">
                  <div className="sub-title">
                    <span className="pip emerald"></span>
                    Validation Analysis Results for Active Target: {currentF1Case.id} ({currentF1Case.vendorName})
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    Execution Time: {activeAnalysisRun.executionTimeMs}ms | Run ID: {activeAnalysisRun.runId}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', marginBottom: '24px' }}>
                  <div className="tile">
                    <div className="tile-label">Graded Risk Score</div>
                    <div className="t-big" style={{ color: activeAnalysisRun.riskScoreGrade >= 90 ? 'var(--emerald)' : activeAnalysisRun.riskScoreGrade >= 60 ? 'var(--amber)' : 'var(--crimson)' }}>
                      {activeAnalysisRun.riskScoreGrade} / 100
                    </div>
                    <div className="tile-sub">
                      Risk Band: <span className={`badge ${activeAnalysisRun.riskBand === 'LOW' ? 'badge-emerald' : 'badge-crimson'}`}>{activeAnalysisRun.riskBand}</span>
                    </div>
                  </div>

                  <div className="tile">
                    <div className="tile-label">Pattern Library Match Summary (Click pattern for rationale)</div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                      {activeAnalysisRun.patternMatches.map(pm => (
                        <span 
                          key={pm.patternId} 
                          className={`badge ${pm.status === 'MATCHED' ? 'badge-emerald' : 'badge-crimson'}`}
                          style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          title="Click to view pattern validation rationale tile"
                          onClick={() => handleOpenGapDrillDown({
                            ruleId: pm.patternId,
                            title: `Pattern Validation: ${pm.patternName}`,
                            gapType: 'PATTERN_MISMATCH',
                            severity: pm.status === 'MATCHED' ? 'LOW' : 'HIGH',
                            safeguardOpportunity: `Verify token extraction pattern against regex ${pm.regexPattern || '^[A-Z0-9]+$'}.`,
                            rationale: pm.rationale || `Pattern matching engine evaluated token structure for '${pm.patternName}'. Status: ${pm.status} (${pm.confidence}% confidence).`,
                            sourceExcerpt: `Pattern Regex: ${pm.regexPattern || '^[A-Z0-9_]+$'}. Extracted document token confidence: ${pm.confidence}%.`,
                            scoreImpact: pm.status === 'MATCHED' ? 0 : 12,
                            expectedLoss: pm.status === 'MATCHED' ? 0 : 35000,
                            clauseRef: `Pattern ID: ${pm.patternId}`,
                            confidenceScore: pm.confidence,
                            auditorAction: pm.status === 'MATCHED' ? 'Pattern verified successfully' : 'Update pattern library regex and re-scan document token stream'
                          })}
                        >
                          🔍 {pm.patternName} ({pm.confidence}%)
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Gap Analysis & Safeguard Opportunities Table */}
                <h4 style={{ marginBottom: '12px' }}>Compliance Gap Analysis & Safeguarding Opportunities</h4>
                <div className="dtable-wrapper">
                  <table className="dtable">
                    <thead>
                      <tr>
                        <th>Rule / Pattern ID</th>
                        <th>Title</th>
                        <th>Gap Type</th>
                        <th>Severity</th>
                        <th>Recommended Safeguard Opportunity</th>
                        <th>Assessment Rationale Tile</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeAnalysisRun.gapFindings.map((g, idx) => (
                        <tr key={idx}>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{g.ruleId}</td>
                          <td style={{ fontWeight: 500 }}>{g.title}</td>
                          <td><span className="badge badge-indigo">{g.gapType}</span></td>
                          <td>
                            <span className={`badge ${g.severity === 'CRITICAL' ? 'badge-crimson' : g.severity === 'HIGH' ? 'badge-amber' : 'badge-emerald'}`}>
                              {g.severity}
                            </span>
                          </td>
                          <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{g.safeguardOpportunity}</td>
                          <td>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '4px 10px', fontSize: '11px', border: '1px solid #38bdf8', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px' }}
                              onClick={() => handleOpenGapDrillDown(g)}
                            >
                              🔍 Drill Down Rationale
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Multi-Format Report Generator Section */}
            {currentF1Case && (
              <div className="sub">
                <div className="sub-header">
                  <div className="sub-title">
                    <span className="pip cyan"></span>
                    Multi-Format Report Generator (PowerPoint, PDF, Word Document)
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div>
                    <h4 style={{ marginBottom: '12px' }}>1. Select Report Target & Scope</h4>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                      <button 
                        className={`btn ${selectedReportType === 'Executive Summary' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setSelectedReportType('Executive Summary')}
                      >
                        Executive Summary Report
                      </button>
                      <button 
                        className={`btn ${selectedReportType === 'Detailed Audit Report' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setSelectedReportType('Detailed Audit Report')}
                      >
                        Detailed Technical Audit Report
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ marginBottom: '12px' }}>2. Generate & Download File</h4>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button className="btn btn-secondary" style={{ border: '1px solid #e11d48', color: '#fda4af' }} onClick={() => handleDownloadReport('PDF')}>
                        📄 Download PDF (.pdf)
                      </button>
                      <button className="btn btn-secondary" style={{ border: '1px solid #2563eb', color: '#93c5fd' }} onClick={() => handleDownloadReport('DOCX')}>
                        📝 Download Word (.docx)
                      </button>
                      <button className="btn btn-secondary" style={{ border: '1px solid #d97706', color: '#fde68a' }} onClick={() => handleDownloadReport('PPTX')}>
                        📊 Download PowerPoint (.pptx)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* F10: What-If Analytics & Scenario Sandbox */}
        {activeTab === 'F10' && (
          <div>
            <div className="sub">
              <div className="sub-header">
                <div className="sub-title">
                  <span className="pip cyan"></span>
                  F10: Analytical What-If Scenario Sandbox & Historical Dataset Scoping
                </div>
                <button className="btn btn-primary" onClick={handlePublishScenarioToLearning}>
                  ⚡ Publish Recommendations to Continuous Learning (F8)
                </button>
              </div>

              {/* Scoping Filter Bar */}
              <div className="callout" style={{ backgroundColor: 'var(--surface-1)', border: '1px solid var(--surface-2)' }}>
                <div className="callout-title" style={{ color: 'var(--cyan)' }}>Anonymized Historical Dataset Scoping Filters</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginTop: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-dim)', marginBottom: '4px' }}>Industry Sector</label>
                    <select 
                      className="search-box" 
                      style={{ width: '100%' }}
                      value={historicalFilter.sector}
                      onChange={(e) => setHistoricalFilter({ ...historicalFilter, sector: e.target.value })}
                    >
                      <option value="ALL">All Sectors</option>
                      <option value="Maritime & Freight">Maritime & Freight</option>
                      <option value="Energy & Utilities">Energy & Utilities</option>
                      <option value="Manufacturing">Manufacturing</option>
                      <option value="Technology & Services">Technology & Services</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-dim)', marginBottom: '4px' }}>Document Type</label>
                    <select 
                      className="search-box" 
                      style={{ width: '100%' }}
                      value={historicalFilter.documentType}
                      onChange={(e) => setHistoricalFilter({ ...historicalFilter, documentType: e.target.value })}
                    >
                      <option value="ALL">All Document Types</option>
                      <option value="Commercial Tax Invoice">Commercial Tax Invoice</option>
                      <option value="Bill of Lading">Bill of Lading</option>
                      <option value="Certificate of Origin">Certificate of Origin</option>
                      <option value="Marine Insurance Policy">Marine Insurance Policy</option>
                      <option value="Charter Party Agreement">Charter Party Agreement</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-dim)', marginBottom: '4px' }}>Max Claim Value Range</label>
                    <input 
                      type="range" 
                      min="50000" 
                      max="2000000" 
                      step="50000"
                      value={historicalFilter.maxValue}
                      onChange={(e) => setHistoricalFilter({ ...historicalFilter, maxValue: parseInt(e.target.value) })}
                      style={{ width: '100%' }}
                    />
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Up to ${historicalFilter.maxValue.toLocaleString()}</div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-dim)', marginBottom: '4px' }}>Risk Profile</label>
                    <select 
                      className="search-box" 
                      style={{ width: '100%' }}
                      value={historicalFilter.riskBand}
                      onChange={(e) => setHistoricalFilter({ ...historicalFilter, riskBand: e.target.value })}
                    >
                      <option value="ALL">All Risk Bands</option>
                      <option value="HIGH_CRITICAL">High Risk & Critical Cases Only</option>
                      <option value="LOW">Low Risk Auto-Approve Cases Only</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Scenario Tuning Parameters & Real-time Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '20px' }}>
                <div>
                  <h4 style={{ marginBottom: '16px', color: 'var(--text-main)' }}>Scenario Variable Perturbations</h4>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      VAT Verification Strictness Multiplier: {scenarioParams.vatStrictnessWeight}x
                    </label>
                    <input 
                      type="range" 
                      min="0.5" 
                      max="2.5" 
                      step="0.1" 
                      value={scenarioParams.vatStrictnessWeight}
                      onChange={(e) => setScenarioParams({ ...scenarioParams, vatStrictnessWeight: parseFloat(e.target.value) })}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      Line Item Rate Arithmetic Tolerance Window: {scenarioParams.rateTolerancePct}%
                    </label>
                    <input 
                      type="range" 
                      min="0" 
                      max="10" 
                      step="0.5" 
                      value={scenarioParams.rateTolerancePct}
                      onChange={(e) => setScenarioParams({ ...scenarioParams, rateTolerancePct: parseFloat(e.target.value) })}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      AIS Vessel Coordinate Mismatch Strictness: {scenarioParams.aisMismatchStrictness}x
                    </label>
                    <input 
                      type="range" 
                      min="1.0" 
                      max="3.0" 
                      step="0.2" 
                      value={scenarioParams.aisMismatchStrictness}
                      onChange={(e) => setScenarioParams({ ...scenarioParams, aisMismatchStrictness: parseFloat(e.target.value) })}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      OFAC Sanctions Fuzzy Match Threshold: {scenarioParams.sanctionsFuzzyThreshold}%
                    </label>
                    <input 
                      type="range" 
                      min="70" 
                      max="95" 
                      step="1" 
                      value={scenarioParams.sanctionsFuzzyThreshold}
                      onChange={(e) => setScenarioParams({ ...scenarioParams, sanctionsFuzzyThreshold: parseInt(e.target.value) })}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                {/* Comparative Analytics Results */}
                <div>
                  <h4 style={{ marginBottom: '16px', color: 'var(--text-main)' }}>Scenario Simulation Impact Dashboard</h4>
                  <div className="grid-metrics" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <div className="tile">
                      <div className="tile-label">Scoped Records</div>
                      <div className="t-big">{scenarioResult.scopedTotalCount}</div>
                      <div className="tile-sub">Value: ${scenarioResult.scopedTotalValue.toLocaleString()}</div>
                    </div>

                    <div className="tile">
                      <div className="tile-label">Auto-Approval Rate</div>
                      <div className="t-big" style={{ color: scenarioResult.scenarioAutoApprovePct >= scenarioResult.baselineAutoApprovePct ? 'var(--emerald)' : 'var(--amber)' }}>
                        {scenarioResult.scenarioAutoApprovePct}%
                      </div>
                      <div className="tile-sub">Baseline: {scenarioResult.baselineAutoApprovePct}%</div>
                    </div>

                    <div className="tile">
                      <div className="tile-label">Baseline Expected Loss</div>
                      <div className="t-big" style={{ color: 'var(--crimson)' }}>
                        ${scenarioResult.baselineTotalExpectedLoss.toLocaleString()}
                      </div>
                    </div>

                    <div className="tile">
                      <div className="tile-label">Scenario Expected Loss</div>
                      <div className="t-big" style={{ color: scenarioResult.netLossDelta >= 0 ? 'var(--emerald)' : 'var(--crimson)' }}>
                        ${scenarioResult.scenarioTotalExpectedLoss.toLocaleString()}
                      </div>
                      <div className="tile-sub" style={{ color: scenarioResult.netLossDelta >= 0 ? 'var(--emerald)' : 'var(--crimson)' }}>
                        Net Savings: ${scenarioResult.netLossDelta.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Scoped Historical Dataset Table */}
            <div className="sub">
              <div className="sub-header">
                <div className="sub-title">Scoped Anonymized Historical Case Dataset ({scopedHistoricalCases.length} Records)</div>
              </div>
              <div className="dtable-wrapper">
                <table className="dtable">
                  <thead>
                    <tr>
                      <th>Anonymized ID</th>
                      <th>Sector</th>
                      <th>Document Type</th>
                      <th>Claim Value</th>
                      <th>Original Score</th>
                      <th>VAT Status</th>
                      <th>Rate Variance</th>
                      <th>AIS Status</th>
                      <th>Sanctions Match</th>
                      <th>Outcome</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scopedHistoricalCases.map(c => (
                      <tr key={c.anonymizedId}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{c.anonymizedId}</td>
                        <td><span className="badge badge-indigo">{c.sector}</span></td>
                        <td>{c.documentType}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>${c.claimValue.toLocaleString()}</td>
                        <td>
                          <span className={`badge ${c.originalRiskScore >= 90 ? 'badge-emerald' : c.originalRiskScore >= 60 ? 'badge-amber' : 'badge-crimson'}`}>
                            {c.originalRiskScore} / 100
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${c.vatStatus === 'VALID' ? 'badge-emerald' : 'badge-crimson'}`}>{c.vatStatus}</span>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{c.rateDiscrepancyPct}%</td>
                        <td>
                          <span className={`badge ${c.aisLocationMismatch ? 'badge-crimson' : 'badge-emerald'}`}>
                            {c.aisLocationMismatch ? 'MISMATCH' : 'MATCHED'}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{c.sanctionsMatchRatio}%</td>
                        <td>
                          <span className={`badge ${c.historicalOutcome === 'APPROVED' ? 'badge-emerald' : 'badge-crimson'}`}>
                            {c.historicalOutcome}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* F2: Pattern Library */}
        {activeTab === 'F2' && (
          <div className="sub">
            <div className="sub-header">
              <div className="sub-title">F2: Section 15 Pattern Regex Engine (CRUD Enabled)</div>
              <button className="btn btn-primary" onClick={() => {
                setEditingPattern({
                  id: `PAT-NEW-${Date.now()}`,
                  name: '',
                  category: 'Tax Identification',
                  regexPattern: '',
                  confidenceThreshold: 90,
                  sampleMatches: [],
                  status: 'ACTIVE'
                });
                setIsPatternModalOpen(true);
              }}>+ Create Pattern</button>
            </div>

            <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input 
                type="text" 
                className="search-box" 
                placeholder="Test sample string (e.g. GB99823010)" 
                value={testInput} 
                onChange={(e) => setTestInput(e.target.value)}
                style={{ width: '340px' }}
              />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Click 'Test Regex' on any pattern below to evaluate match.</span>
            </div>

            {testResult && (
              <div className="callout" style={{ borderColor: testResult.startsWith('MATCH') ? 'var(--emerald)' : 'var(--crimson)' }}>
                <div className="callout-title" style={{ color: testResult.startsWith('MATCH') ? 'var(--emerald)' : 'var(--crimson)' }}>
                  {testResult}
                </div>
              </div>
            )}

            <div className="dtable-wrapper">
              <table className="dtable">
                <thead>
                  <tr>
                    <th>Pattern ID</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Regex Expression</th>
                    <th>Threshold</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {patterns.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{p.id}</td>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td><span className="badge badge-indigo">{p.category}</span></td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--cyan)' }}>{p.regexPattern}</td>
                      <td>{p.confidenceThreshold}%</td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => handleTestPattern(p)}>Test</button>
                          <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => { setEditingPattern(p); setIsPatternModalOpen(true); }}>Edit</button>
                          <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => handleDeletePattern(p.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* F3: Rule Catalog */}
        {activeTab === 'F3' && (
          <div className="sub">
            <div className="sub-header">
              <div className="sub-title">F3: Section 14 Business Rule Catalog (Shipping Governance Standards)</div>
              <button className="btn btn-primary" onClick={() => {
                setEditingRule({
                  id: `RULE-NEW-${Date.now()}`,
                  code: 'RULE_CUSTOM_CODE',
                  name: '',
                  description: '',
                  severity: 'HIGH',
                  enabled: true,
                  weight: 1.0,
                  thresholdScore: 85,
                  actionOnFailure: 'FLAG'
                });
                setIsRuleModalOpen(true);
              }}>+ Add Validation Rule</button>
            </div>
            <div className="dtable-wrapper">
              <table className="dtable">
                <thead>
                  <tr>
                    <th>Rule Code</th>
                    <th>Rule Name</th>
                    <th>Severity</th>
                    <th>Weight</th>
                    <th>Action On Failure</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{r.code}</td>
                      <td>{r.name}</td>
                      <td>
                        <span className={`badge ${r.severity === 'CRITICAL' ? 'badge-crimson' : r.severity === 'HIGH' ? 'badge-amber' : 'badge-emerald'}`}>
                          {r.severity}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{r.weight}x</td>
                      <td><span className="badge badge-indigo">{r.actionOnFailure}</span></td>
                      <td>
                        <span className={`pip ${r.enabled ? 'emerald' : 'crimson'}`}></span>
                        {r.enabled ? 'ENABLED' : 'DISABLED'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button className={`btn ${r.enabled ? 'btn-secondary' : 'btn-primary'}`} style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => handleToggleRule(r.id)}>
                            {r.enabled ? 'Disable' : 'Enable'}
                          </button>
                          <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => { setEditingRule(r); setIsRuleModalOpen(true); }}>Edit</button>
                          <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => handleDeleteRule(r.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* F4: Cross-Validation APIs */}
        {activeTab === 'F4' && (
          <div className="sub">
            <div className="sub-header">
              <div className="sub-title">F4: Real-time External API Integrations (HMRC Tax, AIS Radar, OFAC)</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div className="tile">
                <div className="tile-label">Tax Authority Gateway (VIES / HMRC)</div>
                <div style={{ marginTop: '12px' }}>
                  <span className="pip emerald"></span> Live Connector Online
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                  Latency: 142ms | Verified 1,290 VAT IDs today
                </div>
              </div>

              <div className="tile">
                <div className="tile-label">Maritime Satellite AIS Vessel Radar</div>
                <div style={{ marginTop: '12px' }}>
                  <span className="pip emerald"></span> AIS Stream Connected
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                  Tracking IMO 9812341 & 422 vessels in transit
                </div>
              </div>

              <div className="tile">
                <div className="tile-label">OFAC & UN Sanctions Screening Engine</div>
                <div style={{ marginTop: '12px' }}>
                  <span className="pip emerald"></span> Database Synced (v2026.10)
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                  Fuzzy Match Threshold: 80% Levenshtein Distance
                </div>
              </div>
            </div>
          </div>
        )}

        {/* F5: Mathematical Scoring Engine */}
        {activeTab === 'F5' && (
          <div className="sub">
            <div className="sub-header">
              <div className="sub-title">F5: Mathematical Scoring Engine Simulator (Section 18)</div>
            </div>

            <div className="callout">
              <div className="callout-title" style={{ color: 'var(--cyan)' }}>Section 18 Compounded Noisy-OR Formula</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', marginTop: '6px' }}>
                Expected Loss per Finding: EL_i = p_i * E_i <br/>
                Compounded Risk Probability: P_risk = 1 - PROD(1 - p_i) <br/>
                Critical Gap Floor Rule: If Critical Finding exists, Case Score = MIN(Score, 75)
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '20px' }}>
              <div>
                <h4 style={{ marginBottom: '12px' }}>Finding Risk Parameters</h4>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Finding Probability (p_i): {(simProb * 100).toFixed(0)}%
                  </label>
                  <input type="range" min="0.1" max="1.0" step="0.05" value={simProb} onChange={(e) => setSimProb(parseFloat(e.target.value))} style={{ width: '100%' }} />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Financial Exposure (E_i): ${simExposure.toLocaleString()}
                  </label>
                  <input type="range" min="1000" max="200000" step="5000" value={simExposure} onChange={(e) => setSimExposure(parseInt(e.target.value))} style={{ width: '100%' }} />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={simHasCritical} onChange={(e) => setSimHasCritical(e.target.checked)} />
                    Trigger Critical Compliance Failure Flag (Floor Cap @ 75)
                  </label>
                </div>
              </div>

              <div>
                <h4 style={{ marginBottom: '12px' }}>Real-time Output</h4>
                {(() => {
                  const res = evaluateCaseScoring([
                    { id: 'S1', ruleId: 'R1', ruleName: 'Simulated Rule', severity: simHasCritical ? 'CRITICAL' : 'HIGH', probability: simProb, exposure: simExposure, expectedLoss: simProb * simExposure, description: '', remediation: '' }
                  ], 100000);

                  return (
                    <div style={{ background: 'var(--surface-1)', padding: '20px', borderRadius: '8px' }}>
                      <div className="tile-label">Calculated Case Confidence Score</div>
                      <div className="t-big" style={{ color: res.caseScore >= 90 ? 'var(--emerald)' : res.caseScore >= 60 ? 'var(--amber)' : 'var(--crimson)' }}>
                        {res.caseScore} / 100
                      </div>

                      <div style={{ marginTop: '12px', fontSize: '13px' }}>
                        <div>Expected Financial Loss: <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--crimson)' }}>${res.totalExpectedLoss.toLocaleString()}</strong></div>
                        <div>Critical Floor Applied: <strong>{res.hasCriticalGap ? 'YES (Capped at 75 max)' : 'NO'}</strong></div>
                        <div style={{ marginTop: '8px' }}>
                          OPA Recommended Action: <span className="badge badge-indigo">{res.recommendedAction}</span>
                        </div>
                        <div>Required Audit Approval Tier: <span className="badge badge-amber">{res.requiresTier}</span></div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* F6: Lineage DAG */}
        {activeTab === 'F6' && (
          <div className="sub">
            <div className="sub-header">
              <div className="sub-title">F6: Section 16 Lineage Directed Acyclic Graph (DAG)</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {MOCK_LINEAGE_GRAPH.map((node, i) => (
                <div key={node.id} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ background: 'var(--surface-1)', border: '1px solid var(--surface-2)', borderRadius: '6px', padding: '16px', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600 }}>{node.label}</span>
                      <span className={`badge ${node.status === 'PASSED' ? 'badge-emerald' : node.status === 'FAILED' ? 'badge-crimson' : 'badge-amber'}`}>
                        {node.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{node.details}</div>
                  </div>
                  {i < MOCK_LINEAGE_GRAPH.length - 1 && <div style={{ fontSize: '20px', color: 'var(--cyan)' }}>↓</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* F7: OPA & Segregation of Duties */}
        {activeTab === 'F7' && (
          <div className="sub">
            <div className="sub-header">
              <div className="sub-title">F7: OPA Hierarchy & Segregation of Duties (SoD) Audit</div>
            </div>
            <div className="callout">
              <div className="callout-title" style={{ color: 'var(--cyan)' }}>Zero Self-Approval Enforcement</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Under Tegrity Governance Rules, no auditor (T1, T2, or T3) can approve a document validation claim they initiated or submitted. 
                Any self-approval attempt is automatically intercepted and logged as a compliance breach.
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '20px' }}>
              <div className="tile">
                <div className="tile-label">Tier 1 (T1) Auto-Pass</div>
                <div style={{ fontSize: '13px', marginTop: '8px' }}>Claims &lt; $5,000 | Score &ge; 90</div>
                <div className="tile-sub">System Auto-Approval</div>
              </div>

              <div className="tile">
                <div className="tile-label">Tier 2 (T2) Senior Auditor</div>
                <div style={{ fontSize: '13px', marginTop: '8px' }}>Claims $5k–$50k | Score 60–89</div>
                <div className="tile-sub">Requires 1 Human Sign-off</div>
              </div>

              <div className="tile">
                <div className="tile-label">Tier 3 (T3) Executive Board</div>
                <div style={{ fontSize: '13px', marginTop: '8px' }}>Claims &gt; $50k or Critical Flag</div>
                <div className="tile-sub">Dual Executive Sign-off</div>
              </div>
            </div>
          </div>
        )}

        {/* F8: Continuous Learning */}
        {activeTab === 'F8' && (
          <div className="sub">
            <div className="sub-header">
              <div className="sub-title">F8: Section 17 Continuous Learning & Feedback Audit Trail</div>
            </div>
            <div className="dtable-wrapper">
              <table className="dtable">
                <thead>
                  <tr>
                    <th>Feedback ID</th>
                    <th>Case ID</th>
                    <th>Auditor / Source</th>
                    <th>Action Taken</th>
                    <th>Reason Code</th>
                    <th>Comment</th>
                    <th>Model Weight State</th>
                  </tr>
                </thead>
                <tbody>
                  {feedbackList.map(fb => (
                    <tr key={fb.id}>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{fb.id}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{fb.caseId}</td>
                      <td>{fb.auditorName}</td>
                      <td>
                        <span className={`badge ${fb.auditorDecision.includes('APPROVE') ? 'badge-emerald' : fb.auditorDecision.includes('UPDATE') ? 'badge-indigo' : 'badge-crimson'}`}>
                          {fb.auditorDecision}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{fb.reasonCode}</td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{fb.comment}</td>
                      <td><span className="badge badge-indigo">{fb.learningStatus}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Modal: Create Case */}
      {isCaseModalOpen && (
        <div className="blade-overlay" onClick={() => setIsCaseModalOpen(false)}>
          <div className="sub" style={{ width: '500px', margin: 'auto', backgroundColor: 'var(--surface-0)' }} onClick={(e) => e.stopPropagation()}>
            <div className="sub-header">
              <div className="sub-title">Create New Validation Case</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Vendor Name</label>
                <input type="text" className="search-box" style={{ width: '100%' }} placeholder="e.g. AeroMaritime Logistics" value={newCaseVendor} onChange={(e) => setNewCaseVendor(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Document Type</label>
                <select className="search-box" style={{ width: '100%' }} value={newCaseDocType} onChange={(e) => setNewCaseDocType(e.target.value)}>
                  <option value="Commercial Tax Invoice">Commercial Tax Invoice</option>
                  <option value="Bill of Lading">Bill of Lading</option>
                  <option value="Certificate of Origin">Certificate of Origin</option>
                  <option value="Marine Insurance Policy">Marine Insurance Policy</option>
                  <option value="Charter Party Agreement">Charter Party Agreement</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Claim Value (USD)</label>
                <input type="number" className="search-box" style={{ width: '100%' }} value={newCaseValue} onChange={(e) => setNewCaseValue(parseInt(e.target.value) || 0)} />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button className="btn btn-secondary" onClick={() => setIsCaseModalOpen(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleCreateCase}>Create Case</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Pattern CRUD */}
      {isPatternModalOpen && editingPattern && (
        <div className="blade-overlay" onClick={() => setIsPatternModalOpen(false)}>
          <div className="sub" style={{ width: '560px', margin: 'auto', backgroundColor: 'var(--surface-0)' }} onClick={(e) => e.stopPropagation()}>
            <div className="sub-header">
              <div className="sub-title">{patterns.some(p => p.id === editingPattern.id) ? 'Edit Pattern Rule' : 'Create New Pattern Rule'}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Pattern Name</label>
                <input type="text" className="search-box" style={{ width: '100%' }} value={editingPattern.name} onChange={(e) => setEditingPattern({ ...editingPattern, name: e.target.value })} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Category</label>
                <input type="text" className="search-box" style={{ width: '100%' }} value={editingPattern.category} onChange={(e) => setEditingPattern({ ...editingPattern, category: e.target.value })} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Regex Pattern</label>
                <input type="text" className="search-box" style={{ width: '100%', fontFamily: 'var(--font-mono)' }} value={editingPattern.regexPattern} onChange={(e) => setEditingPattern({ ...editingPattern, regexPattern: e.target.value })} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Confidence Threshold (%)</label>
                <input type="number" className="search-box" style={{ width: '100%' }} value={editingPattern.confidenceThreshold} onChange={(e) => setEditingPattern({ ...editingPattern, confidenceThreshold: parseInt(e.target.value) || 90 })} />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button className="btn btn-secondary" onClick={() => setIsPatternModalOpen(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSavePattern}>Save Pattern</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Rule CRUD */}
      {isRuleModalOpen && editingRule && (
        <div className="blade-overlay" onClick={() => setIsRuleModalOpen(false)}>
          <div className="sub" style={{ width: '560px', margin: 'auto', backgroundColor: 'var(--surface-0)' }} onClick={(e) => e.stopPropagation()}>
            <div className="sub-header">
              <div className="sub-title">{rules.some(r => r.id === editingRule.id) ? 'Edit Business Rule' : 'Create Validation Rule'}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Rule Code</label>
                <input type="text" className="search-box" style={{ width: '100%', fontFamily: 'var(--font-mono)' }} value={editingRule.code} onChange={(e) => setEditingRule({ ...editingRule, code: e.target.value })} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Rule Name</label>
                <input type="text" className="search-box" style={{ width: '100%' }} value={editingRule.name} onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Weight Multiplier</label>
                <input type="number" step="0.1" className="search-box" style={{ width: '100%' }} value={editingRule.weight} onChange={(e) => setEditingRule({ ...editingRule, weight: parseFloat(e.target.value) || 1.0 })} />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button className="btn btn-secondary" onClick={() => setIsRuleModalOpen(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSaveRule}>Save Rule</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expandable Blade Drawer for Case Review */}
      {selectedCase && (
        <div className="blade-overlay" onClick={() => setSelectedCase(null)}>
          <div className="blade" onClick={(e) => e.stopPropagation()}>
            <div className="blade-header">
              <div>
                <h3 style={{ fontSize: '18px', color: 'var(--text-main)' }}>{selectedCase.id} - {selectedCase.documentType}</h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Vendor: {selectedCase.vendorName}</div>
              </div>
              <button className="btn btn-secondary" onClick={() => setSelectedCase(null)}>✕ Close</button>
            </div>

            <div className="blade-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div className="tile">
                  <div className="tile-label">Claim Value</div>
                  <div className="t-big">${selectedCase.claimValue.toLocaleString()} {selectedCase.currency}</div>
                </div>
                <div className="tile">
                  <div className="tile-label">Compounded Case Score</div>
                  <div className="t-big" style={{ color: selectedCase.overallScore >= 90 ? 'var(--emerald)' : selectedCase.overallScore >= 60 ? 'var(--amber)' : 'var(--crimson)' }}>
                    {selectedCase.overallScore} / 100
                  </div>
                </div>
              </div>

              <div className="callout">
                <div className="callout-title" style={{ color: 'var(--amber)' }}>Audit Findings & Expected Loss ($EL)</div>
                {selectedCase.findings.map(f => (
                  <div key={f.id} style={{ borderBottom: '1px solid var(--surface-1)', padding: '12px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', alignItems: 'center' }}>
                      <strong style={{ fontSize: '13px' }}>{f.ruleName} ({f.ruleId})</strong>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button 
                          className="btn btn-secondary"
                          style={{ padding: '2px 8px', fontSize: '11px', border: '1px solid #38bdf8', color: '#38bdf8' }}
                          onClick={() => handleOpenFindingDrillDown(f, selectedCase)}
                        >
                          🔍 Drill Down Rationale
                        </button>
                        <span className={`badge ${f.severity === 'CRITICAL' ? 'badge-crimson' : 'badge-amber'}`}>{f.severity}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>{f.description}</div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                      <span>Probability (p_i): {(f.probability * 100).toFixed(0)}%</span>
                      <span>Exposure: ${f.exposure.toLocaleString()}</span>
                      <span style={{ color: 'var(--crimson)' }}>Expected Loss: ${f.expectedLoss.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <h4 style={{ marginBottom: '8px' }}>Auditor Override & Feedback Logging</h4>
                <textarea 
                  className="search-box" 
                  style={{ width: '100%', height: '80px', marginBottom: '12px' }}
                  placeholder="Enter auditor override justification or remediation notes..."
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                />
              </div>
            </div>

            <div className="blade-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedCase(null)}>Cancel</button>
              <button className="btn btn-danger">Confirm Reject</button>
              <button className="btn btn-primary">Override & Approve</button>
            </div>
          </div>
        </div>
      )}

      {/* Validation Assessment Drill-Down Popup Tile Modal */}
      <ValidationDrillDownModal 
        item={selectedDrillDownItem} 
        onClose={() => setSelectedDrillDownItem(null)} 
        onPushToContinuousLearning={handlePushToContinuousLearning}
      />
    </div>
  );
};
