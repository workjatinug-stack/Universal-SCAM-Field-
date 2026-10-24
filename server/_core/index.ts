import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import cluster from "cluster";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { initializeWebSocket } from "./websocket";
import { initializeRedis } from "./redis";
import { applySecurityMiddleware } from "./security";
import { initializeDatabase, getDatabaseConnectionPool } from "./database";
import { initializeScaling, getScalingManager } from "./scaling";
import { initializeMonitoring, getMonitoringSystem } from "./monitoring";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  // Initialize monitoring system
  initializeMonitoring({
    enableConsole: process.env.NODE_ENV !== "production",
    enableFile: true,
  });
  
  const monitoring = getMonitoringSystem();
  monitoring.info("system", "Application startup initiated");
  
  // Initialize scaling (cluster mode)
  await initializeScaling();
  
  // Only continue with server setup if we're in a worker process or scaling is disabled
  if (cluster.isPrimary && process.env.SCALING_ENABLED === "true") {
    console.log("Primary process managing workers, not starting server");
    monitoring.info("system", "Primary process managing workers");
    return;
  }
  
  // Initialize Redis cache (optional)
  try {
    await initializeRedis();
    monitoring.info("system", "Redis cache initialized");
  } catch (error) {
    // Redis is optional for development
  }
  
  // Initialize database with connection pooling (optional)
  try {
    await initializeDatabase();
    monitoring.info("system", "Database connection pool initialized");
  } catch (error) {
    // Database is optional for development
  }
  
  const app = express();
  const server = createServer(app);
  
  // Initialize WebSocket
  const wsManager = initializeWebSocket(server);
  monitoring.info("system", "WebSocket server initialized");
  
  // Apply security middleware
  applySecurityMiddleware(app);
  monitoring.info("system", "Security middleware applied");
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  
  // Enhanced health check endpoint with WebSocket, Redis, Database, Scaling, and Monitoring stats
  app.get("/health", async (req, res) => {
    const wsStats = wsManager?.getQueueStats() || { queueSize: 0, activeConnections: 0, resultsCached: 0 };
    const dbPool = getDatabaseConnectionPool();
    const dbStats = await dbPool.getStats();
    const dbHealth = await dbPool.healthCheck();
    const scalingManager = getScalingManager();
    const scalingStats = scalingManager.getWorkerStats();
    const monitoringStats = monitoring.getStats();
    
    res.json({ 
      ok: true, 
      timestamp: Date.now(),
      websocket: wsStats,
      database: {
        ...dbStats,
        healthy: dbHealth,
      },
      scaling: scalingStats,
      monitoring: monitoringStats,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    });
  });
  
  // WebSocket statistics endpoint
  app.get("/api/stats/websocket", (req, res) => {
    const stats = wsManager?.getQueueStats() || { queueSize: 0, activeConnections: 0, resultsCached: 0 };
    res.json(stats);
  });
  
  // Redis statistics endpoint
  app.get("/api/stats/redis", async (req, res) => {
    const { getRedisCache } = await import("./redis");
    const cache = getRedisCache();
    const stats = await cache.getStats();
    res.json(stats);
  });
  
  // Database statistics endpoint
  app.get("/api/stats/database", async (req, res) => {
    const dbPool = getDatabaseConnectionPool();
    const stats = await dbPool.getStats();
    const health = await dbPool.healthCheck();
    res.json({
      ...stats,
      healthy: health,
    });
  });
  
  // Scaling statistics endpoint
  app.get("/api/stats/scaling", async (req, res) => {
    const scalingManager = getScalingManager();
    const stats = scalingManager.getWorkerStats();
    const recommendations = await scalingManager.getScalingRecommendations();
    res.json({
      ...stats,
      recommendations,
    });
  });
  
  // Security statistics endpoint
  app.get("/api/stats/security", (req, res) => {
    res.json({
      securityEnabled: true,
      rateLimiting: true,
      headers: true,
      ipSecurity: true,
      timestamp: new Date().toISOString(),
    });
  });
  
  // Monitoring statistics endpoint
  app.get("/api/stats/monitoring", (req, res) => {
    const stats = monitoring.getStats();
    res.json(stats);
  });
  
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    const scalingManager = getScalingManager();
    const scalingStats = scalingManager.getWorkerStats();
    
    console.log(`Server running on http://localhost:${port}/`);
    console.log(`WebSocket server ready for real-time connections`);
    console.log(`Security middleware enabled with rate limiting and advanced protection`);
    console.log(`Monitoring system active`);
    
    monitoring.info("system", `Server started successfully on port ${port}`, {
      scaling: scalingStats,
      port,
    });
  });
  
  // Handle worker shutdown
  if (cluster.isWorker) {
    process.on("message", (msg) => {
      if (msg === "shutdown") {
        monitoring.info("system", "Worker shutdown initiated");
        const scalingManager = getScalingManager();
        scalingManager.handleWorkerShutdown().then(() => {
          monitoring.info("system", "Worker shutdown complete");
          process.exit(0);
        });
      }
    });
  }
}

startServer().catch(console.error);
