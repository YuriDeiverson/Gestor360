import React, { useEffect, useMemo, useState } from "react";
import { Transaction } from "../utils/types";
import { formatCurrency } from "../utils/helpers";

interface TransactionChartsProps {
  data: Transaction[];
  chartType: "line" | "area" | "bar";
}

const MONTHS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

const TransactionCharts: React.FC<TransactionChartsProps> = ({
  data,
  chartType,
}) => {
  const [recharts, setRecharts] = useState<any>(null);

  useEffect(() => {
    import("recharts").then(setRecharts);
  }, []);

  const chartData = useMemo(() => {
    const monthly: Record<number, { receita: number; despesa: number }> = {};

    // Inicializar todos os meses
    MONTHS.forEach((_, index) => {
      monthly[index] = { receita: 0, despesa: 0 };
    });

    data
      .filter((t) => t.status === "completed")
      .forEach((t) => {
        const month = new Date(t.date).getMonth();
        const amount = Number(t.amount) || 0;

        if (t.type === "income") {
          monthly[month].receita += amount;
        } else {
          monthly[month].despesa += amount;
        }
      });

    return MONTHS.map((label, index) => ({
      month: label,
      receita: monthly[index]?.receita ?? 0,
      despesa: monthly[index]?.despesa ?? 0,
    }));
  }, [data]);

  if (!recharts) {
    return (
      <div className="h-full w-full rounded-xl bg-gray-100 animate-pulse" />
    );
  }

  const {
    ResponsiveContainer,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    LineChart,
    AreaChart,
    BarChart,
    Line,
    Area,
    Bar,
    Legend,
  } = recharts;

  const commonProps = {
    data: chartData,
    margin: { 
      top: 16, 
      right: 8, 
      left: 16, 
      bottom: 16 
    },
  };

  let ChartComponent: React.ReactElement;

  if (chartType === "area") {
    ChartComponent = (
      <AreaChart {...commonProps}>
        <defs>
          <linearGradient id="receitaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="despesaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="#e5e7eb"
        />
        <XAxis 
          dataKey="month" 
          axisLine={false} 
          tickLine={false}
          tick={{ fontSize: 12 }}
        />
        <YAxis
          width={60}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => formatCurrency(v)}
          tick={{ fontSize: 11 }}
        />
        <Tooltip 
          formatter={(v: number) => formatCurrency(v)}
          contentStyle={{
            fontSize: '12px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}
        />
        <Legend 
          wrapperStyle={{
            fontSize: '12px'
          }}
        />
        <Area
          type="monotone"
          dataKey="receita"
          name="Receita"
          stroke="#10b981"
          fill="url(#receitaFill)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="despesa"
          name="Despesa"
          stroke="#ef4444"
          fill="url(#despesaFill)"
          strokeWidth={2}
        />
      </AreaChart>
    );
  } else if (chartType === "bar") {
    ChartComponent = (
      <BarChart {...commonProps}>
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="#e5e7eb"
        />
        <XAxis 
          dataKey="month" 
          axisLine={false} 
          tickLine={false}
          tick={{ fontSize: 12 }}
        />
        <YAxis
          width={60}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => formatCurrency(v)}
          tick={{ fontSize: 11 }}
        />
        <Tooltip 
          formatter={(v: number) => formatCurrency(v)}
          contentStyle={{
            fontSize: '12px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}
        />
        <Legend 
          wrapperStyle={{
            fontSize: '12px'
          }}
        />
        <Bar
          dataKey="receita"
          name="Receita"
          fill="#10b981"
          radius={[8, 8, 0, 0]}
        />
        <Bar
          dataKey="despesa"
          name="Despesa"
          fill="#ef4444"
          radius={[8, 8, 0, 0]}
        />
      </BarChart>
    );
  } else {
    ChartComponent = (
      <LineChart {...commonProps}>
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="#e5e7eb"
        />
        <XAxis 
          dataKey="month" 
          axisLine={false} 
          tickLine={false}
          tick={{ fontSize: 12 }}
        />
        <YAxis
          width={60}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => formatCurrency(v)}
          tick={{ fontSize: 11 }}
        />
        <Tooltip 
          formatter={(v: number) => formatCurrency(v)}
          contentStyle={{
            fontSize: '12px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}
        />
        <Legend 
          wrapperStyle={{
            fontSize: '12px'
          }}
        />
        <Line
          type="monotone"
          dataKey="receita"
          name="Receita"
          stroke="#10b981"
          strokeWidth={3}
          dot={{ fill: "#10b981", r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="despesa"
          name="Despesa"
          stroke="#ef4444"
          strokeWidth={3}
          dot={{ fill: "#ef4444", r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    );
  }

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        {ChartComponent}
      </ResponsiveContainer>
    </div>
  );
};

export default TransactionCharts;
