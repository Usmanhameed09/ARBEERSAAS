"use client";

import dynamic from "next/dynamic";

const CompanyProfileForm = dynamic(
  () => import("@/components/CompanyProfileForm"),
  {
    ssr: false,
    loading: () => (
      <div className="p-3 sm:p-5">
        <div className="animate-pulse space-y-6">
          <div className="h-48 bg-gray-200 rounded-2xl" />
          <div className="h-64 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    ),
  }
);

export default function ProfilePage() {
  return (
    <div className="p-3 sm:p-5">
      <CompanyProfileForm />
    </div>
  );
}
