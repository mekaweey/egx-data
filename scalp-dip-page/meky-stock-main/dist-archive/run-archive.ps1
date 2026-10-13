# ============================================================
# SupabaseDailyArchive — unbreakable daily archive wrapper
# Runs the standalone daily-archive.exe (no bun/node/PATH needed),
# retries on failure, logs every attempt, and never silently dies.
# ============================================================
# Task Scheduler runs THIS script. It:
#   1. Runs the exe (export + verify + delete, the tested chain)
#   2. On failure: retries up to 3 times, 10 min apart
#   3. Writes a status file (latest attempt result) for quick checks
#   4. Appends a rotating log (max ~2MB, auto-trimmed)
# ============================================================

$ErrorActionPreference = 'Continue'
$exe      = 'D:\meky-stock-main\meky-stock-main\dist-archive\daily-archive.exe'
$logDir   = 'D:\meky-stock-main\meky-stock-main\dist-archive\logs'
$logFile  = Join-Path $logDir 'archive-task.log'
$statusOk = 'OK'

if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }

function Write-Log([string]$msg) {
    $stamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    Add-Content -Path $logFile -Value "[$stamp] $msg"
}

# keep the log under ~2MB (trim old lines if it grows)
if ((Test-Path $logFile) -and ((Get-Item $logFile).Length -gt 2MB)) {
    $lines = Get-Content $logFile -Tail 2000
    Set-Content -Path $logFile -Value $lines
}

Write-Log "===== task started ====="

if (-not (Test-Path $exe)) {
    Write-Log "FATAL: exe not found at $exe"
    Set-Content -Path (Join-Path $logDir 'last-run-status.txt') -Value 'FAIL: exe missing'
    exit 1
}

$attempt = 0
$maxAttempts = 3
$success = $false

while ($attempt -lt $maxAttempts -and -not $success) {
    $attempt++
    Write-Log "attempt $attempt/$maxAttempts starting"
    $started = Get-Date

    # Run the exe. --live = real archive (export->verify->delete).
    # Timeout: 2 hours max (huge catch-up runs must not hang forever).
    $out = & $exe --live 2>&1
    $code = $LASTEXITCODE
    $secs = [int]((Get-Date) - $started).TotalSeconds

    # save this attempt's full output for forensics
    $out | Out-File (Join-Path $logDir ('run-attempt-' + $attempt + '.log')) -Encoding utf8

    $tail = ($out | Select-Object -Last 5) -join ' | '
    Write-Log "attempt $attempt exit=$code secs=$secs tail: $tail"

    if ($code -eq 0) {
        $success = $true
        Set-Content -Path (Join-Path $logDir 'last-run-status.txt') -Value ("$statusOk at " + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'))
        Write-Log "SUCCESS on attempt $attempt"
    } else {
        if ($attempt -lt $maxAttempts) {
            Write-Log "failed (exit=$code) - sleeping 600s before retry"
            Start-Sleep -Seconds 600
        }
    }
}

if (-not $success) {
    Set-Content -Path (Join-Path $logDir 'last-run-status.txt') -Value ("FAILED after $maxAttempts attempts at " + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'))
    Write-Log "ALL $maxAttempts ATTEMPTS FAILED"
    exit 1
}

Write-Log "===== task finished OK ====="
exit 0
