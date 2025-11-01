import React, { useMemo, useState, useEffect } from "react";
import { Transaction } from "../utils/types";
import { formatCurrency, formatDate } from "../utils/helpers";

interface TransactionChartsProps {
  data: Transaction[];
}

type TooltipPayload = {
  dataKey?: string;
  color?: string;
  name?: string;
  value?: number;
};

const CustomTooltipComponent: React.FC<{
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string | number | null;
}> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        role="tooltip"
        aria-live="polite"
        className="rounded-lg p-3 bg-white shadow-md text-xs"
      >
        <p className="font-semibold mb-1">{label}</p>
        {payload.map((pld: TooltipPayload, i: number) => (
          <p
            key={`${pld.dataKey ?? pld.name}-${i}`}
            style={{ color: pld.color }}
            className="text-xs"
          >
            {`${pld.name}: ${formatCurrency(pld.value ?? 0)}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const CustomTooltip = React.memo(CustomTooltipComponent);

const TransactionCharts: React.FC<TransactionChartsProps> = ({ data }) => {
  const [recharts, setRecharts] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;
    import("recharts")
      .then((mod) => {
        if (mounted) setRecharts(mod);
      })
      .catch(() => {
        // ignore
      });
    return () => {
      mounted = false;
    };
  }, []);

  const barChartData = useMemo(() => {
    const monthlyData: Record<
      string,
      { month: string; income: number; expense: number }
    > = {};

    data
      .filter((t) => t.status === "completed")
      .forEach((t) => {
        const month = new Date(t.date).toLocaleString("default", {
          month: "short",
          year: "2-digit",
        });
        if (!monthlyData[month])
          monthlyData[month] = { month, income: 0, expense: 0 };
        if (t.type === "income") monthlyData[month].income += t.amount;
        else monthlyData[month].expense += t.amount;
      });

    const sorted = Object.values(monthlyData).sort((a, b) => {
      const [aMon, aYear] = a.month.split(" ");
      const [bMon, bYear] = b.month.split(" ");
      const dateA = new Date(`01 ${aMon} 20${aYear}`);
      const dateB = new Date(`01 ${bMon} 20${bYear}`);
      return dateA.getTime() - dateB.getTime();
    });

    return sorted;
  }, [data]);

  const lineChartData = useMemo(() => {
    const dailyMap: Record<
      string,
      { date: string; income: number; expense: number }
    > = {};
    let runningIncome = 0;
    let runningExpense = 0;

    const sortedData = [...data]
      .filter((t) => t.status === "completed")
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sortedData.forEach((t) => {
      const dayKey = new Date(t.date).toISOString().split("T")[0];
      if (!dailyMap[dayKey])
        dailyMap[dayKey] = { date: formatDate(t.date), income: 0, expense: 0 };
      if (t.type === "income") runningIncome += t.amount;
      else runningExpense += t.amount;
      dailyMap[dayKey].income = runningIncome;
      dailyMap[dayKey].expense = runningExpense;
    });

    return Object.keys(dailyMap)
      .sort()
      .map((k) => dailyMap[k]);
  }, [data]);

  if (!recharts) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="h-[250px] sm:h-[300px] rounded-lg bg-gray-100 animate-pulse" />
        <div className="h-[250px] sm:h-[300px] rounded-lg bg-gray-100 animate-pulse" />
      </div>
    );
  }

  const {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line,
  } = recharts;

  const hasBarChartData = barChartData.length > 0;
  const hasLineChartData = lineChartData.length > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      <div className="rounded-lg">
        <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">
          Receitas vs Despesas Mensais
        </h3>
        {hasBarChartData ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={barChartData}
              margin={{ top: 5, right: 10, left: 5, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e6edf2"
              />
              <XAxis
                dataKey="month"
                tick={{ fill: "#6b7280", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => formatCurrency(v as number)}
                tick={{ fill: "#6b7280", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={60}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar
                dataKey="income"
                name="Receitas"
                fill="#059669"
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="expense"
                name="Despesas"
                fill="#ef4444"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[250px] flex items-center justify-center text-gray-400 text-sm">
            Sem dados suficientes
          </div>
        )}
      </div>

      <div className="rounded-lg">
        <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">
          Fluxo de Caixa Acumulado
        </h3>
        {hasLineChartData ? (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart
              data={lineChartData}
              margin={{ top: 5, right: 10, left: 5, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e6edf2"
              />
              <XAxis
                dataKey="date"
                tick={{ fill: "#6b7280", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => formatCurrency(v as number)}
                tick={{ fill: "#6b7280", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={60}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line
                type="monotone"
                dataKey="income"
                name="Receita Acumulada"
                stroke="#059669"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="expense"
                name="Despesa Acumulada"
                stroke="#ef4444"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[250px] flex items-center justify-center text-gray-400 text-sm">
            Sem dados suficientes
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionCharts;
