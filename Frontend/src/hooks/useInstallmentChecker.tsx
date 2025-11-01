import { useEffect, useState } from "react";
import { Transaction } from "../utils/types";

interface UseInstallmentCheckerProps {
  transactions: Transaction[];
  onUpdateTransaction: (transaction: Transaction) => Promise<void>;
}

interface InstallmentUpdate {
  id: string;
  description: string;
  current: number;
  total: number;
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
        if (
          transaction.installments &&
          transaction.currentInstallment &&
          transaction.nextPaymentDate &&
          transaction.status === "pending"
        ) {
          const nextPaymentDate = new Date(transaction.nextPaymentDate);
          nextPaymentDate.setHours(0, 0, 0, 0);

          // Se chegou o dia do pagamento ou passou
          if (today >= nextPaymentDate) {
            const nextInstallment = transaction.currentInstallment + 1;
            const isLastInstallment =
              nextInstallment >= transaction.installments;

            // Calcular nova data de pagamento (próximo mês)
            const newNextPaymentDate = new Date(nextPaymentDate);
            newNextPaymentDate.setMonth(newNextPaymentDate.getMonth() + 1);

            // Calcular valor restante
            const installmentValue =
              transaction.totalAmount! / transaction.installments;
            const newRemainingAmount =
              transaction.remainingAmount! - installmentValue;

            const updatedTransaction: Transaction = {
              ...transaction,
              currentInstallment: nextInstallment,
              nextPaymentDate: isLastInstallment
                ? undefined
                : newNextPaymentDate.toISOString().split("T")[0],
              remainingAmount: Math.max(0, newRemainingAmount),
              status: isLastInstallment ? "completed" : "pending",
            };

            try {
              await onUpdateTransaction(updatedTransaction);
              newUpdates.push({
                id: transaction.id,
                description: transaction.description,
                current: nextInstallment,
                total: transaction.installments,
              });
              console.log(
                `🔄 Parcela atualizada automaticamente: ${transaction.description} - ${nextInstallment}/${transaction.installments}`,
              );
            } catch (error) {
              console.error(
                "Erro ao atualizar parcela automaticamente:",
                error,
              );
            }
          }
        }
      }

      if (newUpdates.length > 0) {
        setUpdates((prev) => [...prev, ...newUpdates]);
      }
    };

    // Verificar imediatamente
    checkInstallments();

    // Verificar a cada 30 minutos
    const interval = setInterval(checkInstallments, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [transactions, onUpdateTransaction]);

  const removeUpdate = (id: string) => {
    setUpdates((prev) => prev.filter((update) => update.id !== id));
  };

  return { updates, removeUpdate };
};
