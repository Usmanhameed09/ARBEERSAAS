"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  Users,
  Megaphone,
  UserRound,
  HelpCircle,
  ChevronRight,
  ChevronDown,
  Search,
  Bookmark,
  List,
  GitBranch,
  Wrench,
  PhoneCall,
  Mail,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSavedOpportunities } from "@/context/SavedOpportunitiesContext";
import { usePipeline } from "@/context/PipelineContext";
import { useAuth } from "@/context/AuthContext";

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  href: string;
  subItems?: { label: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; href: string }[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  {
    label: "Opportunities",
    icon: FolderOpen,
    href: "/opportunities",
    subItems: [
      { label: "All Opportunities", icon: List, href: "/opportunities" },
      { label: "Saved", icon: Bookmark, href: "/opportunities/saved" },
      { label: "Pipeline", icon: GitBranch, href: "/opportunities/pipeline" },
    ],
  },
  { label: "Proposal Workspace", icon: FileText, href: "/proposals" },
  { label: "Subcontractors", icon: Users, href: "/subcontractors" },
  {
    label: "Outreach",
    icon: Megaphone,
    href: "/outreach",
    subItems: [
      { label: "Overview", icon: Megaphone, href: "/outreach" },
      { label: "Call Log", icon: PhoneCall, href: "/outreach/calls" },
      { label: "Sent Emails", icon: Mail, href: "/outreach/emails" },
      { label: "Settings", icon: Wrench, href: "/outreach/settings" },
    ],
  },
  { label: "Profile", icon: UserRound, href: "/profile" },
  { label: "Logout", icon: LogOut, href: "/logout" },
];

function NavIcon({ icon: Icon, active }: { icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; active: boolean }) {
  return (
    <span
      className="inline-flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0"
      style={{
        background: active
          ? "linear-gradient(135deg, #38bdf8 0%, #3b82f6 100%)"
          : "rgba(255,255,255,0.1)",
        color: active ? "#fff" : "rgba(203,213,225,0.9)",
      }}
    >
      <Icon className="w-3.5 h-3.5" strokeWidth={2} />
    </span>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { count: savedCount } = useSavedOpportunities();
  const { count: pipelineCount } = usePipeline();
  const { user, logout } = useAuth();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(
    new Set(["Opportunities"])
  );

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-[260px] text-white flex flex-col z-50"
      style={{
        background: "linear-gradient(180deg, #17212e 0%, #223247 55%, #17202c 100%)",
        boxShadow: "16px 0 40px rgba(15,23,42,0.16)",
      }}
    >
      {/* Logo */}
      <div className="px-5 pt-5 pb-4">
        <Link href="/" className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-2xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #f8fafc 0%, #e0f2fe 50%, #93c5fd 100%)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.95), 0 12px 24px rgba(8,47,73,0.28)",
            }}
          >
            <span style={{ color: "#0f172a", fontWeight: 700, fontSize: "14px" }}>A</span>
          </div>
          <div>
            <span className="font-bold text-base tracking-[0.14em]" style={{ color: "#fff" }}>ARBER</span>
            <span className="text-[10px] block leading-tight tracking-[0.18em]" style={{ color: "rgba(203,213,225,0.8)" }}>
              GOV BID AUTOMATION
            </span>
          </div>
        </Link>
      </div>

      {/* Search */}
      <div className="px-4 pb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#94a3b8" }} strokeWidth={2.1} />
          <input
            type="text"
            placeholder="Search opportunities..."
            className="w-full text-sm rounded-xl pl-9 pr-3 py-2.5 outline-none transition-colors"
            style={{
              background: "rgba(255,255,255,0.08)",
              color: "#f1f5f9",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          const isExpanded = expandedItems.has(item.label);
          const hasSubItems = item.subItems && item.subItems.length > 0;

          return (
            <div key={item.label}>
              {hasSubItems ? (
                <button
                  onClick={() => toggleExpand(item.label)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer"
                  style={{
                    background: isActive ? "rgba(255,255,255,0.12)" : "transparent",
                    color: isActive ? "#fff" : "#e2e8f0",
                    boxShadow: isActive ? "0 4px 12px rgba(8,47,73,0.2)" : "none",
                  }}
                >
                  <NavIcon icon={item.icon} active={isActive} />
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronDown
                    className="w-4 h-4 transition-transform duration-200"
                    style={{
                      color: "rgba(255,255,255,0.5)",
                      transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  />
                </button>
              ) : item.label === "Logout" ? (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
                  style={{
                    background: "transparent",
                    color: "#e2e8f0",
                  }}
                >
                  <NavIcon icon={item.icon} active={false} />
                  <span className="flex-1 text-left">Logout</span>
                </button>
              ) : (
                <Link
                  href={item.href}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
                  style={{
                    background: isActive ? "rgba(255,255,255,0.12)" : "transparent",
                    color: isActive ? "#fff" : "#e2e8f0",
                    boxShadow: isActive ? "0 4px 12px rgba(8,47,73,0.2)" : "none",
                  }}
                >
                  <NavIcon icon={item.icon} active={isActive} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {isActive && (
                    <ChevronRight className="w-4 h-4" style={{ color: "rgba(255,255,255,0.7)" }} />
                  )}
                </Link>
              )}

              {/* Sub items */}
              {hasSubItems && isExpanded && (
                <div className="ml-4 mt-1 space-y-0.5">
                  {item.subItems!.map((sub) => {
                    const isSubActive = pathname === sub.href;
                    const badgeCount =
                      sub.label === "Saved"
                        ? savedCount
                        : sub.label === "Pipeline"
                        ? pipelineCount
                        : 0;
                    const badgeColor =
                      sub.label === "Saved"
                        ? "bg-amber-500"
                        : "bg-orange-500";
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all duration-150"
                        style={{
                          background: isSubActive ? "rgba(255,255,255,0.08)" : "transparent",
                          color: isSubActive ? "#fff" : "rgba(203,213,225,0.8)",
                          fontWeight: isSubActive ? 600 : 400,
                        }}
                      >
                        <NavIcon icon={sub.icon} active={isSubActive} />
                        <span className="flex-1">{sub.label}</span>
                        {badgeCount > 0 && (
                          <span
                            className={`px-1.5 py-0.5 ${badgeColor} text-[10px] font-bold rounded-full min-w-[18px] text-center`}
                            style={{ color: "#fff" }}
                          >
                            {badgeCount}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User & Logout */}
      <div className="px-3 pb-5 pt-2 space-y-1">
        {user && (
          <div className="flex items-center gap-3 px-3 py-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-[11px] font-bold"
              style={{ background: "rgba(56,189,248,0.2)", color: "#38bdf8" }}
            >
              {user.fullName.split(" ").map((p) => p[0]).join("").slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-white truncate">{user.fullName}</p>
              <p className="text-[10px] truncate" style={{ color: "rgba(148,163,184,0.7)" }}>{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors cursor-pointer hover:bg-white/5"
          style={{ color: "rgba(203,213,225,0.8)" }}
        >
          <NavIcon icon={LogOut} active={false} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
