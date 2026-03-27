import React from "react";
import { Transaction } from "../utils/types";
import { formatCurrency, formatDate } from "../utils/helpers";

interface RecentActivityProps {
  transactions: Transaction[];
  setActivePage: (page: string) => void;
  onPayInstallment?: (transaction: Transaction) => void;
  /** Sem card externo (útil quando o pai já é um painel). */
  variant?: "card" | "plain";
  maxItems?: number;
}

const ActivityItem: React.FC<{ transaction: Transaction }> = ({
  transaction,
}) => {
  const isExpense = transaction.type === "expense";

  return (
    <div
      className="flex items-center justify-between py-3 transition rounded-xl px-2"
      style={{ borderBottom: '1px solid var(--border-light)' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      <div className="flex flex-col">
        <p className="font-medium" style={{ color: 'var(--text)' }}>
          {transaction.description}
        </p>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {formatDate(transaction.date)}
        </p>
      </div>
      <p
        className="font-semibold"
        style={{ color: isExpense ? 'var(--danger)' : 'var(--success)' }}
      >
        {isExpense ? "−" : "+"} {formatCurrency(transaction.amount)}
      </p>
    </div>
  );
};

const RecentActivity: React.FC<RecentActivityProps> = ({
  transactions,
  setActivePage,
  variant = "card",
  maxItems = 5,
}) => {
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, maxItems);

  const inner = (
    <div>
      {recentTransactions.length > 0 ? (
        recentTransactions.map((t) => (
          <ActivityItem key={t.id} transaction={t} />
        ))
      ) : (
        <p
          className="text-center py-6"
          style={{ color: 'var(--text-secondary)' }}
        >
          Nenhuma atividade recente.
        </p>
      )}
    </div>
  );

  if (variant === "plain") {
    return inner;
  }

  return (
    <div
      className="backdrop-blur-md rounded-2xl p-6"
      style={{
        backgroundColor: 'var(--card)',
        boxShadow: 'var(--shadow)',
      }}
    >
      {inner}
    </div>
  );
};

export default RecentActivity;
