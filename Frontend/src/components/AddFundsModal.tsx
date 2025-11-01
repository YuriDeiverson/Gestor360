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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("Por favor, insira um valor válido.");
      return;
    }

    onAddFunds(goal.id, parsedAmount);

    // Reset form
    setAmount("");
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
            Adicionar Fundos
          </h2>
          <div className="text-center bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-lg border border-emerald-200">
            <p className="text-lg font-semibold text-gray-800">{goal.name}</p>
            <p className="text-gray-600">
              Meta:{" "}
              <span className="font-bold text-emerald-600">
                {formatCurrency(goal.targetAmount)}
              </span>
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="funds-amount" className={labelStyle}>
                Valor a Adicionar (R$)
              </label>
              <input
                id="funds-amount"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={inputStyle}
                required
                autoFocus
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
