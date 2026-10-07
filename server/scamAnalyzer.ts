import crypto from "crypto";
import { getRedisCache } from "./_core/redis";
import { getMonitoringSystem } from "./_core/monitoring";

export type SourceType = "message" | "website" | "email" | "screenshot" | "payment" | "call" | "document";

export type AnalysisResult = {
  riskScore: number;
  riskBand: "Low Risk" | "Relatively Low" | "Suspicious" | "High Risk" | "Very High Risk";
  scamType: string;
  reasons: string[];
  recommendation: string;
  matchedIndicators: string[];
  cached?: boolean;
  geographicRisk?: {
    country: string;
    riskLevel: "low" | "medium" | "high";
    reasons: string[];
  };
};

const signalRules: Array<{ label: string; weight: number; pattern: RegExp }> = [
  { label: "Urgent action language", weight: 12, pattern: /urgent|immediately|act now|within\s+\d+\s*(minutes?|hours?)/i },
  { label: "Unrealistic offer", weight: 18, pattern: /limited time|guaranteed|too good|\bfree\b|won|winner|reward|cashback|999|90%\s*off/i },
  { label: "Credential request", weight: 22, pattern: /otp|one[- ]time password|cvv|pin|password|verify your account|kyc/i },
  { label: "Suspicious payment request", weight: 22, pattern: /upi|bank account|personal account|pay now|send money|transfer|advance payment|processing fee/i },
  { label: "Suspicious link or domain", weight: 16, pattern: /https?:\/\/|bit\.ly|tinyurl|\.xyz\b|\.top\b|login-|secure-|verify-/i },
  { label: "Impersonation cue", weight: 14, pattern: /police|income tax|customs|bank manager|support team|government|official|account will be blocked/i },
  { label: "Pressure or threat", weight: 16, pattern: /blocked|arrest|legal action|penalty|fine|last warning|suspended/i },
  { label: "Advanced fee fraud", weight: 20, pattern: /processing fee|administrative fee|handling fee|clearance fee|tax fee/i },
  { label: "Romance scam indicators", weight: 15, pattern: /love|marriage|relationship|dating|widow|widower|oil rig|military|overseas/i },
  { label: "Tech support scam", weight: 18, pattern: /tech support|microsoft|apple|windows|computer virus|malware|remote access/i },
  { label: "Cryptocurrency scam", weight: 19, pattern: /bitcoin|ethereum|crypto|blockchain|wallet|private key|seed phrase/i },
  { label: "Government grant scam", weight: 17, pattern: /government grant|free grant|federal grant|stimulus|relief fund/i },
];

function inferScamType(text: string, sourceType: SourceType) {
  const normalized = text.toLowerCase();
  if (/hotel|booking|room|resort|travel/.test(normalized)) return "Travel & Hotel Scam";
  if (/job|internship|salary|work from home|recruit/.test(normalized)) return "Job & Internship Scam";
  if (/upi|bank|kyc|otp|account|credit card|debit/.test(normalized)) return "Banking & KYC Scam";
  if (/investment|profit|crypto|trading|returns|stock/.test(normalized)) return "Investment Scam";
  if (/lottery|prize|winner|reward|gift/.test(normalized)) return "Lottery & Prize Scam";
  if (/delivery|parcel|shopping|order|refund/.test(normalized)) return "Shopping & E-commerce Scam";
  if (/police|income tax|customs|government/.test(normalized)) return "Government Impersonation Scam";
  if (/love|relationship|dating|marriage/.test(normalized)) return "Romance Scam";
  if (/tech support|virus|malware|remote access/.test(normalized)) return "Tech Support Scam";
  if (/bitcoin|ethereum|crypto|wallet|private key/.test(normalized)) return "Cryptocurrency Scam";
  if (sourceType === "website") return "Suspicious Website";
  return "Suspicious Message";
}

function generateContentHash(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

async function analyzeGeographicRisk(ip: string | null) {
  if (!ip) return undefined;

  try {
    // In a real implementation, you would use a GeoIP service
    // For now, we'll simulate geographic risk analysis
    const cache = getRedisCache();
    const cacheKey = `geo:${ip}`;
    
    // Check cache first
    const cached = await cache.get<{ country: string; riskLevel: "low" | "medium" | "high"; reasons: string[] }>(cacheKey);
    if (cached) return cached;

    // Simulate geographic analysis
    const highRiskCountries = ["NG", "RU", "CN", "KP", "IR"]; // Example high-risk country codes
    const mediumRiskCountries = ["PK", "BD", "UA", "BR"];
    
    // This would be replaced with actual GeoIP lookup
    const mockCountryCode = "US"; // Default to US for demo
    const isHighRisk = highRiskCountries.includes(mockCountryCode);
    const isMediumRisk = mediumRiskCountries.includes(mockCountryCode);
    
    const result = {
      country: mockCountryCode,
      riskLevel: isHighRisk ? "high" as const : isMediumRisk ? "medium" as const : "low" as const,
      reasons: isHighRisk 
        ? ["High fraud rate region", "Known scam operations origin"]
        : isMediumRisk
        ? ["Elevated fraud risk region"]
        : ["Low risk region"],
    };

    // Cache for 24 hours
    await cache.set(cacheKey, result, 86400);
    
    return result;
  } catch (error) {
    console.error("Geographic risk analysis error:", error);
    return undefined;
  }
}

export async function analyzeContent(
  text: string, 
  sourceType: SourceType = "message",
  clientIp: string | null = null
): Promise<AnalysisResult> {
  const monitoring = getMonitoringSystem();
  const cleanText = text.trim();
  const contentHash = generateContentHash(cleanText + sourceType);
  
  // Check cache first
  try {
    const cache = getRedisCache();
    const cachedResult = await cache.getCachedAnalysisResult(contentHash);
    if (cachedResult) {
      monitoring.logScamAnalysis(cachedResult.riskScore, cachedResult.scamType, true);
      return { ...cachedResult, cached: true };
    }
  } catch (error) {
    // If Redis is not available, continue with analysis
    monitoring.error("cache", "Cache check error", { error: error instanceof Error ? error.message : String(error) });
  }

  const matches = signalRules.filter((rule) => rule.pattern.test(cleanText));
  const baseline = sourceType === "website" ? 8 : sourceType === "payment" ? 10 : 4;
  let riskScore = Math.min(99, Math.max(4, baseline + matches.reduce((sum, rule) => sum + rule.weight, 0)));
  
  // Analyze geographic risk
  const geographicRisk = await analyzeGeographicRisk(clientIp);
  if (geographicRisk) {
    if (geographicRisk.riskLevel === "high") {
      riskScore = Math.min(99, riskScore + 15);
    } else if (geographicRisk.riskLevel === "medium") {
      riskScore = Math.min(99, riskScore + 8);
    }
  }

  const riskBand = riskScore <= 20 ? "Low Risk" : riskScore <= 40 ? "Relatively Low" : riskScore <= 60 ? "Suspicious" : riskScore <= 80 ? "High Risk" : "Very High Risk";
  const reasons = matches.length
    ? matches.map((match) => match.label)
    : ["No high-confidence scam indicators detected in the submitted content"];
  const recommendation = riskScore >= 81
    ? "Do not click links or make payments. Verify the sender through an official channel and report the content."
    : riskScore >= 61
      ? "Pause before responding. Independently verify the sender, domain, and payment details."
      : riskScore >= 41
        ? "Treat this as suspicious. Avoid sharing credentials and look for an official source."
        : "No immediate red flags found. Continue using normal security best practices.";

  const result: AnalysisResult = {
    riskScore,
    riskBand,
    scamType: inferScamType(cleanText, sourceType),
    reasons,
    recommendation,
    matchedIndicators: matches.map((match) => match.label),
    cached: false,
    geographicRisk,
  };

  // Cache the result
  try {
    const cache = getRedisCache();
    await cache.cacheAnalysisResult(contentHash, result, 86400); // Cache for 24 hours
  } catch (error) {
    // If Redis is not available, continue without caching
    monitoring.error("cache", "Cache set error", { error: error instanceof Error ? error.message : String(error) });
  }

  monitoring.logScamAnalysis(riskScore, result.scamType, false);
  return result;
}
