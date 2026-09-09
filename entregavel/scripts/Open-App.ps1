#Requires -Version 5.1
$ErrorActionPreference = "Stop"
$kitRoot = Split-Path $PSScriptRoot -Parent
$repoRoot = Split-Path $kitRoot -Parent

$searchRoots = @(
  (Join-Path $kitRoot "app"),
  (Join-Path $repoRoot "desktop\release")
)

function Pick-Latest([string]$Root, [string]$Filter) {
  if (-not (Test-Path $Root)) { return $null }
  return Get-ChildItem $Root -Filter $Filter -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1
}

$exe = $null
foreach ($root in $searchRoots) {
  $exe = Pick-Latest $root "*-portable.exe"
  if ($exe) { break }
  $unpacked = Join-Path $root "win-unpacked\FattoVirtual.exe"
  if (Test-Path $unpacked) { $exe = Get-Item $unpacked; break }
  $direct = Join-Path $root "FattoVirtual.exe"
  if (Test-Path $direct) { $exe = Get-Item $direct; break }
}

if (-not $exe) {
  Write-Host "Nenhum .exe encontrado. Rode: entregavel\scripts\Pack-Entregavel.ps1" -ForegroundColor Yellow
  exit 1
}

Write-Host "Abrindo: $($exe.FullName)" -ForegroundColor Cyan
Start-Process -FilePath $exe.FullName
exit 0
