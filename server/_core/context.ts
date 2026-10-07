import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { getSessionManager } from "./session";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  sessionId?: string;
  sessionAnomalies?: string[];
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let sessionId: string | undefined;
  let sessionAnomalies: string[] | undefined;

  try {
    const authResult = await sdk.authenticateRequest(opts.req);
    user = authResult;
    
    // Check for session anomalies if user is authenticated
    if (user) {
      const sessionManager = getSessionManager();
      const cookie = opts.req.cookies[process.env.COOKIE_NAME || "session"];
      
      if (cookie) {
        sessionId = cookie;
        const clientIp = opts.req.ip || opts.req.connection.remoteAddress || "unknown";
        const userAgent = opts.req.headers["user-agent"] || "unknown";
        
        const anomalyCheck = await sessionManager.detectSessionAnomalies(
          cookie,
          clientIp,
          userAgent
        );
        
        if (anomalyCheck.hasAnomalies) {
          sessionAnomalies = anomalyCheck.reasons;
          console.warn("Session anomalies detected:", anomalyCheck.reasons);
        }
      }
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    sessionId,
    sessionAnomalies,
  };
}
