const ARABIC_DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

function computeExpectedExitDate(entryDateISO, holdDays = 4) {
  const start = new Date(`${entryDateISO}T00:00:00Z`);
  const cur = new Date(start);
  let sessionDaysCount = 1; // entry day is Day 1

  while (sessionDaysCount < holdDays) {
    cur.setUTCDate(cur.getUTCDate() + 1);
    const dow = cur.getUTCDay();
    // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu
    if (dow >= 0 && dow <= 4) {
      sessionDaysCount++;
    }
  }

  const yyyy = cur.getUTCFullYear();
  const mm = String(cur.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(cur.getUTCDate()).padStart(2, "0");
  const exitDate = `${yyyy}-${mm}-${dd}`;
  const exitDayName = ARABIC_DAYS[cur.getUTCDay()];

  return { exitDate, exitDayName, tradingDaysTotal: holdDays };
}

// Test Thursday entry: 2026-09-17
const resThu = computeExpectedExitDate("2026-09-17", 4);
console.log("Entry Thursday 2026-09-17 -> Exit on:", resThu.exitDayName, resThu.exitDate);

// Test Sunday entry: 2026-09-20
const resSun = computeExpectedExitDate("2026-09-20", 4);
console.log("Entry Sunday 2026-09-20 -> Exit on:", resSun.exitDayName, resSun.exitDate);
