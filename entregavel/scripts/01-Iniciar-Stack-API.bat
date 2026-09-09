@echo off
setlocal
cd /d "%~dp0"
title FattoVirtual — Equalizar Docker (DB + API)
echo Equalizando Docker da demo (Postgres interno + API), sem abrir o app...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Start-FattoVirtual.ps1" -NoLaunch %*
set ERR=%ERRORLEVEL%
if not %ERR%==0 (
  echo [ERRO] %ERR%
  pause
  exit /b %ERR%
)
echo.
pause
