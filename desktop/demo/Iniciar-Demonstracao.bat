@echo off
setlocal
cd /d "%~dp0"
title FattoVirtual — Demonstração
echo.
echo  FattoVirtual — sobe API (Docker) e abre o app desktop
echo  ----------------------------------------------------
echo.

where docker >nul 2>&1
if errorlevel 1 (
  echo [ERRO] Docker nao encontrado. Instale o Docker Desktop e tente de novo.
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Start-FattoDemo.ps1" %*
set ERR=%ERRORLEVEL%
if not %ERR%==0 (
  echo.
  echo [ERRO] Codigo %ERR%. Veja a mensagem acima.
  pause
  exit /b %ERR%
)

echo.
pause
