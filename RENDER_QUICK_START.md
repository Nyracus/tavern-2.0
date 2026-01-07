# Render Quick Start Guide

## Fastest Deployment Path

### Prerequisites
- ✅ GitHub repository with code
- ✅ MongoDB Atlas account (free tier)
- ✅ Render account (free tier available)

### 5-Minute Deployment

#### Step 1: Prepare MongoDB Atlas

1. Go to [mongodb.com/atlas](https://mongodb.com/atlas) and sign up
2. Create free cluster (M0)
3. Create database user
4. Whitelist IP: `0.0.0.0/0` (or Render IPs)
5. Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/tavern_db`

#### Step 2: Deploy to Render (Blueprint Method)

1. **Push code to GitHub**:
   ```bash
   git add render.yaml package.json gateway.js
   git commit -m "Add Render deployment files"
   git push
   ```

2. **Import Blueprint**:
   - Go to [dashboard.render.com](https://dashboard.render.com)
   - Click "New +" → "Blueprint"
   - Select your repository
   - Click "Apply"

3. **Set Environment Variables**:
   After services are created:
   - Go to each backend service → Environment
   - Add `MONGO_URI`: Your Atlas connection string
   - Add `FRONTEND_URL`: (set after frontend deploys)
   - Add `JWT_SECRET`: (auto-generated, but copy to all backends)

4. **Wait for Deployment**:
   - Services will build and deploy automatically
   - Check status in dashboard
   - View logs if issues

#### Step 3: Update Frontend

1. Go to frontend service → Environment
2. Set `VITE_API_URL` to: `https://tavern-api-gateway.onrender.com/api`
3. Or if using single backend: `https://tavern-backend.onrender.com/api`

#### Step 4: Test

```bash
# Health check
curl https://tavern-api-gateway.onrender.com/api/health

# Or single backend
curl https://tavern-backend.onrender.com/api/health
```

### Alternative: Manual Deployment (More Control)

Use `RENDER_DEPLOYMENT.md` for step-by-step manual setup.

### Common Issues

**"Service won't start"**
- Check logs in Render dashboard
- Verify PORT=10000 (Render requirement)
- Check environment variables are set

**"MongoDB connection failed"**
- Verify connection string format
- Check network access allows Render IPs
- Verify username/password

**"Redis connection failed"**
- Redis should auto-connect via Render service links
- Check Redis service is running
- Verify same region as backends

### Cost Estimate

**Free Tier**:
- 3 Backend Services: Free (750 hrs/month each)
- Redis: Free (25 MB)
- Frontend: Free (unlimited)
- Total: $0/month (with sleep after inactivity)

**Production** (Recommended):
- 3 Backend Services: $7/month each = $21/month
- Redis: $15/month (Starter plan)
- Frontend: Free
- Total: ~$36/month (no sleep, better performance)

### Next Steps

1. Set up custom domain
2. Configure SSL (automatic with custom domain)
3. Set up monitoring alerts
4. Configure backups
5. Enable auto-scaling

For detailed information, see `RENDER_DEPLOYMENT.md`.


