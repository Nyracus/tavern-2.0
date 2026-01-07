# Render Free Tier Setup ✅

## All services configured for FREE tier!

### What's Free:
- ✅ **Web Services**: 750 hours/month each (sleeps after 15 min inactivity)
- ✅ **Redis**: 25 MB storage (free tier)
- ✅ **Static Sites**: Unlimited (frontend is always free)
- ✅ **Total Cost**: **$0/month** 🎉

### Free Tier Limitations:
- ⚠️ Services **sleep after 15 minutes** of inactivity
- ⚠️ **No auto-scaling** (scaling configs removed)
- ⚠️ **750 hours/month** per web service (enough for most projects)
- ⚠️ Redis limited to **25 MB** (fine for caching)

### Services in Free Tier:

1. **tavern-redis** - `plan: free` ✅
2. **tavern-backend-1** - `plan: free` ✅
3. **tavern-backend-2** - `plan: free` ✅ (optional, can remove if needed)
4. **tavern-backend-3** - `plan: free` ✅ (optional, can remove if needed)
5. **tavern-api-gateway** - `plan: free` ✅ (optional, can use single backend)
6. **tavern-frontend** - Always free ✅

### Recommended Free Tier Setup:

For maximum free tier usage, use **render-simplified.yaml** or **render-single-backend.yaml**:
- Single backend (750 hours/month)
- Redis (25 MB)
- Frontend (unlimited)

This gives you:
- ✅ Full functionality
- ✅ $0 cost
- ✅ Enough for assignments/demos

### If You Need More:

If you hit the 750 hour limit:
- Use **render-single-backend.yaml** (1 backend instead of 3)
- Remove API gateway, use backend directly
- Or upgrade to Starter ($7/month) if needed

### Sleep Behavior:

Free tier services sleep after 15 minutes of inactivity:
- First request after sleep takes ~30 seconds to wake up
- Subsequent requests are fast
- This is fine for assignments/demos

To prevent sleep (if needed):
- Use a free uptime monitor (UptimeRobot, etc.)
- Pings every 5 minutes to keep services awake
- Still completely free!

## Summary

✅ **All plans set to `free`**
✅ **Scaling removed** (free tier doesn't support it)
✅ **$0/month cost**
✅ **Ready to deploy!**


