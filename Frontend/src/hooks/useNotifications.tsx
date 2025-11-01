import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3002";

export interface Notification {
  id: string;
  user_id: string;
  type: "dashboard_invite" | "dashboard_update" | "system";
  title: string;
  message: string;
  related_id?: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const getAuthHeaders = () => {
    const token = localStorage.getItem("authToken");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      console.log("⚠️ useNotifications: Usuário não está logado");
      return;
    }

    try {
      setLoading(true);
      console.log(
        "🔔 useNotifications: Buscando notificações para:",
        user.email,
        "ID:",
        user.id,
      );

      const response = await fetch(`${API_URL}/api/notifications`, {
        headers: getAuthHeaders(),
      });

      console.log("📡 useNotifications: Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log(
          "📬 useNotifications: Notificações recebidas:",
          data?.length || 0,
          "notificações",
        );
        console.log("📝 useNotifications: Detalhes das notificações:", data);
        setNotifications(data);
      } else {
        console.error(
          "❌ useNotifications: Erro na resposta:",
          response.status,
          await response.text(),
        );
      }
    } catch (error) {
      console.error("💥 useNotifications: Erro ao buscar notificações:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch(
        `${API_URL}/api/notifications/unread-count`,
        {
          headers: getAuthHeaders(),
        },
      );

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.error("Erro ao buscar contador de notificações:", error);
    }
  }, [user]);

  const deleteNotification = useCallback(
    async (notificationId: string) => {
      if (!user) return;

      try {
        const response = await fetch(
          `${API_URL}/api/notifications/${notificationId}`,
          {
            method: "DELETE",
            headers: getAuthHeaders(),
          },
        );

        if (response.ok) {
          // Remove a notificação da lista local
          setNotifications((prev) =>
            prev.filter((notification) => notification.id !== notificationId),
          );
          await fetchUnreadCount();
        } else {
          console.error("Erro ao deletar notificação do backend");
        }
      } catch (error) {
        console.error("Erro ao deletar notificação:", error);
      }
    },
    [user, fetchUnreadCount],
  );

  const markAsRead = useCallback(
    async (notificationId: string, removeAfterRead: boolean = false) => {
      if (!user) return;

      try {
        if (removeAfterRead) {
          // Se deve remover após ler, deletar permanentemente
          await deleteNotification(notificationId);
        } else {
          // Apenas marcar como lida
          const response = await fetch(
            `${API_URL}/api/notifications/${notificationId}/read`,
            {
              method: "PATCH",
              headers: getAuthHeaders(),
            },
          );

          if (response.ok) {
            setNotifications((prev) =>
              prev.map((notification) =>
                notification.id === notificationId
                  ? {
                      ...notification,
                      is_read: true,
                      read_at: new Date().toISOString(),
                    }
                  : notification,
              ),
            );
            await fetchUnreadCount();
          }
        }
      } catch (error) {
        console.error("Erro ao marcar notificação como lida:", error);
      }
    },
    [user, deleteNotification, fetchUnreadCount],
  );

  const removeReadNotifications = useCallback(async () => {
    if (!user) return;

    try {
      // Primeiro marca todas as não lidas como lidas
      const unreadNotifications = notifications.filter((n) => !n.is_read);
      if (unreadNotifications.length > 0) {
        const response = await fetch(`${API_URL}/api/notifications/read-all`, {
          method: "PATCH",
          headers: getAuthHeaders(),
        });

        if (response.ok) {
          setNotifications((prev) =>
            prev.map((notification) => ({
              ...notification,
              is_read: true,
              read_at: new Date().toISOString(),
            })),
          );
        }
      }

      // Depois remove todas as notificações lidas do backend
      const response = await fetch(`${API_URL}/api/notifications/delete-read`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        // Remove localmente apenas as notificações lidas
        setNotifications([]);
        setUnreadCount(0);
      } else {
        console.error("Erro ao remover notificações lidas do backend");
        // Fallback: remove apenas localmente
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Erro ao remover notificações lidas:", error);
      // Fallback: remove apenas localmente
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user, notifications]);

  const markAllAsRead = useCallback(
    async (removeAfterRead: boolean = false) => {
      if (!user) return;

      try {
        if (removeAfterRead) {
          // Se deve remover após ler, usar a função de remover notificações lidas
          await removeReadNotifications();
        } else {
          // Apenas marcar todas como lidas
          const response = await fetch(
            `${API_URL}/api/notifications/read-all`,
            {
              method: "PATCH",
              headers: getAuthHeaders(),
            },
          );

          if (response.ok) {
            setNotifications((prev) =>
              prev.map((notification) => ({
                ...notification,
                is_read: true,
                read_at: new Date().toISOString(),
              })),
            );
            setUnreadCount(0);
          }
        }
      } catch (error) {
        console.error(
          "Erro ao marcar todas as notificações como lidas:",
          error,
        );
      }
    },
    [user, removeReadNotifications],
  );

  const clearAllNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch(`${API_URL}/api/notifications/clear-all`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        setNotifications([]);
        setUnreadCount(0);
      } else {
        console.error("Erro ao limpar todas as notificações do backend");
        // Fallback: limpar apenas localmente
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Erro ao limpar todas as notificações:", error);
      // Fallback: limpar apenas localmente
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user]);

  const refreshNotifications = useCallback(async () => {
    await Promise.all([fetchNotifications(), fetchUnreadCount()]);
  }, [fetchNotifications, fetchUnreadCount]);

  // Polling automático a cada 30 segundos
  useEffect(() => {
    if (!user) return;

    refreshNotifications();

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [user, refreshNotifications, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    removeReadNotifications,
    clearAllNotifications,
    refreshNotifications,
    fetchNotifications,
  };
};
