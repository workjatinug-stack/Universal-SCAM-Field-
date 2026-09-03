import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
import { Shield, Play, ShieldCheck, Lock, Globe, AlertTriangle, ScanLine, BrainCircuit, Sparkles, ShieldAlert, Fingerprint, CreditCard, Globe2, MessageSquare, Upload, Activity, X, Menu, Phone, Briefcase, ShoppingBag, Building2, TrendingUp, Users, Building, Mail, Zap, FileText, Image as ImageIcon } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type SourceType = "message" | "website" | "email" | "screenshot" | "payment" | "call" | "document";

type ScanResult = {
  riskScore: number;
  riskBand: string;
  scamType: string;
  reasons: string[];
  recommendation: string;
};

const hotelScamExample = "Your hotel booking is confirmed! Pay ₹4,999 now to secure your room. Limited time offer — send payment to the personal UPI below: https://luxurystay-booking.com/verify";

function riskColor(score: number) {
  if (score >= 81) return "#C95C5C";
  if (score >= 61) return "#D99A3D";
  if (score >= 41) return "#D99A3D";
  return "#4E9F72";
}

function riskCopy(score: number) {
  if (score >= 81) return "Critical Risk";
  if (score >= 61) return "High Risk";
  if (score >= 41) return "Medium Risk";
  return "Low Risk";
}

export default function Landing() {
  const [activeTab, setActiveTab] = useState<SourceType>("message");
  const [content, setContent] = useState("");
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const mutation = trpc.scans.analyze.useMutation({
    onSuccess: (result) => {
      setScanResult(result);
      setIsAnalyzing(false);
      toast.success("Analysis complete", { description: `${result.riskBand} · ${result.scamType}` });
    },
    onError: (error) => {
      setIsAnalyzing(false);
      toast.error("Unable to analyze content", { description: error.message });
    },
  });

  const handleAnalyze = (event: FormEvent) => {
    event.preventDefault();
    
    if (activeTab === "screenshot") {
      if (!uploadedFile) {
        toast.error("Please upload a screenshot first");
        return;
      }
      // For now, we'll send the filename as content
      // In production, you'd convert the image to base64 or upload it
      setContent(uploadedFile.name);
    }
    
    if (content.trim().length < 3 && activeTab !== "screenshot") {
      toast.error("Add more content to analyze");
      return;
    }
    setIsAnalyzing(true);
    mutation.mutate({ content, sourceType: activeTab });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setUploadedFile(null);
    setImagePreview(null);
    setContent("");
  };

  const handleTabChange = (tab: SourceType) => {
    setActiveTab(tab);
    // Clear file when switching away from screenshot tab
    if (tab !== "screenshot") {
      setUploadedFile(null);
      setImagePreview(null);
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener("scroll", () => {
      setScrolled(window.scrollY > 50);
    });
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0B1117", color: "#F1F3F5" }}>
      {/* Subtle Technical Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0" style={{ backgroundColor: "#0B1117" }} />
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute inset-0" style={{
            backgroundImage: "linear-gradient(rgba(150,170,185,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(150,170,185,0.3) 1px, transparent 1px)",
            backgroundSize: "40px 40px"
          }} />
        </div>
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E')"
        }} />
        <svg className="absolute inset-0 h-full w-full opacity-[0.02]" style={{ pointerEvents: "none" }}>
          {[...Array(5)].map((_, i) => (
            <line
              key={i}
              x1={`${20 + i * 20}%`}
              y1="0"
              x2={`${20 + i * 20}%`}
              y2="100%"
              stroke="#9AA6B2"
              strokeWidth="1"
            />
          ))}
          {[...Array(8)].map((_, i) => (
            <line
              key={i}
              x1="0"
              y1={`${10 + i * 12}%`}
              x2="100%"
              y2={`${10 + i * 12}%`}
              stroke="#9AA6B2"
              strokeWidth="1"
            />
          ))}
        </svg>
      </div>

      {/* Header */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-[#0B1117]/95 backdrop-blur-sm border-b" : "bg-transparent"
        }`}
        style={{ borderColor: "rgba(150,170,185,0.15)" }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center transition-all duration-200" style={{ backgroundColor: "#111A22", border: "1px solid rgba(150,170,185,0.15)", borderRadius: "10px" }}>
                <Shield className="h-5 w-5" style={{ color: "#2FA7A0" }} strokeWidth={1.5} />
              </div>
              <div>
                <div className="text-base font-semibold tracking-tight" style={{ color: "#F1F3F5" }}>Scam<span style={{ color: "#2FA7A0" }}>Shield</span></div>
                <div className="text-[9px] font-medium uppercase tracking-[0.15em]" style={{ color: "#9AA6B2" }}>Detect. Verify. Stay Safe.</div>
              </div>
            </div>

            <div className="hidden items-center gap-8 md:flex">
              <a href="#hero" className="text-sm font-medium transition-all duration-200" style={{ color: "#9AA6B2" }} onMouseEnter={(e) => e.currentTarget.style.color = "#F1F3F5"} onMouseLeave={(e) => e.currentTarget.style.color = "#9AA6B2"}>Home</a>
              <a href="#analyze" className="text-sm font-medium transition-all duration-200" style={{ color: "#9AA6B2" }} onMouseEnter={(e) => e.currentTarget.style.color = "#F1F3F5"} onMouseLeave={(e) => e.currentTarget.style.color = "#9AA6B2"}>Analyze</a>
              <a href="#how-it-works" className="text-sm font-medium transition-all duration-200" style={{ color: "#9AA6B2" }} onMouseEnter={(e) => e.currentTarget.style.color = "#F1F3F5"} onMouseLeave={(e) => e.currentTarget.style.color = "#9AA6B2"}>How It Works</a>
              <a href="#categories" className="text-sm font-medium transition-all duration-200" style={{ color: "#9AA6B2" }} onMouseEnter={(e) => e.currentTarget.style.color = "#F1F3F5"} onMouseLeave={(e) => e.currentTarget.style.color = "#9AA6B2"}>Threats</a>
              <a href="#security" className="text-sm font-medium transition-all duration-200" style={{ color: "#9AA6B2" }} onMouseEnter={(e) => e.currentTarget.style.color = "#F1F3F5"} onMouseLeave={(e) => e.currentTarget.style.color = "#9AA6B2"}>Security</a>
              <a href="/app" className="text-sm font-medium transition-all duration-200" style={{ color: "#9AA6B2" }} onMouseEnter={(e) => e.currentTarget.style.color = "#F1F3F5"} onMouseLeave={(e) => e.currentTarget.style.color = "#9AA6B2"}>Dashboard</a>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <a
                href="/app"
                className="text-sm font-medium transition-all duration-200"
                style={{ color: "#9AA6B2" }}
                onMouseEnter={(e) => e.currentTarget.style.color = "#F1F3F5"}
                onMouseLeave={(e) => e.currentTarget.style.color = "#9AA6B2"}
              >
                Dashboard
              </a>
              <a
                href="#analyze"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold transition-all duration-200 hover:bg-[#38B8AF] hover:shadow-lg hover:-translate-y-0.5 active:scale-98"
                style={{ backgroundColor: "#2FA7A0", color: "#0B1117", borderRadius: "12px" }}
              >
                <ScanLine className="h-4 w-4" />
                Analyze Now
              </a>
            </div>

            <button
              onClick={() => setMobileMenu(!mobileMenu)}
              className="transition md:hidden"
              style={{ color: "#9AA6B2" }}
            >
              {mobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {mobileMenu && (
          <div className="border-t md:hidden" style={{ backgroundColor: "#0B1117", borderColor: "rgba(150,170,185,0.15)" }}>
            <div className="px-4 py-4 space-y-3">
              <a href="#hero" className="block text-sm font-medium transition" style={{ color: "#9AA6B2" }}>Home</a>
              <a href="#analyze" className="block text-sm font-medium transition" style={{ color: "#9AA6B2" }}>Analyze</a>
              <a href="#how-it-works" className="block text-sm font-medium transition" style={{ color: "#9AA6B2" }}>How It Works</a>
              <a href="#categories" className="block text-sm font-medium transition" style={{ color: "#9AA6B2" }}>Threats</a>
              <a href="#security" className="block text-sm font-medium transition" style={{ color: "#9AA6B2" }}>Security</a>
              <a href="/app" className="block text-sm font-medium transition" style={{ color: "#9AA6B2" }}>Dashboard</a>
              <a
                href="#analyze"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold"
                style={{ backgroundColor: "#2FA7A0", color: "#0B1117", borderRadius: "12px" }}
              >
                <ScanLine className="h-4 w-4" />
                Analyze Now
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="hero" className="relative pt-32 pb-20 sm:pt-40 sm:pb-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium mb-6" style={{ backgroundColor: "#111A22", border: "1px solid rgba(150,170,185,0.15)", color: "#2FA7A0", borderRadius: "9999px" }}>
                <ShieldCheck className="h-4 w-4" />
                AI-Powered Security
              </div>
              
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl" style={{ color: "#F1F3F5", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
                Detect Scams<br />
                Before They<br />
                <span style={{ color: "#2FA7A0" }}>Cost You.</span>
              </h1>
              
              <p className="mt-6 text-lg leading-relaxed" style={{ color: "#9AA6B2", lineHeight: 1.7 }}>
                ScamShield uses AI-powered analysis and cross-verification to identify suspicious messages, websites, payment requests, screenshots and digital fraud signals.
              </p>
              
              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href="#analyze"
                  className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold transition-all duration-200 hover:bg-[#38B8AF] hover:shadow-lg hover:-translate-y-0.5 active:scale-98"
                  style={{ backgroundColor: "#2FA7A0", color: "#0B1117", borderRadius: "12px" }}
                >
                  <ScanLine className="h-5 w-5" />
                  Analyze a Scam
                </a>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold transition-all duration-200 hover:bg-[#16212B] hover:-translate-y-0.5 active:scale-98"
                  style={{ backgroundColor: "transparent", border: "1px solid rgba(150,170,185,0.15)", color: "#F1F3F5", borderRadius: "12px" }}
                >
                  <Play className="h-5 w-5" />
                  How It Works
                </a>
              </div>

              <div className="mt-12 grid grid-cols-3 gap-8">
                <div>
                  <div className="text-2xl font-bold" style={{ color: "#F1F3F5" }}>10+</div>
                  <div className="text-sm" style={{ color: "#9AA6B2" }}>Scam Categories</div>
                </div>
                <div>
                  <div className="text-2xl font-bold" style={{ color: "#F1F3F5" }}>5+</div>
                  <div className="text-sm" style={{ color: "#9AA6B2" }}>Input Types</div>
                </div>
                <div>
                  <div className="text-2xl font-bold" style={{ color: "#F1F3F5" }}>AI</div>
                  <div className="text-sm" style={{ color: "#9AA6B2" }}>Powered Analysis</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <div className="relative h-[500px] w-full" style={{ backgroundColor: "#111A22", border: "1px solid rgba(150,170,185,0.15)", borderRadius: "16px" }}>
                <div className="absolute top-0 left-0 right-0 px-6 py-4 border-b" style={{ borderColor: "rgba(150,170,185,0.15)" }}>
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5" style={{ color: "#2FA7A0" }} />
                    <span className="text-sm font-semibold" style={{ color: "#F1F3F5" }}>Security Verification</span>
                  </div>
                </div>

                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    <div className="h-28 w-28 rounded-full" style={{ backgroundColor: "rgba(47,167,160,0.1)" }} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Shield className="h-20 w-20" style={{ color: "#2FA7A0", strokeWidth: 1.5 }} />
                    </div>
                  </div>
                </div>

                {[
                  { icon: Globe2, label: "Website", status: "verified", angle: 0 },
                  { icon: Phone, label: "Phone", status: "warning", angle: 72 },
                  { icon: Mail, label: "Email", status: "verified", angle: 144 },
                  { icon: CreditCard, label: "Payment", status: "danger", angle: 216 },
                  { icon: MessageSquare, label: "Pattern", status: "warning", angle: 288 },
                ].map((item, i) => {
                  const angleRad = (item.angle * Math.PI) / 180;
                  const radius = 130;
                  const x = Math.cos(angleRad) * radius;
                  const y = Math.sin(angleRad) * radius;
                  
                  const statusColor = item.status === "verified" ? "#4E9F72" : item.status === "warning" ? "#D99A3D" : "#C95C5C";

                  return (
                    <motion.div
                      key={item.label}
                      className="absolute"
                      style={{
                        left: `calc(50% + ${x}px)`,
                        top: `calc(50% + ${y}px)`,
                      }}
                      animate={{
                        scale: [1, 1.05, 1],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        delay: i * 0.3,
                        ease: "easeInOut",
                      }}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded" style={{ backgroundColor: "#111A22", border: `1px solid ${statusColor}40` }}>
                          <item.icon className="h-5 w-5" style={{ color: statusColor }} />
                        </div>
                        <span className="text-xs font-medium" style={{ color: "#9AA6B2" }}>{item.label}</span>
                      </div>
                    </motion.div>
                  );
                })}

                <svg className="absolute inset-0 h-full w-full" style={{ pointerEvents: "none" }}>
                  {[0, 72, 144, 216, 288].map((angle, i) => {
                    const angleRad = (angle * Math.PI) / 180;
                    const radius = 130;
                    const x2 = 250 + Math.cos(angleRad) * radius;
                    const y2 = 250 + Math.sin(angleRad) * radius;

                    return (
                      <line
                        key={i}
                        x1="250"
                        y1="250"
                        x2={x2}
                        y2={y2}
                        stroke="rgba(150,170,185,0.2)"
                        strokeWidth="1"
                      />
                    );
                  })}
                </svg>

                <motion.div
                  className="absolute inset-0"
                  style={{
                    background: "linear-gradient(to bottom, transparent, rgba(47,167,160,0.05), transparent)",
                  }}
                  animate={{
                    y: ["-100%", "100%"],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Scam Analyzer Section */}
      <section id="analyze" className="relative py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold sm:text-4xl" style={{ color: "#F1F3F5", letterSpacing: "-0.02em" }}>Is This a Scam?</h2>
            <p className="mt-4 text-lg" style={{ color: "#9AA6B2", lineHeight: 1.7 }}>
              Paste a suspicious message, URL, payment request or upload a screenshot
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-4xl mx-auto"
          >
            <div style={{ backgroundColor: "#111A22", border: "1px solid rgba(150,170,185,0.15)", borderRadius: "16px", padding: "32px" }}>
              <div className="mb-6 flex flex-wrap gap-2">
                {[
                  { id: "message" as SourceType, label: "Message", icon: MessageSquare },
                  { id: "website" as SourceType, label: "URL", icon: Globe2 },
                  { id: "screenshot" as SourceType, label: "Screenshot", icon: Upload },
                  { id: "email" as SourceType, label: "Email", icon: Mail },
                  { id: "payment" as SourceType, label: "Payment", icon: CreditCard },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-200"
                    style={{
                      backgroundColor: activeTab === tab.id ? "#2FA7A0" : "#16212B",
                      color: activeTab === tab.id ? "#0B1117" : "#9AA6B2",
                      borderRadius: "10px",
                    }}
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleAnalyze}>
                {activeTab === "screenshot" ? (
                  <div
                    className="w-full min-h-[200px] p-8 flex flex-col items-center justify-center transition-all duration-200"
                    style={{
                      backgroundColor: "#0B1117",
                      border: isDragging ? "2px dashed #2FA7A0" : "1px solid rgba(150,170,185,0.15)",
                      color: "#F1F3F5",
                      borderRadius: "12px",
                      lineHeight: 1.6,
                    }}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    {imagePreview ? (
                      <div className="w-full">
                        <div className="relative mb-4">
                          <img
                            src={imagePreview}
                            alt="Screenshot preview"
                            className="w-full h-auto max-h-[300px] object-contain rounded-lg"
                            style={{ border: "1px solid rgba(150,170,185,0.15)" }}
                          />
                          <button
                            type="button"
                            onClick={clearImage}
                            className="absolute top-2 right-2 p-2 rounded-full transition-all duration-200 hover:bg-red-500/20"
                            style={{ backgroundColor: "rgba(0,0,0,0.5)", color: "#F1F3F5" }}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-sm text-center" style={{ color: "#9AA6B2" }}>
                          {uploadedFile?.name}
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="flex h-16 w-16 items-center justify-center rounded-full mb-4" style={{ backgroundColor: "#2FA7A020" }}>
                          <ImageIcon className="h-8 w-8" style={{ color: "#2FA7A0" }} />
                        </div>
                        <p className="text-base font-semibold mb-2" style={{ color: "#F1F3F5" }}>
                          Upload a screenshot
                        </p>
                        <p className="text-sm mb-4 text-center" style={{ color: "#9AA6B2" }}>
                          Drag and drop an image here, or click to select
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                          id="screenshot-upload"
                        />
                        <label
                          htmlFor="screenshot-upload"
                          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-all duration-200 hover:bg-[#38B8AF] hover:shadow-lg hover:-translate-y-0.5 active:scale-98 cursor-pointer"
                          style={{ backgroundColor: "#2FA7A0", color: "#0B1117", borderRadius: "12px" }}
                        >
                          <Upload className="h-5 w-5" />
                          Choose File
                        </label>
                      </>
                    )}
                  </div>
                ) : (
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={
                      activeTab === "message"
                        ? "Paste the suspicious message here..."
                        : activeTab === "website"
                        ? "Paste the URL here..."
                        : activeTab === "email"
                        ? "Paste the email content here..."
                        : activeTab === "payment"
                        ? "Paste the payment request details here..."
                        : "Describe the suspicious content..."
                    }
                    className="w-full min-h-[200px] p-4 text-sm leading-6 transition-all duration-200 resize-y"
                    style={{
                      backgroundColor: "#0B1117",
                      border: "1px solid rgba(150,170,185,0.15)",
                      color: "#F1F3F5",
                      borderRadius: "12px",
                      lineHeight: 1.6,
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#2FA7A0";
                      e.target.style.boxShadow = "0 0 0 3px rgba(47,167,160,0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "rgba(150,170,185,0.15)";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                )}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                  {activeTab !== "screenshot" && (
                    <button
                      type="button"
                      onClick={() => setContent(hotelScamExample)}
                      className="text-sm transition-all duration-200 flex items-center gap-2"
                      style={{ color: "#9AA6B2" }}
                      onMouseEnter={(e) => e.currentTarget.style.color = "#F1F3F5"}
                      onMouseLeave={(e) => e.currentTarget.style.color = "#9AA6B2"}
                    >
                      <Sparkles className="h-4 w-4" style={{ color: "#2FA7A0" }} />
                      Try hotel scam example
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={isAnalyzing || (activeTab === "screenshot" && !uploadedFile)}
                    className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold transition-all duration-200 hover:bg-[#38B8AF] hover:shadow-lg hover:-translate-y-0.5 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: "#2FA7A0", color: "#0B1117", borderRadius: "12px" }}
                  >
                    {isAnalyzing ? (
                      <>
                        <Activity className="h-5 w-5 animate-pulse" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <ScanLine className="h-5 w-5" />
                        {activeTab === "screenshot" ? "Analyze Screenshot" : "Analyze Risk"}
                      </>
                    )}
                  </button>
                </div>
              </form>

              {isAnalyzing && (
                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-3 text-sm" style={{ color: "#9AA6B2" }}>
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: "#2FA7A0" }} />
                    {activeTab === "screenshot" ? "Processing image..." : "Analyzing suspicious signals..."}
                  </div>
                  <div className="flex items-center gap-3 text-sm" style={{ color: "#9AA6B2" }}>
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: "#2FA7A0" }} />
                    {activeTab === "screenshot" ? "Extracting text content..." : "Cross-verifying indicators..."}
                  </div>
                  <div className="flex items-center gap-3 text-sm" style={{ color: "#9AA6B2" }}>
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: "#2FA7A0" }} />
                    Calculating risk score...
                  </div>
                </div>
              )}

              {scanResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  style={{ marginTop: "32px", backgroundColor: "#111A22", border: "1px solid rgba(150,170,185,0.15)", borderRadius: "16px", padding: "32px" }}
                >
                  <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className="flex-shrink-0">
                      <div className="relative h-48 w-48">
                        <svg className="h-full w-full -rotate-90" viewBox="0 0 160 160">
                          <circle cx="80" cy="80" r="62" fill="none" stroke="rgba(150,170,185,0.1)" strokeWidth="12" />
                          <motion.circle
                            cx="80"
                            cy="80"
                            r="62"
                            fill="none"
                            stroke={riskColor(scanResult.riskScore)}
                            strokeWidth="12"
                            strokeLinecap="round"
                            initial={{ strokeDasharray: "0 390" }}
                            animate={{ strokeDasharray: `${(scanResult.riskScore / 100) * 390} 390` }}
                            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <motion.div
                            className="text-4xl font-extrabold"
                            style={{ color: riskColor(scanResult.riskScore) }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                          >
                            {scanResult.riskScore}
                          </motion.div>
                          <div className="text-xs font-semibold" style={{ color: "#9AA6B2" }}>out of 100</div>
                        </div>
                      </div>
                      <div className="mt-4 text-center">
                        <span
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold"
                          style={{
                            backgroundColor: `${riskColor(scanResult.riskScore)}15`,
                            color: riskColor(scanResult.riskScore),
                            borderRadius: "9999px",
                          }}
                        >
                          {riskCopy(scanResult.riskScore)}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 space-y-6">
                      <div>
                        <h3 className="text-xl font-bold" style={{ color: "#F1F3F5" }}>{scanResult.scamType}</h3>
                        <p className="mt-2" style={{ color: "#9AA6B2", lineHeight: 1.6 }}>{scanResult.recommendation}</p>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold mb-3" style={{ color: "#F1F3F5" }}>Detected Signals</h4>
                        <div className="space-y-2">
                          {scanResult.reasons.map((reason, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                              className="flex items-start gap-3 p-3"
                              style={{ backgroundColor: "#0B1117", border: "1px solid rgba(150,170,185,0.15)", borderRadius: "12px" }}
                            >
                              <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: "#D99A3D" }} />
                              <span className="text-sm" style={{ color: "#F1F3F5", lineHeight: 1.5 }}>{reason}</span>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setContent("");
                          setScanResult(null);
                          setUploadedFile(null);
                          setImagePreview(null);
                        }}
                        className="text-sm transition-all duration-200 flex items-center gap-2"
                        style={{ color: "#9AA6B2" }}
                        onMouseEnter={(e) => e.currentTarget.style.color = "#F1F3F5"}
                        onMouseLeave={(e) => e.currentTarget.style.color = "#9AA6B2"}
                      >
                        <ScanLine className="h-4 w-4" />
                        Analyze another
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Scam Fingerprint Section */}
      <section className="relative py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold sm:text-4xl" style={{ color: "#F1F3F5", letterSpacing: "-0.02em" }}>Every Scam Leaves a Fingerprint</h2>
            <p className="mt-4 text-lg" style={{ color: "#9AA6B2", lineHeight: 1.7 }}>
              ScamShield connects suspicious indicators across multiple data points
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl mx-auto"
          >
            <div className="relative h-[400px]" style={{ backgroundColor: "#111A22", border: "1px solid rgba(150,170,185,0.15)", borderRadius: "16px" }}>
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  className="flex h-20 w-20 items-center justify-center rounded"
                  style={{ backgroundColor: "#2FA7A0" }}
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Fingerprint className="h-10 w-10" style={{ color: "#0B1117" }} />
                </motion.div>
              </div>

              {[
                { icon: Globe2, label: "Website", risk: "verified", angle: 0 },
                { icon: Phone, label: "Phone", risk: "warning", angle: 72 },
                { icon: Mail, label: "Email", risk: "verified", angle: 144 },
                { icon: CreditCard, label: "UPI", risk: "danger", angle: 216 },
                { icon: MessageSquare, label: "Pattern", risk: "warning", angle: 288 },
              ].map((node, i) => {
                const angleRad = (node.angle * Math.PI) / 180;
                const radius = 140;
                const x = Math.cos(angleRad) * radius;
                const y = Math.sin(angleRad) * radius;
                
                const riskColor = node.risk === "verified" ? "#4E9F72" : node.risk === "warning" ? "#D99A3D" : "#C95C5C";

                return (
                  <motion.div
                    key={node.label}
                    className="absolute"
                    style={{
                      left: `calc(50% + ${x}px)`,
                      top: `calc(50% + ${y}px)`,
                    }}
                    animate={{
                      scale: [1, 1.08, 1],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      delay: i * 0.3,
                      ease: "easeInOut",
                    }}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex h-14 w-14 items-center justify-center rounded" style={{ backgroundColor: "#0B1117", border: `1px solid ${riskColor}40` }}>
                        <node.icon className="h-6 w-6" style={{ color: riskColor }} />
                      </div>
                      <span className="text-xs font-medium" style={{ color: "#9AA6B2" }}>{node.label}</span>
                    </div>
                  </motion.div>
                );
              })}

              <svg className="absolute inset-0 h-full w-full" style={{ pointerEvents: "none" }}>
                {[0, 72, 144, 216, 288].map((angle, i) => {
                  const angleRad = (angle * Math.PI) / 180;
                  const radius = 140;
                  const x2 = 200 + Math.cos(angleRad) * radius;
                  const y2 = 200 + Math.sin(angleRad) * radius;

                  return (
                    <line
                      key={i}
                      x1="200"
                      y1="200"
                      x2={x2}
                      y2={y2}
                      stroke="rgba(150,170,185,0.2)"
                      strokeWidth="1"
                    />
                  );
                })}
              </svg>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Scam Categories */}
      <section id="categories" className="relative py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold sm:text-4xl" style={{ color: "#F1F3F5", letterSpacing: "-0.02em" }}>Scam Categories We Detect</h2>
            <p className="mt-4 text-lg" style={{ color: "#9AA6B2", lineHeight: 1.7 }}>
              Comprehensive protection against various types of digital fraud
            </p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[
              { icon: CreditCard, title: "Financial Fraud", desc: "Banking & payment scams" },
              { icon: Globe2, title: "UPI Scams", desc: "Fake payment requests" },
              { icon: ShieldAlert, title: "Banking & KYC", desc: "Identity verification fraud" },
              { icon: Briefcase, title: "Job Scams", desc: "Fake employment offers" },
              { icon: ShoppingBag, title: "Shopping Fraud", desc: "E-commerce deception" },
              { icon: Building2, title: "Hotel & Travel", desc: "Fake booking scams" },
              { icon: TrendingUp, title: "Investment Scams", desc: "Fraudulent schemes" },
              { icon: Users, title: "Social Media", desc: "Platform-based fraud" },
              { icon: Building, title: "Government", desc: "Official impersonation" },
              { icon: MessageSquare, title: "Phishing", desc: "Email & link scams" },
            ].map((category, i) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -2 }}
                className="p-6 transition-all duration-250"
                style={{ backgroundColor: "#111A22", border: "1px solid rgba(150,170,185,0.15)", borderRadius: "16px" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#2FA7A0";
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(150,170,185,0.15)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded" style={{ backgroundColor: "#0B1117" }}>
                  <category.icon className="h-6 w-6" style={{ color: "#2FA7A0" }} />
                </div>
                <h3 className="text-lg font-semibold" style={{ color: "#F1F3F5" }}>{category.title}</h3>
                <p className="mt-2 text-sm" style={{ color: "#9AA6B2", lineHeight: 1.6 }}>{category.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold sm:text-4xl" style={{ color: "#F1F3F5", letterSpacing: "-0.02em" }}>How It Works</h2>
            <p className="mt-4 text-lg" style={{ color: "#9AA6B2", lineHeight: 1.7 }}>
              Four simple steps to protect yourself from digital fraud
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              { step: "01", title: "Input", icon: Upload, desc: "Paste suspicious content or upload a screenshot" },
              { step: "02", title: "Analyze", icon: BrainCircuit, desc: "AI analyzes patterns and cross-references signals" },
              { step: "03", title: "Verify", icon: ShieldCheck, desc: "Review detailed risk assessment and indicators" },
              { step: "04", title: "Protect", icon: Lock, desc: "Take informed action based on recommendations" },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="relative"
              >
                <div className="text-5xl font-extrabold" style={{ color: "rgba(47,167,160,0.2)" }}>{item.step}</div>
                <div className="mt-4 flex h-12 w-12 items-center justify-center rounded" style={{ backgroundColor: "#2FA7A0" }}>
                  <item.icon className="h-6 w-6" style={{ color: "#0B1117" }} />
                </div>
                <h3 className="mt-4 text-xl font-bold" style={{ color: "#F1F3F5" }}>{item.title}</h3>
                <p className="mt-2" style={{ color: "#9AA6B2", lineHeight: 1.6 }}>{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Hotel Scam Demo */}
      <section className="relative py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{ backgroundColor: "#111A22", border: "1px solid rgba(150,170,185,0.15)", borderRadius: "16px", padding: "32px 48px" }}
          >
            <div className="grid gap-8 lg:grid-cols-2">
              <div>
                <div className="mb-6">
                  <span className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold" style={{ backgroundColor: "rgba(217,154,61,0.1)", color: "#D99A3D", borderRadius: "9999px" }}>
                    <AlertTriangle className="h-4 w-4" />
                    Real-World Example
                  </span>
                </div>
                <h3 className="text-2xl font-bold" style={{ color: "#F1F3F5" }}>Hotel Booking Scam</h3>
                <p className="mt-4" style={{ color: "#9AA6B2", lineHeight: 1.6 }}>
                  "Luxury Hotel — ₹999/night. Pay ₹2,000 advance to confirm booking."
                </p>
                <div className="mt-6 space-y-3">
                  {[
                    "Fake hotel website",
                    "Suspicious pricing",
                    "Personal UPI payment request",
                    "No official verification",
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3" style={{ color: "#F1F3F5" }}>
                      <AlertTriangle className="h-5 w-5" style={{ color: "#D99A3D" }} />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="relative h-48 w-48">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 160 160">
                      <circle cx="80" cy="80" r="62" fill="none" stroke="rgba(150,170,185,0.1)" strokeWidth="12" />
                      <circle cx="80" cy="80" r="62" fill="none" stroke="#C95C5C" strokeWidth="12" strokeLinecap="round" strokeDasharray="390" strokeDashoffset="31" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="text-4xl font-extrabold" style={{ color: "#C95C5C" }}>92</div>
                      <div className="text-xs font-semibold" style={{ color: "#9AA6B2" }}>out of 100</div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold" style={{ backgroundColor: "rgba(201,92,92,0.15)", color: "#C95C5C", borderRadius: "9999px" }}>
                      Critical Risk
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Security Features */}
      <section id="security" className="relative py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold sm:text-4xl" style={{ color: "#F1F3F5", letterSpacing: "-0.02em" }}>Built With Privacy & Security</h2>
            <p className="mt-4 text-lg" style={{ color: "#9AA6B2", lineHeight: 1.7 }}>
              Your data is protected with enterprise-grade security measures
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Lock, title: "Secure Processing", desc: "End-to-end encryption for all data" },
              { icon: ShieldCheck, title: "Data Protection", desc: "No data storage beyond analysis" },
              { icon: Zap, title: "Input Validation", desc: "Rigorous security checks" },
              { icon: Fingerprint, title: "Authentication", desc: "Secure access controls" },
              { icon: Globe, title: "Encrypted Connections", desc: "TLS 1.3 for all communications" },
              { icon: BrainCircuit, title: "Responsible AI", desc: "Transparent analysis without bias" },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                className="p-6 transition-all duration-250"
                style={{ backgroundColor: "#111A22", border: "1px solid rgba(150,170,185,0.15)", borderRadius: "16px" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#2FA7A0";
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(150,170,185,0.15)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded" style={{ backgroundColor: "#0B1117" }}>
                  <feature.icon className="h-6 w-6" style={{ color: "#2FA7A0" }} />
                </div>
                <h3 className="text-lg font-semibold" style={{ color: "#F1F3F5" }}>{feature.title}</h3>
                <p className="mt-2 text-sm" style={{ color: "#9AA6B2", lineHeight: 1.6 }}>{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12" style={{ borderTop: "1px solid rgba(150,170,185,0.15)", backgroundColor: "#0B1117" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-9 w-9 items-center justify-center" style={{ backgroundColor: "#111A22", border: "1px solid rgba(150,170,185,0.15)", borderRadius: "10px" }}>
                  <Shield className="h-5 w-5" style={{ color: "#2FA7A0" }} strokeWidth={1.5} />
                </div>
                <div>
                  <div className="text-lg font-bold" style={{ color: "#F1F3F5" }}>Scam<span style={{ color: "#2FA7A0" }}>Shield</span></div>
                  <div className="text-xs" style={{ color: "#9AA6B2" }}>Detect. Verify. Stay Safe.</div>
                </div>
              </div>
              <p className="text-sm max-w-md" style={{ color: "#9AA6B2", lineHeight: 1.6 }}>
                AI-powered scam detection platform that helps you identify and avoid digital fraud before it costs you.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4" style={{ color: "#F1F3F5" }}>Product</h4>
              <ul className="space-y-2">
                <li><a href="#hero" className="text-sm transition-all duration-200" style={{ color: "#9AA6B2" }} onMouseEnter={(e) => e.currentTarget.style.color = "#F1F3F5"} onMouseLeave={(e) => e.currentTarget.style.color = "#9AA6B2"}>Home</a></li>
                <li><a href="#analyze" className="text-sm transition-all duration-200" style={{ color: "#9AA6B2" }} onMouseEnter={(e) => e.currentTarget.style.color = "#F1F3F5"} onMouseLeave={(e) => e.currentTarget.style.color = "#9AA6B2"}>Analyze</a></li>
                <li><a href="#how-it-works" className="text-sm transition-all duration-200" style={{ color: "#9AA6B2" }} onMouseEnter={(e) => e.currentTarget.style.color = "#F1F3F5"} onMouseLeave={(e) => e.currentTarget.style.color = "#9AA6B2"}>How It Works</a></li>
                <li><a href="#categories" className="text-sm transition-all duration-200" style={{ color: "#9AA6B2" }} onMouseEnter={(e) => e.currentTarget.style.color = "#F1F3F5"} onMouseLeave={(e) => e.currentTarget.style.color = "#9AA6B2"}>Threats</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4" style={{ color: "#F1F3F5" }}>Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm transition-all duration-200" style={{ color: "#9AA6B2" }} onMouseEnter={(e) => e.currentTarget.style.color = "#F1F3F5"} onMouseLeave={(e) => e.currentTarget.style.color = "#9AA6B2"}>About</a></li>
                <li><a href="#" className="text-sm transition-all duration-200" style={{ color: "#9AA6B2" }} onMouseEnter={(e) => e.currentTarget.style.color = "#F1F3F5"} onMouseLeave={(e) => e.currentTarget.style.color = "#9AA6B2"}>Privacy</a></li>
                <li><a href="#" className="text-sm transition-all duration-200" style={{ color: "#9AA6B2" }} onMouseEnter={(e) => e.currentTarget.style.color = "#F1F3F5"} onMouseLeave={(e) => e.currentTarget.style.color = "#9AA6B2"}>Terms</a></li>
                <li><a href="#" className="text-sm transition-all duration-200" style={{ color: "#9AA6B2" }} onMouseEnter={(e) => e.currentTarget.style.color = "#F1F3F5"} onMouseLeave={(e) => e.currentTarget.style.color = "#9AA6B2"}>Contact</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4" style={{ borderTop: "1px solid rgba(150,170,185,0.15)" }}>
            <p className="text-sm" style={{ color: "#9AA6B2" }}>© 2026 ScamShield. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="#" className="transition-all duration-200" style={{ color: "#9AA6B2" }} onMouseEnter={(e) => e.currentTarget.style.color = "#F1F3F5"} onMouseLeave={(e) => e.currentTarget.style.color = "#9AA6B2"}>
                <Shield className="h-5 w-5" />
              </a>
              <a href="#" className="transition-all duration-200" style={{ color: "#9AA6B2" }} onMouseEnter={(e) => e.currentTarget.style.color = "#F1F3F5"} onMouseLeave={(e) => e.currentTarget.style.color = "#9AA6B2"}>
                <Globe className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
