# UCU Fleet Management - Complete Application Startup Script
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🚀 UCU Fleet Management System - Complete Setup" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$backendPath = Join-Path $PSScriptRoot "backend"
$frontendPath = $PSScriptRoot

# Step 1: Check backend dependencies
Write-Host "📦 Step 1: Checking backend dependencies..." -ForegroundColor Yellow
Set-Location $backendPath

if (-not (Test-Path "node_modules")) {
    Write-Host "   Installing backend dependencies..." -ForegroundColor Gray
    npm install
} else {
    Write-Host "   ✅ Backend dependencies installed" -ForegroundColor Green
}

# Step 2: Check and create .env files
Write-Host ""
Write-Host "📝 Step 2: Checking configuration files..." -ForegroundColor Yellow

if (-not (Test-Path ".env")) {
    Write-Host "   Creating backend .env file..." -ForegroundColor Gray
    @"
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=ucu_fleet_management
DB_PORT=3306

PORT=5000
NODE_ENV=development

JWT_SECRET=ucu-fleet-management-secret-key-2024-change-in-production
JWT_EXPIRES_IN=7d

FRONTEND_URL=http://localhost:3000
"@ | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "   ✅ Backend .env created" -ForegroundColor Green
} else {
    Write-Host "   ✅ Backend .env exists" -ForegroundColor Green
}

Set-Location $frontendPath

if (-not (Test-Path ".env")) {
    Write-Host "   Creating frontend .env file..." -ForegroundColor Gray
    "VITE_API_URL=http://localhost:5000/api" | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "   ✅ Frontend .env created" -ForegroundColor Green
} else {
    Write-Host "   ✅ Frontend .env exists" -ForegroundColor Green
}

# Step 3: Check MySQL connection
Write-Host ""
Write-Host "🗄️  Step 3: Testing MySQL connection..." -ForegroundColor Yellow
Set-Location $backendPath

Write-Host "   Attempting to initialize database..." -ForegroundColor Gray
$dbResult = & node fix-mysql-access.js 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Database initialized successfully" -ForegroundColor Green
    $dbReady = $true
} else {
    Write-Host "   ⚠️  Database initialization failed" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   MySQL requires a password!" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Please do one of the following:" -ForegroundColor White
    Write-Host ""
    Write-Host "   Option 1: Add MySQL password to backend\.env" -ForegroundColor Cyan
    Write-Host "      Edit: backend\.env" -ForegroundColor Gray
    Write-Host "      Change: DB_PASSWORD=" -ForegroundColor Gray
    Write-Host "      To: DB_PASSWORD=your_mysql_password" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   Option 2: Reset MySQL password to empty" -ForegroundColor Cyan
    Write-Host "      Run in Command Prompt:" -ForegroundColor Gray
    Write-Host "      mysql -u root -p" -ForegroundColor Gray
    Write-Host "      ALTER USER root@localhost IDENTIFIED BY '';" -ForegroundColor Gray
    Write-Host "      FLUSH PRIVILEGES;" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   Then run this script again." -ForegroundColor Yellow
    Write-Host ""
    $dbReady = $false
}

# Step 4: Start Backend Server
Write-Host ""
Write-Host "🚀 Step 4: Starting backend server..." -ForegroundColor Yellow

$backendCommand = @"
cd '$backendPath'
Write-Host '═══════════════════════════════════════════════════════' -ForegroundColor Cyan
Write-Host '🚀 UCU Fleet Management - Backend Server' -ForegroundColor Green
Write-Host '═══════════════════════════════════════════════════════' -ForegroundColor Cyan
Write-Host ''
Write-Host 'Backend running on: http://localhost:5000' -ForegroundColor Green
Write-Host 'Health check: http://localhost:5000/health' -ForegroundColor Cyan
Write-Host 'API base: http://localhost:5000/api' -ForegroundColor Cyan
Write-Host ''
if ($dbReady) {
    Write-Host '✅ Database ready' -ForegroundColor Green
} else {
    Write-Host '⚠️  Database not initialized - check MySQL password' -ForegroundColor Yellow
    Write-Host '   Edit backend\.env and add DB_PASSWORD=your_password' -ForegroundColor Yellow
}
Write-Host ''
Write-Host 'Press Ctrl+C to stop the server' -ForegroundColor Gray
Write-Host ''
npm run dev
"@

Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCommand -WindowStyle Normal
Write-Host "   ✅ Backend server window opened" -ForegroundColor Green

# Step 5: Start Frontend Server
Write-Host ""
Write-Host "🌐 Step 5: Starting frontend server..." -ForegroundColor Yellow

$frontendCommand = @"
cd '$frontendPath'
Write-Host '═══════════════════════════════════════════════════════' -ForegroundColor Cyan
Write-Host '🌐 UCU Fleet Management - Frontend Server' -ForegroundColor Green
Write-Host '═══════════════════════════════════════════════════════' -ForegroundColor Cyan
Write-Host ''
Write-Host 'Frontend running on: http://localhost:3000' -ForegroundColor Green
Write-Host ''
Write-Host 'Press Ctrl+C to stop the server' -ForegroundColor Gray
Write-Host ''
npm run dev
"@

Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCommand -WindowStyle Normal
Write-Host "   ✅ Frontend server window opened" -ForegroundColor Green

# Final Summary
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ Application Setup Complete!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Backend Server:" -ForegroundColor Yellow
Write-Host "   URL: http://localhost:5000" -ForegroundColor White
Write-Host "   Health: http://localhost:5000/health" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Frontend Server:" -ForegroundColor Yellow
Write-Host "   URL: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "🔐 Login Credentials:" -ForegroundColor Yellow
if ($dbReady) {
    Write-Host "   Username: masai" -ForegroundColor White
    Write-Host "   Password: masai123" -ForegroundColor White
} else {
    Write-Host "   ⚠️  Database not initialized - fix MySQL password first" -ForegroundColor Red
}
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
if ($dbReady) {
    Write-Host "   1. Wait for both servers to start" -ForegroundColor White
    Write-Host "   2. Open http://localhost:3000 in your browser" -ForegroundColor White
    Write-Host "   3. Login with masai / masai123" -ForegroundColor White
} else {
    Write-Host "   1. Edit backend\.env and add your MySQL password" -ForegroundColor White
    Write-Host "   2. Run: cd backend; npm run fix-db" -ForegroundColor White
    Write-Host "   3. Restart the backend server" -ForegroundColor White
    Write-Host "   4. Open http://localhost:3000 and login" -ForegroundColor White
}
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

