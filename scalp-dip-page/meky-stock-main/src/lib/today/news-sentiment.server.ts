import Firecrawl from "@mendable/firecrawl-js";

export type NewsSignal = {
  score: number; // -1 (very bearish) .. +1 (very bullish), 0 = neutral / no news
  count: number;
  headlines: string[];
  blocked: boolean; // true = strong negative news, skip the trade
};

/** Search recent Arabic/English news about a stock symbol and score sentiment. */
export async function getNewsSentiment(symbol: string, nameAr: string | null): Promise<NewsSignal> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  const lovableKey = process.env.LOVABLE_API_KEY;
  if (!apiKey || !lovableKey) {
    return { score: 0, count: 0, headlines: [], blocked: false };
  }

  try {
    const fc = new Firecrawl({ apiKey });
    const query = nameAr ? `${nameAr} سهم البورصة المصرية` : `${symbol} EGX stock`;
    const res: any = await fc.search(query, { limit: 5, tbs: "qdr:d" });

    const items: any[] = res?.web ?? res?.data ?? [];
    const headlines = items
      .map((r) => `${r.title ?? ""} — ${r.description ?? ""}`.trim())
      .filter((h) => h.length > 5)
      .slice(0, 5);

    if (!headlines.length) return { score: 0, count: 0, headlines: [], blocked: false };

    // Score with Lovable AI Gateway (cheap model)
    const prompt = `حلّل أخبار سهم ${nameAr ?? symbol} ده وأرجع JSON فقط بهذا الشكل:
{"score": <رقم من -1 إلى +1>, "reason": "<سبب مختصر>"}

score = +1 خبر ممتاز جدا (نتائج قوية، عقود ضخمة، توزيعات)
score = +0.5 خبر إيجابي
score = 0 محايد أو لا علاقة بالسهم
score = -0.5 خبر سلبي
score = -1 خبر سلبي جدا (خسائر، شُبهات، تعليق تداول، تحقيقات)

الأخبار:
${headlines.map((h, i) => `${i + 1}. ${h}`).join("\n")}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${lovableKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!aiRes.ok) return { score: 0, count: headlines.length, headlines, blocked: false };

    const aiData: any = await aiRes.json();
    const text: string = aiData?.choices?.[0]?.message?.content ?? "";
    const m = text.match(/\{[\s\S]*?\}/);
    if (!m) return { score: 0, count: headlines.length, headlines, blocked: false };

    const parsed = JSON.parse(m[0]);
    const score = Math.max(-1, Math.min(1, Number(parsed.score) || 0));
    return {
      score,
      count: headlines.length,
      headlines,
      blocked: score <= -0.5, // hard block on strongly negative news
    };
  } catch (err) {
    console.error("News sentiment failed for", symbol, err);
    return { score: 0, count: 0, headlines: [], blocked: false };
  }
}