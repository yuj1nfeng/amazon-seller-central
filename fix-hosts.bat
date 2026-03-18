@echo off
chcp 65001 > nul 2>&1
title Fix Hosts File - Amazon Seller Central
cd /d "%~dp0"

echo.
echo ================================================================
echo                Fix Hosts File - Amazon Seller Central
echo ================================================================
echo.

echo [Step 1/5] Stopping DNS Client service...
REM Note: Dnscache service cannot be stopped directly, we'll flush it
powershell -Command "Clear-DnsClientCache" 2>nul
echo [OK] DNS cache cleared

echo.
echo [Step 2/5] Fixing hosts file...

REM Create clean hosts file content
powershell -Command ^
"$hostsPath = '$env:WINDIR\System32\drivers\etc\hosts'; ^
$content = @'^
# Copyright (c) 1993-2009 Microsoft Corp.
#
# This is a sample HOSTS file used by Microsoft TCP/IP for Windows.
#
# localhost name resolution is handled within DNS itself.
#       127.0.0.1       localhost
#       ::1             localhost

# Amazon Seller Central Clone - Domain Mapping
127.0.0.1 sellercentral.amazon.com
127.0.0.1 admin.sellercentral.amazon.com
^'; ^
Set-Content -Path $hostsPath -Value $content -Encoding UTF8 -NoNewline"

echo [OK] Hosts file fixed

echo.
echo [Step 3/5] Verifying hosts file...
type %WINDIR%\System32\drivers\etc\hosts | findstr "sellercentral"

echo.
echo [Step 4/5] Flushing DNS cache again...
powershell -Command "Clear-DnsClientCache" 2>nul
echo [OK] DNS cache flushed

echo.
echo [Step 5/5] Testing domain resolution...
ping -n 1 sellercentral.amazon.com >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=2" %%a in ('ping -n 1 sellercentral.amazon.com 2^>nul ^| findstr "Pinging"') do (
        if "%%a"=="127.0.0.1" (
            echo [SUCCESS] Domain resolves to 127.0.0.1 correctly!
        ) else (
            echo [WARN] Domain resolves to %%a instead of 127.0.0.1
            echo [INFO] This may be due to Windows DNS cache or DoH settings
            echo [TIP] Try restarting your browser or computer
        )
    )
) else (
    echo [ERROR] Cannot resolve domain
)

echo.
echo ================================================================
echo                        Manual Steps Required
echo ================================================================
echo.
echo If domain still doesn't resolve to 127.0.0.1, please try:
echo.
echo 1. RESTART YOUR BROWSER - Close all browser windows completely
echo 2. CLEAR BROWSER DNS CACHE:
echo    - Chrome/Edge: Navigate to chrome://net-internals/#dns and click "Clear host cache"
echo    - Firefox: Navigate to about:networking#dns and click "Clear DNS Cache"
echo 3. RESTART YOUR COMPUTER - This will clear all DNS caches
echo.
echo ================================================================
echo                        Alternative Access Method
echo ================================================================
echo.
echo If hosts file still doesn't work, you can access directly via IP:
echo   - Frontend: https://127.0.0.1 (with Host header: sellercentral.amazon.com)
echo   - Admin: http://127.0.0.1:3002 or http://admin.sellercentral.amazon.com
echo   - Or use: http://localhost:3000 and http://localhost:3002
echo.
echo ================================================================
echo.
echo Press any key to exit...
set /p dummy=
exit /b 0
