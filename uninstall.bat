@echo off
chcp 65001 > nul 2>&1
title Amazon Seller Central - Uninstall
cd /d "%~dp0"
setlocal enabledelayedexpansion

echo.
echo ████████████████████████████████████████████████████████████████
echo ██                                                            ██
echo ██          Amazon Seller Central - Uninstall                 ██
echo ██                                                            ██
echo ████████████████████████████████████████████████████████████████
echo.

REM Confirmation prompt
echo [WARNING] This will completely uninstall Amazon Seller Central!
echo [WARNING] This action cannot be undone.
echo.
echo [INFO] The following actions will be performed:
echo [INFO]   1. Stop all running services
echo [INFO]   2. Remove domain mappings from hosts file
echo [INFO]   3. Delete all application files
echo [INFO]   4. Clear all logs and temporary files
echo.
set /p CONFIRM="Type 'UNINSTALL' to confirm and proceed: "
if /i not "!CONFIRM!"=="UNINSTALL" (
    echo.
    echo [CANCEL] Uninstall cancelled by user.
    echo Press any key to exit...
    pause > nul
    exit /b 0
)

echo.
echo [PROGRESS] Starting uninstallation process...
echo.

REM Step 1: Stop all services
echo [Step 1/5] Stopping all running services...
call :STOP_SERVICES
echo.

REM Step 2: Remove domain mappings from hosts file
echo [Step 2/5] Removing domain mappings from hosts file...
call :REMOVE_HOSTS_ENTRIES
echo.

REM Step 3: Remove certificates if they exist
echo [Step 3/5] Removing SSL certificates...
call :REMOVE_CERTIFICATES
echo.

REM Step 4: Delete application directories
echo [Step 4/5] Deleting application files and directories...
call :DELETE_APPLICATION_FILES
echo.

REM Step 5: Cleanup logs and temporary files
echo [Step 5/5] Cleaning up logs and temporary files...
call :CLEANUP_LOGS
echo.

echo.
echo ████████████████████████████████████████████████████████████████
echo ██                                                            ██
echo ██                    🗑️ Uninstall Complete!                  ██
echo ██                                                            ██
echo ████████████████████████████████████████████████████████████████
echo.
echo [SUCCESS] Amazon Seller Central has been completely uninstalled!
echo [INFO] All application files, configurations, and logs have been removed.
echo [INFO] System is now clean of Amazon Seller Central.
echo.
echo Press any key to exit...
pause > nul
exit /b 0

:STOP_SERVICES
echo [SUBTASK] Stopping services on ports 3000, 3001, 3002, 80, 443...

REM Kill processes on specific ports
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000 " ^| findstr "LISTENING" 2^>nul') do (
    if "%%a" neq "" (
        echo [CLEAN] Stopping process on port 3000 (PID: %%a)
        taskkill /f /pid %%a >nul 2>&1
    )
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3001 " ^| findstr "LISTENING" 2^>nul') do (
    if "%%a" neq "" (
        echo [CLEAN] Stopping process on port 3001 (PID: %%a)
        taskkill /f /pid %%a >nul 2>&1
    )
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3002 " ^| findstr "LISTENING" 2^>nul') do (
    if "%%a" neq "" (
        echo [CLEAN] Stopping process on port 3002 (PID: %%a)
        taskkill /f /pid %%a >nul 2>&1
    )
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":80 " ^| findstr "LISTENING" 2^>nul') do (
    if "%%a" neq "" (
        echo [CLEAN] Stopping process on port 80 (PID: %%a)
        taskkill /f /pid %%a >nul 2>&1
    )
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":443 " ^| findstr "LISTENING" 2^>nul') do (
    if "%%a" neq "" (
        echo [CLEAN] Stopping process on port 443 (PID: %%a)
        taskkill /f /pid %%a >nul 2>&1
    )
)

REM Kill any remaining serve processes
tasklist /fi "imagename eq serve.exe" 2>nul | find /i "serve.exe" >nul
if !errorlevel! equ 0 (
    echo [CLEAN] Stopping serve processes...
    taskkill /f /im serve.exe >nul 2>&1
)

REM Kill any node processes related to the application
tasklist /fi "imagename eq node.exe" /fo csv 2>nul | find /i "node.exe" >nul
if !errorlevel! equ 0 (
    echo [CLEAN] Stopping node processes...
    tasklist /fi "imagename eq node.exe" /fo csv /nh 2>nul | find /i "%~dp0" >nul
    if !errorlevel! equ 0 (
        taskkill /f /im node.exe >nul 2>&1
    )
)

echo [OK] All services have been stopped
goto :EOF

:REMOVE_HOSTS_ENTRIES
REM Check if running with administrator privileges
net session >nul 2>&1
if !errorlevel! neq 0 (
    echo [ERROR] Administrator privileges required to modify hosts file
    echo [INFO] Please run this script as Administrator to remove hosts entries
    echo [INFO] Or manually remove the following lines from C:\Windows\System32\drivers\etc\hosts:
    echo [INFO]   # Amazon Seller Central Clone - Domain Mapping
    echo [INFO]   127.0.0.1 sellercentral.amazon.com
    echo [INFO]   127.0.0.1 admin.sellercentral.amazon.com
    goto :EOF
)

REM Backup hosts file before modification
copy "%WINDIR%\System32\drivers\etc\hosts" "%WINDIR%\System32\drivers\etc\hosts.backup.uninstall" >nul 2>&1
if !errorlevel! equ 0 (
    echo [OK] Hosts file backed up to hosts.backup.uninstall
) else (
    echo [WARN] Could not backup hosts file
)

REM Create temporary file without Amazon Seller Central entries
set TEMP_HOSTS=%TEMP%\hosts_temp_%RANDOM%.txt
echo [INFO] Creating temporary hosts file without Amazon Seller Central entries...

REM Read hosts file and exclude Amazon Seller Central entries
for /f "usebackq delims=" %%a in ("%WINDIR%\System32\drivers\etc\hosts") do (
    set "line=%%a"
    if not "!line!" == "# Amazon Seller Central Clone - Domain Mapping" (
        if not "!line!" == "127.0.0.1 sellercentral.amazon.com" (
            if not "!line!" == "127.0.0.1 admin.sellercentral.amazon.com" (
                echo !line! >> "!TEMP_HOSTS!"
            )
        )
    )
)

REM Replace original hosts file with cleaned version
move /y "!TEMP_HOSTS!" "%WINDIR%\System32\drivers\etc\hosts" >nul 2>&1
if !errorlevel! equ 0 (
    echo [OK] Amazon Seller Central domain mappings removed from hosts file
) else (
    echo [ERROR] Failed to update hosts file
    echo [INFO] You may need to manually remove Amazon Seller Central entries from hosts file
)

REM Clean up temp file if it still exists
if exist "!TEMP_HOSTS!" (
    del "!TEMP_HOSTS!" >nul 2>&1
)

goto :EOF

:REMOVE_CERTIFICATES
REM Check if running with administrator privileges
net session >nul 2>&1
if !errorlevel! neq 0 (
    echo [INFO] Skipping certificate removal (requires Administrator privileges)
    goto :EOF
)

echo [INFO] Looking for self-signed certificates to remove...
REM Try to remove any certificates related to sellercentral.amazon.com
certutil -user -delstore "My" "sellercentral.amazon.com" >nul 2>&1
if !errorlevel! equ 0 (
    echo [OK] Removed sellercentral.amazon.com certificate from user store
) else (
    echo [INFO] No sellercentral.amazon.com certificate found in user store
)

certutil -delstore "My" "sellercentral.amazon.com" >nul 2>&1
if !errorlevel! equ 0 (
    echo [OK] Removed sellercentral.amazon.com certificate from machine store
) else (
    echo [INFO] No sellercentral.amazon.com certificate found in machine store
)

goto :EOF

:DELETE_APPLICATION_FILES
echo [INFO] Deleting application directories...

REM Delete application directories
if exist "frontend" (
    echo [DELETE] Removing frontend directory...
    rmdir /s /q "frontend" >nul 2>&1
    if !errorlevel! equ 0 (
        echo [OK] Frontend directory deleted
    ) else (
        echo [ERROR] Could not delete frontend directory
    )
)

if exist "backend" (
    echo [DELETE] Removing backend directory...
    rmdir /s /q "backend" >nul 2>&1
    if !errorlevel! equ 0 (
        echo [OK] Backend directory deleted
    ) else (
        echo [ERROR] Could not delete backend directory
    )
)

if exist "backend-admin" (
    echo [DELETE] Removing backend-admin directory...
    rmdir /s /q "backend-admin" >nul 2>&1
    if !errorlevel! equ 0 (
        echo [OK] Backend-admin directory deleted
    ) else (
        echo [ERROR] Could not delete backend-admin directory
    )
)

if exist "tools" (
    echo [DELETE] Removing tools directory...
    rmdir /s /q "tools" >nul 2>&1
    if !errorlevel! equ 0 (
        echo [OK] Tools directory deleted
    ) else (
        echo [ERROR] Could not delete tools directory
    )
)

if exist "certs" (
    echo [DELETE] Removing certs directory...
    rmdir /s /q "certs" >nul 2>&1
    if !errorlevel! equ 0 (
        echo [OK] Certs directory deleted
    ) else (
        echo [ERROR] Could not delete certs directory
    )
)

if exist "node_modules" (
    echo [DELETE] Removing node_modules directory...
    rmdir /s /q "node_modules" >nul 2>&1
    if !errorlevel! equ 0 (
        echo [OK] Root node_modules directory deleted
    ) else (
        echo [ERROR] Could not delete root node_modules directory
    )
)

goto :EOF

:CLEANUP_LOGS
echo [INFO] Cleaning up log files...

REM Delete log files created by the application
if exist "backend.log" (
    del "backend.log" >nul 2>&1
    echo [OK] Deleted backend.log
)

if exist "domain-server.log" (
    del "domain-server.log" >nul 2>&1
    echo [OK] Deleted domain-server.log
)

REM Delete any other log files that might have been created
for %%f in (*.log) do (
    if exist "%%f" (
        del "%%f" >nul 2>&1
        echo [OK] Deleted %%f
    )
)

REM Clean up any temporary files
if exist "temp" (
    rmdir /s /q "temp" >nul 2>&1
    if !errorlevel! equ 0 (
        echo [OK] Deleted temp directory
    )
)

if exist "tmp" (
    rmdir /s /q "tmp" >nul 2>&1
    if !errorlevel! equ 0 (
        echo [OK] Deleted tmp directory
    )
)

echo [OK] Log cleanup completed
goto :EOF