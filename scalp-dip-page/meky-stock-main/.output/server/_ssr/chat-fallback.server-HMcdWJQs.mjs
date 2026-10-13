async function callOne(url, headers, body, timeoutMs) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      signal: ctrl.signal,
      body: JSON.stringify(body)
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
async function chatWithFallback(opts) {
  const { messages, temperature = 0, timeoutMs = 8e3 } = opts;
  const grKey = process.env.GROQ_API_KEY;
  if (grKey) {
    const out = await callOne(
      "https://api.groq.com/openai/v1/chat/completions",
      { Authorization: `Bearer ${grKey}` },
      { model: "llama-3.3-70b-versatile", messages, temperature },
      timeoutMs
    );
    if (out) return out;
  }
  const gKey = process.env.GEMINI_API_KEY;
  if (gKey) {
    const out = await callOne(
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      { Authorization: `Bearer ${gKey}` },
      { model: "gemini-2.5-flash", messages, temperature },
      timeoutMs
    );
    if (out) return out;
  }
  return null;
}
export {
  chatWithFallback as c
};
