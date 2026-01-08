# Production Deployment Checklist

## Pre-Deployment

### Environment Configuration
- [ ] Set strong `JWT_SECRET` (32+ random characters)
- [ ] Set `REDIS_PASSWORD` (strong password)
- [ ] Configure `MONGO_URI` (production MongoDB)
- [ ] Set `NODE_ENV=production`
- [ ] Configure Supabase credentials (if using)
- [ ] Set `FRONTEND_URL` to production domain
- [ ] Configure email service credentials

### Security
- [ ] Change all default passwords
- [ ] Enable Redis password authentication
- [ ] Configure MongoDB authentication
- [ ] Set up SSL/TLS certificates for Nginx
- [ ] Configure firewall rules
- [ ] Review rate limiting settings
- [ ] Enable HTTPS in Nginx configuration

### Infrastructure
- [ ] Verify Docker and Docker Compose installed
- [ ] Ensure sufficient resources (4GB+ RAM, 2+ CPU cores)
- [ ] Configure persistent volumes for Redis and MongoDB
- [ ] Set up backup strategy for databases
- [ ] Configure log rotation

## Deployment Steps

### 1. Build and Start
```bash
# Build backend
cd tavern-backend
npm install
npm run build

# Start all services
cd ..
docker-compose up -d --build
```

### 2. Verify Services
```bash
# Check all services are running
docker-compose ps

# Check health
curl http://localhost/api/health

# Check individual backends
curl http://localhost:3001/api/health/live
curl http://localhost:3002/api/health/live
curl http://localhost:3003/api/health/live
```

### 3. Test Load Balancing
```bash
# Make multiple requests and verify distribution
for i in {1..20}; do
  curl -s http://localhost/api/health | jq -r .instance
done
```

### 4. Test Caching
```bash
# First request (should be MISS)
curl -v http://localhost/api/leaderboard/adventurers 2>&1 | grep X-Cache-Status

# Second request (should be HIT)
curl -v http://localhost/api/leaderboard/adventurers 2>&1 | grep X-Cache-Status
```

## Post-Deployment

### Monitoring Setup
- [ ] Set up log aggregation
- [ ] Configure health check monitoring
- [ ] Set up alerts for service failures
- [ ] Monitor cache hit rates
- [ ] Monitor backend instance health
- [ ] Track Redis memory usage

### Performance Tuning
- [ ] Adjust cache TTLs based on usage patterns
- [ ] Tune rate limits based on traffic
- [ ] Optimize Nginx worker processes
- [ ] Monitor and adjust resource limits

### Backup Configuration
- [ ] Set up MongoDB automated backups
- [ ] Set up Redis persistence
- [ ] Test backup restoration process
- [ ] Document backup procedures

## Maintenance

### Regular Tasks
- [ ] Monitor cache statistics weekly
- [ ] Review and rotate logs monthly
- [ ] Update dependencies quarterly
- [ ] Review security patches monthly
- [ ] Test disaster recovery procedures

### Scaling
- [ ] Monitor resource usage
- [ ] Add backend instances as needed
- [ ] Scale Redis if memory usage high
- [ ] Adjust Nginx upstream as instances change

## Troubleshooting

### Common Issues

**Redis Connection Failed**
- Check Redis is running: `docker-compose ps redis`
- Verify password in .env matches Redis config
- Check network connectivity

**Backend Instances Down**
- Check logs: `docker-compose logs backend1`
- Verify health: `curl http://localhost:3001/api/health/live`
- Check resource limits

**Nginx 502 Errors**
- Verify backend instances are healthy
- Check Nginx error logs
- Verify upstream configuration

**Cache Not Working**
- Verify Redis connection: `redis-cli ping`
- Check cache service logs
- Verify middleware is applied

## Performance Benchmarks

### Expected Performance
- **Response Time**: < 100ms for cached requests
- **Cache Hit Rate**: > 70% for GET requests
- **Load Distribution**: Even across all instances
- **Uptime**: > 99.9% with health checks

### Monitoring Metrics
- Request latency (p50, p95, p99)
- Cache hit/miss ratio
- Backend instance utilization
- Redis memory usage
- Error rates

## Documentation

All documentation available:
- `LOAD_BALANCING_AND_CACHING.md` - Full implementation details
- `DEPLOYMENT_GUIDE.md` - Step-by-step deployment
- `QUICK_START.md` - Quick start guide
- `IMPLEMENTATION_SUMMARY.md` - Architecture overview
- `nginx/README.md` - Nginx configuration guide

