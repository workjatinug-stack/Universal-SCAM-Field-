import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { Request, Response, NextFunction } from "express";
import { getRedisCache } from "./redis";
import { getMonitoringSystem } from "./monitoring";

// Rate limiting configuration
export const createRateLimiter = (windowMs: number = 15 * 60 * 1000, max: number = 100) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: "Too many requests from this IP, please try again later.",
      retryAfter: Math.ceil(windowMs / 1000),
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Use Redis store if available for distributed rate limiting
    store: process.env.REDIS_HOST ? undefined : undefined,
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === "/health";
    },
  });
};

// Different rate limiters for different endpoints
export const strictRateLimiter = createRateLimiter(15 * 60 * 1000, 50); // 50 requests per 15 minutes
export const moderateRateLimiter = createRateLimiter(15 * 60 * 1000, 200); // 200 requests per 15 minutes
export const laxRateLimiter = createRateLimiter(60 * 60 * 1000, 1000); // 1000 requests per hour

// Analysis-specific rate limiter (stricter for scam analysis)
export const analysisRateLimiter = createRateLimiter(60 * 1000, 10); // 10 analyses per minute

// Security headers middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
});

// IP-based security middleware
export const ipSecurityMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const clientIp = req.ip || req.connection.remoteAddress || "unknown";
  
  // Log suspicious activity patterns
  const userAgent = req.headers["user-agent"] || "";
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
  ];
  
  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));
  
  if (isSuspicious && req.path !== "/health") {
    console.warn(`Suspicious user agent from ${clientIp}: ${userAgent}`);
  }
  
  // Check for blocked IPs (could be enhanced with Redis)
  const blockedIps = process.env.BLOCKED_IPS?.split(",") || [];
  if (blockedIps.includes(clientIp)) {
    return res.status(403).json({ error: "IP address blocked" });
  }
  
  next();
};

// Request size validation
export const requestSizeValidator = (maxSize: number = 10 * 1024 * 1024) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers["content-length"] || "0");
    
    if (contentLength > maxSize) {
      return res.status(413).json({
        error: "Request entity too large",
        maxSize: `${maxSize / 1024 / 1024}MB`,
      });
    }
    
    next();
  };
};

// Sanitize input middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitize = (obj: any): any => {
    if (typeof obj === "string") {
      // Remove potential XSS patterns
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/javascript:/gi, "")
        .replace(/on\w+\s*=/gi, "");
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    
    if (obj && typeof obj === "object") {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitize(obj[key]);
        }
      }
      return sanitized;
    }
    
    return obj;
  };
  
  if (req.body) {
    req.body = sanitize(req.body);
  }
  
  if (req.query) {
    req.query = sanitize(req.query);
  }
  
  next();
};

// Advanced rate limiting with Redis
export const advancedRateLimiter = async (
  identifier: string,
  limit: number,
  window: number = 60
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> => {
  const cache = getRedisCache();
  return await cache.checkRateLimit(identifier, limit, window);
};

// Distributed security checks
export const distributedSecurityCheck = async (req: Request): Promise<{
  blocked: boolean;
  reason?: string;
  score: number;
}> => {
  const clientIp = req.ip || "unknown";
  const cache = getRedisCache();
  
  try {
    // Check if IP is globally blocked
    const isBlocked = await cache.exists(`blocked:${clientIp}`);
    if (isBlocked) {
      return { blocked: true, reason: "IP globally blocked", score: 100 };
    }
    
    // Calculate risk score based on various factors
    let riskScore = 0;
    
    // Check request frequency
    const rateLimitResult = await cache.checkRateLimit(`ip:${clientIp}`, 100, 60);
    if (!rateLimitResult.allowed) {
      riskScore += 50;
    }
    
    // Check for suspicious patterns
    const userAgent = req.headers["user-agent"] || "";
    if (!userAgent || userAgent.length < 10) {
      riskScore += 20;
    }
    
    // Check for missing referer on POST requests
    if (req.method === "POST" && !req.headers.referer) {
      riskScore += 10;
    }
    
    return {
      blocked: riskScore >= 80,
      reason: riskScore >= 80 ? "High risk score" : undefined,
      score: riskScore,
    };
  } catch (error) {
    console.error("Distributed security check error:", error);
    return { blocked: false, score: 0 };
  }
};

// Security audit logging
export const securityAuditLogger = (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send;
  
  res.send = function (data: any) {
    // Log security-relevant events
    if (res.statusCode >= 400) {
      const monitoring = getMonitoringSystem();
      monitoring.logSecurityEvent("http_error", {
        ip: req.ip,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        userAgent: req.headers["user-agent"],
      }, res.statusCode >= 500 ? "high" : "medium");
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

// CORS configuration
export const corsConfig = {
  origin: process.env.CORS_ORIGIN || "*",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  maxAge: 86400, // 24 hours
};

// Security middleware composition
export const applySecurityMiddleware = (app: any) => {
  // Apply security headers
  app.use(securityHeaders);
  
  // Apply IP security
  app.use(ipSecurityMiddleware);
  
  // Apply request size validation
  app.use(requestSizeValidator(10 * 1024 * 1024)); // 10MB max
  
  // Apply input sanitization
  app.use(sanitizeInput);
  
  // Apply security audit logging
  app.use(securityAuditLogger);
  
  // Apply rate limiters to specific routes
  app.use("/api/trpc/scans/analyze", analysisRateLimiter);
  app.use("/api/trpc", moderateRateLimiter);
  app.use("/api", laxRateLimiter);
  
  console.log("Security middleware applied successfully");
};
