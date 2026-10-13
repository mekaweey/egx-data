@echo off
rem EGX web server auto-start on logon (port 8090) - starts only if not already running
powershell -NoProfile -Command "if (-not (Get-NetTCPConnection -LocalPort 8090 -State Listen -ErrorAction SilentlyContinue)) { Start-Process -FilePath cmd.exe -ArgumentList '/c cd /d D:\meky-stock-main\meky-stock-main ^&^& npx vite dev --port 8090 --strictPort' -WindowStyle Hidden }"
