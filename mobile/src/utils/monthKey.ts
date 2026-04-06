export function dateToMonthKey(dateStr: string): string {
  const part = String(dateStr).split("T")[0];
  const [y, m] = part.split("-");
  if (!y || !m) return "";
  return `${y}-${m.padStart(2, "0")}`;
}

/** Mês civil após somar meses à data (alinha ao web). */
export function dateMonthPlusMonths(dateStr: string, deltaMonths: number): string {
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

export function isTransactionInMonthKey(
  dateStr: string,
  monthKey: string,
): boolean {
  return dateToMonthKey(dateStr) === monthKey;
}
