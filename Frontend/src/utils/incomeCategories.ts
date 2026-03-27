/** Categorias fixas de receita (aba Receitas, KPI e dashboard). */
export const INCOME_CATEGORIES = [
  "Salário",
  "Freelance",
  "Investimentos",
  "Presente",
  "Outros",
] as const;

export type IncomeCategoryId = (typeof INCOME_CATEGORIES)[number];

/** Exibe no UI; dados antigos ou fora da lista caem em um rótulo legível. */
export function normalizeIncomeCategory(
  raw: string | undefined | null,
  method?: string,
): string {
  const trimmed = raw != null ? String(raw).trim() : "";
  const lowerTrim = trimmed.toLowerCase();
  /** Legado: receita só com método Salário e categoria vazia / genérica */
  if (
    method === "Salário" &&
    (!trimmed || lowerTrim === "sem categoria" || lowerTrim === "salário")
  ) {
    return "Salário";
  }
  if (!trimmed || lowerTrim === "sem categoria") return "Outros";
  const t = trimmed;
  const lower = t.toLowerCase();
  const aliases: Record<string, IncomeCategoryId> = {
    salário: "Salário",
    salario: "Salário",
    freelance: "Freelance",
    investimentos: "Investimentos",
    investimento: "Investimentos",
    presente: "Presente",
    presentes: "Presente",
    outros: "Outros",
    outro: "Outros",
  };
  if (aliases[lower]) return aliases[lower];
  const exact = INCOME_CATEGORIES.find((c) => c.toLowerCase() === lower);
  if (exact) return exact;
  return t;
}

export function isIncomeRecurringCategory(
  category: string | undefined | null,
  method?: string,
): boolean {
  return normalizeIncomeCategory(category, method) === "Salário";
}

/** Valor válido para o select de receita (dados antigos caem em Outros). */
export function toIncomeCategorySelectValue(
  raw: string | undefined | null,
  method?: string,
): IncomeCategoryId {
  const n = normalizeIncomeCategory(raw, method);
  return (INCOME_CATEGORIES as readonly string[]).includes(n)
    ? (n as IncomeCategoryId)
    : "Outros";
}
