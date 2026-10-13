' EGX site auto-start (hidden) — launches the watchdog which starts/restarts the site
Set sh = CreateObject("WScript.Shell")
sh.Run """D:\meky-stock-main\meky-stock-main\scripts\egx-autostart.bat""", 0, False
