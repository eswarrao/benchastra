# BenchAstra - Start All Services
# Double-click "START HERE.bat" to run this

$ROOT     = "C:\Users\eswaraba\Downloads\job-talent-marketplace-main (1)\job-talent-marketplace-main"
$BACKEND  = "$ROOT\backend"
$FRONTEND = "$ROOT\frontend"
$UVICORN  = "$BACKEND\benchbridge\Scripts\uvicorn.exe"
$SSH_KEY  = "$env:USERPROFILE\.ssh\serveo_benchastra"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   BenchAstra - Starting Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ── Kill any old instances ────────────────────────────────────────────────────
Write-Host "Cleaning up old processes..." -ForegroundColor DarkGray

# Kill processes on port 8000 (backend)
$old8000 = netstat -ano | Select-String ":8000 " | ForEach-Object { ($_ -split '\s+')[-1] } | Select-Object -Unique
foreach ($procId in $old8000) {
    if ($procId -match '^\d+$' -and $procId -ne '0') {
        Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
    }
}

# Kill processes on port 5173 (frontend)
$old5173 = netstat -ano | Select-String ":5173 " | ForEach-Object { ($_ -split '\s+')[-1] } | Select-Object -Unique
foreach ($procId in $old5173) {
    if ($procId -match '^\d+$' -and $procId -ne '0') {
        Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
    }
}

# Kill old SSH tunnel
Get-Process ssh -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Start-Sleep -Seconds 2

# ── 1. Backend ────────────────────────────────────────────────────────────────
Write-Host "[1/3] Starting Backend (FastAPI on port 8000)..." -ForegroundColor Yellow

Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
`$host.UI.RawUI.WindowTitle = 'BenchAstra - BACKEND (port 8000)'
Set-Location '$BACKEND'
`$env:PYTHONPATH = '$BACKEND'
Write-Host '=== BACKEND RUNNING ===' -ForegroundColor Green
& '$UVICORN' app.main:app --host 0.0.0.0 --port 8000 --reload
"@ -WindowStyle Normal

Start-Sleep -Seconds 4

# ── 2. Frontend ───────────────────────────────────────────────────────────────
Write-Host "[2/3] Starting Frontend (Vite on port 5173)..." -ForegroundColor Yellow

Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
`$host.UI.RawUI.WindowTitle = 'BenchAstra - FRONTEND (port 5173)'
Set-Location '$FRONTEND'
Write-Host '=== FRONTEND RUNNING ===' -ForegroundColor Green
npm run dev
"@ -WindowStyle Normal

Start-Sleep -Seconds 6

# ── 3. Public Tunnel ─────────────────────────────────────────────────────────
Write-Host "[3/3] Starting Public Tunnel..." -ForegroundColor Yellow

if (Test-Path $SSH_KEY) {
    $tunnelCmd = "ssh -i '$SSH_KEY' -o StrictHostKeyChecking=no -o ServerAliveInterval=30 -o ServerAliveCountMax=3 -R benchastra:80:localhost:5173 serveo.net"
} else {
    $tunnelCmd = "ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=30 -o ServerAliveCountMax=3 -R 80:localhost:5173 serveo.net"
}

Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
`$host.UI.RawUI.WindowTitle = 'BenchAstra - TUNNEL (public URL)'
Write-Host '=== PUBLIC TUNNEL ===' -ForegroundColor Cyan
Write-Host 'Your public URL will appear on the next line:' -ForegroundColor Yellow
$tunnelCmd
"@ -WindowStyle Normal

# ── Status ────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   All 3 services launched!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Local:   http://localhost:5173" -ForegroundColor White
Write-Host "  LAN:     http://192.168.0.105:5173" -ForegroundColor White
Write-Host "  Public:  Look at the TUNNEL window (titled 'BenchAstra - TUNNEL')" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Logins:" -ForegroundColor Gray
Write-Host "    Client  ->  client@test.com  /  BenchAstra@2025" -ForegroundColor Gray
Write-Host "    Vendor  ->  vendor@test.com  /  BenchAstra@2025" -ForegroundColor Gray
Write-Host "    Admin   ->  admin@test.com   /  BenchAstra@2025" -ForegroundColor Gray
Write-Host ""
Write-Host "  To STOP everything: close the 3 terminal windows" -ForegroundColor DarkGray
Write-Host ""
Write-Host "This window will close in 15 seconds..." -ForegroundColor DarkGray
Start-Sleep -Seconds 15
