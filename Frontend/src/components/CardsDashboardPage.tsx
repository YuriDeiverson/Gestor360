import React, { useState, useMemo } from "react";
import { CreditCard, Plus, TrendingDown, AlertCircle, Eye, EyeOff, Trash2, Edit2 } from "lucide-react";
import { Transaction } from "../utils/types";

interface Card {
  id: string;
  name: string;
  bank: string;
  limit: number;
  closingDay: number;
  dueDay: number;
  currentBalance: number;
  status: 'active' | 'inactive' | 'overdue';
  nextDueDate?: string;
}

interface CardsDashboardPageProps {
  cards: Card[];
  transactions: Transaction[];
  onAddCard: (card: Omit<Card, "id">) => void;
  onEditCard: (card: Card) => void;
  onDeleteCard: (id: string) => void;
}

interface CardSummary {
  card: Card;
  totalSpent: number;
  totalReceived: number;
  pendingAmount: number;
  availableLimit: number;
  utilizationRate: number;
  transactionCount: number;
  currentInvoice: number;
  nextInvoice: number;
}

const CardsDashboardPage: React.FC<CardsDashboardPageProps> = ({
  cards,
  transactions,
  onAddCard,
  onEditCard,
  onDeleteCard,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBalance, setShowBalance] = useState<Record<string, boolean>>({});
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [newCard, setNewCard] = useState<Partial<Card>>({
    name: "",
    bank: "",
    limit: 0,
    closingDay: 1,
    dueDay: 10,
  });

  // Agrupar transações por cartão
  const cardsSummary = useMemo(() => {
    try {
      const cardGroups: Record<string, Transaction[]> = {};
      
      console.log("🔍 Analisando transações para cartões:", {
        totalTransactions: transactions.length,
        cards: cards.map(c => ({ id: c.id, name: c.name }))
      });
      
      // Agrupar transações por account (ID do cartão) em vez de cardName
      transactions.forEach(transaction => {
        // Apenas transações de cartão de crédito E que sejam despesas
        if (transaction.method === "Cartão de Crédito" && transaction.type === "expense") {
          const accountId = transaction.account;
          console.log(`💳 Transação de cartão (despesa): "${transaction.description}"`, {
            account: accountId,
            cardName: transaction.cardName,
            type: transaction.type,
            amount: transaction.amount,
            status: transaction.status
          });
          
          if (!cardGroups[accountId]) {
            cardGroups[accountId] = [];
          }
          cardGroups[accountId].push(transaction);
        } else if (transaction.method === "Cartão de Crédito" && transaction.type === "income") {
          console.log(`💰 Ignorando receita de cartão: "${transaction.description}"`, {
            account: transaction.account,
            amount: transaction.amount
          });
        }
      });

      console.log("📊 Grupos de transações por cartão (apenas despesas):", cardGroups);

      // Calcular resumo para cada cartão
      const summaries: CardSummary[] = cards.map(card => {
        const cardTransactions = cardGroups[card.id] || [];
        
        console.log(`🔍 Analisando cartão "${card.name}" (ID: ${card.id}):`, {
          totalTransactions: cardTransactions.length,
          transactions: cardTransactions.map(t => ({
            description: t.description,
            type: t.type,
            amount: t.amount,
            status: t.status
          }))
        });
        
        // Apenas despesas (todas já são despesas, mas vamos garantir)
        const expenses = cardTransactions.filter(t => t.type === "expense");
        const pending = cardTransactions.filter(t => t.status === "pending");

        const totalSpent = expenses.reduce((sum, t) => sum + (t.amount || 0), 0);
        const pendingAmount = pending.reduce((sum, t) => sum + (t.amount || 0), 0);
        
        // Cálculo sem considerar receitas
        const availableLimit = (card.limit || 0) - totalSpent;
        const utilizationRate = card.limit > 0 ? (totalSpent / card.limit) * 100 : 0;

        console.log(`💰 Resumo do cartão "${card.name}":`, {
          totalSpent,
          pendingAmount,
          availableLimit,
          utilizationRate,
          expensesCount: expenses.length,
          pendingCount: pending.length,
          completedCount: expenses.filter(t => t.status === "completed").length
        });

        return {
          card,
          totalSpent,
          totalReceived: 0, // Ignorar receitas
          pendingAmount,
          availableLimit,
          utilizationRate,
          transactionCount: cardTransactions.length,
          currentInvoice: totalSpent, // Apenas despesas na fatura atual
          nextInvoice: pendingAmount, // Apenas despesas pendentes
        };
      });

      return summaries;
    } catch (error) {
      console.error("Erro ao calcular resumo dos cartões:", error);
      return [];
    }
  }, [cards, transactions]);

  const formatCurrency = (value: number | undefined | null) => {
    if (value === undefined || value === null || isNaN(value)) {
      return "R$ 0,00";
    }
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const getUtilizationColor = (rate: number) => {
    if (rate >= 90) return "text-red-600";
    if (rate >= 70) return "text-orange-600";
    if (rate >= 50) return "text-yellow-600";
    return "text-green-600";
  };

  const getBankIcon = (bank: string) => {
    const icons: Record<string, string> = {
      "Nubank": "🟣",
      "Banco do Brasil": "🟦",
      "Itaú": "🟠",
      "Santander": "🔴",
      "Bradesco": "🟪",
      "Caixa": "⬜",
      "Banco Inter": "🟩",
      "Banco Original": "🟨",
      "C6 Bank": "🟧",
      "PicPay": "⬛",
    };
    return icons[bank] || "💳";
  };

  const handleAddCard = () => {
    if (newCard.name && newCard.bank && (newCard.limit || 0) > 0) {
      onAddCard({
        name: newCard.name,
        bank: newCard.bank,
        limit: newCard.limit || 0,
        closingDay: newCard.closingDay || 1,
        dueDay: newCard.dueDay || 10,
        currentBalance: 0,
        status: 'active',
      });
      setNewCard({
        name: "",
        bank: "",
        limit: 0,
        closingDay: 1,
        dueDay: 10,
      });
      setShowAddModal(false);
    }
  };

  const handleEditCard = () => {
    if (editingCard && newCard.name && newCard.bank && (newCard.limit || 0) > 0) {
      onEditCard({
        ...editingCard,
        name: newCard.name,
        bank: newCard.bank,
        limit: newCard.limit || 0,
        closingDay: newCard.closingDay || 1,
        dueDay: newCard.dueDay || 10,
      });
      setEditingCard(null);
      setNewCard({
        name: "",
        bank: "",
        limit: 0,
        closingDay: 1,
        dueDay: 10,
      });
    }
  };

  const toggleBalance = (cardId: string) => {
    setShowBalance(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  const startEditCard = (card: Card) => {
    setEditingCard(card);
    setNewCard(card);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CreditCard className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Cartões de Crédito</h1>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Adicionar Cartão
        </button>
      </div>

      {/* Resumo Geral */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Resumo Geral</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Limite Total</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(cards.reduce((sum, card) => sum + card.limit, 0))}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Fatura Atual</p>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(cardsSummary.reduce((sum, summary) => sum + summary.currentInvoice, 0))}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Próxima Fatura</p>
            <p className="text-2xl font-bold text-orange-600">
              {formatCurrency(cardsSummary.reduce((sum, summary) => sum + summary.nextInvoice, 0))}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Disponível</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(cardsSummary.reduce((sum, summary) => sum + summary.availableLimit, 0))}
            </p>
          </div>
        </div>
      </div>

      {/* Cartões */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cardsSummary.map((summary) => (
          <div
            key={summary.card.id}
            className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-all"
          >
            {/* Header do Cartão */}
            <div
              className="p-6 text-white relative"
              style={{ backgroundColor: "#3b82f6" }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getBankIcon(summary.card.bank)}</span>
                  <div>
                    <h3 className="text-lg font-semibold">{summary.card.name}</h3>
                    <p className="text-sm opacity-90">{summary.card.bank}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEditCard(summary.card)}
                    className="p-1 hover:bg-white/20 rounded transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteCard(summary.card.id)}
                    className="p-1 hover:bg-white/20 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Informações do Cartão */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm opacity-90">Limite:</span>
                  <span className="font-semibold">{formatCurrency(summary.card.limit)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm opacity-90">Disponível:</span>
                  <span className="font-semibold">{formatCurrency(summary.availableLimit)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm opacity-90">Utilização:</span>
                  <span className={`font-semibold ${getUtilizationColor(summary.utilizationRate)}`}>
                    {summary.utilizationRate.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Barra de Utilização */}
              <div className="mt-4">
                <div className="w-full bg-white/30 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      summary.utilizationRate >= 90 ? 'bg-red-500' :
                      summary.utilizationRate >= 70 ? 'bg-orange-500' :
                      summary.utilizationRate >= 50 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(summary.utilizationRate, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Detalhes */}
            <div className="p-6 space-y-4">
              {/* Fatura Atual */}
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-red-600">Fatura Atual</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleBalance(summary.card.id)}
                    className="p-1 hover:bg-red-100 rounded transition-colors"
                  >
                    {showBalance[summary.card.id] ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <span className="text-lg font-bold text-red-700">
                    {showBalance[summary.card.id] ? formatCurrency(summary.currentInvoice) : "•••••"}
                  </span>
                </div>
              </div>

              {/* Próxima Fatura */}
              {summary.nextInvoice > 0 && (
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-600">Próxima Fatura</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleBalance(summary.card.id)}
                      className="p-1 hover:bg-orange-100 rounded transition-colors"
                    >
                      {showBalance[summary.card.id] ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <span className="text-lg font-bold text-orange-700">
                      {showBalance[summary.card.id] ? formatCurrency(summary.nextInvoice) : "•••••"}
                    </span>
                  </div>
                </div>
              )}

              {/* Datas */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center p-2 bg-gray-50 rounded">
                  <p className="text-gray-600">Fechamento</p>
                  <p className="font-semibold">{summary.card.closingDay}</p>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <p className="text-gray-600">Vencimento</p>
                  <p className="font-semibold">{summary.card.dueDay}</p>
                </div>
              </div>

              {/* Estatísticas */}
              <div className="text-center p-2 bg-gray-50 rounded">
                <p className="text-xs text-gray-600">
                  {summary.transactionCount} transações • {summary.pendingAmount > 0 ? `${summary.pendingAmount} pendentes` : "em dia"}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sem Cartões */}
      {cards.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg border border-gray-200">
          <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum cartão cadastrado</h3>
          <p className="text-gray-600 mb-6">
            Adicione seu primeiro cartão para começar a controlar suas despesas
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Adicionar Cartão
          </button>
        </div>
      )}

      {/* Modal Adicionar/Editar Cartão */}
      {(showAddModal || editingCard) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingCard ? "Editar Cartão" : "Adicionar Cartão"}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Cartão
                </label>
                <input
                  type="text"
                  value={newCard.name}
                  onChange={(e) => setNewCard({ ...newCard, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Nubank Ultimato"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Banco
                </label>
                <select
                  value={newCard.bank}
                  onChange={(e) => setNewCard({ ...newCard, bank: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione...</option>
                  <option value="Nubank">Nubank</option>
                  <option value="Banco do Brasil">Banco do Brasil</option>
                  <option value="Itaú">Itaú</option>
                  <option value="Santander">Santander</option>
                  <option value="Bradesco">Bradesco</option>
                  <option value="Caixa">Caixa</option>
                  <option value="Banco Inter">Banco Inter</option>
                  <option value="Banco Original">Banco Original</option>
                  <option value="C6 Bank">C6 Bank</option>
                  <option value="PicPay">PicPay</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Limite
                </label>
                <input
                  type="number"
                  value={newCard.limit}
                  onChange={(e) => setNewCard({ ...newCard, limit: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0,00"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dia Fechamento
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={newCard.closingDay}
                    onChange={(e) => setNewCard({ ...newCard, closingDay: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dia Vencimento
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={newCard.dueDay}
                    onChange={(e) => setNewCard({ ...newCard, dueDay: parseInt(e.target.value) || 10 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingCard(null);
                  setNewCard({
                    name: "",
                    bank: "",
                    limit: 0,
                    closingDay: 1,
                    dueDay: 10,
                  });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={editingCard ? handleEditCard : handleAddCard}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingCard ? "Salvar" : "Adicionar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CardsDashboardPage;
