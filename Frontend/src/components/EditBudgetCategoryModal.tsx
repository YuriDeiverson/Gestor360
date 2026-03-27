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

  const inputClasses =
    "mt-1 block w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 touch-manipulation text-base";

  const inputStyle: React.CSSProperties = {
    backgroundColor: 'var(--input-bg)',
    borderColor: 'var(--input-border)',
    color: 'var(--text)',
  };

  const labelClasses = "block text-sm font-medium mb-1";
  const labelStyle: React.CSSProperties = { color: 'var(--text-secondary)' };

  return (
    <Portal>
      <div
        className="fixed inset-0 backdrop-blur-md flex justify-center items-center z-50 p-4 pointer-events-auto"
        style={{ backgroundColor: 'var(--overlay)' }}
        onClick={onClose}
        role="button"
        tabIndex={0}
        aria-label="Fechar modal"
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
      >
        <div
          className="p-8 rounded-2xl w-full max-w-lg relative space-y-6 max-h-[90vh] overflow-y-auto pointer-events-auto"
          style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', color: 'var(--text)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            {ICONS.close}
          </button>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Editar Orçamento</h2>
          <div className="text-center">
            <p className="text-lg font-semibold" style={{ color: 'var(--text-secondary)' }}>
              {budgetCategory.name}
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="edit-budget-amount" className={labelClasses} style={labelStyle}>
                Valor Planejado (R$)
              </label>
              <input
                id="edit-budget-amount"
                type="number"
                step="0.01"
                value={budgetedAmount}
                onChange={(e) => setBudgetedAmount(e.target.value)}
                className={inputClasses}
                style={inputStyle}
                required
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="edit-budget-type" className={labelClasses} style={labelStyle}>
                Tipo de Categoria
              </label>
              <select
                id="edit-budget-type"
                value={type}
                onChange={(e) => setType(e.target.value as "income" | "expense")}
                className={inputClasses}
                style={inputStyle}
                required
              >
                <option value="expense">Despesa</option>
                <option value="income">Receita</option>
              </select>
            </div>

            <div>
              <label className={labelClasses} style={labelStyle}>Cor da Categoria</label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setSelectedColor(color.value)}
                    className="w-full aspect-square rounded-lg border-2 transition-all"
                    style={{
                      backgroundColor: color.value,
                      borderColor: selectedColor === color.value ? 'var(--text)' : 'var(--border)',
                      boxShadow: selectedColor === color.value ? 'var(--shadow)' : 'none',
                    }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 rounded-lg font-semibold transition-colors duration-150"
                style={{ border: '1px solid var(--border)', color: 'var(--text)', backgroundColor: 'var(--card)' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--card)'; }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 text-white rounded-lg font-semibold transition-colors duration-150"
                style={{ backgroundColor: 'var(--primary)', boxShadow: 'var(--shadow)' }}
                onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(0.9)'; }}
                onMouseLeave={e => { e.currentTarget.style.filter = ''; }}
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
