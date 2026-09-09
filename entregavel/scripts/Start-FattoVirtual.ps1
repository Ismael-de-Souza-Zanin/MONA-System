#Requires -Version 5.1
<#
.SYNOPSIS
  Inicia a demonstração FattoVirtual (banco + sistema + app) de forma amigável.
#>
param(
  [switch]$NoLaunch,
  [switch]$SkipSmoke,
  [switch]$Rebuild,
  [switch]$ResetDb,
  [switch]$Tech,
  [string]$ApiBase = "http://localhost:5080/api/v1"
)

$ErrorActionPreference = "Stop"
$here = $PSScriptRoot
$kitRoot = Split-Path $here -Parent
$composeFile = Join-Path $kitRoot "docker-compose.demo.yml"
$projectName = "fattovirtual-demo"
. (Join-Path $here "ClientUi.ps1")

$friendly = -not $Tech
$totalSteps = 5

function Assert-ComposeFile {
  if (-not (Test-Path $composeFile)) {
    throw "Arquivos da demonstração incompletos (falta docker-compose.demo.yml)."
  }
  $repoRoot = Split-Path $kitRoot -Parent
  $dockerfile = Join-Path $repoRoot "backend\Dockerfile"
  if (-not (Test-Path $dockerfile)) {
    throw @"
Pasta incompleta.

Esta demonstração precisa da pasta completa do FattoVirtual no computador
(não apenas o arquivo .exe).

Peça o pacote completo novamente à equipe que enviou a demo.
"@
  }
}

function Test-LooksLikeWslError([string]$Text) {
  if ([string]::IsNullOrWhiteSpace($Text)) { return $false }
  return ($Text -match "WSL|wsl\.exe|Windows Subsystem|VirtualMachinePlatform|virtualization|HCS_|docker-desktop|dockerDesktopLinuxEngine|Wsl/")
}

function Show-WslHelpAndExit([string]$Detail = "") {
  $prep = Join-Path $kitRoot "1-Preparar-PC.bat"
  $msg = @"
Isso costuma ser WSL2 — não um problema do FattoVirtual.

No Windows, o Docker Desktop só funciona com o WSL2 ligado.
Por isso aparece erro de Docker e, em seguida, de WSL.

O que fazer agora:
1. Feche esta janela
2. Clique com o botão direito em:
   1-Preparar-PC.bat
3. Escolha "Executar como administrador"
4. Se o Windows pedir, REINICIE o PC
5. Abra o Docker Desktop e espere ficar pronto
6. Rode de novo: 2-Iniciar-FattoVirtual.bat
"@
  if ($Detail) { $msg += "`n`nDetalhe técnico:`n$Detail" }
  Show-Error $msg
  if (Test-Path $prep) {
    if (Show-YesNo "Deseja abrir o preparador do PC agora (1-Preparar-PC.bat)?") {
      Start-Process -FilePath $prep
    }
  }
  throw "Docker depende do WSL2. Rode 1-Preparar-PC.bat como Administrador e reinicie se pedido."
}

function Ensure-Docker {
  param([int]$TimeoutSec = 240)

  # Checagem antecipada: WSL inexistente/desativado (não confundir com "sem distro")
  if (-not (Get-Command wsl -ErrorAction SilentlyContinue)) {
    Show-WslHelpAndExit "Comando wsl não encontrado neste Windows."
  }
  $wslOut = & wsl -l -v 2>&1 | Out-String
  $wslMissing = ($wslOut -match "Wsl/WSL_E_WSL_OPTIONAL_COMPONENT_REQUIRED|0x8007019e|0x80070002") -or
    ($wslOut -match "not installed|não está instalado|nao esta instalado|não foi instalado")
  $noDistroYet = ($wslOut -match "has no installed distributions|nenhuma distribuição|nao ha distribuicoes|não há distribuições")
  if ($wslMissing -and -not $noDistroYet) {
    Show-WslHelpAndExit ($wslOut.Trim())
  }
  if ($LASTEXITCODE -ne 0 -and -not $noDistroYet -and (Test-LooksLikeWslError $wslOut) -and ($wslOut -match "0x8007|OPTIONAL_COMPONENT")) {
    Show-WslHelpAndExit ($wslOut.Trim())
  }

  $dockerCmd = Get-Command docker -ErrorAction SilentlyContinue
  if (-not $dockerCmd) {
    $msg = @"
Ainda falta o Docker Desktop (programa auxiliar gratuito).

Antes dele, o WSL2 precisa estar ok — use 1-Preparar-PC.bat.

Deseja abrir a página do Docker Desktop agora?
"@
    if (Show-YesNo $msg) {
      Start-Process "https://www.docker.com/products/docker-desktop/"
    }
    Show-Info "Depois de instalar: abra o Docker Desktop, espere ficar pronto, e rode 2-Iniciar-FattoVirtual.bat"
    throw "Docker Desktop ainda não está instalado."
  }

  $info = & docker info 2>&1 | Out-String
  if ($LASTEXITCODE -eq 0) { return }

  if (Test-LooksLikeWslError $info) {
    Show-WslHelpAndExit ($info.Substring(0, [Math]::Min(500, $info.Length)).Trim())
  }

  Write-Host "  Abrindo o Docker Desktop..." -ForegroundColor Yellow
  $candidates = @(
    "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe",
    "${env:ProgramFiles(x86)}\Docker\Docker\Docker Desktop.exe",
    "$env:LOCALAPPDATA\Docker\Docker Desktop.exe"
  ) | Where-Object { Test-Path $_ }

  if ($candidates.Count -gt 0) {
    Start-Process -FilePath $candidates[0] | Out-Null
  } else {
    Show-Error "Docker não encontrado. Rode 1-Preparar-PC.bat"
    throw "Docker Desktop não encontrado para iniciar."
  }

  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  while ((Get-Date) -lt $deadline) {
    Start-Sleep -Seconds 4
    $info = & docker info 2>&1 | Out-String
    if ($LASTEXITCODE -eq 0) {
      Write-Host "  Docker pronto." -ForegroundColor Green
      return
    }
    if (Test-LooksLikeWslError $info) {
      Show-WslHelpAndExit ($info.Substring(0, [Math]::Min(500, $info.Length)).Trim())
    }
    Write-Host "  Ainda preparando o Docker... (pode levar 1–2 minutos)" -ForegroundColor DarkGray
  }

  Show-Error @"
O Docker Desktop não ficou pronto.

Se a tela do Docker falar de WSL:
• Rode 1-Preparar-PC.bat como Administrador
• Reinicie o PC
• Abra o Docker de novo e só então use 2-Iniciar-FattoVirtual.bat
"@
  throw "Docker Desktop não ficou pronto a tempo."
}

function Invoke-Compose([string[]]$ComposeArgs) {
  if ($Tech) {
    Write-Host ("  docker compose -p {0} ... {1}" -f $projectName, ($ComposeArgs -join " ")) -ForegroundColor DarkGray
  }
  & docker compose -p $projectName -f $composeFile @ComposeArgs
  if ($LASTEXITCODE -ne 0) {
    throw "Não foi possível preparar o ambiente (código $LASTEXITCODE). Tente 4-Resetar-Demo.bat e inicie de novo."
  }
}

function Stop-ConflictingFattoContainers {
  $names = docker ps --format "{{.Names}}" 2>$null
  foreach ($n in $names) {
    if ($n -match "^fattovirtual-(api|db)-" -or $n -eq "fattovirtual-api-1" -or $n -eq "fattovirtual-db-1") {
      if ($Tech) { Write-Host "Parando container legado: $n" -ForegroundColor Yellow }
      docker stop $n 1>$null 2>$null
    }
  }
}

function Start-DemoStack {
  if ($friendly) {
    Write-Host "  Preparando banco de dados e sistema (aguarde)..." -ForegroundColor DarkGray
    Write-Host "  Na primeira vez isso pode demorar vários minutos." -ForegroundColor DarkGray
  }

  & docker compose -p $projectName -f $composeFile down --remove-orphans 2>$null
  Stop-ConflictingFattoContainers

  if ($ResetDb) {
    Write-Host "  Limpando dados da demonstração anterior..." -ForegroundColor Yellow
    docker volume rm fattovirtual_demo_pgdata 2>$null | Out-Null
  }

  Invoke-Compose -ComposeArgs @("up", "-d", "--build", "--remove-orphans", "--force-recreate")

  Write-Host "  Aguardando o banco interno..." -ForegroundColor DarkGray
  $deadline = (Get-Date).AddSeconds(180)
  do {
    $health = docker inspect -f "{{.State.Health.Status}}" fattovirtual-demo-db 2>$null
    if ($health -eq "healthy") { break }
    if ((Get-Date) -ge $deadline) {
      throw "O banco da demonstração não iniciou a tempo. Rode 4-Resetar-Demo.bat e tente de novo."
    }
    Start-Sleep -Seconds 2
  } while ($true)

  Write-Host "  Finalizando o sistema..." -ForegroundColor DarkGray
  Invoke-Compose -ComposeArgs @("restart", "api")
}

# ---- fluxo principal ----
try {
  Clear-Host
  Write-Host ""
  Write-Host "  ========================================" -ForegroundColor Green
  Write-Host "   FattoVirtual — demonstração" -ForegroundColor Green
  Write-Host "  ========================================" -ForegroundColor Green
  Write-Host "  Pode deixar esta janela aberta." -ForegroundColor DarkGray
  Write-Host "  Não feche até o aplicativo abrir." -ForegroundColor DarkGray

  Assert-ComposeFile

  Write-Step 1 $totalSteps "Verificando o Docker Desktop"
  Ensure-Docker

  Write-Step 2 $totalSteps "Preparando banco e sistema"
  Start-DemoStack

  Write-Step 3 $totalSteps "Conferindo se tudo responde"
  if (-not $SkipSmoke) {
    $smoke = Join-Path $here "02-Validar-Endpoints.ps1"
    if ($friendly) {
      # saída resumida: só resultado final
      $out = & $smoke -ApiBase $ApiBase -WaitSec 180 2>&1 | Out-String
      if ($LASTEXITCODE -ne 0) {
        if ($Tech) { Write-Host $out }
        throw "O sistema subiu, mas a verificação automática falhou. Tente 4-Resetar-Demo.bat."
      }
      Write-Host "  Tudo certo — sistema respondendo." -ForegroundColor Green
    } else {
      & $smoke -ApiBase $ApiBase -WaitSec 180
      if ($LASTEXITCODE -ne 0) { throw "Smoke de endpoints falhou." }
    }
  }

  Write-Step 4 $totalSteps "Criando atalho fácil"
  $desk = New-FattoShortcut -KitRoot $kitRoot -AlsoDesktop
  if ($desk) {
    Write-Host "  Atalho na Área de Trabalho: FattoVirtual" -ForegroundColor Green
  }

  Write-Step 5 $totalSteps "Abrindo o aplicativo"
  Write-Host ""
  Write-Host "  Login da demonstração:" -ForegroundColor Green
  Write-Host "    E-mail: ju@fattovirtual.com"
  Write-Host "    Senha:  Admin123!"
  Write-Host ""

  if (-not $NoLaunch) {
    & (Join-Path $here "Open-App.ps1")
  }

  if ($friendly) {
    Show-Info @"
FattoVirtual está pronto!

Login:
E-mail: ju@fattovirtual.com
Senha: Admin123!

Da próxima vez, use o atalho "FattoVirtual" na Área de Trabalho
(ou o arquivo 2-Iniciar-FattoVirtual.bat).

Para encerrar o ambiente: 3-Parar-FattoVirtual.bat
"@
  }
} catch {
  $err = $_.Exception.Message
  Write-Host ""
  Write-Host "ERRO: $err" -ForegroundColor Red
  if ($friendly) {
    Show-Error @"
Não foi possível iniciar a demonstração.

$err

Sugestões:
• Leia COMECE-AQUI.txt
• Confirme que o Docker Desktop está aberto e pronto
• Tente 4-Resetar-Demo.bat e depois 2-Iniciar-FattoVirtual.bat
"@
  }
  exit 1
}

exit 0
