"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";

const PUBLIC_ROUTES = ["/login", "/signup"];

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isPublicRoute = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated && !isPublicRoute) {
      router.replace("/login");
    }
    if (isAuthenticated && isPublicRoute) {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, isPublicRoute, router, pathname]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#eef1f4]">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading ARBER...</p>
        </div>
      </div>
    );
  }

  // Public routes (login/signup) — no sidebar
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Not authenticated — don't render anything (redirect will happen)
  if (!isAuthenticated) {
    return null;
  }

  // Authenticated — show full app layout
  return (
    <>
      <Sidebar />
      <div className="ml-0 md:ml-[260px] min-h-screen bg-[#eef1f4]">
        <TopBar />
        <main>{children}</main>
      </div>
    </>
  );
}
