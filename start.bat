@echo off
echo.
echo  Build Battle - starting local server...
echo  Open http://localhost:8080 in your browser, then click Play.
echo.
cd /d "%~dp0"

where npm >nul 2>&1
if %ERRORLEVEL%==0 (
  call npm run dev -- --port 8080
  goto :eof
)

where npx >nul 2>&1
if %ERRORLEVEL%==0 (
  call npx --yes vite --port 8080
  goto :eof
)

echo Node.js is required. Install from https://nodejs.org/ then run this again.
pause
