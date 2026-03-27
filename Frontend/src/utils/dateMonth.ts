/** Parse YYYY-MM-DD como data local (evita deslocamento por UTC). */
function parseLocalDate(dateStr: string): Date {
  const part = dateStr.split("T")[0];
  const [y, m, d] = part.split("-").map((n) => parseInt(n, 10));
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    return new Date(dateStr);
  }
  return new Date(y, m - 1, d);
}

/** Lançamento no mês civil atual (relógio local). */
export function isDateInCurrentMonth(dateStr: string, now = new Date()): boolean {
  const d = parseLocalDate(dateStr);
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

/** Nome do mês atual para rótulos (ex.: "março de 2026"). */
export function currentMonthLabel(now = new Date()): string {
  return now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

/** Chave YYYY-MM do mês civil atual (local). */
export function getCurrentMonthKey(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** Chave YYYY-MM do mês civil anterior (local). */
export function getPreviousMonthKey(now = new Date()): string {
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Últimos N meses em ordem cronológica (mais antigo → mais recente). */
export function getLastNMonthKeys(n: number, now = new Date()): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

/** Rótulo curto (ex.: "mar.") a partir de YYYY-MM. */
export function shortMonthLabelFromKey(ym: string): string {
  const [y, m] = ym.split("-").map((x) => parseInt(x, 10));
  if (!Number.isFinite(y) || !Number.isFinite(m)) return ym;
  return new Date(y, m - 1, 1).toLocaleDateString("pt-BR", { month: "short" });
}
