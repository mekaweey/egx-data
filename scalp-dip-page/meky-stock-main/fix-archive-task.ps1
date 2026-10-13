# ============================================================
# PART 1 — Fix SupabaseDailyArchive scheduled task
# RUN THIS IN AN **ADMIN** PowerShell (Run as administrator)!
# Non-admin shells get "ERROR: Access is denied" (verified).
# ============================================================

# 1) Delete the broken task (created Aug 30 with bare 'bun' → not found under SYSTEM)
schtasks /delete /tn "SupabaseDailyArchive" /f

# 2) Recreate with FULL absolute path. Two options — try Option A first:
#
# Option A (user's instruction — the npm .cmd wrapper):
schtasks /create /tn "SupabaseDailyArchive" /tr "\"C:\Users\Mekawey\AppData\Roaming\npm\bun.cmd\" run D:\meky-stock-main\meky-stock-main\scripts\daily-archive.ts --live" /sc daily /st 17:00 /sd 09/02/2026 /ru SYSTEM
#
# Option B (fallback if Option A fails with file-not-found under SYSTEM —
#          the real bun.exe, verified to exist and work):
#   schtasks /create /tn "SupabaseDailyArchive" /tr "\"C:\Users\Mekawey\AppData\Roaming\npm\node_modules\bun\bin\bun.exe\" run D:\meky-stock-main\meky-stock-main\scripts\daily-archive.ts --live" /sc daily /st 17:00 /sd 09/02/2026 /ru SYSTEM
#
# NOTE: if even Option B fails under SYSTEM (no access to user's npm folder),
#   use the project's self-contained .bat instead:
#   schtasks /create /tn "SupabaseDailyArchive" /tr "D:\meky-stock-main\meky-stock-main\run_daily_archive.bat" /sc daily /st 17:00 /sd 09/02/2026 /ru SYSTEM

# 3) Trigger immediately to test:
schtasks /run /tn "SupabaseDailyArchive"

# 4) Wait ~60-90s, then verify:
Start-Sleep -Seconds 90
schtasks /query /tn "SupabaseDailyArchive" /v /fo LIST | findstr /C:"Last Run Time" /C:"Last Result" /C:"Task To Run"

# Expected: "Last Result: 0" = success.
# Then confirm in D:\1All Data\_exports_log.csv that a new row appeared,
# and re-check DB size (should drop as old rows archive).

# 5) REMINDER (GUI-only, cannot be done via schtasks):
#    Open taskschd.msc -> Task Scheduler Library -> SupabaseDailyArchive ->
#    Properties -> Conditions tab -> CHECK
#    "Run task as soon as possible after a scheduled start is missed"
#    (so the 5PM archive still runs if the PC was off/asleep at 17:00).
