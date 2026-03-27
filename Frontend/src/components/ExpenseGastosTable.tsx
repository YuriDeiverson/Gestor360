import React from "react";
import { Transaction } from "../utils/types";
import { formatCurrency } from "../utils/helpers";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Pencil, Trash2, TrendingDown } from "lucide-react";
import { expenseCategoryColor } from "../utils/expenseCategoryColor";

interface ExpenseGastosTableProps {
  transactions: Transaction[];
  cards: { id: string; name: string; bank?: string }[];
  loading?: boolean;
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
  onPayInstallment?: (t: Transaction) => void;
}

function cardLabel(t: Transaction, cards: ExpenseGastosTableProps["cards"]): string {
  if (t.method === "Cartão de Crédito") {
    return t.cardName || cards.find((c) => c.id === t.account)?.name || "—";
  }
  return cards.find((c) => c.id === t.account)?.name || t.account || "—";
}

function installmentLabel(t: Transaction): string | null {
  const n = t.installments;
  if (!n || n <= 1) return null;
  const cur = t.currentInstallment ?? 1;
  const rest = Math.max(0, n - cur);
  return `${cur}/${n}x · faltam ${rest}`;
}

const ExpenseGastosTable: React.FC<ExpenseGastosTableProps> = ({
  transactions,
  cards,
  loading,
  onEdit,
  onDelete,
  onPayInstallment,
}) => {
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div
          className="h-7 w-7 animate-spin rounded-full border-4"
          style={{
            borderColor: "var(--border)",
            borderTopColor: "var(--primary)",
          }}
        />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="py-16 text-center">
        <TrendingDown
          className="mx-auto mb-3 h-10 w-10 opacity-30"
          style={{ color: "var(--text-muted)" }}
        />
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Nenhum gasto encontrado.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr
            className="border-b"
            style={{
              backgroundColor: "var(--bg-secondary)",
              borderColor: "var(--border)",
            }}
          >
            <th
              className="pl-5 py-3 text-xs font-semibold uppercase tracking-wide"
              style={{ color: "var(--text-secondary)" }}
            >
              Descrição
            </th>
            <th
              className="py-3 text-xs font-semibold uppercase tracking-wide"
              style={{ color: "var(--text-secondary)" }}
            >
              Valor
            </th>
            <th
              className="hidden py-3 text-xs font-semibold uppercase tracking-wide sm:table-cell"
              style={{ color: "var(--text-secondary)" }}
            >
              Categoria
            </th>
            <th
              className="hidden py-3 text-xs font-semibold uppercase tracking-wide md:table-cell"
              style={{ color: "var(--text-secondary)" }}
            >
              Cartão
            </th>
            <th
              className="hidden py-3 text-xs font-semibold uppercase tracking-wide sm:table-cell"
              style={{ color: "var(--text-secondary)" }}
            >
              Data
            </th>
            <th className="w-24 pr-5 py-3 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
              Ações
            </th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((exp) => {
            const color = expenseCategoryColor(exp.category);
            const inst = installmentLabel(exp);
            const canPay =
              onPayInstallment &&
              exp.installments &&
              exp.installments > 1 &&
              (exp.currentInstallment ?? 1) < exp.installments &&
              exp.status !== "completed" &&
              exp.type === "expense";

            return (
              <tr
                key={exp.id}
                className="border-b transition-colors"
                style={{ borderColor: "var(--border)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <td className="max-w-[220px] py-3 pl-5">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${color}18` }}
                    >
                      <TrendingDown className="h-3.5 w-3.5" style={{ color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium" style={{ color: "var(--text)" }}>
                        {exp.description}
                      </p>
                      {inst && (
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {inst}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap py-3 font-semibold" style={{ color: "var(--danger-light)" }}>
                  {formatCurrency(exp.amount)}
                </td>
                <td className="hidden py-3 sm:table-cell">
                  <span
                    className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: `${color}22`,
                      color,
                    }}
                  >
                    {exp.category}
                  </span>
                </td>
                <td
                  className="hidden py-3 text-sm md:table-cell"
                  style={{ color: "var(--text-muted)" }}
                >
                  {cardLabel(exp, cards)}
                </td>
                <td
                  className="hidden py-3 text-sm sm:table-cell"
                  style={{ color: "var(--text-muted)" }}
                >
                  {exp.date
                    ? format(new Date(exp.date), "dd MMM yyyy", { locale: ptBR })
                    : "—"}
                </td>
                <td className="py-3 pr-4 text-right">
                  <div className="flex justify-end gap-1">
                    {canPay && (
                      <button
                        type="button"
                        onClick={() => onPayInstallment(exp)}
                        className="rounded-lg px-2 py-1 text-xs font-medium text-white"
                        style={{ backgroundColor: "var(--primary)" }}
                      >
                        Pagar
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onEdit(exp)}
                      className="rounded-lg p-1.5 transition-colors"
                      style={{ color: "var(--text-muted)" }}
                      aria-label="Editar"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(exp.id)}
                      className="rounded-lg p-1.5 transition-colors"
                      style={{ color: "var(--danger)" }}
                      aria-label="Excluir"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ExpenseGastosTable;
