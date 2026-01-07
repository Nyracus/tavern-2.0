# Render Deployment - Quick Start

## Choose Your Deployment Method

### 🚀 Option 1: Blueprint (Recommended - Easiest)
**File**: `render.yaml`
- Deploys everything with one click
- 3 backend instances + API Gateway + Frontend
- Automatic service linking
- Best for production

### ⚡ Option 2: Simplified
**File**: `render-simplified.yaml`
- Single backend with auto-scaling
- Easier to manage
- Good for production with less traffic

### 🧪 Option 3: Single Backend (Testing)
**File**: `render-single-backend.yaml`
- One backend instance
- Simplest setup
- Good for initial testing

## Prerequisites

1. ✅ **GitHub Repository** - Code pushed to GitHub
2. ✅ **MongoDB Atlas** - Free cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
3. ✅ **Render Account** - Sign up at [render.com](https://render.com)

## 5-Minute Deployment

### Step 1: MongoDB Atlas Setup (2 minutes)

1. Create account at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create free M0 cluster
3. Create database user (username/password)
4. Network Access → Add IP: `0.0.0.0/0` (allow all)
5. Database → Connect → Copy connection string
6. Format: `mongodb+srv://user:pass@cluster.mongodb.net/tavern_db`

### Step 2: Deploy to Render (3 minutes)

1. **Push Code to GitHub**:
   ```bash
   git add render.yaml package.json gateway.js
   git commit -m "Add Render deployment"
   git push
   ```

2. **Deploy Blueprint**:
   - Go to [dashboard.render.com](https://dashboard.render.com)
   - Click "New +" → "Blueprint"
   - Connect GitHub repository
   - Select repository
   - Click "Apply"
   - Wait for services to be created (2-3 minutes)

3. **Configure Environment Variables**:
   After services are created:
   - Go to each backend service (1, 2, 3)
   - Environment → Add:
     - `MONGO_URI`: Your Atlas connection string
     - `FRONTEND_URL`: `https://tavern-frontend.onrender.com` (update after frontend deploys)
     - Copy `JWT_SECRET` from backend-1 to backend-2 and backend-3

4. **Update Frontend**:
   - Go to frontend service
   - Environment → Set:
     - `VITE_API_URL`: `https://tavern-api-gateway.onrender.com/api`
   - Redeploy frontend (or wait for auto-deploy)

### Step 3: Test (1 minute)

```bash
# Check health
curl https://tavern-api-gateway.onrender.com/health

# Test API
curl https://tavern-api-gateway.onrender.com/api/health

# Visit frontend
open https://tavern-frontend.onrender.com
```

## Architecture

```
                    ┌─────────────────┐
                    │  Render DNS     │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  API Gateway    │  ← Load Balancer
                    │  (gateway.js)   │
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

## Environment Variables

### Backend Services (All 3)

```env
NODE_ENV=production
PORT=10000
INSTANCE_ID=backend-1  # Unique per instance
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/tavern_db
REDIS_CONNECTION_STRING=<auto from Render>
JWT_SECRET=<same for all - copy from backend-1>
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://tavern-frontend.onrender.com
```

### API Gateway

```env
BACKEND_1_URL=<auto from service>
BACKEND_2_URL=<auto from service>
BACKEND_3_URL=<auto from service>
PORT=10000
```

### Frontend

```env
VITE_API_URL=https://tavern-api-gateway.onrender.com/api
```

## Services Created

1. **tavern-redis** - Redis cache (Render managed)
2. **tavern-backend-1** - Backend instance 1
3. **tavern-backend-2** - Backend instance 2
4. **tavern-backend-3** - Backend instance 3
5. **tavern-api-gateway** - Load balancer/proxy
6. **tavern-frontend** - Frontend static site

## Important Notes

⚠️ **PORT**: Render requires `PORT=10000` (already configured)

⚠️ **JWT_SECRET**: Must be identical across all backends (copy from backend-1)

⚠️ **MongoDB**: Use MongoDB Atlas (Render doesn't provide MongoDB)

⚠️ **Redis**: Managed by Render, credentials auto-linked

⚠️ **Sleep**: Free tier sleeps after 15 min inactivity (paid plans don't sleep)

✅ **HTTPS**: Automatic with Render domains

✅ **Auto-Deploy**: Automatic on git push

## Troubleshooting

**Service won't start?**
- Check logs in Render dashboard
- Verify `PORT=10000`
- Check environment variables

**MongoDB connection failed?**
- Verify connection string format
- Check Atlas network access allows all IPs
- Verify username/password

**Frontend can't connect?**
- Check `VITE_API_URL` is set correctly
- Verify API gateway is running
- Check CORS (should be automatic)

## Cost

**Free Tier:**
- Backends: 750 hrs/month each (with sleep)
- Redis: 25 MB free
- Frontend: Unlimited
- **Total: $0/month**

**Production (Recommended):**
- 3 Backends: $7/month each = $21
- Redis: $15/month
- API Gateway: $7/month
- Frontend: Free
- **Total: ~$43/month** (no sleep, better performance)

## Documentation

- **RENDER_DEPLOYMENT.md** - Complete guide
- **RENDER_QUICK_START.md** - Fast deployment
- **RENDER_CHECKLIST.md** - Deployment checklist
- **RENDER_DEPLOYMENT_SUMMARY.md** - Quick reference

## Support

- Render Docs: [render.com/docs](https://render.com/docs)
- MongoDB Atlas: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)

