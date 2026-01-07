# Load Balancing and Caching Implementation

This document describes the professional-grade load balancing and caching implementation for the Tavern platform.

## Architecture Overview

```
                    ┌─────────────┐
                    │   Nginx     │
                    │ Load Balancer│
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼────┐      ┌─────▼─────┐      ┌─────▼─────┐
   │Backend 1│      │ Backend 2 │      │ Backend 3 │
   └────┬────┘      └─────┬─────┘      └─────┬─────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼────┐      ┌─────▼─────┐
   │ MongoDB │      │   Redis   │
   └─────────┘      └───────────┘
```

## Components

### 1. Redis Caching Layer

**Location**: `tavern-backend/src/services/cache.service.ts`

**Features**:
- In-memory caching with Redis
- Tag-based cache invalidation
- Pattern-based cache deletion
- TTL (Time To Live) management
- Cache statistics and monitoring
- Graceful degradation (works without Redis)

**Cache Strategies**:
- **Quest Listings**: 2 minutes TTL, tag: `quests`
- **Recommended Quests**: 5 minutes TTL, user-specific (varies by auth token)
- **Leaderboard**: 5 minutes TTL, tag: `leaderboard`
- **User Profiles**: 1 minute TTL, user-specific
- **NPC Organizations**: 1 minute TTL, user-specific

**Cache Invalidation**:
- Automatic invalidation on mutations (POST, PUT, PATCH, DELETE)
- Tag-based invalidation for related data
- Pattern-based invalidation for bulk operations

### 2. Nginx Load Balancer

**Location**: `nginx/nginx.conf`

**Features**:
- **Load Balancing Algorithm**: Least Connections (distributes to server with fewest active connections)
- **Health Checks**: Automatic failover using `max_fails` and `fail_timeout`
- **Rate Limiting**: 
  - API endpoints: 100 requests/second with burst of 20
  - Auth endpoints: 10 requests/second with burst of 5
- **Response Caching**: 
  - GET requests cached for 5 minutes
  - 404 responses cached for 1 minute
  - Stale cache served during backend errors
- **Connection Pooling**: Keep-alive connections to backend (32 connections)

**Load Balancing Methods Available**:
- `least_conn` (current): Distributes to server with fewest connections
- `round_robin`: Distributes requests in round-robin fashion
- `ip_hash`: Session persistence based on client IP

### 3. Docker Compose Setup

**Location**: `docker-compose.yml`

**Services**:
- **Redis**: Cache layer with persistence
- **MongoDB**: Database with health checks
- **Backend Instances**: 3 instances for high availability
- **Nginx**: Load balancer and reverse proxy

**Health Checks**:
- All services have health check endpoints
- Automatic restart on failure
- Dependency management (backends wait for DB/Redis)

## Configuration

### Environment Variables

**Backend (.env)**:
```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DB=0

# Instance Identification
INSTANCE_ID=backend-1

# Other existing variables...
```

**Docker Compose (.env)**:
```env
# Redis
REDIS_PORT=6379
REDIS_PASSWORD=your_secure_password

# MongoDB
MONGO_PORT=27017
MONGO_DB=tavern_db

# Nginx
NGINX_PORT=80
NGINX_HTTPS_PORT=443

# Backend
NODE_ENV=production
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
```

## Deployment

### Option 1: Docker Compose (Recommended for Production)

```bash
# 1. Create .env file with all required variables
cp .env.example .env
# Edit .env with your values

# 2. Start all services
docker-compose up -d

# 3. Check status
docker-compose ps

# 4. View logs
docker-compose logs -f nginx
docker-compose logs -f backend1
```

### Option 2: Manual Setup

**1. Start Redis**:
```bash
docker run -d \
  --name tavern-redis \
  -p 6379:6379 \
  -v redis_data:/data \
  redis:7-alpine \
  redis-server --appendonly yes
```

**2. Start MongoDB**:
```bash
docker run -d \
  --name tavern-mongodb \
  -p 27017:27017 \
  -v mongodb_data:/data/db \
  mongo:7
```

**3. Start Backend Instances**:
```bash
# Instance 1
INSTANCE_ID=backend-1 PORT=3001 npm start

# Instance 2
INSTANCE_ID=backend-2 PORT=3002 npm start

# Instance 3
INSTANCE_ID=backend-3 PORT=3003 npm start
```

**4. Configure and Start Nginx**:
```bash
# Copy nginx config
sudo cp nginx/nginx.conf /etc/nginx/nginx.conf

# Update upstream servers in nginx.conf to match your ports
# server backend1:3001
# server backend2:3002
# server backend3:3003

# Test configuration
sudo nginx -t

# Start/Reload Nginx
sudo systemctl start nginx
sudo systemctl reload nginx
```

## Monitoring

### Health Check Endpoints

- **Nginx Health**: `http://localhost/health`
- **Backend Health**: `http://localhost/api/health`
- **Backend Readiness**: `http://localhost/api/health/ready`
- **Backend Liveness**: `http://localhost/api/health/live`

### Cache Statistics

Access cache stats via the health endpoint:
```bash
curl http://localhost/api/health
```

Response includes:
```json
{
  "success": true,
  "status": "ok",
  "mongodb": true,
  "redis": true,
  "cache": {
    "keys": 1234,
    "memory": "45.2M",
    "connected": true
  }
}
```

### Nginx Cache Status

Check cache hit/miss ratio:
```bash
# View access logs
tail -f /var/log/nginx/access.log | grep X-Cache-Status
```

Headers in responses:
- `X-Cache-Status`: HIT, MISS, BYPASS, STALE
- `X-Backend-Server`: Which backend instance served the request

## Performance Optimizations

### 1. Response Caching
- GET requests cached at Nginx level (5 minutes)
- Reduces backend load significantly
- Stale cache served during backend errors

### 2. Connection Pooling
- Keep-alive connections between Nginx and backends
- Reduces connection overhead

### 3. Redis Caching
- Application-level caching for database queries
- Tag-based invalidation ensures data consistency
- User-specific caching for personalized data

### 4. Load Distribution
- Least connections algorithm ensures even distribution
- Automatic failover for unhealthy instances

## Cache Invalidation Strategy

### Automatic Invalidation
- **Quest mutations** → Invalidates `quests` and `recommended` tags
- **Profile updates** → Invalidates user-specific profile cache
- **Organization updates** → Invalidates organization cache

### Manual Invalidation
```typescript
// Invalidate by tag
await cacheService.invalidateByTags(['quests', 'leaderboard']);

// Invalidate by pattern
await cacheService.deletePattern('profile:*');

// Invalidate specific key
await cacheService.delete('user:123', 'profile');
```

## Scaling

### Horizontal Scaling

To add more backend instances:

1. **Update docker-compose.yml**:
```yaml
backend4:
  # ... same config as backend1-3
  environment:
    - INSTANCE_ID=backend-4
```

2. **Update nginx.conf**:
```nginx
upstream tavern_backend {
    server backend1:3000;
    server backend2:3000;
    server backend3:3000;
    server backend4:3000;  # Add new instance
}
```

3. **Reload services**:
```bash
docker-compose up -d
docker-compose exec nginx nginx -s reload
```

### Vertical Scaling

Adjust resource limits in docker-compose.yml:
```yaml
services:
  backend1:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

## Troubleshooting

### Redis Connection Issues
```bash
# Check Redis status
docker-compose exec redis redis-cli ping

# View Redis logs
docker-compose logs redis
```

### Backend Health Issues
```bash
# Check individual backend health
curl http://localhost:3001/api/health/live
curl http://localhost:3002/api/health/live
curl http://localhost:3003/api/health/live
```

### Nginx Configuration
```bash
# Test configuration
docker-compose exec nginx nginx -t

# View Nginx logs
docker-compose logs nginx
```

### Cache Issues
```bash
# Clear all cache (use with caution)
docker-compose exec redis redis-cli FLUSHDB

# View cache keys
docker-compose exec redis redis-cli KEYS "*"
```

## Best Practices

1. **Cache TTL**: 
   - Short TTL (1-2 min) for frequently changing data
   - Longer TTL (5-10 min) for relatively static data

2. **Cache Keys**: 
   - Include user context for personalized data
   - Use consistent naming conventions

3. **Invalidation**: 
   - Always invalidate on mutations
   - Use tags for related data invalidation

4. **Monitoring**: 
   - Monitor cache hit rates
   - Track backend instance health
   - Monitor Redis memory usage

5. **Security**: 
   - Use Redis password in production
   - Restrict Redis access to backend network
   - Use HTTPS in production (configure SSL in nginx.conf)

## Production Checklist

- [ ] Set strong Redis password
- [ ] Configure SSL/TLS in Nginx
- [ ] Set appropriate rate limits
- [ ] Configure log rotation
- [ ] Set up monitoring/alerting
- [ ] Configure backup for Redis and MongoDB
- [ ] Set resource limits for containers
- [ ] Enable Redis persistence
- [ ] Configure firewall rules
- [ ] Set up health check monitoring

