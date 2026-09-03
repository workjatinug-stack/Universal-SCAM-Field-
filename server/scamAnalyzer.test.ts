import { describe, expect, it } from "vitest";
import { analyzeContent } from "./scamAnalyzer";

describe("scam analyzer", () => {
  it("flags credential, payment, and urgency signals as high risk", () => {
    const result = analyzeContent("Urgent: your KYC will be blocked. Share OTP and pay now via UPI.", "message");
    expect(result.riskScore).toBeGreaterThanOrEqual(61);
    expect(result.riskBand).toMatch(/High Risk|Very High Risk/);
    expect(result.scamType).toBe("Banking & KYC Scam");
    expect(result.reasons).toEqual(expect.arrayContaining(["Credential request", "Suspicious payment request"]));
  });

  it("detects travel scams from booking language", () => {
    const result = analyzeContent("Limited time hotel booking offer. Pay ₹4,999 to a personal account.", "payment");
    expect(result.scamType).toBe("Travel & Hotel Scam");
    expect(result.recommendation).toContain("official source");
  });

  it("returns a safe baseline when there are no strong indicators", () => {
    const result = analyzeContent("Can we reschedule our meeting to Thursday at 3 PM?", "message");
    expect(result.riskScore).toBeLessThanOrEqual(20);
    expect(result.riskBand).toBe("Low Risk");
  });
});
