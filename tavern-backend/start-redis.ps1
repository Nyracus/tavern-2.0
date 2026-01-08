# Start Redis for Windows
# This script helps start Redis for local development

Write-Host "🔍 Checking Redis status..." -ForegroundColor Cyan

# Check if Redis is already running
$redisRunning = Test-NetConnection -ComputerName localhost -Port 6379 -InformationLevel Quiet -WarningAction SilentlyContinue

if ($redisRunning) {
    Write-Host "✅ Redis is already running on port 6379" -ForegroundColor Green
    exit 0
}

Write-Host "⚠️  Redis is not running. Starting Redis..." -ForegroundColor Yellow

# Try Docker first
if (Get-Command docker -ErrorAction SilentlyContinue) {
    Write-Host "🐳 Attempting to start Redis via Docker..." -ForegroundColor Cyan
    try {
        docker run -d --name tavern-redis -p 6379:6379 redis:7-alpine
        Start-Sleep -Seconds 3
        $dockerRunning = Test-NetConnection -ComputerName localhost -Port 6379 -InformationLevel Quiet -WarningAction SilentlyContinue
        if ($dockerRunning) {
            Write-Host "✅ Redis started successfully via Docker!" -ForegroundColor Green
            Write-Host "   Container: tavern-redis" -ForegroundColor Gray
            Write-Host "   Port: 6379" -ForegroundColor Gray
            exit 0
        }
    } catch {
        Write-Host "❌ Failed to start Redis via Docker: $_" -ForegroundColor Red
    }
}

# Try WSL if available
if (Get-Command wsl -ErrorAction SilentlyContinue) {
    Write-Host "🐧 Attempting to start Redis via WSL..." -ForegroundColor Cyan
    try {
        wsl redis-server --daemonize yes
        Start-Sleep -Seconds 2
        $wslRunning = Test-NetConnection -ComputerName localhost -Port 6379 -InformationLevel Quiet -WarningAction SilentlyContinue
        if ($wslRunning) {
            Write-Host "✅ Redis started successfully via WSL!" -ForegroundColor Green
            exit 0
        }
    } catch {
        Write-Host "❌ Failed to start Redis via WSL: $_" -ForegroundColor Red
    }
}

# Manual instructions
Write-Host ""
Write-Host "❌ Could not automatically start Redis." -ForegroundColor Red
Write-Host ""
Write-Host "Please start Redis manually using one of these methods:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Docker (recommended):" -ForegroundColor Cyan
Write-Host "   docker run -d --name tavern-redis -p 6379:6379 redis:7-alpine" -ForegroundColor White
Write-Host ""
Write-Host "2. Docker Compose:" -ForegroundColor Cyan
Write-Host "   docker compose up -d redis" -ForegroundColor White
Write-Host ""
Write-Host "3. Install Redis for Windows:" -ForegroundColor Cyan
Write-Host "   Download from: https://github.com/microsoftarchive/redis/releases" -ForegroundColor White
Write-Host "   Or use WSL: wsl redis-server" -ForegroundColor White
Write-Host ""
Write-Host "4. Use Redis Cloud (free tier):" -ForegroundColor Cyan
Write-Host "   https://redis.com/try-free/" -ForegroundColor White
Write-Host "   Then set REDIS_CONNECTION_STRING in your .env file" -ForegroundColor White
Write-Host ""

exit 1
