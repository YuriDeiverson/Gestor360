import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useNotifications } from "../hooks/useNotifications";

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    removeReadNotifications,
    clearAllNotifications,
  } = useNotifications();

  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [hoveredEl, setHoveredEl] = useState<string | null>(null);

  const hoverProps = (id: string) => ({
    onMouseEnter: () => setHoveredEl(id),
    onMouseLeave: () => setHoveredEl(null),
  });

  const filteredNotifications = notifications.filter((notification) => {
    switch (filter) {
      case "unread":
        return !notification.is_read;
      case "read":
        return notification.is_read;
      default:
        return true;
    }
  });

  const handleNotificationClick = (notificationId: string, isRead: boolean) => {
    if (!isRead) {
      markAsRead(notificationId, true);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center z-[200] p-4"
      style={{ backgroundColor: "var(--overlay)" }}
    >
      <div
        className="rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
        style={{
          backgroundColor: "var(--card)",
          boxShadow: "var(--shadow)",
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="flex items-center space-x-3">
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "var(--primary-bg)" }}
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ color: "var(--primary)" }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-5 5v-5zM4 19h8m0-2V5a2 2 0 012-2h7a2 2 0 012 2v7"
                />
              </svg>
            </div>
            <div>
              <h2
                className="text-lg font-semibold"
                style={{ color: "var(--text)" }}
              >
                Central de Notificações
              </h2>
              <p
                className="text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                {unreadCount > 0
                  ? `${unreadCount} não lida${unreadCount > 1 ? "s" : ""}`
                  : "Todas as notificações foram lidas"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            {...hoverProps("close-btn")}
            className="h-8 w-8 rounded-lg flex items-center justify-center transition-colors"
            style={{
              backgroundColor:
                hoveredEl === "close-btn"
                  ? "var(--bg-secondary)"
                  : "transparent",
            }}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ color: "var(--text-secondary)" }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Filters and Actions */}
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="flex space-x-2">
            {(["all", "unread", "read"] as const).map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                {...hoverProps(`filter-${filterOption}`)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                style={
                  filter === filterOption
                    ? {
                        backgroundColor: "var(--primary-bg)",
                        color: "var(--primary)",
                      }
                    : {
                        color: "var(--text-secondary)",
                        backgroundColor:
                          hoveredEl === `filter-${filterOption}`
                            ? "var(--bg-secondary)"
                            : "transparent",
                      }
                }
              >
                {filterOption === "all"
                  ? "Todas"
                  : filterOption === "unread"
                  ? "Não lidas"
                  : "Lidas"}
              </button>
            ))}
          </div>

          <div className="flex space-x-2">
            {notifications.some((n) => n.is_read) && (
              <button
                onClick={removeReadNotifications}
                {...hoverProps("clear-read")}
                className="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors"
                style={{
                  color:
                    hoveredEl === "clear-read"
                      ? "var(--text)"
                      : "var(--text-secondary)",
                  backgroundColor:
                    hoveredEl === "clear-read"
                      ? "var(--bg-secondary)"
                      : "transparent",
                }}
              >
                Limpar lidas
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={clearAllNotifications}
                {...hoverProps("clear-all")}
                className="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors"
                style={{
                  color:
                    hoveredEl === "clear-all"
                      ? "var(--danger)"
                      : "var(--danger)",
                  backgroundColor:
                    hoveredEl === "clear-all"
                      ? "var(--danger-bg)"
                      : "transparent",
                }}
              >
                Limpar todas
              </button>
            )}
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead(true)}
                {...hoverProps("mark-read")}
                className="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors"
                style={{
                  color: "var(--primary)",
                  backgroundColor:
                    hoveredEl === "mark-read"
                      ? "var(--primary-bg)"
                      : "transparent",
                }}
              >
                Ler e limpar
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-96 overflow-y-auto">
          {filteredNotifications.length === 0 ? (
            <div
              className="p-12 text-center"
              style={{ color: "var(--text-secondary)" }}
            >
              <svg
                className="h-16 w-16 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ color: "var(--text-muted)" }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <p className="text-base font-medium mb-1">Nenhuma notificação</p>
              <p className="text-sm">
                {filter === "all"
                  ? "Você não tem notificações no momento"
                  : filter === "unread"
                  ? "Todas as notificações foram lidas"
                  : "Nenhuma notificação lida"}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification, index) => (
              <div
                key={notification.id}
                {...hoverProps(`notif-${notification.id}`)}
                className="px-6 py-4 cursor-pointer transition-colors"
                style={{
                  backgroundColor:
                    hoveredEl === `notif-${notification.id}`
                      ? "var(--bg-secondary)"
                      : !notification.is_read
                      ? "var(--primary-bg)"
                      : "transparent",
                  borderBottom:
                    index !== filteredNotifications.length - 1
                      ? "1px solid var(--border-light)"
                      : "none",
                }}
                onClick={() =>
                  handleNotificationClick(notification.id, notification.is_read)
                }
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {notification.type === "dashboard_invite" ? (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: "var(--primary-bg)" }}
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          style={{ color: "var(--primary)" }}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                      </div>
                    ) : (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: "var(--primary-bg)" }}
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          style={{ color: "var(--primary)" }}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3
                          className="text-sm font-semibold"
                          style={{ color: "var(--text)" }}
                        >
                          {notification.title}
                        </h3>
                        <p
                          className="text-sm mt-1"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {notification.message}
                        </p>
                        <p
                          className="text-xs mt-2"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {new Date(notification.created_at).toLocaleDateString(
                            "pt-BR",
                            {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 ml-3">
                        {!notification.is_read && (
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: "var(--primary)" }}
                          ></div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          {...hoverProps(`delete-${notification.id}`)}
                          className="p-1 transition-colors"
                          title="Deletar notificação"
                          style={{
                            color:
                              hoveredEl === `delete-${notification.id}`
                                ? "var(--danger)"
                                : "var(--text-muted)",
                          }}
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4"
          style={{
            borderTop: "1px solid var(--border)",
            backgroundColor: "var(--bg-secondary)",
          }}
        >
          <div
            className="flex items-center justify-between text-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            <span>
              {filteredNotifications.length} de {notifications.length}{" "}
              notificações
            </span>
            <button
              onClick={onClose}
              {...hoverProps("footer-close")}
              className="font-medium transition-colors"
              style={{
                color: "var(--primary)",
                filter:
                  hoveredEl === "footer-close" ? "brightness(0.85)" : "none",
              }}
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default NotificationCenter;
