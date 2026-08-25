# AuthLX Production Deploy (Windows PowerShell)
Write-Host "=== AuthLX Production Deploy ===" -ForegroundColor Cyan

if (-not (Test-Path "./authlx-backend/.env.production")) {
  Write-Host "ERROR: authlx-backend/.env.production missing. Copy from .env.production.example and fill values." -ForegroundColor Red
  exit 1
}
if (-not (Test-Path "./authlx-local/.env.production")) {
  Write-Host "WARN: authlx-local/.env.production missing - using default VITE_API_URL" -ForegroundColor Yellow
}

Write-Host "[1/4] Building images..." -ForegroundColor Green
docker compose build --no-cache
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "[2/4] Starting services..." -ForegroundColor Green
docker compose up -d

Write-Host "[3/4] Waiting for backend health..." -ForegroundColor Green
for ($i=1; $i -le 30; $i++) {
  try {
    $r = Invoke-WebRequest -Uri http://localhost:3000/health -UseBasicParsing -TimeoutSec 2
    if ($r.StatusCode -eq 200) { Write-Host "Backend healthy!" -ForegroundColor Green; break }
  } catch {}
  Write-Host "  waiting... ($i/30)"
  Start-Sleep -Seconds 2
}

Write-Host "[4/4] Status:" -ForegroundColor Green
docker compose ps
try { Invoke-RestMethod http://localhost:3000/health | ConvertTo-Json -Depth 3 } catch { Write-Host "Health check failed - check logs: docker compose logs backend" -ForegroundColor Red }
Write-Host "Frontend: http://localhost:80"
Write-Host "Backend:  http://localhost:3000/health"
Write-Host "=== Deploy complete ===" -ForegroundColor Cyan
