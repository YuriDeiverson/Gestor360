import React, { useMemo, useState } from "react";
import { Transaction, Goal } from "../utils/types";
import SummaryCard from "./SummaryCard";
import { ICONS } from "../constants";
import TransactionCharts from "./TransactionCharts";
import RecentActivity from "./RecentActivity";

interface DashboardContentProps {
  transactions: Transaction[];
  goals: Goal[];
  setActivePage: (page: string) => void;
  payInstallment?: (transaction: Transaction) => void;
}

type ChartType = "line" | "area" | "bar";

const DashboardContent: React.FC<DashboardContentProps> = ({
  transactions,
  setActivePage,
  payInstallment,
}) => {
  const [chartType, setChartType] = useState<ChartType>("area");
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear(),
  );

  /* =====================
     AVAILABLE YEARS
  ===================== */
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    transactions.forEach((t) => years.add(new Date(t.date).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions]);

  const validYear = availableYears.includes(selectedYear)
    ? selectedYear
    : availableYears[0];

  /* =====================
     FILTERED TRANSACTIONS
  ===================== */
  const filteredTransactions = useMemo(
    () =>
      transactions.filter((t) => new Date(t.date).getFullYear() === validYear),
    [transactions, validYear],
  );

  /* =====================
     SUMMARY
  ===================== */
  const summary = useMemo(() => {
    const completed = filteredTransactions.filter(
      (t) => t.status === "completed",
    );
    const pending = filteredTransactions.filter((t) => t.status === "pending");

    let totalIncome = 0;
    let totalExpense = 0;
    let pendingExpense = 0;

    completed.forEach((t) => {
      if (t.type === "income") totalIncome += t.amount;
      else totalExpense += t.amount;
    });

    pending.forEach((t) => {
      if (t.type === "expense") pendingExpense += t.amount;
    });

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      pendingExpense,
    };
  }, [filteredTransactions]);

  return (
    <div className="space-y-8">
      {/* =====================
         SUMMARY CARDS
      ===================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard
          title="Saldo Total"
          value={summary.balance}
          subtitle={`Acumulado: ${new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(summary.balance)}`}
          subtitleColor="text-blue-600"
          showBorder={true}
          icon={ICONS.balance}
          variant={summary.balance >= 0 ? "positive" : "negative"}
        />
        <SummaryCard
          title="Receitas"
          value={summary.totalIncome}
          icon={ICONS.income}
          variant="positive"
        />
        <SummaryCard
          title="Despesas"
          value={summary.totalExpense}
          subtitle={`Pendente: ${new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(summary.pendingExpense)}`}
          subtitleColor="text-amber-600"
          showBorder={true}
          icon={ICONS.expense}
          variant="negative"
        />
        <SummaryCard
          title="Cartões"
          value={0}
          subtitle="Em breve"
          icon={ICONS.creditCard}
          variant="neutral"
        />
      </div>

      {/* =====================
         MAIN CONTENT
      ===================== */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* FLUXO DE CAIXA */}
        <div className="xl:col-span-2 bg-white rounded-2xl p-6 shadow-sm flex flex-col min-h-[520px]">
          <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
            <h3 className="text-lg font-medium text-gray-900">
              Fluxo de Caixa
            </h3>

            <div className="flex gap-2">
              <div className="flex rounded-lg border border-gray-200 overflow-hidden bg-white">
                {(["area", "line", "bar"] as ChartType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setChartType(type)}
                    className={`px-4 py-2 text-sm font-medium transition ${
                      chartType === type
                        ? "bg-emerald-600 text-white"
                        : "bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {type === "area"
                      ? "Área"
                      : type === "line"
                      ? "Linha"
                      : "Barra"}
                  </button>
                ))}
              </div>

              <select
                value={validYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="text-sm border rounded-lg px-3 py-2"
              >
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1">
            <TransactionCharts
              data={filteredTransactions}
              chartType={chartType}
            />
          </div>
        </div>

        {/* TRANSAÇÕES RECENTES */}
        <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Transações recentes
            </h3>
            <button
              onClick={() => setActivePage("transactions")}
              className="text-sm text-emerald-600 hover:underline"
            >
              Ver todas
            </button>
          </div>

          <div className="flex-1 overflow-auto">
            <RecentActivity
              transactions={filteredTransactions}
              setActivePage={setActivePage}
              onPayInstallment={payInstallment}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;
