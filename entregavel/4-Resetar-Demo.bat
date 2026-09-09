@echo off
setlocal
cd /d "%~dp0"
title FattoVirtual — Resetar demonstracao
echo.
echo  Isso APAGA os dados da demonstracao e comeca do zero.
echo  Use se algo estiver estranho ou se o inicio falhou.
echo.
set /p CONFIRM=Digite S e Enter para continuar: 
if /I not "%CONFIRM%"=="S" (
  echo Cancelado.
  pause
  exit /b 0
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\Start-FattoVirtual.ps1" -ResetDb %*
set ERR=%ERRORLEVEL%
if not %ERR%==0 (
  echo.
  echo  Reset falhou. Confira se o Docker Desktop esta aberto.
  pause
  exit /b %ERR%
)
echo.
pause
