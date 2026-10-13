/**
 * Minimal chat-completions helper with free-provider fallback.
 * Priority: Groq/Gemini free keys only. Returns null on failure so callers
 * fail open without consuming paid AI credits.
 */

type Msg = { role: "system" | "user" | "assistant"; content: string };

interface CallOpts {
  messages: Msg[];
  temperature?: number;
  timeoutMs?: number;
}

async function callOne(
  url: string,
  headers: Record<string, string>,
  body: unknown,
  timeoutMs: number,
): Promise<string | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      signal: ctrl.signal,
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const text = json?.choices?.[0]?.message?.content;
    return typeof text === "string" ? text : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function chatWithFallback(opts: CallOpts): Promise<string | null> {
  const { messages, temperature = 0, timeoutMs = 8000 } = opts;

  // 1) Groq (free, fast)
  const grKey = process.env.GROQ_API_KEY;
  if (grKey) {
    const out = await callOne(
      "https://api.groq.com/openai/v1/chat/completions",
      { Authorization: `Bearer ${grKey}` },
      { model: "llama-3.3-70b-versatile", messages, temperature },
      timeoutMs,
    );
    if (out) return out;
  }

  // 2) Gemini direct (free)
  const gKey = process.env.GEMINI_API_KEY;
  if (gKey) {
    const out = await callOne(
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      { Authorization: `Bearer ${gKey}` },
      { model: "gemini-2.5-flash", messages, temperature },
      timeoutMs,
    );
    if (out) return out;
  }

  return null;
}