#Requires -Version 5.1
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
  throw "Não achei a raiz do FattoVirtual."
}

$repoRoot = Find-RepoRoot
Set-Location $repoRoot

$composeFile = if (Test-Path "docker-compose.desktop.yml") { "docker-compose.desktop.yml" } else { "docker-compose.yml" }

Write-Host "Parando containers ($composeFile)..." -ForegroundColor Cyan
docker compose -f $composeFile down
if ($LASTEXITCODE -ne 0) { throw "Falha ao parar compose." }
Write-Host "Stack parada." -ForegroundColor Green
