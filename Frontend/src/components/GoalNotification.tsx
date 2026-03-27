import React, { useState } from 'react';
import { GoalNotification as GoalNotificationType } from '../hooks/useGoalNotifications';

interface GoalNotificationProps {
  notification: GoalNotificationType;
  onClose: () => void;
}

const GoalNotificationComponent: React.FC<GoalNotificationProps> = ({
  notification,
  onClose,
}) => {
  const [closeHovered, setCloseHovered] = useState(false);

  const getNotificationStyles = (status: string): React.CSSProperties => {
    switch (status) {
      case 'completed':
        return {
          background: `linear-gradient(to right, var(--success-bg), var(--success-bg))`,
          borderColor: 'var(--success)',
          color: 'var(--success)',
        };
      case 'paused':
        return {
          background: `linear-gradient(to right, var(--warning-bg), var(--warning-bg))`,
          borderColor: 'var(--warning)',
          color: 'var(--warning)',
        };
      case 'active':
        return {
          background: `linear-gradient(to right, var(--primary-bg), var(--primary-bg))`,
          borderColor: 'var(--primary)',
          color: 'var(--primary)',
        };
      default:
        return {
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border)',
          color: 'var(--text)',
        };
    }
  };

  return (
    <div
      className="p-4 rounded-lg border relative animate-pulse"
      style={getNotificationStyles(notification.status)}
    >
      <button
        onClick={onClose}
        onMouseEnter={() => setCloseHovered(true)}
        onMouseLeave={() => setCloseHovered(false)}
        className="absolute top-2 right-2 transition-colors"
        style={{
          color: closeHovered ? 'var(--text-secondary)' : 'var(--text-muted)',
        }}
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
