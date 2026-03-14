import { AlertTriangle } from "lucide-react";
import AppIcon from "@/components/AppIcon";

const alerts = [
  {
    text: "Insurance Required Pre-Award",
    color: "text-red-500",
    borderColor: "border-l-red-500",
  },
  {
    text: "Proposal Due in 2 Days",
    color: "text-amber-500",
    borderColor: "border-l-amber-500",
  },
  {
    text: "Mandatory Site Visit Tomorrow",
    color: "text-blue-500",
    borderColor: "border-l-blue-500",
  },
  {
    text: "Pricing Still Missing for Logistics Support",
    color: "text-orange-500",
    borderColor: "border-l-orange-500",
  },
];

export default function AlertsPanel() {
  return (
    <div className="bg-white rounded-[1.15rem] shadow-[0_10px_28px_rgba(15,23,42,0.06)] border border-slate-200/70 p-5 h-full">
      <h2 className="text-sm font-bold text-slate-950 mb-4">Alerts</h2>
      <div className="space-y-2.5">
        {alerts.map((alert, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 py-2.5 px-3 rounded-xl border-l-[3px] bg-slate-50/80 ${alert.borderColor}`}
          >
            <AppIcon
              icon={AlertTriangle}
              size="sm"
              tone={alert.color.includes("red") ? "red" : alert.color.includes("amber") ? "amber" : alert.color.includes("blue") ? "blue" : "slate"}
            />
            <span className="text-[13px] text-slate-700 font-semibold leading-snug">
              {alert.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
