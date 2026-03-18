# Fix hosts file script
$hostsPath = "$env:WINDIR\System32\drivers\etc\hosts"
$content = Get-Content $hostsPath -Raw

# Remove "ECHO is off." line (added by batch script bug)
$content = $content -replace '\r?\nECHO is off\.\r?\n', "`r`n"

# Fix trailing spaces on sellercentral lines
$content = $content -replace '127\.0\.0\.1 sellercentral\.amazon\.com\s+\r?\n', "127.0.0.1 sellercentral.amazon.com`r`n"
$content = $content -replace '127\.0\.0\.1 admin\.sellercentral\.amazon\.com\s+\r?\n', "127.0.0.1 admin.sellercentral.amazon.com`r`n"

# Write back
$content | Out-File -FilePath $hostsPath -Encoding UTF8 -NoNewline

Write-Host "Hosts file fixed!"
Write-Host "Current entries:"
Get-Content $hostsPath | Select-String "sellercentral"
