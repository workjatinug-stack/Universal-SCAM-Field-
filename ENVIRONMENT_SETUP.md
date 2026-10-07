# Environment Configuration Guide

This document provides comprehensive configuration instructions for the advanced features of the ScamShield project.

## Core Environment Variables

### Database Configuration
```bash
# MySQL Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=scamshield
DB_CONNECTION_LIMIT=20
DB_QUEUE_LIMIT=0
DB_SSL_REJECT_UNAUTHORIZED=true

# Alternative: Use DATABASE_URL for connection string
DATABASE_URL=mysql://user:password@host:port/database
```

### Redis Configuration
```bash
# Redis Cache (Optional but recommended for production)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DB=0
```

### Server Configuration
```bash
# Server
PORT=3000
NODE_ENV=production
CORS_ORIGIN=*

# Scaling
SCALING_ENABLED=true
WORKER_COUNT=4
AUTO_SCALE=false
LB_STRATEGY=round-robin
STICKY_SESSIONS=true
SESSION_AFFINITY=true
```

### Security Configuration
```bash
# Security
COOKIE_NAME=session
BLOCKED_IPS=ip1,ip2,ip3
```

### OAuth Configuration
```bash
# OAuth Providers (Optional - for user authentication)
OAUTH_SERVER_URL=your_oauth_server_url
APP_ID=your_app_id
COOKIE_SECRET=your_cookie_secret

# If OAuth is not configured, the application will run in public mode
# and all scam analysis features will still work without authentication
```

### Application Configuration
```bash
# Application
OWNER_OPEN_ID=your_owner_open_id
```

## Advanced Features Configuration

### 1. Real-time WebSocket Support

The WebSocket server is automatically initialized when the application starts. It provides:

- Real-time scam analysis
- Live monitoring capabilities
- High-risk alert broadcasting
- Queue management for analysis requests

**WebSocket Endpoints:**
- `ws://localhost:3000` - WebSocket connection
- `/api/stats/websocket` - WebSocket statistics
- `/health` - Health check with WebSocket stats

**Client Usage:**
```typescript
import { useWebSocket } from '@/hooks/useWebSocket';

const { isConnected, analyzeScam, lastResult } = useWebSocket();

// Real-time analysis
const result = await analyzeScam({
  content: "suspicious message",
  sourceType: "message"
});
```

### 2. Redis Caching Layer

Redis provides distributed caching for:

- Scam analysis results (24-hour TTL)
- Rate limiting
- Session management
- Geographic risk data

**Redis Configuration:**
```bash
# Required for production deployment
REDIS_HOST=your_redis_host
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
```

**Cache Statistics:**
- Endpoint: `/api/stats/redis`
- Monitors: connection status, memory usage, hit rate

### 3. Advanced Security Middleware

The security layer includes:

- Rate limiting (multiple tiers)
- Security headers (Helmet)
- IP-based security
- Input sanitization
- Request size validation
- Security audit logging

**Rate Limiting Tiers:**
- Strict: 50 requests/15 minutes
- Moderate: 200 requests/15 minutes  
- Lax: 1000 requests/hour
- Analysis: 10 analyses/minute

**Security Endpoints:**
- `/api/stats/security` - Security statistics

### 4. Database Connection Pooling

Advanced database features:

- Connection pooling (configurable pool size)
- Automatic indexing for performance
- Health monitoring
- Connection lifecycle management

**Database Configuration:**
```bash
DB_CONNECTION_LIMIT=20  # Adjust based on your needs
DB_QUEUE_LIMIT=0       # 0 = unlimited queue
```

**Database Endpoints:**
- `/api/stats/database` - Database statistics
- `/health` - Includes database health status

**Automatic Indexes:**
- User indexes: `openId`, `email`, `lastSignedIn`
- Scan indexes: `userId`, `createdAt`, `riskScore`, `scamType`, `sourceType`
- Composite indexes: `userId+createdAt`, `riskScore+createdAt`

### 5. Geographic Fraud Detection

IP-based geographic risk analysis:

- Country-based risk scoring
- High-risk region detection
- Cached geographic data (24-hour TTL)

**Geographic Risk Levels:**
- High: +15 risk score
- Medium: +8 risk score
- Low: No adjustment

**Configuration:**
The system uses internal risk country lists. For production, integrate with a GeoIP service.

### 6. Distributed Session Management

Redis-backed session management:

- Secure session IDs
- Session rotation
- Anomaly detection (IP/user agent changes)
- Distributed session storage

**Session Features:**
- 24-hour default TTL
- Automatic activity tracking
- Security anomaly detection
- User session management

**Session Endpoints:**
- Session data automatically included in tRPC context
- Anomaly detection warnings in logs

### 7. Load Balancing & Scaling

Cluster mode for horizontal scaling:

- Multi-worker support
- Graceful shutdown handling
- Health monitoring
- Auto-scaling recommendations

**Scaling Configuration:**
```bash
SCALING_ENABLED=true
WORKER_COUNT=4  # Number of worker processes
AUTO_SCALE=false # Enable auto-scaling
```

**Scaling Strategies:**
- Round-robin (default)
- Least-connections
- IP-hash

**Scaling Endpoints:**
- `/api/stats/scaling` - Scaling statistics and recommendations

**Worker Management:**
- Automatic worker restart on failure
- Graceful shutdown on SIGTERM/SIGINT
- Health checks every 30 seconds

## Development vs Production

### Development Setup
```bash
NODE_ENV=development
SCALING_ENABLED=false
# Redis optional for development
```

### Production Setup
```bash
NODE_ENV=production
SCALING_ENABLED=true
WORKER_COUNT=4
# Redis required for optimal performance
REDIS_HOST=production_redis_host
# Use SSL for database
DB_SSL_REJECT_UNAUTHORIZED=true
```

## Monitoring & Statistics

### Available Statistics Endpoints

1. **General Health**: `/health`
   - WebSocket stats
   - Database health
   - Scaling info
   - System metrics

2. **WebSocket Stats**: `/api/stats/websocket`
   - Queue size
   - Active connections
   - Cached results

3. **Redis Stats**: `/api/stats/redis`
   - Connection status
   - Memory usage
   - Hit rate

4. **Database Stats**: `/api/stats/database`
   - Connection pool stats
   - Health status

5. **Security Stats**: `/api/stats/security`
   - Security features status
   - Rate limiting info

6. **Scaling Stats**: `/api/stats/scaling`
   - Worker information
   - Scaling recommendations

## Performance Optimization

### Recommended Production Settings

```bash
# Database
DB_CONNECTION_LIMIT=50
DB_QUEUE_LIMIT=100

# Redis
REDIS_HOST=production-redis
REDIS_PORT=6379

# Scaling
WORKER_COUNT=8
SCALING_ENABLED=true

# Security
Strict rate limiting for public endpoints
```

### CDN Integration (Optional)

For static asset delivery, configure your CDN to point to:
- `/public/` directory
- WebSocket connections handled separately

## Troubleshooting

### Redis Connection Issues
- Ensure Redis is running: `redis-cli ping`
- Check firewall settings
- Verify connection credentials

### Database Connection Pool Exhaustion
- Increase `DB_CONNECTION_LIMIT`
- Check for connection leaks
- Monitor slow queries

### Scaling Issues
- Ensure sufficient system resources
- Check worker process logs
- Monitor memory usage per worker

### WebSocket Connection Problems
- Verify CORS settings
- Check firewall/proxy configuration
- Ensure WebSocket support in load balancer

## Security Best Practices

1. **Environment Variables**: Never commit `.env` files
2. **Database**: Use strong passwords, SSL connections
3. **Redis**: Enable authentication, use Redis ACL
4. **Sessions**: Use secure cookie settings in production
5. **Rate Limiting**: Adjust limits based on your traffic patterns
6. **IP Blocking**: Regularly update blocked IP lists

## Deployment Checklist

- [ ] Set all required environment variables
- [ ] Configure Redis for production
- [ ] Set up database with proper indexes
- [ ] Configure SSL/TLS certificates
- [ ] Set up monitoring for all endpoints
- [ ] Configure backup strategy for database
- [ ] Test scaling configuration
- [ ] Set up log aggregation
- [ ] Configure CDN if needed
- [ ] Test graceful shutdown procedures

## Support

For issues or questions about the advanced features:
1. Check the relevant endpoint statistics
2. Review application logs
3. Verify environment configuration
4. Check system resources (memory, CPU, connections)
