const RETRYABLE_MESSAGES = [
  "fetch failed",
  "ERR_SSL_PACKET_LENGTH_TOO_LONG",
  "packet length too long",
  "network",
  "terminated",
  "timeout",
];

function getErrorText(error: unknown) {
  const parts: string[] = [];
  if (error instanceof Error) {
    parts.push(error.message);
    const cause = (error as Error & { cause?: unknown }).cause;
    if (cause instanceof Error) parts.push(cause.message, cause.name);
    else if (cause) parts.push(String(cause));
  } else {
    parts.push(String(error));
  }
  return parts.join(" ");
}

function isRetryable(error: unknown) {
  const text = getErrorText(error).toLowerCase();
  return RETRYABLE_MESSAGES.some((message) => text.includes(message.toLowerCase()));
}

export async function withSupabaseRetry<T>(label: string, operation: () => T, attempts = 4): Promise<Awaited<T>> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isRetryable(error) || attempt === attempts) break;
      const waitMs = 250 * attempt;
      console.warn(`[supabase-retry] ${label} failed (${attempt}/${attempts}), retrying in ${waitMs}ms`, error);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }
  throw lastError;
}