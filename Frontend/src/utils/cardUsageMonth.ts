import type { Transaction } from "./types";
import type { Subscription } from "./subscriptionsApi";
import { dateToMonthKey, dateMonthPlusMonths } from "./monthKey";

/** Mês civil em que a parcela atual (1-based) vence: compra + (parcela − 1) meses. */
export function currentInstallmentDueMonthKey(t: Transaction): string {
  const inst = Math.max(1, t.installments ?? 1);
  const cur = Math.min(Math.max(1, t.currentInstallment ?? 1), inst);
  return dateMonthPlusMonths(t.date, cur - 1);
}

/**
 * Uso do cartão no mês civil de referência:
 * - À vista (1x): conta no mês da data da compra.
 * - Parcelado pendente: valor da parcela no mês em que ela vence (data da compra + (atual − 1)).
 * Assinaturas: valor mensal conta em todo mês (recorrente).
 */
export function creditCardUsageInMonth(
  transactions: Transaction[],
  cardId: string,
  monthKey: string,
): number {
  let sum = 0;
  for (const t of transactions) {
    if (t.type !== "expense" || t.method !== "Cartão de Crédito") continue;
    if (t.account !== cardId) continue;
    if (t.description?.startsWith("Assinatura:")) continue;
    const inst = t.installments ?? 1;
    if (inst <= 1) {
      if (dateToMonthKey(t.date) === monthKey) sum += t.amount || 0;
      continue;
    }
    if (t.status === "completed") continue;
    const amt = t.amount || 0;
    const dueMonth = currentInstallmentDueMonthKey(t);
    if (dueMonth === monthKey) sum += amt;
  }
  return sum;
}

export function subscriptionMonthlyTotalForCard(
  subscriptions: Subscription[],
  cardId: string,
): number {
  return subscriptions
    .filter((s) => s.cardId === cardId)
    .reduce((a, s) => a + (s.amount || 0), 0);
}

/**
 * Parcela pendente cuja parcela atual vence no mês civil indicado
 * (mês da compra + (currentInstallment − 1)), alinhado a `creditCardUsageInMonth`.
 */
export function pendingInstallmentDueInMonth(
  t: Transaction,
  monthKey: string,
): boolean {
  if (t.type !== "expense" || t.status !== "pending") return false;
  const inst = t.installments ?? 1;
  if (inst <= 1) return false;
  const cur = t.currentInstallment ?? 1;
  if (cur > inst) return false;
  return currentInstallmentDueMonthKey(t) === monthKey;
}

function installmentDedupeKey(t: Transaction): string {
  const desc = (t.description || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  const inst = t.installments ?? 1;
  const total =
    t.totalAmount != null && t.totalAmount > 0
      ? t.totalAmount
      : (t.amount || 0) * inst;
  const perCents = inst > 0 ? Math.round((total / inst) * 100) : 0;
  return `${desc}|${inst}|${t.account}|${perCents}`;
}

/**
 * Uma linha por compra parcelada “ativa” no mês: remove duplicatas de importação
 * (mesmo texto, cartão, N parcelas e valor) ficando com a menor `currentInstallment`.
 */
export function dedupePendingInstallmentsForMonth(
  transactions: Transaction[],
  monthKey: string,
): Transaction[] {
  const filtered = transactions.filter((t) =>
    pendingInstallmentDueInMonth(t, monthKey),
  );
  const best = new Map<string, Transaction>();
  for (const t of filtered) {
    const k = installmentDedupeKey(t);
    const prev = best.get(k);
    const cur = t.currentInstallment ?? 1;
    const prevCur = prev ? (prev.currentInstallment ?? 1) : Infinity;
    if (!prev || cur < prevCur) {
      best.set(k, t);
    }
  }
  return [...best.values()].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}
