#Requires -Version 5.1
<#
.SYNOPSIS
  Sobe API + Postgres (Docker) e abre o FattoVirtual desktop para demonstração completa.

.DESCRIPTION
  Procura a raiz do repositório (onde está docker-compose.desktop.yml),
  sobe db+api na porta 5080, aguarda a API responder e inicia o .exe
  (portable, setup unpacked ou Electron em modo pack).
#>
param(
  [switch]$NoLaunch,
  [switch]$Rebuild,
  [string]$ApiBase = "http://localhost:5080/api/v1"
)

$ErrorActionPreference = "Stop"

function Find-RepoRoot {
  $dir = $PSScriptRoot
  for ($i = 0; $i -lt 8; $i++) {
    if (Test-Path (Join-Path $dir "docker-compose.desktop.yml")) { return $dir }
    if (Test-Path (Join-Path $dir "docker-compose.yml")) { return $dir }
    $parent = Split-Path $dir -Parent
    if (-not $parent -or $parent -eq $dir) { break }
    $dir = $parent
  }
  throw "Não achei a raiz do FattoVirtual (docker-compose.desktop.yml). Rode a partir do clone do projeto."
}

function Assert-Docker {
  if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw @"
Docker não encontrado no PATH.
Instale Docker Desktop para Windows, inicie-o e rode este script de novo.
https://www.docker.com/products/docker-desktop/
"@
  }
  docker info 1>$null 2>$null
  if ($LASTEXITCODE -ne 0) {
    throw "Docker instalado, mas o daemon não está rodando. Abra o Docker Desktop e aguarde ficar 'Running'."
  }
}

function Wait-ApiReady {
  param([string]$Url, [int]$TimeoutSec = 120)
  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  Write-Host "Aguardando API em $Url ..." -ForegroundColor Cyan
  while ((Get-Date) -lt $deadline) {
    try {
      # login com credencial inválida ainda prova que a API está no ar (não 404 de proxy)
      $null = Invoke-WebRequest -Uri "$Url/auth/login" -Method POST `
        -ContentType "application/json" `
        -Body '{"email":"ping@local","password":"x"}' `
        -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
      return
    } catch {
      $code = $_.Exception.Response.StatusCode.value__
      if ($code -eq 401 -or $code -eq 400 -or $code -eq 422) { return }
    }
    Start-Sleep -Seconds 2
  }
  throw "Timeout: API não respondeu em $TimeoutSec s. Veja: docker compose -f docker-compose.desktop.yml logs api"
}

function Find-DesktopExe {
  # Funciona em desktop/demo e em desktop/release/demo (kit empacotado)
  $searchDirs = @(
    (Join-Path $PSScriptRoot "..\release"),
    (Join-Path $PSScriptRoot ".."),
    $PSScriptRoot
  ) | ForEach-Object { if (Test-Path $_) { (Resolve-Path $_).Path } }

  $candidates = @()
  foreach ($dir in $searchDirs) {
    $candidates += Get-ChildItem $dir -Filter "*-portable.exe" -ErrorAction SilentlyContinue |
      Sort-Object LastWriteTime -Descending |
      Select-Object -ExpandProperty FullName
    $unpacked = Join-Path $dir "win-unpacked\FattoVirtual.exe"
    if (Test-Path $unpacked) { $candidates += $unpacked }
    $direct = Join-Path $dir "FattoVirtual.exe"
    if (Test-Path $direct) { $candidates += $direct }
  }

  foreach ($c in $candidates) {
    if ($c -and (Test-Path $c)) { return (Resolve-Path $c).Path }
  }
  return $null
}

$repoRoot = Find-RepoRoot
Set-Location $repoRoot
Write-Host "Raiz do projeto: $repoRoot" -ForegroundColor DarkGray

Assert-Docker

$composeFile = "docker-compose.desktop.yml"
if (-not (Test-Path $composeFile)) { $composeFile = "docker-compose.yml" }

$upArgs = @("compose", "-f", $composeFile, "up", "-d")
if ($Rebuild) { $upArgs += "--build" }
# Compose completo sobe web também; desktop.yml só db+api
if ($composeFile -eq "docker-compose.yml") {
  $upArgs += @("db", "api")
}

Write-Host "Subindo containers ($composeFile)..." -ForegroundColor Cyan
& docker @upArgs
if ($LASTEXITCODE -ne 0) { throw "Falha ao subir Docker Compose (exit $LASTEXITCODE)." }

Wait-ApiReady -Url $ApiBase.TrimEnd('/')

Write-Host ""
Write-Host "API pronta: $ApiBase" -ForegroundColor Green
Write-Host "Login seed: ju@fattovirtual.com / Admin123!" -ForegroundColor Green
Write-Host ""

if ($NoLaunch) {
  Write-Host "Stack no ar (-NoLaunch). Abra o .exe manualmente." -ForegroundColor Yellow
  exit 0
}

$exe = Find-DesktopExe
if ($exe) {
  Write-Host "Abrindo desktop: $exe" -ForegroundColor Cyan
  Start-Process -FilePath $exe
} else {
  Write-Host "Nenhum .exe encontrado em desktop/release/." -ForegroundColor Yellow
  Write-Host "Gere com:  cd desktop && npm run build:win" -ForegroundColor Yellow
  Write-Host "Ou em dev:  cd desktop && npm run dev  (com Vite no frontend)" -ForegroundColor Yellow
}

Write-Host "Para parar a stack:  .\desktop\demo\Stop-FattoDemo.ps1" -ForegroundColor DarkGray
