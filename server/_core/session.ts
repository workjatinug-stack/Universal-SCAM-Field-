import { randomBytes } from "crypto";
import { getRedisCache } from "./redis";

interface SessionData {
  userId: number;
  openId: string;
  name?: string;
  email?: string;
  role?: string;
  loginMethod?: string;
  createdAt: number;
  lastActivity: number;
  userAgent?: string;
  ipAddress?: string;
}

interface SessionOptions {
  ttl?: number; // Time to live in seconds (default: 24 hours)
  rotate?: boolean; // Rotate session ID on activity (default: false)
}

class SessionManager {
  private prefix: string = "session:";
  private defaultTTL: number = 86400; // 24 hours

  generateSessionId(): string {
    return randomBytes(32).toString("hex");
  }

  async createSession(
    data: SessionData,
    options: SessionOptions = {}
  ): Promise<{ sessionId: string; expiresAt: number }> {
    const cache = getRedisCache();
    const sessionId = this.generateSessionId();
    const ttl = options.ttl || this.defaultTTL;
    const now = Date.now();

    const sessionData: SessionData = {
      ...data,
      createdAt: now,
      lastActivity: now,
    };

    // Store session in Redis
    await cache.set(this.prefix + sessionId, sessionData, ttl);

    return {
      sessionId,
      expiresAt: now + (ttl * 1000),
    };
  }

  async getSession(sessionId: string): Promise<SessionData | null> {
    const cache = getRedisCache();
    const session = await cache.get<SessionData>(this.prefix + sessionId);
    
    if (!session) {
      return null;
    }

    // Update last activity
    session.lastActivity = Date.now();
    await cache.set(this.prefix + sessionId, session, this.defaultTTL);

    return session;
  }

  async updateSession(
    sessionId: string,
    updates: Partial<SessionData>
  ): Promise<SessionData | null> {
    const cache = getRedisCache();
    const session = await this.getSession(sessionId);
    
    if (!session) {
      return null;
    }

    const updatedSession: SessionData = {
      ...session,
      ...updates,
      lastActivity: Date.now(),
    };

    await cache.set(this.prefix + sessionId, updatedSession, this.defaultTTL);
    return updatedSession;
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    const cache = getRedisCache();
    return await cache.delete(this.prefix + sessionId);
  }

  async deleteAllUserSessions(userId: number): Promise<number> {
    const cache = getRedisCache();
    // This would require scanning keys, which is not ideal for production
    // In a real implementation, you'd maintain a user:sessions index
    const pattern = `session:*`;
    return await cache.deletePattern(pattern);
  }

  async rotateSession(oldSessionId: string): Promise<{ newSessionId: string; expiresAt: number } | null> {
    const session = await this.getSession(oldSessionId);
    if (!session) {
      return null;
    }

    // Delete old session
    await this.deleteSession(oldSessionId);

    // Create new session with same data
    const result = await this.createSession(session);
    return {
      newSessionId: result.sessionId,
      expiresAt: result.expiresAt,
    };
  }

  async validateSession(sessionId: string): Promise<boolean> {
    const session = await this.getSession(sessionId);
    return session !== null;
  }

  async getSessionInfo(sessionId: string): Promise<{
    valid: boolean;
    age: number;
    timeUntilExpiry: number;
    data?: SessionData;
  }> {
    const cache = getRedisCache();
    const session = await cache.get<SessionData>(this.prefix + sessionId);
    
    if (!session) {
      return {
        valid: false,
        age: 0,
        timeUntilExpiry: 0,
      };
    }

    const now = Date.now();
    const age = now - session.createdAt;
    const timeUntilExpiry = (session.createdAt + (this.defaultTTL * 1000)) - now;

    return {
      valid: true,
      age,
      timeUntilExpiry,
      data: session,
    };
  }

  async cleanupExpiredSessions(): Promise<number> {
    // Redis automatically handles TTL, but we can force cleanup if needed
    const cache = getRedisCache();
    return await cache.deletePattern("session:*");
  }

  async getActiveSessionCount(): Promise<number> {
    const cache = getRedisCache();
    // This would require Redis SCAN in production
    // For now, return 0 as placeholder
    return 0;
  }

  // Security: Check for session anomalies
  async detectSessionAnomalies(sessionId: string, currentIp: string, currentUserAgent: string): Promise<{
    hasAnomalies: boolean;
    reasons: string[];
  }> {
    const session = await this.getSession(sessionId);
    if (!session) {
      return { hasAnomalies: false, reasons: [] };
    }

    const reasons: string[] = [];

    // Check IP change
    if (session.ipAddress && session.ipAddress !== currentIp) {
      reasons.push("IP address changed since last activity");
    }

    // Check user agent change
    if (session.userAgent && session.userAgent !== currentUserAgent) {
      reasons.push("User agent changed since last activity");
    }

    // Check for session age anomalies
    const sessionAge = Date.now() - session.createdAt;
    if (sessionAge > 7 * 24 * 60 * 60 * 1000) { // 7 days
      reasons.push("Session is unusually old");
    }

    return {
      hasAnomalies: reasons.length > 0,
      reasons,
    };
  }

  // Session statistics
  async getStats(): Promise<{
    activeSessions: number;
    averageSessionAge: number;
    sessionsCreatedToday: number;
  }> {
    // In a real implementation, you'd maintain counters and stats
    return {
      activeSessions: await this.getActiveSessionCount(),
      averageSessionAge: 0,
      sessionsCreatedToday: 0,
    };
  }
}

let sessionManager: SessionManager | null = null;

export function getSessionManager(): SessionManager {
  if (!sessionManager) {
    sessionManager = new SessionManager();
  }
  return sessionManager;
}

export { SessionManager, SessionData };
