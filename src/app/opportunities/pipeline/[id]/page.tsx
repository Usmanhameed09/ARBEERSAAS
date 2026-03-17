"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  MoreHorizontal,
  Download,
  Mail,
  Phone,
  MapPin,
  User,
  FileText,
  Upload,
  Activity,
  Edit3,
  Sparkles,
  BarChart3,
  ExternalLink,
} from "lucide-react";
import { usePipeline } from "@/context/PipelineContext";

const STEPS = ["Intake", "Compliance", "Pricing", "Draft", "Review"];

// Demo compliance items
const complianceItems = [
  { label: "Insurance (Pre-Award)", status: "verified", detail: "VERIFIED" },
  { label: "SF-330 (Checklist)", status: "ready", detail: "Ready" },
  { label: "Technical Volume", status: "progress", detail: "80% Drafted" },
  { label: "Pricing Volume", status: "progress", detail: "In Progress" },
  { label: "Attachments (12/15)", status: "missing", detail: "Missing: 3" },
];

// Demo subcontractor pricing
const subPricing = [
  {
    trade: "Debris Removal",
    company: "Elite Disaster Pros",
    quote: "$48,500",
    coi: "Verified",
    status: "Selected",
    statusColor: "text-orange-600",
  },
  {
    trade: "Equipment Rental",
    company: "HeavyEquip Co.",
    quote: "$22,100",
    coi: "Verified",
    status: "Accepted",
    statusColor: "text-green-600",
  },
  {
    trade: "Labor Crew (10 ppl)",
    company: "Allstar Workers",
    quote: "$35,750",
    coi: "Pending",
    status: "Follow-Up",
    statusColor: "text-red-600",
  },
];

// Demo timeline milestones
const milestones = [
  { label: "Sub Quotes Deadline", date: "May 10", done: false },
  { label: "Draft Complete", date: "May 11", done: false },
  { label: "Final Review", date: "May 12", done: false },
];

// Demo activity log
const activityLog = [
  { time: "3:45 PM", text: "Subcontractor quote received", day: "Today" },
  { time: "11:22 AM", text: "Compliance check passed", day: "Today" },
  { time: "7:22 AM", text: "Draft v2 generated", day: "Yesterday" },
  { time: "4:10 PM", text: "Pricing sheet updated", day: "Yesterday" },
];

// Demo files
const files = [
  { name: "Technical Proposal (v3)", icon: FileText },
  { name: "Pricing Sheet", icon: FileText },
  { name: "Compliance Matrix", icon: FileText },
  { name: "Cover Letter", icon: FileText },
];

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "verified":
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    case "ready":
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    case "progress":
      return <AlertCircle className="w-4 h-4 text-amber-500" />;
    case "missing":
      return <XCircle className="w-4 h-4 text-red-500" />;
    default:
      return <AlertCircle className="w-4 h-4 text-gray-400" />;
  }
}

function StatusBadge({ detail, status }: { detail: string; status: string }) {
  const colors: Record<string, string> = {
    verified: "text-green-600 bg-green-50",
    ready: "text-green-600 bg-green-50",
    progress: "text-amber-600 bg-amber-50",
    missing: "text-red-600 bg-red-50",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
        colors[status] || "text-gray-500 bg-gray-50"
      }`}
    >
      {detail}
    </span>
  );
}

export default function PipelineDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { pipelineItems } = usePipeline();

  const item = pipelineItems.find((p) => p.opportunity.id === id);

  if (!item) {
    return (
      <div className="p-3 sm:p-5">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-16 text-center">
          <p className="text-sm text-gray-500 mb-3">
            Pipeline item not found. It may have been removed.
          </p>
          <button
            onClick={() => router.push("/opportunities/pipeline")}
            className="text-sm text-blue-600 hover:underline"
          >
            Back to Pipeline
          </button>
        </div>
      </div>
    );
  }

  const opp = item.opportunity;
  const isGo = opp.status === "Go";

  // Calculate a demo countdown
  const dueDate = new Date(opp.dueDate);
  const now = new Date();
  const diffMs = dueDate.getTime() - now.getTime();
  const days = Math.max(0, Math.floor(diffMs / 86400000));
  const hours = Math.max(0, Math.floor((diffMs % 86400000) / 3600000));

  return (
    <div className="p-3 sm:p-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
        <Link href="/opportunities" className="hover:text-blue-600">
          Opportunities
        </Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/opportunities/pipeline" className="hover:text-blue-600">
          Pipeline
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-600 font-medium">#{opp.noticeId}</span>
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-5">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#1e2a3a] flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg">
                {opp.agency.charAt(0)}
              </span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-snug mb-1">
                {opp.title}
              </h1>
              <div className="flex items-center gap-3 flex-wrap text-xs">
                <span className="font-semibold text-blue-700">
                  {opp.agency.split(" ").slice(0, 2).join(" ")}
                </span>
                <span className="text-gray-400">|</span>
                <span className="flex items-center gap-1 text-gray-500">
                  <Calendar className="w-3 h-3" />
                  Due: {opp.dueDate} ({days} days)
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    days <= 7
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {days <= 7 ? "Urgent" : "Active"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 transition-colors">
              <Edit3 className="w-3.5 h-3.5" />
              Track
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 transition-colors">
              <Calendar className="w-3.5 h-3.5" />
              Calendar
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold transition-colors">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Mark Ready for Review
            </button>
          </div>
        </div>

        {/* Pipeline steps */}
        <div className="mt-5 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            {STEPS.map((step, i) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      i < item.currentStep
                        ? "bg-green-500 text-white"
                        : i === item.currentStep
                        ? "bg-blue-600 text-white ring-4 ring-blue-100"
                        : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <span
                    className={`text-[11px] mt-1 font-medium ${
                      i <= item.currentStep
                        ? "text-gray-800"
                        : "text-gray-400"
                    }`}
                  >
                    {step}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 rounded mb-4 ${
                      i < item.currentStep ? "bg-green-400" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
            {/* Score badge */}
            <div className="ml-4 flex-shrink-0">
              <div
                className={`w-14 h-14 rounded-full border-4 flex items-center justify-center ${
                  isGo
                    ? "border-green-400 text-green-600"
                    : "border-red-400 text-red-600"
                }`}
              >
                <div className="text-center">
                  <span className="text-lg font-bold leading-none">
                    {item.compliancePercent}
                  </span>
                </div>
              </div>
              <div className="mt-0.5 text-center">
                <span
                  className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                    isGo ? "bg-green-500 text-white" : "bg-red-500 text-white"
                  }`}
                >
                  {opp.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
        {/* Left column */}
        <div className="space-y-5">
          {/* Compliance + Timeline row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-5">
            {/* Compliance Checklist */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-gray-900">
                  Compliance Checklist
                </h2>
                <span className="text-xs text-blue-600 hover:underline cursor-pointer">
                  View All (34)
                </span>
              </div>
              {/* Progress bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <div className="w-full bg-gray-200 rounded-full h-2 mr-3">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${item.compliancePercent}%` }}
                    />
                  </div>
                  <span className="text-gray-600 font-semibold whitespace-nowrap">
                    {item.compliancePercent}% Complete
                  </span>
                </div>
              </div>
              <div className="space-y-2.5">
                {complianceItems.map((ci, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-1"
                  >
                    <div className="flex items-center gap-2">
                      <StatusIcon status={ci.status} />
                      <span className="text-xs text-gray-700">{ci.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge detail={ci.detail} status={ci.status} />
                      <MoreHorizontal className="w-3.5 h-3.5 text-gray-300 cursor-pointer hover:text-gray-500" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-gray-900">Timeline</h2>
                <div className="flex items-center gap-2">
                  <button className="text-[11px] text-gray-500 hover:text-gray-700 flex items-center gap-1 px-2 py-1 rounded border border-gray-200">
                    <Calendar className="w-3 h-3" />
                    Calendar
                  </button>
                </div>
              </div>

              {/* Countdown */}
              <div className="mb-4">
                <p className="text-[11px] text-gray-500 mb-1">
                  Due Date: {opp.dueDate}
                </p>
                <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
                  <span className="text-orange-700 font-mono font-bold text-lg">
                    {days}d : {hours}h : 32m : 18s
                  </span>
                </div>
              </div>

              {/* Milestones */}
              <div className="space-y-3">
                {milestones.map((ms, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div
                      className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                        ms.done ? "bg-green-500" : "bg-amber-400"
                      }`}
                    />
                    <span className="text-xs text-gray-700 flex-1">
                      {ms.label}
                    </span>
                    <span className="text-xs text-gray-400 font-medium">
                      {ms.date}
                    </span>
                    <div
                      className={`w-4 h-4 rounded-full border-2 ${
                        ms.done ? "border-green-500 bg-green-500" : "border-gray-300"
                      }`}
                    />
                  </div>
                ))}
              </div>

              <button className="mt-4 w-full flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 transition-colors">
                <Download className="w-3.5 h-3.5" />
                Download Full Checklist
              </button>
            </div>
          </div>

          {/* Subcontractor Pricing */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900">
                Subcontractor Pricing
              </h2>
              <div className="flex items-center gap-1.5">
                {[
                  { label: "Quotes Received (3)", active: true },
                  { label: "Pending (2)", active: false },
                  { label: "Estimated", active: false },
                  { label: "Auto-Fill", icon: true, active: false },
                ].map((tab, i) => (
                  <button
                    key={i}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                      tab.active
                        ? "bg-[#1e2a3a] text-white"
                        : "text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    {tab.icon && <Sparkles className="w-3 h-3 inline mr-1" />}
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-gray-50/80 text-left border-b border-gray-100">
                  <th className="px-5 py-2.5 font-semibold text-gray-500 text-[11px] uppercase tracking-wider">
                    Trade
                  </th>
                  <th className="px-4 py-2.5 font-semibold text-gray-500 text-[11px] uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-4 py-2.5 font-semibold text-gray-500 text-[11px] uppercase tracking-wider">
                    Quote
                  </th>
                  <th className="px-4 py-2.5 font-semibold text-gray-500 text-[11px] uppercase tracking-wider">
                    COI
                  </th>
                  <th className="px-4 py-2.5 font-semibold text-gray-500 text-[11px] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {subPricing.map((sub, i) => (
                  <tr
                    key={i}
                    className="border-b border-gray-50 hover:bg-blue-50/30"
                  >
                    <td className="px-5 py-2.5 font-medium text-gray-800">
                      {sub.trade}
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">
                      <span className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[9px] font-bold text-gray-500">
                          {sub.company.charAt(0)}
                        </span>
                        {sub.company}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-gray-800">
                      {sub.quote}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`text-xs font-medium ${
                          sub.coi === "Verified"
                            ? "text-green-600"
                            : "text-amber-500"
                        }`}
                      >
                        {sub.coi === "Verified" ? "● " : "○ "}
                        {sub.coi}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`text-xs font-semibold ${sub.statusColor}`}
                      >
                        {sub.status === "Selected" && "⚡ "}
                        {sub.status === "Accepted" && "✓ "}
                        {sub.status === "Follow-Up" && "↻ "}
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <MoreHorizontal className="w-4 h-4 text-gray-300 cursor-pointer hover:text-gray-500" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Total */}
            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">
                  ● Total Projected Price:
                </span>
                <span className="text-lg font-bold text-gray-900">
                  ${item.pricingTotal.toLocaleString()}
                </span>
                <span className="text-xs text-gray-400">
                  Target: $125K
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        (item.pricingTotal / item.pricingTarget) * 100
                      )}%`,
                    }}
                  />
                </div>
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg transition-colors">
                  <BarChart3 className="w-3.5 h-3.5" />
                  Pricing Analysis
                </button>
              </div>
            </div>
          </div>

          {/* Proposal Draft */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-900">
                Proposal Draft
              </h2>
              <div className="flex items-center gap-2 text-[11px] text-gray-400">
                <span>Last Updated: May 8, 2024 3:45 PM</span>
                <button className="p-1 hover:bg-gray-100 rounded">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4">
              {[
                {
                  label: "Technical Volume",
                  value: `${item.draftProgress.technical}% Complete`,
                  color:
                    item.draftProgress.technical >= 80
                      ? "border-orange-400 bg-orange-50"
                      : "border-gray-200 bg-gray-50",
                },
                {
                  label: "Pricing Volume",
                  value: `${item.draftProgress.pricing}% Complete`,
                  color:
                    item.draftProgress.pricing >= 90
                      ? "border-blue-400 bg-blue-50"
                      : "border-gray-200 bg-gray-50",
                },
                {
                  label: "Compliance",
                  value: "100% mapped",
                  color: "border-green-400 bg-green-50",
                },
                {
                  label: "Final Package",
                  value: item.draftProgress.finalReady ? "Ready" : "Pending",
                  color: item.draftProgress.finalReady
                    ? "border-green-400 bg-green-50"
                    : "border-gray-200 bg-gray-50",
                },
              ].map((d, i) => (
                <div
                  key={i}
                  className={`rounded-lg border-2 p-3 ${d.color}`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <FileText className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-[11px] font-semibold text-gray-700">
                      {d.label}
                    </span>
                  </div>
                  <span className="text-xs text-gray-600">{d.value}</span>
                </div>
              ))}
            </div>
            <button className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors">
              <Sparkles className="w-3.5 h-3.5" />
              Generate New Draft
            </button>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">
          {/* Opportunity Contact */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-xs font-bold text-gray-900 mb-3">
              Opportunity Contact
            </h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {opp.pointOfContact.name}
                </p>
                <p className="text-[11px] text-gray-400">Contracting Officer</p>
              </div>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-gray-500">
                <MapPin className="w-3.5 h-3.5" />
                {opp.placeOfPerformance}
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-blue-600">{opp.pointOfContact.email}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <Phone className="w-3.5 h-3.5" />
                {opp.pointOfContact.phone}
              </div>
            </div>
            <button className="mt-3 w-full text-center text-xs text-blue-600 hover:underline font-medium">
              View Profile
            </button>
          </div>

          {/* Outreach */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-xs font-bold text-gray-900 mb-3">Outreach</h3>
            <div className="space-y-2 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                Last Email: Sent (May 1)
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-green-400" />
                Last Call: Completed (May 2)
              </div>
            </div>
            <button className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 transition-colors">
              <Activity className="w-3.5 h-3.5" />
              Log Activity
            </button>
          </div>

          {/* Files & Documents */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-xs font-bold text-gray-900 mb-3">
              Files & Documents
            </h3>
            <div className="space-y-1.5">
              {files.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-1.5 hover:bg-gray-50 rounded px-1 -mx-1 cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-xs text-gray-700">
                    <f.icon className="w-3.5 h-3.5 text-gray-400" />
                    {f.name}
                  </div>
                  <ExternalLink className="w-3 h-3 text-gray-300" />
                </div>
              ))}
            </div>
            <button className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 transition-colors">
              <Upload className="w-3.5 h-3.5" />
              Upload Files
            </button>
          </div>

          {/* Activity Log */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-xs font-bold text-gray-900 mb-3">
              Activity Log
            </h3>
            <div className="space-y-3">
              {activityLog.map((log, i) => {
                const showDay =
                  i === 0 || activityLog[i - 1].day !== log.day;
                return (
                  <div key={i}>
                    {showDay && (
                      <p className="text-[10px] font-bold text-gray-500 uppercase mb-1.5">
                        {log.day}
                      </p>
                    )}
                    <div className="flex items-start gap-2 text-xs">
                      <span className="text-gray-400 whitespace-nowrap text-[11px]">
                        {log.time}
                      </span>
                      <span className="text-gray-600">{log.text}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
