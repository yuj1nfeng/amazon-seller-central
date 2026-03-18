# API测试脚本
param(
    [string]$Endpoint = "/api/health",
    [string]$BaseUrl = "http://localhost:3001"
)

$url = "$BaseUrl$Endpoint"

try {
    Write-Host "🧪 测试API: $url" -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri $url -Method Get
    
    if ($response.success) {
        Write-Host "✅ 成功" -ForegroundColor Green
        if ($response.data -and $response.data.Count) {
            Write-Host "📊 返回 $($response.data.Count) 条数据" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️  API返回失败" -ForegroundColor Yellow
    }
    
    return $response
} catch {
    Write-Host "❌ 请求失败: $($_.Exception.Message)" -ForegroundColor Red
}