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
      <div 
        className="flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 hover:scale-105"
        style={{ 
          background: "linear-gradient(135deg, rgba(47,167,160,0.15) 0%, rgba(47,167,160,0.05) 100%)",
          border: "1.5px solid rgba(47,167,160,0.3)",
          boxShadow: "0 0 20px rgba(47,167,160,0.15)"
        }}
      >
        <div className="relative">
          <ShieldCheck className="h-7 w-7" strokeWidth={1.5} style={{ color: "var(--brand-primary)" }} />
          <div 
            className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: "var(--brand-primary)", boxShadow: "0 0 8px var(--brand-primary)" }}
          />
        </div>
      </div>
      <div className="flex flex-col">
        <div className="flex items-baseline gap-1">
          <span className="text-[19px] font-bold tracking-tight" style={{ color: "var(--foreground)" }}>Scam</span>
          <span 
            className="text-[19px] font-bold tracking-tight"
            style={{ 
              color: "var(--brand-primary)",
              textShadow: "0 0 20px rgba(47,167,160,0.3)"
            }}
          >
            Shield
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <div 
            className="h-px w-8"
            style={{ background: "linear-gradient(90deg, var(--brand-primary) 0%, transparent 100%)" }}
          />
          <div className="text-[9px] font-medium uppercase tracking-[0.18em]" style={{ color: "var(--muted)" }}>
            AI-Powered Protection
          </div>
        </div>
      </div>
    </div>
  );
}

function PageHeader({ title, eyebrow, action }: { title: string; eyebrow: string; action?: React.ReactNode }) {
  return (
    <div className="mb-7 flex items-end justify-between gap-4">
      <div>
        <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em]" style={{ color: "var(--brand-primary)" }}><span className="h-px w-6" style={{ backgroundColor: "var(--brand-primary)" }} /> {eyebrow}</div>
        <h1 className="text-3xl font-bold tracking-[-0.02em] md:text-4xl" style={{ color: "var(--foreground)" }}>{title}</h1>
      </div>
      {action}
    </div>
  );
}

function MetricCard({ label, value, detail, icon: Icon, tone }: { label: string; value: string | number; detail: string; icon: typeof Activity; tone: string }) {
  return (
    <div 
      className="group p-5 transition-all duration-250 hover:-translate-y-0.5"
      style={{
        backgroundColor: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "16px"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--brand-primary)";
        e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div className="mb-8 flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--accent)", border: "1px solid var(--border)" }}>
          <Icon className="h-5 w-5" style={{ color: "var(--brand-primary)" }} />
        </div>
        <ArrowUpRight className="h-4 w-4 transition" style={{ color: "var(--muted)" }} />
      </div>
      <div className="text-3xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>{value}</div>
      <div className="mt-1 text-sm font-semibold" style={{ color: "var(--foreground)" }}>{label}</div>
      <div className="mt-3 text-xs" style={{ color: "var(--muted)" }}>{detail}</div>
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
      <PageHeader eyebrow="Security overview" title="Good evening, stay protected." action={
        <Button 
          onClick={onScan} 
          className="h-11 px-5 font-semibold transition-all duration-250 hover:-translate-y-0.5 active:scale-98"
          style={{ 
            backgroundColor: "var(--brand-primary)", 
            color: "#FFFFFF",
            borderRadius: "12px"
          }}
        >
          <ScanLine className="mr-2 h-4 w-4" /> New scan
        </Button>
      } />
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Scans today" value={stats.scansToday} detail="Across messages, links & files" icon={ScanLine} tone="" />
        <MetricCard label="Threats blocked" value={stats.threatsBlocked} detail="High or very high risk" icon={ShieldAlert} tone="" />
        <MetricCard label="Community reports" value={stats.communityReports} detail="Crowd-sourced intelligence" icon={UsersRound} tone="" />
        <MetricCard label="Average risk score" value={`${stats.averageScore}/100`} detail="Last 30 scans" icon={Activity} tone="" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        <section 
          className="p-6"
          style={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "16px"
          }}
        >
          <div className="mb-6 flex items-center justify-between">
            <div>
              <div className="text-lg font-bold" style={{ color: "var(--foreground)" }}>Risk activity</div>
              <div className="mt-1 text-xs" style={{ color: "var(--muted)" }}>A quick view of your recent detection posture</div>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: "var(--brand-primary)" }}>
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--brand-primary)" }} /> Live engine
            </div>
          </div>
          <div className="mb-7 flex h-44 items-end gap-3 px-4 pb-0 pt-4">
            {[42, 55, 48, 74, 61, 88, 68, 92, 72, 64, 84, 68, 79, 58, 91, 73, 67, 86].map((height, index) => (
              <div key={`${height}-${index}`} className="group flex h-full flex-1 items-end">
                <div 
                  className="w-full transition-all duration-250 group-hover:opacity-100"
                  style={{ 
                    height: `${height}%`,
                    backgroundColor: "var(--brand-primary)",
                    opacity: 0.6,
                    borderRadius: "4px 4px 0 0"
                  }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--muted)" }}>
            <span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>Now</span>
          </div>
        </section>

        <section 
          className="p-6"
          style={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "16px"
          }}
        >
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="text-lg font-bold" style={{ color: "var(--foreground)" }}>Detection coverage</div>
              <div className="mt-1 text-xs" style={{ color: "var(--muted)" }}>Inputs processed this week</div>
            </div>
            <Fingerprint className="h-5 w-5" style={{ color: "var(--brand-primary)" }} />
          </div>
          <div className="space-y-4">
            {[
              { label: "Messages", value: 84, icon: MessageSquare },
              { label: "Websites", value: 68, icon: Globe2 },
              { label: "Payments", value: 46, icon: CreditCard },
              { label: "Documents", value: 29, icon: FileText }
            ].map(({ label, value, icon: Icon }) => (
              <div key={label}>
                <div className="mb-2 flex items-center justify-between text-xs font-semibold" style={{ color: "var(--foreground)" }}>
                  <span className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5" style={{ color: "var(--muted)" }} /> {label}
                  </span>
                  <span>{value}%</span>
                </div>
                <div 
                  className="h-1.5 rounded-full"
                  style={{ backgroundColor: "var(--border)" }}
                >
                  <div 
                    className="h-1.5 rounded-full"
                    style={{ width: `${value}%`, backgroundColor: "var(--brand-primary)" }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-7 flex items-center gap-3 pt-5 text-xs" style={{ borderTop: "1px solid var(--border)", color: "var(--muted)" }}>
            <LockKeyhole className="h-4 w-4" style={{ color: "var(--brand-primary)" }} /> Your content is analyzed securely.
          </div>
        </section>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        <section 
          className="p-6"
          style={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "16px"
          }}
        >
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="text-lg font-bold" style={{ color: "var(--foreground)" }}>Recent scans</div>
              <div className="mt-1 text-xs" style={{ color: "var(--muted)" }}>Your latest risk assessments</div>
            </div>
            <button 
              onClick={onScan} 
              className="text-xs font-semibold transition-all duration-200 hover:translate-x-0.5"
              style={{ color: "var(--brand-primary)" }}
            >
              View scanner <ChevronRight className="ml-1 inline h-3.5 w-3.5" />
            </button>
          </div>
          {scanRows.length === 0 ? (
            <div 
              className="p-8 text-center"
              style={{ border: "1px dashed var(--border)", borderRadius: "12px" }}
            >
              <ScanLine className="mx-auto mb-4 h-8 w-8" style={{ color: "var(--muted)" }} />
              <div className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>No saved scans yet</div>
              <div className="mt-2 text-xs" style={{ color: "var(--muted)" }}>Run your first analysis to build your history.</div>
            </div>
          ) : (
            <div className="space-y-1">
              {scanRows.slice(0, 4).map((scan) => (
                <div 
                  key={scan.id} 
                  className="flex items-center gap-4 py-3 transition-all duration-200"
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  <div 
                    className="flex h-9 w-9 items-center justify-center rounded-lg"
                    style={{ backgroundColor: "var(--accent)", border: "1px solid var(--border)" }}
                  >
                    <ScanLine className="h-4 w-4" style={{ color: "var(--brand-primary)" }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold" style={{ color: "var(--foreground)" }}>{scan.scamType}</div>
                    <div className="mt-1 flex items-center gap-2 text-[11px]" style={{ color: "var(--muted)" }}>
                      <span>{scan.sourceType}</span><span>•</span><span>{formatDate(scan.createdAt)}</span>
                    </div>
                  </div>
                  <RiskBadge score={scan.riskScore} />
                  <div className="text-sm font-bold" style={{ color: riskColor(scan.riskScore) }}>{scan.riskScore}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section 
          className="p-6"
          style={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "16px"
          }}
        >
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="text-lg font-bold" style={{ color: "var(--foreground)" }}>Community pulse</div>
              <div className="mt-1 text-xs" style={{ color: "var(--muted)" }}>What people are reporting</div>
            </div>
            <Network className="h-5 w-5" style={{ color: "var(--brand-primary)" }} />
          </div>
          <div className="space-y-4">
            {reportRows.slice(0, 3).map((report) => (
              <div 
                key={report.id} 
                className="pl-3 transition-all duration-200"
                style={{ borderLeft: "2px solid var(--brand-primary)" }}
              >
                <div className="text-xs font-bold uppercase tracking-[0.12em]" style={{ color: "var(--brand-primary)" }}>
                  {report.category}
                </div>
                <div className="mt-1 line-clamp-2 text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                  {report.description}
                </div>
                <div className="mt-2 text-[11px]" style={{ color: "var(--muted)" }}>
                  {formatDate(report.createdAt)} · {report.status}
                </div>
              </div>
            ))}
          </div>
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
      <PageHeader 
        eyebrow="AI analysis workspace" 
        title="Scan suspicious content" 
        action={
          <div className="hidden items-center gap-2 text-xs sm:flex" style={{ color: "var(--muted)" }}>
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--brand-primary)" }} /> Engine ready
          </div>
        } 
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_0.42fr]">
        <form 
          onSubmit={handleSubmit} 
          className="p-6 md:p-8 transition-all duration-250"
          style={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "16px"
          }}
        >
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <div className="text-xl font-bold" style={{ color: "var(--foreground)" }}>What would you like to verify?</div>
              <div className="mt-2 max-w-xl text-sm leading-6" style={{ color: "var(--muted)" }}>
                Paste a message, website URL, email, payment request, or transcript. ScamShield will identify patterns and explain the risk.
              </div>
            </div>
            <div 
              className="hidden p-3 sm:block"
              style={{ backgroundColor: "var(--accent)", border: "1px solid var(--border)", borderRadius: "12px" }}
            >
              <BrainCircuit className="h-6 w-6" style={{ color: "var(--brand-primary)" }} />
            </div>
          </div>
          <div className="mb-5 grid gap-3 sm:grid-cols-2">
            <label>
              <div className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: "var(--muted)" }}>Input type</div>
              <select 
                value={sourceType} 
                onChange={(event) => setSourceType(event.target.value as SourceType)} 
                className="mt-2 h-11 w-full px-3 text-sm font-semibold normal-case tracking-normal transition-all duration-200 focus:outline-none"
                style={{ 
                  backgroundColor: "var(--accent)", 
                  border: "1px solid var(--border)", 
                  borderRadius: "8px",
                  color: "var(--foreground)"
                }}
              >
                {[
                  ["message", "Message / SMS"], 
                  ["website", "Website / URL"], 
                  ["email", "Email"], 
                  ["screenshot", "Screenshot / OCR"], 
                  ["payment", "Payment request"], 
                  ["call", "Call transcript"], 
                  ["document", "Document"]
                ].map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <div className="flex items-end">
              <button 
                type="button" 
                onClick={() => setContent(sampleMessage)} 
                className="h-11 w-full px-4 text-left text-sm font-semibold transition-all duration-200"
                style={{ 
                  backgroundColor: "var(--accent)", 
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  color: "var(--foreground)"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--brand-primary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                }}
              >
                <Sparkles className="mr-2 inline h-4 w-4" style={{ color: "var(--brand-primary)" }} /> Load hotel booking example
              </button>
            </div>
          </div>
          <label>
            <div className="block text-xs font-bold uppercase tracking-[0.14em]" style={{ color: "var(--muted)" }}>Suspicious content</div>
            <textarea 
              value={content} 
              onChange={(event) => setContent(event.target.value)} 
              placeholder="Paste the suspicious message, link, or request here..." 
              className="mt-2 min-h-[250px] w-full resize-y p-4 text-sm leading-6 transition-all duration-200 focus:outline-none"
              style={{ 
                backgroundColor: "var(--accent)", 
                border: "1px solid var(--border)",
                borderRadius: "12px",
                color: "var(--foreground)"
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--brand-primary)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
              }}
            />
          </label>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs" style={{ color: "var(--muted)" }}>
              <LockKeyhole className="h-4 w-4" style={{ color: "var(--brand-primary)" }} /> Secure processing · No credentials required
            </div>
            <Button 
              type="submit" 
              disabled={mutation.isPending} 
              className="h-11 px-6 font-semibold transition-all duration-250 hover:-translate-y-0.5 active:scale-98"
              style={{ 
                backgroundColor: "var(--brand-primary)", 
                color: "#FFFFFF",
                borderRadius: "12px"
              }}
            >
              {mutation.isPending ? (
                <>
                  <Activity className="mr-2 h-4 w-4 animate-pulse" /> Analyzing...
                </>
              ) : (
                <>
                  <ScanLine className="mr-2 h-4 w-4" /> Analyze risk
                </>
              )}
            </Button>
          </div>
        </form>
        <div 
          className="p-6"
          style={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "16px"
          }}
        >
          <div className="mb-5 flex items-center gap-3">
            <div 
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ backgroundColor: "var(--accent)", border: "1px solid var(--border)" }}
            >
              <Upload className="h-4 w-4" style={{ color: "var(--brand-primary)" }} />
            </div>
            <div>
              <div className="font-bold" style={{ color: "var(--foreground)" }}>Try a sample</div>
              <div className="text-xs" style={{ color: "var(--muted)" }}>See the engine in action</div>
            </div>
          </div>
          <div className="space-y-3">
            {examples.map((example, index) => (
              <button 
                key={example} 
                onClick={() => setContent(example)} 
                className="w-full p-3 text-left text-xs leading-5 transition-all duration-200"
                style={{ 
                  backgroundColor: "var(--accent)", 
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  color: "var(--muted)"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--brand-primary)";
                  e.currentTarget.style.color = "var(--foreground)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.color = "var(--muted)";
                }}
              >
                <span 
                  className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em]"
                  style={{ color: "var(--danger)" }}
                >
                  Example 0{index + 1}
                </span>
                {example}
              </button>
            ))}
          </div>
          <div 
            className="mt-6 pt-5 text-xs leading-5"
            style={{ borderTop: "1px solid var(--border)", color: "var(--muted)" }}
          >
            <ShieldCheck className="mr-2 inline h-4 w-4" style={{ color: "var(--brand-primary)" }} /> ScamShield is an assistive tool. Always verify high-impact decisions through official channels.
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultPanel({ result, onNewScan }: { result: ScanResult; onNewScan: () => void }) {
  const circumference = 2 * Math.PI * 62;
  const dash = (result.riskScore / 100) * circumference;
  const color = riskColor(result.riskScore);
  
  return (
    <div 
      className="mt-5 p-6 md:p-8 transition-all duration-250"
      style={{
        backgroundColor: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "16px"
      }}
    >
      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em]" style={{ color: "var(--brand-primary)" }}>
            <BadgeCheck className="h-4 w-4" /> Analysis complete
          </div>
          <h2 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>{result.scamType}</h2>
          <p className="mt-2 max-w-2xl text-sm" style={{ color: "var(--muted)" }}>
            ScamShield connected multiple signals to build an explainable risk fingerprint.
          </p>
        </div>
        <Button 
          onClick={onNewScan} 
          variant="outline" 
          className="h-10 px-4 font-semibold transition-all duration-250 hover:-translate-y-0.5"
          style={{ 
            backgroundColor: "var(--accent)", 
            border: "1px solid var(--border)",
            borderRadius: "12px",
            color: "var(--foreground)"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--brand-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> New scan
        </Button>
      </div>
      <div className="grid items-center gap-8 lg:grid-cols-[220px_1fr]">
        <div className="flex flex-col items-center">
          <div className="relative h-44 w-44">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="62" fill="none" stroke="rgba(150,170,185,0.12)" strokeWidth="14" />
              <circle 
                cx="80" cy="80" r="62" 
                fill="none" 
                stroke={color} 
                strokeWidth="14" 
                strokeLinecap="round" 
                strokeDasharray={`${dash} ${circumference}`} 
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-4xl font-bold" style={{ color }}>{result.riskScore}</div>
              <div className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--muted)" }}>out of 100</div>
            </div>
          </div>
          <div className="mt-3"><RiskBadge score={result.riskScore} /></div>
        </div>
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Why this score?</div>
            <div className="text-xs font-semibold" style={{ color: "var(--muted)" }}>{result.riskBand}</div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {result.reasons.map((reason) => (
              <div 
                key={reason} 
                className="flex items-center gap-3 p-3 text-sm font-semibold transition-all duration-200"
                style={{
                  backgroundColor: "var(--accent)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  color: "var(--foreground)"
                }}
              >
                <CircleAlert className="h-4 w-4" style={{ color }} />
                {reason}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div 
        className="mt-6 p-4 rounded-lg"
        style={{ backgroundColor: "var(--accent)", border: "1px solid var(--border)" }}
      >
        <div className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Recommendation</div>
        <div className="mt-2 text-sm leading-6" style={{ color: "var(--muted)" }}>{result.recommendation}</div>
      </div>
    </div>
  );
}

function HistoryView() {
  const scans = trpc.scans.recent.useQuery();
  return (
    <div>
      <PageHeader 
        eyebrow="Your intelligence trail" 
        title="Scan history" 
        action={
          <div 
            className="flex items-center gap-2 px-3 py-2 text-xs"
            style={{ backgroundColor: "var(--accent)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--muted)" }}
          >
            <Search className="h-4 w-4" /> Search ready
          </div>
        } 
      />
      <div 
        className="p-5 md:p-6"
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "16px"
        }}
      >
        {(scans.data ?? []).length === 0 ? (
          <div className="py-20 text-center">
            <History className="mx-auto mb-4 h-9 w-9" style={{ color: "var(--muted)" }} />
            <div className="font-bold" style={{ color: "var(--foreground)" }}>No scan history yet</div>
            <div className="mt-2 text-sm" style={{ color: "var(--muted)" }}>Your completed analyses will appear here.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left">
              <thead>
                <tr 
                  className="text-[10px] font-bold uppercase tracking-[0.16em]"
                  style={{ borderBottom: "1px solid var(--border)", color: "var(--muted)" }}
                >
                  <th className="pb-4 pl-2">Scan</th>
                  <th className="pb-4">Type</th>
                  <th className="pb-4">Risk</th>
                  <th className="pb-4">Score</th>
                  <th className="pb-4">Analyzed</th>
                </tr>
              </thead>
              <tbody>
                {(scans.data ?? []).map((scan) => (
                  <tr 
                    key={scan.id} 
                    className="text-sm"
                    style={{ borderBottom: "1px solid var(--border)" }}
                  >
                    <td className="py-4 pl-2 font-semibold" style={{ color: "var(--foreground)" }}>{scan.scamType}</td>
                    <td className="py-4 capitalize" style={{ color: "var(--muted)" }}>{scan.sourceType}</td>
                    <td className="py-4"><RiskBadge score={scan.riskScore} /></td>
                    <td className="py-4 font-bold" style={{ color: riskColor(scan.riskScore) }}>{scan.riskScore}/100</td>
                    <td className="py-4" style={{ color: "var(--muted)" }}>{formatDate(scan.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function CommunityView() {
  const reports = trpc.reports.list.useQuery();
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState("Banking & KYC");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<"low" | "medium" | "high" | "critical">("high");
  const createReport = trpc.reports.create.useMutation({ onSuccess: () => { toast.success("Report submitted to the community queue"); setDescription(""); setShowForm(false); reports.refetch(); }, onError: (error) => toast.error("Unable to submit report", { description: error.message }) });
  const submit = (event: FormEvent) => { event.preventDefault(); if (description.trim().length < 10) return toast.error("Please add more detail"); createReport.mutate({ category, description, severity }); };
  
  return (
    <div>
      <PageHeader 
        eyebrow="Crowd-sourced intelligence" 
        title="Community reports" 
        action={
          <Button 
            onClick={() => setShowForm((current) => !current)} 
            className="h-11 px-5 font-semibold transition-all duration-250 hover:-translate-y-0.5"
            style={{ 
              backgroundColor: "var(--brand-primary)", 
              color: "#FFFFFF",
              borderRadius: "12px"
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Report a scam
          </Button>
        } 
      />
      {showForm && (
        <form 
          onSubmit={submit} 
          className="mb-5 p-5 md:p-6"
          style={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "16px"
          }}
        >
          <div className="mb-4 text-lg font-bold" style={{ color: "var(--foreground)" }}>Add a community report</div>
          <div className="grid gap-4 md:grid-cols-3">
            <select 
              value={category} 
              onChange={(event) => setCategory(event.target.value)} 
              className="h-11 px-3 text-sm transition-all duration-200 focus:outline-none"
              style={{ 
                backgroundColor: "var(--accent)", 
                border: "1px solid var(--border)",
                borderRadius: "8px",
                color: "var(--foreground)"
              }}
            >
              <option>Banking & KYC</option>
              <option>Job & Internship</option>
              <option>Travel & Hotel</option>
              <option>Shopping & E-commerce</option>
              <option>Investment</option>
              <option>Government Impersonation</option>
            </select>
            <select 
              value={severity} 
              onChange={(event) => setSeverity(event.target.value as typeof severity)} 
              className="h-11 px-3 text-sm transition-all duration-200 focus:outline-none"
              style={{ 
                backgroundColor: "var(--accent)", 
                border: "1px solid var(--border)",
                borderRadius: "8px",
                color: "var(--foreground)"
              }}
            >
              <option value="low">Low severity</option>
              <option value="medium">Medium severity</option>
              <option value="high">High severity</option>
              <option value="critical">Critical severity</option>
            </select>
            <Button 
              type="submit" 
              disabled={createReport.isPending} 
              className="h-11 font-semibold transition-all duration-250 hover:-translate-y-0.5"
              style={{ 
                backgroundColor: "var(--brand-primary)", 
                color: "#FFFFFF",
                borderRadius: "12px"
              }}
            >
              {createReport.isPending ? "Submitting..." : "Submit report"}
            </Button>
          </div>
          <textarea 
            value={description} 
            onChange={(event) => setDescription(event.target.value)} 
            placeholder="Describe the suspicious message, sender, link, or payment request..." 
            className="mt-4 min-h-[110px] w-full p-3 text-sm leading-6 transition-all duration-200 focus:outline-none"
            style={{ 
              backgroundColor: "var(--accent)", 
              border: "1px solid var(--border)",
              borderRadius: "12px",
              color: "var(--foreground)"
            }}
          />
        </form>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        {(reports.data ?? []).map((report) => (
          <div 
            key={report.id} 
            className="p-5 transition-all duration-250"
            style={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "16px"
            }}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: "var(--brand-primary)" }}>{report.category}</div>
                <div className="mt-2 text-base font-bold" style={{ color: "var(--foreground)" }}>{report.description}</div>
              </div>
              <span 
                className="px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] rounded"
                style={{ backgroundColor: "rgba(78,159,114,0.15)", color: "var(--success)" }}
              >
                {report.status}
              </span>
            </div>
            <div 
              className="flex items-center justify-between pt-3 text-xs"
              style={{ borderTop: "1px solid var(--border)", color: "var(--muted)" }}
            >
              <span className="flex items-center gap-2"><Clock3 className="h-3.5 w-3.5" /> {formatDate(report.createdAt)}</span>
              <span className="font-bold uppercase tracking-[0.14em]" style={{ color: "var(--danger)" }}>{report.severity} severity</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsView({ user, onLogout }: { user: { name?: string | null; email?: string | null } | null; onLogout: () => void }) {
  return (
    <div>
      <PageHeader eyebrow="Trust & control" title="Settings" />
      <div className="grid gap-5 lg:grid-cols-2">
        <section 
          className="p-6"
          style={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "16px"
          }}
        >
          <div className="mb-6 flex items-center gap-3">
            <div 
              className="flex h-11 w-11 items-center justify-center rounded-lg"
              style={{ backgroundColor: "rgba(201,92,92,0.15)", border: "1px solid var(--border)" }}
            >
              <LockKeyhole className="h-5 w-5" style={{ color: "var(--danger)" }} />
            </div>
            <div>
              <div className="font-bold" style={{ color: "var(--foreground)" }}>Account & authentication</div>
              <div className="text-xs" style={{ color: "var(--muted)" }}>Secure access via Manus OAuth and JWT-backed sessions</div>
            </div>
          </div>
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <span style={{ color: "var(--muted)" }}>Signed-in user</span>
              <span className="font-semibold" style={{ color: "var(--foreground)" }}>{user?.name ?? "Guest mode"}</span>
            </div>
            <div className="flex items-center justify-between pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <span style={{ color: "var(--muted)" }}>Email</span>
              <span className="font-semibold" style={{ color: "var(--foreground)" }}>{user?.email ?? "Not connected"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ color: "var(--muted)" }}>Session security</span>
              <span className="flex items-center gap-2 font-semibold" style={{ color: "var(--success)" }}>
                <CircleCheck className="h-4 w-4" /> Protected
              </span>
            </div>
          </div>
          {user && (
            <Button 
              onClick={onLogout} 
              variant="outline" 
              className="mt-6 h-10 px-4 font-semibold transition-all duration-250 hover:-translate-y-0.5"
              style={{ 
                backgroundColor: "var(--accent)", 
                border: "1px solid var(--border)",
                borderRadius: "12px",
                color: "var(--danger)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--danger)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
              }}
            >
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </Button>
          )}
        </section>
        <section 
          className="p-6"
          style={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "16px"
          }}
        >
          <div className="mb-6 flex items-center gap-3">
            <div 
              className="flex h-11 w-11 items-center justify-center rounded-lg"
              style={{ backgroundColor: "var(--accent)", border: "1px solid var(--border)" }}
            >
              <ShieldCheck className="h-5 w-5" style={{ color: "var(--brand-primary)" }} />
            </div>
            <div>
              <div className="font-bold" style={{ color: "var(--foreground)" }}>Protection preferences</div>
              <div className="text-xs" style={{ color: "var(--muted)" }}>Controls for your ScamShield experience</div>
            </div>
          </div>
          {["Show explainable risk reasons", "Include community intelligence", "Warn before high-risk actions"].map((item, index) => (
            <label 
              key={item} 
              className="flex items-center justify-between py-4 text-sm"
              style={{ borderBottom: "1px solid var(--border)", color: "var(--foreground)" }}
            >
              <span>{item}</span>
              <input 
                type="checkbox" 
                defaultChecked={index !== 1} 
                className="h-4 w-4"
                style={{ accentColor: "var(--brand-primary)" }}
              />
            </label>
          ))}
          <div 
            className="mt-5 flex items-start gap-3 text-xs leading-5"
            style={{ color: "var(--muted)" }}
          >
            <Bell className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--brand-primary)" }} /> Notifications and browser-extension controls are part of the next release.
          </div>
        </section>
      </div>
    </div>
  );
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

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}
    >
      <div className="relative flex min-h-screen">
        <aside 
          className={`fixed inset-y-0 left-0 z-30 flex w-[272px] flex-col px-5 py-6 transition-transform duration-200 lg:static lg:translate-x-0 ${mobileNav ? "translate-x-0" : "-translate-x-full"}`}
          style={{
            backgroundColor: "var(--surface)",
            borderRight: "1px solid var(--border)"
          }}
        >
          <div className="mb-10 flex items-center justify-between">
            <Logo />
            <button onClick={() => setMobileNav(false)} className="lg:hidden" style={{ color: "var(--muted)" }}>
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: "var(--muted)" }}>
            Workspace
          </div>
          <nav className="space-y-1">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => { setActiveView(id); setMobileNav(false); }}
                className={`group flex w-full items-center gap-3 px-3 py-3 text-left text-sm font-semibold transition-all duration-200 rounded-lg ${activeView === id ? "" : "hover:bg-[var(--accent)]"}`}
                style={{
                  backgroundColor: activeView === id ? "rgba(47,167,160,0.08)" : "transparent",
                  color: activeView === id ? "var(--foreground)" : "var(--muted)"
                }}
              >
                <Icon 
                  className="h-4 w-4" 
                  style={{ color: activeView === id ? "var(--brand-primary)" : "var(--muted)" }} 
                />
                <span>{label}</span>
                {id === "community" && (
                  <span 
                    className="ml-auto px-1.5 py-0.5 text-[10px] font-semibold rounded"
                    style={{ backgroundColor: "rgba(201,92,92,0.15)", color: "var(--danger)" }}
                  >
                    2K+
                  </span>
                )}
              </button>
            ))}
          </nav>
          <div className="mt-auto">
            <div 
              className="mb-5 p-4 rounded-lg"
              style={{ backgroundColor: "var(--accent)", border: "1px solid var(--border)" }}
            >
              <div className="mb-3 flex items-center gap-2 text-xs font-bold" style={{ color: "var(--foreground)" }}>
                <Sparkles className="h-4 w-4" style={{ color: "var(--brand-primary)" }} /> Protection score
              </div>
              <div className="mb-2 flex items-end justify-between">
                <span className="text-2xl font-bold" style={{ color: "var(--brand-primary)" }}>92%</span>
                <span className="text-[10px] uppercase tracking-[0.14em]" style={{ color: "var(--muted)" }}>Excellent</span>
              </div>
              <div 
                className="h-1.5 rounded-full"
                style={{ backgroundColor: "var(--border)" }}
              >
                <div 
                  className="h-1.5 rounded-full"
                  style={{ width: "92%", backgroundColor: "var(--brand-primary)" }}
                />
              </div>
            </div>
            <div 
              className="p-4 rounded-lg"
              style={{ backgroundColor: "var(--accent)", border: "1px solid var(--border)" }}
            >
              <div className="mb-3 flex items-center gap-3">
                <div 
                  className="flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
                >
                  <UsersRound className="h-4 w-4" style={{ color: "var(--muted)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold truncate" style={{ color: "var(--foreground)" }}>{displayName}</div>
                  <div className="text-[10px] truncate" style={{ color: "var(--muted)" }}>Protected</div>
                </div>
              </div>
            </div>
          </div>
        </aside>
        <main className="flex-1 p-5 md:p-8" style={{ backgroundColor: "var(--background)" }}>
          {renderView()}
        </main>
      </div>
    </div>
  );
}
