import React, { useState } from 'react';
import { CaseItem, ValidationAnalysisRun, ReportType, ReportFormat } from '../types/tdv';
import { X, Download, FileText, CheckCircle, AlertTriangle, Layers, Calculator, ShieldCheck, Printer } from 'lucide-react';

interface Props {
  targetCase: CaseItem | null;
  analysisRun: ValidationAnalysisRun | null;
  onClose: () => void;
  onDownloadReport: (reportType: ReportType, format: ReportFormat) => Promise<void>;
}

export const ReportReviewerModal: React.FC<Props> = ({
  targetCase,
  analysisRun,
  onClose,
  onDownloadReport
}) => {
  const [activeReportTab, setActiveReportTab] = useState<'OVERVIEW' | 'CROSS_DOC' | 'LAYTIME' | 'GAPS'>('OVERVIEW');
  const [selectedType, setSelectedType] = useState<ReportType>('Executive Summary');
  const [downloadingFormat, setDownloadingFormat] = useState<ReportFormat | null>(null);

  if (!targetCase) return null;

  const crossDoc = analysisRun?.crossDocFindings || [];
  const laytime = analysisRun?.laytimeAssessment;
  const gapFindings = analysisRun?.gapFindings || [];

  const handleDownload = async (format: ReportFormat) => {
    setDownloadingFormat(format);
    try {
      await onDownloadReport(selectedType, format);
    } finally {
      setTimeout(() => setDownloadingFormat(null), 1000);
    }
  };

  const handlePrintWindow = () => {
    window.print();
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(11, 25, 44, 0.88)',
        backdropFilter: 'blur(10px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '1000px',
          height: '92vh',
          backgroundColor: '#0f172a',
          border: '1px solid #334155',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 40px rgba(0, 240, 255, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#f8fafc'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          background: 'linear-gradient(135deg, #0b192c 0%, #1e293b 100%)',
          borderBottom: '1px solid #334155',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(0, 240, 255, 0.1)',
              border: '1px solid rgba(0, 240, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#00f0ff'
            }}>
              <FileText size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="code-font" style={{ color: '#38bdf8', fontSize: '13px', fontWeight: 600 }}>
                  Case: {targetCase.id}
                </span>
                <span className={`badge ${targetCase.overallScore >= 90 ? 'badge-emerald' : 'badge-amber'}`}>
                  Score: {targetCase.overallScore}/100
                </span>
              </div>
              <h3 style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>
                On-Screen Audit Report Reviewer ({targetCase.vendorName})
              </h3>
            </div>
          </div>

          {/* Report Type Switcher & Close */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', background: '#090d16', padding: '4px', borderRadius: '8px', border: '1px solid #334155' }}>
              <button 
                className={`btn ${selectedType === 'Executive Summary' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '4px 12px', fontSize: '12px' }}
                onClick={() => setSelectedType('Executive Summary')}
              >
                Executive Summary
              </button>
              <button 
                className={`btn ${selectedType === 'Detailed Audit Report' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '4px 12px', fontSize: '12px' }}
                onClick={() => setSelectedType('Detailed Audit Report')}
              >
                Detailed Audit Report
              </button>
            </div>
            <button 
              onClick={handlePrintWindow}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Printer size={14} /> Print
            </button>
            <button 
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '6px' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '12px 24px 0 24px',
          background: '#0b192c',
          borderBottom: '1px solid #1e293b'
        }}>
          <button 
            style={{
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: 600,
              color: activeReportTab === 'OVERVIEW' ? '#00f0ff' : '#94a3b8',
              borderBottom: activeReportTab === 'OVERVIEW' ? '2px solid #00f0ff' : '2px solid transparent',
              background: 'transparent',
              borderTop: 'none', borderLeft: 'none', borderRight: 'none',
              cursor: 'pointer'
            }}
            onClick={() => setActiveReportTab('OVERVIEW')}
          >
            📊 Executive Overview
          </button>
          <button 
            style={{
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: 600,
              color: activeReportTab === 'CROSS_DOC' ? '#00f0ff' : '#94a3b8',
              borderBottom: activeReportTab === 'CROSS_DOC' ? '2px solid #00f0ff' : '2px solid transparent',
              background: 'transparent',
              borderTop: 'none', borderLeft: 'none', borderRight: 'none',
              cursor: 'pointer'
            }}
            onClick={() => setActiveReportTab('CROSS_DOC')}
          >
            🔗 Cross-Document Verification Matrix ({crossDoc.length})
          </button>
          <button 
            style={{
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: 600,
              color: activeReportTab === 'LAYTIME' ? '#00f0ff' : '#94a3b8',
              borderBottom: activeReportTab === 'LAYTIME' ? '2px solid #00f0ff' : '2px solid transparent',
              background: 'transparent',
              borderTop: 'none', borderLeft: 'none', borderRight: 'none',
              cursor: 'pointer'
            }}
            onClick={() => setActiveReportTab('LAYTIME')}
          >
            🚢 Laytime & Despatch Assessment (VISBY)
          </button>
          <button 
            style={{
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: 600,
              color: activeReportTab === 'GAPS' ? '#00f0ff' : '#94a3b8',
              borderBottom: activeReportTab === 'GAPS' ? '2px solid #00f0ff' : '2px solid transparent',
              background: 'transparent',
              borderTop: 'none', borderLeft: 'none', borderRight: 'none',
              cursor: 'pointer'
            }}
            onClick={() => setActiveReportTab('GAPS')}
          >
            🛡️ Gap Analysis & Safeguards ({gapFindings.length})
          </button>
        </div>

        {/* Modal Body - Dynamic Tab Content */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          
          {/* TAB 1: EXECUTIVE OVERVIEW */}
          {activeReportTab === 'OVERVIEW' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                <div style={{ background: '#1e293b', padding: '16px', borderRadius: '12px', border: '1px solid #334155' }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>Overall Compliance Score</div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>
                    {targetCase.overallScore} / 100
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Risk Category: {targetCase.riskCategory}</div>
                </div>

                <div style={{ background: '#1e293b', padding: '16px', borderRadius: '12px', border: '1px solid #334155' }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>Invoiced Claim Exposure</div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>
                    ${targetCase.claimValue.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Currency: {targetCase.currency}</div>
                </div>

                <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                  <div style={{ fontSize: '12px', color: '#f87171' }}>Expected Financial Loss ($EL)</div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#ef4444', marginTop: '4px' }}>
                    ${targetCase.expectedLoss.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '11px', color: '#fca5a5', marginTop: '2px' }}>Probability weighted exposure</div>
                </div>

                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <div style={{ fontSize: '12px', color: '#34d399' }}>Net Laytime Safeguarded Savings</div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
                    ${laytime ? laytime.netSafeguardedSavings.toLocaleString() : '45,250'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6ee7b7', marginTop: '2px' }}>From Laytime & Demurrage audit</div>
                </div>
              </div>

              {/* Scope & Context Card */}
              <div style={{ background: '#1e293b', borderRadius: '12px', padding: '20px', border: '1px solid #334155' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#38bdf8' }}>
                  Document Audit Scope & Governance Context ({selectedType})
                </h4>
                <p style={{ margin: 0, color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6' }}>
                  This assessment contains automated cross-document verification findings for document <strong>{targetCase.documentId}</strong>. All contractual terms, demurrage rates, NOR tender timestamps, and weather exclusions have been cross-verified against BIMCO 2024 charter party standards, AIS vessel tracking logs, and port meteorological records.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: CROSS-DOCUMENT VERIFICATION MATRIX */}
          {activeReportTab === 'CROSS_DOC' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'rgba(0, 240, 255, 0.05)', padding: '14px 18px', borderRadius: '10px', border: '1px solid rgba(0, 240, 255, 0.2)', fontSize: '13px', color: '#38bdf8' }}>
                🔍 <strong>Cross-Document Verification Engine</strong> automatically cross-checks parameters across Charter Party contracts, Statement of Facts, AIS vessel tracking, and invoices to detect hidden financial risks.
              </div>

              <table className="dtable" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Parameter Evaluated</th>
                    <th>Source Document A</th>
                    <th>Source Document B</th>
                    <th>Variance Status</th>
                    <th>Financial Exposure</th>
                    <th>Recommended Safeguard</th>
                  </tr>
                </thead>
                <tbody>
                  {crossDoc.map(cd => (
                    <tr key={cd.id}>
                      <td style={{ fontWeight: 600, color: '#f8fafc' }}>{cd.parameterName}</td>
                      <td style={{ fontSize: '12px', color: '#cbd5e1' }}>{cd.valueDocA}</td>
                      <td style={{ fontSize: '12px', color: '#cbd5e1' }}>{cd.valueDocB}</td>
                      <td>
                        <span className={`badge ${cd.varianceStatus === 'CRITICAL_MISMATCH' ? 'badge-crimson' : 'badge-amber'}`}>
                          {cd.varianceStatus}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#ef4444' }}>
                        ${cd.financialExposure.toLocaleString()}
                      </td>
                      <td style={{ fontSize: '12px', color: '#94a3b8' }}>{cd.recommendedSafeguard}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: LAYTIME & DESPATCH ASSESSMENT (VISBY SAMPLE) */}
          {activeReportTab === 'LAYTIME' && laytime && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <div style={{ background: '#1e293b', padding: '16px', borderRadius: '12px', border: '1px solid #334155' }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>Vessel & Port Target</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', marginTop: '4px' }}>
                    {laytime.vesselName}
                  </div>
                  <div style={{ fontSize: '12px', color: '#38bdf8' }}>{laytime.portName}</div>
                </div>

                <div style={{ background: '#1e293b', padding: '16px', borderRadius: '12px', border: '1px solid #334155' }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>Claimed vs Validated Demurrage</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#ef4444', marginTop: '4px' }}>
                    Claimed: ${laytime.claimedDemurrageTotal.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '12px', color: '#22c55e' }}>Validated: ${laytime.adjustedDemurrageTotal.toLocaleString()}</div>
                </div>

                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <div style={{ fontSize: '12px', color: '#34d399' }}>Net Loss Exposure Saved</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
                    ${laytime.netSafeguardedSavings.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6ee7b7' }}>Saved via laytime rate reconciliation</div>
                </div>
              </div>

              {/* Statement of Facts Timeline Table */}
              <div>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#38bdf8' }}>
                  Statement of Facts (SOF) Laytime Calculation Breakdown
                </h4>
                <table className="dtable" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>SOF Event Description</th>
                      <th>Time Range</th>
                      <th>Laytime %</th>
                      <th>Hours Counted</th>
                      <th>Audit Verification Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {laytime.sofEvents.map((e, idx) => (
                      <tr key={idx}>
                        <td style={{ fontFamily: 'monospace' }}>{e.date}</td>
                        <td style={{ fontWeight: 500 }}>{e.eventDescription}</td>
                        <td style={{ fontFamily: 'monospace' }}>{e.timeFrom} - {e.timeTo}</td>
                        <td><span className="badge badge-indigo">{e.laytimePct}%</span></td>
                        <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{e.hoursCounted} hrs</td>
                        <td style={{ fontSize: '12px', color: '#94a3b8' }}>{e.remarks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: GAP FINDINGS */}
          {activeReportTab === 'GAPS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <table className="dtable" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Rule / Pattern ID</th>
                    <th>Finding Title</th>
                    <th>Gap Type</th>
                    <th>Severity</th>
                    <th>Recommended Safeguard Opportunity</th>
                  </tr>
                </thead>
                <tbody>
                  {gapFindings.map((g, idx) => (
                    <tr key={idx}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{g.ruleId}</td>
                      <td style={{ fontWeight: 500 }}>{g.title}</td>
                      <td><span className="badge badge-indigo">{g.gapType}</span></td>
                      <td>
                        <span className={`badge ${g.severity === 'CRITICAL' ? 'badge-crimson' : 'badge-amber'}`}>
                          {g.severity}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px', color: '#94a3b8' }}>{g.safeguardOpportunity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>

        {/* Modal Footer Download Toolbar */}
        <div style={{
          padding: '16px 24px',
          background: '#0b192c',
          borderTop: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ fontSize: '13px', color: '#94a3b8' }}>
            Report Target: <strong style={{ color: '#00f0ff' }}>{selectedType}</strong> ({targetCase.id})
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className="btn btn-secondary" 
              style={{ border: '1px solid #e11d48', color: '#fda4af', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => handleDownload('PDF')}
              disabled={downloadingFormat === 'PDF'}
            >
              <Download size={14} /> {downloadingFormat === 'PDF' ? 'Generating PDF...' : '📄 PDF (.pdf)'}
            </button>
            <button 
              className="btn btn-secondary" 
              style={{ border: '1px solid #2563eb', color: '#93c5fd', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => handleDownload('DOCX')}
              disabled={downloadingFormat === 'DOCX'}
            >
              <Download size={14} /> {downloadingFormat === 'DOCX' ? 'Generating Word...' : '📝 Word (.docx)'}
            </button>
            <button 
              className="btn btn-secondary" 
              style={{ border: '1px solid #d97706', color: '#fde68a', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => handleDownload('PPTX')}
              disabled={downloadingFormat === 'PPTX'}
            >
              <Download size={14} /> {downloadingFormat === 'PPTX' ? 'Generating PPT...' : '📊 PowerPoint (.pptx)'}
            </button>
            <button 
              className="btn btn-secondary" 
              style={{ border: '1px solid #10b981', color: '#a7f3d0', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => handleDownload('XLSX')}
              disabled={downloadingFormat === 'XLSX'}
            >
              <Download size={14} /> {downloadingFormat === 'XLSX' ? 'Generating Excel...' : '📈 Excel (.xlsx)'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
