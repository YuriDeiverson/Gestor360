export interface User {
  id: string;
  name: string;
  email: string;
}

export type TransactionType = "income" | "expense";
export type TransactionStatus = "completed" | "pending";
export type PaymentMethod = "Cartão de Crédito" | "Débito" | "PIX" | "Salário";

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  account: string;
  method: PaymentMethod;

  /**
   * Categoria = nome do orçamento
   * Ex: "Aluguel", "Mercado", "Lazer"
   */
  category: string;

  /**
   * ID do orçamento (budget) associado a esta transação
   */
  budgetId?: string;

  /**
   * Nome do cartão (para transações de cartão)
   */
  cardName?: string;

  /**
   * Campos opcionais para parcelamento
   */
  installments?: number;
  currentInstallment?: number;
  totalAmount?: number;
  nextPaymentDate?: string;
  remainingAmount?: number;
}

export interface Filters {
  startDate: string;
  endDate: string;
  accounts: string[];
  status: TransactionStatus | "all";
}

/**
 * Orçamento é a própria categoria
 */
export interface Budget {
  id: string;
  name: string;
  budgetedAmount: number;
  color?: string;
  limit_value: number;
  /**
   * Define se esta categoria é de receita ou despesa
   */
  type: TransactionType;
  /**
   * Status é DERIVADO, não salvo
   */
  status?: "within" | "near" | "over";
}

export interface BudgetCategory {
  id: string;
  name: string;
  budgetedAmount: number;
  color: string;
  type: "income" | "expense";
}

export interface Category {
  id: string;
  name: string;
  color: string;
  type: "income" | "expense";
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;

  /**
   * Goal também referencia um orçamento
   */
  budgetId: string;
}

export interface Card {
  id: string;
  name: string;
  bank?: string;
  limit: number;
  closingDay: number;
  dueDay: number;
  currentBalance: number;
  nextDueDate?: string;
  status: "active" | "inactive" | "overdue";
}

export interface BillImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards: Card[];
  onImportTransactions: (transactions: any[]) => Promise<void>;
}

