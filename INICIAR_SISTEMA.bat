@echo off
title Sistema Ramal - Servidor de Desenvolvimento
echo.
echo ==========================================
echo    INICIANDO SISTEMA RAMAL...
echo ==========================================
echo.
cd /d "%~dp0"
npm run dev -- --open
pause
