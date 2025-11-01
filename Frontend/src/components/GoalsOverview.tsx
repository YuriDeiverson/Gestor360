import React from "react";
import { Goal } from "../utils/types";

interface GoalsOverviewProps {
  goals: Goal[];
  setActivePage: (page: string) => void;
}

const GoalItem: React.FC<{ goal: Goal }> = ({ goal }) => {
  const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);

  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-gray-900">{goal.name}</span>
        <span className="text-sm font-semibold text-emerald-600">{progress.toFixed(0)}%</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">
        {goal.currentAmount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} /{" "}
        {goal.targetAmount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
      </p>
    </div>
  );
};

const GoalsOverview: React.FC<GoalsOverviewProps> = ({ goals, setActivePage }) => (
  <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-[0_6px_24px_rgba(12,12,16,0.06)]">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-medium text-gray-900">Progresso das Metas</h3>
      <button
        onClick={() => setActivePage("goals")}
        className="text-sm text-sky-600 hover:underline"
      >
        Ver todas
      </button>
    </div>

    <div className="space-y-4">
      {goals.length > 0 ? (
        goals.slice(0, 3).map((goal) => <GoalItem key={goal.id} goal={goal} />)
      ) : (
        <p className="text-center text-gray-500 py-4">Nenhuma meta definida.</p>
      )}
    </div>
  </div>
);

export default GoalsOverview;
