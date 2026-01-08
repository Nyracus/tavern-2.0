# Render Deployment Summary

## Quick Reference

### Files Created

1. **render.yaml** - Full Blueprint with 3 backends + API Gateway + Frontend
2. **render-simplified.yaml** - Simplified version with auto-scaling
3. **render-single-backend.yaml** - Simplest version (1 backend for testing)
4. **gateway.js** - API Gateway/Load Balancer (Node.js proxy)
5. **package.json** - Dependencies for API Gateway
6. **RENDER_DEPLOYMENT.md** - Comprehensive deployment guide
7. **RENDER_QUICK_START.md** - 5-minute deployment guide
8. **RENDER_CHECKLIST.md** - Deployment checklist

### Deployment Options

#### Option 1: Blueprint (Recommended)
- Use `render.yaml` for full deployment
- One-click deploy all services
- Automatic service linking

#### Option 2: Simplified
- Use `render-simplified.yaml`
- Single backend with auto-scaling
- Easier to manage

#### Option 3: Single Backend
- Use `render-single-backend.yaml`
- Good for testing/development
- Minimal setup

### Required Services

1. **Redis** - Managed by Render (free tier: 25 MB)
2. **MongoDB** - Use MongoDB Atlas (free tier: 512 MB)
3. **Backend(s)** - 1-3 instances (free tier: 750 hrs/month each)
4. **API Gateway** - Load balancer (optional, can use single backend)
5. **Frontend** - Static site (unlimited on free tier)

### Environment Variables Checklist

**All Backends:**
- ✅ `MONGO_URI` - MongoDB Atlas connection string
- ✅ `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` - From Render Redis
- ✅ `JWT_SECRET` - Same for all instances (auto-generated)
- ✅ `FRONTEND_URL` - Set after frontend deploys
- ⚠️ `PORT=10000` - Render requirement (already set)

**API Gateway:**
- ✅ `BACKEND_1_URL`, `BACKEND_2_URL`, `BACKEND_3_URL`
- ⚠️ `PORT=10000`

**Frontend:**
- ✅ `VITE_API_URL` - Backend or API Gateway URL

### Quick Deploy Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Add Render deployment files"
   git push
   ```

2. **Deploy Blueprint**
   - Go to [dashboard.render.com](https://dashboard.render.com)
   - New → Blueprint
   - Select repository
   - Apply

3. **Set Environment Variables**
   - MongoDB Atlas connection string
   - Frontend URL (after it deploys)
   - Optional: Supabase, Email settings

4. **Update Frontend**
   - Set `VITE_API_URL` to API Gateway URL

### Important Notes

- **PORT**: Render requires `PORT=10000` (auto-set in configs)
- **MongoDB**: Use MongoDB Atlas (not managed by Render)
- **Redis**: Managed by Render, credentials auto-linked
- **JWT_SECRET**: Must be same across all backends
- **Sleep**: Free tier sleeps after 15 min inactivity
- **HTTPS**: Automatic with Render domains

### URLs After Deployment

- Backend 1: `https://tavern-backend-1.onrender.com`
- Backend 2: `https://tavern-backend-2.onrender.com`
- Backend 3: `https://tavern-backend-3.onrender.com`
- API Gateway: `https://tavern-api-gateway.onrender.com`
- Frontend: `https://tavern-frontend.onrender.com`

### Testing

```bash
# Health check
curl https://tavern-api-gateway.onrender.com/health

# API health
curl https://tavern-api-gateway.onrender.com/api/health

# Test load balancing (if using gateway)
for i in {1..10}; do
  curl -s https://tavern-api-gateway.onrender.com/api/health | jq .instance
done
```

### Troubleshooting

**Service won't start:**
- Check logs in Render dashboard
- Verify PORT=10000
- Check environment variables

**MongoDB connection failed:**
- Verify connection string format
- Check Atlas network access (allow all IPs: 0.0.0.0/0)
- Verify username/password

**Frontend can't connect:**
- Verify `VITE_API_URL` is set correctly
- Check API gateway/backend is running
- Check CORS configuration

### Cost Estimate

**Free Tier:**
- Backends: 750 hrs/month each (sleeps after inactivity)
- Redis: 25 MB free
- Frontend: Unlimited
- Total: $0/month

**Production (Starter Plan):**
- 3 Backends: $7/month each = $21
- Redis: $15/month
- API Gateway: $7/month (optional)
- Frontend: Free
- Total: ~$43/month (no sleep, better performance)

### Documentation

- **RENDER_DEPLOYMENT.md** - Complete step-by-step guide
- **RENDER_QUICK_START.md** - Fast deployment guide
- **RENDER_CHECKLIST.md** - Deployment checklist

### Next Steps

1. Choose deployment option (Blueprint recommended)
2. Set up MongoDB Atlas
3. Deploy via Render Blueprint
4. Configure environment variables
5. Test deployment
6. Set up custom domain (optional)

