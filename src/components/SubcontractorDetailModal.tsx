"use client";

import {
  X,
  Mail,
  Phone,
  MapPin,
  Building2,
  Shield,
  FileText,
  Star,
} from "lucide-react";
import type { Subcontractor } from "@/data/subcontractors";

interface SubcontractorDetailModalProps {
  sub: Subcontractor;
  onClose: () => void;
  onTogglePreferred: (id: string) => void;
}

export default function SubcontractorDetailModal({
  sub,
  onClose,
  onTogglePreferred,
}: SubcontractorDetailModalProps) {
  const insuranceColors: Record<string, string> = {
    Verified: "bg-green-100 text-green-700",
    Pending: "bg-amber-100 text-amber-700",
    Expired: "bg-red-100 text-red-700",
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1e2a3a] flex items-center justify-center text-white font-bold text-sm">
              {sub.company.charAt(0)}
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">{sub.company}</h2>
              <p className="text-xs text-gray-400">{sub.trade} - {sub.source}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Status badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${insuranceColors[sub.insuranceReady]}`}>
              Insurance: {sub.insuranceReady}
            </span>
            {sub.preferred && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-orange-100 text-orange-700">
                Preferred Contractor
              </span>
            )}
            {sub.certifications.map((c) => (
              <span key={c} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[11px] font-medium rounded-full">
                {c}
              </span>
            ))}
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                <MapPin className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase font-semibold">Location</span>
              </div>
              <p className="text-xs font-medium text-gray-800">{sub.location || "Not specified"}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                <Building2 className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase font-semibold">Experience</span>
              </div>
              <p className="text-xs font-medium text-gray-800">{sub.experience}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                <FileText className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase font-semibold">Past Contracts</span>
              </div>
              <p className="text-xs font-medium text-gray-800">{sub.pastContracts}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                <Shield className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase font-semibold">Source</span>
              </div>
              <p className="text-xs font-medium text-gray-800">{sub.source}</p>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs font-bold text-gray-900 mb-2">Contact</h3>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-gray-600">
                <span className="font-medium">{sub.contactName}</span>
              </div>
              <div className="flex items-center gap-2 text-blue-600">
                <Mail className="w-3.5 h-3.5 text-gray-400" />
                {sub.contactEmail}
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                {sub.contactPhone}
              </div>
            </div>
          </div>

          {/* Rating */}
          {sub.rating > 0 && (
            <div>
              <h3 className="text-xs font-bold text-gray-900 mb-1">Rating</h3>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${
                      s <= sub.rating
                        ? "text-amber-400 fill-amber-400"
                        : "text-gray-200"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {sub.notes && (
            <div>
              <h3 className="text-xs font-bold text-gray-900 mb-1">Notes</h3>
              <p className="text-xs text-gray-600 leading-relaxed">{sub.notes}</p>
            </div>
          )}

          {/* Preferred toggle */}
          <div className="pt-2 border-t border-gray-100">
            <button
              onClick={() => onTogglePreferred(sub.id)}
              className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                sub.preferred
                  ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  : "bg-orange-500 hover:bg-orange-600 text-white"
              }`}
            >
              {sub.preferred
                ? "Remove from Preferred (Always in Pipeline)"
                : "Set as Preferred (Always Include in Pipeline)"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
