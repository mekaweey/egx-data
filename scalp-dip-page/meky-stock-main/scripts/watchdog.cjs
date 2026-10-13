// EGX site watchdog — checks localhost:8090 every 5 min; restarts dev server if down.
const { execFile } = require("child_process");
const http = require("http");
const path = require("path");
const ROOT = path.join(__dirname, "..");
function check() {
  const req = http.get("http://localhost:8090/", (r) => { r.resume(); console.log("[watchdog] up"); });
  // a hung server accepts connections but never responds — timeout then kill
  req.setTimeout(10000, () => {
    req.destroy();
    console.log("[watchdog] HUNG (no response in 10s) -> killing listener and restarting");
    try {
      require("child_process").execSync(
        "powershell -NoProfile -Command \"(Get-NetTCPConnection -LocalPort 8090 -State Listen -ErrorAction SilentlyContinue).OwningProcess | Select-Object -Unique | ForEach-Object { Stop-Process -Id $_ -Force }\"",
        { stdio: "ignore" }
      );
    } catch (e) {}
    execFile("node", [path.join("scripts", "prod-server.cjs")], { cwd: ROOT, detached: true, stdio: "ignore" }).unref();
  });
  req.on("error", () => {
    console.log("[watchdog] DOWN -> restarting");
    execFile("node", [path.join("scripts", "prod-server.cjs")], { cwd: ROOT, detached: true, stdio: "ignore" }).unref();
  });
}
check();
setInterval(check, 5 * 60 * 1000);
