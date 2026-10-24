import { describe, it, expect } from "vitest";
import { analyzeContent } from "./scamAnalyzer";

describe("Scam Analyzer - Fake Job Offers", () => {
  const testCases = [
    {
      name: "High-risk fake job with registration fee",
      input: "Congratulations! You have been selected for a work-from-home job. Pay a registration fee to start earning ₹5,000 daily.",
      expected: {
        minScore: 75,
        scamType: "Fake Job Offer Scam",
        shouldHaveReasons: ["Upfront registration fee", "Job selection scam", "Daily earning promise"],
      },
    },
    {
      name: "Legitimate job posting",
      input: "We are hiring a software engineer with 3+ years of experience. Competitive salary and benefits. Send your resume to careers@company.com",
      expected: {
        maxScore: 40,
        shouldNotHaveReasons: ["Upfront registration fee", "Daily earning promise", "Work from home scam"],
      },
    },
    {
      name: "Work from home with high salary promise",
      input: "Work from home and earn $500 per day. No experience needed. Easy money for everyone.",
      expected: {
        minScore: 60,
        scamType: "Fake Job Offer Scam",
        shouldHaveReasons: ["Work from home scam", "High salary for simple work"],
      },
    },
    {
      name: "Telegram job scam",
      input: "Join our Telegram group for online typing jobs. Earn ₹1000 daily by typing.",
      expected: {
        minScore: 55,
        scamType: "Fake Job Offer Scam",
        shouldHaveReasons: ["Telegram/WhatsApp job scam", "Daily earning promise"],
      },
    },
    {
      name: "Recruitment fee scam",
      input: "You have been selected for a customer service role. Pay ₹2000 recruitment fee to join our team.",
      expected: {
        minScore: 70,
        scamType: "Fake Job Offer Scam",
        shouldHaveReasons: ["Job upfront payment", "Job selection scam"],
      },
    },
    {
      name: "Ambiguous job offer",
      input: "Remote data entry position available. Flexible hours. Good pay.",
      expected: {
        minScore: 0,
        maxScore: 40,
      },
    },
  ];

  testCases.forEach(({ name, input, expected }) => {
    it(name, async () => {
      const result = await analyzeContent(input, "message", null);

      if (expected.minScore !== undefined) {
        expect(result.riskScore).toBeGreaterThanOrEqual(expected.minScore);
      }
      if (expected.maxScore !== undefined) {
        expect(result.riskScore).toBeLessThanOrEqual(expected.maxScore);
      }
      if (expected.scamType) {
        expect(result.scamType).toBe(expected.scamType);
      }
      if (expected.shouldHaveReasons) {
        expected.shouldHaveReasons.forEach(reason => {
          expect(result.reasons).toContain(reason);
        });
      }
      if (expected.shouldNotHaveReasons) {
        expected.shouldNotHaveReasons.forEach(reason => {
          expect(result.reasons).not.toContain(reason);
        });
      }

      // Ensure result is complete
      expect(result.riskScore).toBeGreaterThan(0);
      expect(result.riskScore).toBeLessThan(100);
      expect(result.riskBand).toBeDefined();
      expect(result.recommendation).toBeDefined();
      expect(result.matchedIndicators).toBeDefined();
    });
  });
});

describe("Scam Analyzer - Other Scam Types", () => {
  it("OTP scam detection", async () => {
    const result = await analyzeContent("Urgent! Send your OTP immediately or your account will be blocked", "message", null);
    expect(result.riskScore).toBeGreaterThan(70);
    expect(result.scamType).toBe("OTP & Verification Scam");
  });

  it("Lottery scam detection", async () => {
    const result = await analyzeContent("Congratulations! You won $5000. Pay $50 processing fee to claim your prize", "message", null);
    expect(result.riskScore).toBeGreaterThan(70);
    expect(result.scamType).toBe("Lottery & Prize Scam");
  });

  it("Investment scam detection", async () => {
    const result = await analyzeContent("Double your money in 24 hours with our guaranteed investment scheme", "message", null);
    expect(result.riskScore).toBeGreaterThan(60);
    expect(result.scamType).toBe("Investment Scam");
  });

  it("Safe message", async () => {
    const result = await analyzeContent("Hi, how are you doing today?", "message", null);
    expect(result.riskScore).toBeLessThan(30);
    expect(result.riskBand).toBe("Low Risk");
  });
});

describe("Scam Analyzer - Error Handling", () => {
  it("Handles empty input", async () => {
    const result = await analyzeContent("", "message", null);
    expect(result.riskScore).toBeGreaterThan(0);
    expect(result.riskScore).toBeLessThan(100);
    expect(result.reasons).toBeDefined();
  });

  it("Handles very long input", async () => {
    const longText = "a".repeat(10000);
    const result = await analyzeContent(longText, "message", null);
    expect(result.riskScore).toBeGreaterThan(0);
    expect(result.riskScore).toBeLessThan(100);
  });

  it("Handles special characters", async () => {
    const result = await analyzeContent("Test @#$%^&*() message", "message", null);
    expect(result.riskScore).toBeGreaterThan(0);
    expect(result.riskScore).toBeLessThan(100);
  });
});
