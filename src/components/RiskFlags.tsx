import { AlertTriangle } from "lucide-react";

const risks = [
  {
    text: "Insurance Gap -- No Go",
    color: "text-red-500",
  },
  {
    text: "Mandatory Site Visit",
    color: "text-amber-500",
  },
  {
    text: "Sub Pricing Delayed",
    color: "text-orange-500",
  },
];

export default function RiskFlags() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h2 className="text-sm font-bold text-gray-900 mb-4">Risk Flags</h2>
      <div className="space-y-3">
        {risks.map((risk, i) => (
          <div key={i} className="flex items-center gap-3">
            <AlertTriangle className={`w-4 h-4 ${risk.color} flex-shrink-0`} />
            <span className="text-[13px] text-gray-700 font-medium">
              {risk.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
