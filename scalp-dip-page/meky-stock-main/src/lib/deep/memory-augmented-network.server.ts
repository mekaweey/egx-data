/**
 * Memory-Augmented Network (lightweight DNC-style).
 */
export interface MemoryEntry {
  key: number[];
  value: number;
  ts: number;
}

export interface MemoryBank {
  entries: MemoryEntry[];
  capacity: number;
}

export function createBank(capacity: number = 1024): MemoryBank {
  return { entries: [], capacity };
}

export function write(bank: MemoryBank, entry: MemoryEntry): MemoryBank {
  const entries = [...bank.entries, entry];
  if (entries.length > bank.capacity) entries.shift();
  return { ...bank, entries };
}

function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

export function read(bank: MemoryBank, query: number[], topK: number = 5) {
  const scored = bank.entries.map((e) => ({ e, score: cosine(query, e.key) }));
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, topK);
  const totalScore = top.reduce((s, t) => s + Math.max(0, t.score), 0);
  const prediction = totalScore === 0
    ? 0
    : top.reduce((s, t) => s + Math.max(0, t.score) * t.e.value, 0) / totalScore;
  return { prediction, neighbors: top };
}