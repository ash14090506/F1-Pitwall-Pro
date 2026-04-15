$SleepSeconds = 15

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "   Git Auto-Push Watcher Started  " -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Monitoring directory: $(Get-Location)"
Write-Host "Checking for file changes every $SleepSeconds seconds."
Write-Host "Press Ctrl+C to stop watching."
Write-Host "==================================" -ForegroundColor Cyan

while ($true) {
    # Check if there are any changes (modified, added, deleted, untracked) respecting .gitignore
    $status = git status --porcelain
    
    if (![string]::IsNullOrWhiteSpace($status)) {
        Write-Host ""
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Changes detected. Waiting 3 seconds to let file saves finish..." -ForegroundColor Yellow
        Start-Sleep -Seconds 3
        
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Adding changes..." -ForegroundColor DarkGray
        git add .
        
        $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Committing..." -ForegroundColor DarkGray
        # Redirecting output to $null to keep the terminal slightly cleaner
        git commit -m "Auto-update: $timestamp" | Out-Null
        
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Pushing to GitHub..." -ForegroundColor DarkGray
        $pushResult = git push 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Successfully pushed to remote!" -ForegroundColor Green
        } else {
            Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Push failed. Check your network or permissions." -ForegroundColor Red
            Write-Host $pushResult -ForegroundColor Red
        }
        
        Write-Host ""
        Write-Host "Resuming watch... (Press Ctrl+C to stop)" -ForegroundColor Cyan
    }
    
    Start-Sleep -Seconds $SleepSeconds
}
