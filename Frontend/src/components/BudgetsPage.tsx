import React, { useMemo, useState } from "react";
import { BudgetCategory, Transaction, Category } from "../utils/types";
import { formatCurrency } from "../utils/helpers";
import AddBudgetCategoryModal from "./AddBudgetCategoryModal";
import EditBudgetCategoryModal from "./EditBudgetCategoryModal";

const BudgetCard: React.FC<{
  category: BudgetCategory;
  spentAmount: number;
  onEdit: (category: BudgetCategory) => void;
  onDelete: (categoryId: string) => void;
}> = ({ category, spentAmount, onEdit, onDelete }) => {
  const progress =
    category.budgetedAmount > 0
      ? Math.min((spentAmount / category.budgetedAmount) * 100, 100)
      : 0;
  const remaining = category.budgetedAmount - spentAmount;

  let color = "bg-emerald-600";
  if (progress > 75 && progress <= 90) color = "bg-amber-500";
  if (progress > 90) color = "bg-rose-600";

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-[0_6px_24px_rgba(12,12,16,0.06)] flex flex-col justify-between hover:shadow-lg transition">
      <div>
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {category.name}
            </h3>
            <p className="text-sm text-gray-500">
              Orçado: {formatCurrency(category.budgetedAmount)}
            </p>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => onEdit(category)}
              className="text-gray-400 hover:text-gray-700 rounded-full p-1 transition"
              title="Editar orçamento"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-1.086 1.086-2.828-2.828L13.586 3.586zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(category.id)}
              className="text-gray-400 hover:text-red-600 rounded-full p-1 transition"
              title="Deletar orçamento"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="mt-3">
          <p className="text-2xl font-semibold text-gray-900">
            {formatCurrency(spentAmount)}
          </p>
          <p
            className={`text-sm ${
              remaining >= 0 ? "text-gray-500" : "text-rose-600 font-semibold"
            }`}
          >
            {remaining >= 0
              ? `${formatCurrency(remaining)} restantes`
              : `${formatCurrency(Math.abs(remaining))} acima`}
          </p>
        </div>
      </div>

      <div className="w-full bg-gray-100 rounded-full h-2 mt-4">
        <div
          className={`${color} h-2 rounded-full transition-all`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

interface BudgetsPageProps {
  budgetCategories: BudgetCategory[];
  transactions: Transaction[];
  addBudget: (budget: Omit<BudgetCategory, "id">) => void;
  editBudget: (budget: BudgetCategory) => void;
  deleteBudget: (budgetId: string) => void;
  categories: Category[];
}

const BudgetsPage: React.FC<BudgetsPageProps> = ({
  budgetCategories,
  transactions,
  addBudget,
  editBudget,
  deleteBudget,
  categories,
}) => {
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetCategory | null>(
    null,
  );

  const spendingByCategory = useMemo(() => {
    const spending: Record<string, number> = {};
    transactions
      .filter((t) => t.type === "expense" && t.status === "completed")
      .forEach((t) => {
        spending[t.category] = (spending[t.category] || 0) + t.amount;
      });
    return spending;
  }, [transactions]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">
          Orçamentos mensais
        </h2>
        <button
          onClick={() => setAddModalOpen(true)}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold"
        >
          Novo orçamento
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {budgetCategories.map((cat) => (
          <BudgetCard
            key={cat.id}
            category={cat}
            spentAmount={spendingByCategory[cat.name] || 0}
            onEdit={setEditingBudget}
            onDelete={deleteBudget}
          />
        ))}
      </div>

      <AddBudgetCategoryModal
        isOpen={isAddModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAddBudget={(newBudget) => {
          addBudget(newBudget);
          setAddModalOpen(false);
        }}
        categories={categories}
      />

      {editingBudget && (
        <EditBudgetCategoryModal
          isOpen={!!editingBudget}
          onClose={() => setEditingBudget(null)}
          onEditBudget={(updatedBudget) => {
            editBudget(updatedBudget);
            setEditingBudget(null);
          }}
          budgetCategory={editingBudget}
        />
      )}
    </div>
  );
};

export default BudgetsPage;
