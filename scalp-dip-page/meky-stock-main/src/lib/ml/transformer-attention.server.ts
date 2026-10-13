/**
 * #1 Transformer-based Price Prediction (lite)
 * Self-attention على آخر N شمعة لاكتشاف العلاقات بعيدة المدى بين الأسعار.
 * تنفيذ خفيف بدون مكتبات (single-head scaled dot-product attention).
 */
export interface AttentionResult {
  prediction: number; // متوقع التغير % لليوم التالي
  confidence: number; // 0-100
  topInfluencers: { lag: number; weight: number }[];
}

function softmax(arr: number[]): number[] {
  const max = Math.max(...arr);
  const exps = arr.map((x) => Math.exp(x - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

export function transformerPredict(closes: number[], window = 20): AttentionResult {
  if (closes.length < window + 1) {
    return { prediction: 0, confidence: 0, topInfluencers: [] };
  }
  const slice = closes.slice(-window);
  const returns = slice.slice(1).map((c, i) => (c - slice[i]) / slice[i]);
  const query = returns[returns.length - 1];
  const dk = Math.sqrt(returns.length);
  const scores = returns.map((r) => (r * query) / dk);
  const weights = softmax(scores);
  const prediction = weights.reduce((acc, w, i) => acc + w * returns[i], 0) * 100;
  const topInfluencers = weights
    .map((w, i) => ({ lag: returns.length - i, weight: w }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3);
  const confidence = Math.min(100, Math.abs(prediction) * 50 + 40);
  return { prediction, confidence, topInfluencers };
}