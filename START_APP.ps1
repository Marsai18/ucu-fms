# UCU Fleet Management - Simple Startup Script
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "UCU Fleet Management System Startup" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$backendPath = Join-Path $PSScriptRoot "backend"
Set-Location $backendPath

# Check dependencies
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    npm install
}

# Check .env
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    "DB_HOST=localhost`nDB_USER=root`nDB_PASSWORD=`nDB_NAME=ucu_fleet_management`nDB_PORT=3306`n`nPORT=5000`nNODE_ENV=development`n`nJWT_SECRET=ucu-fleet-management-secret-key-2024`nJWT_EXPIRES_IN=7d`n`nFRONTEND_URL=http://localhost:3000" | Out-File -FilePath ".env" -Encoding UTF8
}

# Try to initialize database
Write-Host "Initializing database..." -ForegroundColor Yellow
$null = & node fix-mysql-access.js 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "Database ready!" -ForegroundColor Green
} else {
    Write-Host "Database initialization failed - MySQL password required" -ForegroundColor Yellow
    Write-Host "Please edit backend\.env and add: DB_PASSWORD=your_password" -ForegroundColor Yellow
}

# Start backend
Write-Host ""
Write-Host "Starting backend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host 'Backend Server - Port 5000' -ForegroundColor Green; npm run dev" -WindowStyle Normal

# Start frontend
Set-Location $PSScriptRoot
Write-Host "Starting frontend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; Write-Host 'Frontend Server - Port 3000' -ForegroundColor Green; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Servers Starting!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend: http://localhost:5000" -ForegroundColor White
Write-Host "Frontend: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Login: masai / masai123" -ForegroundColor White
Write-Host ""


