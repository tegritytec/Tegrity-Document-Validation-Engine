import { CaseItem, ReportFormat, ReportType, ValidationAnalysisRun } from '../types/tdv';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, HeadingLevel } from 'docx';
import PptxGenJS from 'pptxgenjs';

interface UnifiedFinding {
  title: string;
  severity: string;
  clauseRef: string;
  safeguardOpportunity: string;
}

function getUnifiedFindings(targetCase: CaseItem, analysisRun: ValidationAnalysisRun | null): UnifiedFinding[] {
  if (analysisRun && analysisRun.gapFindings && analysisRun.gapFindings.length > 0) {
    return analysisRun.gapFindings.map(g => ({
      title: g.title,
      severity: g.severity,
      clauseRef: `Rule ID: ${g.ruleId} (${g.gapType})`,
      safeguardOpportunity: g.safeguardOpportunity,
    }));
  }

  if (targetCase.findings && targetCase.findings.length > 0) {
    return targetCase.findings.map(f => ({
      title: f.ruleName || f.description || 'Compliance Gap',
      severity: f.severity,
      clauseRef: `Rule ID: ${f.ruleId}`,
      safeguardOpportunity: f.remediation || f.description || 'Apply standard charter party safeguards',
    }));
  }

  return [
    {
      title: 'Standard Compliance Verification',
      severity: 'Low',
      clauseRef: 'General Governance',
      safeguardOpportunity: 'Regular review of charter party terms against rule catalog.',
    },
  ];
}

export async function generateReportFile(
  targetCase: CaseItem,
  analysisRun: ValidationAnalysisRun | null,
  reportType: ReportType,
  format: ReportFormat
) {
  const cleanId = targetCase.id.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filenameBase = `Tegrity_${reportType.replace(/\s+/g, '_')}_${cleanId}`;

  if (format === 'PDF') {
    generatePdfReport(targetCase, analysisRun, reportType, `${filenameBase}.pdf`);
  } else if (format === 'DOCX') {
    await generateDocxReport(targetCase, analysisRun, reportType, `${filenameBase}.docx`);
  } else if (format === 'PPTX') {
    await generatePptxReport(targetCase, analysisRun, reportType, `${filenameBase}.pptx`);
  }
}

function generatePdfReport(
  targetCase: CaseItem,
  analysisRun: ValidationAnalysisRun | null,
  reportType: ReportType,
  filename: string
) {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const findings = getUnifiedFindings(targetCase, analysisRun);
  const docName = targetCase.documentId || targetCase.documentType || 'Charter_Party_Contract.pdf';

  // Header Banner
  doc.setFillColor(11, 25, 44); // #0b192c Abyss background
  doc.rect(0, 0, pageWidth, 70, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('TEGRITY DOCUMENT VALIDATION ENGINE', 40, 38);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 200, 255);
  doc.text(`${reportType.toUpperCase()} | MARITIME COMPLIANCE AUDIT`, 40, 56);

  let y = 100;

  // Case Metadata Box
  doc.setFillColor(245, 247, 250);
  doc.rect(40, y, pageWidth - 80, 85, 'F');
  doc.setDrawColor(200, 210, 220);
  doc.rect(40, y, pageWidth - 80, 85, 'S');

  doc.setTextColor(30, 40, 50);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Case ID: ${targetCase.id}`, 55, y + 22);
  doc.text(`Vendor: ${targetCase.vendorName}`, 55, y + 42);
  doc.text(`Document: ${docName}`, 55, y + 62);

  doc.text(`Date: ${new Date().toLocaleDateString()}`, 350, y + 22);
  doc.text(`Score: ${targetCase.overallScore}/100`, 350, y + 42);
  doc.text(`Risk Category: ${targetCase.riskCategory.toUpperCase()}`, 350, y + 62);

  y += 110;

  // Executive Metrics
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(11, 25, 44);
  doc.text('1. Executive Overview & Risk Metrics', 40, y);
  y += 20;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 70, 80);
  const overviewText = `This report provides automated compliance and gap analysis for document ${targetCase.documentId} against charter party standards, rider clause governance, and port compliance rule catalogs.`;
  const splitOverview = doc.splitTextToSize(overviewText, pageWidth - 80);
  doc.text(splitOverview, 40, y);
  y += splitOverview.length * 14 + 15;

  // Financial Exposure Card
  doc.setFillColor(254, 242, 242);
  doc.rect(40, y, pageWidth - 80, 45, 'F');
  doc.setDrawColor(252, 165, 165);
  doc.rect(40, y, pageWidth - 80, 45, 'S');

  doc.setTextColor(185, 28, 28);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Estimated Financial Loss Exposure: $${targetCase.expectedLoss.toLocaleString()}`, 55, y + 26);
  y += 65;

  // Gap Findings Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(11, 25, 44);
  doc.text('2. Gap Analysis & Safeguard Opportunities', 40, y);
  y += 20;

  findings.forEach((finding, idx) => {
    if (y > 700) {
      doc.addPage();
      y = 50;
    }

    doc.setFillColor(250, 250, 252);
    doc.rect(40, y, pageWidth - 80, 60, 'F');
    doc.setDrawColor(220, 225, 230);
    doc.rect(40, y, pageWidth - 80, 60, 'S');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(`${idx + 1}. [${finding.severity.toUpperCase()}] ${finding.title}`, 50, y + 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`Ref: ${finding.clauseRef}`, 50, y + 33);
    
    const safeguardMsg = `Safeguard: ${finding.safeguardOpportunity}`;
    const splitSafeguard = doc.splitTextToSize(safeguardMsg, pageWidth - 110);
    doc.text(splitSafeguard, 50, y + 47);

    y += 70;
  });

  // Footer on all pages
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Tegrity Document Validation Engine © ${new Date().getFullYear()} - Page ${i} of ${pageCount}`, 40, 770);
  }

  doc.save(filename);
}

async function generateDocxReport(
  targetCase: CaseItem,
  analysisRun: ValidationAnalysisRun | null,
  reportType: ReportType,
  filename: string
) {
  const findings = getUnifiedFindings(targetCase, analysisRun);
  const docName = targetCase.documentId || targetCase.documentType || 'Charter_Party_Contract.pdf';

  const tableRows = [
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ text: 'Severity', children: [new TextRun({ bold: true, color: 'FFFFFF' })] })], shading: { fill: '0B192C' } }),
        new TableCell({ children: [new Paragraph({ text: 'Finding Title', children: [new TextRun({ bold: true, color: 'FFFFFF' })] })], shading: { fill: '0B192C' } }),
        new TableCell({ children: [new Paragraph({ text: 'Reference', children: [new TextRun({ bold: true, color: 'FFFFFF' })] })], shading: { fill: '0B192C' } }),
        new TableCell({ children: [new Paragraph({ text: 'Safeguard Recommendation', children: [new TextRun({ bold: true, color: 'FFFFFF' })] })], shading: { fill: '0B192C' } }),
      ],
    }),
    ...findings.map(f => new TableRow({
      children: [
        new TableCell({ children: [new Paragraph(f.severity.toUpperCase())] }),
        new TableCell({ children: [new Paragraph(f.title)] }),
        new TableCell({ children: [new Paragraph(f.clauseRef)] }),
        new TableCell({ children: [new Paragraph(f.safeguardOpportunity)] }),
      ],
    })),
  ];

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: 'TEGRITY DOCUMENT VALIDATION ENGINE',
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            text: `${reportType.toUpperCase()} - CONFIDENTIAL AUDIT REPORT`,
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Case ID: ', bold: true }),
              new TextRun(targetCase.id),
              new TextRun({ text: '  |  Vendor: ', bold: true }),
              new TextRun(targetCase.vendorName),
              new TextRun({ text: '  |  Document: ', bold: true }),
              new TextRun(docName),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Overall Compliance Score: ', bold: true }),
              new TextRun(`${targetCase.overallScore} / 100`),
              new TextRun({ text: '  |  Risk Band: ', bold: true }),
              new TextRun(targetCase.riskCategory.toUpperCase()),
              new TextRun({ text: '  |  Expected Loss: ', bold: true }),
              new TextRun(`$${targetCase.expectedLoss.toLocaleString()}`),
            ],
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            text: '1. Executive Overview & Compliance Summary',
            heading: HeadingLevel.HEADING_3,
          }),
          new Paragraph({
            text: `This document contains the automated compliance verification and gap analysis performed by Tegrity Document Validation Engine for document ${targetCase.documentId}. All findings have been cross-checked against charter party rules, pattern libraries, and port compliance specifications.`,
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            text: '2. Detailed Gap Findings & Risk Safeguards',
            heading: HeadingLevel.HEADING_3,
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: tableRows,
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            text: '3. Strategic Recommendations & Continuous Learning',
            heading: HeadingLevel.HEADING_3,
          }),
          new Paragraph({
            text: '• Enforce standard rider clauses to mitigate financial exposure.',
          }),
          new Paragraph({
            text: '• Push approved contractual documents to Tegrity Voyage Management.',
          }),
          new Paragraph({
            text: '• Submit verified gap rules to the Continuous Learning engine for ongoing catalog enrichment.',
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, filename);
}

async function generatePptxReport(
  targetCase: CaseItem,
  analysisRun: ValidationAnalysisRun | null,
  reportType: ReportType,
  filename: string
) {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';
  const findings = getUnifiedFindings(targetCase, analysisRun);
  const docName = targetCase.documentId || targetCase.documentType || 'Charter_Party_Contract.pdf';

  // Slide 1: Title Slide
  const slide1 = pptx.addSlide();
  slide1.background = { color: '0B192C' };

  slide1.addText('TEGRITY DOCUMENT VALIDATION ENGINE', {
    x: 0.8,
    y: 1.8,
    w: 11.0,
    h: 0.8,
    fontSize: 32,
    bold: true,
    color: 'FFFFFF',
  });

  slide1.addText(`${reportType} | Maritime Compliance Audit`, {
    x: 0.8,
    y: 2.7,
    w: 11.0,
    h: 0.5,
    fontSize: 20,
    color: '00F0FF',
  });

  slide1.addText(`Case ID: ${targetCase.id}   |   Vendor: ${targetCase.vendorName}\nDocument: ${docName}`, {
    x: 0.8,
    y: 4.2,
    w: 11.0,
    h: 1.0,
    fontSize: 14,
    color: 'E2E8F0',
  });

  // Slide 2: Dashboard & Risk Metrics
  const slide2 = pptx.addSlide();
  slide2.addText('Executive Overview & Risk Metrics', {
    x: 0.8,
    y: 0.6,
    w: 11.0,
    h: 0.6,
    fontSize: 24,
    bold: true,
    color: '0B192C',
  });

  // Metric Cards
  slide2.addShape(pptx.ShapeType.rect, { x: 0.8, y: 1.5, w: 3.5, h: 2.2, fill: { color: 'F1F5F9' }, line: { color: 'CBD5E1' } });
  slide2.addText('Compliance Score', { x: 1.0, y: 1.7, w: 3.1, h: 0.4, fontSize: 14, color: '64748B' });
  slide2.addText(`${targetCase.overallScore} / 100`, { x: 1.0, y: 2.2, w: 3.1, h: 0.8, fontSize: 36, bold: true, color: '0B192C' });

  slide2.addShape(pptx.ShapeType.rect, { x: 4.8, y: 1.5, w: 3.5, h: 2.2, fill: { color: 'FEF2F2' }, line: { color: 'FCA5A5' } });
  slide2.addText('Risk Band', { x: 5.0, y: 1.7, w: 3.1, h: 0.4, fontSize: 14, color: '991B1B' });
  slide2.addText(targetCase.riskCategory.toUpperCase(), { x: 5.0, y: 2.2, w: 3.1, h: 0.8, fontSize: 32, bold: true, color: 'DC2626' });

  slide2.addShape(pptx.ShapeType.rect, { x: 8.8, y: 1.5, w: 3.5, h: 2.2, fill: { color: 'EFF6FF' }, line: { color: '93C5FD' } });
  slide2.addText('Financial Exposure', { x: 9.0, y: 1.7, w: 3.1, h: 0.4, fontSize: 14, color: '1E40AF' });
  slide2.addText(`$${targetCase.expectedLoss.toLocaleString()}`, { x: 9.0, y: 2.2, w: 3.1, h: 0.8, fontSize: 28, bold: true, color: '2563EB' });

  // Slide 3: Gap Analysis Table
  const slide3 = pptx.addSlide();
  slide3.addText('Gap Analysis & Risk Safeguards', {
    x: 0.8,
    y: 0.6,
    w: 11.0,
    h: 0.6,
    fontSize: 24,
    bold: true,
    color: '0B192C',
  });

  const rows: any[][] = [
    [
      { text: 'Severity', options: { fill: '0B192C', color: 'FFFFFF', bold: true } },
      { text: 'Finding Title', options: { fill: '0B192C', color: 'FFFFFF', bold: true } },
      { text: 'Reference', options: { fill: '0B192C', color: 'FFFFFF', bold: true } },
      { text: 'Safeguard Recommendation', options: { fill: '0B192C', color: 'FFFFFF', bold: true } },
    ],
    ...findings.map(f => [
      { text: f.severity.toUpperCase() },
      { text: f.title },
      { text: f.clauseRef },
      { text: f.safeguardOpportunity },
    ]),
  ];

  slide3.addTable(rows, { x: 0.8, y: 1.5, w: 11.5, colW: [1.5, 3.5, 2.0, 4.5], fontSize: 11 });

  await pptx.writeFile({ fileName: filename });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
