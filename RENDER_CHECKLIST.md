# Render Deployment Checklist

## Pre-Deployment

- [ ] Code pushed to GitHub
- [ ] MongoDB Atlas cluster created
- [ ] MongoDB database user created
- [ ] MongoDB network access configured (0.0.0.0/0 or Render IPs)
- [ ] MongoDB connection string ready
- [ ] Render account created
- [ ] GitHub connected to Render

## Deployment

### Services Setup
- [ ] Redis service created (or via blueprint)
- [ ] Backend service 1 created (or via blueprint)
- [ ] Backend service 2 created (or via blueprint)
- [ ] Backend service 3 created (or via blueprint)
- [ ] API Gateway created (or via blueprint)
- [ ] Frontend service created (or via blueprint)

### Environment Variables

#### Redis (Auto-configured in blueprint)
- [ ] Verify Redis host, port, password are set automatically

#### All Backend Services
- [ ] `NODE_ENV=production`
- [ ] `PORT=10000`
- [ ] `INSTANCE_ID=backend-1` (unique per instance)
- [ ] `MONGO_URI` (MongoDB Atlas connection string)
- [ ] `REDIS_HOST` (from Redis service)
- [ ] `REDIS_PORT` (from Redis service)
- [ ] `REDIS_PASSWORD` (from Redis service)
- [ ] `JWT_SECRET` (same for all backends)
- [ ] `JWT_EXPIRES_IN=7d`
- [ ] `FRONTEND_URL` (set after frontend deploys)
- [ ] `SUPABASE_URL` (if using)
- [ ] `SUPABASE_ANON_KEY` (if using)
- [ ] `SMTP_*` (if using email)

#### API Gateway
- [ ] `BACKEND_1_URL` (backend 1 URL)
- [ ] `BACKEND_2_URL` (backend 2 URL)
- [ ] `BACKEND_3_URL` (backend 3 URL)
- [ ] `PORT=10000`

#### Frontend
- [ ] `VITE_API_URL` (API gateway URL or single backend URL)

## Post-Deployment Verification

- [ ] All services show "Live" status
- [ ] Redis service accessible
- [ ] Backend 1 health check: `/api/health/live`
- [ ] Backend 2 health check: `/api/health/live`
- [ ] Backend 3 health check: `/api/health/live`
- [ ] API Gateway health check: `/health`
- [ ] API Gateway routes to backends: `/api/health`
- [ ] Frontend loads successfully
- [ ] Frontend can connect to API
- [ ] Load balancing works (requests distributed)
- [ ] Caching works (check cache headers)
- [ ] Authentication works
- [ ] Database connections working

## Testing

- [ ] Health endpoints respond correctly
- [ ] Load balancing distributes requests
- [ ] Cache hit/miss working
- [ ] API responses correct
- [ ] Frontend functionality works
- [ ] User registration works
- [ ] User login works
- [ ] Protected routes work
- [ ] File uploads work (if using)

## Security

- [ ] Strong JWT_SECRET set (32+ characters)
- [ ] MongoDB password strong
- [ ] Redis password set (auto by Render)
- [ ] Environment variables not in code
- [ ] HTTPS enabled (automatic with Render)
- [ ] CORS configured correctly
- [ ] Rate limiting enabled

## Monitoring

- [ ] Service logs accessible
- [ ] Health checks configured
- [ ] Metrics visible in dashboard
- [ ] Error alerts configured (optional)
- [ ] Uptime monitoring set up (optional)

## Optimization

- [ ] Auto-scaling configured (if needed)
- [ ] Resource limits appropriate
- [ ] Cache TTLs tuned
- [ ] Database indexes optimized
- [ ] CDN enabled for frontend (Render automatic)

## Documentation

- [ ] Deployment process documented
- [ ] Environment variables documented
- [ ] Troubleshooting guide available
- [ ] Team members have access
- [ ] Backup procedures documented

## Production Readiness

- [ ] Custom domain configured (optional)
- [ ] SSL certificate active (automatic)
- [ ] Backups configured (MongoDB Atlas)
- [ ] Monitoring set up
- [ ] Scaling strategy defined
- [ ] Disaster recovery plan
- [ ] Cost estimates reviewed
- [ ] Team access configured

