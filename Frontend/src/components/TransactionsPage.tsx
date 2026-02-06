import React, { useState, useMemo } from "react";
import {
  Transaction,
  Budget,
  TransactionType,
  TransactionStatus,
} from "../utils/types";
import TransactionTable from "./TransactionTable";
import AddTransactionModal from "./AddTransactionModal";
import EditTransactionModal from "./EditTransactionModal";
import InstallmentNotification from "./InstallmentNotification";
import BillImportModal from "./BillImportModal";
import { Plus, Filter, X, Upload } from "lucide-react";
import { useInstallmentChecker } from "../hooks/useInstallmentChecker";
import { availableAccounts } from "../utils/mockData";

interface TransactionsPageProps {
  transactions: Transaction[];
  addTransaction: (
    transaction: Omit<Transaction, "id" | "industry">,
  ) => Promise<void>;
  editTransaction: (transaction: Transaction) => Promise<void>;
  deleteTransaction: (transactionId: string) => Promise<void>;
  payInstallment?: (transaction: Transaction) => Promise<void>;
  budgets: Budget[];
  cards: any[];
  onImportTransactions: (transactions: any[]) => Promise<void>;
}

const TransactionsPage: React.FC<TransactionsPageProps> = ({
  transactions,
  addTransaction,
  editTransaction,
  deleteTransaction,
  payInstallment,
  budgets,
  cards,
  onImportTransactions,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState<TransactionType | "all">("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterAccount, setFilterAccount] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<TransactionStatus | "all">(
    "all"
  );
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<"current" | "all" | "invoice">("current"); // Filtro de período
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [selectedInvoiceMonth, setSelectedInvoiceMonth] = useState(""); // Mês da fatura selecionado
  const [selectedCard, setSelectedCard] = useState<string>("all"); // Cartão selecionado para filtrar

  const { updates, removeUpdate } = useInstallmentChecker({
    transactions,
    onUpdateTransaction: editTransaction,
  });

  // ==============================
  // Funções para cálculo de faturas
  // ==============================
  const getInvoicePeriods = () => {
    const periods = new Set<string>();
    
    cards.forEach(card => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      
      // Gerar períodos para os últimos 6 meses
      for (let i = 0; i < 6; i++) {
        const month = (currentMonth - i + 12) % 12;
        const year = currentMonth - i >= 0 ? currentYear : currentYear - 1;
        
        // Calcular período da fatura
        const closingDay = card.closingDay || 28;
        const dueDay = card.dueDay || 5;
        
        let startDate: Date;
        let endDate: Date;
        
        if (month === currentMonth && year === currentYear) {
          // Mês atual: do dia seguinte ao fechamento até hoje
          startDate = new Date(year, month, closingDay + 1);
          endDate = new Date();
        } else {
          // Meses anteriores: do dia seguinte ao fechamento até o fechamento
          startDate = new Date(year, month, closingDay + 1);
          endDate = new Date(year, month + 1, closingDay);
        }
        
        const monthName = new Date(year, month, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        periods.add(`${monthName}|${startDate.toISOString().split('T')[0]}|${endDate.toISOString().split('T')[0]}`);
      }
    });
    
    return Array.from(periods).map(period => {
      const [name, start, end] = period.split('|');
      return { name, startDate: start, endDate: end };
    });
  };

  const getInvoiceDateRange = (monthStr: string) => {
    const period = getInvoicePeriods().find(p => p.name === monthStr);
    return period || { startDate: '', endDate: '' };
  };

  // ==============================
  // Cálculos para os cards
  // ==============================
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingIncome = transactions
    .filter((t) => t.type === "income" && t.status === "pending")
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingExpense = transactions
    .filter((t) => t.type === "expense" && t.status === "pending")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;
  const totalPending = pendingIncome + pendingExpense;

  // ==============================
  // Filtragem
  // ==============================
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Filtro de busca
      if (
        searchTerm &&
        !t.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
        return false;

      // Filtro de tipo
      if (filterType !== "all" && t.type !== filterType) return false;

      // Filtro de categoria
      if (filterCategory !== "all" && t.category !== filterCategory)
        return false;

      // Filtro de conta (antigo)
      if (filterAccount !== "all" && t.account !== filterAccount) return false;

      // Filtro de cartão (novo)
      if (selectedCard !== "all" && t.account !== selectedCard) return false;

      // Filtro de status
      if (filterStatus !== "all" && t.status !== filterStatus) return false;

      // Filtro de datas
      if (dateFilter === "current") {
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const transactionDate = new Date(t.date);
        return transactionDate >= startDate && transactionDate <= endDate;
      }

      if (dateFilter === "invoice" && selectedInvoiceMonth) {
        const { startDate, endDate } = getInvoiceDateRange(selectedInvoiceMonth);
        if (startDate && endDate) {
          const transactionDate = new Date(t.date);
          const start = new Date(startDate);
          const end = new Date(endDate);
          return transactionDate >= start && transactionDate <= end;
        }
      }

      if (dateFilter === "all" && customStartDate && customEndDate) {
        const transactionDate = new Date(t.date);
        const start = new Date(customStartDate);
        const end = new Date(customEndDate);
        return transactionDate >= start && transactionDate <= end;
      }

      return true;
    });
  }, [
    transactions,
    searchTerm,
    filterType,
    filterCategory,
    filterAccount,
    filterStatus,
    dateFilter,
    customStartDate,
    customEndDate,
    selectedInvoiceMonth,
    selectedCard,
    cards,
  ]);

  const hasActiveFilters =
    searchTerm ||
    filterType !== "all" ||
    filterCategory !== "all" ||
    filterAccount !== "all" ||
    filterStatus !== "all" ||
    dateFilter === "all" ||
    (customStartDate && customEndDate) ||
    (dateFilter === "invoice" && selectedInvoiceMonth) ||
    selectedCard !== "all";

  const clearFilters = () => {
    setSearchTerm("");
    setFilterType("all");
    setFilterCategory("all");
    setFilterAccount("all");
    setFilterStatus("all");
    setDateFilter("current");
    setCustomStartDate("");
    setCustomEndDate("");
    setSelectedInvoiceMonth("");
    setSelectedCard("all");
  };

  const handleEditTransaction = (transaction: Transaction) =>
    setEditingTransaction(transaction);
  const handleSaveEditedTransaction = async (transaction: Transaction) => {
    await editTransaction(transaction);
    setEditingTransaction(null);
  };

  // ==============================
  // Função para pagar parcela
  // ==============================
  const handlePayInstallment = async (transaction: Transaction) => {
    if (payInstallment) {
      await payInstallment(transaction);
      return;
    }
    if (!transaction.installments || !transaction.currentInstallment) return;

    const nextInstallment = transaction.currentInstallment + 1;
    const isLastInstallment = nextInstallment >= transaction.installments;
    const nextPaymentDate = new Date(transaction.nextPaymentDate!);
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
    const installmentValue =
      transaction.totalAmount! / transaction.installments;
    const newRemainingAmount = transaction.remainingAmount! - installmentValue;

    const updatedTransaction: Transaction = {
      ...transaction,
      currentInstallment: nextInstallment,
      nextPaymentDate: isLastInstallment
        ? undefined
        : nextPaymentDate.toISOString().split("T")[0],
      remainingAmount: Math.max(0, newRemainingAmount),
      status: isLastInstallment ? "completed" : "pending",
    };

    await editTransaction(updatedTransaction);
  };

  return (
    <div className="space-y-6">
      {/* =================== Cards de resumo =================== */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-gray-500 text-sm">Saldo</p>
          <p className="text-2xl font-bold">
            {balance.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-gray-500 text-sm">Receitas</p>
          <p className="text-xl font-bold">
            {totalIncome.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </p>
          {pendingIncome > 0 && (
            <p className="text-yellow-500 text-sm">
              Pendentes:{" "}
              {pendingIncome.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </p>
          )}
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-gray-500 text-sm">Despesas</p>
          <p className="text-xl font-bold">
            {totalExpense.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </p>
          {pendingExpense > 0 && (
            <p className="text-yellow-500 text-sm">
              Pendentes:{" "}
              {pendingExpense.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </p>
          )}
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-gray-500 text-sm">Pendentes</p>
          <p className="text-xl font-bold">
            {totalPending.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </p>
        </div>
      </div>

      {/* =================== Header e Botões =================== */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        <h1 className="text-2xl font-bold text-gray-900">Transações</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors flex-1 sm:flex-initial ${
              showFilters || hasActiveFilters
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Filter size={20} />
            <span className="hidden sm:inline">Filtros</span>
            {hasActiveFilters && (
              <span className="bg-white text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                !
              </span>
            )}
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors flex-1 sm:flex-initial"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Nova Transação</span>
          </button>
        </div>
      </div>

      {/* =================== Filtros =================== */}
      {showFilters && (
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200 space-y-4 animate-in slide-in-from-top-2 duration-200">
          {/* Filtro de Cartão */}
          <div className="border-b pb-4">
            <h3 className="font-medium text-gray-900 mb-3">Cartão</h3>
            <select
              value={selectedCard}
              onChange={(e) => setSelectedCard(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos os cartões</option>
              {cards.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.name} ({card.bank}) - Fechamento: {card.closingDay || 28}, Vencimento: {card.dueDay || 5}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro de Período */}
          <div className="border-b pb-4">
            <h3 className="font-medium text-gray-900 mb-3">Período</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setDateFilter("current")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  dateFilter === "current"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Mês Atual
              </button>
              <button
                onClick={() => setDateFilter("invoice")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  dateFilter === "invoice"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Fatura
              </button>
              <button
                onClick={() => setDateFilter("all")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  dateFilter === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Personalizado
              </button>
            </div>
            
            {/* Filtro de Fatura */}
            {dateFilter === "invoice" && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mês da Fatura
                </label>
                <select
                  value={selectedInvoiceMonth}
                  onChange={(e) => setSelectedInvoiceMonth(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione um mês</option>
                  {getInvoicePeriods().map((period, index) => (
                    <option key={index} value={period.name}>
                      {period.name}
                    </option>
                  ))}
                </select>
                {selectedInvoiceMonth && (() => {
                  const period = getInvoiceDateRange(selectedInvoiceMonth);
                  return (
                    <div className="mt-2 text-sm text-gray-600">
                      Período: {new Date(period.startDate).toLocaleDateString('pt-BR')} até {new Date(period.endDate).toLocaleDateString('pt-BR')}
                    </div>
                  );
                })()}
              </div>
            )}
            
            {/* Filtro Personalizado */}
            {dateFilter === "all" && (
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Inicial
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Final
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Filtro de busca */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar
              </label>
              <input
                type="text"
                placeholder="Buscar transação..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filtro de tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as TransactionType | "all")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos</option>
                <option value="expense">Despesa</option>
                <option value="income">Receita</option>
              </select>
            </div>

            {/* Filtro de status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as TransactionStatus | "all")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos</option>
                <option value="completed">Completo</option>
                <option value="pending">Pendente</option>
              </select>
            </div>

            {/* Botão de limpar filtros */}
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                Limpar Filtros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================== Tabela =================== */}
      <TransactionTable
        transactions={filteredTransactions}
        title="Histórico de Transações"
        onEditTransaction={handleEditTransaction}
        onDeleteTransaction={deleteTransaction}
        onPayInstallment={handlePayInstallment}
      />

      {/* =================== Botão de Importação =================== */}
      <button
        onClick={() => setIsImportModalOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
      >
        <Upload className="w-4 h-4" />
        Importar Fatura
      </button>

      {/* =================== Modais =================== */}
      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddTransaction={addTransaction}
        budgets={budgets}
        cards={cards}
      />

      {editingTransaction && (
        <EditTransactionModal
          isOpen={!!editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onEditTransaction={handleSaveEditedTransaction}
          transaction={editingTransaction}
          budgets={budgets}
          cards={cards}
        />
      )}

      {/* Modal de Importação */}
      <BillImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        cards={cards}
        budgets={budgets}
        onImportTransactions={onImportTransactions}
      />

      {/* =================== Notificações de parcelas =================== */}
      {updates.map((update, index) => (
        <InstallmentNotification
          key={`${update.id}-${index}`}
          message={`${update.description} - Parcela ${update.current}/${update.total}`}
          onClose={() => removeUpdate(update.id)}
        />
      ))}
    </div>
  );
};

export default TransactionsPage;
