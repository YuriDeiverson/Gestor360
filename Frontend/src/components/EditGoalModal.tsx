import React, { useState, useEffect } from "react";
import { Goal } from "../utils/types";
import { ICONS } from "../constants";
import Portal from "./Portal";

interface EditGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEditGoal: (goal: Goal) => void;
  goal: Goal | null;
}

const EditGoalModal: React.FC<EditGoalModalProps> = ({
  isOpen,
  onClose,
  onEditGoal,
  goal,
}) => {
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState("");

  useEffect(() => {
    if (isOpen && goal) {
      setName(goal.name);
      setTargetAmount(goal.targetAmount.toString());
      setDeadline(goal.deadline);
    }
  }, [isOpen, goal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !targetAmount || !deadline) {
      alert("Por favor, preencha todos os campos");
      return;
    }

    const editedGoal: Goal = {
      ...goal,
      name,
      targetAmount: parseFloat(targetAmount),
      deadline,
    };

    onEditGoal(editedGoal);
    onClose();
  };

  const resetForm = () => {
    setName("");
    setTargetAmount("");
    setDeadline("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <div
        className="fixed inset-0 backdrop-blur-md flex justify-center items-center z-50 p-4 pointer-events-auto"
        style={{ backgroundColor: 'var(--overlay)' }}
        onClick={handleClose}
        role="button"
        tabIndex={0}
        aria-label="Fechar modal"
        onKeyDown={(e) => {
          if (e.key === "Escape") handleClose();
        }}
      >
        <div
          className="p-8 rounded-2xl w-full max-w-lg relative space-y-6 max-h-[90vh] overflow-y-auto pointer-events-auto"
          style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            {ICONS.close}
          </button>

          <h2
            className="text-2xl font-semibold mb-6"
            style={{ color: 'var(--text)' }}
          >
            Editar Meta
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="goalName"
                className="block text-sm font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                Nome da Meta
              </label>
              <input
                type="text"
                id="goalName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text)' }}
                placeholder="Ex: Viagem para Europa"
                required
              />
            </div>

            <div>
              <label
                htmlFor="targetAmount"
                className="block text-sm font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                Valor Alvo (R$)
              </label>
              <input
                type="number"
                id="targetAmount"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="mt-1 block w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text)' }}
                placeholder="0,00"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label
                htmlFor="deadline"
                className="block text-sm font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                Data Limite
              </label>
              <input
                type="date"
                id="deadline"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="mt-1 block w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text)' }}
                required
              />
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2 border rounded-lg transition-colors"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 text-white rounded-lg transition-colors"
                style={{ backgroundColor: 'var(--primary)' }}
                onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(0.85)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.filter = ''; }}
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

export default EditGoalModal;
