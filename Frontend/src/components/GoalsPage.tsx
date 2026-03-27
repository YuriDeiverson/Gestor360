import React, { useState } from "react";
import { Goal, Budget } from "../utils/types";
import { formatCurrency } from "../utils/helpers";
import { ICONS } from "../constants";
import { getGoalImage, getGoalType } from "../utils/goalImages";
import AddGoalModal from "./AddGoalModal";
import AddFundsModal from "./AddFundsModal";
import WithdrawFundsModal from "./WithdrawFundsModal";
import EditGoalModal from "./EditGoalModal";
import { Meta } from "../utils/api";

interface GoalCardProps {
  goal: Goal;
  onAddFundsClick: (goal: Goal) => void;
  onWithdrawFundsClick: (goal: Goal) => void;
  onEditClick: (goal: Goal) => void;
  onDeleteClick: (goalId: string) => void;
  budgets: Budget[];
}

const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  onAddFundsClick,
  onWithdrawFundsClick,
  onEditClick,
  onDeleteClick,
  budgets,
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

  const budget = budgets.find((b) => b.id === goal.budgetId);
  const goalImage = getGoalImage(goal.name);
  const goalType = getGoalType(goal.name);
  
  const getGoalStatus = () => {
    if (progress >= 100) return 'completed';
    if (goal.currentAmount === 0) return 'paused';
    return 'active';
  };
  
  const status = getGoalStatus();
  
  const getStatusStyle = (): React.CSSProperties => {
    switch (status) {
      case 'completed':
        return { backgroundColor: 'var(--success-bg)', color: 'var(--success)', borderColor: 'var(--success)' };
      case 'paused':
        return { backgroundColor: 'var(--warning-bg)', color: 'var(--warning)', borderColor: 'var(--warning)' };
      case 'active':
        return { backgroundColor: 'var(--primary-bg)', color: 'var(--primary)', borderColor: 'var(--primary)' };
      default:
        return { backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', borderColor: 'var(--border)' };
    }
  };
  
  const getStatusText = () => {
    switch (status) {
      case 'completed': return 'Concluída';
      case 'paused': return 'Pausada';
      case 'active': return 'Ativa';
      default: return 'Desconhecido';
    }
  };
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  const endDate = new Date(goal.deadline);

  const getProgressColor = () => {
    if (status === 'completed') return 'var(--success)';
    if (status === 'paused') return 'var(--warning)';
    return 'var(--primary)';
  };

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] relative h-80"
      style={{ backgroundColor: 'var(--card)', boxShadow: 'var(--shadow)' }}
    >
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${goalImage})` }}
      />
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-6 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div>
            <span
              className="px-2 py-1 rounded-full text-xs font-semibold border"
              style={getStatusStyle()}
            >
              {getStatusText()}
            </span>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => onEditClick(goal)}
              className="text-white/80 hover:text-white bg-black/20 backdrop-blur-sm rounded-full p-2 transition hover:bg-black/30"
              title="Editar meta"
            >
              {ICONS.edit}
            </button>
            <button
              onClick={() => onDeleteClick(goal.id)}
              className="text-white/80 hover:text-white bg-black/20 backdrop-blur-sm rounded-full p-2 transition hover:bg-black/30"
              title="Deletar meta"
            >
              {ICONS.trash}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-white text-xl font-bold mb-1 drop-shadow-lg">{goal.name}</h3>
            <p className="text-white/90 text-sm">{goalType}</p>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-white/80">Progresso</span>
              <span className="font-semibold text-white">{progress.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2 backdrop-blur-sm">
              <div
                className="h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, backgroundColor: getProgressColor() }}
              />
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-white/80">
                {formatCurrency(goal.currentAmount)}
              </span>
              <span className="text-white font-medium">
                {formatCurrency(goal.targetAmount)}
              </span>
            </div>
          </div>

          <div className="flex justify-between text-sm text-white/80 mb-4">
            <span>Início: {startDate.toLocaleDateString('pt-BR')}</span>
            <span>Término: {endDate.toLocaleDateString('pt-BR')}</span>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <button
                onClick={() => onAddFundsClick(goal)}
                className="flex-1 px-4 py-2 text-white rounded-lg transition-colors font-semibold text-sm"
                style={{ backgroundColor: 'var(--primary)' }}
                onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(0.85)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.filter = ''; }}
              >
                Adicionar
              </button>
              
              {goal.currentAmount > 0 && (
                <>
                  <div className="flex items-center" style={{ color: 'var(--text-muted)' }}>
                    -
                  </div>
                  <button
                    onClick={() => onWithdrawFundsClick(goal)}
                    className="flex-1 px-4 py-2 text-white rounded-lg transition-colors font-semibold text-sm"
                    style={{ backgroundColor: 'var(--danger)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(0.85)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.filter = ''; }}
                  >
                    Retirar
                  </button>
                </>
              )}
            </div>
            
            {status === 'completed' && (
              <div
                className="mt-3 p-2 rounded-lg"
                style={{ backgroundColor: 'var(--success-bg)', border: '1px solid var(--success)' }}
              >
                <p className="text-xs" style={{ color: 'var(--success)' }}>🎉 Parabéns! Meta concluída!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface GoalsPageProps {
  goals: Meta[];
  addGoal: (goal: Omit<Goal, "id" | "currentAmount">) => void;
  editGoal: (editedGoal: Goal) => void;
  deleteGoal: (goalId: string) => void;
  addFunds: (goalId: string, amount: number) => void;
  withdrawFunds: (goalId: string, amount: number) => void;
  budgets: Budget[];
  categories: any[];
}

const convertMetaToGoal = (meta: Meta): Goal => ({
  id: meta.id,
  name: meta.name,
  targetAmount: meta.targetAmount,
  currentAmount: meta.currentAmount,
  deadline: meta.deadline,
  budgetId: meta.budgetId,
});

const GoalsPage: React.FC<GoalsPageProps> = ({
  goals,
  addGoal,
  editGoal,
  deleteGoal,
  addFunds,
  withdrawFunds,
  budgets,
  categories,
}) => {
  const [isAddGoalModalOpen, setAddGoalModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [selectedGoalForWithdraw, setSelectedGoalForWithdraw] = useState<Goal | null>(null);
  
  const convertedGoals: Goal[] = goals.map(convertMetaToGoal);

  const handleAddFunds = (goalId: string, amount: number) => {
    addFunds(goalId, amount);
    setSelectedGoal(null);
  };

  const handleWithdrawFunds = (goalId: string, amount: number) => {
    withdrawFunds(goalId, amount);
    setSelectedGoalForWithdraw(null);
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
        <h2 className="text-2xl font-semibold" style={{ color: 'var(--text)' }}>
          Metas financeiras
        </h2>
        <button
          onClick={() => setAddGoalModalOpen(true)}
          className="px-4 py-2 text-white rounded-lg transition-colors font-semibold"
          style={{ backgroundColor: 'var(--primary)' }}
          onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(0.85)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.filter = ''; }}
        >
          Nova meta
        </button>
      </div>

      {convertedGoals.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text)' }}>
            Nenhuma meta encontrada
          </h3>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
            Crie sua primeira meta para começar a acompanhar seus objetivos financeiros.
          </p>
          <button
            onClick={() => setAddGoalModalOpen(true)}
            className="px-6 py-3 text-white rounded-lg transition-colors font-semibold"
            style={{ backgroundColor: 'var(--primary)' }}
            onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(0.85)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.filter = ''; }}
          >
            Criar Primeira Meta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {convertedGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              budgets={budgets}
              onAddFundsClick={setSelectedGoal}
              onWithdrawFundsClick={setSelectedGoalForWithdraw}
              onEditClick={handleEditGoal}
              onDeleteClick={deleteGoal}
            />
          ))}
        </div>
      )}

      <AddGoalModal
        isOpen={isAddGoalModalOpen}
        onClose={() => setAddGoalModalOpen(false)}
        onAddGoal={(newGoal) => {
          addGoal(newGoal);
          setAddGoalModalOpen(false);
        }}
      />

      {editingGoal && (
        <EditGoalModal
          isOpen={!!editingGoal}
          onClose={() => setEditingGoal(null)}
          onEditGoal={handleSaveEditedGoal}
          goal={editingGoal}
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

      {selectedGoalForWithdraw && (
        <WithdrawFundsModal
          isOpen={!!selectedGoalForWithdraw}
          onClose={() => setSelectedGoalForWithdraw(null)}
          onWithdrawFunds={handleWithdrawFunds}
          goal={selectedGoalForWithdraw}
        />
      )}
    </div>
  );
};

export default GoalsPage;
