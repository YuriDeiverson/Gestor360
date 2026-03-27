import type { Transaction } from "./types";
import type { BudgetCategory } from "./api";
import { formatCurrency } from "./helpers";
import { getCurrentMonthKey } from "./dateMonth";

export type FinancialAlertSeverity = "danger" | "warning";

export interface FinancialAlert {
  id: string;
  type: FinancialAlertSeverity;
  title: string;
  message: string;
}

/**
 * Mesmas regras que o antigo banner do dashboard — exibidas no centro de notificações.
 */
export function computeFinancialAlerts(
  transactions: Transaction[],
  budgets: BudgetCategory[],
  cards: Array<{ limit: number; currentBalance: number }>,
): FinancialAlert[] {
  const currentMonth = getCurrentMonthKey();
  const alerts: FinancialAlert[] = [];

  const monthExpenses = transactions.filter(
    (t) =>
      t.type === "expense" &&
      typeof t.date === "string" &&
      t.date.startsWith(currentMonth) &&
      (t.status === "completed" || t.status === "pending"),
  );
  const catSpending: Record<string, number> = {};
  monthExpenses.forEach((e) => {
    const k = e.category || "Outros";
    catSpending[k] = (catSpending[k] || 0) + (e.amount || 0);
  });

  const monthIncome = transactions
    .filter(
      (t) =>
        t.type === "income" &&
        t.status === "completed" &&
        typeof t.date === "string" &&
        t.date.startsWith(currentMonth),
    )
    .reduce((s, t) => s + (t.amount || 0), 0);
  const totalSpent = monthExpenses.reduce((s, t) => s + (t.amount || 0), 0);
  const netBalance = monthIncome - totalSpent;

  const expenseBudgets = budgets.filter((b) => b.type === "expense");
  expenseBudgets.forEach((b) => {
    const spent = catSpending[b.name] || 0;
    const pct =
      b.budgetedAmount > 0 ? (spent / b.budgetedAmount) * 100 : 0;
    if (pct > 100) {
      alerts.push({
        id: `budget-over-${b.id}`,
        type: "danger",
        title: `Orçamento: ${b.name}`,
        message: `Excedido em ${(pct - 100).toFixed(0)}% do planejado.`,
      });
    } else if (pct >= 85) {
      alerts.push({
        id: `budget-warn-${b.id}`,
        type: "warning",
        title: `Orçamento: ${b.name}`,
        message: `Uso em ${pct.toFixed(0)}% — atenção ao limite.`,
      });
    }
  });

  const totalCardLimit = cards.reduce((s, c) => s + (c.limit || 0), 0);
  const totalCardBalance = cards.reduce(
    (s, c) => s + (c.currentBalance || 0),
    0,
  );
  const cardUsagePercent =
    totalCardLimit > 0 ? (totalCardBalance / totalCardLimit) * 100 : 0;
  if (cardUsagePercent > 80 && cards.length > 0) {
    alerts.push({
      id: "cards-usage",
      type: "warning",
      title: "Cartões de crédito",
      message: `Uso total em ${cardUsagePercent.toFixed(0)}% do limite combinado.`,
    });
  }

  if (netBalance < 0) {
    alerts.push({
      id: "month-negative",
      type: "danger",
      title: "Saldo do mês",
      message: `Negativo (${formatCurrency(netBalance)}). Gastos superaram as receitas.`,
    });
  }

  return alerts;
}
