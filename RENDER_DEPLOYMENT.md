# Render Deployment Guide

This guide covers deploying the Tavern platform to Render with load balancing and caching.

## Overview

Render provides:
- **Web Services**: For backend instances (Docker or Node.js)
- **Redis**: Managed Redis cache
- **Static Sites**: For frontend
- **Environment Variables**: Secure configuration

## Architecture on Render

```
                    ┌─────────────────┐
                    │  Render DNS     │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  API Gateway    │
                    │  (Load Balancer)│
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼────┐      ┌───────▼──────┐      ┌───────▼──────┐
   │Backend 1│      │  Backend 2   │      │  Backend 3   │
   └────┬────┘      └───────┬──────┘      └───────┬──────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼────┐      ┌───────▼──────┐
   │ MongoDB │      │    Redis     │
   │ (Atlas) │      │   (Render)   │
   └─────────┘      └──────────────┘
```

## Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **MongoDB Atlas**: Create a free cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
3. **GitHub Repository**: Push your code to GitHub
4. **Environment Variables**: Prepare secrets and configuration

## Step-by-Step Deployment

### Option 1: Blueprint Deployment (Recommended)

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Add Render deployment configuration"
   git push origin main
   ```

2. **Deploy via Render Blueprint**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Select the repository
   - Render will detect `render.yaml`
   - Click "Apply"

3. **Configure Environment Variables**
   After services are created, set these in each backend service:
   - `MONGO_URI`: Your MongoDB Atlas connection string
   - `FRONTEND_URL`: Your frontend URL (e.g., `https://tavern-frontend.onrender.com`)
   - `SUPABASE_URL`: If using Supabase
   - `SUPABASE_ANON_KEY`: If using Supabase
   - `SMTP_*`: Email service credentials (if using)

4. **Update Frontend API URL**
   - In the frontend service, set `VITE_API_URL` to your API gateway URL
   - Or update it in the frontend build

### Option 2: Manual Service Creation

#### 1. Create Redis Service

1. Go to Render Dashboard
2. Click "New +" → "Redis"
3. Configure:
   - **Name**: `tavern-redis`
   - **Plan**: Free (or Starter for production)
   - **Region**: Choose closest to you
4. Click "Create Redis"
5. Note the connection details (host, port, password)

#### 2. Create Backend Services

For each backend instance (1, 2, 3):

1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `tavern-backend-1` (or 2, 3)
   - **Environment**: Docker
   - **Dockerfile Path**: `tavern-backend/Dockerfile`
   - **Docker Context**: `tavern-backend`
   - **Plan**: Starter (512 MB RAM)
   - **Region**: Same region as Redis
   - **Branch**: `main` (or your branch)
   - **Root Directory**: Leave empty
   - **Build Command**: (Auto-detected from Dockerfile)
   - **Start Command**: (Auto-detected from Dockerfile)
   - **Health Check Path**: `/api/health/live`

4. **Environment Variables**:
   ```env
   NODE_ENV=production
   PORT=10000
   INSTANCE_ID=backend-1  # Change for each instance
   MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/tavern_db
   REDIS_HOST=<from Redis service>
   REDIS_PORT=<from Redis service>
   REDIS_PASSWORD=<from Redis service>
   REDIS_DB=0
   JWT_SECRET=<generate secure random string>
   JWT_EXPIRES_IN=7d
   FRONTEND_URL=https://tavern-frontend.onrender.com
   SUPABASE_URL=<if using>
   SUPABASE_ANON_KEY=<if using>
   SMTP_HOST=<if using email>
   SMTP_PORT=587
   SMTP_USER=<if using email>
   SMTP_PASS=<if using email>
   FROM_EMAIL=<if using email>
   FROM_NAME=Tavern Quest Platform
   ```

5. Click "Create Web Service"

**Important**: Use the same `JWT_SECRET` for all backend instances!

#### 3. Create API Gateway (Load Balancer)

1. Click "New +" → "Web Service"
2. Select "Deploy from existing repository" or create new
3. Configure:
   - **Name**: `tavern-api-gateway`
   - **Environment**: Node
   - **Root Directory**: `/` (root of repo)
   - **Build Command**: `npm install`
   - **Start Command**: `node gateway.js`
   - **Plan**: Starter
   - **Region**: Same as backends

4. **Environment Variables**:
   ```env
   BACKEND_1_URL=https://tavern-backend-1.onrender.com
   BACKEND_2_URL=https://tavern-backend-2.onrender.com
   BACKEND_3_URL=https://tavern-backend-3.onrender.com
   PORT=10000
   ```

5. Click "Create Web Service"

#### 4. Create Frontend Service

1. Click "New +" → "Static Site"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `tavern-frontend`
   - **Build Command**: `cd tavern-frontend && npm install && npm run build`
   - **Publish Directory**: `tavern-frontend/dist`
   - **Environment**: Node

4. **Environment Variables**:
   ```env
   VITE_API_URL=https://tavern-api-gateway.onrender.com/api
   ```

5. Click "Create Static Site"

#### 5. Update Frontend Service (If using Web Service)

If you need server-side features:

1. Click "New +" → "Web Service"
2. Configure:
   - **Name**: `tavern-frontend`
   - **Environment**: Node
   - **Root Directory**: `tavern-frontend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run preview` (or serve dist/)
   - **Plan**: Starter

3. Add environment variable:
   ```env
   VITE_API_URL=https://tavern-api-gateway.onrender.com/api
   ```

## MongoDB Atlas Setup

1. **Create Account**: [mongodb.com/atlas](https://mongodb.com/atlas)

2. **Create Cluster**:
   - Choose free tier (M0)
   - Select region closest to your Render services
   - Click "Create Cluster"

3. **Configure Database Access**:
   - Go to "Database Access"
   - Add new database user
   - Save username and password

4. **Configure Network Access**:
   - Go to "Network Access"
   - Add IP address: `0.0.0.0/0` (allow all, or restrict to Render IPs)
   - Click "Confirm"

5. **Get Connection String**:
   - Go to "Database" → "Connect"
   - Choose "Connect your application"
   - Copy connection string
   - Replace `<password>` with your password
   - Format: `mongodb+srv://username:password@cluster.mongodb.net/tavern_db?retryWrites=true&w=majority`

6. **Set in Render**: Use this as `MONGO_URI` environment variable

## Environment Variables Reference

### Required for All Backends
```env
NODE_ENV=production
PORT=10000
INSTANCE_ID=backend-1  # Unique per instance
MONGO_URI=mongodb+srv://...
REDIS_HOST=<from Render Redis>
REDIS_PORT=<from Render Redis>
REDIS_PASSWORD=<from Render Redis>
JWT_SECRET=<same for all instances>
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://tavern-frontend.onrender.com
```

### Optional
```env
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
FROM_EMAIL=...
FROM_NAME=Tavern Quest Platform
```

## Post-Deployment

### 1. Verify Services

Check health endpoints:
```bash
# API Gateway
curl https://tavern-api-gateway.onrender.com/health

# Backend instances
curl https://tavern-backend-1.onrender.com/api/health
curl https://tavern-backend-2.onrender.com/api/health
curl https://tavern-backend-3.onrender.com/api/health

# Frontend
curl https://tavern-frontend.onrender.com
```

### 2. Update Frontend API URL

After deployment, update the frontend to use the API gateway:
- Go to frontend service settings
- Update `VITE_API_URL` to API gateway URL
- Redeploy frontend

Or update in code:
```typescript
// tavern-frontend/src/lib/api.ts
const BASE = import.meta.env.VITE_API_URL || 'https://tavern-api-gateway.onrender.com/api';
```

### 3. Test Load Balancing

Make multiple requests and verify they're distributed:
```bash
for i in {1..10}; do
  curl -s https://tavern-api-gateway.onrender.com/api/health | jq .instance
done
```

### 4. Test Caching

```bash
# First request (MISS)
curl -v https://tavern-api-gateway.onrender.com/api/leaderboard/adventurers

# Second request (should be HIT in backend cache)
curl -v https://tavern-api-gateway.onrender.com/api/leaderboard/adventurers
```

## Custom Domain Setup

### API Gateway
1. Go to API Gateway service → Settings → Custom Domains
2. Add your domain (e.g., `api.yourdomain.com`)
3. Follow DNS configuration instructions
4. Render provides SSL automatically

### Frontend
1. Go to Frontend service → Settings → Custom Domains
2. Add your domain (e.g., `yourdomain.com`)
3. Configure DNS
4. SSL auto-configured

## Scaling

### Horizontal Scaling
Render allows auto-scaling:
1. Go to service → Settings → Scaling
2. Enable "Auto-Deploy"
3. Set min/max instances
4. Configure metrics (CPU, Memory, Response Time)

### Vertical Scaling
1. Go to service → Settings → Plan
2. Upgrade to higher tier (Standard, Pro)
3. More RAM and CPU available

## Monitoring

### Render Dashboard
- View logs in real-time
- Monitor metrics (CPU, Memory, Requests)
- View deployment history
- Check health status

### Health Checks
- Render automatically checks health endpoints
- Services are marked unhealthy if health checks fail
- Auto-restart on failure

## Troubleshooting

### Service Won't Start
- Check logs in Render Dashboard
- Verify environment variables
- Check Dockerfile is correct
- Verify PORT is set to 10000 (Render requirement)

### Redis Connection Issues
- Verify Redis service is running
- Check environment variables match Redis service
- Verify network access (should be automatic in same region)

### MongoDB Connection Issues
- Verify MongoDB Atlas cluster is running
- Check network access allows Render IPs
- Verify connection string format
- Check database user credentials

### API Gateway Not Routing
- Verify backend URLs are correct
- Check backend services are healthy
- Verify environment variables in gateway
- Check gateway logs

### Frontend Can't Connect to API
- Verify `VITE_API_URL` is set correctly
- Check API gateway is accessible
- Verify CORS is configured (should be automatic)
- Check browser console for errors

## Cost Optimization

### Free Tier Limits
- **Web Services**: 750 hours/month (free tier)
- **Redis**: 25 MB storage (free tier)
- **Static Sites**: Unlimited
- **Sleep after inactivity**: 15 minutes (free tier only)

### Production Recommendations
- **Backend Services**: Upgrade to Starter ($7/month each)
- **Redis**: Upgrade to Starter ($15/month) for production
- **No sleep**: Paid plans don't sleep

## Security Best Practices

1. **Environment Variables**: Never commit secrets
2. **MongoDB**: Use strong passwords, restrict IP access
3. **Redis**: Use password authentication (automatic in Render)
4. **JWT**: Use strong, random JWT_SECRET (different from dev)
5. **HTTPS**: Render provides SSL automatically
6. **CORS**: Configure properly for your frontend domain

## CI/CD

Render supports automatic deployments:
1. Push to GitHub
2. Render detects changes
3. Builds and deploys automatically
4. Rollback available from dashboard

To disable auto-deploy:
1. Go to service → Settings
2. Uncheck "Auto-Deploy"
3. Deploy manually when needed

## Backup and Recovery

### MongoDB
- MongoDB Atlas provides automated backups
- Configure backup policy in Atlas dashboard
- Point-in-time recovery available

### Redis
- Render Redis has persistence enabled
- Consider manual backups for critical data
- Export data: `redis-cli --rdb dump.rdb`

### Application
- Code is in GitHub (source of truth)
- Environment variables saved in Render
- Database backups in MongoDB Atlas

## Support

- **Render Docs**: [render.com/docs](https://render.com/docs)
- **Render Support**: [render.com/support](https://render.com/support)
- **MongoDB Atlas Docs**: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)

## Next Steps

1. Deploy services following this guide
2. Configure custom domains
3. Set up monitoring alerts
4. Configure backups
5. Enable auto-scaling for production traffic
6. Set up staging environment (optional)

