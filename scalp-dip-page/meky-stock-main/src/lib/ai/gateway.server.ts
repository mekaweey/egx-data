import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/**
 * AI Gateway provider selection.
 *
 * The stock update pipeline must not depend on paid AI credits. Prefer the
 * configured free providers, and use the managed gateway only when no free
 * provider exists or a caller explicitly allows paid fallback.
 */
export type Provider = "gemini" | "groq" | "lovable";

function pickProvider(): Provider {
  if (process.env.GROQ_API_KEY) return "groq";
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.LOVABLE_API_KEY) return "lovable";
  return "lovable";
}

export function getAiGateway(providerOverride?: Provider) {
  const provider = providerOverride ?? pickProvider();
  if (provider === "gemini") {
    return createOpenAICompatible({
      name: "gemini",
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
      headers: { Authorization: `Bearer ${process.env.GEMINI_API_KEY}` },
    });
  }
  if (provider === "groq") {
    return createOpenAICompatible({
      name: "groq",
      baseURL: "https://api.groq.com/openai/v1",
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    });
  }
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("No AI provider key configured");
  return createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: {
      "Lovable-API-Key": key,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
  });
}

/** Model identifier matches whichever provider is active. */
export function getAiModel(provider: Provider): string {
  return provider === "lovable"
    ? "google/gemini-3-flash-preview"
    : provider === "groq"
    ? "llama-3.3-70b-versatile"
    : "gemini-2.5-flash";
}

export function getAiProviderPlan(options: { allowPaidFallback?: boolean } = {}): Array<{ provider: Provider; model: string }> {
  const plan: Provider[] = [];
  if (process.env.GROQ_API_KEY) plan.push("groq");
  if (process.env.GEMINI_API_KEY) plan.push("gemini");
  if (process.env.LOVABLE_API_KEY && (options.allowPaidFallback || plan.length === 0)) plan.push("lovable");
  return plan.map((provider) => ({ provider, model: getAiModel(provider) }));
}

export const AI_MODEL: string = getAiModel(pickProvider());