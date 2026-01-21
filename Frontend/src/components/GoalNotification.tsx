import React from 'react';
import { GoalNotification as GoalNotificationType } from '../hooks/useGoalNotifications';

interface GoalNotificationProps {
  notification: GoalNotificationType;
  onClose: () => void;
}

const GoalNotificationComponent: React.FC<GoalNotificationProps> = ({
  notification,
  onClose,
}) => {
  const getNotificationStyles = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-800';
      case 'paused':
        return 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200 text-yellow-800';
      case 'active':
        return 'bg-gradient-to-r from-blue-50 to-sky-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className={`p-4 rounded-lg border ${getNotificationStyles(notification.status)} relative animate-pulse`}>
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Fechar notificação"
      >
        ✕
      </button>
      <div className="pr-6">
        <p className="font-medium text-sm">{notification.message}</p>
      </div>
    </div>
  );
};

export default GoalNotificationComponent;
