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

  const { updates, removeUpdate } = useInstallmentChecker({
    transactions,
    onUpdateTransaction: editTransaction,
  });

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
      if (
        searchTerm &&
        !t.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
        return false;
      if (filterType !== "all" && t.type !== filterType) return false;
      if (filterCategory !== "all" && t.category !== filterCategory)
        return false;
      if (filterAccount !== "all" && t.account !== filterAccount) return false;
      if (filterStatus !== "all" && t.status !== filterStatus) return false;
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

  const hasActiveFilters =
    searchTerm ||
    filterType !== "all" ||
    filterCategory !== "all" ||
    filterAccount !== "all" ||
    filterStatus !== "all";

  const clearFilters = () => {
    setSearchTerm("");
    setFilterType("all");
    setFilterCategory("all");
    setFilterAccount("all");
    setFilterStatus("all");
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
          {/* Aqui você pode manter todo o seu código de filtros */}
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
        onAddTransaction={async (newTransaction) =>
          await addTransaction(newTransaction)
        }
        budgets={budgets}
      />

      {editingTransaction && (
        <EditTransactionModal
          isOpen={!!editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onEditTransaction={handleSaveEditedTransaction}
          transaction={editingTransaction}
          budgets={budgets}
        />
      )}

      {/* Modal de Importação */}
      <BillImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        cards={cards}
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
