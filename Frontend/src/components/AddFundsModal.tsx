import React, { useState } from "react";
import { Goal } from "../utils/types";
import { ICONS } from "../constants";
import { formatCurrency } from "../utils/helpers";
import Portal from "./Portal";

interface AddFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFunds: (goalId: string, amount: number) => void;
  goal: Goal;
}

const AddFundsModal: React.FC<AddFundsModalProps> = ({
  isOpen,
  onClose,
  onAddFunds,
  goal,
}) => {
  const [amount, setAmount] = useState("");

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  const endDate = new Date(goal.deadline);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("Por favor, insira um valor válido.");
      return;
    }

    onAddFunds(goal.id, parsedAmount);

    setAmount("");
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
            Adicionar Fundos
          </h2>
          <div
            className="text-center p-4 rounded-lg"
            style={{ backgroundColor: 'var(--primary-bg)', border: '1px solid var(--primary)' }}
          >
            <p className="text-lg font-semibold" style={{ color: 'var(--text)' }}>{goal.name}</p>
            <p style={{ color: 'var(--text-secondary)' }}>
              Meta:{" "}
              <span className="font-bold" style={{ color: 'var(--primary)' }}>
                {formatCurrency(goal.targetAmount)}
              </span>
            </p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Início: {startDate.toLocaleDateString('pt-BR')} • Término: {endDate.toLocaleDateString('pt-BR')}
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="funds-amount"
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                Valor a Adicionar (R$)
              </label>
              <input
                id="funds-amount"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 block w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 touch-manipulation text-base"
                style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text)' }}
                required
                autoFocus
              />
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
                Adicionar Fundos
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
};

export default AddFundsModal;
