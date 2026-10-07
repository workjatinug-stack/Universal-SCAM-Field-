import fs from "fs";
import path from "path";

interface LogEntry {
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  category: string;
  message: string;
  data?: any;
  userId?: number;
  ip?: string;
  requestId?: string;
}

interface MonitoringConfig {
  logDir?: string;
  maxLogFileSize?: number;
  logRetentionDays?: number;
  enableConsole?: boolean;
  enableFile?: boolean;
}

class MonitoringSystem {
  private config: Required<MonitoringConfig>;
  private logFile: string;
  private errorLogFile: string;
  private metrics: Map<string, number> = new Map();

  constructor(config: MonitoringConfig = {}) {
    this.config = {
      logDir: config.logDir || path.join(process.cwd(), "logs"),
      maxLogFileSize: config.maxLogFileSize || 10 * 1024 * 1024, // 10MB
      logRetentionDays: config.logRetentionDays || 7,
      enableConsole: config.enableConsole ?? process.env.NODE_ENV !== "production",
      enableFile: config.enableFile ?? true,
    };

    this.logFile = path.join(this.config.logDir, "application.log");
    this.errorLogFile = path.join(this.config.logDir, "error.log");

    this.ensureLogDirectory();
    this.cleanupOldLogs();
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.config.logDir)) {
      fs.mkdirSync(this.config.logDir, { recursive: true });
    }
  }

  private cleanupOldLogs(): void {
    try {
      const files = fs.readdirSync(this.config.logDir);
      const now = Date.now();
      const maxAge = this.config.logRetentionDays * 24 * 60 * 60 * 1000;

      files.forEach(file => {
        const filePath = path.join(this.config.logDir, file);
        const stats = fs.statSync(filePath);
        const age = now - stats.mtimeMs;

        if (age > maxAge) {
          fs.unlinkSync(filePath);
          console.log(`Deleted old log file: ${file}`);
        }
      });
    } catch (error) {
      console.error("Error cleaning up old logs:", error);
    }
  }

  private rotateLogFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        if (stats.size > this.config.maxLogFileSize) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
          const backupPath = `${filePath}.${timestamp}.bak`;
          fs.renameSync(filePath, backupPath);
        }
      }
    } catch (error) {
      console.error("Error rotating log file:", error);
    }
  }

  private writeToFile(entry: LogEntry, filePath: string): void {
    if (!this.config.enableFile) return;

    try {
      this.rotateLogFile(filePath);
      const logLine = JSON.stringify(entry) + "\n";
      fs.appendFileSync(filePath, logLine);
    } catch (error) {
      console.error("Error writing to log file:", error);
    }
  }

  private writeToConsole(entry: LogEntry): void {
    if (!this.config.enableConsole) return;

    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}] [${entry.category}]`;
    
    switch (entry.level) {
      case "error":
        console.error(prefix, entry.message, entry.data || "");
        break;
      case "warn":
        console.warn(prefix, entry.message, entry.data || "");
        break;
      case "debug":
        console.debug(prefix, entry.message, entry.data || "");
        break;
      default:
        console.log(prefix, entry.message, entry.data || "");
    }
  }

  log(entry: LogEntry): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: entry.level,
      category: entry.category,
      message: entry.message,
      data: entry.data,
      userId: entry.userId,
      ip: entry.ip,
      requestId: entry.requestId,
    };

    this.writeToConsole(logEntry);
    this.writeToFile(logEntry, this.logFile);

    if (logEntry.level === "error") {
      this.writeToFile(logEntry, this.errorLogFile);
    }
  }

  info(category: string, message: string, data?: any): void {
    this.log({ 
      level: "info", 
      category, 
      message, 
      data,
      timestamp: new Date().toISOString(),
      userId: undefined,
      ip: undefined,
      requestId: undefined,
    });
  }

  warn(category: string, message: string, data?: any): void {
    this.log({ 
      level: "warn", 
      category, 
      message, 
      data,
      timestamp: new Date().toISOString(),
      userId: undefined,
      ip: undefined,
      requestId: undefined,
    });
  }

  error(category: string, message: string, data?: any): void {
    this.log({ 
      level: "error", 
      category, 
      message, 
      data,
      timestamp: new Date().toISOString(),
      userId: undefined,
      ip: undefined,
      requestId: undefined,
    });
  }

  debug(category: string, message: string, data?: any): void {
    this.log({ 
      level: "debug", 
      category, 
      message, 
      data,
      timestamp: new Date().toISOString(),
      userId: undefined,
      ip: undefined,
      requestId: undefined,
    });
  }

  // Metrics tracking
  incrementMetric(name: string, value: number = 1): void {
    const current = this.metrics.get(name) || 0;
    this.metrics.set(name, current + value);
  }

  setMetric(name: string, value: number): void {
    this.metrics.set(name, value);
  }

  getMetric(name: string): number {
    return this.metrics.get(name) || 0;
  }

  getAllMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  resetMetrics(): void {
    this.metrics.clear();
  }

  // Performance monitoring
  trackPerformance(category: string, operation: string, fn: () => Promise<any>): Promise<any> {
    const startTime = Date.now();
    this.incrementMetric(`${category}.${operation}.started`);

    return fn()
      .then(result => {
        const duration = Date.now() - startTime;
        this.incrementMetric(`${category}.${operation}.completed`);
        this.incrementMetric(`${category}.${operation}.duration`, duration);
        this.debug(category, `${operation} completed in ${duration}ms`);
        return result;
      })
      .catch(error => {
        const duration = Date.now() - startTime;
        this.incrementMetric(`${category}.${operation}.failed`);
        this.incrementMetric(`${category}.${operation}.duration`, duration);
        this.error(category, `${operation} failed after ${duration}ms`, { error: error.message });
        throw error;
      });
  }

  // Security event logging
  logSecurityEvent(event: string, details: any, severity: "low" | "medium" | "high" | "critical"): void {
    const level = severity === "critical" || severity === "high" ? "error" : severity === "medium" ? "warn" : "info";
    this.log({
      level,
      category: "security",
      message: `Security event: ${event}`,
      data: { ...details, severity },
      timestamp: new Date().toISOString(),
      userId: undefined,
      ip: undefined,
      requestId: undefined,
    });
    this.incrementMetric(`security.${event}`);
    this.incrementMetric(`security.${severity}`);
  }

  // Business metrics
  logScamAnalysis(riskScore: number, scamType: string, cached: boolean): void {
    this.incrementMetric("scam.analysis.total");
    this.incrementMetric(`scam.risk.${this.getRiskCategory(riskScore)}`);
    this.incrementMetric(`scam.type.${scamType.replace(/\s+/g, "_").toLowerCase()}`);
    if (cached) {
      this.incrementMetric("scam.analysis.cached");
    }
  }

  private getRiskCategory(score: number): string {
    if (score <= 20) return "low";
    if (score <= 40) return "relatively_low";
    if (score <= 60) return "suspicious";
    if (score <= 80) return "high";
    return "very_high";
  }

  // Get monitoring statistics
  getStats(): {
    uptime: number;
    metrics: Record<string, number>;
    logFileSize: number;
    errorLogFileSize: number;
  } {
    let logFileSize = 0;
    let errorLogFileSize = 0;

    try {
      if (fs.existsSync(this.logFile)) {
        logFileSize = fs.statSync(this.logFile).size;
      }
      if (fs.existsSync(this.errorLogFile)) {
        errorLogFileSize = fs.statSync(this.errorLogFile).size;
      }
    } catch (error) {
      console.error("Error getting log file sizes:", error);
    }

    return {
      uptime: process.uptime(),
      metrics: this.getAllMetrics(),
      logFileSize,
      errorLogFileSize,
    };
  }
}

let monitoringSystem: MonitoringSystem | null = null;

export function getMonitoringSystem(): MonitoringSystem {
  if (!monitoringSystem) {
    monitoringSystem = new MonitoringSystem();
  }
  return monitoringSystem;
}

export function initializeMonitoring(config?: MonitoringConfig): MonitoringSystem {
  monitoringSystem = new MonitoringSystem(config);
  console.log("Monitoring system initialized");
  return monitoringSystem;
}

export { MonitoringSystem, LogEntry };
