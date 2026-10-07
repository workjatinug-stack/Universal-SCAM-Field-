import cluster from "cluster";
import os from "os";
import { getDatabaseConnectionPool } from "./database";
import { getRedisCache } from "./redis";

interface ScalingConfig {
  enabled?: boolean;
  workers?: number;
  gracefulShutdownTimeout?: number;
  healthCheckInterval?: number;
}

class ScalingManager {
  private config: Required<ScalingConfig>;
  private workers: Map<number, any> = new Map();
  private isShuttingDown: boolean = false;

  constructor(config: ScalingConfig = {}) {
    this.config = {
      enabled: config.enabled ?? process.env.SCALING_ENABLED === "true",
      workers: config.workers ?? (parseInt(process.env.WORKER_COUNT || "0") || os.cpus().length),
      gracefulShutdownTimeout: config.gracefulShutdownTimeout ?? 10000,
      healthCheckInterval: config.healthCheckInterval ?? 30000,
    };
  }

  async startCluster(): Promise<void> {
    if (!this.config.enabled) {
      console.log("Cluster scaling disabled, running in single-worker mode");
      return;
    }

    if (cluster.isPrimary) {
      console.log(`Starting cluster with ${this.config.workers} workers`);
      
      // Fork workers
      for (let i = 0; i < this.config.workers; i++) {
        this.forkWorker();
      }

      // Handle worker events
      cluster.on("exit", (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died with code ${code} and signal ${signal}`);
        this.workers.delete(worker.id);
        
        if (!this.isShuttingDown) {
          console.log("Starting a new worker...");
          this.forkWorker();
        }
      });

      // Set up health checks
      this.startHealthChecks();

      // Handle graceful shutdown
      this.setupGracefulShutdown();

    } else {
      console.log(`Worker ${process.pid} started`);
      // Worker process will continue with normal server startup
    }
  }

  private forkWorker(): void {
    const worker = cluster.fork();
    this.workers.set(worker.id, worker);
    console.log(`Worker ${worker.process.pid} started`);
  }

  private startHealthChecks(): void {
    setInterval(async () => {
      if (this.isShuttingDown) return;

      const workers = Object.values(cluster.workers || {});
      const aliveWorkers = workers.filter(w => w && w.isConnected()).length;
      
      console.log(`Health check: ${aliveWorkers}/${workers.length} workers alive`);

      // Check database health
      try {
        const dbPool = getDatabaseConnectionPool();
        const dbHealth = await dbPool.healthCheck();
        console.log(`Database health: ${dbHealth ? "healthy" : "unhealthy"}`);
      } catch (error) {
        console.error("Database health check failed:", error);
      }

      // Check Redis health
      try {
        const cache = getRedisCache();
        const stats = await cache.getStats();
        console.log(`Redis health: ${stats.connected ? "connected" : "disconnected"}`);
      } catch (error) {
        console.error("Redis health check failed:", error);
      }

    }, this.config.healthCheckInterval);
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      console.log(`Received ${signal}, starting graceful shutdown...`);
      this.isShuttingDown = true;

      // Stop accepting new connections
      const workers = Object.values(cluster.workers || {});
      
      // Send shutdown signal to workers
      workers.forEach(worker => {
        if (worker) {
          worker.send("shutdown");
        }
      });

      // Wait for workers to finish or timeout
      setTimeout(() => {
        console.log("Force killing remaining workers");
        workers.forEach(worker => {
          if (worker) {
            worker.kill("SIGKILL");
          }
        });
        process.exit(0);
      }, this.config.gracefulShutdownTimeout);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  }

  async handleWorkerShutdown(): Promise<void> {
    if (cluster.isWorker) {
      console.log(`Worker ${process.pid} shutting down gracefully...`);
      
      // Close database connections
      try {
        const dbPool = getDatabaseConnectionPool();
        await dbPool.close();
      } catch (error) {
        console.error("Error closing database connections:", error);
      }

      // Close Redis connections
      try {
        const cache = getRedisCache();
        await cache.disconnect();
      } catch (error) {
        console.error("Error closing Redis connections:", error);
      }

      console.log(`Worker ${process.pid} shutdown complete`);
    }
  }

  getWorkerStats(): {
    totalWorkers: number;
    activeWorkers: number;
    isPrimary: boolean;
    workerId?: number;
  } {
    if (cluster.isPrimary) {
      const workers = Object.values(cluster.workers || {});
      return {
        totalWorkers: this.config.workers,
        activeWorkers: workers.filter(w => w && w.isConnected()).length,
        isPrimary: true,
      };
    } else {
      return {
        totalWorkers: this.config.workers,
        activeWorkers: 1,
        isPrimary: false,
        workerId: cluster.worker?.id,
      };
    }
  }

  // Load balancing helper functions
  getLoadBalancingConfig(): {
    strategy: "round-robin" | "least-connections" | "ip-hash";
    stickySessions: boolean;
    sessionAffinity: boolean;
  } {
    return {
      strategy: (process.env.LB_STRATEGY as any) || "round-robin",
      stickySessions: process.env.STICKY_SESSIONS === "true",
      sessionAffinity: process.env.SESSION_AFFINITY === "true",
    };
  }

  // Scaling recommendations based on current load
  async getScalingRecommendations(): Promise<{
    currentWorkers: number;
    recommendedWorkers: number;
    reason: string;
    autoScaleEnabled: boolean;
  }> {
    const stats = this.getWorkerStats();
    const dbPool = getDatabaseConnectionPool();
    const dbStats = await dbPool.getStats();
    
    let recommendedWorkers = stats.totalWorkers;
    let reason = "Current configuration is optimal";

    // Simple auto-scaling logic based on database connection pool usage
    const connectionUsage = dbStats.activeConnections / dbStats.maxConnections;
    
    if (connectionUsage > 0.8 && stats.totalWorkers < os.cpus().length * 2) {
      recommendedWorkers = Math.min(stats.totalWorkers + 1, os.cpus().length * 2);
      reason = "High database connection usage, recommend scaling up";
    } else if (connectionUsage < 0.3 && stats.totalWorkers > 1) {
      recommendedWorkers = Math.max(stats.totalWorkers - 1, 1);
      reason = "Low database connection usage, recommend scaling down";
    }

    return {
      currentWorkers: stats.totalWorkers,
      recommendedWorkers,
      reason,
      autoScaleEnabled: process.env.AUTO_SCALE === "true",
    };
  }
}

let scalingManager: ScalingManager | null = null;

export function getScalingManager(): ScalingManager {
  if (!scalingManager) {
    scalingManager = new ScalingManager();
  }
  return scalingManager;
}

export async function initializeScaling(): Promise<void> {
  const manager = getScalingManager();
  await manager.startCluster();
}

export { ScalingManager };
