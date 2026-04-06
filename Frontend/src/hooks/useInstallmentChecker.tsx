import { useEffect, useState } from "react";
import { Transaction } from "../utils/types";

interface UseInstallmentCheckerProps {
  transactions: Transaction[];
  onUpdateTransaction: (
    transaction: Transaction,
    options?: { silent?: boolean },
  ) => Promise<void>;
}

interface InstallmentUpdate {
  id: string;
  description: string;
  current: number;
  total: number;
}

function bumpMonthIso(iso: string): string {
  const d = new Date(iso.split("T")[0] + "T12:00:00");
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().split("T")[0];
}

/**
 * Avança todas as parcelas “atrasadas” de uma vez (evita N chamadas à API e N toasts).
 */
function computeInstallmentCatchUp(
  t: Transaction,
  today: Date,
): Transaction | null {
  const inst = t.installments ?? 0;
  if (inst <= 1 || t.status !== "pending") return null;
  const nextRaw = t.nextPaymentDate?.trim();
  if (!nextRaw) return null;

  let cur = Math.max(1, t.currentInstallment ?? 1);
  if (cur >= inst) return null;

  const totalAmt =
    t.totalAmount != null && t.totalAmount > 0
      ? t.totalAmount
      : (t.amount || 0) * inst;
  const installmentValue = totalAmt / inst;

  let remaining =
    t.remainingAmount != null && Number.isFinite(t.remainingAmount)
      ? t.remainingAmount
      : Math.max(0, totalAmt - (t.amount || 0));

  const today0 = new Date(today);
  today0.setHours(0, 0, 0, 0);

  let nextStr = nextRaw;
  let nextDue = new Date(nextStr.split("T")[0] + "T12:00:00");
  nextDue.setHours(0, 0, 0, 0);

  let changed = false;
  const maxIter = 120;

  for (let i = 0; i < maxIter && cur < inst; i++) {
    if (today0 < nextDue) break;
    changed = true;
    cur += 1;
    remaining = Math.max(0, remaining - installmentValue);
    if (cur >= inst) break;
    nextStr = bumpMonthIso(nextStr);
    nextDue = new Date(nextStr.split("T")[0] + "T12:00:00");
    nextDue.setHours(0, 0, 0, 0);
  }

  if (!changed) return null;

  const isLast = cur >= inst;
  return {
    ...t,
    currentInstallment: cur,
    remainingAmount: remaining,
    status: isLast ? "completed" : "pending",
    nextPaymentDate: isLast ? undefined : nextStr,
  };
}

export const useInstallmentChecker = ({
  transactions,
  onUpdateTransaction,
}: UseInstallmentCheckerProps) => {
  const [updates, setUpdates] = useState<InstallmentUpdate[]>([]);

  useEffect(() => {
    const checkInstallments = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const newUpdates: InstallmentUpdate[] = [];

      for (const transaction of transactions) {
        const caught = computeInstallmentCatchUp(transaction, today);
        if (!caught) continue;

        try {
          await onUpdateTransaction(caught, { silent: true });
          newUpdates.push({
            id: transaction.id,
            description: transaction.description,
            current: caught.currentInstallment ?? caught.installments ?? 1,
            total: transaction.installments ?? 1,
          });
          console.log(
            `🔄 Parcelas sincronizadas: ${transaction.description} → ${caught.currentInstallment}/${transaction.installments}`,
          );
        } catch (error) {
          console.error(
            "Erro ao atualizar parcela automaticamente:",
            error,
          );
        }
      }

      if (newUpdates.length > 0) {
        setUpdates((prev) => [...prev, ...newUpdates]);
      }
    };

    checkInstallments();

    const interval = setInterval(checkInstallments, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [transactions, onUpdateTransaction]);

  const removeUpdate = (id: string) => {
    setUpdates((prev) => prev.filter((update) => update.id !== id));
  };

  return { updates, removeUpdate };
};
