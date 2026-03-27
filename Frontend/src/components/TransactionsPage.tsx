import React, { useState, useMemo, useEffect } from "react";
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
import { Plus, Filter, Upload, Pencil, Trash2, TrendingUp, Repeat, Search } from "lucide-react";
import ExpenseGastosTable from "./ExpenseGastosTable";
import Pagination from "./Pagination";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useInstallmentChecker } from "../hooks/useInstallmentChecker";
import {
  INCOME_CATEGORIES,
  normalizeIncomeCategory,
  isIncomeRecurringCategory,
} from "../utils/incomeCategories";

const EXPENSE_PAGE_SIZE = 10;

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
  /** Receitas: só entradas | Gastos: só saídas | omitido: comportamento anterior */
  mode?: "income" | "expense";
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
  mode,
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
  const [dateFilter, setDateFilter] = useState<"current" | "all" | "invoice" | "month">("all");
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>("");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [selectedInvoiceMonth, setSelectedInvoiceMonth] = useState("");
  const [selectedCard, setSelectedCard] = useState<string>("all");
  /** Filtro de mês (YYYY-MM) na aba Gastos — alinhado ao layout de referência. */
  const [expenseMonthFilter, setExpenseMonthFilter] = useState<string>("all");
  const [expenseListPage, setExpenseListPage] = useState(1);

  const [incomeFilterMonth, setIncomeFilterMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  /** Filtro exclusivo da aba Receitas (categorias fixas). */
  const [incomeCategoryFilter, setIncomeCategoryFilter] = useState<string>("all");

  const monthOptionsIncome = useMemo(() => {
    const opts: { value: string; label: string }[] = [];
    for (let i = -5; i <= 1; i++) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() + i);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const raw = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
      opts.push({ value, label: raw.charAt(0).toUpperCase() + raw.slice(1) });
    }
    return opts;
  }, []);

  useEffect(() => {
    if (mode === "income") setFilterType("income");
    else if (mode === "expense") setFilterType("expense");
  }, [mode]);

  useEffect(() => {
    if (mode === "income") {
      setSelectedCard("all");
      setSelectedInvoiceMonth("");
      setDateFilter((prev) => (prev === "invoice" ? "all" : prev));
    }
  }, [mode]);

  const scopeTransactions = useMemo(() => {
    if (!mode) return transactions;
    return transactions.filter((t) =>
      mode === "income" ? t.type === "income" : t.type === "expense",
    );
  }, [transactions, mode]);

  const { updates, removeUpdate } = useInstallmentChecker({
    transactions,
    onUpdateTransaction: editTransaction,
  });

  const getInvoicePeriods = () => {
    const periods = new Set<string>();
    
    const cardsToProcess = selectedCard !== "all" 
      ? cards.filter(card => card.id === selectedCard)
      : cards;
    
    cardsToProcess.forEach(card => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      
      for (let i = 0; i < 6; i++) {
        const month = (currentMonth - i + 12) % 12;
        const year = currentMonth - i >= 0 ? currentYear : currentYear - 1;
        
        const closingDay = card.closingDay || 28;
        const dueDay = card.dueDay || 5;
        
        let startDate: Date;
        let endDate: Date;
        
        if (month === currentMonth && year === currentYear) {
          startDate = new Date(year, month, closingDay + 1);
          endDate = new Date();
        } else {
          startDate = new Date(year, month, closingDay + 1);
          endDate = new Date(year, month + 1, closingDay);
        }
        
        const monthName = new Date(year, month, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        const cardPrefix = selectedCard !== "all" ? `${card.name} - ` : '';
        periods.add(`${cardPrefix}${monthName}|${startDate.toISOString().split('T')[0]}|${endDate.toISOString().split('T')[0]}`);
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

  const totalIncome = scopeTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = scopeTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingIncome = scopeTransactions
    .filter((t) => t.type === "income" && t.status === "pending")
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingExpense = scopeTransactions
    .filter((t) => t.type === "expense" && t.status === "pending")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;
  const totalPending = pendingIncome + pendingExpense;

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (mode === "income" && t.type !== "income") return false;
      if (mode === "expense" && t.type !== "expense") return false;

      if (mode === "income" && incomeFilterMonth) {
        if (!t.date?.slice(0, 7) || t.date.slice(0, 7) !== incomeFilterMonth) {
          return false;
        }
      }

      if (mode === "expense") {
        if (
          expenseMonthFilter !== "all" &&
          (!t.date?.slice(0, 7) || t.date.slice(0, 7) !== expenseMonthFilter)
        ) {
          return false;
        }
      }

      if (
        searchTerm &&
        !t.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
        return false;

      if (filterType !== "all" && t.type !== filterType) return false;

      if (mode === "income") {
        if (
          incomeCategoryFilter !== "all" &&
          normalizeIncomeCategory(t.category, t.method) !== incomeCategoryFilter
        ) {
          return false;
        }
      } else if (filterCategory !== "all" && t.category !== filterCategory) {
        return false;
      }

      if (filterAccount !== "all" && t.account !== filterAccount) return false;

      if (selectedCard !== "all" && t.account !== selectedCard) return false;

      if (filterStatus !== "all" && t.status !== filterStatus) return false;

      if (mode !== "income" && mode !== "expense") {
        if (dateFilter === "current") {
          const now = new Date();
          const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          const transactionDate = new Date(t.date);
          return transactionDate >= startDate && transactionDate <= endDate;
        }

        if (dateFilter === "month" && selectedMonthYear) {
          const [year, month] = selectedMonthYear.split("-").map(Number);
          const startDate = new Date(year, month, 1);
          const endDate = new Date(year, month + 1, 0);
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
      }

      return true;
    });
  }, [
    transactions,
    mode,
    incomeFilterMonth,
    incomeCategoryFilter,
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
    expenseMonthFilter,
  ]);

  useEffect(() => {
    if (mode === "expense") setExpenseListPage(1);
  }, [
    mode,
    searchTerm,
    expenseMonthFilter,
    filterCategory,
    selectedCard,
    filterStatus,
    filterAccount,
    filterType,
  ]);

  const expenseTotalPages = Math.max(
    1,
    Math.ceil(filteredTransactions.length / EXPENSE_PAGE_SIZE),
  );

  const paginatedExpenseTransactions = useMemo(() => {
    if (mode !== "expense") return filteredTransactions;
    const start = (expenseListPage - 1) * EXPENSE_PAGE_SIZE;
    return filteredTransactions.slice(start, start + EXPENSE_PAGE_SIZE);
  }, [mode, filteredTransactions, expenseListPage]);

  useEffect(() => {
    if (mode !== "expense") return;
    if (expenseListPage > expenseTotalPages) {
      setExpenseListPage(expenseTotalPages);
    }
  }, [mode, expenseListPage, expenseTotalPages]);

  const filteredExpenseTotal = useMemo(() => {
    if (mode !== "expense") return 0;
    return filteredTransactions.reduce((s, t) => s + t.amount, 0);
  }, [mode, filteredTransactions]);

  const formatCurrencyIncome = (n: number) =>
    n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const incomeTotals = useMemo(() => {
    if (mode !== "income") return null;
    const list = filteredTransactions;
    const totalMonth = list.reduce((s, t) => s + t.amount, 0);
    const recurringTotal = list
      .filter((t) => isIncomeRecurringCategory(t.category, t.method))
      .reduce((s, t) => s + t.amount, 0);
    const byCat: Record<string, number> = {};
    INCOME_CATEGORIES.forEach((c) => {
      byCat[c] = 0;
    });
    list.forEach((t) => {
      const c = normalizeIncomeCategory(t.category, t.method);
      const key = (INCOME_CATEGORIES as readonly string[]).includes(c) ? c : "Outros";
      byCat[key] = (byCat[key] || 0) + t.amount;
    });
    return { totalMonth, recurringTotal, byCat };
  }, [mode, filteredTransactions]);

  const incomeSorted = useMemo(() => {
    if (mode !== "income") return [];
    return [...filteredTransactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [mode, filteredTransactions]);

  const typeFilterCountsAsActive = mode ? false : filterType !== "all";

  const hasActiveFilters =
    searchTerm ||
    typeFilterCountsAsActive ||
    (mode === "income" ? incomeCategoryFilter !== "all" : filterCategory !== "all") ||
    filterAccount !== "all" ||
    filterStatus !== "all" ||
    selectedCard !== "all" ||
    dateFilter !== "all" ||
    selectedMonthYear !== "" ||
    selectedInvoiceMonth !== "" ||
    (customStartDate && customEndDate) ||
    (mode === "expense" && expenseMonthFilter !== "all");

  const clearFilters = () => {
    setSearchTerm("");
    setFilterType(
      mode === "income" ? "income" : mode === "expense" ? "expense" : "all",
    );
    setFilterCategory("all");
    setFilterAccount("all");
    setFilterStatus("all");
    setDateFilter("all");
    setCustomStartDate("");
    setCustomEndDate("");
    setSelectedInvoiceMonth("");
    setSelectedCard("all");
    setSelectedMonthYear("");
    if (mode === "income") {
      const d = new Date();
      setIncomeFilterMonth(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      );
      setIncomeCategoryFilter("all");
    }
    if (mode === "expense") {
      setExpenseMonthFilter("all");
    }
  };

  const handleEditTransaction = (transaction: Transaction) =>
    setEditingTransaction(transaction);
  const handleSaveEditedTransaction = async (transaction: Transaction) => {
    await editTransaction(transaction);
    setEditingTransaction(null);
  };

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

  const inputStyle: React.CSSProperties = {
    backgroundColor: 'var(--input-bg)',
    borderColor: 'var(--input-border)',
    color: 'var(--text)',
  };

  const incomeMonthLabel =
    monthOptionsIncome.find((m) => m.value === incomeFilterMonth)?.label ?? "";

  const currentMonthKey = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  const expenseMonthOptions = useMemo(() => {
    const set = new Set<string>();
    scopeTransactions.forEach((t) => {
      const m = t.date?.slice(0, 7);
      if (m) set.add(m);
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [scopeTransactions]);

  const expenseBudgetNames = useMemo(
    () => budgets.filter((b) => b.type === "expense").map((b) => b.name),
    [budgets],
  );

  const expenseHeaderMonthTotal = useMemo(() => {
    return scopeTransactions
      .filter((t) => t.date?.startsWith(currentMonthKey))
      .reduce((s, t) => s + t.amount, 0);
  }, [scopeTransactions, currentMonthKey]);

  const expenseHeaderMonthCount = useMemo(() => {
    return scopeTransactions.filter((t) => t.date?.startsWith(currentMonthKey)).length;
  }, [scopeTransactions, currentMonthKey]);

  return (
    <div className={mode === "income" ? "space-y-7" : "space-y-6"}>
      {/* Summary Cards */}
      {mode === "income" ? null : !mode ? (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg" style={{ backgroundColor: "var(--card)", boxShadow: "var(--shadow)" }}>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Saldo</p>
            <p className="text-2xl font-bold" style={{ color: "var(--text)" }}>
              {balance.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </p>
          </div>
          <div className="p-4 rounded-lg" style={{ backgroundColor: "var(--card)", boxShadow: "var(--shadow)" }}>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Receitas</p>
            <p className="text-xl font-bold" style={{ color: "var(--text)" }}>
              {totalIncome.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </p>
            {pendingIncome > 0 && (
              <p className="text-sm" style={{ color: "var(--warning)" }}>
                Pendentes: {pendingIncome.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </p>
            )}
          </div>
          <div className="p-4 rounded-lg" style={{ backgroundColor: "var(--card)", boxShadow: "var(--shadow)" }}>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Despesas</p>
            <p className="text-xl font-bold" style={{ color: "var(--text)" }}>
              {totalExpense.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </p>
            {pendingExpense > 0 && (
              <p className="text-sm" style={{ color: "var(--warning)" }}>
                Pendentes: {pendingExpense.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </p>
            )}
          </div>
          <div className="p-4 rounded-lg" style={{ backgroundColor: "var(--card)", boxShadow: "var(--shadow)" }}>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Pendentes</p>
            <p className="text-xl font-bold" style={{ color: "var(--text)" }}>
              {totalPending.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </p>
          </div>
        </div>
      ) : null}

      {mode === "income" && incomeTotals ? (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text)" }}>
                Receitas
              </h1>
              <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
                Registre suas entradas financeiras
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center w-full sm:w-auto">
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-48 px-3 py-2 rounded-lg border text-sm"
                style={inputStyle}
              />
              <select
                value={incomeFilterMonth}
                onChange={(e) => setIncomeFilterMonth(e.target.value)}
                className="w-full sm:w-44 px-3 py-2 rounded-lg border text-sm"
                style={inputStyle}
              >
                {monthOptionsIncome.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <select
                value={incomeCategoryFilter}
                onChange={(e) => setIncomeCategoryFilter(e.target.value)}
                className="w-full sm:w-44 px-3 py-2 rounded-lg border text-sm"
                style={inputStyle}
                aria-label="Filtrar por categoria de receita"
              >
                <option value="all">Todas as categorias</option>
                {INCOME_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="flex items-center justify-center gap-2 px-3 py-2 text-white rounded-lg transition-colors whitespace-nowrap"
                style={{ backgroundColor: "var(--primary)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.filter = "brightness(0.9)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.filter = "";
                }}
              >
                <Plus className="w-4 h-4" />
                Nova Receita
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div
              className="rounded-2xl border p-5 shadow-sm"
              style={{
                backgroundColor: "var(--card)",
                borderColor: "var(--border)",
                boxShadow: "var(--shadow)",
              }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--text-muted)" }}
              >
                Total do Mês
              </p>
              <p className="text-2xl font-bold mt-1.5" style={{ color: "var(--success)" }}>
                {formatCurrencyIncome(incomeTotals.totalMonth)}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                {filteredTransactions.length} lançamento(s)
              </p>
            </div>
            <div
              className="rounded-2xl border p-5 shadow-sm"
              style={{
                backgroundColor: "var(--card)",
                borderColor: "var(--border)",
                boxShadow: "var(--shadow)",
              }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--text-muted)" }}
              >
                Recorrente
              </p>
              <p className="text-2xl font-bold mt-1.5" style={{ color: "var(--text)" }}>
                {formatCurrencyIncome(incomeTotals.recurringTotal)}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                {
                  filteredTransactions.filter((t) =>
                    isIncomeRecurringCategory(t.category, t.method),
                  ).length
                }{" "}
                fonte(s)
              </p>
            </div>
            <div
              className="rounded-2xl border p-5 shadow-sm"
              style={{
                backgroundColor: "var(--card)",
                borderColor: "var(--border)",
                boxShadow: "var(--shadow)",
              }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--text-muted)" }}
              >
                Eventual
              </p>
              <p className="text-2xl font-bold mt-1.5" style={{ color: "var(--text)" }}>
                {formatCurrencyIncome(
                  incomeTotals.totalMonth - incomeTotals.recurringTotal,
                )}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                Freelance, prêmios, etc.
              </p>
            </div>
          </div>

          {INCOME_CATEGORIES.some((c) => (incomeTotals.byCat[c] ?? 0) > 0) && (
            <div
              className="rounded-2xl border p-5 shadow-sm"
              style={{
                backgroundColor: "var(--card)",
                borderColor: "var(--border)",
                boxShadow: "var(--shadow)",
              }}
            >
              <h3 className="font-semibold text-sm mb-4" style={{ color: "var(--text)" }}>
                Por Categoria
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {INCOME_CATEGORIES.map((cat) => {
                  const val = incomeTotals.byCat[cat] ?? 0;
                  if (val <= 0) return null;
                  return (
                    <div
                      key={cat}
                      className="text-center p-3 rounded-xl border"
                      style={{
                        backgroundColor: "color-mix(in srgb, var(--success) 8%, transparent)",
                        borderColor: "color-mix(in srgb, var(--success) 15%, transparent)",
                      }}
                    >
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {cat}
                      </p>
                      <p
                        className="text-sm font-bold mt-1"
                        style={{ color: "var(--success)" }}
                      >
                        {formatCurrencyIncome(val)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div
            className="rounded-2xl border shadow-sm overflow-hidden"
            style={{
              backgroundColor: "var(--card)",
              borderColor: "var(--border)",
              boxShadow: "var(--shadow)",
            }}
          >
            <div
              className="p-4 border-b"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "color-mix(in srgb, var(--bg-secondary) 30%, transparent)",
              }}
            >
              <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                Lançamentos — {incomeMonthLabel}
              </p>
            </div>
            {incomeSorted.length === 0 ? (
              <div className="text-center py-16">
                <TrendingUp
                  className="w-10 h-10 mx-auto mb-3"
                  style={{ color: "var(--text-muted)", opacity: 0.35 }}
                />
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Nenhuma receita neste mês.
                </p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                {incomeSorted.map((inc) => (
                  <div
                    key={inc.id}
                    className="flex items-center gap-4 px-5 py-3.5 transition-colors"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "color-mix(in srgb, var(--bg-secondary) 30%, transparent)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: "color-mix(in srgb, var(--success) 12%, transparent)",
                      }}
                    >
                      <TrendingUp className="w-4 h-4" style={{ color: "var(--success)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
                        {inc.description}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span
                          className="text-[10px] h-4 px-1.5 rounded font-medium inline-flex items-center"
                          style={{
                            backgroundColor: "var(--bg-secondary)",
                            color: "var(--text-secondary)",
                          }}
                        >
                          {normalizeIncomeCategory(inc.category, inc.method)}
                        </span>
                        {isIncomeRecurringCategory(inc.category, inc.method) && (
                          <span
                            className="flex items-center gap-0.5 text-[10px] font-medium"
                            style={{ color: "var(--success)" }}
                          >
                            <Repeat className="w-2.5 h-2.5" /> Recorrente
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right mr-2 shrink-0">
                      <p className="text-sm font-bold" style={{ color: "var(--success)" }}>
                        +{formatCurrencyIncome(inc.amount)}
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {inc.date
                          ? format(new Date(inc.date), "dd MMM", { locale: ptBR })
                          : "—"}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditingTransaction(inc)}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: "var(--text-muted)" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                        aria-label="Editar receita"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteTransaction(inc.id)}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: "var(--danger)" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                        aria-label="Excluir receita"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : mode === "expense" ? (
        <>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text)" }}>
                Despesas
              </h1>
              <p className="mt-0.5 text-sm" style={{ color: "var(--text-muted)" }}>
                Este mês:{" "}
                <span className="font-semibold" style={{ color: "var(--text)" }}>
                  {expenseHeaderMonthTotal.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </span>
                <span className="mx-1.5" style={{ color: "var(--border)" }}>
                  ·
                </span>
                <span>{expenseHeaderMonthCount} transações</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors"
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: "var(--card)",
                  color: "var(--text)",
                }}
              >
                <Upload className="h-3.5 w-3.5" />
                Importar
              </button>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-white"
                style={{ backgroundColor: "var(--primary)" }}
              >
                <Plus className="h-3.5 w-3.5" />
                Novo gasto
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
                style={{ color: "var(--text-muted)" }}
              />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 w-44 rounded-lg border pl-9 text-sm"
                style={inputStyle}
              />
            </div>
            <select
              value={expenseMonthFilter}
              onChange={(e) => setExpenseMonthFilter(e.target.value)}
              className="h-9 w-36 rounded-lg border px-2 text-sm"
              style={inputStyle}
            >
              <option value="all">Todos os meses</option>
              {expenseMonthOptions.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="h-9 w-40 rounded-lg border px-2 text-sm"
              style={inputStyle}
            >
              <option value="all">Todas categorias</option>
              {expenseBudgetNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <select
              value={selectedCard}
              onChange={(e) => setSelectedCard(e.target.value)}
              className="h-9 w-36 rounded-lg border px-2 text-sm"
              style={inputStyle}
            >
              <option value="all">Todos cartões</option>
              {cards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {(filterCategory !== "all" ||
              selectedCard !== "all" ||
              expenseMonthFilter !== "all" ||
              searchTerm) && (
              <div className="ml-1 text-xs" style={{ color: "var(--text-muted)" }}>
                {filteredTransactions.length} resultado(s) ·{" "}
                <span className="font-semibold" style={{ color: "var(--text)" }}>
                  {filteredExpenseTotal.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </span>
              </div>
            )}
          </div>

          <div
            className="overflow-hidden rounded-2xl border shadow-sm"
            style={{
              backgroundColor: "var(--card)",
              borderColor: "var(--border)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <ExpenseGastosTable
              transactions={paginatedExpenseTransactions}
              cards={cards}
              onEdit={handleEditTransaction}
              onDelete={deleteTransaction}
              onPayInstallment={handlePayInstallment}
            />
            {filteredTransactions.length > EXPENSE_PAGE_SIZE ? (
              <Pagination
                currentPage={expenseListPage}
                totalPages={expenseTotalPages}
                onPageChange={setExpenseListPage}
              />
            ) : null}
          </div>
        </>
      ) : (
        <>
      {/* Header & Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
            Transações
          </h1>
          {!mode && (
            <>
              <span className="hidden sm:inline text-sm" style={{ color: "var(--text-muted)" }} aria-hidden>
                |
              </span>
              <div
                className="inline-flex rounded-lg p-0.5 gap-0.5 flex-wrap"
                style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border)" }}
                role="group"
                aria-label="Filtrar por tipo"
              >
                {(
                  [
                    { key: "all" as const, label: "Todos" },
                    { key: "expense" as const, label: "Gastos" },
                    { key: "income" as const, label: "Recebidos" },
                  ] as const
                ).map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFilterType(key)}
                    className="px-2.5 py-1 rounded-md text-xs font-semibold transition-colors"
                    style={{
                      backgroundColor: filterType === key ? "var(--primary)" : "transparent",
                      color: filterType === key ? "#fff" : "var(--text-secondary)",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors flex-1 sm:flex-initial"
            style={{
              backgroundColor: showFilters || hasActiveFilters ? 'var(--primary)' : 'var(--card)',
              color: showFilters || hasActiveFilters ? 'white' : 'var(--text)',
              border: showFilters || hasActiveFilters ? 'none' : '1px solid var(--border)',
            }}
            onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(0.93)'; }}
            onMouseLeave={e => { e.currentTarget.style.filter = ''; }}
          >
            <Filter size={20} />
            <span className="hidden sm:inline">Filtros</span>
            {hasActiveFilters && (
              <span className="rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold" style={{ backgroundColor: 'white', color: 'var(--primary)' }}>
                !
              </span>
            )}
          </button>
          {mode !== "income" && (
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center justify-center gap-2 px-3 py-2 text-white rounded-lg transition-colors flex-1 sm:flex-initial"
              style={{ backgroundColor: "var(--primary)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = "brightness(0.9)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = "";
              }}
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Importar Fatura</span>
            </button>
          )}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-3 py-2 text-white rounded-lg transition-colors flex-1 sm:flex-initial"
            style={{ backgroundColor: "var(--primary)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = "brightness(0.9)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = "";
            }}
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Nova transação</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div
          className="rounded-xl p-4 sm:p-6 space-y-4 animate-in slide-in-from-top-2 duration-200"
          style={{ backgroundColor: 'var(--card)', boxShadow: 'var(--shadow)', border: '1px solid var(--border)' }}
        >
          {/* Card Filter */}
          {mode !== "income" && (
          <div className="pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <h3 className="font-medium mb-3" style={{ color: 'var(--text)' }}>Cartão</h3>
            <select
              value={selectedCard}
              onChange={(e) => {
                setSelectedCard(e.target.value);
                if (e.target.value !== "all") {
                  setDateFilter("invoice");
                }
              }}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={inputStyle}
            >
              <option value="all">Todos os cartões</option>
              {cards.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.name} ({card.bank})
                </option>
              ))}
            </select>
            {selectedCard !== "all" && (() => {
              const card = cards.find(c => c.id === selectedCard);
              if (!card) return null;
              return (
                <div className="mt-2 text-sm p-2 rounded-lg" style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--primary-bg)' }}>
                  <div className="font-medium" style={{ color: 'var(--primary)' }}>{card.name}</div>
                  <div>Fechamento: {card.closingDay || 28}º dia</div>
                  <div>Vencimento: {card.dueDay || 5}º dia</div>
                </div>
              );
            })()}
          </div>
          )}

          {/* Period Filter */}
          <div className="pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <h3 className="font-medium mb-3" style={{ color: 'var(--text)' }}>Período</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setDateFilter("all");
                  setSelectedMonthYear("");
                }}
                className="px-4 py-2 rounded-lg transition-colors"
                style={{
                  backgroundColor: dateFilter === "all" && !selectedMonthYear ? 'var(--primary)' : 'var(--bg-secondary)',
                  color: dateFilter === "all" && !selectedMonthYear ? 'white' : 'var(--text)',
                }}
              >
                Todos os Meses
              </button>
              <button
                onClick={() => {
                  setDateFilter("month");
                }}
                className="px-4 py-2 rounded-lg transition-colors"
                style={{
                  backgroundColor: dateFilter === "month" ? 'var(--primary)' : 'var(--bg-secondary)',
                  color: dateFilter === "month" ? 'white' : 'var(--text)',
                }}
              >
                Mês Específico
              </button>
              <button
                onClick={() => setDateFilter("current")}
                className="px-4 py-2 rounded-lg transition-colors"
                style={{
                  backgroundColor: dateFilter === "current" ? 'var(--primary)' : 'var(--bg-secondary)',
                  color: dateFilter === "current" ? 'white' : 'var(--text)',
                }}
              >
                Mês Atual
              </button>
              {mode !== "income" && (
                <button
                  onClick={() => setDateFilter("invoice")}
                  className="px-4 py-2 rounded-lg transition-colors"
                  style={{
                    backgroundColor: dateFilter === "invoice" ? "var(--primary)" : "var(--bg-secondary)",
                    color: dateFilter === "invoice" ? "white" : "var(--text)",
                  }}
                >
                  Fatura
                </button>
              )}
              <button
                onClick={() => {
                  setDateFilter("all");
                  setSelectedMonthYear("");
                }}
                className="px-4 py-2 rounded-lg transition-colors"
                style={{
                  backgroundColor: dateFilter === "all" && (customStartDate || customEndDate) ? 'var(--primary)' : 'var(--bg-secondary)',
                  color: dateFilter === "all" && (customStartDate || customEndDate) ? 'white' : 'var(--text)',
                }}
              >
                Personalizado
              </button>
            </div>
            
            {/* Month/Year Selector */}
            {dateFilter === "month" && (
              <div className="mt-3">
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Selecione o Mês e Ano
                </label>
                <select
                  value={selectedMonthYear}
                  onChange={(e) => setSelectedMonthYear(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={inputStyle}
                >
                  <option value="">Selecione...</option>
                  {(() => {
                    const months = new Map<string, { year: number; month: number; label: string }>();
                    
                    transactions.forEach(t => {
                      const date = new Date(t.date);
                      const year = date.getFullYear();
                      const month = date.getMonth();
                      const key = `${year}-${month}`;
                      const label = new Date(year, month, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                      months.set(key, { year, month, label });
                    });
                    
                    const now = new Date();
                    for (let i = -24; i <= 6; i++) {
                      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
                      const key = `${d.getFullYear()}-${d.getMonth()}`;
                      const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                      if (!months.has(key)) {
                        months.set(key, { year: d.getFullYear(), month: d.getMonth(), label });
                      }
                    }
                    
                    const sortedMonths = Array.from(months.entries())
                      .sort((a, b) => {
                        if (a[1].year !== b[1].year) return b[1].year - a[1].year;
                        return b[1].month - a[1].month;
                      });
                    
                    return sortedMonths.map(([key, { label }]) => (
                      <option key={key} value={key}>
                        {label.charAt(0).toUpperCase() + label.slice(1)}
                      </option>
                    ));
                  })()}
                </select>
              </div>
            )}
            
            {/* Invoice Filter */}
            {dateFilter === "invoice" && (
              <div className="mt-3">
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Mês da Fatura
                </label>
                <select
                  value={selectedInvoiceMonth}
                  onChange={(e) => setSelectedInvoiceMonth(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={inputStyle}
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
                    <div className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Período: {new Date(period.startDate).toLocaleDateString('pt-BR')} até {new Date(period.endDate).toLocaleDateString('pt-BR')}
                      {selectedCard !== "all" && (() => {
                        const cardTransactions = filteredTransactions.filter(t => 
                          t.account === selectedCard && 
                          t.method === "Cartão de Crédito"
                        );
                        const totalInvoice = cardTransactions.reduce((sum, t) => sum + t.amount, 0);
                        return (
                          <div className="mt-1 font-semibold" style={{ color: 'var(--primary)' }}>
                            Total da fatura: {totalInvoice.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  );
                })()}
              </div>
            )}
            
            {/* Custom Date Filter */}
            {dateFilter === "all" && (
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Data Inicial
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Data Final
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={inputStyle}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Buscar
              </label>
              <input
                type="text"
                placeholder="Buscar transação..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={inputStyle}
              />
            </div>

            {/* Type Filter */}
            {!mode && (
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Tipo
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as TransactionType | "all")}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={inputStyle}
              >
                <option value="all">Todos</option>
                <option value="expense">Despesa</option>
                <option value="income">Receita</option>
              </select>
            </div>
            )}

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as TransactionStatus | "all")}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={inputStyle}
              >
                <option value="all">Todos</option>
                <option value="completed">Completo</option>
                <option value="pending">Pendente</option>
              </select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 rounded-lg transition-colors"
                style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text)' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--card-hover)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'; }}
              >
                Limpar Filtros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <TransactionTable
        transactions={filteredTransactions}
        title="Histórico de transações"
        onEditTransaction={handleEditTransaction}
        onDeleteTransaction={deleteTransaction}
        onPayInstallment={handlePayInstallment}
        itemsPerPage={10}
      />
        </>
      )}

      {/* Modals */}
      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddTransaction={addTransaction}
        budgets={budgets}
        cards={cards}
        defaultType={mode === "income" ? "income" : mode === "expense" ? "expense" : undefined}
        lockType={!!mode}
      />

      {editingTransaction && (
        <EditTransactionModal
          key={editingTransaction.id}
          isOpen={!!editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onEditTransaction={handleSaveEditedTransaction}
          transaction={editingTransaction}
          budgets={budgets}
          cards={cards}
        />
      )}

      <BillImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        cards={cards}
        budgets={budgets}
        onImportTransactions={onImportTransactions}
      />

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
