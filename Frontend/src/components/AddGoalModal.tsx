import React, { useState } from "react";
import { Goal } from "../utils/types";
import { ICONS } from "../constants";
import Portal from "./Portal";

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddGoal: (goal: Omit<Goal, "id" | "currentAmount">) => void;
}

const AddGoalModal: React.FC<AddGoalModalProps> = ({
  isOpen,
  onClose,
  onAddGoal,
}) => {
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !targetAmount || !deadline) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    onAddGoal({
      name,
      targetAmount: parseFloat(targetAmount),
      deadline,
      budgetId: "default",
    });

    setName("");
    setTargetAmount("");
    setDeadline("");
  };

  if (!isOpen) return null;

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
          style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 transition-colors touch-manipulation p-2 rounded-lg"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
            aria-label="Fechar modal"
          >
            {ICONS.close}
          </button>
          <h2
            className="text-xl sm:text-2xl font-bold pr-10 sm:pr-12"
            style={{ color: 'var(--text)' }}
          >
            Adicionar Nova Meta
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="goal-name"
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                Nome da Meta
              </label>
              <input
                id="goal-name"
                type="text"
                placeholder="Ex: Viagem, Carro novo..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 touch-manipulation text-base"
                style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text)' }}
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="goal-amount"
                  className="block text-sm font-medium mb-1"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Valor Alvo (R$)
                </label>
                <input
                  id="goal-amount"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="mt-1 block w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 touch-manipulation text-base"
                  style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text)' }}
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="goal-deadline"
                  className="block text-sm font-medium mb-1"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Prazo Final
                </label>
                <input
                  id="goal-deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="mt-1 block w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 touch-manipulation text-base"
                  style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text)' }}
                  required
                />
              </div>
            </div>
            <div
              className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 sm:pt-6 border-t"
              style={{ borderColor: 'var(--border)' }}
            >
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-3 sm:py-2.5 border-2 rounded-lg font-semibold transition-colors touch-manipulation min-h-[48px] sm:min-h-[42px]"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 sm:py-2.5 text-white rounded-lg font-semibold transition-colors touch-manipulation min-h-[48px] sm:min-h-[42px]"
                style={{ backgroundColor: 'var(--primary)', boxShadow: 'var(--shadow-sm)' }}
                onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(0.85)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.filter = ''; }}
              >
                Adicionar Meta
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
};

export default AddGoalModal;
