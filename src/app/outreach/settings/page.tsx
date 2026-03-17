"use client";

import { useState } from "react";
import {
  Mail,
  PhoneCall,
  Shield,
  Eye,
  EyeOff,
  Save,
  TestTube,
  Wifi,
  WifiOff,
  Bot,
  Clock,
  RotateCcw,
  MessageSquareText,
  Sparkles,
  Info,
} from "lucide-react";

const defaultPrompt = `You are an AI outreach agent for ARBER Gov Bid Automation. You are calling subcontractors on behalf of a prime contractor to discuss a government contract opportunity.

Your goal on this call:
1. Introduce yourself and the company
2. Briefly summarize the contract opportunity (title, agency, scope, timeline)
3. Ask if they have capacity and interest to participate as a subcontractor
4. Let them know a detailed email with the full RFP, scope of work, and attached documents has been sent to their email
5. Request they review the email and submit their pricing quote by the deadline
6. Thank them for their time

Tone: Professional, concise, and respectful of their time. Do not be pushy. If they decline or are unavailable, thank them and note the outcome.

You will receive the following data for each call:
- Contract title, agency, and summary
- Subcontractor name, company, and trade
- Due date for pricing response
- Key requirements relevant to their trade`;

export default function OutreachSettingsPage() {
  const [emailForm, setEmailForm] = useState({
    imapServer: "",
    imapPort: "993",
    smtpServer: "",
    smtpPort: "587",
    email: "",
    password: "",
    senderName: "",
  });

  const [vapiForm, setVapiForm] = useState({
    apiKey: "",
    agentName: "ARBER Contractor Outreach Agent",
    preferredCallTime: "10:00",
    preferredCallEndTime: "17:00",
    maxCallbacks: "2",
    callbackInterval: "24",
  });

  const [agentPrompt, setAgentPrompt] = useState(defaultPrompt);

  const [emailConnected, setEmailConnected] = useState(false);
  const [vapiConnected, setVapiConnected] = useState(false);
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  const [showVapiKey, setShowVapiKey] = useState(false);
  const [emailTesting, setEmailTesting] = useState(false);
  const [vapiTesting, setVapiTesting] = useState(false);

  const handleTestEmail = () => {
    setEmailTesting(true);
    setTimeout(() => {
      setEmailTesting(false);
      setEmailConnected(true);
    }, 2000);
  };

  const handleTestVapi = () => {
    setVapiTesting(true);
    setTimeout(() => {
      setVapiTesting(false);
      setVapiConnected(true);
    }, 2000);
  };

  const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400";
  const labelClass = "block text-[11px] font-semibold text-gray-500 uppercase mb-1";

  return (
    <div className="p-3 sm:p-5 max-w-4xl">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Outreach Settings</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Configure email and VAPI voice AI for automated contractor outreach
        </p>
      </div>

      <div className="space-y-6">
        {/* Email IMAP/SMTP Configuration */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${emailConnected ? "bg-green-50" : "bg-gray-50"}`}>
                <Mail className={`w-5 h-5 ${emailConnected ? "text-green-600" : "text-gray-400"}`} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900">Email Configuration</h2>
                <p className="text-xs text-gray-400">IMAP & SMTP settings for sending outreach emails</p>
              </div>
            </div>
            {emailConnected ? (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-[11px] font-semibold">
                <Wifi className="w-3.5 h-3.5" />
                Connected
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-[11px] font-semibold">
                <WifiOff className="w-3.5 h-3.5" />
                Not Connected
              </span>
            )}
          </div>

          <div className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>IMAP Server *</label>
                <input value={emailForm.imapServer} onChange={(e) => setEmailForm({ ...emailForm, imapServer: e.target.value })} placeholder="imap.gmail.com" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>IMAP Port</label>
                <input value={emailForm.imapPort} onChange={(e) => setEmailForm({ ...emailForm, imapPort: e.target.value })} placeholder="993" className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>SMTP Server *</label>
                <input value={emailForm.smtpServer} onChange={(e) => setEmailForm({ ...emailForm, smtpServer: e.target.value })} placeholder="smtp.gmail.com" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>SMTP Port</label>
                <input value={emailForm.smtpPort} onChange={(e) => setEmailForm({ ...emailForm, smtpPort: e.target.value })} placeholder="587" className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Sender Name</label>
              <input value={emailForm.senderName} onChange={(e) => setEmailForm({ ...emailForm, senderName: e.target.value })} placeholder="ARBER Bid Automation" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Email Address *</label>
              <input type="email" value={emailForm.email} onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })} placeholder="outreach@yourcompany.com" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Password / App Password *</label>
              <div className="relative">
                <input type={showEmailPassword ? "text" : "password"} value={emailForm.password} onChange={(e) => setEmailForm({ ...emailForm, password: e.target.value })} placeholder="Enter app password" className={`${inputClass} pr-10`} />
                <button type="button" onClick={() => setShowEmailPassword(!showEmailPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showEmailPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">For Gmail, use an App Password from your Google Account security settings</p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button onClick={handleTestEmail} disabled={emailTesting} className="flex items-center gap-1.5 px-4 py-2 bg-[#1e2a3a] hover:bg-[#2a3a4e] text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50">
                <TestTube className="w-3.5 h-3.5" />
                {emailTesting ? "Testing Connection..." : "Test Connection"}
              </button>
              <button className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg transition-colors">
                <Save className="w-3.5 h-3.5" />
                Save Email Settings
              </button>
            </div>
          </div>
        </div>

        {/* VAPI Voice Agent Configuration */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${vapiConnected ? "bg-green-50" : "bg-gray-50"}`}>
                <PhoneCall className={`w-5 h-5 ${vapiConnected ? "text-green-600" : "text-gray-400"}`} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900">VAPI Voice Agent</h2>
                <p className="text-xs text-gray-400">Configure the AI calling agent for contractor outreach</p>
              </div>
            </div>
            {vapiConnected ? (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-[11px] font-semibold">
                <Wifi className="w-3.5 h-3.5" />
                Connected
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-[11px] font-semibold">
                <WifiOff className="w-3.5 h-3.5" />
                Not Connected
              </span>
            )}
          </div>

          <div className="p-4 sm:p-6 space-y-5">
            {/* API Key */}
            <div>
              <label className={labelClass}>VAPI API Key *</label>
              <div className="relative">
                <input type={showVapiKey ? "text" : "password"} value={vapiForm.apiKey} onChange={(e) => setVapiForm({ ...vapiForm, apiKey: e.target.value })} placeholder="vapi_xxxxxxxxxxxxxxxxxxxxxxxx" className={`${inputClass} pr-10`} />
                <button type="button" onClick={() => setShowVapiKey(!showVapiKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showVapiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Your VAPI account API key to connect the calling agent</p>
            </div>

            {/* Agent Name */}
            <div>
              <label className={labelClass}>
                <span className="flex items-center gap-1.5">
                  <Bot className="w-3 h-3" />
                  Agent Name *
                </span>
              </label>
              <input value={vapiForm.agentName} onChange={(e) => setVapiForm({ ...vapiForm, agentName: e.target.value })} placeholder="My Outreach Agent" className={inputClass} />
              <p className="text-[10px] text-gray-400 mt-1">This name identifies your agent in VAPI and call logs</p>
            </div>

            {/* Call Scheduling */}
            <div className="bg-slate-50 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-gray-800">Call Scheduling</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Preferred Call Start Time</label>
                  <input type="time" value={vapiForm.preferredCallTime} onChange={(e) => setVapiForm({ ...vapiForm, preferredCallTime: e.target.value })} className={inputClass} />
                  <p className="text-[10px] text-gray-400 mt-1">Earliest time to start calling contractors</p>
                </div>
                <div>
                  <label className={labelClass}>Preferred Call End Time</label>
                  <input type="time" value={vapiForm.preferredCallEndTime} onChange={(e) => setVapiForm({ ...vapiForm, preferredCallEndTime: e.target.value })} className={inputClass} />
                  <p className="text-[10px] text-gray-400 mt-1">Latest time to make calls</p>
                </div>
              </div>
            </div>

            {/* Callback Settings */}
            <div className="bg-slate-50 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <RotateCcw className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-bold text-gray-800">Callback Settings</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Max Callbacks (if no answer / voicemail)</label>
                  <select value={vapiForm.maxCallbacks} onChange={(e) => setVapiForm({ ...vapiForm, maxCallbacks: e.target.value })} className={inputClass}>
                    <option value="0">No callbacks</option>
                    <option value="1">1 callback</option>
                    <option value="2">2 callbacks</option>
                    <option value="3">3 callbacks</option>
                    <option value="5">5 callbacks</option>
                  </select>
                  <p className="text-[10px] text-gray-400 mt-1">How many times to retry if contractor doesn&apos;t answer</p>
                </div>
                <div>
                  <label className={labelClass}>Callback Interval (hours)</label>
                  <select value={vapiForm.callbackInterval} onChange={(e) => setVapiForm({ ...vapiForm, callbackInterval: e.target.value })} className={inputClass}>
                    <option value="4">Every 4 hours</option>
                    <option value="8">Every 8 hours</option>
                    <option value="12">Every 12 hours</option>
                    <option value="24">Every 24 hours</option>
                    <option value="48">Every 48 hours</option>
                  </select>
                  <p className="text-[10px] text-gray-400 mt-1">Wait time between callback attempts</p>
                </div>
              </div>
            </div>

            {/* Agent Prompt */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 uppercase">
                  <MessageSquareText className="w-3 h-3" />
                  Agent Prompt / Instructions
                </label>
                <button
                  onClick={() => setAgentPrompt(defaultPrompt)}
                  className="text-[10px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  Reset to Default
                </button>
              </div>
              <textarea
                rows={14}
                value={agentPrompt}
                onChange={(e) => setAgentPrompt(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-xs leading-relaxed font-mono outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-y"
              />
              <div className="mt-2 bg-blue-50 rounded-lg p-3 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-blue-700 leading-relaxed">
                  This prompt tells the AI agent how to behave on calls. The agent automatically receives contract details (title, agency, scope, deadline) and contractor info (name, company, trade) for each call. Edit the prompt to match your communication style and requirements.
                </p>
              </div>
            </div>

            {/* How it works */}
            <div className="bg-emerald-50 rounded-lg p-3 text-xs text-emerald-700">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-0.5">How it works</p>
                  <p className="text-emerald-600 leading-relaxed">
                    When a pipeline is started, the agent calls each available contractor during your preferred hours,
                    summarizes the opportunity, directs them to check their email for the full RFP and documents,
                    and requests a pricing quote. If no answer, it retries based on your callback settings.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button onClick={handleTestVapi} disabled={vapiTesting} className="flex items-center gap-1.5 px-4 py-2 bg-[#1e2a3a] hover:bg-[#2a3a4e] text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50">
                <TestTube className="w-3.5 h-3.5" />
                {vapiTesting ? "Testing Connection..." : "Test VAPI Connection"}
              </button>
              <button className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg transition-colors">
                <Save className="w-3.5 h-3.5" />
                Save Agent Settings
              </button>
            </div>
          </div>
        </div>

        {/* Outreach Behavior */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900">Outreach Behavior</h2>
            <p className="text-xs text-gray-400">Configure how the AI agent handles contractor outreach</p>
          </div>
          <div className="p-4 sm:p-6 space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500" />
              <div>
                <span className="text-xs font-medium text-gray-800">Auto-call preferred contractors</span>
                <p className="text-[10px] text-gray-400">Automatically call preferred contractors when a pipeline is started</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500" />
              <div>
                <span className="text-xs font-medium text-gray-800">Send follow-up email after call</span>
                <p className="text-[10px] text-gray-400">Automatically send an email with full RFP details after each call</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500" />
              <div>
                <span className="text-xs font-medium text-gray-800">Only contact insurance-verified contractors</span>
                <p className="text-[10px] text-gray-400">Skip contractors with Pending or Expired insurance status</p>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
