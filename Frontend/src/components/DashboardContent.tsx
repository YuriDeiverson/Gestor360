import React, { useMemo } from "react";
import { Transaction, Goal } from "../utils/types";
import SummaryCard from "./SummaryCard";
import { ICONS } from "../constants";
import TransactionCharts from "./TransactionCharts";
import ExpenseDonutChart from "./ExpenseDonutChart";
import RecentActivity from "./RecentActivity";
import GoalsOverview from "./GoalsOverview";

interface DashboardContentProps {
  transactions: Transaction[];
  goals: Goal[];
  setActivePage: (page: string) => void;
  payInstallment?: (transaction: Transaction) => void;
}

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const DashboardContent: React.FC<DashboardContentProps> = ({
  transactions,
  goals,
  setActivePage,
  payInstallment,
}) => {
  // Aggregações com distinção explícita entre receita e despesa
  const summary = useMemo(() => {
    const completed = transactions.filter((t) => t.status === "completed");

    const totals = completed.reduce(
      (acc, t) => {
        if (t.type === "income") {
          acc.totalIncome += t.amount;
          acc.incomeCount += 1;
        } else {
          acc.totalExpense += t.amount;
          acc.expenseCount += 1;
        }
        return acc;
      },
      {
        totalIncome: 0,
        totalExpense: 0,
        incomeCount: 0,
        expenseCount: 0,
        balance: 0,
        netPct: 0,
        avgIncome: 0,
        avgExpense: 0,
      },
    );

    totals.balance = totals.totalIncome - totals.totalExpense;
    totals.netPct =
      totals.totalIncome > 0 ? (totals.balance / totals.totalIncome) * 100 : 0;
    totals.avgIncome = totals.incomeCount
      ? totals.totalIncome / totals.incomeCount
      : 0;
    totals.avgExpense = totals.expenseCount
      ? totals.totalExpense / totals.expenseCount
      : 0;

    return totals;
  }, [transactions]);

  const topExpenseCategories = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach((t) => {
      if (t.type === "expense" && t.status === "completed") {
        const cat = t.category || "Outros";
        map[cat] = (map[cat] || 0) + t.amount;
      }
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, amount]) => ({ name, amount }));
  }, [transactions]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 xl:gap-8">
      {/* Conteúdo Principal */}
      <div className="xl:col-span-2 space-y-6">
        {/* Summary Cards - Desktop original, Mobile responsivo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <SummaryCard
            title="Receita Total"
            value={summary.totalIncome}
            subtitle={`${summary.incomeCount} transações`}
            icon={ICONS.income}
            variant="positive"
          />
          <SummaryCard
            title="Despesa Total"
            value={summary.totalExpense}
            subtitle={`${summary.expenseCount} transações`}
            icon={ICONS.expense}
            variant="negative"
          />
          <SummaryCard
            title="Saldo Atual"
            value={summary.balance}
            subtitle={`${summary.netPct.toFixed(1)}% líquido`}
            icon={ICONS.balance}
            variant={summary.balance >= 0 ? "positive" : "negative"}
          />
        </div>

        {/* Gráfico de Fluxo - Desktop original, Mobile com padding menor */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 sm:p-6 shadow-[0_8px_36px_rgba(12,12,16,0.06)] transition">
          <h3 className="text-sm text-gray-500 mb-4">
            Fluxo (últimos 30 dias)
          </h3>
          <TransactionCharts data={transactions} />
        </div>

        {/* Atividade Recente - Desktop original, Mobile otimizado */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 sm:p-6 shadow-[0_8px_36px_rgba(12,12,16,0.06)] transition">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Atividade recente
            </h3>
            <button
              onClick={() => setActivePage("transactions")}
              className="text-sm text-sky-600 hover:underline cursor-pointer touch-manipulation"
              aria-label="Ver todas transações"
            >
              Ver todas
            </button>
          </div>
          <RecentActivity
            transactions={transactions}
            setActivePage={setActivePage}
            onPayInstallment={payInstallment}
          />
        </div>
      </div>

      {/* Sidebar Direita - Desktop original, Mobile responsivo */}
      <aside className="space-y-6">
        {/* Distribuição de Gastos */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 sm:p-6 shadow-[0_8px_36px_rgba(12,12,16,0.06)]">
          <h4 className="text-sm text-gray-500 mb-4">Distribuição de gastos</h4>
          <ExpenseDonutChart data={transactions} />
          <div className="mt-4">
            <h5 className="text-sm text-gray-600 mb-2">
              Principais categorias
            </h5>
            <ul className="space-y-2 text-sm">
              {topExpenseCategories.length === 0 && (
                <li className="text-gray-400">Sem despesas registradas</li>
              )}
              {topExpenseCategories.map((c) => (
                <li key={c.name} className="flex justify-between">
                  <span className="truncate pr-2">{c.name}</span>
                  <strong>{currency.format(c.amount)}</strong>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Metas */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 sm:p-6 shadow-[0_8px_36px_rgba(12,12,16,0.06)]">
          <h4 className="text-sm text-gray-500 mb-4">Metas</h4>
          <GoalsOverview goals={goals} setActivePage={setActivePage} />
        </div>
      </aside>
    </div>
  );
};

export default DashboardContent;
