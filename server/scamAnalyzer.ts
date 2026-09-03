export type SourceType = "message" | "website" | "email" | "screenshot" | "payment" | "call" | "document";

export type AnalysisResult = {
  riskScore: number;
  riskBand: "Low Risk" | "Relatively Low" | "Suspicious" | "High Risk" | "Very High Risk";
  scamType: string;
  reasons: string[];
  recommendation: string;
  matchedIndicators: string[];
};

const signalRules: Array<{ label: string; weight: number; pattern: RegExp }> = [
  { label: "Urgent action language", weight: 12, pattern: /urgent|immediately|act now|within\s+\d+\s*(minutes?|hours?)/i },
  { label: "Unrealistic offer", weight: 18, pattern: /limited time|guaranteed|too good|\bfree\b|won|winner|reward|cashback|999|90%\s*off/i },
  { label: "Credential request", weight: 22, pattern: /otp|one[- ]time password|cvv|pin|password|verify your account|kyc/i },
  { label: "Suspicious payment request", weight: 22, pattern: /upi|bank account|personal account|pay now|send money|transfer|advance payment|processing fee/i },
  { label: "Suspicious link or domain", weight: 16, pattern: /https?:\/\/|bit\.ly|tinyurl|\.xyz\b|\.top\b|login-|secure-|verify-/i },
  { label: "Impersonation cue", weight: 14, pattern: /police|income tax|customs|bank manager|support team|government|official|account will be blocked/i },
  { label: "Pressure or threat", weight: 16, pattern: /blocked|arrest|legal action|penalty|fine|last warning|suspended/i },
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
  if (sourceType === "website") return "Suspicious Website";
  return "Suspicious Message";
}

export function analyzeContent(text: string, sourceType: SourceType = "message"): AnalysisResult {
  const cleanText = text.trim();
  const matches = signalRules.filter((rule) => rule.pattern.test(cleanText));
  const baseline = sourceType === "website" ? 8 : sourceType === "payment" ? 10 : 4;
  const riskScore = Math.min(99, Math.max(4, baseline + matches.reduce((sum, rule) => sum + rule.weight, 0)));
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

  return {
    riskScore,
    riskBand,
    scamType: inferScamType(cleanText, sourceType),
    reasons,
    recommendation,
    matchedIndicators: matches.map((match) => match.label),
  };
}
