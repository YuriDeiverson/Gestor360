import React, { useState } from "react";
import { Goal, Category } from "../utils/types";
import { formatCurrency } from "../utils/helpers";
import { ICONS } from "../constants";
import AddGoalModal from "./AddGoalModal";
import AddFundsModal from "./AddFundsModal";
import EditGoalModal from "./EditGoalModal";

interface GoalCardProps {
  goal: Goal;
  onAddFundsClick: (goal: Goal) => void;
  onEditClick: (goal: Goal) => void;
  onDeleteClick: (goalId: string) => void;
}

const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  onAddFundsClick,
  onEditClick,
  onDeleteClick,
}) => {
  const progress = Math.min(
    (goal.currentAmount / goal.targetAmount) * 100,
    100,
  );
  const daysLeft = Math.max(
    0,
    Math.ceil(
      (new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    ),
  );

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-[0_6px_24px_rgba(12,12,16,0.06)] flex flex-col justify-between transition hover:shadow-lg">
      <div>
        <div className="flex justify-between items-start mb-2">
          <div>
            <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full">
              {goal.category}
            </span>
            <h3 className="text-lg font-medium text-gray-900 mt-2">
              {goal.name}
            </h3>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => onEditClick(goal)}
              className="text-gray-400 hover:text-blue-600 rounded-full p-1 transition"
              title="Editar meta"
            >
              {ICONS.edit}
            </button>
            <button
              onClick={() => onDeleteClick(goal.id)}
              className="text-gray-400 hover:text-red-600 rounded-full p-1 transition"
              title="Deletar meta"
            >
              {ICONS.trash}
            </button>
          </div>
        </div>

        <p className="text-sm text-gray-500 mt-1">
          {formatCurrency(goal.currentAmount)} /{" "}
          {formatCurrency(goal.targetAmount)}
        </p>

        <div className="w-full bg-gray-100 rounded-full h-2 my-3">
          <div
            className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex justify-between text-sm text-gray-500">
          <span>{progress.toFixed(0)}% completo</span>
          <span>Faltam {daysLeft} dias</span>
        </div>
      </div>

      <button
        onClick={() => onAddFundsClick(goal)}
        className="mt-5 w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold text-sm"
      >
        Adicionar fundos
      </button>
    </div>
  );
};

interface GoalsPageProps {
  goals: Goal[];
  addGoal: (goal: Omit<Goal, "id" | "currentAmount">) => void;
  editGoal: (editedGoal: Goal) => void;
  deleteGoal: (goalId: string) => void;
  addFunds: (goalId: string, amount: number) => void;
  categories: Category[];
}

const GoalsPage: React.FC<GoalsPageProps> = ({
  goals,
  addGoal,
  editGoal,
  deleteGoal,
  addFunds,
  categories,
}) => {
  const [isAddGoalModalOpen, setAddGoalModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const handleAddFunds = (goalId: string, amount: number) => {
    addFunds(goalId, amount);
    setSelectedGoal(null);
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
  };

  const handleSaveEditedGoal = (editedGoal: Goal) => {
    editGoal(editedGoal);
    setEditingGoal(null);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">
          Metas financeiras
        </h2>
        <button
          onClick={() => setAddGoalModalOpen(true)}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold"
        >
          Nova meta
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            onAddFundsClick={setSelectedGoal}
            onEditClick={handleEditGoal}
            onDeleteClick={deleteGoal}
          />
        ))}
      </div>

      <AddGoalModal
        isOpen={isAddGoalModalOpen}
        onClose={() => setAddGoalModalOpen(false)}
        onAddGoal={(newGoal) => {
          addGoal(newGoal);
          setAddGoalModalOpen(false);
        }}
        categories={categories}
      />

      {editingGoal && (
        <EditGoalModal
          isOpen={!!editingGoal}
          onClose={() => setEditingGoal(null)}
          onEditGoal={handleSaveEditedGoal}
          goal={editingGoal}
          categories={categories}
        />
      )}

      {selectedGoal && (
        <AddFundsModal
          isOpen={!!selectedGoal}
          onClose={() => setSelectedGoal(null)}
          onAddFunds={handleAddFunds}
          goal={selectedGoal}
        />
      )}
    </div>
  );
};

export default GoalsPage;
