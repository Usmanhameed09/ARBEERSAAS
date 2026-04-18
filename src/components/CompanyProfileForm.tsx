"use client";

import type { ComponentType, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Building2,
  FileText,
  Globe,
  Mail,
  MapPin,
  Phone,
  Save,
  Search,
  Sparkles,
  Target,
  UserRound,
  X,
  Shield,
  DollarSign,
  Award,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Briefcase,
  Star,
  Check,
  Plus,
  Trash2,
  PenTool,
  Upload,
} from "lucide-react";
import { NAICS_CODES } from "@/data/opportunities";
import AppIcon from "@/components/AppIcon";
import { useAuth } from "@/context/AuthContext";
import { API_BASE } from "@/lib/api";

const emptyProfile = {
  contactName: "",
  jobTitle: "",
  email: "",
  phone: "",
  website: "",
  companyName: "",
  companyAddress: "",
  region: "",
  uei: "",
  cageCode: "",
  businessType: "Small Business",
  certifications: "",
  description: "",
  samRegistrationDate: "",
  samExpirationDate: "",
  samStatus: "",
  dunsNumber: "",
  bondingCapacity: "",
  bondingCompany: "",
  generalLiability: "",
  workersComp: "",
  autoLiability: "",
  insuranceExpiry: "",
  yearsInBusiness: "",
  annualRevenue: "",
  employeeCount: "",
  clearanceLevel: "",
};

function FieldLabel({
  label,
  hint,
  required = false,
}: {
  label: string;
  hint?: string;
  required?: boolean;
}) {
  return (
    <div className="mb-2">
      <label className="text-[13px] font-semibold text-slate-900">
        {label}
        {required && <span className="text-rose-500"> *</span>}
      </label>
      {hint ? <p className="mt-1 text-[12px] leading-5 text-slate-500">{hint}</p> : null}
    </div>
  );
}

function InputShell({
  icon,
  children,
}: {
  icon?: ComponentType<{ className?: string }>;
  children: ReactNode;
}) {
  const Icon = icon;

  return (
    <div className="relative">
      {Icon ? (
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      ) : null}
      {children}
    </div>
  );
}

function SectionShell({
  icon,
  title,
  description,
  children,
  action,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="rounded-[1.35rem] border border-slate-200 bg-white shadow-[0_10px_26px_rgba(15,23,42,0.05)]">
      <div className="flex items-start justify-between gap-3 sm:gap-4 border-b border-slate-200 px-4 sm:px-6 py-3 sm:py-5">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl sm:rounded-2xl bg-slate-100 shrink-0">
            <AppIcon icon={icon} size="sm" tone="blue" />
          </div>
          <div>
            <h2 className="text-sm sm:text-[18px] font-bold text-slate-950">{title}</h2>
            <p className="text-[11px] sm:text-[13px] text-slate-500">{description}</p>
          </div>
        </div>
        {action}
      </div>
      <div className="px-4 sm:px-6 py-4 sm:py-6">{children}</div>
    </section>
  );
}

function TextInput({
  value,
  onChange,
  icon,
  type = "text",
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  icon?: ComponentType<{ className?: string }>;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <InputShell icon={icon}>
      <input
        type={type}
        value={value}
        onChange={(e) => !disabled && onChange(e.target.value)}
        readOnly={disabled}
        className={`w-full rounded-xl border border-slate-200 ${disabled ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50 text-slate-800"} ${icon ? "pl-10 pr-4" : "px-4"} py-3 text-sm font-medium outline-none transition-all focus:border-slate-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(148,163,184,0.12)]`}
      />
    </InputShell>
  );
}

export default function CompanyProfileForm() {
  const { user, companyProfile, updateProfile: saveProfile, updateUser: saveUser, refreshProfile } = useAuth();
  const [profile, setProfile] = useState(emptyProfile);
  const [selectedNaics, setSelectedNaics] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [manualNaics, setManualNaics] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pastPerformance, setPastPerformance] = useState<
    { id?: string; contract: string; agency: string; value: string; period: string; cpars: string; rating: number; description?: string; pocName?: string; pocEmail?: string; pocPhone?: string }[]
  >([]);
  const [certFiles, setCertFiles] = useState<{ id: string; fileName: string; storagePath: string; createdAt: string }[]>([]);
  const [certUploading, setCertUploading] = useState(false);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [sigUploading, setSigUploading] = useState(false);

  // Load profile from AuthContext when available
  useEffect(() => {
    if (user) {
      setProfile((prev) => ({
        ...prev,
        contactName: user.fullName || "",
        jobTitle: user.jobTitle || "",
        email: user.email || "",
        phone: user.phone || "",
      }));
    }
    if (companyProfile) {
      setProfile((prev) => ({
        ...prev,
        companyName: companyProfile.companyName || "",
        companyAddress: companyProfile.companyAddress || "",
        region: companyProfile.region || "",
        website: companyProfile.website || "",
        description: companyProfile.description || "",
        businessType: companyProfile.businessType || "Small Business",
        certifications: (companyProfile.certifications || []).join(", "),
        uei: companyProfile.uei || "",
        cageCode: companyProfile.cageCode || "",
        dunsNumber: companyProfile.dunsNumber || "",
        clearanceLevel: companyProfile.clearanceLevel || "",
        samRegistrationDate: companyProfile.samRegistrationDate || "",
        samExpirationDate: companyProfile.samExpirationDate || "",
        samStatus: companyProfile.samStatus || "",
        bondingCapacity: companyProfile.bondingCapacity || "",
        bondingCompany: companyProfile.bondingCompany || "",
        generalLiability: companyProfile.generalLiability || "",
        workersComp: companyProfile.workersComp || "",
        autoLiability: companyProfile.autoLiability || "",
        insuranceExpiry: companyProfile.insuranceExpiry || "",
        yearsInBusiness: companyProfile.yearsInBusiness || "",
        annualRevenue: companyProfile.annualRevenue || "",
        employeeCount: companyProfile.employeeCount || "",
      }));
      setSelectedNaics(companyProfile.naicsCodes || []);
      if (companyProfile.pastPerformance && companyProfile.pastPerformance.length > 0) {
        setPastPerformance(companyProfile.pastPerformance);
      }
    }
  }, [user, companyProfile]);

  // Load certification files
  useEffect(() => {
    const token = localStorage.getItem("arber_token");
    if (!token) return;
    const CERT_API = API_BASE;
    fetch(`${CERT_API}/certifications`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setCertFiles(data || []))
      .catch(() => {});
    // Load signature
    fetch(`${API_BASE}/profile/signature`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.hasSignature) setSignatureUrl(data.dataUrl); })
      .catch(() => {});
  }, [saved]); // re-fetch after save

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setSaveError(null);
    try {
      const certsList = profile.certifications
        ? profile.certifications.split(",").map((c) => c.trim()).filter(Boolean)
        : [];

      // Run all three saves in parallel — each is independent
      const [profileResult, userResult, ppResult] = await Promise.allSettled([
        saveProfile({
          companyName: profile.companyName,
          companyAddress: profile.companyAddress,
          region: profile.region,
          website: profile.website,
          description: profile.description,
          businessType: profile.businessType,
          certifications: certsList,
          uei: profile.uei,
          cageCode: profile.cageCode,
          dunsNumber: profile.dunsNumber,
          clearanceLevel: profile.clearanceLevel,
          samRegistrationDate: profile.samRegistrationDate,
          samExpirationDate: profile.samExpirationDate,
          samStatus: profile.samStatus,
          bondingCapacity: profile.bondingCapacity,
          bondingCompany: profile.bondingCompany,
          generalLiability: profile.generalLiability,
          workersComp: profile.workersComp,
          autoLiability: profile.autoLiability,
          insuranceExpiry: profile.insuranceExpiry,
          yearsInBusiness: profile.yearsInBusiness,
          annualRevenue: profile.annualRevenue,
          employeeCount: profile.employeeCount,
          naicsCodes: selectedNaics,
        }),
        saveUser({
          fullName: profile.contactName,
          jobTitle: profile.jobTitle,
          phone: profile.phone,
          email: profile.email,
        }),
        (async () => {
          const t = typeof window !== "undefined" ? localStorage.getItem("arber_token") : null;
          const ppResp = await fetch(`${API_BASE}/past-performance`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              ...(t ? { Authorization: `Bearer ${t}` } : {}),
            },
            body: JSON.stringify({ references: pastPerformance }),
          });
          if (!ppResp.ok) {
            const ppData = await ppResp.json().catch(() => ({}));
            throw new Error(ppData.error || `Past performance save failed (${ppResp.status})`);
          }
        })(),
      ]);

      // Refresh profile to get updated data
      await refreshProfile().catch(() => {});

      // Check results — show saved even if some minor parts failed
      const failures = [
        profileResult.status === "rejected" ? "profile" : null,
        userResult.status === "rejected" ? "user info" : null,
        ppResult.status === "rejected" ? "past performance" : null,
      ].filter(Boolean);

      if (failures.length === 3) {
        // All failed
        throw new Error("Failed to save profile. Please check your connection and try again.");
      } else if (failures.length > 0) {
        // Partial success — show saved with warning
        console.warn("Partial save failures:", failures);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("Failed to save profile:", msg);
      setSaveError(msg);
      setTimeout(() => setSaveError(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  // Merge profile NAICS into the available list so custom codes are visible
  const allAvailableNaics = useMemo(() => {
    const baseCodes = new Set(NAICS_CODES.map((n) => n.code));
    const profileExtras = selectedNaics
      .filter((code) => !baseCodes.has(code))
      .map((code) => ({ code, label: `NAICS ${code}` }));
    return [...profileExtras, ...NAICS_CODES];
  }, [selectedNaics]);

  const filteredNaics = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return allAvailableNaics;

    return allAvailableNaics.filter(
      (item) =>
        item.code.includes(query) || item.label.toLowerCase().includes(query)
    );
  }, [search, allAvailableNaics]);

  const updateProfile = (field: keyof typeof emptyProfile, value: string) => {
    setProfile((current) => ({ ...current, [field]: value }));
  };

  const addNaics = (code: string) => {
    setSelectedNaics((current) =>
      current.includes(code) ? current : [...current, code]
    );
  };

  const removeNaics = (code: string) => {
    setSelectedNaics((current) => current.filter((item) => item !== code));
  };

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[1.6rem] border border-slate-200 bg-[linear-gradient(135deg,#f8fbff_0%,#ffffff_55%,#fffaf2_100%)] shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_240px] gap-4 sm:gap-6 px-4 sm:px-7 py-4 sm:py-7">
          <div>
            <div className="mb-3 sm:mb-4 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-sky-800">
              <Sparkles className="h-3.5 w-3.5" strokeWidth={2.1} />
              Company Profile
            </div>
            <h1 className="max-w-3xl text-xl sm:text-[32px] font-bold leading-[1.08] text-slate-950">
              Build the company profile ARBER uses to find and qualify opportunities.
            </h1>
            <p className="mt-2 sm:mt-3 max-w-3xl text-xs sm:text-[15px] leading-5 sm:leading-7 text-slate-600">
              Keep this focused. Contact details, business description, and NAICS codes
              are the three main inputs that drive profile quality.
            </p>

            <div className="mt-4 sm:mt-6 grid max-w-3xl grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                  Company
                </p>
                <p className="mt-1 truncate text-[14px] font-semibold text-slate-900">
                  {profile.companyName}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                  NAICS
                </p>
                <p className="mt-1 text-[14px] font-semibold text-slate-900">
                  {selectedNaics.length} selected
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                  Coverage
                </p>
                <p className="mt-1 text-[14px] font-semibold text-slate-900">
                  Regional
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-[1.35rem] border border-slate-200 bg-white p-5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                Save
              </p>
              <p className="mt-2 text-[14px] font-semibold text-slate-900">
                Keep your profile updated before running extraction.
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-[#1b2a3a] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#24384d] disabled:opacity-60"
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : saved ? (
                <>
                  <Check className="h-4 w-4 text-green-400" strokeWidth={2.1} />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" strokeWidth={2.1} />
                  Save Profile
                </>
              )}
            </button>
            {saveError && (
              <p className="mt-2 text-[11px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {saveError}
              </p>
            )}
          </div>
        </div>
      </div>

      <SectionShell
        icon={UserRound}
        title="General Profile"
        description="Primary contact details used in ARBER."
      >
        <div className="grid grid-cols-1 md:grid-cols-[240px_minmax(0,1fr)] gap-4 sm:gap-6">
          <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-[1.2rem] bg-[#1b2a3a] text-xl font-bold text-white">
              {profile.contactName
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)}
            </div>
            <p className="mt-4 text-[18px] font-bold text-slate-950">{profile.contactName}</p>
            <p className="text-[13px] font-medium text-slate-600">{profile.jobTitle}</p>
            <div className="mt-5 space-y-2 text-[13px] text-slate-600">
              <p>{profile.email}</p>
              <p>{profile.phone}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">
            <div>
              <FieldLabel
                label="Primary Contact"
                hint="Name shown in drafts and workflow activity."
                required
              />
              <TextInput
                value={profile.contactName}
                onChange={(value) => updateProfile("contactName", value)}
                icon={UserRound}
              />
            </div>
            <div>
              <FieldLabel label="Role / Title" hint="Job title for signatures and references." />
              <TextInput
                value={profile.jobTitle}
                onChange={(value) => updateProfile("jobTitle", value)}
              />
            </div>
            <div>
              <FieldLabel
                label="Email Address"
                hint="Business email used by ARBER."
                required
              />
              <TextInput
                value={profile.email}
                onChange={(value) => updateProfile("email", value)}
                icon={Mail}
                type="email"
              />
            </div>
            <div>
              <FieldLabel label="Phone Number" hint="Primary contact line." />
              <TextInput
                value={profile.phone}
                onChange={(value) => updateProfile("phone", value)}
                icon={Phone}
              />
            </div>
          </div>
        </div>
      </SectionShell>

      {/* Signature Upload */}
      <SectionShell
        icon={PenTool}
        title="Signature"
        description="Upload your signature image (PNG/JPG). This will be placed on SF1449 forms in your proposals."
      >
        <div className="flex items-center gap-6">
          {signatureUrl ? (
            <div className="relative border border-slate-200 rounded-xl p-3 bg-white">
              <img src={signatureUrl} alt="Signature" className="h-16 max-w-[200px] object-contain" />
              <button
                onClick={async () => {
                  try {
                    const token = localStorage.getItem("arber_token");
                    await fetch(`${API_BASE}/profile/signature`, {
                      method: "DELETE",
                      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                    });
                  } catch { /* best-effort */ }
                  setSignatureUrl(null);
                }}
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs hover:bg-rose-600"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-slate-200 rounded-xl px-8 py-6 text-center">
              <PenTool className="w-6 h-6 text-slate-300 mx-auto mb-1" />
              <p className="text-xs text-slate-400">No signature uploaded</p>
            </div>
          )}
          <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-50 text-sky-700 text-sm font-semibold hover:bg-sky-100 transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            {sigUploading ? "Uploading..." : "Upload Signature"}
            <input
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              disabled={sigUploading}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setSigUploading(true);
                try {
                  const token = localStorage.getItem("arber_token");
                  const formData = new FormData();
                  formData.append("file", file);
                  const resp = await fetch(`${API_BASE}/profile/upload-signature`, {
                    method: "POST",
                    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                    body: formData,
                  });
                  const result = await resp.json();
                  if (result.success) {
                    // Reload signature
                    const sigResp = await fetch(`${API_BASE}/profile/signature`, {
                      headers: { Authorization: `Bearer ${token}` },
                    });
                    const sigData = await sigResp.json();
                    if (sigData?.hasSignature) setSignatureUrl(sigData.dataUrl);
                  } else {
                    setSaveError(result.error || "Signature upload failed");
                  }
                } catch {
                  setSaveError("Failed to upload signature");
                } finally {
                  setSigUploading(false);
                  e.target.value = "";
                }
              }}
            />
          </label>
        </div>
      </SectionShell>

      <SectionShell
        icon={Building2}
        title="Business Profile"
        description="Company details, business description, and targeting information."
        action={
          <button className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-800 transition-colors hover:bg-sky-100">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2.1} />
            Generate Description & NAICS
          </button>
        }
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">
            <div>
              <FieldLabel
                label="Company Name"
                hint="The business name used in solicitations."
                required
              />
              <TextInput
                value={profile.companyName}
                onChange={(value) => updateProfile("companyName", value)}
                icon={Building2}
              />
            </div>
            <div>
              <FieldLabel label="Website" hint="Used for business context and enrichment." />
              <TextInput
                value={profile.website}
                onChange={(value) => updateProfile("website", value)}
                icon={Globe}
              />
            </div>
            <div className="col-span-2">
              <FieldLabel
                label="Company Address"
                hint="Address used in responses and business records."
                required
              />
              <TextInput
                value={profile.companyAddress}
                onChange={(value) => updateProfile("companyAddress", value)}
                icon={MapPin}
              />
            </div>
            <div>
              <FieldLabel
                label="Region"
                hint="States, cities, or areas where your business operates."
              />
              <TextInput
                value={profile.region}
                onChange={(value) => updateProfile("region", value)}
              />
            </div>
            <div>
              <FieldLabel
                label="Business Type"
                hint="General classification for market positioning."
              />
              <TextInput
                value={profile.businessType}
                onChange={(value) => updateProfile("businessType", value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_320px] gap-3 sm:gap-5">
            <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-5">
              <div className="mb-4 flex items-center gap-3">
                <AppIcon icon={FileText} size="sm" tone="blue" />
                <div>
                  <p className="text-[15px] font-bold text-slate-900">Business Description</p>
                  <p className="text-[12px] text-slate-500">
                    Describe capabilities, qualifications, and typical work.
                  </p>
                </div>
              </div>
              <textarea
                rows={10}
                value={profile.description}
                onChange={(e) => updateProfile("description", e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium leading-7 text-slate-800 outline-none transition-all focus:border-slate-400 focus:shadow-[0_0_0_4px_rgba(148,163,184,0.12)]"
              />
            </div>

            <div className="rounded-[1.25rem] border border-slate-200 bg-white p-5">
              <div className="mb-4 flex items-center gap-3">
                <AppIcon icon={BadgeCheck} size="sm" tone="green" />
                <div>
                  <p className="text-[15px] font-bold text-slate-900">Entity & Qualifications</p>
                  <p className="text-[12px] text-slate-500">
                    Core identifiers and certifications.
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <FieldLabel label="UEI" hint="Unique Entity Identifier from SAM.gov" />
                  <TextInput
                    value={profile.uei}
                    onChange={(value) => updateProfile("uei", value)}
                  />
                </div>
                <div>
                  <FieldLabel label="CAGE Code" />
                  <TextInput
                    value={profile.cageCode}
                    onChange={(value) => updateProfile("cageCode", value)}
                  />
                </div>
                <div>
                  <FieldLabel label="Certifications" hint="Set-asides or socio-economic qualifiers." />
                  <TextInput
                    value={profile.certifications}
                    onChange={(value) => updateProfile("certifications", value)}
                  />
                </div>
                <div>
                  <FieldLabel label="Business Type" />
                  <TextInput
                    value={profile.businessType}
                    onChange={(value) => updateProfile("businessType", value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[1.25rem] border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4">
              <div className="flex items-center gap-3">
                <AppIcon icon={Target} size="sm" tone="amber" />
                <div>
                  <p className="text-[15px] font-bold text-slate-900">NAICS Codes</p>
                  <p className="text-[12px] text-slate-500">
                    Select the codes ARBER should use for project extraction.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[300px_minmax(0,1fr)] gap-0">
              <div className="border-r border-slate-200 p-5">
                <FieldLabel label="Search Codes" hint="Search by code or industry name." />
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search NAICS"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-10 py-3 text-sm font-medium text-slate-800 outline-none transition-all focus:border-slate-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(148,163,184,0.12)]"
                  />
                </div>

                <div className="mt-4">
                  <FieldLabel label="Add Custom Code" hint="Enter a NAICS code manually." />
                  <div className="flex gap-2">
                    <input
                      value={manualNaics}
                      onChange={(e) => setManualNaics(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="e.g. 541611"
                      className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-800 outline-none transition-all focus:border-slate-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(148,163,184,0.12)]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const code = manualNaics.trim();
                        if (code.length >= 2 && !selectedNaics.includes(code)) {
                          addNaics(code);
                          setManualNaics("");
                        }
                      }}
                      disabled={manualNaics.trim().length < 2 || selectedNaics.includes(manualNaics.trim())}
                      className="flex items-center gap-1 px-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add
                    </button>
                  </div>
                </div>

                <div className="mt-5">
                  <p className="mb-3 text-[12px] font-semibold text-slate-700">
                    Selected Codes
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedNaics.map((code) => {
                      const item = NAICS_CODES.find((naics) => naics.code === code);
                      const label = item ? item.label : `NAICS ${code}`;

                      return (
                        <span
                          key={code}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-[12px] font-semibold text-slate-800"
                          title={label}
                        >
                          <span>{code}</span>
                          <button
                            type="button"
                            onClick={() => removeNaics(code)}
                            className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white text-slate-600 transition-colors hover:bg-slate-200"
                          >
                            <X className="h-3 w-3" strokeWidth={2.4} />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="p-5">
                <p className="mb-3 text-[12px] font-semibold text-slate-700">
                  Available Codes
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  {filteredNaics.map((item) => {
                    const isSelected = selectedNaics.includes(item.code);

                    return (
                      <button
                        key={item.code}
                        type="button"
                        onClick={() => addNaics(item.code)}
                        disabled={isSelected}
                        className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                          isSelected
                            ? "cursor-default border-emerald-200 bg-emerald-50"
                            : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[12px] font-bold text-slate-900">
                            {item.code}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              isSelected
                                ? "bg-emerald-500 text-white"
                                : "bg-white text-slate-600"
                            }`}
                          >
                            {isSelected ? "Added" : "Add"}
                          </span>
                        </div>
                        <p className="mt-2 text-[12px] leading-5 text-slate-600">
                          {item.label}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </SectionShell>

      {/* SAM.gov Registration */}
      <SectionShell
        icon={Shield}
        title="SAM.gov Registration"
        description="Federal registration status and entity identifiers."
      >
        <div className="space-y-5">
          {/* Status banner */}
          <div className={`rounded-xl p-4 flex items-center gap-3 ${
            profile.samStatus === "Active"
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}>
            {profile.samStatus === "Active" ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-500" />
            )}
            <div>
              <p className={`text-sm font-bold ${profile.samStatus === "Active" ? "text-green-800" : "text-red-800"}`}>
                SAM.gov Status: {profile.samStatus}
              </p>
              <p className={`text-xs ${profile.samStatus === "Active" ? "text-green-600" : "text-red-600"}`}>
                Registration expires {profile.samExpirationDate}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">
            <div>
              <FieldLabel label="UEI (Unique Entity Identifier)" hint="Assigned by SAM.gov upon registration." required />
              <TextInput value={profile.uei} onChange={(value) => updateProfile("uei", value)} />
            </div>
            <div>
              <FieldLabel label="CAGE Code" hint="Commercial and Government Entity code." required />
              <TextInput value={profile.cageCode} onChange={(value) => updateProfile("cageCode", value)} />
            </div>
            <div>
              <FieldLabel label="DUNS Number" hint="Legacy identifier, still referenced in some solicitations." />
              <TextInput value={profile.dunsNumber} onChange={(value) => updateProfile("dunsNumber", value)} />
            </div>
            <div>
              <FieldLabel label="Security Clearance" hint="Facility or personnel clearance level." />
              <TextInput value={profile.clearanceLevel} onChange={(value) => updateProfile("clearanceLevel", value)} icon={Shield} />
            </div>
            <div>
              <FieldLabel label="Registration Date" />
              <TextInput value={profile.samRegistrationDate} onChange={(value) => updateProfile("samRegistrationDate", value)} icon={Calendar} />
            </div>
            <div>
              <FieldLabel label="Expiration Date" />
              <TextInput value={profile.samExpirationDate} onChange={(value) => updateProfile("samExpirationDate", value)} icon={Calendar} />
            </div>
          </div>
        </div>
      </SectionShell>

      {/* Insurance & Bonding */}
      <SectionShell
        icon={DollarSign}
        title="Insurance & Bonding"
        description="Coverage details required for federal contract compliance."
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Bonding Capacity</p>
              </div>
              <p className="text-lg font-bold text-slate-900">{profile.bondingCapacity}</p>
              <p className="text-[11px] text-slate-500 mt-1">{profile.bondingCompany}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-blue-600" />
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">General Liability</p>
              </div>
              <p className="text-lg font-bold text-slate-900">{profile.generalLiability}</p>
              <p className="text-[11px] text-slate-500 mt-1">Per occurrence</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Insurance Expiry</p>
              </div>
              <p className="text-lg font-bold text-slate-900">{profile.insuranceExpiry}</p>
              <p className="text-[11px] text-slate-500 mt-1">All policies</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">
            <div>
              <FieldLabel label="Bonding Capacity" hint="Maximum single-contract bond amount." required />
              <TextInput value={profile.bondingCapacity} onChange={(value) => updateProfile("bondingCapacity", value)} icon={DollarSign} />
            </div>
            <div>
              <FieldLabel label="Bonding Company" hint="Surety company name." />
              <TextInput value={profile.bondingCompany} onChange={(value) => updateProfile("bondingCompany", value)} />
            </div>
            <div>
              <FieldLabel label="General Liability" hint="Per-occurrence coverage amount." required />
              <TextInput value={profile.generalLiability} onChange={(value) => updateProfile("generalLiability", value)} />
            </div>
            <div>
              <FieldLabel label="Workers' Comp" hint="Coverage type or limit." />
              <TextInput value={profile.workersComp} onChange={(value) => updateProfile("workersComp", value)} />
            </div>
            <div>
              <FieldLabel label="Auto Liability" hint="Per-occurrence coverage amount." />
              <TextInput value={profile.autoLiability} onChange={(value) => updateProfile("autoLiability", value)} />
            </div>
            <div>
              <FieldLabel label="Insurance Expiry Date" hint="Earliest expiration across all policies." />
              <TextInput value={profile.insuranceExpiry} onChange={(value) => updateProfile("insuranceExpiry", value)} icon={Calendar} />
            </div>
          </div>
        </div>
      </SectionShell>

      {/* Company Stats & Past Performance Summary */}
      <SectionShell
        icon={Briefcase}
        title="Company Overview & Past Performance"
        description="Key metrics that strengthen your proposal positioning."
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5">
            <div>
              <FieldLabel label="Years in Business" />
              <TextInput value={profile.yearsInBusiness} onChange={(value) => updateProfile("yearsInBusiness", value)} />
            </div>
            <div>
              <FieldLabel label="Annual Revenue" hint="Most recent fiscal year." />
              <TextInput value={profile.annualRevenue} onChange={(value) => updateProfile("annualRevenue", value)} icon={DollarSign} />
            </div>
            <div>
              <FieldLabel label="Employee Count" />
              <TextInput value={profile.employeeCount} onChange={(value) => updateProfile("employeeCount", value)} />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <p className="text-[14px] font-bold text-slate-900">Past Performance References</p>
              </div>
              <button
                type="button"
                onClick={() => setPastPerformance((prev) => [...prev, { contract: "", agency: "", value: "", period: "", cpars: "Satisfactory", rating: 3, description: "", pocName: "", pocEmail: "", pocPhone: "" }])}
                className="flex items-center gap-1 text-xs font-semibold text-sky-700 hover:text-sky-800 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Reference
              </button>
            </div>
            {pastPerformance.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-slate-400">No past performance references added yet.</p>
                <button
                  type="button"
                  onClick={() => setPastPerformance([{ contract: "", agency: "", value: "", period: "", cpars: "Satisfactory", rating: 3, description: "", pocName: "", pocEmail: "", pocPhone: "" }])}
                  className="mt-2 text-xs font-semibold text-sky-700 hover:text-sky-800 cursor-pointer"
                >
                  + Add your first reference
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pastPerformance.map((ref, i) => (
                  <div key={i} className="px-5 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Reference #{i + 1}</span>
                      <button
                        type="button"
                        onClick={() => setPastPerformance((prev) => prev.filter((_, idx) => idx !== i))}
                        className="p-1 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      <div>
                        <FieldLabel label="Contract Name" />
                        <TextInput
                          value={ref.contract}
                          onChange={(v) => setPastPerformance((prev) => prev.map((r, idx) => idx === i ? { ...r, contract: v } : r))}
                        />
                      </div>
                      <div>
                        <FieldLabel label="Agency" />
                        <TextInput
                          value={ref.agency}
                          onChange={(v) => setPastPerformance((prev) => prev.map((r, idx) => idx === i ? { ...r, agency: v } : r))}
                        />
                      </div>
                      <div>
                        <FieldLabel label="Contract Value" />
                        <TextInput
                          value={ref.value}
                          onChange={(v) => setPastPerformance((prev) => prev.map((r, idx) => idx === i ? { ...r, value: v } : r))}
                          icon={DollarSign}
                        />
                      </div>
                      <div>
                        <FieldLabel label="Period of Performance" />
                        <TextInput
                          value={ref.period}
                          onChange={(v) => setPastPerformance((prev) => prev.map((r, idx) => idx === i ? { ...r, period: v } : r))}
                        />
                      </div>
                      <div>
                        <FieldLabel label="CPARS Rating" />
                        <InputShell>
                          <select
                            value={ref.cpars}
                            onChange={(e) => {
                              const cpars = e.target.value;
                              const ratingMap: Record<string, number> = { Exceptional: 5, "Very Good": 4, Satisfactory: 3, Marginal: 2, Unsatisfactory: 1 };
                              setPastPerformance((prev) => prev.map((r, idx) => idx === i ? { ...r, cpars, rating: ratingMap[cpars] || 3 } : r));
                            }}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition-all focus:border-slate-400 focus:bg-white cursor-pointer"
                          >
                            <option value="Exceptional">Exceptional</option>
                            <option value="Very Good">Very Good</option>
                            <option value="Satisfactory">Satisfactory</option>
                            <option value="Marginal">Marginal</option>
                            <option value="Unsatisfactory">Unsatisfactory</option>
                          </select>
                        </InputShell>
                      </div>
                      <div className="flex items-end pb-1">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }, (_, j) => (
                            <Star key={j} className={`w-4 h-4 ${j < ref.rating ? "text-amber-400 fill-amber-400" : "text-gray-200"}`} />
                          ))}
                          <span className={`ml-2 text-xs font-semibold ${
                            ref.cpars === "Exceptional" ? "text-green-600" :
                            ref.cpars === "Very Good" ? "text-blue-600" :
                            "text-gray-600"
                          }`}>{ref.cpars}</span>
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <FieldLabel label="Description of Work" />
                        <textarea
                          value={ref.description || ""}
                          onChange={(e) => setPastPerformance((prev) => prev.map((r, idx) => idx === i ? { ...r, description: e.target.value } : r))}
                          rows={3}
                          placeholder="Describe the scope, deliverables, and relevance to federal contracting..."
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition-all focus:border-slate-400 focus:bg-white resize-none placeholder:text-slate-300"
                        />
                      </div>
                      <div className="sm:col-span-2 mt-1">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Point of Contact (Reference)</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div>
                            <FieldLabel label="POC Name" />
                            <TextInput
                              value={ref.pocName || ""}
                              onChange={(v) => setPastPerformance((prev) => prev.map((r, idx) => idx === i ? { ...r, pocName: v } : r))}
                              icon={UserRound}
                            />
                          </div>
                          <div>
                            <FieldLabel label="POC Email" />
                            <TextInput
                              value={ref.pocEmail || ""}
                              onChange={(v) => setPastPerformance((prev) => prev.map((r, idx) => idx === i ? { ...r, pocEmail: v } : r))}
                              icon={Mail}
                            />
                          </div>
                          <div>
                            <FieldLabel label="POC Phone" />
                            <TextInput
                              value={ref.pocPhone || ""}
                              onChange={(v) => setPastPerformance((prev) => prev.map((r, idx) => idx === i ? { ...r, pocPhone: v } : r))}
                              icon={Phone}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </SectionShell>

      {/* Certification Documents Upload */}
      <SectionShell
        icon={Shield}
        title="Certification Documents"
        description="Upload certification documents (8(a), HUBZone, SDVOSB, etc.) as PDF, image, or Word. These will be auto-merged as appendices in your draft proposals."
      >
        <div className="space-y-4">
          {/* Upload button */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-50 text-sky-700 text-sm font-semibold hover:bg-sky-100 transition-colors cursor-pointer">
              <Plus className="w-4 h-4" />
              {certUploading ? "Uploading..." : "Upload File"}
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.docx,.doc,application/pdf,image/*"
                className="hidden"
                disabled={certUploading}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setCertUploading(true);
                  setSaveError(null);
                  try {
                    const token = localStorage.getItem("arber_token");
                    const formData = new FormData();
                    formData.append("file", file);
                    const resp = await fetch(`${API_BASE}/certifications/upload`, {
                      method: "POST",
                      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                      body: formData,
                    });
                    if (!resp.ok) {
                      const text = await resp.text();
                      setSaveError(`Upload failed (${resp.status}): ${text.slice(0, 200)}`);
                      return;
                    }
                    const result = await resp.json();
                    if (result.success) {
                      const listResp = await fetch(`${API_BASE}/certifications`, {
                        headers: { Authorization: `Bearer ${token}` },
                      });
                      if (listResp.ok) setCertFiles(await listResp.json());
                    } else {
                      setSaveError(result.error || "Upload failed");
                    }
                  } catch (err) {
                    setSaveError(`Failed to upload: ${err instanceof Error ? err.message : String(err)}`);
                  } finally {
                    setCertUploading(false);
                    e.target.value = "";
                  }
                }}
              />
            </label>
            <p className="text-xs text-slate-400">PDF, image (JPG/PNG), or Word. These get appended to your proposal drafts automatically.</p>
            {saveError && (
              <p className="text-xs text-red-500 font-medium">{saveError}</p>
            )}
          </div>

          {/* File list */}
          {certFiles.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 px-5 py-8 text-center">
              <Shield className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No certification documents uploaded yet.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
              {certFiles.map((cert) => (
                <div key={cert.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-red-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">{cert.fileName}</p>
                      <p className="text-[11px] text-slate-400">{cert.createdAt ? new Date(cert.createdAt).toLocaleDateString() : ""}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const token = localStorage.getItem("arber_token");
                      await fetch(`${API_BASE}/certifications/${cert.id}`, {
                        method: "DELETE",
                        headers: { Authorization: `Bearer ${token}` },
                      });
                      setCertFiles((prev) => prev.filter((c) => c.id !== cert.id));
                    }}
                    className="p-1.5 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </SectionShell>
    </div>
  );
}
