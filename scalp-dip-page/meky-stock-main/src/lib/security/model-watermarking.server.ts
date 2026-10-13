/**
 * Model Watermarking & Tamper Detection.
 * Computes a deterministic fingerprint of the model weights so tampering
 * can be detected at load time.
 */
function fnv1a(buf: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < buf.length; i++) {
    h ^= buf.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

export function fingerprint(weights: number[], modelName: string): string {
  const buf = modelName + "|" + weights.map((w) => w.toFixed(8)).join(",");
  return fnv1a(buf);
}

/** Embeds a trigger pattern that always maps to a known output (backdoor watermark). */
export interface Watermark {
  triggerInput: number[];
  expectedOutput: number;
  modelFingerprint: string;
}

export function createWatermark(weights: number[], modelName: string, triggerInput: number[], expectedOutput: number): Watermark {
  return {
    triggerInput,
    expectedOutput,
    modelFingerprint: fingerprint(weights, modelName),
  };
}

export function verifyWatermark(
  watermark: Watermark,
  currentWeights: number[],
  modelName: string,
  predict: (input: number[]) => number,
  tolerance: number = 0.01,
): { fingerprintMatches: boolean; watermarkIntact: boolean } {
  const fp = fingerprint(currentWeights, modelName);
  const prediction = predict(watermark.triggerInput);
  return {
    fingerprintMatches: fp === watermark.modelFingerprint,
    watermarkIntact: Math.abs(prediction - watermark.expectedOutput) <= tolerance,
  };
}