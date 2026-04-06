/** YYYY-MM a partir de data ISO (YYYY-MM-DD). */
export function dateToMonthKey(dateStr: string): string {
  const part = String(dateStr).split("T")[0];
  const [y, m] = part.split("-");
  if (!y || !m) return "";
  return `${y}-${m.padStart(2, "0")}`;
}

/**
 * Mês civil (YYYY-MM) após somar `deltaMonths` ao mês da data (calendário local).
 * Ex.: compra em nov/2025, parcela 5 → delta 4 → mar/2026.
 */
export function dateMonthPlusMonths(
  dateStr: string,
  deltaMonths: number,
): string {
  const part = String(dateStr).split("T")[0];
  const [ys, ms] = part.split("-");
  const y = parseInt(ys, 10);
  const m = parseInt(ms, 10);
  if (!Number.isFinite(y) || !Number.isFinite(m)) return "";
  const d = new Date(y, m - 1 + deltaMonths, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function getCurrentMonthKey(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function shiftMonthKey(ym: string, delta: number): string {
  const [y, m] = ym.split("-").map((x) => parseInt(x, 10));
  if (!Number.isFinite(y) || !Number.isFinite(m)) return getCurrentMonthKey();
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function formatMonthKeyLabel(ym: string): string {
  const [y, m] = ym.split("-").map((x) => parseInt(x, 10));
  if (!Number.isFinite(y) || !Number.isFinite(m)) return ym;
  return new Date(y, m - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

/** Lançamento (receita/despesa) entra no orçamento do mês civil da data. */
export function isTransactionInMonthKey(
  dateStr: string,
  monthKey: string,
): boolean {
  return dateToMonthKey(dateStr) === monthKey;
}
