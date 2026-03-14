"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Check,
  UserRound,
  Building2,
  Shield,
  Target,
  Sparkles,
  Search,
  X,
} from "lucide-react";
import { NAICS_CODES } from "@/data/opportunities";
import { useAuth } from "@/context/AuthContext";

const STEPS = [
  { id: 1, label: "Account", icon: UserRound, required: true },
  { id: 2, label: "Company", icon: Building2, required: false },
  { id: 3, label: "Registration", icon: Shield, required: false },
  { id: 4, label: "NAICS Codes", icon: Target, required: false },
];

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  // Step 1 - Account
  const [account, setAccount] = useState({
    fullName: "",
    jobTitle: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  // Step 2 - Company
  const [company, setCompany] = useState({
    companyName: "",
    website: "",
    address: "",
    region: "",
    businessType: "Small Business",
    certifications: "",
    description: "",
    yearsInBusiness: "",
    annualRevenue: "",
    employeeCount: "",
  });

  // Step 3 - Registration
  const [registration, setRegistration] = useState({
    uei: "",
    cageCode: "",
    dunsNumber: "",
    samRegistered: true,
    clearanceLevel: "None",
    bondingCapacity: "",
    generalLiability: "",
  });

  // Step 4 - NAICS
  const [selectedNaics, setSelectedNaics] = useState<string[]>([]);
  const [naicsSearch, setNaicsSearch] = useState("");

  const filteredNaics = useMemo(() => {
    const q = naicsSearch.trim().toLowerCase();
    if (!q) return NAICS_CODES;
    return NAICS_CODES.filter(
      (item) => item.code.includes(q) || item.label.toLowerCase().includes(q)
    );
  }, [naicsSearch]);

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);

  const onboardingMessages = [
    "Creating your account...",
    "Analyzing your NAICS codes...",
    "Fetching opportunities based on your profile...",
    "Preparing your dashboard...",
  ];

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setShowOnboarding(true);
    setOnboardingStep(0);

    try {
      // Start onboarding animation
      const stepPromise = new Promise<void>((resolve) => {
        let i = 1;
        const interval = setInterval(() => {
          if (i < onboardingMessages.length - 1) {
            setOnboardingStep(i);
            i++;
          } else {
            clearInterval(interval);
            resolve();
          }
        }, 1200);
      });

      // Call signup API
      const certsList = company.certifications
        ? company.certifications.split(",").map((c) => c.trim()).filter(Boolean)
        : [];

      await signup({
        email: account.email,
        password: account.password,
        fullName: account.fullName,
        jobTitle: account.jobTitle,
        phone: account.phone,
        companyName: company.companyName,
        companyAddress: company.address,
        region: company.region,
        businessType: company.businessType,
        certifications: certsList,
        uei: registration.uei,
        cageCode: registration.cageCode,
        dunsNumber: registration.dunsNumber,
        clearanceLevel: registration.clearanceLevel,
        naicsCodes: selectedNaics,
      });

      // Wait for animation to finish
      await stepPromise;
      setOnboardingStep(onboardingMessages.length - 1);

      // Brief pause then redirect
      setTimeout(() => router.push("/"), 1000);
    } catch (err) {
      setShowOnboarding(false);
      setLoading(false);
      setError(err instanceof Error ? err.message : "Signup failed");
    }
  };

  const canProceed = () => {
    if (step === 1) {
      return account.fullName && account.email && account.password && account.password === account.confirmPassword;
    }
    return true; // Steps 2-4 are all optional / skippable
  };

  const inputClass = "w-full border border-slate-200 bg-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition";
  const labelClass = "block text-[11px] font-semibold text-slate-500 uppercase mb-1.5";

  if (showOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(160deg, #17212e 0%, #1e3a5f 50%, #17202c 100%)" }}>
        <div className="text-center">
          <div className="mb-8 flex items-center justify-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #f8fafc 0%, #e0f2fe 50%, #93c5fd 100%)" }}
            >
              <span style={{ color: "#0f172a", fontWeight: 700, fontSize: "20px" }}>A</span>
            </div>
            <div className="text-left">
              <span className="font-bold text-xl tracking-[0.14em] block" style={{ color: "#fff" }}>ARBER</span>
              <span className="text-[10px] block tracking-[0.18em]" style={{ color: "rgba(148,163,184,0.8)" }}>GOV BID AUTOMATION</span>
            </div>
          </div>

          {/* Spinner */}
          <div className="w-16 h-16 mx-auto mb-8 relative">
            <div
              className="w-16 h-16 rounded-full border-[3px] animate-spin"
              style={{ borderColor: "rgba(56,189,248,0.15)", borderTopColor: "#38bdf8" }}
            />
          </div>

          {/* Messages */}
          <div className="space-y-3 mb-8">
            {onboardingMessages.map((msg, i) => (
              <div
                key={msg}
                className="flex items-center gap-2.5 justify-center transition-all duration-500"
                style={{
                  opacity: i <= onboardingStep ? 1 : 0.2,
                  transform: i <= onboardingStep ? "translateY(0)" : "translateY(4px)",
                }}
              >
                {i < onboardingStep ? (
                  <Check className="w-4 h-4 flex-shrink-0" style={{ color: "#22c55e" }} />
                ) : i === onboardingStep ? (
                  <div className="w-4 h-4 flex-shrink-0 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(56,189,248,0.3)", borderTopColor: "#38bdf8" }} />
                ) : (
                  <div className="w-4 h-4 flex-shrink-0" />
                )}
                <span className="text-sm" style={{ color: i <= onboardingStep ? "#e2e8f0" : "rgba(148,163,184,0.4)" }}>
                  {msg}
                </span>
              </div>
            ))}
          </div>

          <p className="text-xs" style={{ color: "rgba(148,163,184,0.6)" }}>
            This will only take a moment...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left - branding */}
      <div
        className="hidden lg:flex lg:w-[420px] flex-col justify-between p-10"
        style={{
          background: "linear-gradient(160deg, #17212e 0%, #1e3a5f 50%, #17202c 100%)",
        }}
      >
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #f8fafc 0%, #e0f2fe 50%, #93c5fd 100%)",
              }}
            >
              <span style={{ color: "#0f172a", fontWeight: 700, fontSize: "16px" }}>A</span>
            </div>
            <div>
              <span className="font-bold text-lg tracking-[0.14em]" style={{ color: "#fff" }}>ARBER</span>
              <span className="text-[10px] block tracking-[0.18em]" style={{ color: "rgba(148,163,184,0.8)" }}>
                GOV BID AUTOMATION
              </span>
            </div>
          </div>

          <h2 className="text-2xl font-bold leading-tight mb-4" style={{ color: "#fff" }}>
            Set up your company profile to start winning bids.
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "rgba(148,163,184,0.9)" }}>
            Complete your profile so ARBER can find matching opportunities, auto-draft proposals,
            and coordinate subcontractor outreach.
          </p>
        </div>

        {/* Steps progress */}
        <div className="space-y-3">
          {STEPS.map((s) => {
            const StepIcon = s.icon;
            const isDone = step > s.id;
            const isCurrent = step === s.id;
            return (
              <div key={s.id} className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: isDone
                      ? "rgba(34,197,94,0.2)"
                      : isCurrent
                      ? "rgba(56,189,248,0.2)"
                      : "rgba(255,255,255,0.06)",
                  }}
                >
                  {isDone ? (
                    <Check className="w-4 h-4" style={{ color: "#22c55e" }} />
                  ) : (
                    <StepIcon
                      className="w-4 h-4"
                      style={{
                        color: isCurrent ? "#38bdf8" : "rgba(148,163,184,0.5)",
                      }}
                    />
                  )}
                </div>
                <div>
                  <span
                    className="text-sm font-medium block"
                    style={{
                      color: isDone
                        ? "rgba(134,239,172,0.9)"
                        : isCurrent
                        ? "#fff"
                        : "rgba(148,163,184,0.5)",
                    }}
                  >
                    {s.label}
                    {isDone && " — Complete"}
                  </span>
                  {!s.required && !isDone && (
                    <span className="text-[10px]" style={{ color: "rgba(148,163,184,0.4)" }}>Optional</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right - form area */}
      <div className="flex-1 flex flex-col h-screen">
        {/* Scrollable form content */}
        <div className="flex-1 overflow-y-auto px-8 pt-8 pb-4">
          <div className="w-full max-w-xl mx-auto">
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center gap-2 mb-6">
              <div
                className="w-9 h-9 rounded-2xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)" }}
              >
                <span style={{ color: "#fff", fontWeight: 700, fontSize: "14px" }}>A</span>
              </div>
              <span className="font-bold text-base tracking-[0.14em] text-slate-900">ARBER</span>
            </div>

            {/* Step progress bar (mobile + desktop) */}
            <div className="flex items-center gap-2 mb-8">
              {STEPS.map((s) => (
                <div key={s.id} className="flex items-center gap-2 flex-1">
                  <div
                    className="h-1.5 rounded-full flex-1 transition-all"
                    style={{
                      background: step > s.id
                        ? "#22c55e"
                        : step === s.id
                        ? "#3b82f6"
                        : "#e2e8f0",
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="mb-1 text-[11px] font-semibold text-blue-600 uppercase tracking-wider">
              Step {step} of {STEPS.length}
            </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Step 1: Account */}
          {step === 1 && (
            <div>
              <h1 className="text-xl font-bold text-slate-900 mb-1">Create your account</h1>
              <p className="text-sm text-slate-500 mb-6">Primary contact details for your ARBER account</p>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Full Name *</label>
                    <input value={account.fullName} onChange={(e) => setAccount({ ...account, fullName: e.target.value })} placeholder="John Smith" className={inputClass} required />
                  </div>
                  <div>
                    <label className={labelClass}>Job Title</label>
                    <input value={account.jobTitle} onChange={(e) => setAccount({ ...account, jobTitle: e.target.value })} placeholder="Capture Manager" className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Email Address *</label>
                  <input type="email" value={account.email} onChange={(e) => setAccount({ ...account, email: e.target.value })} placeholder="you@company.com" className={inputClass} required />
                </div>
                <div>
                  <label className={labelClass}>Phone Number</label>
                  <input value={account.phone} onChange={(e) => setAccount({ ...account, phone: e.target.value })} placeholder="(555) 000-0000" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Password *</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} value={account.password} onChange={(e) => setAccount({ ...account, password: e.target.value })} placeholder="Min 8 characters" className={`${inputClass} pr-11`} required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Confirm Password *</label>
                  <input type="password" value={account.confirmPassword} onChange={(e) => setAccount({ ...account, confirmPassword: e.target.value })} placeholder="Re-enter password" className={inputClass} required />
                  {account.confirmPassword && account.password !== account.confirmPassword && (
                    <p className="text-[10px] text-red-500 mt-1">Passwords do not match</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Company */}
          {step === 2 && (
            <div>
              <h1 className="text-xl font-bold text-slate-900 mb-1">Company information</h1>
              <p className="text-sm text-slate-500 mb-6">Tell us about your business so ARBER can find matching opportunities</p>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Company Name *</label>
                    <input value={company.companyName} onChange={(e) => setCompany({ ...company, companyName: e.target.value })} placeholder="Your Company, Inc." className={inputClass} required />
                  </div>
                  <div>
                    <label className={labelClass}>Website</label>
                    <input value={company.website} onChange={(e) => setCompany({ ...company, website: e.target.value })} placeholder="https://yourcompany.com" className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Business Address</label>
                  <input value={company.address} onChange={(e) => setCompany({ ...company, address: e.target.value })} placeholder="123 Main St, City, State ZIP" className={inputClass} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Operating Region</label>
                    <input value={company.region} onChange={(e) => setCompany({ ...company, region: e.target.value })} placeholder="e.g. Ohio, Southeast US" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Business Type</label>
                    <select value={company.businessType} onChange={(e) => setCompany({ ...company, businessType: e.target.value })} className={inputClass}>
                      <option value="Small Business">Small Business</option>
                      <option value="8(a)">8(a)</option>
                      <option value="HUBZone">HUBZone</option>
                      <option value="WOSB">Woman-Owned Small Business</option>
                      <option value="SDVOSB">Service-Disabled Veteran-Owned</option>
                      <option value="Large Business">Large Business</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Certifications</label>
                  <input value={company.certifications} onChange={(e) => setCompany({ ...company, certifications: e.target.value })} placeholder="e.g. WOSB, HUBZone, Minority-Owned" className={inputClass} />
                  <p className="text-[10px] text-slate-400 mt-1">Comma-separated set-aside certifications</p>
                </div>
                <div>
                  <label className={labelClass}>Business Description</label>
                  <textarea
                    rows={3}
                    value={company.description}
                    onChange={(e) => setCompany({ ...company, description: e.target.value })}
                    placeholder="Describe your company's capabilities, experience, and target markets..."
                    className={`${inputClass} resize-y`}
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Used by AI to match opportunities and draft proposals</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>Years in Business</label>
                    <input value={company.yearsInBusiness} onChange={(e) => setCompany({ ...company, yearsInBusiness: e.target.value })} placeholder="e.g. 12" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Annual Revenue</label>
                    <input value={company.annualRevenue} onChange={(e) => setCompany({ ...company, annualRevenue: e.target.value })} placeholder="e.g. $8.5M" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Employee Count</label>
                    <input value={company.employeeCount} onChange={(e) => setCompany({ ...company, employeeCount: e.target.value })} placeholder="e.g. 85" className={inputClass} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Registration */}
          {step === 3 && (
            <div>
              <h1 className="text-xl font-bold text-slate-900 mb-1">Federal registration</h1>
              <p className="text-sm text-slate-500 mb-6">SAM.gov identifiers and compliance details (can be completed later)</p>

              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700 leading-relaxed">
                    These fields are optional during signup. You can complete them later in your Profile.
                    However, they&apos;re required before submitting proposals.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>UEI (Unique Entity Identifier)</label>
                    <input value={registration.uei} onChange={(e) => setRegistration({ ...registration, uei: e.target.value })} placeholder="XXXXXXXXXX" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>CAGE Code</label>
                    <input value={registration.cageCode} onChange={(e) => setRegistration({ ...registration, cageCode: e.target.value })} placeholder="XXXXX" className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>DUNS Number</label>
                  <input value={registration.dunsNumber} onChange={(e) => setRegistration({ ...registration, dunsNumber: e.target.value })} placeholder="XXXXXXXXX" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Security Clearance Level</label>
                  <select value={registration.clearanceLevel} onChange={(e) => setRegistration({ ...registration, clearanceLevel: e.target.value })} className={inputClass}>
                    <option value="None">None</option>
                    <option value="Facility Clearance - Confidential">Facility Clearance - Confidential</option>
                    <option value="Facility Clearance - Secret">Facility Clearance - Secret</option>
                    <option value="Facility Clearance - Top Secret">Facility Clearance - Top Secret</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Bonding Capacity</label>
                    <input value={registration.bondingCapacity} onChange={(e) => setRegistration({ ...registration, bondingCapacity: e.target.value })} placeholder="$5,000,000" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>General Liability</label>
                    <input value={registration.generalLiability} onChange={(e) => setRegistration({ ...registration, generalLiability: e.target.value })} placeholder="$2,000,000" className={inputClass} />
                  </div>
                </div>

                <label className="flex items-center gap-3 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    checked={registration.samRegistered}
                    onChange={(e) => setRegistration({ ...registration, samRegistered: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  <div>
                    <span className="text-xs font-medium text-slate-800">Registered on SAM.gov</span>
                    <p className="text-[10px] text-slate-400">Check if your entity is currently active in SAM.gov</p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Step 4: NAICS */}
          {step === 4 && (
            <div>
              <h1 className="text-xl font-bold text-slate-900 mb-1">Select your NAICS codes</h1>
              <p className="text-sm text-slate-500 mb-6">ARBER uses these to find matching government opportunities</p>

              {/* Selected chips */}
              {selectedNaics.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedNaics.map((code) => {
                    const item = NAICS_CODES.find((n) => n.code === code);
                    return (
                      <span key={code} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-xs font-semibold text-blue-800">
                        {code}
                        <button onClick={() => setSelectedNaics(selectedNaics.filter((c) => c !== code))} className="w-4 h-4 rounded-full bg-blue-200 hover:bg-blue-300 inline-flex items-center justify-center">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={naicsSearch}
                  onChange={(e) => setNaicsSearch(e.target.value)}
                  placeholder="Search by code or industry name..."
                  className={`${inputClass} pl-10`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 max-h-[340px] overflow-y-auto pr-1">
                {filteredNaics.map((item) => {
                  const isSelected = selectedNaics.includes(item.code);
                  return (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() =>
                        isSelected
                          ? setSelectedNaics(selectedNaics.filter((c) => c !== item.code))
                          : setSelectedNaics([...selectedNaics, item.code])
                      }
                      className={`rounded-xl border px-4 py-3 text-left transition-all ${
                        isSelected
                          ? "border-blue-300 bg-blue-50"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-900">{item.code}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </div>
                      <p className="text-[11px] leading-snug text-slate-500">{item.label}</p>
                    </button>
                  );
                })}
              </div>

              {selectedNaics.length === 0 && (
                <p className="text-[10px] text-slate-400 mt-3">Select your NAICS codes, or skip and add them later in your Profile</p>
              )}
            </div>
          )}

          </div>
        </div>

        {/* Sticky navigation buttons at bottom */}
        <div className="flex-shrink-0 border-t border-slate-200 bg-[#eef1f4] px-8 py-4">
          <div className="w-full max-w-xl mx-auto flex items-center justify-between">
            {step > 1 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            ) : (
              <Link href="/login" className="text-sm font-semibold text-slate-500 hover:text-slate-700">
                Already have an account? Sign in
              </Link>
            )}

            <div className="flex items-center gap-3">
              {step === 1 && !canProceed() && account.confirmPassword && (
                <span className="text-xs text-red-500">Passwords must match</span>
              )}
              {step > 1 && step < 4 && (
                <button
                  onClick={() => setStep(step + 1)}
                  className="text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Skip for now
                </button>
              )}
              {step < 4 ? (
                <button
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceed()}
                  className="flex items-center gap-1.5 px-6 py-2.5 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: canProceed() ? "#1e2a3a" : "#94a3b8",
                    color: "#fff",
                  }}
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors mr-1"
                >
                  Skip & finish
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !canProceed()}
                  className="flex items-center gap-1.5 px-6 py-2.5 text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
                  style={{
                    background: canProceed() ? "#16a34a" : "#94a3b8",
                    color: "#fff",
                  }}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating account...
                    </span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Create Account
                    </>
                  )}
                </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
