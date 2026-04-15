/**
 * Generate an AI Summary PDF for an opportunity.
 * Calls the backend for AI-generated content, then renders a clean PDF using jsPDF.
 */

import type { Opportunity } from "@/data/opportunities";
import { jsPDF } from "jspdf";
import { formatContractValue } from "@/lib/usaspending";

const API_BASE = "https://arberwebapp.arbernetwork.com/api";
// const API_BASE = "http://localhost:8000/api";

interface AISummary {
  projectOverview: string;
  keyDeadlines: string;
  complianceGatekeepers: string;
  scopeBreakdown: string;
  laborRequirements: string;
  pricingStructure: string;
  evaluationCriteria: string;
  risksRedFlags: string;
  incumbentCompetition: string;
  attachmentHighlights: string;
  opportunityMapping: string;
  actionPlan: string;
  contactInfo: string;
  instructionsToOfferors: string;
  recommendation: string;
  // Legacy fields for backward compatibility
  requirementsSummary?: string;
  complianceAssessment?: string;
  pricingIntelligence?: string;
}

/**
 * Generate and download an AI Summary PDF for the given opportunity.
 * Returns true on success, throws on failure.
 */
export async function generateSummaryPdf(opportunity: Opportunity): Promise<boolean> {
  // 1. Reuse cached summary if available — the modal/summary page already
  // generated it and persisted it to localStorage. This ensures the PDF
  // reflects exactly what the user saw on screen.
  interface OppShape {
    noticeId: string;
    naicsCode: string;
    setAside: string;
    status: string;
    complianceScore: number;
    title: string;
    agency: string;
    dueDate: string;
    placeOfPerformance: string;
  }
  let summary: AISummary | null = null;
  let opp: OppShape | null = null;

  const cacheKey = `arber_ai_summary_${opportunity.noticeId || opportunity.id || "unknown"}`;
  try {
    const cachedRaw = typeof window !== "undefined" ? localStorage.getItem(cacheKey) : null;
    if (cachedRaw) {
      const cached = JSON.parse(cachedRaw);
      if (cached?.summary) {
        summary = cached.summary as AISummary;
        opp = cached.opportunity || null;
      }
    }
  } catch {
    // ignore cache errors and fall through to fetch
  }

  if (!summary) {
    const token = typeof window !== "undefined" ? localStorage.getItem("arber_token") : null;
    const response = await fetch(`${API_BASE}/ai-summary`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ opportunity }),
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "AI summary generation failed");
    }

    summary = data.summary as AISummary;
    opp = data.opportunity;
    try {
      localStorage.setItem(cacheKey, JSON.stringify({
        summary,
        opportunity: opp,
        cachedAt: Date.now(),
      }));
    } catch {
      // ignore
    }
  }

  // Fallback opp shape if cache stored only summary
  if (!opp) {
    opp = {
      noticeId: opportunity.noticeId,
      naicsCode: opportunity.naicsCode,
      setAside: opportunity.setAside || "None",
      status: opportunity.status,
      complianceScore: opportunity.complianceScore ?? 0,
      title: opportunity.title,
      agency: opportunity.agency,
      dueDate: opportunity.dueDate,
      placeOfPerformance: opportunity.placeOfPerformance || "N/A",
    };
  }

  // 2. Generate PDF
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = 18;

  const checkPageBreak = (needed: number) => {
    if (y + needed > pageHeight - 20) {
      doc.addPage();
      // Mini header on continuation pages
      doc.setFillColor(24, 36, 52);
      doc.rect(0, 0, pageWidth, 10, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text("ARBER AI Summary Report", margin, 7);
      doc.text(`SOL: ${opp.noticeId}`, pageWidth - margin, 7, { align: "right" });
      y = 16;
    }
  };

  // Helper: write rich text with bullet support and paragraph spacing
  const writeRichText = (text: string, startY: number): number => {
    let cy = startY;
    const paragraphs = text.split("\n");

    for (const para of paragraphs) {
      const trimmed = para.trim();
      if (!trimmed) {
        cy += 2; // Paragraph spacing
        continue;
      }

      // Detect bullet points
      const isBullet = /^[•\-\*]\s/.test(trimmed);
      const bulletText = isBullet ? trimmed.replace(/^[•\-\*]\s*/, "") : trimmed;
      const xOffset = isBullet ? margin + 8 : margin + 3;
      const wrapWidth = isBullet ? contentWidth - 11 : contentWidth - 5;

      // Detect CAPS labels like "MANDATORY REQUIREMENT:" or "KEY PERSONNEL:"
      const capsMatch = bulletText.match(/^([A-Z][A-Z\s&/]+:)\s*(.*)/);

      if (capsMatch) {
        // Bold the label part
        checkPageBreak(5);
        if (isBullet) {
          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(50, 50, 50);
          doc.text("•", margin + 3, cy);
        }
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 30, 30);
        doc.text(capsMatch[1], xOffset, cy);
        const labelWidth = doc.getTextWidth(capsMatch[1]) + 1;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(50, 50, 50);
        const restLines = doc.splitTextToSize(capsMatch[2], wrapWidth - labelWidth);
        if (restLines.length > 0) {
          doc.text(restLines[0], xOffset + labelWidth, cy);
          cy += 4.2;
          for (let i = 1; i < restLines.length; i++) {
            checkPageBreak(5);
            doc.text(restLines[i], xOffset, cy);
            cy += 4.2;
          }
        } else {
          cy += 4.2;
        }
      } else {
        // Regular text or bullet
        checkPageBreak(5);
        if (isBullet) {
          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(50, 50, 50);
          doc.text("•", margin + 3, cy);
        }

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(50, 50, 50);
        const lines = doc.splitTextToSize(bulletText, wrapWidth);
        for (const line of lines) {
          checkPageBreak(5);
          doc.text(line, xOffset, cy);
          cy += 4.2;
        }
      }
    }
    return cy;
  };

  // --- Header ---
  doc.setFillColor(24, 36, 52);
  doc.rect(0, 0, pageWidth, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("ARBER", margin, 14);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("AI Opportunity Analysis Report", margin + 30, 14);

  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, margin, 22);

  doc.setFontSize(8);
  doc.text(`Notice ID: ${opp.noticeId}  |  NAICS: ${opp.naicsCode}  |  Set-Aside: ${opp.setAside || "None"}`, margin, 28);

  // Recommendation badge
  const isGo = opp.status === "Go";
  doc.setFillColor(isGo ? 16 : 180, isGo ? 120 : 50, isGo ? 80 : 50);
  doc.roundedRect(pageWidth - margin - 40, 30, 40, 8, 2, 2, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(`AI: ${opp.status}  |  ${opp.complianceScore}/100`, pageWidth - margin - 38, 35.5);

  y = 48;

  // --- Title ---
  doc.setTextColor(24, 36, 52);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  const titleLines = doc.splitTextToSize(opp.title, contentWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 6 + 2;

  // --- Meta row ---
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`Agency: ${opp.agency}  |  Due: ${opp.dueDate}  |  Location: ${opp.placeOfPerformance}`, margin, y);
  y += 6;

  // --- Point of Contact Box ---
  const poc = opportunity.pointOfContact;
  if (poc && (poc.name || poc.email || poc.phone)) {
    checkPageBreak(18);
    doc.setFillColor(235, 245, 255);
    doc.setDrawColor(180, 210, 245);
    doc.roundedRect(margin, y, contentWidth, poc.phone ? 16 : 12, 2, 2, "FD");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 80, 160);
    doc.text("POINT OF CONTACT", margin + 4, y + 5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 50);
    let pocX = margin + 4;
    const pocY = y + 9.5;
    if (poc.name) {
      doc.text(poc.name, pocX, pocY);
      pocX += doc.getTextWidth(poc.name) + 8;
    }
    if (poc.email) {
      doc.setTextColor(30, 80, 160);
      doc.text(poc.email, pocX, pocY);
      pocX += doc.getTextWidth(poc.email) + 8;
      doc.setTextColor(50, 50, 50);
    }
    if (poc.phone) {
      doc.text(poc.phone, pocX, pocY);
    }
    y += poc.phone ? 20 : 16;
  }

  // --- Divider ---
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // --- Sections ---
  const sections: { title: string; content: string; color: [number, number, number]; num: string }[] = [
    { num: "1", title: "PROJECT OVERVIEW", content: summary.projectOverview, color: [24, 36, 52] },
    { num: "2", title: "KEY DEADLINES", content: summary.keyDeadlines, color: [180, 50, 50] },
    { num: "3", title: "COMPLIANCE GATEKEEPERS", content: summary.complianceGatekeepers || summary.complianceAssessment || "", color: [180, 120, 30] },
    { num: "4", title: "SCOPE OF WORK BREAKDOWN", content: summary.scopeBreakdown || summary.requirementsSummary || "", color: [24, 36, 52] },
    { num: "5", title: "LABOR & RESOURCE REQUIREMENTS", content: summary.laborRequirements || "", color: [80, 60, 140] },
    { num: "6", title: "PRICING & COST STRUCTURE", content: summary.pricingStructure || summary.pricingIntelligence || "", color: [16, 120, 80] },
    { num: "7", title: "EVALUATION CRITERIA", content: summary.evaluationCriteria || "", color: [50, 100, 180] },
    { num: "8", title: "RISKS & RED FLAGS", content: summary.risksRedFlags || "", color: [200, 60, 60] },
    { num: "9", title: "INCUMBENT & COMPETITION", content: summary.incumbentCompetition, color: [100, 60, 150] },
    { num: "10", title: "ATTACHMENT HIGHLIGHTS", content: summary.attachmentHighlights, color: [50, 100, 180] },
    { num: "11", title: "OPPORTUNITY MAPPING", content: summary.opportunityMapping || "", color: [24, 100, 100] },
    { num: "12", title: "ACTION PLAN", content: summary.actionPlan || "", color: [24, 36, 52] },
    { num: "13", title: "CONTACT INFORMATION", content: summary.contactInfo, color: [100, 100, 100] },
    { num: "14", title: "INSTRUCTIONS TO OFFERORS (SECTION L)", content: summary.instructionsToOfferors || "", color: [70, 60, 160] },
    { num: "15", title: "RECOMMENDATION", content: summary.recommendation, color: [24, 36, 52] },
  ];

  for (const section of sections) {
    if (!section.content) continue;

    checkPageBreak(16);

    // Section number circle
    doc.setFillColor(...section.color);
    doc.circle(margin + 3, y + 1.5, 3, "F");
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(section.num, margin + 3 - (section.num.length > 1 ? 1.5 : 0.8), y + 2.8);

    // Section title
    doc.setTextColor(...section.color);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(section.title, margin + 9, y + 3);

    // Underline
    doc.setDrawColor(...section.color);
    doc.setLineWidth(0.3);
    doc.line(margin + 9, y + 4.5, margin + 9 + doc.getTextWidth(section.title), y + 4.5);
    doc.setLineWidth(0.2);
    y += 9;

    // Section content with rich formatting
    y = writeRichText(section.content, y);
    y += 4;
  }

  // --- AI Pricing Prediction Box ---
  if (opportunity.pricingPrediction && opportunity.pricingPrediction.predictedBid != null) {
    checkPageBreak(35);
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    doc.setFillColor(16, 120, 80);
    doc.circle(margin + 3, y + 1.5, 3, "F");
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("$", margin + 1.8, y + 2.8);

    doc.setTextColor(16, 120, 80);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("AI BID PRICE PREDICTION", margin + 9, y + 3);
    y += 10;

    // Price boxes
    const prices = [
      { label: "Aggressive", value: opportunity.pricingPrediction.lowBid },
      { label: "Recommended", value: opportunity.pricingPrediction.predictedBid },
      { label: "Safe High", value: opportunity.pricingPrediction.highBid },
    ];
    const boxWidth = (contentWidth - 10) / 3;
    for (let idx = 0; idx < prices.length; idx++) {
      const x = margin + idx * (boxWidth + 5);
      const isRecommended = idx === 1;
      doc.setFillColor(isRecommended ? 220 : 245, isRecommended ? 245 : 245, isRecommended ? 230 : 245);
      if (isRecommended) {
        doc.setDrawColor(16, 120, 80);
        doc.setLineWidth(0.5);
        doc.roundedRect(x, y - 2, boxWidth, 16, 2, 2, "FD");
        doc.setLineWidth(0.2);
      } else {
        doc.roundedRect(x, y - 2, boxWidth, 16, 2, 2, "F");
      }
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 100, 100);
      doc.text(prices[idx].label.toUpperCase(), x + 3, y + 3);
      doc.setFontSize(11);
      doc.setTextColor(isRecommended ? 16 : 50, isRecommended ? 120 : 50, isRecommended ? 80 : 50);
      doc.text(formatContractValue(prices[idx].value), x + 3, y + 11);
    }
    y += 20;

    // Confidence + Strategy
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 100, 100);
    doc.text(`Confidence: ${(opportunity.pricingPrediction.confidence || "").toUpperCase()}`, margin + 5, y);
    if (opportunity.pricingPrediction.strategy) {
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      const stratLines = doc.splitTextToSize(`Strategy: ${opportunity.pricingPrediction.strategy}`, contentWidth - 5);
      for (const sl of stratLines) {
        checkPageBreak(5);
        doc.text(sl, margin + 5, y);
        y += 4;
      }
    }
    y += 6;
  }

  // --- Footer on all pages ---
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 160);
    doc.text(
      `ARBER Gov Bid Automation  |  Confidential  |  Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: "center" }
    );
  }

  // 3. Download
  const safeName = opp.title.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 50);
  doc.save(`ARBER_Summary_${safeName}.pdf`);

  return true;
}
