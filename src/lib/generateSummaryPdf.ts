/**
 * Generate an AI Summary PDF for an opportunity.
 * Calls the backend for AI-generated content, then renders a clean PDF using jsPDF.
 */

import type { Opportunity } from "@/data/opportunities";
import { jsPDF } from "jspdf";
import { formatContractValue } from "@/lib/usaspending";

const API_BASE = "https://arbersaas.duckdns.org/api";

interface AISummary {
  projectOverview: string;
  keyDeadlines: string;
  requirementsSummary: string;
  contactInfo: string;
  complianceAssessment: string;
  pricingIntelligence: string;
  incumbentCompetition: string;
  attachmentHighlights: string;
  recommendation: string;
}

/**
 * Generate and download an AI Summary PDF for the given opportunity.
 * Returns true on success, throws on failure.
 */
export async function generateSummaryPdf(opportunity: Opportunity): Promise<boolean> {
  // 1. Call backend for AI summary
  const response = await fetch(`${API_BASE}/ai-summary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ opportunity }),
  });

  if (!response.ok) {
    throw new Error(`Backend error: ${response.status}`);
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || "AI summary generation failed");
  }

  const summary: AISummary = data.summary;
  const opp = data.opportunity;

  // 2. Generate PDF
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = 18;

  const checkPageBreak = (needed: number) => {
    if (y + needed > 275) {
      doc.addPage();
      y = 18;
    }
  };

  // --- Header ---
  doc.setFillColor(24, 36, 52); // #182434
  doc.rect(0, 0, pageWidth, 38, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("ARBER - AI Summary Report", margin, 16);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, margin, 24);

  doc.setFontSize(8);
  doc.text(`Notice ID: ${opp.noticeId}`, margin, 30);
  doc.text(`AI Recommendation: ${opp.status}  |  Compliance Score: ${opp.complianceScore}/100`, margin, 35);

  y = 46;

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
  doc.text(`Agency: ${opp.agency}  |  NAICS: ${opp.naicsCode}  |  Set-Aside: ${opp.setAside}`, margin, y);
  y += 4;
  doc.text(`Due: ${opp.dueDate}  |  Posted: ${opp.postedDate}  |  Location: ${opp.placeOfPerformance}`, margin, y);
  y += 8;

  // --- Divider ---
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // --- Sections ---
  const sections: { title: string; content: string; color: [number, number, number] }[] = [
    { title: "PROJECT OVERVIEW", content: summary.projectOverview, color: [24, 36, 52] },
    { title: "KEY DEADLINES", content: summary.keyDeadlines, color: [180, 50, 50] },
    { title: "REQUIREMENTS SUMMARY", content: summary.requirementsSummary, color: [24, 36, 52] },
    { title: "CONTACT INFORMATION", content: summary.contactInfo, color: [24, 36, 52] },
    { title: "COMPLIANCE & RISK ASSESSMENT", content: summary.complianceAssessment, color: [180, 120, 30] },
    { title: "PRICING INTELLIGENCE", content: summary.pricingIntelligence, color: [16, 120, 80] },
    { title: "INCUMBENT & COMPETITION", content: summary.incumbentCompetition, color: [100, 60, 150] },
    { title: "ATTACHMENT HIGHLIGHTS", content: summary.attachmentHighlights, color: [50, 100, 180] },
    { title: "RECOMMENDATION", content: summary.recommendation, color: [24, 36, 52] },
  ];

  for (const section of sections) {
    checkPageBreak(20);

    // Section header with colored left bar
    doc.setFillColor(...section.color);
    doc.rect(margin, y - 1, 2, 6, "F");

    doc.setTextColor(...section.color);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(section.title, margin + 5, y + 3);
    y += 8;

    // Section content
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(section.content, contentWidth - 5);
    for (const line of lines) {
      checkPageBreak(5);
      doc.text(line, margin + 5, y);
      y += 4.2;
    }
    y += 4;
  }

  // --- AI Pricing Prediction ---
  if (opportunity.pricingPrediction) {
    checkPageBreak(30);
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    doc.setFillColor(16, 120, 80);
    doc.rect(margin, y - 1, 2, 6, "F");
    doc.setTextColor(16, 120, 80);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("AI BID PRICE PREDICTION", margin + 5, y + 3);
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
      doc.setFillColor(idx === 1 ? 220 : 240, idx === 1 ? 245 : 240, idx === 1 ? 230 : 240);
      doc.rect(x, y - 2, boxWidth, 14, "F");
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 100, 100);
      doc.text(prices[idx].label.toUpperCase(), x + 3, y + 3);
      doc.setFontSize(10);
      doc.setTextColor(idx === 1 ? 16 : 50, idx === 1 ? 120 : 50, idx === 1 ? 80 : 50);
      doc.text(formatContractValue(prices[idx].value), x + 3, y + 10);
    }
    y += 18;

    // Confidence
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 100, 100);
    doc.text(`Confidence: ${(opportunity.pricingPrediction.confidence || "").toUpperCase()}`, margin + 5, y);
    y += 6;
  }

  // --- Footer ---
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 160);
    doc.text(
      `ARBER Gov Bid Automation  |  Confidential  |  Page ${i} of ${pageCount}`,
      pageWidth / 2,
      290,
      { align: "center" }
    );
  }

  // 3. Download
  const safeName = opp.title.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 50);
  doc.save(`ARBER_Summary_${safeName}.pdf`);

  return true;
}
