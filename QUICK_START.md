# Quick Start Guide - Load Balancing & Caching

## Prerequisites
- Docker and Docker Compose installed
- 4GB+ RAM available
- Ports 80, 3000-3003, 6379, 27017 available

## 1. Setup Environment

Create `.env` file in project root:

```env
# Redis
REDIS_PASSWORD=your_secure_password_here

# Backend
JWT_SECRET=your_jwt_secret_here
NODE_ENV=production

# Database
MONGO_DB=tavern_db
```

## 2. Start Services

```bash
# Build and start all services
docker-compose up -d --build

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

## 3. Verify Deployment

```bash
# Check Nginx
curl http://localhost/health

# Check backend health
curl http://localhost/api/health

# Check cache stats (requires auth)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost/api/admin/cache/stats
```

## 4. Test Load Balancing

```bash
# Make multiple requests and check which backend serves them
for i in {1..10}; do
  curl -s http://localhost/api/health | jq .instance
done
```

## 5. Test Caching

```bash
# First request (cache miss)
curl http://localhost/api/leaderboard/adventurers

# Second request (cache hit - check X-Cache-Status header)
curl -v http://localhost/api/leaderboard/adventurers
```

## Architecture

- **Nginx**: Load balancer on port 80
- **Backend Instances**: 3 instances (ports 3000 internally)
- **Redis**: Cache layer on port 6379
- **MongoDB**: Database on port 27017

## Monitoring

- Health checks: `http://localhost/api/health`
- Cache stats: `http://localhost/api/admin/cache/stats` (Guild Master only)
- Nginx logs: `docker-compose logs nginx`
- Backend logs: `docker-compose logs backend1`

## Scaling

To add more backend instances, edit `docker-compose.yml` and `nginx/nginx.conf`, then:

```bash
docker-compose up -d
docker-compose exec nginx nginx -s reload
```

