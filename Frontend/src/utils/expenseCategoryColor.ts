/** Cor estável por nome de categoria (orçamento) — estilo badge da referência. */
const PALETTE = [
  "#6366f1",
  "#ec4899",
  "#f59e0b",
  "#06b6d4",
  "#64748b",
  "#10b981",
  "#8b5cf6",
  "#94a3b8",
  "#ef4444",
  "#14b8a6",
];

export function expenseCategoryColor(category: string): string {
  const s = (category || "—").trim();
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return PALETTE[h % PALETTE.length];
}
