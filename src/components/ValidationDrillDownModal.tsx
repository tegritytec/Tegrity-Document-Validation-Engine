import React, { useState } from 'react';
import { ValidationDrillDownItem } from '../types/tdv';
import { AlertTriangle, CheckCircle, ShieldAlert, FileText, Calculator, Lightbulb, X, ArrowRight, Share2, Layers } from 'lucide-react';

interface Props {
  item: ValidationDrillDownItem | null;
  onClose: () => void;
  onPushToContinuousLearning?: (item: ValidationDrillDownItem) => void;
}

export const ValidationDrillDownModal: React.FC<Props> = ({ item, onClose, onPushToContinuousLearning }) => {
  const [copied, setCopied] = useState(false);
  const [pushed, setPushed] = useState(false);

  if (!item) return null;

  const getSeverityBadgeClass = (sev: string) => {
    const uppercaseSev = sev.toUpperCase();
    if (uppercaseSev === 'CRITICAL') return 'badge badge-red';
    if (uppercaseSev === 'HIGH') return 'badge badge-orange';
    if (uppercaseSev === 'MEDIUM' || uppercaseSev === 'MODERATE') return 'badge badge-yellow';
    return 'badge badge-green';
  };

  const handleCopyRationale = () => {
    const textToCopy = `[Validation Assessment Rationale]\nRule ID: ${item.ruleId}\nTitle: ${item.title}\nSeverity: ${item.severity}\nRationale: ${item.rationale}\nSafeguard: ${item.safeguardOpportunity}\nClause: ${item.clauseRef}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePushLearning = () => {
    if (onPushToContinuousLearning) {
      onPushToContinuousLearning(item);
    }
    setPushed(true);
    setTimeout(() => setPushed(false), 3000);
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(11, 25, 44, 0.85)',
        backdropFilter: 'blur(8px)',
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
          maxWidth: '850px',
          maxHeight: '90vh',
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(0, 240, 255, 0.15)',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(0, 240, 255, 0.1)',
              border: '1px solid rgba(0, 240, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#00f0ff'
            }}>
              <ShieldAlert size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="code-font" style={{ color: '#38bdf8', fontSize: '13px', fontWeight: 600 }}>
                  {item.ruleId}
                </span>
                <span className={getSeverityBadgeClass(item.severity)}>
                  {item.severity.toUpperCase()}
                </span>
                {item.gapType && (
                  <span className="badge badge-purple" style={{ textTransform: 'uppercase' }}>
                    {item.gapType.replace('_', ' ')}
                  </span>
                )}
              </div>
              <h3 style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>
                {item.title}
              </h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Section 1: Validation Assessment Rationale & Decision Logic */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.5)',
            border: '1px solid #334155',
            borderRadius: '12px',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: '#38bdf8' }}>
              <FileText size={18} />
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>Validation Assessment & Failure Rationale</h4>
            </div>
            <p style={{ margin: 0, color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6' }}>
              {item.rationale}
            </p>
          </div>

          {/* Section 2: OCR Source Text Excerpt & Clause Location */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a855f7' }}>
                <Layers size={18} />
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>Extracted OCR Source Excerpt</h4>
              </div>
              <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#94a3b8' }}>
                <span>Clause Ref: <strong style={{ color: '#e2e8f0' }}>{item.clauseRef}</strong></span>
                <span>Parser Confidence: <strong style={{ color: '#22c55e' }}>{item.confidenceScore}%</strong></span>
              </div>
            </div>
            <div style={{
              background: '#090d16',
              border: '1px dashed #334155',
              borderRadius: '8px',
              padding: '12px 14px',
              fontFamily: 'monospace',
              fontSize: '13px',
              color: '#38bdf8',
              lineHeight: '1.5',
              wordBreak: 'break-word'
            }}>
              "{item.sourceExcerpt}"
            </div>
          </div>

          {/* Section 3: Risk Assessment Math & Financial Exposure */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            
            <div style={{
              background: 'rgba(239, 68, 68, 0.05)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '12px',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#f87171' }}>
                <Calculator size={18} />
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Financial Exposure Risk</h4>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#ef4444', margin: '4px 0' }}>
                ${item.expectedLoss.toLocaleString()}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                Potential claim loss based on probability weighting
              </div>
            </div>

            <div style={{
              background: 'rgba(234, 179, 8, 0.05)',
              border: '1px solid rgba(234, 179, 8, 0.2)',
              borderRadius: '12px',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#facc15' }}>
                <AlertTriangle size={18} />
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Overall Score Impact</h4>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#eab308', margin: '4px 0' }}>
                -{item.scoreImpact} pts
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                Deducted from 100-point compliance baseline
              </div>
            </div>

          </div>

          {/* Section 4: Recommended Safeguard & Action Plan */}
          <div style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '12px',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: '#34d399' }}>
              <Lightbulb size={18} />
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>Recommended Safeguard Opportunity</h4>
            </div>
            <p style={{ margin: 0, color: '#e2e8f0', fontSize: '14px', lineHeight: '1.5' }}>
              {item.safeguardOpportunity}
            </p>
            <div style={{ marginTop: '12px', fontSize: '13px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ArrowRight size={14} color="#34d399" />
              <span>Recommended Action: <strong style={{ color: '#f8fafc' }}>{item.auditorAction}</strong></span>
            </div>
          </div>

        </div>

        {/* Modal Footer Controls */}
        <div style={{
          padding: '16px 24px',
          background: '#0b192c',
          borderTop: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <button 
            className="btn btn-secondary" 
            onClick={handleCopyRationale}
            style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Share2 size={14} />
            {copied ? '✓ Rationale Copied!' : 'Copy Rationale'}
          </button>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              className="btn btn-primary"
              onClick={handlePushLearning}
              style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <CheckCircle size={14} />
              {pushed ? '✓ Added to Continuous Learning Catalog' : 'Push to Continuous Learning'}
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={onClose}
              style={{ fontSize: '13px' }}
            >
              Close Tile
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
