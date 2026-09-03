import { FormEvent, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BadgeCheck,
  Bell,
  BrainCircuit,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Clock3,
  CreditCard,
  FileText,
  Fingerprint,
  Globe2,
  History,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Mail,
  Menu,
  MessageSquare,
  Network,
  Phone,
  Plus,
  ScanLine,
  Search,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Upload,
  UsersRound,
  X,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type View = "overview" | "scanner" | "history" | "community" | "settings";
type SourceType = "message" | "website" | "email" | "screenshot" | "payment" | "call" | "document";

type ScanResult = {
  riskScore: number;
  riskBand: string;
  scamType: string;
  reasons: string[];
  recommendation: string;
};

const navItems: Array<{ id: View; label: string; icon: typeof LayoutDashboard }> = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "scanner", label: "Scan Content", icon: ScanLine },
  { id: "history", label: "Scan History", icon: History },
  { id: "community", label: "Community Reports", icon: UsersRound },
  { id: "settings", label: "Settings", icon: Settings2 },
];

const sampleMessage = "Your hotel booking is confirmed! Pay ₹4,999 now to secure your room. Limited time offer — send payment to the personal UPI below: https://luxurystay-booking.com/verify";

function formatDate(value: Date | string | number | undefined) {
  if (!value) return "Just now";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Recently" : date.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function riskColor(score: number) {
  if (score >= 81) return "#ef4444";
  if (score >= 61) return "#f97316";
  if (score >= 41) return "#eab308";
  return "#22c55e";
}

function riskCopy(score: number) {
  if (score >= 81) return "Very High Risk";
  if (score >= 61) return "High Risk";
  if (score >= 41) return "Suspicious";
  return "Low Risk";
}

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex h-10 w-10 items-center justify-center bg-gradient-to-br from-violet-600 to-amber-400 text-white shadow-[0_0_24px_rgba(226,154,73,0.2)]">
        <ShieldCheck className="h-6 w-6" strokeWidth={2.2} />
        <span className="absolute -bottom-1 -right-1 h-3 w-3 border-2 border-[#201b1b] bg-amber-300" />
      </div>
      <div>
        <div className="text-[17px] font-extrabold tracking-tight text-white">Scam<span className="text-amber-300">Shield</span></div>
        <div className="text-[9px] font-semibold uppercase tracking-[0.24em] text-slate-400">Detect • Analyze • Protect</div>
      </div>
    </div>
  );
}

function PageHeader({ title, eyebrow, action }: { title: string; eyebrow: string; action?: React.ReactNode }) {
  return (
    <div className="mb-7 flex items-end justify-between gap-4">
      <div>
        <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-amber-400"><span className="h-px w-6 bg-amber-400" /> {eyebrow}</div>
        <h1 className="text-3xl font-extrabold tracking-[-0.04em] text-white md:text-4xl">{title}</h1>
      </div>
      {action}
    </div>
  );
}

function MetricCard({ label, value, detail, icon: Icon, tone }: { label: string; value: string | number; detail: string; icon: typeof Activity; tone: string }) {
  return (
    <div className="group border border-white/10 bg-white/[0.045] p-5 transition duration-200 hover:-translate-y-0.5 hover:border-amber-300/30 hover:bg-white/[0.07]">
      <div className="mb-8 flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center ${tone}`}><Icon className="h-5 w-5" /></div>
        <ArrowUpRight className="h-4 w-4 text-slate-500 transition group-hover:text-amber-300" />
      </div>
      <div className="text-3xl font-extrabold tracking-tight text-white">{value}</div>
      <div className="mt-1 text-sm font-semibold text-slate-300">{label}</div>
      <div className="mt-3 text-xs text-slate-500">{detail}</div>
    </div>
  );
}

function RiskBadge({ score }: { score: number }) {
  return <span className="inline-flex items-center gap-1.5 border px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em]" style={{ color: riskColor(score), borderColor: `${riskColor(score)}55`, backgroundColor: `${riskColor(score)}12` }}><span className="h-1.5 w-1.5" style={{ backgroundColor: riskColor(score) }} /> {riskCopy(score)}</span>;
}

function Overview({ onScan }: { onScan: () => void }) {
  const summary = trpc.dashboard.summary.useQuery();
  const recent = trpc.scans.recent.useQuery();
  const reports = trpc.reports.list.useQuery();
  const stats = summary.data ?? { scansToday: 24, threatsBlocked: 18, communityReports: 2084, averageScore: 68, protectedUsers: "5K+" };
  const scanRows = recent.data ?? [];
  const reportRows = reports.data ?? [];

  return (
    <div>
      <PageHeader eyebrow="Command center" title="Good evening, stay protected." action={<Button onClick={onScan} className="h-11 rounded-none bg-amber-300 px-5 font-bold text-slate-950 hover:bg-amber-200"><ScanLine className="mr-2 h-4 w-4" /> New scan</Button>} />
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Scans today" value={stats.scansToday} detail="Across messages, links & files" icon={ScanLine} tone="bg-amber-300/10 text-amber-300" />
        <MetricCard label="Threats blocked" value={stats.threatsBlocked} detail="High or very high risk" icon={ShieldAlert} tone="bg-rose-400/10 text-rose-300" />
        <MetricCard label="Community reports" value={stats.communityReports} detail="Crowd-sourced intelligence" icon={UsersRound} tone="bg-[#8f4b2e]/10 text-rose-300" />
        <MetricCard label="Average risk score" value={`${stats.averageScore}/100`} detail="Last 30 scans" icon={Activity} tone="bg-amber-300/10 text-amber-300" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        <section className="border border-white/10 bg-white/[0.045] p-6">
          <div className="mb-6 flex items-center justify-between"><div><div className="text-lg font-bold text-white">Risk activity</div><div className="mt-1 text-xs text-slate-500">A quick view of your recent detection posture</div></div><div className="flex items-center gap-2 text-xs font-semibold text-emerald-300"><span className="h-2 w-2 bg-emerald-300" /> Live engine</div></div>
          <div className="mb-7 flex h-44 items-end gap-3 border-b border-l border-white/10 px-4 pb-0 pt-4">
            {[42, 55, 48, 74, 61, 88, 68, 92, 72, 64, 84, 68, 79, 58, 91, 73, 67, 86].map((height, index) => <div key={`${height}-${index}`} className="group flex h-full flex-1 items-end"><div className="w-full bg-gradient-to-t from-violet-600 to-amber-300 opacity-75 transition group-hover:opacity-100" style={{ height: `${height}%` }} /></div>)}
          </div>
          <div className="flex justify-between text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600"><span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>Now</span></div>
        </section>

        <section className="border border-white/10 bg-white/[0.045] p-6">
          <div className="mb-5 flex items-center justify-between"><div><div className="text-lg font-bold text-white">Detection coverage</div><div className="mt-1 text-xs text-slate-500">Inputs processed this week</div></div><Fingerprint className="h-5 w-5 text-amber-300" /></div>
          <div className="space-y-4">
            {[{ label: "Messages", value: 84, icon: MessageSquare, color: "bg-amber-300" }, { label: "Websites", value: 68, icon: Globe2, color: "bg-violet-400" }, { label: "Payments", value: 46, icon: CreditCard, color: "bg-amber-300" }, { label: "Documents", value: 29, icon: FileText, color: "bg-rose-300" }].map(({ label, value, icon: Icon, color }) => <div key={label}><div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-300"><span className="flex items-center gap-2"><Icon className="h-3.5 w-3.5 text-slate-500" /> {label}</span><span>{value}%</span></div><div className="h-1.5 bg-white/10"><div className={`h-1.5 ${color}`} style={{ width: `${value}%` }} /></div></div>)}
          </div>
          <div className="mt-7 flex items-center gap-3 border-t border-white/10 pt-5 text-xs text-slate-400"><LockKeyhole className="h-4 w-4 text-amber-300" /> Your content is analyzed securely.</div>
        </section>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        <section className="border border-white/10 bg-white/[0.045] p-6">
          <div className="mb-5 flex items-center justify-between"><div><div className="text-lg font-bold text-white">Recent scans</div><div className="mt-1 text-xs text-slate-500">Your latest risk assessments</div></div><button onClick={onScan} className="text-xs font-bold text-amber-300 hover:text-amber-200">View scanner <ChevronRight className="ml-1 inline h-3.5 w-3.5" /></button></div>
          {scanRows.length === 0 ? <div className="border border-dashed border-white/10 p-8 text-center text-sm text-slate-500">No saved scans yet. Run your first analysis to build your history.</div> : <div className="space-y-1">{scanRows.slice(0, 4).map((scan) => <div key={scan.id} className="flex items-center gap-4 border-t border-white/5 py-3"><div className="flex h-9 w-9 items-center justify-center bg-white/5 text-amber-300"><ScanLine className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold text-white">{scan.scamType}</div><div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500"><span>{scan.sourceType}</span><span>•</span><span>{formatDate(scan.createdAt)}</span></div></div><RiskBadge score={scan.riskScore} /><div className="text-sm font-extrabold" style={{ color: riskColor(scan.riskScore) }}>{scan.riskScore}</div></div>)}</div>}
        </section>

        <section className="border border-white/10 bg-white/[0.045] p-6">
          <div className="mb-5 flex items-center justify-between"><div><div className="text-lg font-bold text-white">Community pulse</div><div className="mt-1 text-xs text-slate-500">What people are reporting</div></div><Network className="h-5 w-5 text-rose-300" /></div>
          <div className="space-y-4">{reportRows.slice(0, 3).map((report) => <div key={report.id} className="border-l-2 border-rose-300/60 pl-3"><div className="text-xs font-bold uppercase tracking-[0.12em] text-rose-300">{report.category}</div><div className="mt-1 line-clamp-2 text-sm font-semibold text-slate-200">{report.description}</div><div className="mt-2 text-[11px] text-slate-500">{formatDate(report.createdAt)} · {report.status}</div></div>)}</div>
        </section>
      </div>
    </div>
  );
}

function Scanner({ onResult }: { onResult: (result: ScanResult) => void }) {
  const [content, setContent] = useState("");
  const [sourceType, setSourceType] = useState<SourceType>("message");
  const mutation = trpc.scans.analyze.useMutation({ onSuccess: (result) => { onResult(result); toast.success("Analysis complete", { description: `${result.riskBand} · ${result.scamType}` }); }, onError: (error) => toast.error("Unable to analyze content", { description: error.message }) });
  const examples = ["Your bank account will be blocked. Verify KYC with this link and share OTP.", sampleMessage, "Congratulations! You won a ₹50,000 lottery. Pay ₹999 processing fee to claim."];

  const handleSubmit = (event: FormEvent) => { event.preventDefault(); if (content.trim().length < 3) { toast.error("Add more content to analyze"); return; } mutation.mutate({ content, sourceType }); };

  return (
    <div>
      <PageHeader eyebrow="AI analysis workspace" title="Scan suspicious content" action={<div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex"><span className="h-2 w-2 bg-emerald-300" /> Engine ready</div>} />
      <div className="grid gap-5 xl:grid-cols-[1fr_0.42fr]">
        <form onSubmit={handleSubmit} className="border border-white/10 bg-white/[0.045] p-6 md:p-8">
          <div className="mb-6 flex items-start justify-between gap-4"><div><div className="text-xl font-bold text-white">What would you like to verify?</div><div className="mt-2 max-w-xl text-sm leading-6 text-slate-400">Paste a message, website URL, email, payment request, or transcript. ScamShield will identify patterns and explain the risk.</div></div><div className="hidden border border-amber-300/20 bg-amber-300/10 p-3 text-amber-300 sm:block"><BrainCircuit className="h-6 w-6" /></div></div>
          <div className="mb-5 grid gap-3 sm:grid-cols-2"><label className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Input type<select value={sourceType} onChange={(event) => setSourceType(event.target.value as SourceType)} className="mt-2 h-11 w-full border border-white/10 bg-[#2a2321] px-3 text-sm font-semibold normal-case tracking-normal text-white outline-none focus:border-amber-300/60">{[["message", "Message / SMS"], ["website", "Website / URL"], ["email", "Email"], ["screenshot", "Screenshot / OCR"], ["payment", "Payment request"], ["call", "Call transcript"], ["document", "Document"]].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><div className="flex items-end"><button type="button" onClick={() => setContent(sampleMessage)} className="h-11 w-full border border-white/10 bg-white/[0.04] px-4 text-left text-sm font-semibold text-slate-300 transition hover:border-amber-300/40 hover:text-white"><Sparkles className="mr-2 inline h-4 w-4 text-amber-300" /> Load hotel booking example</button></div></div>
          <label className="block text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Suspicious content<textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder="Paste the suspicious message, link, or request here..." className="mt-2 min-h-[250px] w-full resize-y border border-white/10 bg-[#211d1b] p-4 text-sm leading-6 text-white outline-none placeholder:text-slate-600 focus:border-amber-300/60" /></label>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2 text-xs text-slate-500"><LockKeyhole className="h-4 w-4 text-amber-300" /> Secure processing · No credentials required</div><Button type="submit" disabled={mutation.isPending} className="h-11 rounded-none bg-[#8f4b2e] px-6 font-bold text-white hover:bg-violet-400">{mutation.isPending ? <><Activity className="mr-2 h-4 w-4 animate-pulse" /> Analyzing...</> : <><ScanLine className="mr-2 h-4 w-4" /> Analyze risk</>}</Button></div>
        </form>
        <div className="border border-white/10 bg-[#2a2321] p-6"><div className="mb-5 flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center bg-amber-300/10 text-amber-300"><Upload className="h-4 w-4" /></div><div><div className="font-bold text-white">Try a sample</div><div className="text-xs text-slate-500">See the engine in action</div></div></div><div className="space-y-3">{examples.map((example, index) => <button key={example} onClick={() => setContent(example)} className="w-full border border-white/10 p-3 text-left text-xs leading-5 text-slate-400 transition hover:border-violet-400/50 hover:bg-white/[0.04] hover:text-slate-200"><span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-rose-300">Example 0{index + 1}</span>{example}</button>)}</div><div className="mt-6 border-t border-white/10 pt-5 text-xs leading-5 text-slate-500"><ShieldCheck className="mr-2 inline h-4 w-4 text-amber-300" /> ScamShield is an assistive tool. Always verify high-impact decisions through official channels.</div></div>
      </div>
    </div>
  );
}

function ResultPanel({ result, onNewScan }: { result: ScanResult; onNewScan: () => void }) {
  const circumference = 2 * Math.PI * 62;
  const dash = (result.riskScore / 100) * circumference;
  const color = riskColor(result.riskScore);
  return <div className="mt-5 border border-white/10 bg-white/[0.045] p-6 md:p-8"><div className="mb-7 flex flex-wrap items-start justify-between gap-4"><div><div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-amber-300"><BadgeCheck className="h-4 w-4" /> Analysis complete</div><h2 className="text-2xl font-extrabold text-white">{result.scamType}</h2><p className="mt-2 max-w-2xl text-sm text-slate-400">ScamShield connected multiple signals to build an explainable risk fingerprint.</p></div><Button onClick={onNewScan} variant="outline" className="h-10 rounded-none border-white/15 bg-transparent text-slate-200 hover:bg-white/10 hover:text-white"><Plus className="mr-2 h-4 w-4" /> New scan</Button></div><div className="grid items-center gap-8 lg:grid-cols-[220px_1fr]"><div className="flex flex-col items-center"><div className="relative h-44 w-44"><svg className="h-full w-full -rotate-90" viewBox="0 0 160 160"><circle cx="80" cy="80" r="62" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="14" /><circle cx="80" cy="80" r="62" fill="none" stroke={color} strokeWidth="14" strokeLinecap="square" strokeDasharray={`${dash} ${circumference}`} /></svg><div className="absolute inset-0 flex flex-col items-center justify-center"><div className="text-4xl font-extrabold" style={{ color }}>{result.riskScore}</div><div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">out of 100</div></div></div><div className="mt-3"><RiskBadge score={result.riskScore} /></div></div><div><div className="mb-4 flex items-center justify-between"><div className="text-sm font-bold text-white">Why this score?</div><div className="text-xs font-semibold text-slate-500">{result.riskBand}</div></div><div className="grid gap-3 sm:grid-cols-2">{result.reasons.map((reason) => <div key={reason} className="flex items-center gap-3 border border-white/10 bg-white/[0.03] p-3 text-sm font-semibold text-slate-200"><CircleAlert className="h-4 w-4 shrink-0 text-rose-300" /> {reason}</div>)}</div><div className="mt-5 flex items-start gap-3 border-l-2 border-amber-300 bg-amber-300/10 p-4 text-sm leading-6 text-slate-200"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" /><span><strong className="text-amber-200">Recommendation:</strong> {result.recommendation}</span></div></div></div></div>;
}

function HistoryView() {
  const scans = trpc.scans.recent.useQuery();
  return <div><PageHeader eyebrow="Your intelligence trail" title="Scan history" action={<div className="flex items-center gap-2 border border-white/10 px-3 py-2 text-xs text-slate-400"><Search className="h-4 w-4" /> Search ready</div>} /><div className="border border-white/10 bg-white/[0.045] p-5 md:p-6">{(scans.data ?? []).length === 0 ? <div className="py-20 text-center"><History className="mx-auto mb-4 h-9 w-9 text-slate-600" /><div className="font-bold text-white">No scan history yet</div><div className="mt-2 text-sm text-slate-500">Your completed analyses will appear here.</div></div> : <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left"><thead><tr className="border-b border-white/10 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500"><th className="pb-4 pl-2">Scan</th><th className="pb-4">Type</th><th className="pb-4">Risk</th><th className="pb-4">Score</th><th className="pb-4">Analyzed</th></tr></thead><tbody>{(scans.data ?? []).map((scan) => <tr key={scan.id} className="border-b border-white/5 text-sm"><td className="py-4 pl-2 font-semibold text-white">{scan.scamType}</td><td className="py-4 capitalize text-slate-400">{scan.sourceType}</td><td className="py-4"><RiskBadge score={scan.riskScore} /></td><td className="py-4 font-extrabold" style={{ color: riskColor(scan.riskScore) }}>{scan.riskScore}/100</td><td className="py-4 text-slate-500">{formatDate(scan.createdAt)}</td></tr>)}</tbody></table></div>}</div></div>;
}

function CommunityView() {
  const reports = trpc.reports.list.useQuery();
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState("Banking & KYC");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<"low" | "medium" | "high" | "critical">("high");
  const createReport = trpc.reports.create.useMutation({ onSuccess: () => { toast.success("Report submitted to the community queue"); setDescription(""); setShowForm(false); reports.refetch(); }, onError: (error) => toast.error("Unable to submit report", { description: error.message }) });
  const submit = (event: FormEvent) => { event.preventDefault(); if (description.trim().length < 10) return toast.error("Please add more detail"); createReport.mutate({ category, description, severity }); };
  return <div><PageHeader eyebrow="Crowd-sourced intelligence" title="Community reports" action={<Button onClick={() => setShowForm((current) => !current)} className="h-11 rounded-none bg-[#8f4b2e] px-5 font-bold text-white hover:bg-violet-400"><Plus className="mr-2 h-4 w-4" /> Report a scam</Button>} />{showForm && <form onSubmit={submit} className="mb-5 border border-rose-300/30 bg-violet-400/5 p-5 md:p-6"><div className="mb-4 text-lg font-bold text-white">Add a community report</div><div className="grid gap-4 md:grid-cols-3"><select value={category} onChange={(event) => setCategory(event.target.value)} className="h-11 border border-white/10 bg-[#2a2321] px-3 text-sm text-white"><option>Banking & KYC</option><option>Job & Internship</option><option>Travel & Hotel</option><option>Shopping & E-commerce</option><option>Investment</option><option>Government Impersonation</option></select><select value={severity} onChange={(event) => setSeverity(event.target.value as typeof severity)} className="h-11 border border-white/10 bg-[#2a2321] px-3 text-sm text-white"><option value="low">Low severity</option><option value="medium">Medium severity</option><option value="high">High severity</option><option value="critical">Critical</option></select><Button type="submit" disabled={createReport.isPending} className="h-11 rounded-none bg-amber-300 font-bold text-slate-950 hover:bg-amber-200">{createReport.isPending ? "Submitting..." : "Submit report"}</Button></div><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe the suspicious message, sender, link, or payment request..." className="mt-4 min-h-[110px] w-full border border-white/10 bg-[#211d1b] p-3 text-sm leading-6 text-white outline-none placeholder:text-slate-600 focus:border-amber-300/60" /></form>}<div className="grid gap-4 lg:grid-cols-2">{(reports.data ?? []).map((report) => <div key={report.id} className="border border-white/10 bg-white/[0.045] p-5"><div className="mb-4 flex items-start justify-between gap-4"><div><div className="text-xs font-bold uppercase tracking-[0.16em] text-rose-300">{report.category}</div><div className="mt-2 text-base font-bold text-white">{report.description}</div></div><span className="border border-emerald-300/20 bg-emerald-300/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-300">{report.status}</span></div><div className="flex items-center justify-between border-t border-white/10 pt-3 text-xs text-slate-500"><span className="flex items-center gap-2"><Clock3 className="h-3.5 w-3.5" /> {formatDate(report.createdAt)}</span><span className="font-bold uppercase tracking-[0.14em] text-rose-300">{report.severity} severity</span></div></div>)}</div></div>;
}

function SettingsView({ user, onLogout }: { user: { name?: string | null; email?: string | null } | null; onLogout: () => void }) {
  return <div><PageHeader eyebrow="Trust & control" title="Settings" /><div className="grid gap-5 lg:grid-cols-2"><section className="border border-white/10 bg-white/[0.045] p-6"><div className="mb-6 flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center bg-[#8f4b2e]/10 text-rose-300"><LockKeyhole className="h-5 w-5" /></div><div><div className="font-bold text-white">Account & authentication</div><div className="text-xs text-slate-500">Secure access via Manus OAuth and JWT-backed sessions</div></div></div><div className="space-y-4 text-sm"><div className="flex items-center justify-between border-b border-white/10 pb-4"><span className="text-slate-400">Signed-in user</span><span className="font-semibold text-white">{user?.name ?? "Guest mode"}</span></div><div className="flex items-center justify-between border-b border-white/10 pb-4"><span className="text-slate-400">Email</span><span className="font-semibold text-white">{user?.email ?? "Not connected"}</span></div><div className="flex items-center justify-between"><span className="text-slate-400">Session security</span><span className="flex items-center gap-2 font-semibold text-emerald-300"><CircleCheck className="h-4 w-4" /> Protected</span></div></div>{user && <Button onClick={onLogout} variant="outline" className="mt-6 h-10 rounded-none border-rose-300/30 bg-transparent text-rose-200 hover:bg-rose-400/10"><LogOut className="mr-2 h-4 w-4" /> Sign out</Button>}</section><section className="border border-white/10 bg-white/[0.045] p-6"><div className="mb-6 flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center bg-amber-300/10 text-amber-300"><ShieldCheck className="h-5 w-5" /></div><div><div className="font-bold text-white">Protection preferences</div><div className="text-xs text-slate-500">Controls for your ScamShield experience</div></div></div>{["Show explainable risk reasons", "Include community intelligence", "Warn before high-risk actions"].map((item, index) => <label key={item} className="flex items-center justify-between border-b border-white/10 py-4 text-sm text-slate-300"><span>{item}</span><input type="checkbox" defaultChecked={index !== 1} className="h-4 w-4 accent-amber-300" /></label>)}<div className="mt-5 flex items-start gap-3 text-xs leading-5 text-slate-500"><Bell className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" /> Notifications and browser-extension controls are part of the next release.</div></section></div></div>;
}

export default function Home() {
  const auth = useAuth();
  const [activeView, setActiveView] = useState<View>("overview");
  const [mobileNav, setMobileNav] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const displayName = useMemo(() => auth.user?.name?.split(" ")[0] ?? "Guest", [auth.user?.name]);

  const handleLogout = async () => { await auth.logout(); toast.success("Signed out safely"); };
  const goToScanner = () => { setActiveView("scanner"); setScanResult(null); };

  const renderView = () => {
    if (activeView === "overview") return <Overview onScan={goToScanner} />;
    if (activeView === "scanner") return <><Scanner onResult={setScanResult} />{scanResult && <ResultPanel result={scanResult} onNewScan={() => setScanResult(null)} />}</>;
    if (activeView === "history") return <HistoryView />;
    if (activeView === "community") return <CommunityView />;
    return <SettingsView user={auth.user} onLogout={handleLogout} />;
  };

  return <div className="min-h-screen bg-[#171515] text-white"><div className="pointer-events-none fixed inset-0 opacity-30" style={{ backgroundImage: "linear-gradient(rgba(226,154,73,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(226,154,73,0.04) 1px, transparent 1px)", backgroundSize: "48px 48px" }} /><div className="relative flex min-h-screen"><aside className={`fixed inset-y-0 left-0 z-30 flex w-[272px] flex-col border-r border-white/10 bg-[#201b1b] px-5 py-6 transition-transform duration-200 lg:static lg:translate-x-0 ${mobileNav ? "translate-x-0" : "-translate-x-full"}`}><div className="mb-10 flex items-center justify-between"><Logo /><button onClick={() => setMobileNav(false)} className="text-slate-500 lg:hidden"><X className="h-5 w-5" /></button></div><div className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-600">Workspace</div><nav className="space-y-1">{navItems.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => { setActiveView(id); setMobileNav(false); }} className={`group flex w-full items-center gap-3 px-3 py-3 text-left text-sm font-semibold transition ${activeView === id ? "border-l-2 border-amber-300 bg-amber-300/10 text-white" : "border-l-2 border-transparent text-slate-400 hover:bg-white/[0.04] hover:text-white"}`}><Icon className={`h-4 w-4 ${activeView === id ? "text-amber-300" : "text-slate-500 group-hover:text-slate-300"}`} /> {label}{id === "community" && <span className="ml-auto bg-[#8f4b2e]/15 px-1.5 py-0.5 text-[10px] text-rose-300">2K+</span>}</button>)}</nav><div className="mt-auto"><div className="mb-5 border border-white/10 bg-white/[0.04] p-4"><div className="mb-3 flex items-center gap-2 text-xs font-bold text-white"><Sparkles className="h-4 w-4 text-amber-300" /> Protection score</div><div className="mb-2 flex items-end justify-between"><span className="text-2xl font-extrabold text-amber-300">92%</span><span className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Excellent</span></div><div className="h-1.5 bg-white/10"><div className="h-1.5 w-[92%] bg-gradient-to-r from-[#8f4b2e] to-amber-300" /></div></div><div className="flex items-center gap-3 border-t border-white/10 px-2 pt-5"><div className="flex h-9 w-9 items-center justify-center bg-[#8f4b2e]/20 text-sm font-extrabold text-rose-200">{displayName[0]}</div><div className="min-w-0 flex-1"><div className="truncate text-xs font-bold text-white">{displayName}</div><div className="truncate text-[10px] text-slate-500">{auth.user?.email ?? "Demo workspace"}</div></div><button onClick={() => setActiveView("settings")} className="text-slate-500 hover:text-white"><Settings2 className="h-4 w-4" /></button></div></div></aside><main className="min-w-0 flex-1"><header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-white/10 bg-[#171515]/85 px-5 backdrop-blur md:px-10"><div className="flex items-center gap-3"><button onClick={() => setMobileNav(true)} className="text-slate-400 lg:hidden"><Menu className="h-5 w-5" /></button><div className="hidden items-center gap-2 text-xs font-semibold text-slate-500 sm:flex"><span className="text-slate-600">SCAMSHIELD</span><ChevronRight className="h-3.5 w-3.5" /><span className="text-slate-300">{navItems.find((item) => item.id === activeView)?.label}</span></div></div><div className="flex items-center gap-4"><div className="hidden items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-300 sm:flex"><span className="h-2 w-2 bg-emerald-300" /> AI engine online</div><button className="relative text-slate-500 hover:text-white"><Bell className="h-4 w-4" /><span className="absolute -right-1 -top-1 h-1.5 w-1.5 bg-amber-300" /></button><div className="h-5 w-px bg-white/10" /><div className="flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center bg-amber-300/10 text-xs font-bold text-amber-200">{displayName[0]}</div><span className="hidden text-xs font-bold text-slate-300 md:inline">{displayName}</span></div></div></header><div className="mx-auto max-w-[1440px] px-5 py-8 md:px-10 md:py-10">{renderView()}</div></main></div></div>;
}
