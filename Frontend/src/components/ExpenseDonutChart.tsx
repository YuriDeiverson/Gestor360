import React, { useMemo, useState, useEffect } from "react";
import { Transaction } from "../utils/types";
import { formatCurrency } from "../utils/helpers";

interface ExpenseDonutChartProps {
  data: Transaction[];
}

const COLORS = [
  "#0f766e",
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#8b5cf6",
  "#f43f5e",
  "#94a3b8",
];

const CustomTooltip: React.FC<{ active?: boolean; payload?: any[] }> = ({
  active,
  payload,
}) => {
  if (active && payload && payload.length) {
    const p = payload[0];
    return (
      <div
        className="rounded-lg p-2"
        style={{
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <p
          className="font-semibold text-sm"
          style={{ color: 'var(--text)' }}
        >
          {p.name}: {formatCurrency(p.value ?? 0)}
        </p>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          ({((p.percent ?? 0) * 100).toFixed(1)}%)
        </p>
      </div>
    );
  }
  return null;
};

const ExpenseDonutChart: React.FC<ExpenseDonutChartProps> = ({ data }) => {
  const [recharts, setRecharts] = useState<any>(null);

  useEffect(() => {
    import("recharts").then(setRecharts).catch(() => {});
  }, []);

  const chartData = useMemo(() => {
    const totals: Record<string, number> = {};
    data
      .filter((t) => t.type === "expense" && t.status === "completed")
      .forEach((t) => {
        totals[t.category] = (totals[t.category] || 0) + t.amount;
      });
    return Object.entries(totals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  if (!recharts)
    return (
      <div
        className="backdrop-blur-md rounded-2xl p-4 sm:p-6 animate-pulse"
        style={{
          backgroundColor: 'var(--card)',
          boxShadow: 'var(--shadow)',
        }}
      >
        <div
          className="h-6 rounded w-2/3 mb-4"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        />
        <div
          className="h-[250px] sm:h-[300px] rounded"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        />
      </div>
    );

  const { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } =
    recharts;

  return (
    <div
      className="backdrop-blur-md rounded-2xl p-4 sm:p-6"
      style={{
        backgroundColor: 'var(--card)',
        boxShadow: 'var(--shadow)',
      }}
    >
      <h3
        className="text-base sm:text-lg font-medium mb-3 sm:mb-4"
        style={{ color: 'var(--text)' }}
      >
        Despesas por categoria
      </h3>
      {chartData.length ? (
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              outerRadius={80}
              innerRadius={50}
              dataKey="value"
              nameKey="name"
            >
              {chartData.map((_: unknown, i: number) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: "11px" }} />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div
          className="h-[250px] flex items-center justify-center text-sm"
          style={{ color: 'var(--text-secondary)' }}
        >
          Nenhuma despesa registrada.
        </div>
      )}
    </div>
  );
};

export default ExpenseDonutChart;
