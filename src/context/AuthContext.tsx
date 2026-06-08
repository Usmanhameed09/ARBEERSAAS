"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { API_BASE } from "@/lib/apiBase";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  jobTitle?: string;
  phone?: string;
}

export interface CompanyProfile {
  id: string;
  companyName: string;
  companyAddress: string;
  region: string;
  website: string;
  description: string;
  businessType: string;
  certifications: string[];
  uei: string;
  cageCode: string;
  dunsNumber: string;
  clearanceLevel: string;
  samRegistrationDate: string;
  samExpirationDate: string;
  samStatus: string;
  bondingCapacity: string;
  bondingCompany: string;
  generalLiability: string;
  workersComp: string;
  autoLiability: string;
  insuranceExpiry: string;
  yearsInBusiness: string;
  annualRevenue: string;
  employeeCount: string;
  naicsCodes: string[];
  pastPerformance?: { id?: string; contract: string; agency: string; value: string; period: string; cpars: string; rating: number; description?: string; pocName?: string; pocEmail?: string; pocPhone?: string }[];
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  companyProfile: CompanyProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
  updateProfile: (profile: Partial<CompanyProfile>) => Promise<void>;
  updateUser: (data: Partial<AuthUser>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export interface SignupData {
  email: string;
  password: string;
  fullName: string;
  jobTitle?: string;
  phone?: string;
  companyName: string;
  companyAddress?: string;
  region?: string;
  businessType?: string;
  certifications?: string[];
  uei?: string;
  cageCode?: string;
  dunsNumber?: string;
  clearanceLevel?: string;
  naicsCodes?: string[];
}

type LoginType = "password" | "supabase" | "custom";

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const authHeaders = useCallback((t?: string) => ({
    "Content-Type": "application/json",
    ...(t || token ? { Authorization: `Bearer ${t || token}` } : {}),
  }), [token]);

  // ── Silent token refresh ───────────────────────────────────────────────
  // Backend issues a Supabase refresh_token at login. We schedule a refresh
  // ~2 min before the access_token would expire so users don't get bounced
  // out mid-session. Falls back to re-login only if the refresh fails.
  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    const rt = localStorage.getItem("arber_refresh_token");
    if (!rt) return false;
    try {
      const resp = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: rt }),
      });
      if (!resp.ok) {
        // Refresh token expired or revoked — force re-login next request
        localStorage.removeItem("arber_refresh_token");
        localStorage.removeItem("arber_token_expires_at");
        return false;
      }
      const data = await resp.json();
      const newAccess = data.access_token as string;
      const newRefresh = data.refresh_token as string;
      const expiresIn = (data.expires_in as number) || 3600;
      const expiresAt = Date.now() + expiresIn * 1000;
      setToken(newAccess);
      localStorage.setItem("arber_token", newAccess);
      localStorage.setItem("arber_refresh_token", newRefresh);
      localStorage.setItem("arber_token_expires_at", String(expiresAt));
      return true;
    } catch {
      return false;
    }
  }, []);

  // Schedule the next silent refresh based on stored expiry
  useEffect(() => {
    if (!token) return;
    const expiresAtStr = localStorage.getItem("arber_token_expires_at");
    if (!expiresAtStr) return;
    const expiresAt = Number.parseInt(expiresAtStr, 10) || 0;
    // Fire 2 min before expiry, with a 10s floor and 30 min ceiling
    const msUntilRefresh = Math.max(10_000, Math.min(expiresAt - Date.now() - 120_000, 30 * 60 * 1000));
    const handle = window.setTimeout(() => { void refreshAccessToken(); }, msUntilRefresh);
    return () => window.clearTimeout(handle);
  }, [token, refreshAccessToken]);

  // Fetch company profile
  const refreshProfile = useCallback(async (t?: string) => {
    try {
      const resp = await fetch(`${API_BASE}/profile`, {
        headers: authHeaders(t),
      });
      if (resp.ok) {
        const data = await resp.json();
        setCompanyProfile(data);
        localStorage.setItem("arber_profile", JSON.stringify(data));
      }
    } catch {
      // Try localStorage fallback
      const cached = localStorage.getItem("arber_profile");
      if (cached) setCompanyProfile(JSON.parse(cached));
    }
  }, [authHeaders]);

  // Initialize from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem("arber_token");
    const savedUser = localStorage.getItem("arber_user");

    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setToken(savedToken);
        setUser(parsedUser);

        // Load cached profile immediately
        const cachedProfile = localStorage.getItem("arber_profile");
        if (cachedProfile) setCompanyProfile(JSON.parse(cachedProfile));

        // Verify token is still valid & refresh profile from DB.
        // If expired but we have a refresh_token, do a silent refresh first.
        const verify = async (accessToken: string): Promise<Response> =>
          fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${accessToken}` } });

        (async () => {
          try {
            let resp = await verify(savedToken);
            if (resp.status === 401 && localStorage.getItem("arber_refresh_token")) {
              const refreshed = await refreshAccessToken();
              if (refreshed) {
                const newAccess = localStorage.getItem("arber_token") || "";
                resp = await verify(newAccess);
              }
            }
            if (resp.ok) {
              const me = await resp.json();
              const updatedUser = {
                id: me.id,
                email: me.email,
                fullName: me.full_name,
                jobTitle: me.job_title,
                phone: me.phone,
              };
              setUser(updatedUser);
              localStorage.setItem("arber_user", JSON.stringify(updatedUser));
              refreshProfile(localStorage.getItem("arber_token") || savedToken);
            } else {
              // Refresh failed too — drop credentials
              localStorage.removeItem("arber_token");
              localStorage.removeItem("arber_refresh_token");
              localStorage.removeItem("arber_token_expires_at");
              localStorage.removeItem("arber_user");
              localStorage.removeItem("arber_profile");
              setToken(null);
              setUser(null);
              setCompanyProfile(null);
            }
          } catch {
            // Offline — keep cached data
          } finally {
            setIsLoading(false);
          }
        })();
      } catch {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, [refreshProfile]);

  const login = async (email: string, password: string) => {
    const resp = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ detail: "Login failed" }));
      throw new Error(err.detail || "Invalid credentials");
    }

    const data = await resp.json();
    const newUser: AuthUser = {
      id: data.user_id,
      email: data.email,
      fullName: data.full_name,
    };

    setToken(data.access_token);
    setUser(newUser);
    localStorage.setItem("arber_token", data.access_token);
    localStorage.setItem("arber_user", JSON.stringify(newUser));
    localStorage.setItem("arber_login_type", "password");
    if (data.refresh_token) {
      localStorage.setItem("arber_refresh_token", data.refresh_token);
    }
    if (data.expires_in) {
      const expiresAt = Date.now() + Number(data.expires_in) * 1000;
      localStorage.setItem("arber_token_expires_at", String(expiresAt));
    }

    // Fetch profile
    await refreshProfile(data.access_token);
  };

  const signup = async (data: SignupData) => {
    const resp = await fetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        full_name: data.fullName,
        job_title: data.jobTitle || "",
        phone: data.phone || "",
        company_name: data.companyName,
        company_address: data.companyAddress || "",
        region: data.region || "",
        business_type: data.businessType || "Small Business",
        certifications: data.certifications || [],
        uei: data.uei || "",
        cage_code: data.cageCode || "",
        duns_number: data.dunsNumber || "",
        clearance_level: data.clearanceLevel || "",
        naics_codes: data.naicsCodes || [],
      }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ detail: "Signup failed" }));
      throw new Error(err.detail || "Signup failed");
    }

    const result = await resp.json();
    const newUser: AuthUser = {
      id: result.user_id,
      email: result.email,
      fullName: result.full_name,
    };

    setToken(result.access_token);
    setUser(newUser);
    localStorage.setItem("arber_token", result.access_token);
    localStorage.setItem("arber_user", JSON.stringify(newUser));
    localStorage.setItem("arber_login_type", "password");
    if (result.refresh_token) {
      localStorage.setItem("arber_refresh_token", result.refresh_token);
    }
    if (result.expires_in) {
      const expiresAt = Date.now() + Number(result.expires_in) * 1000;
      localStorage.setItem("arber_token_expires_at", String(expiresAt));
    }

    await refreshProfile(result.access_token);
  };

  const logout = () => {
    const loginType = (localStorage.getItem("arber_login_type") as LoginType | null) || "password";
    if (loginType === "supabase") {
      // Placeholder for future Supabase client sign-out.
    }
    setToken(null);
    setUser(null);
    setCompanyProfile(null);
    localStorage.removeItem("arber_token");
    localStorage.removeItem("arber_refresh_token");
    localStorage.removeItem("arber_token_expires_at");
    localStorage.removeItem("arber_user");
    localStorage.removeItem("arber_profile");
    localStorage.removeItem("arber_opportunities");
    localStorage.removeItem("arber_login_type");
    // Reset opportunity-search filters so a new login starts at profile defaults.
    localStorage.removeItem("arber_filters");
  };

  const updateProfile = async (updates: Partial<CompanyProfile>) => {
    const headers = authHeaders();

    const resp = await fetch(`${API_BASE}/profile`, {
      method: "PUT",
      headers,
      body: JSON.stringify(updates),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      console.error("[updateProfile] error:", resp.status, text);
      throw new Error(`Failed to update profile: ${resp.status}`);
    }

    const updated = await resp.json().catch(() => null);
    if (updated) {
      setCompanyProfile(updated);
      localStorage.setItem("arber_profile", JSON.stringify(updated));
    }
  };

  const updateUser = async (data: Partial<AuthUser>) => {
    const resp = await fetch(`${API_BASE}/profile/user`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({
        full_name: data.fullName,
        job_title: data.jobTitle,
        phone: data.phone,
        email: data.email,
      }),
    });

    if (!resp.ok) {
      console.error("[updateUser] error:", resp.status);
      throw new Error("Failed to update user");
    }

    const updated = await resp.json().catch(() => null);
    const newUser = {
      ...user!,
      ...data,
      fullName: updated?.full_name ?? data.fullName,
      email: updated?.email ?? data.email ?? user?.email,
    };
    setUser(newUser);
    localStorage.setItem("arber_user", JSON.stringify(newUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        companyProfile,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        signup,
        logout,
        updateProfile,
        updateUser,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
