@echo off
setlocal
cd /d "%~dp0"
title FattoVirtual — Preparar PC (WSL + Docker)
echo.
echo  PASSO 1 — Preparar o Windows
echo  ----------------------------
echo  O Docker Desktop no Windows PRECISA do WSL2.
echo  Por isso muitas vezes aparece erro de Docker e depois de WSL.
echo.
echo  Este assistente confere e tenta corrigir isso.
echo  Se pedir Administrador, aceite. Se pedir reinicio, reinicie.
echo.
pause

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\Ensure-WslAndDocker.ps1"
set ERR=%ERRORLEVEL%
echo.
if not %ERR%==0 (
  echo  Ainda falta algo. Tente de novo como Administrador:
  echo  botao direito neste arquivo - Executar como administrador
) else (
  echo  Quando o Docker Desktop estiver pronto, rode 2-Iniciar-FattoVirtual.bat
)
pause
exit /b %ERR%
