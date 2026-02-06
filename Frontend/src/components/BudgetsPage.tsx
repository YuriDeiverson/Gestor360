import React, { useMemo, useState } from "react";
import { BudgetCategory, Transaction } from "../utils/types";
import { formatCurrency } from "../utils/helpers";
import AddBudgetCategoryModal from "./AddBudgetCategoryModal";
import EditBudgetCategoryModal from "./EditBudgetCategoryModal";
import { ICONS } from "../constants";

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

  /* =====================
     GASTO REAL POR CATEGORIA (usando budgetId)
     Calcula o total realizado baseado nas transações de despesa completadas e pendentes
  ===================== */
  const spendingByCategory = useMemo(() => {
    const map: Record<string, number> = {};

    transactions
      .filter((t) => t.type === "expense" && t.budgetId) // Apenas despesas com orçamento
      .forEach((t) => {
        // Usar budgetId (ID do orçamento) para fazer o match correto
        const budgetKey = t.budgetId!;
        map[budgetKey] = (map[budgetKey] || 0) + t.amount;
      });

    return map;
  }, [transactions]);

  /* =====================
     RESUMO
  ===================== */
  const summary = useMemo(() => {
    let totalPlanned = 0;
    let totalSpent = 0;
    let overBudget = 0;

    budgetCategories.forEach((cat) => {
      // Usar o ID do orçamento para fazer o match correto com as transações
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

  /* =====================
     HELPERS
  ===================== */
  const getStatus = (percent: number) => {
    if (percent > 100)
      return {
        label: "Acima do Orçamento",
        className: "border-rose-600 text-rose-600",
      };

    if (percent === 100)
      return {
        label: "Limite Alcançado",
        className: "border-orange-500 text-orange-600",
      };

    if (percent >= 75)
      return {
        label: "Próximo do Limite",
        className: "border-amber-500 text-amber-600",
      };

    return {
      label: "Dentro do Orçamento",
      className: "border-emerald-600 text-emerald-600",
    };
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">
          Orçamentos mensais
        </h2>
        <button
          onClick={() => setAddModalOpen(true)}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold"
        >
          Novo orçamento
        </button>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-gray-500">Total planejado</p>
          <p className="text-2xl font-semibold">
            {formatCurrency(summary.totalPlanned)}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {summary.categoriesCount} categorias com orçamento
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-gray-500">Total realizado</p>
          <p className="text-2xl font-semibold">
            {formatCurrency(summary.totalSpent)}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {summary.percentUsed.toFixed(0)}% do planejado
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-gray-500">Economia</p>
          <p
            className={`text-2xl font-semibold ${
              summary.economy >= 0 ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {formatCurrency(summary.economy)}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {summary.overBudget} categorias acima do orçamento
          </p>
        </div>
      </div>

      {/* TABELA */}
      <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-6 py-4 text-left">Categoria</th>
              <th className="px-6 py-4 text-right">Planejado</th>
              <th className="px-6 py-4 text-right">Realizado</th>
              <th className="px-6 py-4 text-right">Diferença</th>
              <th className="px-6 py-4 text-center">Progresso</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-center">Ações</th>
            </tr>
          </thead>

          <tbody>
            {budgetCategories.map((cat) => {
              // Calcular valores derivados do orçamento
              const spent = spendingByCategory[cat.id] || 0; // Realizado = soma das transações
              const diff = cat.budgetedAmount - spent; // Diferença = Planejado - Realizado
              const percent =
                cat.budgetedAmount > 0 ? (spent / cat.budgetedAmount) * 100 : 0; // Progresso = (Realizado / Planejado) * 100

              const status = getStatus(percent);

              return (
                <tr key={cat.id} className="border-t">
                  {/* CATEGORIA */}
                  <td className="px-6 py-4 flex items-center gap-2 font-medium">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    {cat.name}
                  </td>

                  <td className="px-6 py-4 text-right">
                    {formatCurrency(cat.budgetedAmount)}
                  </td>

                  <td className="px-6 py-4 text-right">
                    {formatCurrency(spent)}
                  </td>

                  {/* DIFERENÇA */}
                  <td
                    className={`px-6 py-4 text-right font-semibold ${
                      percent >= 100
                        ? "text-rose-600"
                        : percent >= 75
                        ? "text-amber-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {formatCurrency(diff)}
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span className={percent > 100 ? "text-rose-600 font-semibold" : ""}>
                      {percent.toFixed(0)}%
                    </span>
                  </td>

                  {/* STATUS */}
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full border ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </td>

                  {/* AÇÕES */}
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => setEditingBudget(cat)}
                        className="text-gray-400 hover:text-gray-700"
                        title="Editar"
                      >
                        {ICONS.edit}
                      </button>
                      <button
                        onClick={() => deleteBudget(cat.id)}
                        className="text-gray-400 hover:text-rose-600"
                        title="Excluir"
                      >
                        {ICONS.trash}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAIS */}
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
