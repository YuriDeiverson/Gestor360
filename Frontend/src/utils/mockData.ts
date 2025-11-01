import {
  Transaction,
  TransactionStatus,
  TransactionType,
  PaymentMethod,
  Goal,
  BudgetCategory,
} from "./types";

const ACCOUNTS = [
  "Conta Corrente",
  "Cartão de Crédito",
  "Investimentos",
  "Poupança",
  "Conta Principal",
];
const INDUSTRIES = [
  "Tecnologia",
  "Saúde",
  "Varejo",
  "Educação",
  "Alimentação",
  "Transporte",
  "Geral",
];
const CATEGORIES = [
  "Alimentação",
  "Moradia",
  "Transporte",
  "Lazer",
  "Salário",
  "Educação",
  "Saúde",
  // Categorias de orçamento
  "Orçamento - Alimentação",
  "Orçamento - Transporte",
  "Orçamento - Moradia",
  "Orçamento - Lazer",
  "Orçamento - Educação",
  "Orçamento - Saúde",
];
const METHODS: PaymentMethod[] = ["Cartão de Crédito", "Débito", "PIX"];

const getRandomElement = <T>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

const generateRandomTransaction = (id: number): Transaction => {
  const date = new Date(
    Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000,
  );
  const type: TransactionType = Math.random() > 0.4 ? "expense" : "income";
  const amount =
    type === "expense"
      ? Math.floor(Math.random() * 500) + 10
      : Math.floor(Math.random() * 2000) + 100;
  const status: TransactionStatus =
    Math.random() > 0.15 ? "completed" : "pending";

  return {
    id: `txn_${id}`,
    date: date.toISOString().split("T")[0],
    description: `Transação #${id}`,
    amount,
    type,
    status,
    account: getRandomElement(ACCOUNTS),
    industry: getRandomElement(INDUSTRIES),
    method: getRandomElement(METHODS),
    category:
      type === "income"
        ? "Salário"
        : getRandomElement(CATEGORIES.filter((c) => c !== "Salário")),
  };
};

export const mockTransactions: Transaction[] = [
  // Transações parceladas de exemplo para testar o botão de expandir
  {
    id: "txn_installment_1",
    date: "2024-10-15",
    description: "Notebook Dell - Parcelado",
    amount: 416.67, // R$ 5000 / 12 parcelas
    type: "expense",
    status: "pending",
    account: "Cartão de Crédito",
    industry: "Tecnologia",
    method: "Cartão de Crédito",
    category: "Tecnologia",
    installments: 12,
    currentInstallment: 3,
    totalAmount: 5000,
    remainingAmount: 3750, // R$ 5000 - (3 * 416.67)
    nextPaymentDate: "2024-11-15",
  },
  {
    id: "txn_installment_2",
    date: "2024-09-20",
    description: "Móveis para Casa - Parcelado",
    amount: 250,
    type: "expense",
    status: "completed",
    account: "Cartão de Crédito",
    industry: "Varejo",
    method: "Cartão de Crédito",
    category: "Moradia",
    installments: 10,
    currentInstallment: 2,
    totalAmount: 2500,
    remainingAmount: 2000,
    nextPaymentDate: "2024-11-20",
  },
  {
    id: "txn_installment_3",
    date: "2024-08-10",
    description: "Curso Online - Parcelado",
    amount: 199.9,
    type: "expense",
    status: "pending",
    account: "Cartão de Crédito",
    industry: "Educação",
    method: "Cartão de Crédito",
    category: "Educação",
    installments: 6,
    currentInstallment: 1,
    totalAmount: 1199.4,
    remainingAmount: 999.5,
    nextPaymentDate: "2024-11-10",
  },
  // Transações normais (não parceladas) para comparação
  {
    id: "txn_normal_1",
    date: "2024-11-01",
    description: "Supermercado",
    amount: 150.5,
    type: "expense",
    status: "completed",
    account: "Conta Corrente",
    industry: "Alimentação",
    method: "Débito",
    category: "Alimentação",
  },
  {
    id: "txn_normal_2",
    date: "2024-10-30",
    description: "Salário Outubro",
    amount: 5000,
    type: "income",
    status: "completed",
    account: "Conta Corrente",
    industry: "Geral",
    method: "PIX",
    category: "Salário",
  },
  // Resto das transações aleatórias
  ...Array.from({ length: 145 }, (_, i) => generateRandomTransaction(i + 6)),
];

export const mockGoals: Goal[] = [
  {
    id: "goal1",
    name: "Viagem para a Europa",
    targetAmount: 20000,
    currentAmount: 7500,
    deadline: "2025-12-31",
    category: "Lazer",
  },
  {
    id: "goal2",
    name: "Entrada do Apartamento",
    targetAmount: 100000,
    currentAmount: 45000,
    deadline: "2026-06-30",
    category: "Moradia",
  },
  {
    id: "goal3",
    name: "Curso de Especialização",
    targetAmount: 15000,
    currentAmount: 14000,
    deadline: "2024-12-31",
    category: "Educação",
  },
];

export const mockBudgetCategories: BudgetCategory[] = [
  { id: "cat1", name: "Alimentação", budgetedAmount: 1500 },
  { id: "cat2", name: "Transporte", budgetedAmount: 400 },
  { id: "cat3", name: "Lazer", budgetedAmount: 800 },
  { id: "cat4", name: "Moradia", budgetedAmount: 2500 },
];

export const availableAccounts = [...ACCOUNTS];
export const availableIndustries = [...INDUSTRIES];
// availableCategories removido - usar categorias dinâmicas criadas pelo usuário
