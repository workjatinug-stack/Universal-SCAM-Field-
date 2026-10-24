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
  urlAnalysis?: {
    suspiciousDomains: string[];
    urlPatterns: string[];
  };
};

// Comprehensive scam detection patterns
const signalRules: Array<{ label: string; weight: number; pattern: RegExp; category: string }> = [
  // Banking & Payment Scams
  { label: "OTP request urgency", weight: 25, pattern: /otp|one[- ]time password|verification code|confirm\s+code/i, category: "banking" },
  { label: "Account verification pressure", weight: 24, pattern: /verify your account|kyc|account verification|identity verification/i, category: "banking" },
  { label: "Suspicious payment request", weight: 23, pattern: /upi|bank account|personal account|pay now|send money|transfer|advance payment/i, category: "banking" },
  { label: "Card details request", weight: 25, pattern: /cvv|cvv2|card number|credit card|debit card|expiry|expiration/i, category: "banking" },
  { label: "Bank impersonation", weight: 22, pattern: /bank manager|banking support|payment department|transaction team/i, category: "banking" },
  { label: "ATM/Blok notification", weight: 21, pattern: /atm card blocked|bank account blocked|payment blocked|transaction failed/i, category: "banking" },
  
  // Investment Scams
  { label: "Guaranteed returns", weight: 24, pattern: /guaranteed returns|guaranteed profit|risk[- ]free investment|100%\s*return/i, category: "investment" },
  { label: "High-yield promises", weight: 23, pattern: /double your money|10x return|passive income|financial freedom|instant profit/i, category: "investment" },
  { label: "Cryptocurrency investment", weight: 22, pattern: /bitcoin investment|crypto trading|ethereum investment|blockchain profit/i, category: "investment" },
  { label: "Stock trading scams", weight: 21, pattern: /stock tips|trading signals|insider information|penny stock/i, category: "investment" },
  { label: "Forex/trading scams", weight: 20, pattern: /forex|binary options|auto trading|trading bot|investment platform/i, category: "investment" },
  
  // Lottery & Prize Scams
  { label: "Lottery winner claim", weight: 24, pattern: /lottery winner|won lottery|jackpot|prize winner|congratulations you won/i, category: "lottery" },
  { label: "Prize notification", weight: 23, pattern: /you have won|prize money|cash prize|reward|claim your prize/i, category: "lottery" },
  { label: "Advance fee for prize", weight: 25, pattern: /processing fee|delivery fee|tax to claim|insurance fee|clearance fee/i, category: "lottery" },
  { label: "Fake giveaways", weight: 22, pattern: /free gift|free iphone|free laptop|giveaway|contest winner/i, category: "lottery" },
  
  // Fake Job Offers
  { label: "Work from home scam", weight: 23, pattern: /work from home|easy money|no experience needed|daily earning|part-time job/i, category: "job" },
  { label: "Fake job interview", weight: 22, pattern: /job offer|salary package|joining bonus|recruitment fee|registration fee/i, category: "job" },
  { label: "Telegram/WhatsApp job scam", weight: 21, pattern: /telegram job|whatsapp job|remote job|online job|typing job/i, category: "job" },
  { label: "High salary for simple work", weight: 24, pattern: /\$\d+ per hour|\$\d+ per day|excellent salary|lucrative offer/i, category: "job" },
  
  // Fake Shopping Scams
  { label: "Fake online store", weight: 22, pattern: /limited stock|clearance sale|90%\s*off|too good to be true|unbelievable price/i, category: "shopping" },
  { label: "Payment method red flags", weight: 21, pattern: /bank transfer only|upi only|crypto only|no cash on delivery|prepaid card/i, category: "shopping" },
  { label: "Fake e-commerce", weight: 20, pattern: /order confirmation|package delivery|shipping fee|customs duty/i, category: "shopping" },
  { label: "Brand impersonation", weight: 19, pattern: /amazon prime|apple store|samsung|flipkart|paytm mall/i, category: "shopping" },
  
  // Delivery Scams
  { label: "Fake delivery notification", weight: 23, pattern: /delivery failed|package held|customs issue|shipping fee|delivery charge/i, category: "delivery" },
  { label: "Parcel scam", weight: 22, pattern: /courier delivery|dhl|fedex|ups|postal service|package awaiting/i, category: "delivery" },
  { label: "Delivery payment demand", weight: 24, pattern: /pay to release|clearance payment|delivery tax|customs duty/i, category: "delivery" },
  { label: "Tracking link scam", weight: 21, pattern: /track your package|delivery link|shipping link|click to track/i, category: "delivery" },
  
  // Customer Support Scams
  { label: "Fake tech support", weight: 24, pattern: /tech support|customer service|help desk|support team|it department/i, category: "support" },
  { label: "Brand impersonation support", weight: 23, pattern: /microsoft support|apple support|google support|amazon support|samsung support/i, category: "support" },
  { label: "Remote access request", weight: 25, pattern: /remote access|teamviewer|anydesk|screen sharing|connect to computer/i, category: "support" },
  { label: "Virus/malware scare", weight: 24, pattern: /virus detected|malware found|system infected|security alert|compromised/i, category: "support" },
  
  // Phishing
  { label: "Suspicious URL patterns", weight: 23, pattern: /https?:\/\/|bit\.ly|tinyurl|\.xyz\b|\.top\b|\.tk\b|\.ml\b|\.ga\b/i, category: "phishing" },
  { label: "Fake login page", weight: 24, pattern: /login|sign in|verify account|confirm account|update account/i, category: "phishing" },
  { label: "Credential harvesting", weight: 25, pattern: /enter your password|type your password|input your credentials|login details/i, category: "phishing" },
  { label: "Domain spoofing", weight: 22, pattern: /login-|secure-|verify-|account-|banking-|appleid|signin/i, category: "phishing" },
  
  // Impersonation
  { label: "Government impersonation", weight: 24, pattern: /police|income tax|customs|irs|government|federal|court order/i, category: "impersonation" },
  { label: "Bank impersonation", weight: 23, pattern: /bank manager|banking department|payment team|fraud department/i, category: "impersonation" },
  { label: "Executive impersonation", weight: 22, pattern: /ceo|director|manager|hr department|accounting department/i, category: "impersonation" },
  { label: "Family/friend impersonation", weight: 21, pattern: /mom|dad|brother|sister|emergency|i'm in trouble|help me/i, category: "impersonation" },
  
  // Social Engineering
  { label: "Urgency/pressure tactics", weight: 23, pattern: /urgent|immediately|act now|within\s+\d+\s*(minutes?|hours?)|last warning|final notice/i, category: "social" },
  { label: "Fear and threats", weight: 24, pattern: /blocked|arrest|legal action|penalty|fine|suspended|lawsuit|court/i, category: "social" },
  { label: "Emotional manipulation", weight: 22, pattern: /emergency|crisis|help needed|please help|urgent help/i, category: "social" },
  { label: "Authority abuse", weight: 21, pattern: /official notice|legal notice|court order|government notice|regulatory/i, category: "social" },
  
  // Suspicious URLs
  { label: "Shortened URLs", weight: 22, pattern: /bit\.ly|tinyurl|goo\.gl|ow\.ly|is\.gd|buff\.ly|t\.co/i, category: "url" },
  { label: "Suspicious TLDs", weight: 23, pattern: /\.xyz\b|\.top\b|\.tk\b|\.ml\b|\.ga\b|\.cf\b|\.gq\b/i, category: "url" },
  { label: "Fake subdomains", weight: 22, pattern: /login-|secure-|verify-|account-|signin-|banking-|payment-/i, category: "url" },
  { label: "IP-based URLs", weight: 21, pattern: /https?:\/\/\d+\.\d+\.\d+\.\d+|http:\/\/\d+\.\d+\.\d+\.\d+/i, category: "url" },
  
  // Romance Scams
  { label: "Romance scam patterns", weight: 22, pattern: /love|marriage|relationship|dating|widow|widower|oil rig|military|overseas/i, category: "romance" },
  { label: "Military/overseas romance", weight: 23, pattern: /military|army|navy|air force|deployed|overseas|peace keeping/i, category: "romance" },
  { label: "Financial help request", weight: 24, pattern: /send money|help me financially|emergency funds|medical emergency|flight home/i, category: "romance" },
  
  // Cryptocurrency Scams
  { label: "Crypto wallet theft", weight: 25, pattern: /private key|seed phrase|mnemonic|wallet recovery|crypto wallet/i, category: "crypto" },
  { label: "Fake crypto investment", weight: 24, pattern: /bitcoin investment|ethereum investment|crypto trading|defi|yield farming/i, category: "crypto" },
  { label: "Crypto giveaway scam", weight: 23, pattern: /crypto giveaway|free bitcoin|free ethereum|send 1 get 2/i, category: "crypto" },
  
  // General scam indicators
  { label: "Unrealistic offer", weight: 20, pattern: /limited time|guaranteed|too good|\bfree\b|won|winner|reward|cashback|99%\s*off/i, category: "general" },
  { label: "Advanced fee fraud", weight: 22, pattern: /processing fee|administrative fee|handling fee|clearance fee|tax fee/i, category: "general" },
  { label: "Government grant scam", weight: 21, pattern: /government grant|free grant|federal grant|stimulus|relief fund/i, category: "general" },
];

function inferScamType(text: string, matches: any[]): string {
  const normalized = text.toLowerCase();
  const categories = matches.map(m => m.category);
  
  // Check for specific scam types based on matched categories
  if (categories.includes("banking")) {
    if (/otp|kyc|verification/.test(normalized)) return "OTP & Verification Scam";
    if (/card|cvv|debit|credit/.test(normalized)) return "Banking & Payment Scam";
    return "Banking Scam";
  }
  if (categories.includes("investment")) return "Investment Scam";
  if (categories.includes("lottery")) return "Lottery & Prize Scam";
  if (categories.includes("job")) return "Fake Job Offer Scam";
  if (categories.includes("shopping")) return "Fake Shopping Scam";
  if (categories.includes("delivery")) return "Delivery Scam";
  if (categories.includes("support")) return "Customer Support Scam";
  if (categories.includes("phishing")) return "Phishing Attack";
  if (categories.includes("impersonation")) return "Impersonation Scam";
  if (categories.includes("social")) return "Social Engineering Scam";
  if (categories.includes("url")) return "Suspicious URL Scam";
  if (categories.includes("romance")) return "Romance Scam";
  if (categories.includes("crypto")) return "Cryptocurrency Scam";
  
  // Fallback to keyword-based detection
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
  
  return "Suspicious Content";
}

function generateContentHash(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

function extractURLs(text: string): string[] {
  const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s]*)/gi;
  return text.match(urlPattern) || [];
}

function analyzeURLs(urls: string[]): { suspiciousDomains: string[]; urlPatterns: string[] } {
  const suspiciousDomains: string[] = [];
  const urlPatterns: string[] = [];
  
  const suspiciousTLDs = ['.xyz', '.top', '.tk', '.ml', '.ga', '.cf', '.gq', '.cc', '.pw'];
  const suspiciousKeywords = ['login', 'secure', 'verify', 'account', 'banking', 'signin', 'payment'];
  
  urls.forEach(url => {
    const lowerUrl = url.toLowerCase();
    
    // Check for suspicious TLDs
    suspiciousTLDs.forEach(tld => {
      if (lowerUrl.includes(tld)) {
        suspiciousDomains.push(url);
        urlPatterns.push(`Suspicious TLD: ${tld}`);
      }
    });
    
    // Check for suspicious keywords in domain
    suspiciousKeywords.forEach(keyword => {
      if (lowerUrl.includes(keyword)) {
        suspiciousDomains.push(url);
        urlPatterns.push(`Suspicious keyword: ${keyword}`);
      }
    });
    
    // Check for IP-based URLs
    if (/^\d+\.\d+\.\d+\.\d+/.test(url)) {
      suspiciousDomains.push(url);
      urlPatterns.push('IP-based URL');
    }
    
    // Check for shortened URLs
    if (/bit\.ly|tinyurl|goo\.gl|ow\.ly|is\.gd|buff\.ly|t\.co/.test(url)) {
      suspiciousDomains.push(url);
      urlPatterns.push('Shortened URL');
    }
  });
  
  return { suspiciousDomains, urlPatterns };
}

async function analyzeGeographicRisk(ip: string | null) {
  if (!ip) return undefined;

  try {
    const cache = getRedisCache();
    const cacheKey = `geo:${ip}`;
    
    const cached = await cache.get<{ country: string; riskLevel: "low" | "medium" | "high"; reasons: string[] }>(cacheKey);
    if (cached) return cached;

    const highRiskCountries = ["NG", "RU", "CN", "KP", "IR", "PK", "BD", "UA", "BR"];
    const mediumRiskCountries = ["ID", "VN", "PH", "TH", "MY", "KE", "ZA"];
    
    const mockCountryCode = "US";
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
  
  try {
    const cache = getRedisCache();
    const cachedResult = await cache.getCachedAnalysisResult(contentHash);
    if (cachedResult) {
      monitoring.logScamAnalysis(cachedResult.riskScore, cachedResult.scamType, true);
      return { ...cachedResult, cached: true };
    }
  } catch (error) {
    monitoring.error("cache", "Cache check error", { error: error instanceof Error ? error.message : String(error) });
  }

  const matches = signalRules.filter((rule) => rule.pattern.test(cleanText));
  const baseline = sourceType === "website" ? 15 : sourceType === "payment" ? 20 : sourceType === "email" ? 12 : 5;
  let riskScore = Math.min(99, Math.max(4, baseline + matches.reduce((sum, rule) => sum + rule.weight, 0)));
  
  // Extract and analyze URLs
  const urls = extractURLs(cleanText);
  const urlAnalysis = analyzeURLs(urls);
  if (urlAnalysis.suspiciousDomains.length > 0) {
    riskScore = Math.min(99, riskScore + 10 * urlAnalysis.suspiciousDomains.length);
  }
  
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
    ? "CRITICAL: Do not click links or make payments. This is a confirmed scam pattern. Verify the sender through an official channel and report immediately."
    : riskScore >= 61
      ? "HIGH RISK: Pause before responding. Independently verify the sender, domain, and payment details through official channels."
      : riskScore >= 41
        ? "SUSPICIOUS: Treat this with caution. Avoid sharing credentials and look for an official source before proceeding."
        : "LOW RISK: No immediate red flags found. Continue using normal security best practices and verify independently.";

  const result: AnalysisResult = {
    riskScore,
    riskBand,
    scamType: inferScamType(cleanText, matches),
    reasons,
    recommendation,
    matchedIndicators: matches.map((match) => match.label),
    cached: false,
    geographicRisk,
    urlAnalysis: urls.length > 0 ? urlAnalysis : undefined,
  };

  try {
    const cache = getRedisCache();
    await cache.cacheAnalysisResult(contentHash, result, 86400);
  } catch (error) {
    monitoring.error("cache", "Cache set error", { error: error instanceof Error ? error.message : String(error) });
  }

  monitoring.logScamAnalysis(riskScore, result.scamType, false);
  return result;
}
