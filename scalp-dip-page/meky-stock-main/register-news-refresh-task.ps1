# Daily Mubasher refresh (pulse incremental + per-symbol page-1).
# Run ONCE as Administrator: right-click -> Run with PowerShell as admin.
# Afterwards runs alone every day 17:30 Cairo, no intervention.
$node = "D:\Node-v24.19.0\node.exe"
if (-not (Test-Path $node)) { $node = (Get-Command node -ErrorAction SilentlyContinue).Source }
if (-not $node) { Write-Host "node not found"; exit 1 }
$workdir = "D:\meky-stock-main\meky-stock-main"
$action1 = New-ScheduledTaskAction -Execute $node -Argument "`"mb_incremental_20261006.cjs`"" -WorkingDirectory $workdir
$action2 = New-ScheduledTaskAction -Execute $node -Argument "`"mb_symbol_refresh_20261006.cjs`"" -WorkingDirectory $workdir
$trigger = New-ScheduledTaskTrigger -Daily -At 17:30
Register-ScheduledTask -TaskName "EGX_News_Refresh" -Action @($action1, $action2) -Trigger $trigger -Description "Daily Mubasher news refresh (pulse + per-symbol)" -Force | Out-Null
Write-Host "registered:"
Get-ScheduledTask -TaskName "EGX_News_Refresh" | Select-Object TaskName, State | Format-Table -AutoSize | Out-String | Write-Host
