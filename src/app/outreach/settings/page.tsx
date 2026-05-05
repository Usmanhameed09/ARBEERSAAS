"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Mail, Eye, EyeOff, Save, Send, Loader2, CheckCircle2, AlertCircle, Info,
  Compass, Settings as SettingsIcon, Key,
} from "lucide-react";
import {
  getOutreachSettings, updateOutreachSettings, outreachTestSend,
  type OutreachSettings, type OutreachSettingsInput,
} from "@/lib/api";

const PASSWORD_MASK = "••••••••";

export default function OutreachSettingsPage() {
  const [settings, setSettings] = useState<OutreachSettings>({});
  const [form, setForm] = useState<OutreachSettingsInput>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testTo, setTestTo] = useState("");
  const [savedAt, setSavedAt] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ ok: boolean; provider?: string; error?: string } | null>(null);
  const [showSecrets, setShowSecrets] = useState({ sendgrid: false, smtp: false, imap: false, places: false });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const s = await getOutreachSettings();
      setSettings(s);
      setForm({
        senderName: s.senderName || "",
        senderEmail: s.senderEmail || "",
        senderPhone: s.senderPhone || "",
        senderTitle: s.senderTitle || "",
        senderSignature: s.senderSignature || "",
        sendgridVerifiedSender: s.sendgridVerifiedSender || "",
        smtpHost: s.smtpHost || "",
        smtpPort: s.smtpPort || 587,
        smtpUsername: s.smtpUsername || "",
        imapHost: s.imapHost || "",
        imapPort: s.imapPort || 993,
        imapUsername: s.imapUsername || "",
        alwaysPreviewFirst: s.alwaysPreviewFirst || false,
        dailySendCap: s.dailySendCap || 50,
        step2DelayDays: s.step2DelayDays ?? 3,
        step3DelayDays: s.step3DelayDays ?? 6,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const update = (k: keyof OutreachSettingsInput, v: unknown) => setForm((p) => ({ ...p, [k]: v as never }));

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const ok = await updateOutreachSettings(form);
      if (!ok) throw new Error("Save failed");
      setSavedAt(Date.now());
      // Re-fetch to refresh secret-set indicators
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleTestSend = async () => {
    if (!testTo) return;
    setTesting(true);
    setTestResult(null);
    try {
      const r = await outreachTestSend(testTo);
      setTestResult(r);
    } catch (e) {
      setTestResult({ ok: false, error: e instanceof Error ? e.message : "Test failed" });
    } finally {
      setTesting(false);
    }
  };

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400";
  const labelCls = "block text-[11px] font-semibold text-gray-500 uppercase mb-1";

  if (loading) {
    return (
      <div className="p-5"><div className="bg-white p-8 rounded-xl border text-center text-sm text-slate-500"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" /> Loading settings…</div></div>
    );
  }

  return (
    <div className="p-3 sm:p-5 max-w-4xl">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Outreach Settings</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure email sending (SendGrid OR your own SMTP), reply detection (IMAP), and discovery (Google Places).
          </p>
        </div>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg disabled:opacity-50">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save All
        </button>
      </div>

      {savedAt > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg p-2 mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Settings saved.
        </div>
      )}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg p-2 mb-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      <div className="space-y-5">
        {/* SENDER IDENTITY */}
        <Section title="Sender Identity" icon={<Mail className="w-4 h-4" />} description="How recipients see your email — From name, reply-to address, and signature.">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sender name *">
              <input className={inputCls} value={form.senderName || ""} onChange={(e) => update("senderName", e.target.value)} placeholder="Arthur Beda" />
            </Field>
            <Field label="Sender email * (replies land here)">
              <input className={inputCls} value={form.senderEmail || ""} onChange={(e) => update("senderEmail", e.target.value)} placeholder="arthur.b@arbernetwork.com" />
            </Field>
            <Field label="Phone (in signature)">
              <input className={inputCls} value={form.senderPhone || ""} onChange={(e) => update("senderPhone", e.target.value)} />
            </Field>
            <Field label="Title">
              <input className={inputCls} value={form.senderTitle || ""} onChange={(e) => update("senderTitle", e.target.value)} placeholder="Managing Member" />
            </Field>
            <Field label="Company / signature line" full>
              <input className={inputCls} value={form.senderSignature || ""} onChange={(e) => update("senderSignature", e.target.value)} placeholder="ARBER LLC" />
            </Field>
          </div>
        </Section>

        {/* SENDGRID */}
        <Section title="SendGrid (recommended for sending)" icon={<Send className="w-4 h-4" />} description="Free tier: 100 emails/day. Sign up at sendgrid.com → Sender Authentication → verify your sender email → API Keys → create one with Mail Send permission.">
          <div className="grid grid-cols-2 gap-3">
            <Field label="SendGrid API key" full>
              <div className="relative">
                <input
                  type={showSecrets.sendgrid ? "text" : "password"}
                  className={inputCls}
                  value={form.sendgrid_api_key || ""}
                  onChange={(e) => update("sendgrid_api_key", e.target.value)}
                  placeholder={settings.sendgrid_api_keySet ? PASSWORD_MASK : "SG..."}
                />
                <button type="button" onClick={() => setShowSecrets((p) => ({ ...p, sendgrid: !p.sendgrid }))} className="absolute right-2 top-2 text-gray-400 hover:text-gray-700">
                  {showSecrets.sendgrid ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {settings.sendgrid_api_keySet && <p className="text-[10px] text-emerald-700 mt-1">✓ Key set. Leave blank to keep current.</p>}
            </Field>
            <Field label="Verified sender email (must match SendGrid)" full>
              <input className={inputCls} value={form.sendgridVerifiedSender || ""} onChange={(e) => update("sendgridVerifiedSender", e.target.value)} placeholder="same as Sender email above (or different verified sender)" />
            </Field>
          </div>
        </Section>

        {/* SMTP FALLBACK */}
        <Section title="SMTP (alternative or fallback)" icon={<Mail className="w-4 h-4" />} description="Use your own email account (Gmail/Outlook/O365) to send if not using SendGrid. For Gmail: enable 2FA + create App Password.">
          <div className="grid grid-cols-2 gap-3">
            <Field label="SMTP host"><input className={inputCls} value={form.smtpHost || ""} onChange={(e) => update("smtpHost", e.target.value)} placeholder="smtp.gmail.com" /></Field>
            <Field label="SMTP port"><input type="number" className={inputCls} value={form.smtpPort ?? 587} onChange={(e) => update("smtpPort", parseInt(e.target.value) || 587)} /></Field>
            <Field label="SMTP username"><input className={inputCls} value={form.smtpUsername || ""} onChange={(e) => update("smtpUsername", e.target.value)} placeholder="your-email@gmail.com" /></Field>
            <Field label="SMTP password / app password">
              <div className="relative">
                <input
                  type={showSecrets.smtp ? "text" : "password"}
                  className={inputCls}
                  value={form.smtp_password || ""}
                  onChange={(e) => update("smtp_password", e.target.value)}
                  placeholder={settings.smtp_passwordSet ? PASSWORD_MASK : ""}
                />
                <button type="button" onClick={() => setShowSecrets((p) => ({ ...p, smtp: !p.smtp }))} className="absolute right-2 top-2 text-gray-400 hover:text-gray-700">
                  {showSecrets.smtp ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {settings.smtp_passwordSet && <p className="text-[10px] text-emerald-700 mt-1">✓ Password set. Leave blank to keep current.</p>}
            </Field>
          </div>
        </Section>

        {/* IMAP for replies */}
        <Section title="IMAP (read replies)" icon={<Mail className="w-4 h-4" />} description="The poller checks this inbox every 5 minutes for replies to outreach emails. Usually same account as SMTP.">
          <div className="grid grid-cols-2 gap-3">
            <Field label="IMAP host"><input className={inputCls} value={form.imapHost || ""} onChange={(e) => update("imapHost", e.target.value)} placeholder="imap.gmail.com" /></Field>
            <Field label="IMAP port"><input type="number" className={inputCls} value={form.imapPort ?? 993} onChange={(e) => update("imapPort", parseInt(e.target.value) || 993)} /></Field>
            <Field label="IMAP username"><input className={inputCls} value={form.imapUsername || ""} onChange={(e) => update("imapUsername", e.target.value)} placeholder="your-email@gmail.com" /></Field>
            <Field label="IMAP password / app password">
              <div className="relative">
                <input
                  type={showSecrets.imap ? "text" : "password"}
                  className={inputCls}
                  value={form.imap_password || ""}
                  onChange={(e) => update("imap_password", e.target.value)}
                  placeholder={settings.imap_passwordSet ? PASSWORD_MASK : ""}
                />
                <button type="button" onClick={() => setShowSecrets((p) => ({ ...p, imap: !p.imap }))} className="absolute right-2 top-2 text-gray-400 hover:text-gray-700">
                  {showSecrets.imap ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {settings.imap_passwordSet && <p className="text-[10px] text-emerald-700 mt-1">✓ Password set. Leave blank to keep current.</p>}
            </Field>
          </div>
        </Section>

        {/* GOOGLE PLACES */}
        <Section title="Google Places API" icon={<Compass className="w-4 h-4" />} description="Optional — for finding LOCAL businesses in subcontractor discovery (lawn care, janitorial, etc.). Free $200/month credit from Google. Get key at console.cloud.google.com → enable Places API.">
          <Field label="Google Places API key" full>
            <div className="relative">
              <input
                type={showSecrets.places ? "text" : "password"}
                className={inputCls}
                value={form.google_places_api_key || ""}
                onChange={(e) => update("google_places_api_key", e.target.value)}
                placeholder={settings.google_places_api_keySet ? PASSWORD_MASK : "AIza..."}
              />
              <button type="button" onClick={() => setShowSecrets((p) => ({ ...p, places: !p.places }))} className="absolute right-2 top-2 text-gray-400 hover:text-gray-700">
                {showSecrets.places ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {settings.google_places_api_keySet && <p className="text-[10px] text-emerald-700 mt-1">✓ Key set.</p>}
          </Field>
        </Section>

        {/* CAMPAIGN BEHAVIOR */}
        <Section title="Campaign Behavior" icon={<SettingsIcon className="w-4 h-4" />} description="Step delays and approval thresholds.">
          <div className="grid grid-cols-3 gap-3">
            <Field label="Step 2 delay (days)"><input type="number" className={inputCls} value={form.step2DelayDays ?? 3} onChange={(e) => update("step2DelayDays", parseInt(e.target.value) || 3)} /></Field>
            <Field label="Step 3 delay (days)"><input type="number" className={inputCls} value={form.step3DelayDays ?? 6} onChange={(e) => update("step3DelayDays", parseInt(e.target.value) || 6)} /></Field>
            <Field label="Daily send cap"><input type="number" className={inputCls} value={form.dailySendCap ?? 50} onChange={(e) => update("dailySendCap", parseInt(e.target.value) || 50)} /></Field>
            <Field label="Always require approval before sending" full>
              <label className="flex items-center gap-2 text-xs text-gray-700">
                <input type="checkbox" checked={!!form.alwaysPreviewFirst} onChange={(e) => update("alwaysPreviewFirst", e.target.checked)} />
                If on, every campaign requires you to preview Step 1 before launching, regardless of AI heuristic.
              </label>
            </Field>
          </div>
        </Section>

        {/* TEST SEND */}
        <Section title="Test Email Send" icon={<Send className="w-4 h-4" />} description="Send a test email to verify your SendGrid or SMTP credentials are working.">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Field label="Send test to (email address)">
                <input className={inputCls} value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="your-email@example.com" />
              </Field>
            </div>
            <button onClick={handleTestSend} disabled={testing || !testTo} className="flex items-center gap-1 px-3 py-2 text-xs font-bold rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white">
              {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Send test
            </button>
          </div>
          {testResult && (
            <div className={`mt-2 text-xs p-2 rounded ${testResult.ok ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"}`}>
              {testResult.ok ? `✓ Sent successfully via ${testResult.provider || "configured provider"}` : `✗ ${testResult.error || "Test failed"}`}
            </div>
          )}
          <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1"><Info className="w-3 h-3" /> Save settings first, then test. Test send doesn't require recipients to be in your network.</p>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, icon, description, children }: { title: string; icon: React.ReactNode; description: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2 text-sm font-bold text-gray-800">{icon} {title}</div>
        <p className="text-[11px] text-gray-500 mt-0.5">{description}</p>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">{label}</label>
      {children}
    </div>
  );
}
