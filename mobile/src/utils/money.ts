export function parseMoneyInput(raw: string): number {
  const t = raw.trim().replace(/\s/g, "").replace(/[^\d.,-]/g, "");
  if (!t) return NaN;
  const normalized = t.includes(",")
    ? t.replace(/\./g, "").replace(",", ".")
    : t;
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : NaN;
}
