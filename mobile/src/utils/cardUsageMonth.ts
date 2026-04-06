import { dateToMonthKey, dateMonthPlusMonths } from "./monthKey";

type Tx = {
  tipo?: string;
  method?: string;
  account?: string;
  data?: string;
  descricao?: string;
  valor?: number;
  installments?: number;
  currentinstallment?: number;
  currentInstallment?: number;
  nextpaymentdate?: string;
  nextPaymentDate?: string;
  status?: string;
};

function currentInstallmentDueMonthKey(t: Tx): string {
  const inst = Math.max(1, t.installments ?? 1);
  const cur = Math.min(
    Math.max(1, t.currentinstallment ?? t.currentInstallment ?? 1),
    inst,
  );
  if (!t.data) return "";
  return dateMonthPlusMonths(t.data, cur - 1);
}

export function creditCardUsageInMonth(
  transactions: Tx[],
  cardId: string,
  monthKey: string,
): number {
  let sum = 0;
  for (const t of transactions) {
    if (t.tipo !== "despesa" || t.method !== "Cartão de Crédito") continue;
    const acc = String(t.account ?? "");
    if (acc !== cardId) continue;
    if (String(t.descricao ?? "").startsWith("Assinatura:")) continue;
    const inst = t.installments ?? 1;
    const amt = Number(t.valor) || 0;
    if (inst <= 1) {
      if (t.data && dateToMonthKey(t.data) === monthKey) sum += amt;
      continue;
    }
    if (t.status === "completed") continue;
    if (currentInstallmentDueMonthKey(t) === monthKey) sum += amt;
  }
  return sum;
}
