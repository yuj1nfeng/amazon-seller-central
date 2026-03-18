# Add FQDN entries to hosts file
$hostsPath = "$env:WINDIR\System32\drivers\etc\hosts"
$content = Get-Content $hostsPath -Raw

# Add FQDN entries (with trailing dot)
$content += "`r`n127.0.0.1 sellercentral.amazon.com.`r`n"
$content += "127.0.0.1 admin.sellercentral.amazon.com.`r`n"

# Write back
$content | Out-File -FilePath $hostsPath -Encoding UTF8 -NoNewline

Write-Host "FQDN entries added!"
Write-Host "Current entries:"
Get-Content $hostsPath | Select-String "sellercentral"
