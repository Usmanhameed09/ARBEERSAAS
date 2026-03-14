"use client";

import {
  PhoneCall,
  Mail,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Megaphone,
  PhoneIncoming,
  MailOpen,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { callLogs, sentEmails } from "@/data/outreach";

export default function OutreachPage() {
  const totalCalls = callLogs.length;
  const interestedCalls = callLogs.filter((c) => c.outcome === "Interested").length;
  const totalEmails = sentEmails.length;
  const openedEmails = sentEmails.filter((e) => e.status === "Opened" || e.status === "Replied").length;

  const recentCalls = callLogs.slice(0, 4);
  const recentEmails = sentEmails.slice(0, 4);

  const outcomeColors: Record<string, string> = {
    Interested: "bg-green-100 text-green-700",
    "Not Available": "bg-gray-100 text-gray-600",
    Voicemail: "bg-amber-100 text-amber-700",
    Declined: "bg-red-100 text-red-700",
    "Follow-up": "bg-blue-100 text-blue-700",
  };

  const emailStatusColors: Record<string, string> = {
    Delivered: "bg-blue-100 text-blue-700",
    Opened: "bg-green-100 text-green-700",
    Replied: "bg-emerald-100 text-emerald-700",
    Bounced: "bg-red-100 text-red-700",
  };

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Outreach</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            AI-powered contractor outreach via calls and emails
          </p>
        </div>
        <Link
          href="/outreach/settings"
          className="flex items-center gap-1.5 px-4 py-2 bg-[#1e2a3a] hover:bg-[#2a3a4e] text-white text-xs font-semibold rounded-lg transition-colors"
        >
          <Megaphone className="w-4 h-4" />
          Configure Outreach
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <PhoneCall className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-gray-400">Total Calls</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalCalls}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-xs font-medium text-gray-400">Interested</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{interestedCalls}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
              <Mail className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-xs font-medium text-gray-400">Emails Sent</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalEmails}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <MailOpen className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-xs font-medium text-gray-400">Opened / Replied</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{openedEmails}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Recent Calls */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <PhoneIncoming className="w-4 h-4 text-blue-500" />
              Recent Calls
            </h2>
            <Link
              href="/outreach/calls"
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentCalls.map((call) => (
              <div key={call.id} className="px-5 py-3 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-800">
                    {call.contractorCompany}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${outcomeColors[call.outcome]}`}
                  >
                    {call.outcome}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 truncate">{call.contractTitle}</p>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {call.duration}
                  </span>
                  <span>{call.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Emails */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Mail className="w-4 h-4 text-purple-500" />
              Recent Emails
            </h2>
            <Link
              href="/outreach/emails"
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentEmails.map((email) => (
              <div key={email.id} className="px-5 py-3 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-800">
                    {email.toCompany}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${emailStatusColors[email.status]}`}
                  >
                    {email.status}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 truncate">{email.subject}</p>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400">
                  <span>{email.to}</span>
                  <span>{email.date}</span>
                  {email.hasAttachments && (
                    <span className="flex items-center gap-0.5">
                      <AlertCircle className="w-3 h-3" />
                      {email.attachmentCount} files
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Connection status */}
      <div className="mt-5 grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
            <Mail className="w-5 h-5 text-red-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">Email (IMAP/SMTP)</p>
            <p className="text-xs text-gray-400">Not connected</p>
          </div>
          <Link
            href="/outreach/settings"
            className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Connect
          </Link>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
            <PhoneCall className="w-5 h-5 text-red-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">VAPI Voice AI</p>
            <p className="text-xs text-gray-400">Not connected</p>
          </div>
          <Link
            href="/outreach/settings"
            className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Connect
          </Link>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-4">
        During pipeline execution, the AI agent automatically <strong>calls</strong> available contractors via VAPI,
        summarizes the contract, and <strong>emails</strong> full details with attached documents requesting pricing quotes.
      </p>
    </div>
  );
}
