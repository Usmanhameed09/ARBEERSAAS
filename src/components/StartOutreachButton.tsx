"use client";

/** Drop-in button that launches the OutreachCampaignBuilder pre-filled from an
 * opportunity. Use anywhere you have opportunity context (cards, modals, draft page).
 *
 * Example:
 *   <StartOutreachButton
 *     opportunityNoticeId={opp.noticeId}
 *     opportunityTitle={opp.title}
 *     opportunityAgency={opp.agency}
 *     scopeSummary={opp.fullDescription}
 *     tradeRequired={opp.title}
 *     locationCity={opp.placeOfPerformance}
 *     locationState={opp.state}
 *     deadlineDate={opp.dueDate}
 *     naicsCode={opp.naicsCode}
 *     predictedBid={opp.pricingPrediction?.predictedBid}
 *   />
 */

import { useState } from "react";
import { Send } from "lucide-react";
import OutreachCampaignBuilder from "@/components/OutreachCampaignBuilder";
import type { CampaignCreateInput } from "@/lib/api";

interface Props extends CampaignCreateInput {
  predictedBid?: number;
  className?: string;
  label?: string;
}

export default function StartOutreachButton({
  className,
  label = "Start Outreach Campaign",
  predictedBid,
  ...defaults
}: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={
          className ||
          "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded bg-blue-600 hover:bg-blue-700 text-white"
        }
      >
        <Send className="w-3.5 h-3.5" /> {label}
      </button>
      {open && (
        <OutreachCampaignBuilder
          open
          onClose={() => setOpen(false)}
          defaults={{ ...defaults, predictedBid }}
          onLaunched={() => setOpen(false)}
        />
      )}
    </>
  );
}
