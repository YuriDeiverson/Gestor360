import React, { useMemo, useState } from "react";
import { BudgetCategory, Transaction } from "../utils/types";
import { formatCurrency } from "../utils/helpers";
import AddBudgetCategoryModal from "./AddBudgetCategoryModal";
import EditBudgetCategoryModal from "./EditBudgetCategoryModal";
import { ICONS } from "../constants";
import {
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  PiggyBank,
} from "lucide-react";

interface BudgetsPageProps {
  budgetCategories: BudgetCategory[];
  transactions: Transaction[];
  addBudget: (budget: Omit<BudgetCategory, "id">) => void;
  editBudget: (budget: BudgetCategory) => void;
  deleteBudget: (budgetId: string) => void;
}

const BudgetsPage: React.FC<BudgetsPageProps> = ({
  budgetCategories,
  transactions,
  addBudget,
  editBudget,
  deleteBudget,
}) => {
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetCategory | null>(
    null,
  );

  const spendingByCategory = useMemo(() => {
    const map: Record<string, number> = {};

    transactions
      .filter((t) => t.type === "expense" && t.budgetId)
      .forEach((t) => {
        const budgetKey = t.budgetId!;
        map[budgetKey] = (map[budgetKey] || 0) + t.amount;
      });

    return map;
  }, [transactions]);

  const summary = useMemo(() => {
    let totalPlanned = 0;
    let totalSpent = 0;
    let overBudget = 0;

    budgetCategories.forEach((cat) => {
      const spent = spendingByCategory[cat.id] || 0;
      totalPlanned += cat.budgetedAmount;
      totalSpent += spent;
      if (spent > cat.budgetedAmount) overBudget++;
    });

    return {
      totalPlanned,
      totalSpent,
      economy: totalPlanned - totalSpent,
      categoriesCount: budgetCategories.length,
      overBudget,
      percentUsed: totalPlanned > 0 ? (totalSpent / totalPlanned) * 100 : 0,
    };
  }, [budgetCategories, spendingByCategory]);

  const getStatus = (percent: number) => {
    if (percent > 100)
      return {
        label: "Acima do Orçamento",
        style: { borderColor: "var(--danger)", color: "var(--danger)" } as React.CSSProperties,
      };

    if (percent === 100)
      return {
        label: "Limite Alcançado",
        style: { borderColor: "var(--warning)", color: "var(--warning)" } as React.CSSProperties,
      };

    if (percent >= 75)
      return {
        label: "Próximo do Limite",
        style: { borderColor: "var(--warning)", color: "var(--warning)" } as React.CSSProperties,
      };

    return {
      label: "Dentro do Orçamento",
      style: { borderColor: "var(--success)", color: "var(--success)" } as React.CSSProperties,
    };
  };

  const overallPercent = summary.percentUsed;
  const overallBarWidth = Math.min(overallPercent, 100);

  const overallTone = () => {
    if (overallPercent > 100) return "danger" as const;
    if (overallPercent > 75) return "warning" as const;
    return "ok" as const;
  };

  const categoryBarTone = (percent: number) => {
    if (percent > 100) return "danger" as const;
    if (percent >= 75) return "warning" as const;
    return "ok" as const;
  };

  const toneColor = (tone: "ok" | "warning" | "danger", kind: "text" | "bg") => {
    if (kind === "bg") {
      if (tone === "ok") return "var(--success)";
      if (tone === "warning") return "var(--warning)";
      return "var(--danger)";
    }
    if (tone === "ok") return "var(--success)";
    if (tone === "warning") return "var(--warning)";
    return "var(--danger)";
  };

  const categoryIcon = (percent: number) => {
    if (percent > 100)
      return <XCircle className="w-4 h-4 shrink-0" style={{ color: "var(--danger)" }} />;
    if (percent >= 75)
      return <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: "var(--warning)" }} />;
    return <CheckCircle className="w-4 h-4 shrink-0" style={{ color: "var(--success)" }} />;
  };

  return (
    <div className="space-y-7">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text)" }}>
            Orçamento
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
            Controle seus limites por categoria
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg text-white"
          style={{ backgroundColor: "var(--primary)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.filter = "brightness(0.92)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.filter = "";
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          Novo orçamento
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          className="rounded-2xl border p-5 shadow-sm"
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--border)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            Total Orçado
          </p>
          <p className="text-2xl font-bold mt-1.5" style={{ color: "var(--text)" }}>
            {formatCurrency(summary.totalPlanned)}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {summary.categoriesCount} categorias
          </p>
        </div>

        <div
          className="rounded-2xl border p-5 shadow-sm"
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--border)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            Total Gasto
          </p>
          <p
            className="text-2xl font-bold mt-1.5"
            style={{
              color: overallPercent > 100 ? "var(--danger)" : "var(--text)",
            }}
          >
            {formatCurrency(summary.totalSpent)}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {overallPercent.toFixed(0)}% do orçamento
          </p>
        </div>

        <div
          className="rounded-2xl border p-5 shadow-sm"
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--border)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            Economia
          </p>
          <p
            className="text-2xl font-bold mt-1.5"
            style={{
              color: summary.economy < 0 ? "var(--danger)" : "var(--success)",
            }}
          >
            {formatCurrency(summary.economy)}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {summary.overBudget > 0
              ? `${summary.overBudget} categoria(s) excedida(s)`
              : "Dentro do limite"}
          </p>
        </div>
      </div>

      <div
        className="rounded-2xl border p-6 shadow-sm"
        style={{
          backgroundColor: "var(--card)",
          borderColor: "var(--border)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>
              Progresso Geral do Orçamento
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {formatCurrency(summary.totalSpent)} de {formatCurrency(summary.totalPlanned)}{" "}
              utilizados
            </p>
          </div>
          <div className="flex items-center gap-2">
            {overallTone() === "ok" && (
              <CheckCircle className="w-5 h-5" style={{ color: "var(--success)" }} />
            )}
            {overallTone() === "warning" && (
              <AlertTriangle className="w-5 h-5" style={{ color: "var(--warning)" }} />
            )}
            {overallTone() === "danger" && (
              <XCircle className="w-5 h-5" style={{ color: "var(--danger)" }} />
            )}
            <span
              className="text-sm font-bold"
              style={{ color: toneColor(overallTone(), "text") }}
            >
              {overallPercent.toFixed(1)}%
            </span>
          </div>
        </div>
        <div
          className="h-3 rounded-full overflow-hidden"
          style={{ backgroundColor: "var(--bg-secondary)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${overallBarWidth}%`,
              backgroundColor: toneColor(overallTone(), "bg"),
            }}
          />
        </div>
      </div>

      {budgetCategories.length === 0 ? (
        <div
          className="text-center py-20 rounded-2xl border"
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--border)",
          }}
        >
          <PiggyBank
            className="w-12 h-12 mx-auto mb-4 opacity-30"
            style={{ color: "var(--text-muted)" }}
          />
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Nenhum orçamento definido para este mês.
          </p>
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 mt-4 px-4 py-2 text-sm font-semibold rounded-lg text-white"
            style={{ backgroundColor: "var(--primary)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = "brightness(0.92)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = "";
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            Definir Orçamento
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgetCategories.map((cat) => {
            const spent = spendingByCategory[cat.id] || 0;
            const diff = cat.budgetedAmount - spent;
            const percent =
              cat.budgetedAmount > 0 ? (spent / cat.budgetedAmount) * 100 : 0;

            const status = getStatus(percent);
            const barTone = categoryBarTone(percent);
            const barW = Math.min(percent, 100);

            return (
              <div
                key={cat.id}
                className="rounded-2xl border p-5 shadow-sm relative group transition-shadow hover:shadow-md"
                style={{
                  backgroundColor: "var(--card)",
                  borderColor: "var(--border)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <div className="absolute top-3.5 right-3.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => setEditingBudget(cat)}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color: "var(--text-muted)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "var(--text)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "var(--text-muted)";
                    }}
                    title="Editar"
                  >
                    {ICONS.edit}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteBudget(cat.id)}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color: "var(--text-muted)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "var(--danger)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "var(--text-muted)";
                    }}
                    title="Excluir"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between mb-4 pr-14">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${cat.color}22` }}
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                    </div>
                    <h3 className="font-semibold text-sm truncate" style={{ color: "var(--text)" }}>
                      {cat.name}
                    </h3>
                  </div>
                  {categoryIcon(percent)}
                </div>

                <p className="text-xl font-bold" style={{ color: "var(--text)" }}>
                  {formatCurrency(spent)}
                </p>
                <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
                  de {formatCurrency(cat.budgetedAmount)} orçado
                </p>

                <div
                  className="h-2 rounded-full overflow-hidden mb-2"
                  style={{ backgroundColor: "var(--bg-secondary)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${barW}%`,
                      backgroundColor: toneColor(barTone, "bg"),
                    }}
                  />
                </div>

                <div className="flex justify-between items-start gap-2">
                  <p
                    className="text-xs font-semibold"
                    style={{ color: toneColor(barTone, "text") }}
                  >
                    {percent.toFixed(0)}% usado
                  </p>
                  <p className="text-xs text-right" style={{ color: "var(--text-muted)" }}>
                    Disponível: {formatCurrency(Math.max(diff, 0))}
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className="px-3 py-1 text-xs font-semibold rounded-full border"
                      style={status.style}
                    >
                      {status.label}
                    </span>
                    <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                      Diferença:{" "}
                      <span
                        style={{
                          color:
                            percent >= 100
                              ? "var(--danger)"
                              : percent >= 75
                                ? "var(--warning)"
                                : "var(--success)",
                        }}
                      >
                        {formatCurrency(diff)}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddBudgetCategoryModal
        isOpen={isAddModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAddBudget={(budget) => {
          addBudget(budget as any);
          setAddModalOpen(false);
        }}
      />

      {editingBudget && (
        <EditBudgetCategoryModal
          isOpen={!!editingBudget}
          onClose={() => setEditingBudget(null)}
          onEditBudget={(updated) => {
            editBudget(updated as any);
            setEditingBudget(null);
          }}
          budgetCategory={editingBudget as any}
        />
      )}
    </div>
  );
};

export default BudgetsPage;
