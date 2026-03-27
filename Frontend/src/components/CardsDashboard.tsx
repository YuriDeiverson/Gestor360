import React, { useMemo } from "react";
import { Transaction } from "../utils/types";
import { CreditCard, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

interface CardsDashboardProps {
  transactions: Transaction[];
}

interface CardSummary {
  bankName: string;
  totalSpent: number;
  totalReceived: number;
  pendingAmount: number;
  netBalance: number;
  transactionCount: number;
  color: string;
}

const CardsDashboard: React.FC<CardsDashboardProps> = ({ transactions }) => {
  const cardsSummary = useMemo(() => {
    const cardGroups: Record<string, Transaction[]> = {};
    
    transactions.forEach(transaction => {
      const cardName = transaction.cardName || "Cartão";
      if (!cardGroups[cardName]) {
        cardGroups[cardName] = [];
      }
      cardGroups[cardName].push(transaction);
    });

    const colors = [
      "#a855f7", "#3b82f6", "#22c55e", "#f97316",
      "#ef4444", "#6366f1", "#ec4899", "#eab308"
    ];

    const summaries: CardSummary[] = Object.entries(cardGroups).map(([bankName, cardTransactions]) => {
      const expenses = cardTransactions.filter(t => t.type === "expense");
      const income = cardTransactions.filter(t => t.type === "income");
      const pending = cardTransactions.filter(t => t.status === "pending");

      const totalSpent = expenses.reduce((sum, t) => sum + t.amount, 0);
      const totalReceived = income.reduce((sum, t) => sum + t.amount, 0);
      const pendingAmount = pending.reduce((sum, t) => sum + t.amount, 0);
      const netBalance = totalReceived - totalSpent;

      const colorIndex = Object.keys(cardGroups).indexOf(bankName) % colors.length;

      return {
        bankName,
        totalSpent,
        totalReceived,
        pendingAmount,
        netBalance,
        transactionCount: cardTransactions.length,
        color: colors[colorIndex]
      };
    });

    return summaries.sort((a, b) => b.totalSpent - a.totalSpent);
  }, [transactions]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <CreditCard className="w-6 h-6" style={{ color: 'var(--primary)' }} />
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Dashboard de Cartões</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cardsSummary.map((card) => (
          <div
            key={card.bankName}
            className="rounded-xl overflow-hidden transition-shadow"
            style={{ backgroundColor: 'var(--card)', boxShadow: 'var(--shadow)', border: '1px solid var(--border)' }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
          >
            {/* Header - data-driven color, kept as-is */}
            <div className="p-4 text-white" style={{ backgroundColor: card.color }}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{card.bankName}</h3>
                <CreditCard className="w-5 h-5" />
              </div>
              <p className="text-sm opacity-90 mt-1">
                {card.transactionCount} transações
              </p>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div
                  className="text-center p-3 rounded-lg"
                  style={{ backgroundColor: 'var(--danger-bg)' }}
                >
                  <div className="flex items-center justify-center gap-1 mb-1" style={{ color: 'var(--danger)' }}>
                    <TrendingDown className="w-4 h-4" />
                    <span className="text-xs font-medium">Despesas</span>
                  </div>
                  <p className="text-lg font-bold" style={{ color: 'var(--danger)' }}>
                    {formatCurrency(card.totalSpent)}
                  </p>
                </div>

                <div
                  className="text-center p-3 rounded-lg"
                  style={{ backgroundColor: 'var(--success-bg)' }}
                >
                  <div className="flex items-center justify-center gap-1 mb-1" style={{ color: 'var(--success)' }}>
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs font-medium">Receitas</span>
                  </div>
                  <p className="text-lg font-bold" style={{ color: 'var(--success)' }}>
                    {formatCurrency(card.totalReceived)}
                  </p>
                </div>
              </div>

              <div
                className="text-center p-3 rounded-lg"
                style={{ backgroundColor: card.netBalance >= 0 ? 'var(--primary-bg)' : 'var(--warning-bg)' }}
              >
                <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Saldo Líquido</p>
                <p
                  className="text-xl font-bold"
                  style={{ color: card.netBalance >= 0 ? 'var(--primary)' : 'var(--warning)' }}
                >
                  {formatCurrency(card.netBalance)}
                </p>
              </div>

              {card.pendingAmount > 0 && (
                <div
                  className="text-center p-3 rounded-lg"
                  style={{ backgroundColor: 'var(--warning-bg)', border: '1px solid var(--warning)' }}
                >
                  <div className="flex items-center justify-center gap-1 mb-1" style={{ color: 'var(--warning)' }}>
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-xs font-medium">Pendentes</span>
                  </div>
                  <p className="text-lg font-bold" style={{ color: 'var(--warning)' }}>
                    {formatCurrency(card.pendingAmount)}
                  </p>
                </div>
              )}

              <div
                className="flex items-center justify-center p-2 rounded-lg"
                style={{ backgroundColor: 'var(--bg-secondary)' }}
              >
                <div
                  className="w-2 h-2 rounded-full mr-2"
                  style={{ backgroundColor: card.pendingAmount > 0 ? 'var(--warning)' : 'var(--success)' }}
                />
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {card.pendingAmount > 0 ? 'Com pendências' : 'Em dia'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Resumo Geral */}
      {cardsSummary.length > 0 && (
        <div
          className="rounded-xl p-6"
          style={{ backgroundColor: 'var(--card)', boxShadow: 'var(--shadow)', border: '1px solid var(--border)' }}
        >
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>Resumo Geral</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Total Gasto</p>
              <p className="text-xl font-bold" style={{ color: 'var(--danger)' }}>
                {formatCurrency(cardsSummary.reduce((sum, card) => sum + card.totalSpent, 0))}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Total Recebido</p>
              <p className="text-xl font-bold" style={{ color: 'var(--success)' }}>
                {formatCurrency(cardsSummary.reduce((sum, card) => sum + card.totalReceived, 0))}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Total Pendente</p>
              <p className="text-xl font-bold" style={{ color: 'var(--warning)' }}>
                {formatCurrency(cardsSummary.reduce((sum, card) => sum + card.pendingAmount, 0))}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Saldo Final</p>
              <p className="text-xl font-bold" style={{ color: 'var(--primary)' }}>
                {formatCurrency(cardsSummary.reduce((sum, card) => sum + card.netBalance, 0))}
              </p>
            </div>
          </div>
        </div>
      )}

      {cardsSummary.length === 0 && (
        <div
          className="text-center py-12 rounded-xl"
          style={{ backgroundColor: 'var(--card)', boxShadow: 'var(--shadow)', border: '1px solid var(--border)' }}
        >
          <CreditCard className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Nenhuma transação de cartão encontrada</p>
          <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
            Importe uma fatura para começar a visualizar seus cartões
          </p>
        </div>
      )}
    </div>
  );
};

export default CardsDashboard;
