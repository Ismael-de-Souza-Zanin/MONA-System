@echo off
setlocal
cd /d "%~dp0"
title FattoVirtual — Encerrar demonstracao
echo.
echo  Encerrando o ambiente da demonstracao...
echo  (seus dados da demo ficam salvos para a proxima vez)
echo.
docker compose -p fattovirtual-demo -f "%~dp0docker-compose.demo.yml" down --remove-orphans
if errorlevel 1 (
  echo  Nao foi possivel encerrar. O Docker Desktop esta aberto?
  pause
  exit /b 1
)
echo.
echo  Ambiente encerrado. O aplicativo pode ser fechado normalmente.
pause
