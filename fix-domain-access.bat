@echo off
chcp 65001 > nul 2>&1
title Amazon Seller Central - Fix Domain Access
cd /d "%~dp0"

echo.
echo ================================================================
echo                Fix Domain Access - Amazon Seller Central
echo ================================================================
echo.

echo [INFO] This script will fix domain access issues
echo.

echo [Step 1/3] Clearing Windows DNS cache...
powershell -Command "Clear-DnsClientCache" 2>nul
echo [OK] DNS cache cleared

echo.
echo [Step 2/3] Verifying hosts file...
findstr /C:"sellercentral.amazon.com" "%WINDIR%\System32\drivers\etc\hosts" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Hosts file contains domain mappings
) else (
    echo [ERROR] Hosts file missing domain mappings!
    echo [FIX] Adding domain mappings...
    echo. >> "%WINDIR%\System32\drivers\etc\hosts"
    echo # Amazon Seller Central - Domain Mapping >> "%WINDIR%\System32\drivers\etc\hosts"
    echo 127.0.0.1 sellercentral.amazon.com >> "%WINDIR%\System32\drivers\etc\hosts"
    echo 127.0.0.1 admin.sellercentral.amazon.com >> "%WINDIR%\System32\drivers\etc\hosts"
    echo [OK] Domain mappings added
)

echo.
echo [Step 3/3] Opening browser to clear DNS cache...
echo [INFO] Please follow these steps:
echo.
echo 1. Close ALL browser windows completely
echo 2. Click below to open browser and clear DNS cache:
echo.
echo    For Chrome/Edge:
echo    - Navigate to: chrome://net-internals/#dns
echo    - Click "Clear host cache" button
echo.
echo    For Firefox:
echo    - Navigate to: about:networking#dns
echo    - Click "Clear DNS Cache" button
echo.
pause

echo.
echo [INFO] Opening browser DNS cache page...
start "" "chrome://net-internals/#dns"
timeout /t 3 >nul
start "" "about:networking#dns"

echo.
echo ================================================================
echo                        Next Steps
echo ================================================================
echo.
echo 1. Clear browser DNS cache using the pages above
echo 2. Close all browser windows
echo 3. Run start.bat again to launch the application
echo.
echo Alternative: Access via localhost
echo   - Frontend: http://localhost:3000
echo   - Admin: http://localhost:3002
echo.
echo Press any key to exit...
set /p dummy=
exit /b 0
