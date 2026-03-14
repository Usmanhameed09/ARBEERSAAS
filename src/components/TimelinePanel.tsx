import { FileCheck, Clock } from "lucide-react";

export default function TimelinePanel() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-baseline gap-2 mb-3">
        <h2 className="text-sm font-bold text-gray-900">Timeline:</h2>
        <span className="text-xs text-gray-500">2 Drafts Ready for Review</span>
      </div>
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <FileCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-gray-800">
              Facility Security Upgrade
            </p>
            <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
              <Clock className="w-3 h-3" />
              Due in 3 Days
            </div>
          </div>
        </div>
        <button className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm">
          Review Draft
        </button>
      </div>
    </div>
  );
}
