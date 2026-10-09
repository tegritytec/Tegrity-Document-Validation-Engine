import { CaseItem, ReportFormat, ReportType, ValidationAnalysisRun } from '../types/tdv';

export function generateReportFile(
  targetCase: CaseItem,
  analysisRun: ValidationAnalysisRun | null,
  reportType: ReportType,
  format: ReportFormat
) {
  const filename = `Tegrity_${reportType.replace(/\s+/g, '_')}_${targetCase.id}_${targetCase.documentId}.${format.toLowerCase()}`;

  let content = '';

  if (format === 'PDF') {
    content = `%PDF-1.7\n1 0 obj\n<< /Title (${reportType} - ${targetCase.id}) /Vendor (${targetCase.vendorName}) >>\nendobj\n`;
  } else if (format === 'DOCX') {
    content = `[TEGRITY DOCUMENT VALIDATION ENGINE REPORT]\nDocument ID: ${targetCase.documentId}\nReport Type: ${reportType}\nScore: ${targetCase.overallScore}/100\nRisk Band: ${targetCase.riskCategory}\nExpected Loss: $${targetCase.expectedLoss.toLocaleString()}\n\nGAP ANALYSIS & SAFEGUARD OPPORTUNITIES:\n`;
    if (analysisRun) {
      analysisRun.gapFindings.forEach(g => {
        content += `- [${g.severity}] ${g.title}: ${g.safeguardOpportunity}\n`;
      });
    }
  } else if (format === 'PPTX') {
    content = `[SLIDE 1: EXECUTIVE OVERVIEW]\nTitle: Tegrity Document Validation Report\nCase: ${targetCase.id} | Vendor: ${targetCase.vendorName}\nScore Grade: ${targetCase.overallScore}/100 (${targetCase.riskCategory})\n\n[SLIDE 2: RISK & SAFEGUARDING RECOMMENDATIONS]\nExpected Financial Exposure: $${targetCase.expectedLoss.toLocaleString()}\nAction Plan: Enforce Rider Clauses and automated tax verification.`;
  }

  // Create downloadable Blob link
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
