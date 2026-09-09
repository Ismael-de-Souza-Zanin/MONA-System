#Requires -Version 5.1
<#
.SYNOPSIS
  Gera o .exe Windows e copia para entregavel/app/.
#>
param(
  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$kitRoot = Split-Path $PSScriptRoot -Parent
$repoRoot = Split-Path $kitRoot -Parent
$desktop = Join-Path $repoRoot "desktop"
$appDir = Join-Path $kitRoot "app"
$release = Join-Path $desktop "release"

if (-not (Test-Path $desktop)) { throw "Pasta desktop/ não encontrada em $repoRoot" }

New-Item -ItemType Directory -Force -Path $appDir | Out-Null

if (-not $SkipBuild) {
  Write-Host "Build Windows (npm run build:win)..." -ForegroundColor Cyan
  Push-Location $desktop
  try {
    if (-not (Test-Path "node_modules")) {
      npm install
      if ($LASTEXITCODE -ne 0) { throw "npm install falhou" }
    }
    npm run build:win
    if ($LASTEXITCODE -ne 0) { throw "npm run build:win falhou" }
  } finally {
    Pop-Location
  }
}

if (-not (Test-Path $release)) {
  throw "Pasta desktop/release não existe. Rode o build primeiro."
}

Get-ChildItem $appDir -Filter "*.exe" -ErrorAction SilentlyContinue | Remove-Item -Force

$copied = @()
foreach ($pattern in @("*-portable.exe", "*-setup.exe")) {
  $files = Get-ChildItem $release -Filter $pattern -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending
  foreach ($f in $files) {
    Copy-Item $f.FullName -Destination (Join-Path $appDir $f.Name) -Force
    $copied += $f.Name
  }
}

# fallback: win-unpacked
$unpacked = Join-Path $release "win-unpacked\FattoVirtual.exe"
if (($copied.Count -eq 0) -and (Test-Path $unpacked)) {
  Copy-Item $unpacked -Destination (Join-Path $appDir "FattoVirtual.exe") -Force
  $copied += "FattoVirtual.exe (win-unpacked)"
}

if ($copied.Count -eq 0) {
  throw "Nenhum artefato .exe em $release"
}

@"
ATENCAO — nao comece por aqui
=============================

Os .exe desta pasta nao devem ser abertos sozinhos.

Volte para a pasta entregavel, abra COMECE-AQUI.txt
e rode 2-Iniciar-FattoVirtual.bat

Arquivos:
$(($copied | ForEach-Object { "- $_" }) -join "`n")

Login: ju@fattovirtual.com / Admin123!
"@ | Set-Content -Path (Join-Path $appDir "LEIA-ME.txt") -Encoding UTF8

. (Join-Path $PSScriptRoot "ClientUi.ps1")
New-FattoShortcut -KitRoot $kitRoot | Out-Null

Write-Host ""
Write-Host "Copiado para $appDir :" -ForegroundColor Green
$copied | ForEach-Object { Write-Host "  - $_" }
Write-Host "Atalho na pasta do kit: FattoVirtual.lnk"
