import React, { useState } from "react";
import { Goal } from "../utils/types";
import { ICONS } from "../constants";
import { formatCurrency } from "../utils/helpers";
import Portal from "./Portal";

interface WithdrawFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWithdrawFunds: (goalId: string, amount: number) => void;
  goal: Goal;
}

const WithdrawFundsModal: React.FC<WithdrawFundsModalProps> = ({
  isOpen,
  onClose,
  onWithdrawFunds,
  goal,
}) => {
  const [amount, setAmount] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("Por favor, insira um valor válido.");
      return;
    }
    
    if (parsedAmount > goal.currentAmount) {
      alert("Valor não pode ser maior que o saldo atual.");
      return;
    }

    onWithdrawFunds(goal.id, parsedAmount);

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
            className="text-xl sm:text-2xl font-bold pr-10 sm:pr-12 mb-4 sm:mb-6"
            style={{ color: 'var(--text)' }}
          >
            Retirar Fundos
          </h2>

          <div
            className="rounded-lg p-4 mb-4"
            style={{ backgroundColor: 'var(--danger-bg)', border: '1px solid var(--danger)' }}
          >
            <h3 className="font-semibold mb-2" style={{ color: 'var(--danger)' }}>{goal.name}</h3>
            <div className="space-y-1 text-sm">
              <p style={{ color: 'var(--danger)' }}>
                Saldo atual: <span className="font-medium">{formatCurrency(goal.currentAmount)}</span>
              </p>
              <p style={{ color: 'var(--danger)' }}>
                Meta: <span className="font-medium">{formatCurrency(goal.targetAmount)}</span>
              </p>
              <p className="text-xs mt-2" style={{ color: 'var(--danger)' }}>
                Valor máximo para retirada: {formatCurrency(goal.currentAmount)}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="amount"
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                Valor a Retirar (R$)
              </label>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 block w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 touch-manipulation text-base"
                style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text)' }}
                placeholder="0,00"
                min="0"
                max={goal.currentAmount}
                step="0.01"
                required
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
                style={{ backgroundColor: 'var(--danger)', boxShadow: 'var(--shadow-sm)' }}
                onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(0.85)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.filter = ''; }}
              >
                Retirar Fundos
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
};

export default WithdrawFundsModal;
