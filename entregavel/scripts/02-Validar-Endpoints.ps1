#Requires -Version 5.1
<#
.SYNOPSIS
  Smoke test dos endpoints críticos da API local FattoVirtual.
#>
param(
  [string]$ApiBase = "http://localhost:5080/api/v1",
  [int]$WaitSec = 90,
  [string]$Email = "ju@fattovirtual.com",
  [string]$Password = "Admin123!"
)

$ErrorActionPreference = "Stop"
$base = $ApiBase.TrimEnd('/')
$failed = 0
$passed = 0

function Wait-Api {
  param([string]$Url, [int]$TimeoutSec)
  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  Write-Host "Aguardando API em $Url ..." -ForegroundColor Cyan
  while ((Get-Date) -lt $deadline) {
    try {
      Invoke-WebRequest -Uri "$Url/auth/login" -Method POST `
        -ContentType "application/json" `
        -Body '{"email":"ping@local","password":"x"}' `
        -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop | Out-Null
      return
    } catch {
      $code = $null
      if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }
      if ($code -eq 401 -or $code -eq 400 -or $code -eq 422) { return }
    }
    Start-Sleep -Seconds 2
  }
  throw "Timeout: API não respondeu em ${TimeoutSec}s."
}

function Invoke-Json {
  param(
    [string]$Method,
    [string]$Path,
    [object]$Body = $null,
    [hashtable]$Headers = @{},
    [int[]]$OkStatus = @(200, 201, 204)
  )
  $uri = if ($Path.StartsWith("http")) { $Path } else { "$base$Path" }
  $params = @{
    Uri             = $uri
    Method          = $Method
    UseBasicParsing = $true
    TimeoutSec      = 30
    Headers         = $Headers
  }
  if ($null -ne $Body) {
    $params.ContentType = "application/json"
    $params.Body = ($Body | ConvertTo-Json -Depth 8 -Compress)
  }
  try {
    $resp = Invoke-WebRequest @params
    return @{ Status = [int]$resp.StatusCode; Content = $resp.Content; Ok = $true }
  } catch {
    $status = 0
    $content = $_.ErrorDetails.Message
    if ($_.Exception.Response) {
      $status = [int]$_.Exception.Response.StatusCode
      try {
        $stream = $_.Exception.Response.GetResponseStream()
        if ($stream) {
          $reader = New-Object System.IO.StreamReader($stream)
          $content = $reader.ReadToEnd()
        }
      } catch { }
    }
    return @{ Status = $status; Content = $content; Ok = ($OkStatus -contains $status) }
  }
}

function Assert-Endpoint {
  param(
    [string]$Name,
    [string]$Method,
    [string]$Path,
    [object]$Body = $null,
    [hashtable]$Headers = @{},
    [int[]]$OkStatus = @(200, 201, 204)
  )
  $r = Invoke-Json -Method $Method -Path $Path -Body $Body -Headers $Headers -OkStatus $OkStatus
  if ($OkStatus -contains $r.Status) {
    Write-Host "  OK  $Name  [$($r.Status)]" -ForegroundColor Green
    $script:passed++
    return $r
  }
  Write-Host "  FAIL $Name  [$($r.Status)] $($r.Content)" -ForegroundColor Red
  $script:failed++
  return $r
}

Wait-Api -Url $base -TimeoutSec $WaitSec

Write-Host ""
Write-Host "=== Smoke FattoVirtual API ===" -ForegroundColor Cyan
Write-Host "Base: $base"
Write-Host ""

# Auth
$login = Assert-Endpoint -Name "POST /auth/login" -Method POST -Path "/auth/login" -Body @{
  email    = $Email
  password = $Password
}
$token = $null
if ($login.Content) {
  try {
    $obj = $login.Content | ConvertFrom-Json
    $token = $obj.accessToken
    if (-not $token) { $token = $obj.AccessToken }
    if (-not $token) { $token = $obj.token }
  } catch { }
}
if (-not $token) {
  Write-Host "  FAIL Não foi possível obter JWT do login." -ForegroundColor Red
  $failed++
  Write-Host ""
  Write-Host "Resultado: $passed ok, $failed falha(s)" -ForegroundColor Red
  exit 1
}
$auth = @{ Authorization = "Bearer $token" }

Assert-Endpoint -Name "GET /auth/me" -Method GET -Path "/auth/me" -Headers $auth | Out-Null
Assert-Endpoint -Name "GET /dashboard/stats" -Method GET -Path "/dashboard/stats" -Headers $auth | Out-Null
Assert-Endpoint -Name "GET /clients" -Method GET -Path "/clients" -Headers $auth | Out-Null
Assert-Endpoint -Name "GET /clients/counts" -Method GET -Path "/clients/counts" -Headers $auth | Out-Null
Assert-Endpoint -Name "GET /client-groups" -Method GET -Path "/client-groups" -Headers $auth | Out-Null
Assert-Endpoint -Name "GET /payments" -Method GET -Path "/payments" -Headers $auth | Out-Null
Assert-Endpoint -Name "GET /payments/mine" -Method GET -Path "/payments/mine" -Headers $auth | Out-Null
Assert-Endpoint -Name "GET /finance/active-client-tasks" -Method GET -Path "/finance/active-client-tasks" -Headers $auth | Out-Null
Assert-Endpoint -Name "GET /todos" -Method GET -Path "/todos" -Headers $auth | Out-Null
Assert-Endpoint -Name "GET /agenda/events" -Method GET -Path "/agenda/events" -Headers $auth | Out-Null
Assert-Endpoint -Name "GET /sops" -Method GET -Path "/sops" -Headers $auth | Out-Null
Assert-Endpoint -Name "GET /sops/hub" -Method GET -Path "/sops/hub" -Headers $auth | Out-Null
Assert-Endpoint -Name "GET /share-links" -Method GET -Path "/share-links" -Headers $auth | Out-Null
Assert-Endpoint -Name "GET /chat/threads" -Method GET -Path "/chat/threads" -Headers $auth | Out-Null
Assert-Endpoint -Name "GET /partners" -Method GET -Path "/partners" -Headers $auth | Out-Null
Assert-Endpoint -Name "GET /services" -Method GET -Path "/services" -Headers $auth | Out-Null
Assert-Endpoint -Name "GET /contracts" -Method GET -Path "/contracts" -Headers $auth | Out-Null
Assert-Endpoint -Name "GET /apps" -Method GET -Path "/apps" -Headers $auth | Out-Null
Assert-Endpoint -Name "GET /whatsapp/status" -Method GET -Path "/whatsapp/status" -Headers $auth | Out-Null
Assert-Endpoint -Name "GET /faqs" -Method GET -Path "/faqs" -Headers $auth | Out-Null

Write-Host ""
if ($failed -gt 0) {
  Write-Host "Resultado: $passed ok, $failed falha(s)" -ForegroundColor Red
  exit 1
}
Write-Host "Resultado: $passed ok, 0 falhas — API local pronta." -ForegroundColor Green
exit 0
