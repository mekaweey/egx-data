# Daily automation: ensures the site server is running, then fires the
# momentum-weekly runner (candles + scan + exits) via localhost.
# Registered twice: 10:05 (entry snapshot + weekly scan) and 14:40 (EOD candle + exits).
$ErrorActionPreference = 'SilentlyContinue'

# 1) is the site up?
$up = $false
try {
    $r = Invoke-WebRequest -Uri "http://localhost:8090/ping" -UseBasicParsing -TimeoutSec 5
    if ($r.StatusCode -eq 200) { $up = $true }
} catch {}
if (-not $up) {
    try {
        $r2 = Invoke-WebRequest -Uri "http://localhost:8090/" -UseBasicParsing -TimeoutSec 5
        if ($r2.StatusCode -eq 200) { $up = $true }
    } catch {}
}

# 2) if not up: start the dev server detached and wait for it
if (-not $up) {
    Start-Process -FilePath "cmd.exe" -ArgumentList '/c cd /d "D:\meky-stock-main\meky-stock-main" && node scripts\prod-server.cjs' -WindowStyle Hidden
    $waited = 0
    while ($waited -lt 60) {
        Start-Sleep -Seconds 5; $waited += 5
        try {
            $r3 = Invoke-WebRequest -Uri "http://localhost:8090/" -UseBasicParsing -TimeoutSec 5
            if ($r3.StatusCode -eq 200) { $up = $true; break }
        } catch {}
    }
}

# 3) fire the runner (auto = candles + scan + exits + telegram)
try {
    $result = Invoke-RestMethod -Uri "http://localhost:8090/api/public/hooks/momentum-weekly-run?phase=auto" -TimeoutSec 180
    ("{0} runner ok: scan={1} scanner={2}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm'), $result.scan.status, $result.scanner.written) |
        Out-File "D:\meky-stock-main\meky-stock-main\automation\daily_run.log" -Append
} catch {
    ("{0} runner FAILED: {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm'), $_.Exception.Message) |
        Out-File "D:\meky-stock-main\meky-stock-main\automation\daily_run.log" -Append
}
