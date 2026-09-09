@echo off
setlocal
cd /d "%~dp0"
title FattoVirtual — Iniciando demonstracao
echo.
echo  PASSO 2 — Iniciar FattoVirtual
echo  ------------------------------
echo  Aguarde. Na primeira vez pode demorar varios minutos.
echo  Nao feche esta janela.
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\Start-FattoVirtual.ps1" %*
set ERR=%ERRORLEVEL%
if not %ERR%==0 (
  echo.
  echo  Nao deu certo. Leia COMECE-AQUI.txt ou tente 4-Resetar-Demo.bat
  pause
  exit /b %ERR%
)

echo.
echo  Pronto. Se o app nao abriu, use o atalho FattoVirtual na Area de Trabalho.
pause
