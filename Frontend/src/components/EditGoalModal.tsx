import React, { useState, useEffect } from "react";
import { Goal, Category } from "../utils/types";
import { ICONS } from "../constants";
import Portal from "./Portal";

interface EditGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEditGoal: (goal: Goal) => void;
  goal: Goal | null;
  categories: Category[];
}

const EditGoalModal: React.FC<EditGoalModalProps> = ({
  isOpen,
  onClose,
  onEditGoal,
  goal,
  categories,
}) => {
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [category, setCategory] = useState("");

  // Carregar dados da meta quando o modal abrir
  useEffect(() => {
    if (isOpen && goal) {
      setName(goal.name);
      setTargetAmount(goal.targetAmount.toString());
      setDeadline(goal.deadline);
      setCategory(goal.category);
    }
  }, [isOpen, goal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !targetAmount || !deadline || !category) {
      alert("Por favor, preencha todos os campos");
      return;
    }

    const editedGoal: Goal = {
      ...goal,
      name,
      targetAmount: parseFloat(targetAmount),
      deadline,
      category,
    };

    onEditGoal(editedGoal);
    onClose();
  };

  const resetForm = () => {
    setName("");
    setTargetAmount("");
    setDeadline("");
    setCategory("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
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
        onClick={handleClose}
        role="button"
        tabIndex={0}
        aria-label="Fechar modal"
        onKeyDown={(e) => {
          if (e.key === "Escape") handleClose();
        }}
      >
        <div className={contentStyle} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {ICONS.close}
          </button>

          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Editar Meta
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="goalName" className={labelStyle}>
                Nome da Meta
              </label>
              <input
                type="text"
                id="goalName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputStyle}
                placeholder="Ex: Viagem para Europa"
                required
              />
            </div>

            <div>
              <label htmlFor="targetAmount" className={labelStyle}>
                Valor Alvo (R$)
              </label>
              <input
                type="number"
                id="targetAmount"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className={inputStyle}
                placeholder="0,00"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label htmlFor="deadline" className={labelStyle}>
                Data Limite
              </label>
              <input
                type="date"
                id="deadline"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className={inputStyle}
                required
              />
            </div>

            <div>
              <label htmlFor="category" className={labelStyle}>
                Categoria
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputStyle}
                required
              >
                <option value="">Selecione uma categoria</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
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
