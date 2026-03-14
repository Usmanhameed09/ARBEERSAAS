import Link from "next/link";
import { UserRound } from "lucide-react";
import AppIcon from "@/components/AppIcon";

export default function TopBar() {
  return (
    <header className="h-14 border-b border-slate-200/80 bg-[#f8fafc]/95 backdrop-blur-sm flex items-center justify-between px-6">
      <div className="flex items-center gap-2">
        <span className="text-slate-900 font-bold text-sm tracking-[0.16em]">
          ARBER
        </span>
        <span className="text-slate-500 text-xs font-semibold tracking-[0.18em]">
          GOV BID AUTOMATION
        </span>
      </div>
      <Link
        href="/profile"
        className="flex items-center gap-2 text-slate-700 hover:text-slate-950 transition-colors text-sm font-semibold"
      >
        <AppIcon icon={UserRound} size="sm" tone="slate" />
        <span>Profile</span>
      </Link>
    </header>
  );
}
