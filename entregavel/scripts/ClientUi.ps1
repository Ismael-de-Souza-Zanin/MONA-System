#Requires -Version 5.1
# Helpers de UI amigável (MessageBox) para o kit da FattoVirtual

Add-Type -AssemblyName System.Windows.Forms | Out-Null

function Show-Info([string]$Text, [string]$Title = "FattoVirtual") {
  [System.Windows.Forms.MessageBox]::Show(
    $Text, $Title,
    [System.Windows.Forms.MessageBoxButtons]::OK,
    [System.Windows.Forms.MessageBoxIcon]::Information
  ) | Out-Null
}

function Show-Error([string]$Text, [string]$Title = "FattoVirtual — algo deu errado") {
  [System.Windows.Forms.MessageBox]::Show(
    $Text, $Title,
    [System.Windows.Forms.MessageBoxButtons]::OK,
    [System.Windows.Forms.MessageBoxIcon]::Error
  ) | Out-Null
}

function Show-YesNo([string]$Text, [string]$Title = "FattoVirtual") {
  $r = [System.Windows.Forms.MessageBox]::Show(
    $Text, $Title,
    [System.Windows.Forms.MessageBoxButtons]::YesNo,
    [System.Windows.Forms.MessageBoxIcon]::Question
  )
  return ($r -eq [System.Windows.Forms.DialogResult]::Yes)
}

function Write-Step([int]$N, [int]$Total, [string]$Text) {
  Write-Host ""
  Write-Host ("[{0}/{1}] {2}" -f $N, $Total, $Text) -ForegroundColor Cyan
}

function New-FattoShortcut {
  param(
    [string]$KitRoot,
    [switch]$AlsoDesktop
  )

  $target = Join-Path $KitRoot "2-Iniciar-FattoVirtual.bat"
  if (-not (Test-Path $target)) {
    $target = Join-Path $KitRoot "Iniciar-FattoVirtual.bat"
  }
  if (-not (Test-Path $target)) { return }

  $icon = $null
  $portable = Get-ChildItem (Join-Path $KitRoot "app") -Filter "*-portable.exe" -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if ($portable) { $icon = $portable.FullName }

  $shell = New-Object -ComObject WScript.Shell

  $localLnk = Join-Path $KitRoot "FattoVirtual.lnk"
  $sc = $shell.CreateShortcut($localLnk)
  $sc.TargetPath = $target
  $sc.WorkingDirectory = $KitRoot
  $sc.WindowStyle = 1
  $sc.Description = "Iniciar demonstração FattoVirtual"
  if ($icon) { $sc.IconLocation = "$icon,0" }
  $sc.Save()

  if ($AlsoDesktop) {
    $desk = [Environment]::GetFolderPath("Desktop")
    $deskLnk = Join-Path $desk "FattoVirtual.lnk"
    $sc2 = $shell.CreateShortcut($deskLnk)
    $sc2.TargetPath = $target
    $sc2.WorkingDirectory = $KitRoot
    $sc2.WindowStyle = 1
    $sc2.Description = "Iniciar demonstração FattoVirtual"
    if ($icon) { $sc2.IconLocation = "$icon,0" }
    $sc2.Save()
    return $deskLnk
  }
  return $localLnk
}
