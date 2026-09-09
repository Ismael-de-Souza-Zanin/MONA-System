@echo off
setlocal
cd /d "%~dp0.."
title FattoVirtual — Parar demo
echo Parando stack demo (Postgres interno + API)...
docker compose -p fattovirtual-demo -f "%~dp0..\docker-compose.demo.yml" down --remove-orphans
set ERR=%ERRORLEVEL%
if not %ERR%==0 (
  echo [ERRO] %ERR%
  pause
  exit /b %ERR%
)
echo Stack demo parada. O volume do banco foi mantido (dados da demo permanecem).
echo Para apagar o banco tambem: use Reset-Demo.bat
pause
