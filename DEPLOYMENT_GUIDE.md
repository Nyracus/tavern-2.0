# Professional Deployment Guide

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- 4GB+ RAM available
- Ports 80, 443, 3000-3003, 6379, 27017 available

### 1. Environment Setup

Create `.env` file in project root:

```env
# Database
MONGO_DB=tavern_db
MONGO_PORT=27017

# Redis
REDIS_PORT=6379
REDIS_PASSWORD=change_me_secure_password

# Backend
NODE_ENV=production
JWT_SECRET=your_super_secret_jwt_key_change_me
JWT_EXPIRES_IN=7d

# Supabase (optional)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key

# Nginx
NGINX_PORT=80
NGINX_HTTPS_PORT=443
```

### 2. Build and Start

```bash
# Build backend images
cd tavern-backend
npm install
npm run build

# Start all services
cd ..
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 3. Verify Deployment

```bash
# Check Nginx
curl http://localhost/health

# Check backend health
curl http://localhost/api/health

# Check specific backend instance
curl http://localhost:3001/api/health/live
```

## Manual Deployment (Without Docker)

### 1. Install Dependencies

**Redis**:
```bash
# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis
sudo systemctl enable redis

# macOS
brew install redis
brew services start redis
```

**Nginx**:
```bash
# Ubuntu/Debian
sudo apt-get install nginx

# macOS
brew install nginx
```

### 2. Configure Backend Instances

Create PM2 ecosystem file (`ecosystem.config.js`):

```javascript
module.exports = {
  apps: [
    {
      name: 'tavern-backend-1',
      script: './dist/server.js',
      cwd: './tavern-backend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        INSTANCE_ID: 'backend-1',
        REDIS_HOST: 'localhost',
        REDIS_PORT: 6379,
      },
    },
    {
      name: 'tavern-backend-2',
      script: './dist/server.js',
      cwd: './tavern-backend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
        INSTANCE_ID: 'backend-2',
        REDIS_HOST: 'localhost',
        REDIS_PORT: 6379,
      },
    },
    {
      name: 'tavern-backend-3',
      script: './dist/server.js',
      cwd: './tavern-backend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3003,
        INSTANCE_ID: 'backend-3',
        REDIS_HOST: 'localhost',
        REDIS_PORT: 6379,
      },
    },
  ],
};
```

Start with PM2:
```bash
npm install -g pm2
cd tavern-backend
npm run build
pm2 start ../ecosystem.config.js
pm2 save
pm2 startup
```

### 3. Configure Nginx

```bash
# Copy configuration
sudo cp nginx/nginx.conf /etc/nginx/nginx.conf

# Update upstream servers to use localhost ports
# Edit /etc/nginx/nginx.conf:
#   server localhost:3001;
#   server localhost:3002;
#   server localhost:3003;

# Test configuration
sudo nginx -t

# Start/Reload
sudo systemctl start nginx
sudo systemctl reload nginx
```

## Performance Tuning

### Redis Optimization

Edit Redis config (`/etc/redis/redis.conf` or via Docker):
```conf
maxmemory 512mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

### Nginx Optimization

Add to `nginx.conf`:
```nginx
worker_processes auto;
worker_rlimit_nofile 65535;

events {
    worker_connections 4096;
    use epoll;
    multi_accept on;
}
```

### Backend Optimization

Set Node.js options:
```bash
export NODE_OPTIONS="--max-old-space-size=2048"
```

## Monitoring

### Health Checks

Set up monitoring script:
```bash
#!/bin/bash
# monitor.sh

while true; do
    echo "=== $(date) ==="
    
    # Check Nginx
    curl -s http://localhost/health || echo "Nginx DOWN"
    
    # Check Backends
    for port in 3001 3002 3003; do
        curl -s http://localhost:$port/api/health/live || echo "Backend $port DOWN"
    done
    
    # Check Redis
    redis-cli ping || echo "Redis DOWN"
    
    sleep 30
done
```

### Log Monitoring

```bash
# Nginx access logs
tail -f /var/log/nginx/access.log

# Nginx error logs
tail -f /var/log/nginx/error.log

# Backend logs (PM2)
pm2 logs

# Backend logs (Docker)
docker-compose logs -f backend1
```

## Scaling

### Add More Backend Instances

1. Update `docker-compose.yml` or `ecosystem.config.js`
2. Update `nginx.conf` upstream block
3. Reload services

### Redis Cluster (Advanced)

For high-traffic scenarios, consider Redis Cluster:
```yaml
redis-cluster:
  image: redis:7-alpine
  command: redis-cluster
  # ... cluster configuration
```

## Security

### 1. Redis Password
```bash
# Set password
redis-cli CONFIG SET requirepass "your_secure_password"

# Update .env
REDIS_PASSWORD=your_secure_password
```

### 2. Nginx SSL/TLS

Uncomment HTTPS server block in `nginx.conf` and configure:
```nginx
ssl_certificate /etc/nginx/ssl/cert.pem;
ssl_certificate_key /etc/nginx/ssl/key.pem;
```

### 3. Firewall Rules

```bash
# Allow only necessary ports
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 3000:3003/tcp  # Block direct backend access
sudo ufw deny 6379/tcp       # Block direct Redis access
sudo ufw deny 27017/tcp     # Block direct MongoDB access
```

## Backup and Recovery

### Redis Backup
```bash
# Manual backup
redis-cli BGSAVE

# Automated backup (cron)
0 2 * * * redis-cli BGSAVE
```

### MongoDB Backup
```bash
# Manual backup
mongodump --out /backup/$(date +%Y%m%d)

# Restore
mongorestore /backup/20240101
```

## Troubleshooting

### High Memory Usage
- Check Redis memory: `redis-cli INFO memory`
- Check cache hit rates
- Adjust cache TTLs
- Clear unused cache keys

### Backend Instances Down
- Check logs: `docker-compose logs backend1`
- Check health: `curl http://localhost:3001/api/health`
- Restart: `docker-compose restart backend1`

### Nginx 502 Errors
- Check backend instances are running
- Check Nginx error logs
- Verify upstream configuration

### Cache Not Working
- Verify Redis connection: `redis-cli ping`
- Check cache service logs
- Verify cache middleware is applied

