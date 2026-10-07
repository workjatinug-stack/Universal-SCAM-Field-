import Redis from "ioredis";

interface CacheConfig {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  defaultTTL?: number;
}

class RedisCache {
  private client: Redis | null = null;
  private isConnected: boolean = false;
  private hasLoggedRedisError: boolean = false;
  private config: Required<CacheConfig>;

  constructor(config: CacheConfig = {}) {
    this.config = {
      host: config.host || process.env.REDIS_HOST || "localhost",
      port: config.port || parseInt(process.env.REDIS_PORT || "6379"),
      password: config.password || process.env.REDIS_PASSWORD || "",
      db: config.db || parseInt(process.env.REDIS_DB || "0"),
      keyPrefix: config.keyPrefix || "scamshield:",
      defaultTTL: config.defaultTTL || 3600, // 1 hour default
    };
  }

  async connect(): Promise<void> {
    if (this.isConnected) return;

    try {
      this.client = new Redis({
        host: this.config.host,
        port: this.config.port,
        password: this.config.password,
        db: this.config.db,
        retryStrategy: (times) => {
          // Give up after 3 attempts
          if (times > 3) {
            return null;
          }
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 0, // Don't retry requests
        enableOfflineQueue: false,
        lazyConnect: true,
      });

      this.client.on("connect", () => {
        console.log("Redis connected");
        this.isConnected = true;
      });

      this.client.on("error", (err) => {
        // Only log once when Redis is not available
        if (!this.hasLoggedRedisError) {
          console.warn("Redis is not available. Running without cache. Set REDIS_HOST environment variable to enable caching.");
          this.hasLoggedRedisError = true;
        }
        this.isConnected = false;
      });

      this.client.on("close", () => {
        this.isConnected = false;
      });

      // Test connection
      await this.client.ping();
      console.log("Redis connection established successfully");
    } catch (error) {
      // Only log once when Redis is not available
      if (!this.hasLoggedRedisError) {
        console.warn("Redis is not available. Running without cache. Set REDIS_HOST environment variable to enable caching.");
        this.hasLoggedRedisError = true;
      }
      this.isConnected = false;
      // Don't throw error - allow application to run without Redis
    }
  }

  private getKey(key: string): string {
    return `${this.config.keyPrefix}${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client || !this.isConnected) return null;

    try {
      const data = await this.client.get(this.getKey(key));
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      console.error("Redis get error:", error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    if (!this.client || !this.isConnected) return false;

    try {
      const serialized = JSON.stringify(value);
      const ttlToUse = ttl || this.config.defaultTTL;
      await this.client.setex(this.getKey(key), ttlToUse, serialized);
      return true;
    } catch (error) {
      console.error("Redis set error:", error);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) return false;

    try {
      await this.client.del(this.getKey(key));
      return true;
    } catch (error) {
      console.error("Redis delete error:", error);
      return false;
    }
  }

  async deletePattern(pattern: string): Promise<number> {
    if (!this.client || !this.isConnected) return 0;

    try {
      const keys = await this.client.keys(`${this.config.keyPrefix}${pattern}`);
      if (keys.length === 0) return 0;
      return await this.client.del(...keys);
    } catch (error) {
      console.error("Redis delete pattern error:", error);
      return 0;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) return false;

    try {
      const result = await this.client.exists(this.getKey(key));
      return result === 1;
    } catch (error) {
      console.error("Redis exists error:", error);
      return false;
    }
  }

  async increment(key: string, ttl?: number): Promise<number> {
    if (!this.client || !this.isConnected) return 0;

    try {
      const result = await this.client.incr(this.getKey(key));
      if (ttl && result === 1) {
        await this.client.expire(this.getKey(key), ttl);
      }
      return result;
    } catch (error) {
      console.error("Redis increment error:", error);
      return 0;
    }
  }

  async getStats(): Promise<{
    connected: boolean;
    keyCount: number;
    memoryUsage: string;
    hitRate: number;
  }> {
    if (!this.client || !this.isConnected) {
      return {
        connected: false,
        keyCount: 0,
        memoryUsage: "0B",
        hitRate: 0,
      };
    }

    try {
      const info = await this.client.info("stats");
      const keyCount = await this.client.dbsize();
      const memoryInfo = await this.client.info("memory");
      
      // Parse memory usage
      const memoryMatch = memoryInfo.match(/used_memory_human:([^\r\n]+)/);
      const memoryUsage = memoryMatch ? memoryMatch[1] : "0B";
      
      // Parse hit rate
      const hitRateMatch = info.match(/keyspace_hits:([^\r\n]+)/);
      const hits = hitRateMatch ? parseInt(hitRateMatch[1]) : 0;
      const missRateMatch = info.match(/keyspace_misses:([^\r\n]+)/);
      const misses = missRateMatch ? parseInt(missRateMatch[1]) : 0;
      const hitRate = hits + misses > 0 ? (hits / (hits + misses)) * 100 : 0;

      return {
        connected: true,
        keyCount,
        memoryUsage,
        hitRate,
      };
    } catch (error) {
      console.error("Redis stats error:", error);
      return {
        connected: false,
        keyCount: 0,
        memoryUsage: "0B",
        hitRate: 0,
      };
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
    }
  }

  // Scam analysis specific caching methods
  async cacheAnalysisResult(
    contentHash: string,
    result: any,
    ttl: number = 86400 // 24 hours
  ): Promise<boolean> {
    return this.set(`analysis:${contentHash}`, result, ttl);
  }

  async getCachedAnalysisResult(contentHash: string): Promise<any | null> {
    return this.get(`analysis:${contentHash}`);
  }

  // Rate limiting
  async checkRateLimit(
    identifier: string,
    limit: number,
    window: number = 60
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const key = `ratelimit:${identifier}`;
    const current = await this.increment(key, window);
    const ttl = await this.client?.ttl(this.getKey(key)) || window;
    
    return {
      allowed: current <= limit,
      remaining: Math.max(0, limit - current),
      resetTime: Date.now() + (ttl * 1000),
    };
  }

  // Session management
  async setSession(userId: number, sessionData: any, ttl: number = 86400): Promise<boolean> {
    return this.set(`session:${userId}`, sessionData, ttl);
  }

  async getSession(userId: number): Promise<any | null> {
    return this.get(`session:${userId}`);
  }

  async deleteSession(userId: number): Promise<boolean> {
    return this.delete(`session:${userId}`);
  }
}

let redisCache: RedisCache | null = null;

export function getRedisCache(): RedisCache {
  if (!redisCache) {
    redisCache = new RedisCache();
  }
  return redisCache;
}

export async function initializeRedis(): Promise<void> {
  const cache = getRedisCache();
  try {
    await cache.connect();
  } catch (error) {
    console.warn("Redis connection failed, running without cache");
  }
}

export { RedisCache };
