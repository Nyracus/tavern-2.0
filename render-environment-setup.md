# Render Environment Variables Setup

## Quick Setup Guide

After deploying via Render Blueprint, you need to set these environment variables manually.

## Backend Services (tavern-backend-1, tavern-backend-2, tavern-backend-3)

Go to each backend service → **Environment** tab → Add these:

### Required Variables

```env
# Database (MongoDB Atlas)
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/tavern_db?retryWrites=true&w=majority

# Redis (Auto-configured by Render via service links)
# REDIS_CONNECTION_STRING - Auto-set from Render Redis service (includes password)
# Note: Render provides connectionString which includes host, port, and password

# JWT (IMPORTANT: Same secret for all backends!)
# 1. Copy JWT_SECRET from tavern-backend-1
# 2. Paste it into tavern-backend-2 and tavern-backend-3
# Or generate manually: Use a 32+ character random string

# Frontend URL (Set after frontend deploys)
FRONTEND_URL=https://tavern-frontend.onrender.com
```

### Optional Variables

```env
# Supabase (if using logo uploads)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Email Service (if using email verification)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=your-email@gmail.com
FROM_NAME=Tavern Quest Platform

# Rate Limiting (optional, defaults are fine)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=2000
```

### Already Set (Don't Change)

```env
NODE_ENV=production
PORT=10000
INSTANCE_ID=backend-1  # Unique per instance (backend-1, backend-2, backend-3)
REDIS_DB=0
JWT_EXPIRES_IN=7d
```

## API Gateway (tavern-api-gateway)

✅ **Auto-configured** - Backend URLs are automatically linked from services

Only need to add if something is missing:
```env
PORT=10000
```

## Frontend (tavern-frontend)

### Required

```env
VITE_API_URL=https://tavern-api-gateway.onrender.com/api
```

Or if using single backend:
```env
VITE_API_URL=https://tavern-backend.onrender.com/api
```

## MongoDB Atlas Connection String Format

1. Go to MongoDB Atlas → Database → Connect
2. Choose "Connect your application"
3. Copy connection string
4. Format:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/tavern_db?retryWrites=true&w=majority
   ```
5. Replace:
   - `username` with your database username
   - `password` with your database password (URL-encoded if special chars)
   - `cluster` with your cluster name
   - `tavern_db` with your database name (optional, can be anything)

### Example:
```
MONGO_URI=mongodb+srv://tavernuser:MyP@ss123@cluster0.abc123.mongodb.net/tavern_db?retryWrites=true&w=majority
```

## Step-by-Step Setup

### 1. After Blueprint Deploys

1. Go to Render Dashboard
2. You'll see all services created
3. Wait for all services to finish initial deployment (can take 5-10 minutes)

### 2. Set MongoDB URI

For **each backend** (1, 2, 3):
1. Click service name
2. Go to **Environment** tab
3. Click **"Add Environment Variable"**
4. Key: `MONGO_URI`
5. Value: Your MongoDB Atlas connection string
6. Click **"Save Changes"**
7. Service will auto-redeploy

### 3. Sync JWT_SECRET

1. Go to **tavern-backend-1** → Environment
2. Find `JWT_SECRET` (should be auto-generated)
3. Copy the value
4. Go to **tavern-backend-2** → Environment
5. If `JWT_SECRET` exists but is different, update it to match backend-1
6. Do the same for **tavern-backend-3**
7. All backends must have the **same** JWT_SECRET

### 4. Set Frontend URL

For **each backend** (after frontend deploys):
1. Go to Environment tab
2. Add or update: `FRONTEND_URL`
3. Value: `https://tavern-frontend.onrender.com`
4. Save

### 5. Update Frontend API URL

1. Go to **tavern-frontend** → Environment
2. Add or update: `VITE_API_URL`
3. Value: `https://tavern-api-gateway.onrender.com/api`
4. Save and redeploy (or wait for auto-deploy)

## Verification

After setting variables:

1. **Check Backend Health**:
   ```bash
   curl https://tavern-backend-1.onrender.com/api/health
   ```

2. **Check API Gateway**:
   ```bash
   curl https://tavern-api-gateway.onrender.com/health
   curl https://tavern-api-gateway.onrender.com/api/health
   ```

3. **Check Frontend**:
   - Visit: `https://tavern-frontend.onrender.com`
   - Try logging in
   - Check browser console for API connection

## Common Issues

### "JWT verification failed"
- ✅ Ensure all backends have the **same** JWT_SECRET
- ✅ Copy from backend-1 to others

### "MongoDB connection failed"
- ✅ Check connection string format
- ✅ Verify username/password in Atlas
- ✅ Check network access allows all IPs (0.0.0.0/0)

### "Redis connection failed"
- ✅ Should be auto-configured
- ✅ Verify Redis service is running
- ✅ Check service links in Render

### "Frontend can't connect to API"
- ✅ Verify `VITE_API_URL` is correct
- ✅ Check API gateway is running
- ✅ Ensure URL includes `/api` at the end

## Environment Variable Reference Table

| Variable | Backend 1 | Backend 2 | Backend 3 | API Gateway | Frontend |
|----------|-----------|-----------|-----------|-------------|----------|
| MONGO_URI | ✅ Set | ✅ Set | ✅ Set | ❌ | ❌ |
| REDIS_CONNECTION_STRING | ✅ Auto | ✅ Auto | ✅ Auto | ❌ | ❌ |
| JWT_SECRET | ✅ Set | ✅ Same | ✅ Same | ❌ | ❌ |
| INSTANCE_ID | backend-1 | backend-2 | backend-3 | ❌ | ❌ |
| FRONTEND_URL | ✅ Set | ✅ Set | ✅ Set | ❌ | ❌ |
| BACKEND_1_URL | ❌ | ❌ | ❌ | ✅ Auto | ❌ |
| BACKEND_2_URL | ❌ | ❌ | ❌ | ✅ Auto | ❌ |
| BACKEND_3_URL | ❌ | ❌ | ❌ | ✅ Auto | ❌ |
| VITE_API_URL | ❌ | ❌ | ❌ | ❌ | ✅ Set |

✅ = Required  
✅ Auto = Automatically set by Render  
❌ = Not needed

