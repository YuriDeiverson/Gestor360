import React from "react";
import { Goal } from "../utils/types";

interface GoalsOverviewProps {
  goals: Goal[];
  setActivePage: (page: string) => void;
}

const GoalItem: React.FC<{ goal: Goal }> = ({ goal }) => {
  const progress = Math.min(
    (goal.currentAmount / goal.targetAmount) * 100,
    100,
  );

  return (
    <div>
      <div className="flex justify-between mb-1">
        <span
          className="text-sm font-medium"
          style={{ color: 'var(--text)' }}
        >
          {goal.name}
        </span>
        <span
          className="text-sm font-semibold"
          style={{ color: 'var(--primary)' }}
        >
          {progress.toFixed(0)}%
        </span>
      </div>
      <div
        className="w-full rounded-full h-2"
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
        <div
          className="h-2 rounded-full transition-all duration-300"
          style={{
            width: `${progress}%`,
            backgroundColor: 'var(--primary)',
          }}
        />
      </div>
      <p
        className="text-xs mt-1"
        style={{ color: 'var(--text-secondary)' }}
      >
        {goal.currentAmount.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })}{" "}
        /{" "}
        {goal.targetAmount.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })}
      </p>
    </div>
  );
};

const GoalsOverview: React.FC<GoalsOverviewProps> = ({
  goals,
  setActivePage,
}) => (
  <div
    className="backdrop-blur-md rounded-2xl p-6"
    style={{
      backgroundColor: 'var(--card)',
      boxShadow: 'var(--shadow)',
    }}
  >
    <div className="flex justify-between items-center mb-4">
      <h3
        className="text-lg font-medium"
        style={{ color: 'var(--text)' }}
      >
        Progresso das Metas
      </h3>
      <button
        onClick={() => setActivePage("goals")}
        className="text-sm hover:underline"
        style={{ color: 'var(--primary)' }}
      >
        Ver todas
      </button>
    </div>

    <div className="space-y-4">
      {goals.length > 0 ? (
        goals.slice(0, 3).map((goal) => <GoalItem key={goal.id} goal={goal} />)
      ) : (
        <p
          className="text-center py-4"
          style={{ color: 'var(--text-secondary)' }}
        >
          Nenhuma meta definida.
        </p>
      )}
    </div>
  </div>
);

export default GoalsOverview;
