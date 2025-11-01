import React, { useState } from "react";
import { BudgetCategory, Category } from "../utils/types";
import { ICONS } from "../constants";
import Portal from "./Portal";

interface AddBudgetCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBudget: (budget: Omit<BudgetCategory, "id">) => void;
  categories: Category[];
}

const AddBudgetCategoryModal: React.FC<AddBudgetCategoryModalProps> = ({
  isOpen,
  onClose,
  onAddBudget,
  categories,
}) => {
  const [name, setName] = useState("");
  const [budgetedAmount, setBudgetedAmount] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !budgetedAmount) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    onAddBudget({
      name,
      budgetedAmount: parseFloat(budgetedAmount),
    });

    // Reset form
    setName("");
    setBudgetedAmount("");
  };

  if (!isOpen) return null;

  const modalStyle =
    "fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-center z-50 p-4 pointer-events-auto";
  const contentStyle =
    "bg-white p-4 sm:p-6 md:p-8 rounded-2xl w-full max-w-lg relative border border-gray-200 space-y-4 sm:space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto pointer-events-auto";
  const inputStyle =
    "mt-1 block w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 touch-manipulation text-base";
  const labelStyle = "block text-sm font-medium text-gray-700 mb-1";

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
            className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-gray-600 transition-colors touch-manipulation p-2 rounded-lg active:bg-gray-100"
            aria-label="Fechar modal"
          >
            {ICONS.close}
          </button>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 pr-10 sm:pr-12">
            Adicionar Categoria de Orçamento
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="budget-name" className={labelStyle}>
                Nome da Categoria
              </label>
              <select
                id="budget-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputStyle}
                required
              >
                <option value="" disabled>
                  Selecione uma categoria
                </option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="budget-amount" className={labelStyle}>
                Valor Orçado (R$)
              </label>
              <input
                id="budget-amount"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={budgetedAmount}
                onChange={(e) => setBudgetedAmount(e.target.value)}
                className={inputStyle}
                required
              />
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 sm:pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-3 sm:py-2.5 border-2 border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation min-h-[48px] sm:min-h-[42px]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 sm:py-2.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-md hover:shadow-lg touch-manipulation min-h-[48px] sm:min-h-[42px]"
              >
                Adicionar Orçamento
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
};

export default AddBudgetCategoryModal;
