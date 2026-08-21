Write-Host "Starting CyberShield XDR Suite..." -ForegroundColor Green

# Determine current script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $scriptDir) {
    $scriptDir = $PSScriptRoot
}
if (-not $scriptDir) {
    $scriptDir = Get-Location
}

$backendPath = Join-Path $scriptDir "backend"
$frontendPath = Join-Path $scriptDir "frontend"
$pythonExe = Join-Path $backendPath "venv\Scripts\python.exe"

# 1. Start backend service in a new CMD window
Write-Host "[*] Launching Backend API Server (Uvicorn on Port 8000)..." -ForegroundColor Cyan
Start-Process cmd.exe -WorkingDirectory "$backendPath" -ArgumentList "/k", "`"$pythonExe`" -m uvicorn app.main:app --port 8000"

# 2. Start frontend server in a new CMD window
Write-Host "[*] Launching SOC Dashboard Client (Vite on Port 5173)..." -ForegroundColor Cyan
Start-Process cmd.exe -WorkingDirectory "$frontendPath" -ArgumentList "/k", "npm run dev"

Write-Host "[+] Application launched successfully! Portal is opening..." -ForegroundColor Green
Start-Process "http://localhost:5173"
