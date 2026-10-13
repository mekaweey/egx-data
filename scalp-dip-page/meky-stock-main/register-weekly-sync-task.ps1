# Registers local scheduled tasks for the EGX market sync (free, no extension).
# Task 1: EOD candle — Sun-Thu 14:45 Cairo (after the 14:30 close)
# Task 2: Sunday entry snapshot — 10:10 (after the 10:00 open)
$node = "D:\Node-v24.19.0\node.exe"
$script = "D:\meky-stock-main\meky-stock-main\tv_market_sync.cjs"
$workdir = "D:\meky-stock-main\meky-stock-main"

if (-not (Test-Path $node)) { Write-Host "node.exe not found at $node"; exit 1 }
if (-not (Test-Path $script)) { Write-Host "sync script not found at $script"; exit 1 }

$action = New-ScheduledTaskAction -Execute $node -Argument "`"$script`"" -WorkingDirectory $workdir
$trigger1 = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday,Monday,Tuesday,Wednesday,Thursday -At 14:45
Register-ScheduledTask -TaskName "EGX_Market_Sync_EOD" -Action $action -Trigger $trigger1 -Description "Momentum-weekly: daily candle sync after EGX close" -Force | Out-Null

$trigger2 = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At 10:10
Register-ScheduledTask -TaskName "EGX_Market_Sync_SundayOpen" -Action $action -Trigger $trigger2 -Description "Momentum-weekly: Sunday entry open snapshot" -Force | Out-Null

Write-Host "registered tasks:"
Get-ScheduledTask -TaskName "EGX_Market_Sync_*" | Select-Object TaskName, State | Format-Table -AutoSize | Out-String | Write-Host
