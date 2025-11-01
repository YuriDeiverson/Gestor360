export interface User {
  id: string;
  name: string;
  email: string;
}

export type TransactionType = "income" | "expense" | "budget";
export type TransactionStatus = "completed" | "pending";
export type PaymentMethod = "Cartão de Crédito" | "Débito" | "PIX";

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  account: string;
  industry: string; // Could be deprecated or reused
  method: PaymentMethod;
  category: string;
  // Propriedades para parcelamento
  installments?: number; // Número total de parcelas
  currentInstallment?: number; // Parcela atual (1, 2, 3, etc.)
  totalAmount?: number; // Valor total da compra (antes do parcelamento)
  nextPaymentDate?: string; // Data do próximo pagamento
  remainingAmount?: number; // Valor total restante a pagar
}

export interface Filters {
  startDate: string;
  endDate: string;
  accounts: string[];
  industries: string[];
  status: TransactionStatus | "all";
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: string;
}

export interface BudgetCategory {
  id: string;
  name: string;
  budgetedAmount: number;
}

export interface Category {
  id: string;
  name: string;
  type: "income" | "expense" | "budget" | "both";
  description?: string;
  icon?: string;
  color?: string;
}
