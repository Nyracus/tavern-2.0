# Nginx Configuration

This directory contains the Nginx load balancer configuration for the Tavern platform.

## Files

- `nginx.conf` - Main Nginx configuration with load balancing and caching

## Setup

### Docker Compose (Recommended)

The configuration is automatically mounted when using `docker-compose.yml`.

### Manual Setup

1. Copy configuration:
```bash
sudo cp nginx/nginx.conf /etc/nginx/nginx.conf
```

2. Create cache and log directories:
```bash
sudo mkdir -p /var/cache/nginx
sudo mkdir -p /var/log/nginx
sudo chown -R nginx:nginx /var/cache/nginx /var/log/nginx
```

3. Test configuration:
```bash
sudo nginx -t
```

4. Start/Reload Nginx:
```bash
sudo systemctl start nginx
# or
sudo systemctl reload nginx
```

## Configuration Details

### Load Balancing
- **Method**: Least Connections
- **Backend Instances**: 3 (configurable)
- **Health Checks**: Automatic failover
- **Connection Pooling**: 32 keep-alive connections

### Caching
- **Cache Zone**: `api_cache` (10MB, 1GB max)
- **TTL**: 5 minutes for 200/302, 1 minute for 404
- **Stale Serving**: Enabled during backend errors
- **Cache Key**: Includes method, host, and URI

### Rate Limiting
- **API Endpoints**: 100 req/s with 20 burst
- **Auth Endpoints**: 10 req/s with 5 burst

## Monitoring

View cache status in response headers:
- `X-Cache-Status`: HIT, MISS, BYPASS, STALE
- `X-Backend-Server`: Which backend served the request

View logs:
```bash
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```


