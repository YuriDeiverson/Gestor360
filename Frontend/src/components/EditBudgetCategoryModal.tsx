import React, { useState, useEffect } from "react";
import { Budget } from "../utils/types";
import { ICONS } from "../constants";
import Portal from "./Portal";

interface EditBudgetCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEditBudget: (budget: Budget) => void;
  budgetCategory: Budget;
}

const COLOR_OPTIONS = [
  { name: "Vermelho", value: "#ef4444" },
  { name: "Laranja", value: "#f97316" },
  { name: "Amarelo", value: "#eab308" },
  { name: "Verde", value: "#22c55e" },
  { name: "Azul", value: "#3b82f6" },
  { name: "Roxo", value: "#a855f7" },
  { name: "Rosa", value: "#ec4899" },
  { name: "Cinza", value: "#6b7280" },
];

const EditBudgetCategoryModal: React.FC<EditBudgetCategoryModalProps> = ({
  isOpen,
  onClose,
  onEditBudget,
  budgetCategory,
}) => {
  const [budgetedAmount, setBudgetedAmount] = useState("");
  const [selectedColor, setSelectedColor] = useState("#22c55e");
  const [type, setType] = useState<"income" | "expense">("expense");

  useEffect(() => {
    if (budgetCategory) {
      setBudgetedAmount(String(budgetCategory.budgetedAmount));
      setSelectedColor(budgetCategory.color || "#22c55e");
      setType(budgetCategory.type || "expense");
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
      color: selectedColor,
      limit_value: parsedAmount,
      type,
    });
  };

  if (!isOpen) return null;

  const modalStyle =
    "fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-center z-50 p-4 pointer-events-auto";
  const contentStyle =
    "bg-white p-8 rounded-2xl w-full max-w-lg relative border border-gray-200 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto pointer-events-auto";
  const inputStyle =
    "mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 touch-manipulation text-base";
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
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {ICONS.close}
          </button>
          <h2 className="text-2xl font-bold text-gray-900">Editar Orçamento</h2>
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-700">
              {budgetCategory.name}
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="edit-budget-amount" className={labelStyle}>
                Valor Planejado (R$)
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

            <div>
              <label htmlFor="edit-budget-type" className={labelStyle}>
                Tipo de Categoria
              </label>
              <select
                id="edit-budget-type"
                value={type}
                onChange={(e) => setType(e.target.value as "income" | "expense")}
                className={inputStyle}
                required
              >
                <option value="expense">Despesa</option>
                <option value="income">Receita</option>
              </select>
            </div>

            <div>
              <label className={labelStyle}>Cor da Categoria</label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setSelectedColor(color.value)}
                    className={`w-full aspect-square rounded-lg border-2 transition-all ${
                      selectedColor === color.value
                        ? "border-gray-900 shadow-md"
                        : "border-gray-300"
                    } hover:shadow-md`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
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
