/**
 * #13 Satellite Data Proxy: استدلال على نشاط الشركة من proxy متاح.
 * في غياب satellite data مباشر، نستخدم volume + price trend كـ proxy للنشاط.
 */
export interface ActivityProxy { score: number; trend: "INCREASING" | "DECREASING" | "STABLE" }

export function estimateActivity(volumes: number[]): ActivityProxy {
  if (volumes.length < 10) return { score: 50, trend: "STABLE" };
  const recent = volumes.slice(-5).reduce((a, b) => a + b, 0) / 5;
  const older = volumes.slice(-20, -5).reduce((a, b) => a + b, 0) / 15;
  const ratio = recent / Math.max(older, 1);
  if (ratio > 1.3) return { score: 80, trend: "INCREASING" };
  if (ratio < 0.7) return { score: 30, trend: "DECREASING" };
  return { score: 55, trend: "STABLE" };
}