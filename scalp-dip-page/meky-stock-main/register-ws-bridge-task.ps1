# Registers the TV websocket bridge (one persistent connection, whole market).
# Runs Sun-Thu 09:50 Cairo; the script itself waits for 09:50, streams until
# 14:36, then exits. Supabase 5s bridge stays the always-on primary.
# Run ONCE as Administrator: right-click -> Run with PowerShell as admin.
$node = "D:\Node-v24.19.0\node.exe"
if (-not (Test-Path $node)) { $node = (Get-Command node -ErrorAction SilentlyContinue).Source }
if (-not $node) { Write-Host "node not found"; exit 1 }
$script = "D:\meky-stock-main\meky-stock-main\bt\tv_ws_bridge.cjs"
$workdir = "D:\meky-stock-main\meky-stock-main\bt"
if (-not (Test-Path $script)) { Write-Host "bridge script not found"; exit 1 }
$action = New-ScheduledTaskAction -Execute $node -Argument "`"$script`"" -WorkingDirectory $workdir
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday,Monday,Tuesday,Wednesday,Thursday -At 09:50
Register-ScheduledTask -TaskName "EGX_WS_Bridge" -Action $action -Trigger $trigger -Description "TV websocket streamer Sun-Thu session" -Force | Out-Null
Write-Host "registered:"
Get-ScheduledTask -TaskName "EGX_WS_Bridge" | Select-Object TaskName, State | Format-Table -AutoSize | Out-String | Write-Host
