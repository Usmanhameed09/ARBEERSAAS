import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

const opportunities = [
  {
    name: "IT Support Services",
    agency: "Dept. of State",
    dueDate: "May 20, 2024",
    goNoGo: "Go",
    subStatus: "Quotes In",
    proposalStatus: "Drafting",
  },
  {
    name: "Facility Maintenance",
    agency: "US Air Force",
    dueDate: "May 18, 2024",
    goNoGo: "No-Go",
    subStatus: "Insurance Issue",
    proposalStatus: "Stopped",
  },

  {
    name: "Janitorial Services",
    agency: "VA",
    dueDate: "May 22, 2024",
    goNoGo: "Go",
    subStatus: "Estimated Pricing",
    proposalStatus: "Drafting",
  },
  {
    name: "Cybersecurity Assessment",
    agency: "DOE",
    dueDate: "May 30, 2024",
    goNoGo: "Go",
    subStatus: "Quotes In",
    proposalStatus: "Ready for Review",
  },
];

function GoNoGoBadge({ status }: { status: string }) {
  const config: Record<
    string,
    { shell: string; icon: string; label: string; svg: ReactNode }
  > = {
    Go: {
      shell:
        "border border-emerald-200 bg-gradient-to-b from-emerald-100 to-emerald-50 text-emerald-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]",
      icon: "bg-emerald-500",
      label: "text-emerald-800",
      svg: (
        <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" aria-hidden="true">
          <path
            d="m3.6 8.1 2.4 2.5 6-6.2"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    "No-Go": {
      shell:
        "border border-rose-200 bg-gradient-to-b from-rose-100 to-rose-50 text-rose-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]",
      icon: "bg-rose-500",
      label: "text-rose-800",
      svg: (
        <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" aria-hidden="true">
          <path
            d="M8 3.2 12.2 5v3.8c0 2.2-1.4 3.9-4.2 5.4-2.8-1.5-4.2-3.2-4.2-5.4V5L8 3.2Z"
            fill="white"
            fillOpacity=".9"
          />
          <path
            d="M8 6.1v3.1"
            stroke="#E11D48"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
          <circle cx="8" cy="11" r=".9" fill="#E11D48" />
        </svg>
      ),
    },
    Awaiting: {
      shell:
        "border border-amber-200 bg-gradient-to-b from-amber-100 to-amber-50 text-amber-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]",
      icon: "bg-amber-500",
      label: "text-amber-800",
      svg: (
        <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="5.2" stroke="white" strokeWidth="1.8" />
          <path
            d="M8 5.2v3.1l2 1.2"
            stroke="white"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
  };
  const style = config[status] || {
    shell: "border border-slate-200 bg-slate-100 text-slate-700",
    icon: "bg-slate-500",
    label: "text-slate-700",
    svg: <span className="h-3 w-3" />,
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${style.shell}`}
    >
      <span className={`flex h-4.5 w-4.5 items-center justify-center rounded-full ${style.icon}`}>
        {style.svg}
      </span>
      <span className={style.label}>{status}</span>
    </span>
  );
}

function SubStatusBadge({ status }: { status: string }) {
  const config: Record<string, string> = {
    "Quotes In": "bg-sky-100 text-sky-700",
    "Insurance Issue": "bg-red-100 text-red-600",
    Sourcing: "bg-amber-100 text-amber-700",
    "Estimated Pricing": "bg-blue-100 text-blue-600",
  };
  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
        config[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {status}
    </span>
  );
}

export default function ActiveOpportunities() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100">
        <h2 className="text-sm font-bold text-gray-900">
          Active Opportunities
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-gray-50/80 text-left border-b border-gray-100">
              <th className="px-5 py-2.5 font-semibold text-gray-500 text-[11px] uppercase tracking-wider">
                <span className="inline-flex items-center gap-1 cursor-pointer hover:text-gray-700">
                  Opportunity
                  <ChevronDown className="w-3 h-3" />
                </span>
              </th>
              <th className="px-4 py-2.5 font-semibold text-gray-500 text-[11px] uppercase tracking-wider">
                Agency
              </th>
              <th className="px-4 py-2.5 font-semibold text-gray-500 text-[11px] uppercase tracking-wider">
                Due Date
              </th>
              <th className="px-4 py-2.5 font-semibold text-gray-500 text-[11px] uppercase tracking-wider">
                Go/No-Go
              </th>
              <th className="px-4 py-2.5 font-semibold text-gray-500 text-[11px] uppercase tracking-wider">
                Sub Status
              </th>
              <th className="px-4 py-2.5 font-semibold text-gray-500 text-[11px] uppercase tracking-wider">
                Proposal Status
              </th>
            </tr>
          </thead>
          <tbody>
            {opportunities.map((opp, i) => (
              <tr
                key={i}
                className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors"
              >
                <td className="px-5 py-2.5">
                  <span className="font-medium text-blue-600 hover:underline cursor-pointer">
                    {opp.name}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-gray-600">{opp.agency}</td>
                <td className="px-4 py-2.5 text-gray-600">{opp.dueDate}</td>
                <td className="px-4 py-2.5">
                  <GoNoGoBadge status={opp.goNoGo} />
                </td>
                <td className="px-4 py-2.5">
                  <SubStatusBadge status={opp.subStatus} />
                </td>
                <td className="px-4 py-2.5 text-gray-600">
                  {opp.proposalStatus}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
