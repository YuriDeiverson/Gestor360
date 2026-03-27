import React, { useState } from "react";
import { Budget, TransactionType } from "../utils/types";
import { ICONS } from "../constants";
import Portal from "./Portal";

interface AddBudgetCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBudget: (budget: Omit<Budget, "id">) => void;
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

const AddBudgetCategoryModal: React.FC<AddBudgetCategoryModalProps> = ({
  isOpen,
  onClose,
  onAddBudget,
}) => {
  const [name, setName] = useState("");
  const [budgetedAmount, setBudgetedAmount] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[3].value);
  const [type, setType] = useState<TransactionType>("expense");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !budgetedAmount) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    onAddBudget({
      name,
      budgetedAmount: parseFloat(budgetedAmount),
      color: selectedColor,
      limit_value: parseFloat(budgetedAmount),
      type,
    });

    setName("");
    setBudgetedAmount("");
    setSelectedColor(COLOR_OPTIONS[3].value);
  };

  if (!isOpen) return null;

  const inputClasses =
    "mt-1 block w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 touch-manipulation text-base";

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
          className="p-4 sm:p-6 md:p-8 rounded-2xl w-full max-w-lg relative space-y-4 sm:space-y-6 max-h-[90vh] overflow-y-auto pointer-events-auto"
          style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', color: 'var(--text)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 transition-colors touch-manipulation p-2 rounded-lg"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
            aria-label="Fechar modal"
          >
            {ICONS.close}
          </button>
          <h2 className="text-xl sm:text-2xl font-bold pr-10 sm:pr-12" style={{ color: 'var(--text)' }}>
            Novo Orçamento
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="budget-name" className={labelClasses} style={labelStyle}>
                Nome da Categoria
              </label>
              <input
                id="budget-name"
                type="text"
                placeholder="Ex: Alimentação, Transporte..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClasses}
                style={inputStyle}
                required
              />
            </div>

            <div>
              <label htmlFor="budget-amount" className={labelClasses} style={labelStyle}>
                Valor Planejado (R$)
              </label>
              <input
                id="budget-amount"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={budgetedAmount}
                onChange={(e) => setBudgetedAmount(e.target.value)}
                className={inputClasses}
                style={inputStyle}
                required
              />
            </div>

            <div>
              <label htmlFor="budget-type" className={labelClasses} style={labelStyle}>
                Tipo de Categoria
              </label>
              <select
                id="budget-type"
                value={type}
                onChange={(e) => setType(e.target.value as TransactionType)}
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

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 sm:pt-6" style={{ borderTop: '1px solid var(--border)' }}>
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-3 sm:py-2.5 rounded-lg font-semibold transition-colors touch-manipulation min-h-[48px] sm:min-h-[42px]"
                style={{ border: '2px solid var(--border)', color: 'var(--text)', backgroundColor: 'var(--card)' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--card)'; }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 sm:py-2.5 text-white rounded-lg font-semibold transition-colors touch-manipulation min-h-[48px] sm:min-h-[42px]"
                style={{ backgroundColor: 'var(--primary)', boxShadow: 'var(--shadow)' }}
                onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(0.9)'; }}
                onMouseLeave={e => { e.currentTarget.style.filter = ''; }}
              >
                Criar Orçamento
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
};

export default AddBudgetCategoryModal;
