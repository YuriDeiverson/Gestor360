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
  // Agrupar transações por banco
  const cardsSummary = useMemo(() => {
    const cardGroups: Record<string, Transaction[]> = {};
    
    // Agrupar transações por cardName
    transactions.forEach(transaction => {
      const cardName = transaction.cardName || "Cartão";
      if (!cardGroups[cardName]) {
        cardGroups[cardName] = [];
      }
      cardGroups[cardName].push(transaction);
    });

    // Calcular resumo para cada cartão
    const summaries: CardSummary[] = Object.entries(cardGroups).map(([bankName, cardTransactions]) => {
      const expenses = cardTransactions.filter(t => t.type === "expense");
      const income = cardTransactions.filter(t => t.type === "income");
      const pending = cardTransactions.filter(t => t.status === "pending");

      const totalSpent = expenses.reduce((sum, t) => sum + t.amount, 0);
      const totalReceived = income.reduce((sum, t) => sum + t.amount, 0);
      const pendingAmount = pending.reduce((sum, t) => sum + t.amount, 0);
      const netBalance = totalReceived - totalSpent;

      // Cores diferentes para cada banco
      const colors = [
        "bg-purple-500", "bg-blue-500", "bg-green-500", "bg-orange-500",
        "bg-red-500", "bg-indigo-500", "bg-pink-500", "bg-yellow-500"
      ];
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
        <CreditCard className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Dashboard de Cartões</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cardsSummary.map((card) => (
          <div
            key={card.bankName}
            className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow"
          >
            {/* Header */}
            <div className={`${card.color} p-4 text-white`}>
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
              {/* Resumo Financeiro */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
                    <TrendingDown className="w-4 h-4" />
                    <span className="text-xs font-medium">Despesas</span>
                  </div>
                  <p className="text-lg font-bold text-red-700">
                    {formatCurrency(card.totalSpent)}
                  </p>
                </div>

                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs font-medium">Receitas</span>
                  </div>
                  <p className="text-lg font-bold text-green-700">
                    {formatCurrency(card.totalReceived)}
                  </p>
                </div>
              </div>

              {/* Saldo Líquido */}
              <div className={`text-center p-3 rounded-lg ${
                card.netBalance >= 0 ? 'bg-blue-50' : 'bg-orange-50'
              }`}>
                <p className="text-xs font-medium mb-1 text-gray-600">Saldo Líquido</p>
                <p className={`text-xl font-bold ${
                  card.netBalance >= 0 ? 'text-blue-700' : 'text-orange-700'
                }`}>
                  {formatCurrency(card.netBalance)}
                </p>
              </div>

              {/* Pendentes */}
              {card.pendingAmount > 0 && (
                <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center justify-center gap-1 text-yellow-600 mb-1">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-xs font-medium">Pendentes</span>
                  </div>
                  <p className="text-lg font-bold text-yellow-700">
                    {formatCurrency(card.pendingAmount)}
                  </p>
                </div>
              )}

              {/* Indicador de Status */}
              <div className="flex items-center justify-center p-2 bg-gray-50 rounded-lg">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  card.pendingAmount > 0 ? 'bg-yellow-500' : 'bg-green-500'
                }`} />
                <span className="text-xs text-gray-600">
                  {card.pendingAmount > 0 ? 'Com pendências' : 'Em dia'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Resumo Geral */}
      {cardsSummary.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo Geral</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Total Gasto</p>
              <p className="text-xl font-bold text-red-600">
                {formatCurrency(cardsSummary.reduce((sum, card) => sum + card.totalSpent, 0))}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Total Recebido</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(cardsSummary.reduce((sum, card) => sum + card.totalReceived, 0))}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Total Pendente</p>
              <p className="text-xl font-bold text-yellow-600">
                {formatCurrency(cardsSummary.reduce((sum, card) => sum + card.pendingAmount, 0))}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Saldo Final</p>
              <p className="text-xl font-bold text-blue-600">
                {formatCurrency(cardsSummary.reduce((sum, card) => sum + card.netBalance, 0))}
              </p>
            </div>
          </div>
        </div>
      )}

      {cardsSummary.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg border border-gray-200">
          <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Nenhuma transação de cartão encontrada</p>
          <p className="text-sm text-gray-500 mt-2">
            Importe uma fatura para começar a visualizar seus cartões
          </p>
        </div>
      )}
    </div>
  );
};

export default CardsDashboard;
