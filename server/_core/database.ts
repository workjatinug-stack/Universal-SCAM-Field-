import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { ENV } from "./env";
import * as schema from "../../drizzle/schema";

interface DatabaseConfig {
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  connectionLimit?: number;
  queueLimit?: number;
  waitForConnections?: boolean;
  enableKeepAlive?: boolean;
  keepAliveInitialDelay?: number;
}

class DatabaseConnectionPool {
  private pool: mysql.Pool | null = null;
  private db: any = null;
  private config: Required<DatabaseConfig>;

  constructor(config: DatabaseConfig = {}) {
    this.config = {
      host: config.host || process.env.DB_HOST || "localhost",
      port: config.port || parseInt(process.env.DB_PORT || "3306"),
      user: config.user || process.env.DB_USER || "root",
      password: config.password || process.env.DB_PASSWORD || "",
      database: config.database || process.env.DB_NAME || "scamshield",
      connectionLimit: config.connectionLimit || parseInt(process.env.DB_CONNECTION_LIMIT || "20"),
      queueLimit: config.queueLimit || parseInt(process.env.DB_QUEUE_LIMIT || "0"),
      waitForConnections: config.waitForConnections ?? true,
      enableKeepAlive: config.enableKeepAlive ?? true,
      keepAliveInitialDelay: config.keepAliveInitialDelay || 0,
    };
  }

  async initialize(): Promise<void> {
    if (this.pool) return;

    try {
      this.pool = mysql.createPool({
        host: this.config.host,
        port: this.config.port,
        user: this.config.user,
        password: this.config.password,
        database: this.config.database,
        connectionLimit: this.config.connectionLimit,
        queueLimit: this.config.queueLimit,
        waitForConnections: this.config.waitForConnections,
        enableKeepAlive: this.config.enableKeepAlive,
        keepAliveInitialDelay: this.config.keepAliveInitialDelay,
        // Connection timeout
        connectTimeout: 10000,
        // Timeout for idle connections
        idleTimeout: 60000,
        // SSL configuration (for production)
        ssl: process.env.NODE_ENV === "production" ? {
          rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false",
        } : undefined,
      });

      // Test connection
      const connection = await this.pool.getConnection();
      console.log("Database connection pool established successfully");
      connection.release();

      // Initialize Drizzle with the pool
      this.db = drizzle(this.pool, { schema, mode: "default" });

    } catch (error) {
      console.error("Failed to initialize database connection pool:", error);
      throw error;
    }
  }

  async getDb(): Promise<ReturnType<typeof drizzle> | null> {
    if (!this.db) {
      await this.initialize();
    }
    return this.db;
  }

  async getPool(): Promise<mysql.Pool | null> {
    if (!this.pool) {
      await this.initialize();
    }
    return this.pool;
  }

  async getStats(): Promise<{
    totalConnections: number;
    activeConnections: number;
    idleConnections: number;
    waitingForConnection: number;
    maxConnections: number;
  }> {
    if (!this.pool) {
      return {
        totalConnections: 0,
        activeConnections: 0,
        idleConnections: 0,
        waitingForConnection: 0,
        maxConnections: 0,
      };
    }

    // mysql2/promise doesn't expose detailed pool stats directly
    // We'll provide basic configuration info
    return {
      totalConnections: this.config.connectionLimit,
      activeConnections: 0, // Not directly available in mysql2/promise
      idleConnections: 0, // Not directly available in mysql2/promise
      waitingForConnection: 0, // Not directly available in mysql2/promise
      maxConnections: this.config.connectionLimit,
    };
  }

  async executeQuery<T = any>(query: string, params: any[] = []): Promise<T[]> {
    const pool = await this.getPool();
    if (!pool) throw new Error("Database pool not available");

    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(query, params);
      return rows as T[];
    } finally {
      connection.release();
    }
  }

  async createIndexes(): Promise<void> {
    const pool = await this.getPool();
    if (!pool) throw new Error("Database pool not available");

    const connection = await pool.getConnection();
    try {
      console.log("Creating database indexes for performance optimization...");

      // Indexes for scamScans table
      await connection.execute(`
        CREATE INDEX IF NOT EXISTS idx_scamscans_userId ON scamScans(userId)
      `);
      await connection.execute(`
        CREATE INDEX IF NOT EXISTS idx_scamscans_createdAt ON scamScans(createdAt)
      `);
      await connection.execute(`
        CREATE INDEX IF NOT EXISTS idx_scamscans_riskScore ON scamScans(riskScore)
      `);
      await connection.execute(`
        CREATE INDEX IF NOT EXISTS idx_scamscans_scamType ON scamScans(scamType)
      `);
      await connection.execute(`
        CREATE INDEX IF NOT EXISTS idx_scamscans_sourceType ON scamScans(sourceType)
      `);

      // Indexes for communityReports table
      await connection.execute(`
        CREATE INDEX IF NOT EXISTS idx_communityreports_userId ON communityReports(userId)
      `);
      await connection.execute(`
        CREATE INDEX IF NOT EXISTS idx_communityreports_createdAt ON communityReports(createdAt)
      `);
      await connection.execute(`
        CREATE INDEX IF NOT EXISTS idx_communityreports_severity ON communityReports(severity)
      `);
      await connection.execute(`
        CREATE INDEX IF NOT EXISTS idx_communityreports_status ON communityReports(status)
      `);

      // Indexes for users table
      await connection.execute(`
        CREATE INDEX IF NOT EXISTS idx_users_openId ON users(openId)
      `);
      await connection.execute(`
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
      `);
      await connection.execute(`
        CREATE INDEX IF NOT EXISTS idx_users_lastSignedIn ON users(lastSignedIn)
      `);

      // Composite indexes for common query patterns
      await connection.execute(`
        CREATE INDEX IF NOT EXISTS idx_scamscans_user_created ON scamScans(userId, createdAt)
      `);
      await connection.execute(`
        CREATE INDEX IF NOT EXISTS idx_scamscans_risk_created ON scamScans(riskScore, createdAt)
      `);

      console.log("Database indexes created successfully");
    } catch (error) {
      console.error("Error creating database indexes:", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  async optimizeTables(): Promise<void> {
    const pool = await this.getPool();
    if (!pool) throw new Error("Database pool not available");

    const connection = await pool.getConnection();
    try {
      console.log("Optimizing database tables...");

      const tables = ["scamScans", "communityReports", "users"];
      
      for (const table of tables) {
        await connection.execute(`OPTIMIZE TABLE ${table}`);
      }

      console.log("Database tables optimized successfully");
    } catch (error) {
      console.error("Error optimizing database tables:", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const pool = await this.getPool();
      if (!pool) return false;

      const connection = await pool.getConnection();
      try {
        await connection.ping();
        return true;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error("Database health check failed:", error);
      return false;
    }
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.db = null;
      console.log("Database connection pool closed");
    }
  }
}

let dbConnectionPool: DatabaseConnectionPool | null = null;

export function getDatabaseConnectionPool(): DatabaseConnectionPool {
  if (!dbConnectionPool) {
    dbConnectionPool = new DatabaseConnectionPool();
  }
  return dbConnectionPool;
}

export async function initializeDatabase(): Promise<void> {
  const pool = getDatabaseConnectionPool();
  try {
    await pool.initialize();
    await pool.createIndexes();
  } catch (error) {
    console.warn("Database initialization failed, running without database:", error);
  }
}

export async function getDb(): Promise<ReturnType<typeof drizzle> | null> {
  const pool = getDatabaseConnectionPool();
  return await pool.getDb();
}

export { DatabaseConnectionPool };
