import React, { useState, useEffect } from "react";
import { BudgetCategory } from "../utils/types";
import { ICONS } from "../constants";
import Portal from "./Portal";

interface EditBudgetCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEditBudget: (budget: BudgetCategory) => void;
  budgetCategory: BudgetCategory;
}

const EditBudgetCategoryModal: React.FC<EditBudgetCategoryModalProps> = ({
  isOpen,
  onClose,
  onEditBudget,
  budgetCategory,
}) => {
  const [budgetedAmount, setBudgetedAmount] = useState("");

  useEffect(() => {
    if (budgetCategory) {
      setBudgetedAmount(String(budgetCategory.budgetedAmount));
    }
  }, [budgetCategory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(budgetedAmount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      alert("Por favor, insira um valor válido.");
      return;
    }

    onEditBudget({
      ...budgetCategory,
      budgetedAmount: parsedAmount,
    });
  };

  if (!isOpen) return null;

  const modalStyle =
    "fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-center z-50 p-4 pointer-events-auto";
  const contentStyle =
    "bg-white p-8 rounded-2xl w-full max-w-lg relative border border-gray-200 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto pointer-events-auto";
  const inputStyle =
    "mt-1 block w-full px-4 py-3 border border-base-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary";
  const labelStyle = "block text-sm font-medium text-subtle";

  return (
    <Portal>
      <div
        className={modalStyle}
        onClick={onClose}
        role="button"
        tabIndex={0}
        aria-label="Fechar modal"
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
      >
        <div className={contentStyle} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-subtle hover:text-content"
          >
            {ICONS.close}
          </button>
          <h2 className="text-2xl font-bold text-content">Editar Orçamento</h2>
          <div className="text-center">
            <p className="text-lg font-semibold">{budgetCategory.name}</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="edit-budget-amount" className={labelStyle}>
                Novo Valor Orçado (R$)
              </label>
              <input
                id="edit-budget-amount"
                type="number"
                step="0.01"
                value={budgetedAmount}
                onChange={(e) => setBudgetedAmount(e.target.value)}
                className={inputStyle}
                required
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors duration-150"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors duration-150 shadow-md"
              >
                Salvar Alterações
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
};

export default EditBudgetCategoryModal;
