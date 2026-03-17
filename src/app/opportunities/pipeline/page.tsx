"use client";

import { useState } from "react";
import Link from "next/link";
import {
  GitBranch,
  Building2,
  Calendar,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { usePipeline } from "@/context/PipelineContext";

const STEPS = ["Intake", "Compliance", "Pricing", "Draft", "Review"];

export default function PipelineListPage() {
  const { pipelineItems, removeFromPipeline } = usePipeline();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="p-3 sm:p-5">
      <div className="flex items-center gap-2 mb-5">
        <GitBranch className="w-5 h-5 text-orange-500" />
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900">Pipeline</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {pipelineItems.length} contract{pipelineItems.length !== 1 ? "s" : ""}{" "}
            in active pipeline
          </p>
        </div>
      </div>

      {pipelineItems.length > 0 ? (
        <div className="space-y-3">
          {pipelineItems.map((item) => (
            <Link
              key={item.opportunity.id}
              href={`/opportunities/pipeline/${item.opportunity.id}`}
              className="block bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all p-5"
              onMouseEnter={() => setHoveredId(item.opportunity.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {/* Top badges */}
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        item.opportunity.status === "Go"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {item.opportunity.status}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {item.opportunity.noticeId}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-bold text-gray-900 mb-2 line-clamp-1">
                    {item.opportunity.title}
                  </h3>

                  {/* Meta */}
                  <div className="flex items-center gap-4 text-[11px] text-gray-400 mb-4">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {item.opportunity.agency}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Due: {item.opportunity.dueDate}
                    </span>
                    <span className="text-gray-300">
                      Added: {item.addedAt}
                    </span>
                  </div>

                  {/* Pipeline steps */}
                  <div className="flex items-center gap-1">
                    {STEPS.map((step, i) => (
                      <div key={step} className="flex items-center gap-1">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              i < item.currentStep
                                ? "bg-green-500 text-white"
                                : i === item.currentStep
                                ? "bg-orange-500 text-white"
                                : "bg-gray-200 text-gray-400"
                            }`}
                          >
                            {i + 1}
                          </div>
                          <span
                            className={`text-[9px] mt-0.5 ${
                              i <= item.currentStep
                                ? "text-gray-700 font-medium"
                                : "text-gray-400"
                            }`}
                          >
                            {step}
                          </span>
                        </div>
                        {i < STEPS.length - 1 && (
                          <div
                            className={`w-8 h-0.5 mb-3 ${
                              i < item.currentStep
                                ? "bg-green-400"
                                : "bg-gray-200"
                            }`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-3 ml-4">
                  {/* Progress ring */}
                  <div className="text-center">
                    <div
                      className={`w-12 h-12 rounded-full border-4 flex items-center justify-center text-sm font-bold ${
                        item.compliancePercent >= 80
                          ? "border-green-400 text-green-600"
                          : item.compliancePercent >= 50
                          ? "border-orange-400 text-orange-600"
                          : "border-red-400 text-red-600"
                      }`}
                    >
                      {item.compliancePercent}
                    </div>
                    <span className="text-[9px] text-gray-400 mt-0.5 block">
                      Compliance
                    </span>
                  </div>

                  {hoveredId === item.opportunity.id && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeFromPipeline(item.opportunity.id);
                      }}
                      className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove from pipeline"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-16 text-center">
          <GitBranch className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-500 mb-1">
            No contracts in pipeline
          </p>
          <p className="text-xs text-gray-400">
            Click the &quot;Pipeline&quot; button on any opportunity card to start tracking it
          </p>
        </div>
      )}
    </div>
  );
}
