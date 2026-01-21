import { useState, useEffect } from 'react';
import { Goal } from '../utils/types';

export type GoalStatus = 'paused' | 'active' | 'completed';

export interface GoalNotification {
  id: string;
  goalName: string;
  status: GoalStatus;
  message: string;
}

export const useGoalNotifications = (goals: Goal[]) => {
  const [notifications, setNotifications] = useState<GoalNotification[]>([]);

  useEffect(() => {
    const newNotifications: GoalNotification[] = [];

    goals.forEach(goal => {
      const progress = (goal.currentAmount / goal.targetAmount) * 100;
      let status: GoalStatus;
      let message: string;

      if (progress >= 100) {
        status = 'completed';
        message = `🎉 Parabéns! Você concluiu a meta "${goal.name}"!`;
      } else if (goal.currentAmount === 0) {
        status = 'paused';
        message = `⏸️ A meta "${goal.name}" está pausada. Adicione fundos para ativá-la!`;
      } else {
        status = 'active';
        message = `💪 A meta "${goal.name}" está ativa com ${progress.toFixed(1)}% de progresso!`;
      }

      newNotifications.push({
        id: goal.id,
        goalName: goal.name,
        status,
        message
      });
    });

    setNotifications(newNotifications);
  }, [goals]);

  const removeNotification = (goalId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== goalId));
  };

  return {
    notifications,
    removeNotification
  };
};
