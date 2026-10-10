@echo off
title Royal Hostel Management System - Server
echo =========================================================================
echo       ROYAL HOSTEL KHUZDAR - MANAGEMENT SYSTEM STARTUP
echo =========================================================================
echo [1/2] Initializing Backend Server & Production PWA Interface...
cd /d "%~dp0backend"
start "" http://localhost:5000
node src/server.js
pause
