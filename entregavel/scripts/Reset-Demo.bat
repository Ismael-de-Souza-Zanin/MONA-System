@echo off
setlocal
cd /d "%~dp0.."
title FattoVirtual — Reset demo
echo.
echo  Isso APAGA o banco interno da demo e sobe tudo de novo (seed limpo).
echo.
set /p CONFIRM=Confirma? Digite S e Enter: 
if /I not "%CONFIRM%"=="S" (
  echo Cancelado.
  pause
  exit /b 0
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Start-FattoVirtual.ps1" -ResetDb -Rebuild %*
set ERR=%ERRORLEVEL%
if not %ERR%==0 (
  echo [ERRO] %ERR%
  pause
  exit /b %ERR%
)
echo.
pause
