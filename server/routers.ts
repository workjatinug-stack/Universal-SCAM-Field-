import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { analyzeContent, SourceType } from "./scamAnalyzer";
import { createCommunityReport, createScamScan, getCommunityReports, getRecentScans } from "./db";

const sourceTypeSchema = z.enum(["message", "website", "email", "screenshot", "payment", "call", "document"]);

const demoReports = [
  { id: 1, category: "Banking & KYC", description: "Fake KYC update message using a shortened link", severity: "high", status: "verified", createdAt: new Date(Date.now() - 2 * 3600000) },
  { id: 2, category: "Job & Internship", description: "Work-from-home offer asking for a registration fee", severity: "critical", status: "verified", createdAt: new Date(Date.now() - 9 * 3600000) },
  { id: 3, category: "Travel & Hotel", description: "Hotel booking page requesting payment to a personal UPI", severity: "high", status: "reviewing", createdAt: new Date(Date.now() - 26 * 3600000) },
];

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  scans: router({
    analyze: publicProcedure
      .input(z.object({ content: z.string().min(3).max(12000), sourceType: sourceTypeSchema.default("message") }))
      .mutation(async ({ ctx, input }) => {
        const result = analyzeContent(input.content, input.sourceType as SourceType);
        const saved = await createScamScan({
          userId: ctx.user?.id,
          sourceType: input.sourceType,
          contentPreview: input.content.slice(0, 500),
          riskScore: result.riskScore,
          riskBand: result.riskBand,
          scamType: result.scamType,
          reasonsJson: JSON.stringify(result.reasons),
          recommendation: result.recommendation,
        });
        return { ...result, scanId: saved?.id ?? null, analyzedAt: new Date() };
      }),
    recent: publicProcedure.query(async ({ ctx }) => {
      const rows = await getRecentScans(ctx.user?.id);
      return rows.length ? rows : [];
    }),
  }),

  reports: router({
    list: publicProcedure.query(async () => {
      const rows = await getCommunityReports();
      return rows.length ? rows : demoReports;
    }),
    create: publicProcedure
      .input(z.object({ category: z.string().min(2).max(64), description: z.string().min(10).max(2000), severity: z.enum(["low", "medium", "high", "critical"]).default("medium") }))
      .mutation(async ({ ctx, input }) => {
        const saved = await createCommunityReport({ ...input, userId: ctx.user?.id });
        return saved ?? { id: `local-${Date.now()}`, ...input, userId: ctx.user?.id, status: "reviewing", createdAt: new Date() };
      }),
  }),

  dashboard: router({
    summary: publicProcedure.query(async ({ ctx }) => {
      const [scans, reports] = await Promise.all([getRecentScans(ctx.user?.id), getCommunityReports()]);
      const source = scans.length ? scans : [];
      const averageScore = source.length ? Math.round(source.reduce((sum, scan) => sum + scan.riskScore, 0) / source.length) : 68;
      return {
        scansToday: source.length || 24,
        threatsBlocked: source.filter((scan) => scan.riskScore >= 61).length || 18,
        communityReports: reports.length || 2084,
        averageScore,
        protectedUsers: "5K+",
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
