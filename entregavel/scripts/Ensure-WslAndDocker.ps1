#Requires -Version 5.1
<#
.SYNOPSIS
  Prepara Windows para a demo: WSL2 (obrigatório do Docker) + Docker Desktop.
#>
param(
  [switch]$SkipDockerDownload,
  [switch]$Quiet
)

$ErrorActionPreference = "Continue"
$here = $PSScriptRoot
. (Join-Path $here "ClientUi.ps1")

function Test-IsAdmin {
  $id = [Security.Principal.WindowsIdentity]::GetCurrent()
  $p = New-Object Security.Principal.WindowsPrincipal($id)
  return $p.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Get-WslState {
  $state = [ordered]@{
    WslCommand     = $false
    Installed      = $false
    HasDistro      = $false
    DefaultIsV2    = $false
    Raw            = ""
    NeedsReboot    = $false
    ErrorHint      = ""
  }

  if (-not (Get-Command wsl -ErrorAction SilentlyContinue)) {
    $state.ErrorHint = "WSL nao esta disponivel neste Windows."
    return [pscustomobject]$state
  }
  $state.WslCommand = $true

  $list = & wsl -l -v 2>&1 | Out-String
  $state.Raw = $list

  if ($list -match "Windows Subsystem for Linux has no installed distributions" -or
      $list -match "nao ha distribuicoes" -or
      $list -match "não há distribuições") {
    $state.Installed = $true
    $state.HasDistro = $false
    return [pscustomobject]$state
  }

  if ($LASTEXITCODE -ne 0 -and ($list -match "Wsl/WSL_E_WSL_OPTIONAL_COMPONENT_REQUIRED" -or
      $list -match "not installed" -or
      $list -match "nao esta instalado" -or
      $list -match "não está instalado" -or
      $list -match "0x80070002" -or
      $list -match "0x8007019e")) {
    $state.ErrorHint = "WSL ainda nao foi instalado/ativado neste PC."
    return [pscustomobject]$state
  }

  if ($list -match "VERSION\s+2" -or $list -match "\s2\s*$" -or $list -match "\s2\r?$") {
    $state.Installed = $true
    $state.DefaultIsV2 = $true
  }
  if ($list -match "Ubuntu|docker-desktop|Debian|openSUSE|kali|Alpine|Pinguin") {
    $state.HasDistro = $true
    $state.Installed = $true
  }
  # docker-desktop distros count as ready for Docker
  if ($list -match "docker-desktop") {
    $state.HasDistro = $true
    $state.Installed = $true
    $state.DefaultIsV2 = $true
  }

  # Se wsl -l -v funcionou sem erro fatal, componente existe
  if ($LASTEXITCODE -eq 0 -or $list -match "NAME") {
    $state.Installed = $true
  }

  return [pscustomobject]$state
}

function Get-DockerDaemonState {
  $result = [ordered]@{
    CliPresent = $false
    DesktopExe = $null
    Ready      = $false
    WslIssue   = $false
    Detail     = ""
  }

  if (Get-Command docker -ErrorAction SilentlyContinue) {
    $result.CliPresent = $true
  }

  $candidates = @(
    "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe",
    "${env:ProgramFiles(x86)}\Docker\Docker\Docker Desktop.exe",
    "$env:LOCALAPPDATA\Docker\Docker Desktop.exe"
  )
  foreach ($c in $candidates) {
    if (Test-Path $c) { $result.DesktopExe = $c; break }
  }

  if (-not $result.CliPresent) {
    $result.Detail = "Docker nao instalado."
    return [pscustomobject]$result
  }

  $info = & docker info 2>&1 | Out-String
  $result.Detail = $info
  if ($LASTEXITCODE -eq 0) {
    $result.Ready = $true
    return [pscustomobject]$result
  }

  if ($info -match "WSL" -or $info -match "wsl" -or
      $info -match "docker-desktop" -and $info -match "error" -or
      $info -match "The starship" -or # nonsense
      $info -match "hardware assisted virtualization" -or
      $info -match "Virtualization" -or
      $info -match "cannot find the file" -or
      $info -match "dockerDesktopLinuxEngine" -or
      $info -match "pipe/dockerDesktopLinuxEngine" -or
      $info -match "error during connect") {
    # Heurística: falha de daemon no Windows quase sempre WSL/virt
    $result.WslIssue = ($info -match "WSL|wsl|virtualization|VirtualMachinePlatform|HCS|0x8007")
  }

  # Sem daemon = trate como possivel WSL
  if (-not $result.Ready) {
    $result.WslIssue = $true
  }

  return [pscustomobject]$result
}

function Install-WslFeatures {
  Write-Host ""
  Write-Host "  Instalando/ativando WSL2 (pode pedir reinicio)..." -ForegroundColor Cyan
  Write-Host "  Isso e exigido pelo Docker Desktop no Windows." -ForegroundColor DarkGray

  # wsl --install instala componente + Ubuntu; requer admin e muitas vezes reboot
  & wsl --install --no-distribution 2>&1 | ForEach-Object { Write-Host "  $_" }
  $code1 = $LASTEXITCODE

  & wsl --set-default-version 2 2>&1 | ForEach-Object { Write-Host "  $_" }

  # Fallback features (Windows 10/11)
  try {
    dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart | Out-Null
    dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart | Out-Null
  } catch { }

  return $code1
}

# ---- main ----
Write-Host ""
Write-Host "  ========================================" -ForegroundColor Green
Write-Host "   FattoVirtual — preparar o PC" -ForegroundColor Green
Write-Host "  ========================================" -ForegroundColor Green
Write-Host "  Vamos conferir WSL2 e Docker Desktop." -ForegroundColor DarkGray
Write-Host ""

$wsl = Get-WslState
$docker = Get-DockerDaemonState

Write-Host ("  WSL comando:   {0}" -f ($(if ($wsl.WslCommand) { "OK" } else { "ausente" })))
Write-Host ("  WSL ativo:     {0}" -f ($(if ($wsl.Installed) { "OK" } else { "precisa instalar" })))
Write-Host ("  Docker app:    {0}" -f ($(if ($docker.DesktopExe) { "encontrado" } else { "nao instalado" })))
Write-Host ("  Docker pronto: {0}" -f ($(if ($docker.Ready) { "OK" } else { "ainda nao" })))
Write-Host ""

$needWsl = (-not $wsl.Installed) -or ($docker.WslIssue -and -not $docker.Ready)

if ($needWsl) {
  $msg = @"
O Windows ainda precisa do WSL2 (recurso da Microsoft).

Sem isso, o Docker Desktop nao funciona — e e por isso que aparece erro de Docker e depois de WSL.

Deseja instalar/ativar o WSL2 agora?
(E preciso aceitar a janela de Administrador e, em muitos PCs, reiniciar.)
"@
  if (Show-YesNo $msg "FattoVirtual — preparar WSL2") {
    if (-not (Test-IsAdmin)) {
      Write-Host "  Pedindo permissao de Administrador..." -ForegroundColor Yellow
      $arg = "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`" -SkipDockerDownload"
      try {
        Start-Process -FilePath "powershell.exe" -Verb RunAs -ArgumentList $arg -Wait
      } catch {
        Show-Error "Permissao negada. Clique com o botao direito em 1-Preparar-PC.bat e escolha 'Executar como administrador'."
        exit 1
      }
      # apos elevacao, reavaliar
      $wsl = Get-WslState
    } else {
      $null = Install-WslFeatures
      Show-Info @"
WSL foi solicitado ao Windows.

PROXIMO PASSO OBRIGATORIO na maioria dos PCs:
1. REINICIE o computador
2. Abra o Docker Desktop e espere ficar pronto
3. Rode: 2-Iniciar-FattoVirtual.bat

Se o Windows pedir atualizacao do WSL/kernel, aceite.
"@
      if (-not $SkipDockerDownload -and -not $docker.DesktopExe) {
        Start-Process "https://www.docker.com/products/docker-desktop/"
      }
      exit 0
    }
  } else {
    Show-Info @"
Sem WSL2 a demonstracao nao sobe neste Windows.

Voce pode tentar depois:
• Clique com botao direito em 1-Preparar-PC.bat
• 'Executar como administrador'
• Reinicie o PC quando pedido
"@
    exit 1
  }
}

# Se ja somos admin e fomos relaunchados so para WSL
if ((Test-IsAdmin) -and $needWsl) {
  $null = Install-WslFeatures
  Show-Info "WSL solicitado. Reinicie o PC, abra o Docker Desktop e depois use 2-Iniciar-FattoVirtual.bat"
  exit 0
}

if (-not $docker.DesktopExe -and -not $SkipDockerDownload) {
  if (Show-YesNo @"
Agora vamos instalar o Docker Desktop (gratuito).

Ele usa o WSL2 por baixo — por isso o passo do WSL vem primeiro.

Abrir a pagina de download agora?
"@ "FattoVirtual — Docker Desktop") {
    Start-Process "https://www.docker.com/products/docker-desktop/"
  }
  Show-Info @"
Instale o Docker Desktop com as opcoes padrao.
Se pedir, marque uso com WSL2.

Depois:
1. Abra o Docker Desktop
2. Espere o icone ficar pronto (sem 'Starting...')
3. Rode 2-Iniciar-FattoVirtual.bat

Se aparecer erro de WSL de novo, reinicie o PC uma vez e tente outra vez.
"@
  exit 0
}

if ($docker.DesktopExe -and -not $docker.Ready) {
  Write-Host "  Abrindo Docker Desktop..." -ForegroundColor Yellow
  Start-Process -FilePath $docker.DesktopExe | Out-Null
  Show-Info @"
Docker Desktop esta abrindo.

Espere ficar PRONTO (icone perto do relogio).
Se pedir atualizacao do WSL, aceite e reinicie se o Windows pedir.

Depois rode: 2-Iniciar-FattoVirtual.bat
"@
  exit 0
}

if ($docker.Ready) {
  Show-Info "Tudo certo: WSL/Docker prontos. Pode rodar 2-Iniciar-FattoVirtual.bat"
  if (-not $Quiet) { Write-Host "  Ambiente pronto." -ForegroundColor Green }
  exit 0
}

Show-Info "Siga COMECE-AQUI.txt. Se travar em WSL, rode 1-Preparar-PC.bat como Administrador e reinicie."
exit 0
