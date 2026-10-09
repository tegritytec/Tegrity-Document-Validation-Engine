import React, { useState } from 'react';
import { MOCK_CASES, MOCK_PATTERNS, MOCK_RULES, MOCK_LINEAGE_GRAPH, MOCK_FEEDBACK_QUEUE, MOCK_EXECUTIVE_METRICS } from './data/mockData';
import { CaseItem, FindingItem, PatternRule, ValidationRule, LearningFeedback } from './types/tdv';
import { evaluateCaseScoring } from './services/scoringEngine';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('F9');
  const [cases, setCases] = useState<CaseItem[]>(MOCK_CASES);
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // F2 Pattern State
  const [patterns, setPatterns] = useState<PatternRule[]>(MOCK_PATTERNS);
  const [testInput, setTestInput] = useState<string>('GB99823010');
  const [testResult, setTestResult] = useState<string | null>(null);

  // F3 Rules State
  const [rules, setRules] = useState<ValidationRule[]>(MOCK_RULES);

  // F5 Scoring Simulator State
  const [simProb, setSimProb] = useState<number>(0.85);
  const [simExposure, setSimExposure] = useState<number>(50000);
  const [simHasCritical, setSimHasCritical] = useState<boolean>(true);

  // F8 Learning Feedback State
  const [feedbackList, setFeedbackList] = useState<LearningFeedback[]>(MOCK_FEEDBACK_QUEUE);
  const [feedbackComment, setFeedbackComment] = useState<string>('');

  // Handle case click
  const handleOpenCase = (c: CaseItem) => {
    setSelectedCase(c);
  };

  // Handle pattern test
  const handleTestPattern = (pat: PatternRule) => {
    try {
      const regex = new RegExp(pat.regexPattern);
      const isMatch = regex.test(testInput);
      setTestResult(isMatch ? `MATCH: "${testInput}" satisfies ${pat.name}` : `INVALID: "${testInput}" failed ${pat.name}`);
    } catch (e: any) {
      setTestResult(`REGEX ERROR: ${e.message}`);
    }
  };

  // Toggle rule status
  const handleToggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  // Filter cases
  const filteredCases = cases.filter(c => 
    c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.documentType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="app-container">
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
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            User: <strong style={{ color: 'var(--text-main)' }}>Ashwani Sethi (Lead Auditor)</strong>
          </div>
        </div>
      </header>

      {/* Navigation Tabs F1 - F9 */}
      <nav className="nav-tabs">
        <button className={`nav-tab ${activeTab === 'F9' ? 'active' : ''}`} onClick={() => setActiveTab('F9')}>F9: Executive Analytics</button>
        <button className={`nav-tab ${activeTab === 'F1' ? 'active' : ''}`} onClick={() => setActiveTab('F1')}>F1: Ingestion & OCR</button>
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
        {/* F9: Executive Dashboard */}
        {activeTab === 'F9' && (
          <div>
            <div className="grid-metrics">
              {MOCK_EXECUTIVE_METRICS.map((m, idx) => (
                <div key={idx} className="tile">
                  <div className="tile-label">{m.label}</div>
                  <div className="t-big">{m.value}</div>
                  <div className="tile-sub" style={{ color: m.status === 'POSITIVE' ? 'var(--emerald)' : 'var(--text-muted)' }}>
                    {m.trend}
                  </div>
                </div>
              ))}
            </div>

            <div className="sub">
              <div className="sub-header">
                <div className="sub-title">
                  <span className="pip cyan"></span>
                  Active Validation Work Queue (High Risk & Escalations)
                </div>
                <button className="btn btn-secondary" onClick={() => setActiveTab('F1')}>+ Upload Document</button>
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
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCases.map(c => (
                      <tr key={c.id} onClick={() => handleOpenCase(c)}>
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
                          <span className={`badge ${c.status === 'APPROVED' ? 'badge-emerald' : c.status === 'FLAGGED' ? 'badge-crimson' : 'badge-amber'}`}>
                            {c.status}
                          </span>
                        </td>
                        <td>
                          <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }}>Inspect Blade</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* F1: Ingestion & OCR */}
        {activeTab === 'F1' && (
          <div className="sub">
            <div className="sub-header">
              <div className="sub-title">F1: Document Ingestion & Key-Value OCR Parser</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div style={{ border: '2px dashed var(--surface-2)', borderRadius: '8px', padding: '40px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>📄</div>
                <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '8px' }}>Drag & Drop Invoice / Bill of Lading (PDF, PNG)</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '16px' }}>Supports Section 11 OCR Normalization, Table Extraction, and Checksum Validation</div>
                <button className="btn btn-primary">Browse Files</button>
              </div>

              <div>
                <div className="callout">
                  <div className="callout-title" style={{ color: 'var(--cyan)' }}>Latest Ingestion Pipeline Output</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', marginTop: '8px', color: 'var(--text-muted)' }}>
                    <div>[OCR-ENGINE]: Ingested DOC-INV-88392 (Commercial Tax Invoice)</div>
                    <div>[OCR-CONFIDENCE]: 96.4% average across 14 KV fields</div>
                    <div>[TABLE-PARSE]: Extracted 14 line items with unit rates</div>
                    <div>[CHECKSUM]: SHA-256 digest validated: 8f92a1...9b20</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* F2: Pattern Library */}
        {activeTab === 'F2' && (
          <div className="sub">
            <div className="sub-header">
              <div className="sub-title">F2: Section 15 Pattern Regex Engine</div>
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
                    <th>Action</th>
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
                        <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => handleTestPattern(p)}>
                          Test Regex
                        </button>
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
              <div className="sub-title">F3: Section 14 Business Rule Catalog & Weights</div>
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
                    <th>Toggle</th>
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
                        <button 
                          className={`btn ${r.enabled ? 'btn-danger' : 'btn-primary'}`} 
                          style={{ padding: '4px 10px', fontSize: '11px' }}
                          onClick={() => handleToggleRule(r.id)}
                        >
                          {r.enabled ? 'Disable' : 'Enable'}
                        </button>
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
                    <th>Auditor</th>
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
                        <span className={`badge ${fb.auditorDecision.includes('APPROVE') ? 'badge-emerald' : 'badge-crimson'}`}>
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

      {/* Expandable Blade Drawer for Detailed Case Review */}
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '13px' }}>{f.ruleName} ({f.ruleId})</strong>
                      <span className={`badge ${f.severity === 'CRITICAL' ? 'badge-crimson' : 'badge-amber'}`}>{f.severity}</span>
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
    </div>
  );
};
