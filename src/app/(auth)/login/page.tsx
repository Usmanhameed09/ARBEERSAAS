"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left - branding panel */}
      <div
        className="hidden lg:flex lg:w-[480px] flex-col justify-between p-10"
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

          <h2 className="text-3xl font-bold leading-tight mb-4" style={{ color: "#fff" }}>
            Win more government contracts with AI-powered automation.
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "rgba(148,163,184,0.9)" }}>
            From opportunity discovery on SAM.gov to proposal drafting and subcontractor outreach,
            ARBER automates the entire bid lifecycle.
          </p>
        </div>

        <div className="space-y-4">
          {[
            "Auto-fetch opportunities from SAM.gov",
            "AI Go/No-Go recommendations",
            "Automated proposal drafting",
            "Voice AI subcontractor outreach",
          ].map((feature) => (
            <div key={feature} className="flex items-center gap-3">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(56,189,248,0.15)" }}
              >
                <Sparkles className="w-3.5 h-3.5" style={{ color: "#38bdf8" }} />
              </div>
              <span className="text-sm" style={{ color: "rgba(203,213,225,0.9)" }}>{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right - login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div
              className="w-9 h-9 rounded-2xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
              }}
            >
              <span style={{ color: "#fff", fontWeight: 700, fontSize: "14px" }}>A</span>
            </div>
            <span className="font-bold text-base tracking-[0.14em] text-slate-900">ARBER</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-1">Welcome back</h1>
          <p className="text-sm text-slate-500 mb-8">Sign in to your account to continue</p>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full border border-slate-200 bg-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full border border-slate-200 bg-white rounded-xl px-4 py-3 pr-11 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300" />
                <span className="text-xs text-slate-600">Remember me</span>
              </label>
              <a href="#" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#1e2a3a] hover:bg-[#2a3a4e] text-white font-semibold text-sm rounded-xl py-3.5 transition-colors disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-8">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-semibold text-blue-600 hover:text-blue-700">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
