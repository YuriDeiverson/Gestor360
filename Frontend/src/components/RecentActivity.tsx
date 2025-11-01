import React from "react";
import { Transaction } from "../utils/types";
import { formatCurrency, formatDate } from "../utils/helpers";

interface RecentActivityProps {
  transactions: Transaction[];
  setActivePage: (page: string) => void;
  onPayInstallment?: (transaction: Transaction) => void;
}

const ActivityItem: React.FC<{ transaction: Transaction }> = ({
  transaction,
}) => {
  const isExpense = transaction.type === "expense";
  const amountColor = isExpense ? "text-rose-600" : "text-emerald-600";

  return (
    <div className="flex items-center justify-between py-3 transition hover:bg-gray-50 rounded-xl px-2">
      <div className="flex flex-col">
        <p className="font-medium text-gray-900">{transaction.description}</p>
        <p className="text-xs text-gray-500">{formatDate(transaction.date)}</p>
      </div>
      <p className={`font-semibold ${amountColor}`}>
        {isExpense ? "−" : "+"} {formatCurrency(transaction.amount)}
      </p>
    </div>
  );
};

const RecentActivity: React.FC<RecentActivityProps> = ({
  transactions,
  setActivePage,
}) => {
  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-[0_6px_24px_rgba(12,12,16,0.06)]">
      <div className="divide-y divide-gray-100">
        {recentTransactions.length > 0 ? (
          recentTransactions.map((t) => (
            <ActivityItem key={t.id} transaction={t} />
          ))
        ) : (
          <p className="text-center text-gray-500 py-6">
            Nenhuma atividade recente.
          </p>
        )}
      </div>
    </div>
  );
};

export default RecentActivity;
