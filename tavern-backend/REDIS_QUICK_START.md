# Redis Quick Start Guide

## Problem
You're seeing: `⚠️ Redis not available, caching disabled`

## Solution: Start Redis

### Option 1: Docker (Easiest - Recommended)

```powershell
# Start Redis container
docker run -d --name tavern-redis -p 6379:6379 redis:7-alpine

# Verify it's running
docker ps | findstr redis

# Check connection
docker exec tavern-redis redis-cli ping
# Should return: PONG
```

### Option 2: Docker Compose

```powershell
# Start just Redis from docker-compose
docker compose up -d redis

# Or start all services
docker compose up -d
```

### Option 3: Use the Helper Script

```powershell
cd tavern-backend
.\start-redis.ps1
```

### Option 4: Install Redis for Windows

1. Download Redis for Windows: https://github.com/microsoftarchive/redis/releases
2. Extract and run `redis-server.exe`
3. Or use WSL: `wsl redis-server`

### Option 5: Redis Cloud (Free Tier)

1. Sign up at: https://redis.com/try-free/
2. Get connection string
3. Add to `.env`:
   ```
   REDIS_CONNECTION_STRING=redis://default:password@host:port
   ```

## Verify Redis is Running

```powershell
# Test connection
Test-NetConnection -ComputerName localhost -Port 6379

# Or use redis-cli (if installed)
redis-cli ping
# Should return: PONG
```

## After Starting Redis

Restart your backend server. You should see:
```
✅ Redis connected (Instance: instance-xxx)
```

Instead of:
```
⚠️ Redis not available, caching disabled
```

## Environment Variables

If using local Redis (default):
- `REDIS_HOST=localhost` (default)
- `REDIS_PORT=6379` (default)
- `REDIS_PASSWORD=` (optional)

If using Redis Cloud or remote:
- `REDIS_CONNECTION_STRING=redis://user:pass@host:port`

## Troubleshooting

**Port 6379 already in use:**
- Another Redis instance is running
- Stop it or use a different port

**Connection refused:**
- Redis is not running
- Start Redis using one of the methods above

**Cannot resolve host:**
- Check `REDIS_HOST` or `REDIS_CONNECTION_STRING` in `.env`
- Make sure Redis is accessible at that address
