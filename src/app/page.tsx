import StatusCard from "@/components/StatusCard";
import ActiveOpportunities from "@/components/ActiveOpportunities";
import TimelinePanel from "@/components/TimelinePanel";
import {
  OpportunityStackIcon,
  QualifiedSealIcon,
  NoGoShieldIcon,
  PricingHandshakeIcon,
  DraftClipboardIcon,
  SentPlaneIcon,
} from "@/components/DashboardRealisticIcons";

const statusCards = [
  {
    icon: OpportunityStackIcon,
    label: "New Opportunities",
    count: 8,
    iconBg: "bg-transparent",
    iconColor: "",
    href: "/opportunities",
  },
  {
    icon: QualifiedSealIcon,
    label: "Qualified (Go)",
    count: 5,
    iconBg: "bg-transparent",
    iconColor: "",
    href: "/opportunities?filter=go",
  },
  {
    icon: NoGoShieldIcon,
    label: "No-Go (Bid Killers)",
    count: 2,
    iconBg: "bg-transparent",
    iconColor: "",
    href: "/opportunities?filter=no-go",
  },
  {
    icon: PricingHandshakeIcon,
    label: "Awaiting Sub Pricing",
    count: 3,
    iconBg: "bg-transparent",
    iconColor: "",
  },
  {
    icon: DraftClipboardIcon,
    label: "Drafts Ready for Review",
    count: 2,
    iconBg: "bg-transparent",
    iconColor: "",
  },
  {
    icon: SentPlaneIcon,
    label: "Sent",
    count: 7,
    iconBg: "bg-transparent",
    iconColor: "",
  },
];

export default function Dashboard() {
  return (
    <div className="p-5">
      {/* Mission Control Header */}
      <h1 className="text-xl font-bold text-gray-900 mb-4">Mission Control</h1>

      {/* Status Cards - Individual cards in a row */}
      <div className="grid grid-cols-6 gap-4 mb-5">
        {statusCards.map((card) => (
          <StatusCard key={card.label} {...card} />
        ))}
      </div>

      {/* Active Opportunities Table - Full width */}
      <ActiveOpportunities />

      {/* Timeline */}
      <div className="mt-5">
        <TimelinePanel />
      </div>
    </div>
  );
}
