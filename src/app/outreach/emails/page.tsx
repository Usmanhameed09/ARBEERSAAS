"use client";

import { useState } from "react";
import {
  Search,
  Mail,
  Paperclip,
  ExternalLink,
} from "lucide-react";
import { sentEmails } from "@/data/outreach";
import type { SentEmail } from "@/data/outreach";

type StatusFilter = "All" | "Delivered" | "Opened" | "Replied" | "Bounced";

export default function SentEmailsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");

  const filtered = sentEmails.filter((email) => {
    const matchesSearch =
      searchQuery === "" ||
      email.toCompany.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.subject.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || email.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const statusColors: Record<string, string> = {
    Delivered: "text-blue-600",
    Opened: "text-green-600",
    Replied: "text-emerald-600",
    Bounced: "text-red-500",
  };

  const statusDot: Record<string, string> = {
    Delivered: "bg-blue-500",
    Opened: "bg-green-500",
    Replied: "bg-emerald-500",
    Bounced: "bg-red-500",
  };

  const statusBadge: Record<string, string> = {
    Delivered: "bg-blue-100 text-blue-700",
    Opened: "bg-green-100 text-green-700",
    Replied: "bg-emerald-100 text-emerald-700",
    Bounced: "bg-red-100 text-red-700",
  };

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Sent Emails</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Emails sent to contractors with contract details and documents
          </p>
        </div>
      </div>

      {/* Search and filter */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search emails by recipient or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-200 text-sm text-gray-700 placeholder-gray-400 rounded-lg pl-9 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="border border-gray-200 rounded-lg px-3 py-2.5 text-xs bg-white outline-none font-medium text-gray-600"
        >
          <option value="All">All Status</option>
          <option value="Delivered">Delivered</option>
          <option value="Opened">Opened</option>
          <option value="Replied">Replied</option>
          <option value="Bounced">Bounced</option>
        </select>
      </div>

      <p className="text-xs text-gray-400 mb-3">
        Showing {filtered.length} of {sentEmails.length} emails
      </p>

      {/* Email table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-gray-50/80 text-left border-b border-gray-100">
              <th className="px-5 py-2.5 font-semibold text-gray-500 text-[11px] uppercase tracking-wider">
                Recipient
              </th>
              <th className="px-4 py-2.5 font-semibold text-gray-500 text-[11px] uppercase tracking-wider">
                Subject
              </th>
              <th className="px-4 py-2.5 font-semibold text-gray-500 text-[11px] uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-2.5 font-semibold text-gray-500 text-[11px] uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-2.5 font-semibold text-gray-500 text-[11px] uppercase tracking-wider">
                Attachments
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((email) => (
              <tr
                key={email.id}
                className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors"
              >
                <td className="px-5 py-3">
                  <div>
                    <span className="font-semibold text-gray-800">
                      {email.toCompany}
                    </span>
                    <p className="text-[11px] text-gray-400 mt-0.5">{email.to}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="text-gray-700 truncate max-w-[300px]">
                    {email.subject}
                  </p>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  <div>
                    <p className="text-xs">{email.date}</p>
                    <p className="text-[10px] text-gray-400">{email.time}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-medium ${statusColors[email.status]}`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${statusDot[email.status]}`}
                    />
                    {email.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {email.hasAttachments && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Paperclip className="w-3.5 h-3.5" />
                      {email.attachmentCount} files
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-sm text-gray-400">
              No emails match your filters.
            </p>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-3">
        Emails are automatically sent to contractors during pipeline execution with{" "}
        <strong>full RFP details</strong> and attached documents.
      </p>
    </div>
  );
}
