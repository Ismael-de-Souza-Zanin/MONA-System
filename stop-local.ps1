#Requires -Version 5.1
param([switch]$Volumes)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "==> Parando FattoVirtual..." -ForegroundColor Cyan
if ($Volumes) {
  docker compose down -v
} else {
  docker compose down
}
Write-Host "Containers parados." -ForegroundColor Green
