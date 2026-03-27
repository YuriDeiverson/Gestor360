import React, { useMemo, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Target,
  ArrowRight,
  Calendar,
  CreditCard,
  type LucideIcon,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Transaction } from "../utils/types";
import type { Subscription } from "../utils/subscriptionsApi";
import type { Meta, BudgetCategory } from "../utils/api";
import RecentActivity from "./RecentActivity";
import {
  getCurrentMonthKey,
  getPreviousMonthKey,
  getLastNMonthKeys,
  shortMonthLabelFromKey,
} from "../utils/dateMonth";
import { formatCurrency } from "../utils/helpers";

interface DashboardContentProps {
  transactions: Transaction[];
  transactionsAll?: Transaction[];
  subscriptions?: Subscription[];
  goals: Meta[];
  budgets?: BudgetCategory[];
  setActivePage: (page: string) => void;
  payInstallment?: (transaction: Transaction) => void;
}

const PIE_COLORS = [
  "#10b981",
  "#f43f5e",
  "#8b5cf6",
  "#f59e0b",
  "#3b82f6",
  "#ec4899",
];

function formatPct(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return "—";
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(1)}%`;
}

const shellCard =
  "rounded-2xl border p-5 shadow-sm transition-opacity duration-300";

const DashboardKpiCard: React.FC<{
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  gradientClass: string;
  change?: number | null;
  changeLabel?: string;
  /** Se false, queda no indicador é considerada boa (ex.: menos gastos). */
  higherIsBetter?: boolean;
}> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  gradientClass,
  change,
  changeLabel,
  higherIsBetter = true,
}) => {
  const good =
    change != null &&
    (higherIsBetter ? change > 0 : change < 0);
  const bad =
    change != null &&
    (higherIsBetter ? change < 0 : change > 0);

  return (
    <div
      className={shellCard}
      style={{
        backgroundColor: "var(--card)",
        borderColor: "var(--border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm ${gradientClass}`}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        {change != null && (
          <span
            className="text-xs font-semibold"
            style={{
              color: good
                ? "var(--success)"
                : bad
                  ? "var(--danger)"
                  : "var(--text-secondary)",
            }}
          >
            {formatPct(change)}
            {changeLabel ? (
              <span
                className="font-normal"
                style={{ color: "var(--text-muted)" }}
              >
                {" "}
                {changeLabel}
              </span>
            ) : null}
          </span>
        )}
      </div>
      <p
        className="mt-3 text-[11px] font-semibold uppercase tracking-wide"
        style={{ color: "var(--text-secondary)" }}
      >
        {title}
      </p>
      <p
        className="mt-1 text-xl font-bold leading-tight"
        style={{ color: "var(--text)" }}
      >
        {value}
      </p>
      {subtitle && (
        <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
          {subtitle}
        </p>
      )}
    </div>
  );
};

function inMonth(t: Transaction, monthKey: string): boolean {
  return typeof t.date === "string" && t.date.startsWith(monthKey);
}

/** Despesas do mês: concluídas + pendentes (parcelas em aberto contam no comprometido). */
function countsAsMonthExpense(t: Transaction, monthKey: string): boolean {
  return (
    t.type === "expense" &&
    inMonth(t, monthKey) &&
    (t.status === "completed" || t.status === "pending")
  );
}

function countsAsMonthIncome(t: Transaction, monthKey: string): boolean {
  return (
    t.type === "income" &&
    t.status === "completed" &&
    inMonth(t, monthKey)
  );
}

const DashboardContent: React.FC<DashboardContentProps> = ({
  transactions,
  transactionsAll,
  subscriptions = [],
  goals = [],
  budgets = [],
  setActivePage,
  payInstallment,
}) => {
  const txFull = transactionsAll ?? transactions;

  const currentMonth = getCurrentMonthKey();
  const prevMonth = getPreviousMonthKey();
  const last6 = useMemo(() => getLastNMonthKeys(6), []);

  const monthIncomeRows = useMemo(
    () => txFull.filter((t) => countsAsMonthIncome(t, currentMonth)),
    [txFull, currentMonth],
  );
  const monthExpenseRows = useMemo(
    () => txFull.filter((t) => countsAsMonthExpense(t, currentMonth)),
    [txFull, currentMonth],
  );

  const prevIncomeRows = useMemo(
    () => txFull.filter((t) => countsAsMonthIncome(t, prevMonth)),
    [txFull, prevMonth],
  );
  const prevExpenseRows = useMemo(
    () => txFull.filter((t) => countsAsMonthExpense(t, prevMonth)),
    [txFull, prevMonth],
  );

  const totalIncome = monthIncomeRows.reduce((s, t) => s + (t.amount || 0), 0);
  const totalSpent = monthExpenseRows.reduce((s, t) => s + (t.amount || 0), 0);

  const prevIncome = prevIncomeRows.reduce((s, t) => s + (t.amount || 0), 0);
  const prevSpent = prevExpenseRows.reduce((s, t) => s + (t.amount || 0), 0);

  const netBalance = totalIncome - totalSpent;

  const spentChange =
    prevSpent > 0 ? ((totalSpent - prevSpent) / prevSpent) * 100 : null;
  const incomeChange =
    prevIncome > 0 ? ((totalIncome - prevIncome) / prevIncome) * 100 : null;

  const barData = useMemo(
    () =>
      last6.map((m) => {
        const incomeSum = txFull
          .filter(
            (t) =>
              t.type === "income" &&
              t.status === "completed" &&
              typeof t.date === "string" &&
              t.date.startsWith(m),
          )
          .reduce((s, t) => s + (t.amount || 0), 0);
        const expenseSum = txFull
          .filter((t) => countsAsMonthExpense(t, m))
          .reduce((s, t) => s + (t.amount || 0), 0);
        return {
          name: shortMonthLabelFromKey(m),
          Receitas: incomeSum,
          Gastos: expenseSum,
        };
      }),
    [txFull, last6],
  );

  const catSpending: Record<string, number> = {};
  monthExpenseRows.forEach((e) => {
    const k = e.category || "Outros";
    catSpending[k] = (catSpending[k] || 0) + (e.amount || 0);
  });

  const pieData = Object.entries(catSpending)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([key, value]) => ({ name: key, value, key }));

  const expenseBudgets = budgets.filter((b) => b.type === "expense");

  const goalProgress = goals.map((g) => ({
    ...g,
    percent:
      g.targetAmount > 0
        ? ((g.currentAmount || 0) / g.targetAmount) * 100
        : 0,
  }));

  const completedGoals = goals.filter(
    (g) => (g.currentAmount || 0) >= (g.targetAmount || 0)
  ).length;
  const totalGoalsProgress =
    goals.length > 0
      ? (goals.reduce(
          (s, g) =>
            s +
            Math.min(
              (g.currentAmount || 0) / (g.targetAmount || 1),
              1
            ),
          0
        ) /
          goals.length) *
        100
      : 0;

  const today = new Date().getDate();
  const upcomingBills = subscriptions.filter((s) => {
    const bd = s.billingDay;
    const days =
      bd >= today ? bd - today : bd + 30 - today;
    return days <= 7;
  });
  const upcomingTotal = upcomingBills.reduce(
    (s, sub) => s + (sub.amount || 0),
    0
  );

  const recentSource = useMemo(
    () =>
      [...txFull].filter(
        (t) =>
          t.status === "completed" ||
          (t.status === "pending" && t.type === "expense"),
      ),
    [txFull],
  );

  const pendingInstallments = useMemo(() => {
    const list = txFull.filter(
      (t) =>
        t.type === "expense" &&
        t.status === "pending" &&
        (t.installments ?? 1) > 1,
    );
    return [...list].sort(
      (a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [txFull]);

  type RecentFilter = "all" | "income" | "expense";
  const [recentFilter, setRecentFilter] = useState<RecentFilter>("all");

  const recentFiltered = useMemo(() => {
    if (recentFilter === "all") return recentSource;
    if (recentFilter === "income") {
      return recentSource.filter((t) => t.type === "income");
    }
    return recentSource.filter((t) => t.type === "expense");
  }, [recentSource, recentFilter]);

  const tooltipStyle = {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    fontSize: "12px",
    color: "var(--text)",
  };

  return (
    <div className="space-y-7">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <DashboardKpiCard
          title="Receita do Mês"
          value={formatCurrency(totalIncome)}
          icon={TrendingUp}
          gradientClass="bg-gradient-to-br from-emerald-400 to-emerald-600"
          change={incomeChange}
          changeLabel="vs mês ant."
        />
        <DashboardKpiCard
          title="Gastos do Mês"
          value={formatCurrency(totalSpent)}
          icon={TrendingDown}
          gradientClass="bg-gradient-to-br from-rose-400 to-rose-600"
          change={spentChange != null ? -spentChange : null}
          changeLabel="vs mês ant."
          higherIsBetter
        />
        <DashboardKpiCard
          title="Cobranças (7 dias)"
          value={formatCurrency(upcomingTotal)}
          subtitle={`${upcomingBills.length} assinatura(s) vencendo`}
          icon={Calendar}
          gradientClass="bg-gradient-to-br from-amber-400 to-amber-600"
        />
        <DashboardKpiCard
          title="Metas"
          value={`${completedGoals}/${goals.length}`}
          subtitle={`Progresso médio: ${totalGoalsProgress.toFixed(0)}%`}
          icon={Target}
          gradientClass="bg-gradient-to-br from-violet-400 to-violet-600"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div
            className={shellCard}
            style={{
              backgroundColor: "var(--card)",
              borderColor: "var(--border)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3
                  className="text-base font-semibold"
                  style={{ color: "var(--text)" }}
                >
                  Receitas vs Gastos
                </h3>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Últimos 6 meses
                </p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} barGap={4} barSize={18}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border-light)"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) =>
                    `R$${(v / 1000).toFixed(0)}k`
                  }
                />
                <Tooltip
                  formatter={(v) => formatCurrency(Number(v))}
                  contentStyle={tooltipStyle}
                />
                <Bar
                  dataKey="Receitas"
                  fill="hsl(167,68%,42%)"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="Gastos"
                  fill="hsl(0,80%,56%)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 flex justify-center gap-5">
              <div
                className="flex items-center gap-2 text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                <span className="h-3 w-3 rounded-sm bg-emerald-500" />
                Receitas
              </div>
              <div
                className="flex items-center gap-2 text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                <span className="h-3 w-3 rounded-sm bg-rose-500" />
                Gastos
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div
            className={shellCard}
            style={{
              backgroundColor: "var(--card)",
              borderColor: "var(--border)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <h3
              className="mb-1 text-base font-semibold"
              style={{ color: "var(--text)" }}
            >
              Gastos por Categoria
            </h3>
            <p className="mb-4 text-xs" style={{ color: "var(--text-muted)" }}>
              Este mês
            </p>
            {pieData.length === 0 ? (
              <p
                className="py-10 text-center text-sm"
                style={{ color: "var(--text-muted)" }}
              >
                Sem dados
              </p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={78}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, i) => (
                        <Cell
                          key={entry.key}
                          fill={PIE_COLORS[i % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => formatCurrency(Number(v))}
                      contentStyle={tooltipStyle}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 space-y-1.5">
                  {pieData.map((entry, i) => (
                    <div
                      key={entry.key}
                      className="flex items-center justify-between text-xs"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{
                            backgroundColor:
                              PIE_COLORS[i % PIE_COLORS.length],
                          }}
                        />
                        <span
                          className="truncate"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {entry.name}
                        </span>
                      </div>
                      <span
                        className="shrink-0 font-medium"
                        style={{ color: "var(--text)" }}
                      >
                        {totalSpent > 0
                          ? ((entry.value / totalSpent) * 100).toFixed(0)
                          : 0}
                        %
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div
            className={shellCard}
            style={{
              backgroundColor: "var(--card)",
              borderColor: "var(--border)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <h3
                  className="text-base font-semibold"
                  style={{ color: "var(--text)" }}
                >
                  Transações Recentes
                </h3>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Receitas e gastos
                </p>
                <div
                  className="mt-3 inline-flex flex-wrap gap-1 rounded-lg p-0.5"
                  style={{
                    backgroundColor: "var(--bg-secondary)",
                    border: "1px solid var(--border)",
                  }}
                  role="group"
                  aria-label="Filtrar por tipo"
                >
                  {(
                    [
                      { id: "all" as const, label: "Todas" },
                      { id: "income" as const, label: "Receitas" },
                      { id: "expense" as const, label: "Despesas" },
                    ] as const
                  ).map(({ id, label }) => {
                    const active = recentFilter === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setRecentFilter(id)}
                        className="rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
                        style={{
                          backgroundColor: active
                            ? "var(--card)"
                            : "transparent",
                          color: active ? "var(--text)" : "var(--text-muted)",
                          boxShadow: active ? "var(--shadow-sm)" : "none",
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setActivePage(
                    recentFilter === "income"
                      ? "income"
                      : recentFilter === "expense"
                        ? "expenses"
                        : "expenses"
                  )
                }
                className="flex shrink-0 items-center gap-1 self-start text-xs font-medium hover:underline sm:self-center"
                style={{ color: "var(--primary)" }}
              >
                Ver tudo <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            <RecentActivity
              transactions={recentFiltered}
              setActivePage={setActivePage}
              onPayInstallment={payInstallment}
              variant="plain"
              maxItems={8}
            />
          </div>
        </div>

        <div className="space-y-5">
          <div
            className={shellCard}
            style={{
              backgroundColor: "var(--card)",
              borderColor: "var(--border)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                Metas
              </h3>
              <button
                type="button"
                onClick={() => setActivePage("goals")}
                className="flex items-center gap-1 text-xs font-medium hover:underline"
                style={{ color: "var(--primary)" }}
              >
                Ver <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            <div className="space-y-3">
              {goalProgress.length === 0 ? (
                <p
                  className="py-4 text-center text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  Nenhuma meta
                </p>
              ) : (
                goalProgress.slice(0, 3).map((g) => (
                  <div key={g.id}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="max-w-[120px] truncate font-medium" style={{ color: "var(--text)" }}>
                        {g.name}
                      </span>
                      <span style={{ color: "var(--text-muted)" }}>
                        {g.percent.toFixed(0)}%
                      </span>
                    </div>
                    <div
                      className="h-1.5 overflow-hidden rounded-full"
                      style={{ backgroundColor: "var(--bg-secondary)" }}
                    >
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-indigo-600"
                        style={{
                          width: `${Math.min(g.percent, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div
            className={shellCard}
            style={{
              backgroundColor: "var(--card)",
              borderColor: "var(--border)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                Orçamento
              </h3>
              <button
                type="button"
                onClick={() => setActivePage("budgets")}
                className="flex items-center gap-1 text-xs font-medium hover:underline"
                style={{ color: "var(--primary)" }}
              >
                Ver <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            <div className="space-y-2.5">
              {expenseBudgets.length === 0 ? (
                <p
                  className="py-4 text-center text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  Nenhum orçamento
                </p>
              ) : (
                expenseBudgets.slice(0, 4).map((b) => {
                  const spent = catSpending[b.name] || 0;
                  const pct =
                    b.budgetedAmount > 0
                      ? (spent / b.budgetedAmount) * 100
                      : 0;
                  return (
                    <div key={b.id}>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="font-medium" style={{ color: "var(--text)" }}>
                          {b.name}
                        </span>
                        <span
                          className={
                            pct > 100 ? "font-semibold" : ""
                          }
                          style={{
                            color:
                              pct > 100
                                ? "var(--danger-light)"
                                : "var(--text-muted)",
                          }}
                        >
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                      <div
                        className="h-1.5 overflow-hidden rounded-full"
                        style={{ backgroundColor: "var(--bg-secondary)" }}
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(pct, 100)}%`,
                            backgroundColor:
                              pct > 100
                                ? "var(--danger-light)"
                                : pct >= 80
                                  ? "var(--warning)"
                                  : "var(--success)",
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {pendingInstallments.length > 0 && (
            <div
              className={shellCard}
              style={{
                backgroundColor: "var(--card)",
                borderColor: "var(--border)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div className="mb-3 flex items-center gap-2">
                <CreditCard
                  className="h-4 w-4 shrink-0"
                  style={{ color: "var(--primary)" }}
                  aria-hidden
                />
                <h3
                  className="text-sm font-semibold"
                  style={{ color: "var(--text)" }}
                >
                  Compras parceladas
                </h3>
              </div>
              <ul className="space-y-2">
                {pendingInstallments.map((t) => {
                  const cur = t.currentInstallment ?? 1;
                  const total = t.installments ?? 1;
                  return (
                    <li
                      key={t.id}
                      className="flex min-w-0 items-center gap-2 border-t pt-2 first:border-t-0 first:pt-0"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <span
                        className="min-w-0 flex-1 truncate text-xs font-medium"
                        style={{ color: "var(--text)" }}
                        title={t.description}
                      >
                        {t.description}
                      </span>
                      <span
                        className="shrink-0 text-xs tabular-nums"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {cur}/{total}
                      </span>
                      {payInstallment ? (
                        <button
                          type="button"
                          onClick={() => payInstallment(t)}
                          className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold text-white transition active:scale-[0.98]"
                          style={{ backgroundColor: "var(--primary)" }}
                        >
                          Pagar
                        </button>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;
