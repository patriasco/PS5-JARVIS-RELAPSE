@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Abrindo host Relapse/JARVIS na rede local na porta 8000 ...
python serve.py
pause
