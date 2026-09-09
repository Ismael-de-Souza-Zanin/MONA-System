#Requires -Version 5.1
<#
.SYNOPSIS
  Sobe o FattoVirtual localmente com Docker (db + api + web).
.DESCRIPTION
  Uso: .\start-local.ps1
  Opções:
    -Rebuild  Força rebuild das imagens
    -Detached Não acompanha logs (padrão: detached)
    -NoOpen   Não abre o navegador
#>
param(
  [switch]$Rebuild,
  [switch]$Follow,
  [switch]$NoOpen
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

function Write-Step($msg) {
  Write-Host ""
  Write-Host "==> $msg" -ForegroundColor Cyan
}

function Assert-Docker {
  try {
    docker info 1>$null 2>$null
  } catch {
    throw "Docker nao esta acessivel. Abra o Docker Desktop e tente novamente."
  }
  if ($LASTEXITCODE -ne 0) {
    throw "Docker nao esta acessivel. Abra o Docker Desktop e tente novamente."
  }
}

Write-Host "FattoVirtual - ambiente local" -ForegroundColor Green
Assert-Docker

if (-not (Test-Path ".env") -and (Test-Path ".env.example")) {
  Write-Step "Criando .env a partir de .env.example"
  Copy-Item ".env.example" ".env"
}

$composeArgs = @("compose", "up", "-d", "--remove-orphans")
if ($Rebuild) { $composeArgs += "--build" }
else { $composeArgs += "--build" } # sempre build na primeira/iteracoes locais

Write-Step "Subindo containers (db, api, web)..."
# Rede órfã com o mesmo nome pode existir após interrupções anteriores
docker network inspect fattovirtual_default 1>$null 2>$null
if ($LASTEXITCODE -ne 0) {
  docker network create fattovirtual_default 1>$null 2>$null
}

& docker @composeArgs
if ($LASTEXITCODE -ne 0) {
  Write-Host "Tentando recuperar de rede/containers órfãos..." -ForegroundColor Yellow
  docker compose down --remove-orphans 1>$null 2>$null
  & docker @composeArgs
}
if ($LASTEXITCODE -ne 0) { throw "Falha ao subir o docker compose. Confirme que o Docker Desktop esta aberto (nao apenas o WSL)." }

Write-Step "Aguardando API ficar pronta..."
$ready = $false
for ($i = 1; $i -le 60; $i++) {
  try {
    $response = Invoke-WebRequest -Uri "http://localhost:5080/api/v1/faqs" -UseBasicParsing -TimeoutSec 3 -ErrorAction SilentlyContinue
    # faqs exige auth; 401/403 tambem indicam API no ar
  } catch {
    $status = $_.Exception.Response.StatusCode.value__
    if ($status -eq 401 -or $status -eq 403) { $ready = $true; break }
  }
  try {
    $tcp = Test-NetConnection -ComputerName localhost -Port 5080 -WarningAction SilentlyContinue
    if ($tcp.TcpTestSucceeded) {
      # porta aberta; tenta login endpoint
      try {
        Invoke-WebRequest -Uri "http://localhost:5080/api/v1/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"x","password":"y"}' -UseBasicParsing -TimeoutSec 3 | Out-Null
      } catch {
        $status = $_.Exception.Response.StatusCode.value__
        if ($status -eq 401 -or $status -eq 400) { $ready = $true; break }
      }
      if ($tcp.TcpTestSucceeded -and $i -gt 8) { $ready = $true; break }
    }
  } catch { }
  Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "Ambiente pronto." -ForegroundColor Green
Write-Host "  App:   http://localhost:5173"
Write-Host "  API:   http://localhost:5080"
Write-Host "  Login: ju@fattovirtual.com / Admin123!"
Write-Host ""
Write-Host "Para parar: .\stop-local.ps1"

if (-not $NoOpen) {
  Start-Process "http://localhost:5173"
}

if ($Follow) {
  Write-Step "Acompanhando logs (Ctrl+C para sair dos logs; containers seguem rodando)"
  docker compose logs -f
}
