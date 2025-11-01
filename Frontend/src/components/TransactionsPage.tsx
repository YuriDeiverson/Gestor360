import React, { useState, useMemo } from "react";
import {
  Transaction,
  Category,
  TransactionType,
  TransactionStatus,
} from "../utils/types";
import { useInstallmentChecker } from "../hooks/useInstallmentChecker";
import TransactionTable from "./TransactionTable";
import AddTransactionModal from "./AddTransactionModal";
import EditTransactionModal from "./EditTransactionModal";
import InstallmentNotification from "./InstallmentNotification";
import { Plus, Filter, X } from "lucide-react";
import { availableAccounts } from "../utils/mockData";

interface TransactionsPageProps {
  transactions: Transaction[];
  addTransaction: (
    transaction: Omit<Transaction, "id" | "industry">,
  ) => Promise<void>;
  editTransaction: (transaction: Transaction) => Promise<void>;
  deleteTransaction: (transactionId: string) => Promise<void>;
  payInstallment?: (transaction: Transaction) => Promise<void>;
  categories: Category[];
}

const TransactionsPage: React.FC<TransactionsPageProps> = ({
  transactions,
  addTransaction,
  editTransaction,
  deleteTransaction,
  payInstallment,
  categories,
}) => {
  console.log(
    "💰 TransactionsPage: Componente renderizado com",
    transactions.length,
    "transações",
  );

  // Debug: verificar se há transações parceladas
  const installmentTransactions = transactions.filter(
    (t) => t.installments && t.installments > 1,
  );
  console.log(
    "🔍 Transações parceladas encontradas:",
    installmentTransactions.length,
  );
  installmentTransactions.forEach((t) => {
    console.log(
      `📦 ${t.description} - ${t.currentInstallment}/${t.installments} parcelas`,
    );
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);

  // Estados para filtros
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState<TransactionType | "all">("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterAccount, setFilterAccount] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<TransactionStatus | "all">(
    "all",
  );
  const [searchTerm, setSearchTerm] = useState("");

  // Hook para verificação automática de parcelas
  const { updates, removeUpdate } = useInstallmentChecker({
    transactions,
    onUpdateTransaction: editTransaction,
  });

  // Filtrar transações
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Filtro de busca por descrição
      if (
        searchTerm &&
        !t.description.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }
      // Filtro de tipo
      if (filterType !== "all" && t.type !== filterType) {
        return false;
      }
      // Filtro de categoria
      if (filterCategory !== "all" && t.category !== filterCategory) {
        return false;
      }
      // Filtro de conta
      if (filterAccount !== "all" && t.account !== filterAccount) {
        return false;
      }
      // Filtro de status
      if (filterStatus !== "all" && t.status !== filterStatus) {
        return false;
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
  ]);

  const clearFilters = () => {
    setSearchTerm("");
    setFilterType("all");
    setFilterCategory("all");
    setFilterAccount("all");
    setFilterStatus("all");
  };

  const hasActiveFilters =
    searchTerm ||
    filterType !== "all" ||
    filterCategory !== "all" ||
    filterAccount !== "all" ||
    filterStatus !== "all";

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
  };

  const handleSaveEditedTransaction = async (transaction: Transaction) => {
    await editTransaction(transaction);
    setEditingTransaction(null);
  };

  const handlePayInstallment = async (transaction: Transaction) => {
    // Usar a função recebida via props se disponível
    if (payInstallment) {
      await payInstallment(transaction);
      return;
    }

    // Fallback para a lógica antiga (caso não tenha sido passado)
    try {
      if (!transaction.installments || !transaction.currentInstallment) {
        return;
      }

      const nextInstallment = transaction.currentInstallment + 1;
      const isLastInstallment = nextInstallment >= transaction.installments;

      // Calcular nova data de pagamento (próximo mês)
      const nextPaymentDate = new Date(transaction.nextPaymentDate!);
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

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
          : nextPaymentDate.toISOString().split("T")[0],
        remainingAmount: Math.max(0, newRemainingAmount),
        status: isLastInstallment ? "completed" : "pending",
      };

      await editTransaction(updatedTransaction);
      console.log("✅ Parcela paga com sucesso!");
    } catch (error) {
      console.error("❌ Erro ao pagar parcela:", error);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header com botão Nova Transação */}
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
            onClick={() => {
              console.log("🔘 Botão Nova Transação clicado");
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors flex-1 sm:flex-initial"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Nova Transação</span>
            <span className="sm:hidden">Nova</span>
          </button>
        </div>
      </div>

      {/* Painel de Filtros Expandível */}
      {showFilters && (
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Filter size={18} />
              Filtrar Transações
            </h3>
            <button
              onClick={() => setShowFilters(false)}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition"
            >
              <X size={20} />
            </button>
          </div>

          {/* Campo de Busca */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar por descrição
            </label>
            <input
              type="text"
              placeholder="Digite para buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>

          {/* Grid de Filtros */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Filtro de Tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo
              </label>
              <select
                value={filterType}
                onChange={(e) =>
                  setFilterType(e.target.value as TransactionType | "all")
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              >
                <option value="all">Todos</option>
                <option value="income">Receita</option>
                <option value="expense">Despesa</option>
              </select>
            </div>

            {/* Filtro de Categoria */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              >
                <option value="all">Todas</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro de Conta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Conta
              </label>
              <select
                value={filterAccount}
                onChange={(e) => setFilterAccount(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              >
                <option value="all">Todas</option>
                {availableAccounts.map((acc) => (
                  <option key={acc} value={acc}>
                    {acc}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro de Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) =>
                  setFilterStatus(e.target.value as TransactionStatus | "all")
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              >
                <option value="all">Todos</option>
                <option value="completed">Completo</option>
                <option value="pending">Pendente</option>
              </select>
            </div>
          </div>

          {/* Botão Limpar Filtros */}
          {hasActiveFilters && (
            <div className="flex justify-end pt-2">
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <X size={16} />
                Limpar filtros
              </button>
            </div>
          )}
        </div>
      )}

      {/* Indicador de Filtros Ativos (quando painel está fechado) */}
      {!showFilters && hasActiveFilters && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 flex items-center justify-between">
          <span className="text-sm text-blue-700">
            <strong>{filteredTransactions.length}</strong> de{" "}
            <strong>{transactions.length}</strong> transações exibidas
          </span>
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Limpar
          </button>
        </div>
      )}

      <TransactionTable
        transactions={filteredTransactions}
        title="Histórico de Transações"
        onEditTransaction={handleEditTransaction}
        onDeleteTransaction={deleteTransaction}
        onPayInstallment={handlePayInstallment}
      />

      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddTransaction={async (newTransaction) => {
          console.log("🔗 TransactionsPage: Chamando addTransaction...");
          await addTransaction(newTransaction);
          console.log("✅ TransactionsPage: Transação adicionada com sucesso!");
        }}
        categories={categories}
      />

      {editingTransaction && (
        <EditTransactionModal
          isOpen={!!editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onEditTransaction={handleSaveEditedTransaction}
          transaction={editingTransaction}
          categories={categories}
        />
      )}

      {/* Notificações de parcelas atualizadas */}
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
