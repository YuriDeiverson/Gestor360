import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNotifications } from "../hooks/useNotifications";
import { DashboardSelector } from "./DashboardSelector";
import NotificationCenter from "./NotificationCenter";

interface NavbarProps {
  user: {
    name: string;
    email: string;
    avatar?: string;
  } | null;
  toggleSidebar: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, toggleSidebar }) => {
  const { logout, currentDashboard, respondToInvitation, refreshInvitations } =
    useAuth();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeReadNotifications,
    refreshNotifications,
  } = useNotifications();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [showDashboardSelector, setShowDashboardSelector] = useState(false);
  const [processingInvite, setProcessingInvite] = useState<string | null>(null);
  const [hoveredEl, setHoveredEl] = useState<string | null>(null);

  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);
  const notificationDropdownRef = useRef<HTMLDivElement>(null);

  const hoverProps = (id: string) => ({
    onMouseEnter: () => setHoveredEl(id),
    onMouseLeave: () => setHoveredEl(null),
  });

  const getInitials = (email: string): string => {
    if (!email) return "U";
    const parts = email.split("@")[0].split(".");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email.slice(0, 2).toUpperCase();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        profileButtonRef.current &&
        !profileButtonRef.current.contains(target) &&
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(target)
      ) {
        setShowProfileMenu(false);
      }

      if (
        notificationButtonRef.current &&
        !notificationButtonRef.current.contains(target) &&
        notificationDropdownRef.current &&
        !notificationDropdownRef.current.contains(target)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInvitationResponse = async (
    invitationId: string,
    accept: boolean,
  ) => {
    try {
      setProcessingInvite(invitationId);
      await respondToInvitation(invitationId, accept);
      await refreshNotifications();
    } catch (error) {
      console.error("Erro ao responder convite:", error);
    } finally {
      setProcessingInvite(null);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Erro no logout:", error);
    }
  };

  return (
    <header
      className="backdrop-blur-md sticky top-0 z-40"
      style={{
        backgroundColor: "var(--card)",
        borderBottom: "1px solid var(--border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-14 sm:h-16 justify-between">
          {/* Seção Esquerda - Logo e Menu Mobile */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Botão Menu Mobile */}
            <button
              onClick={toggleSidebar}
              {...hoverProps("menu-btn")}
              className="p-2 rounded-lg transition-all duration-200 lg:hidden touch-manipulation active:scale-95"
              style={{
                color:
                  hoveredEl === "menu-btn"
                    ? "var(--text)"
                    : "var(--text-secondary)",
                backgroundColor:
                  hoveredEl === "menu-btn"
                    ? "var(--bg-secondary)"
                    : "transparent",
              }}
              aria-label="Abrir menu principal"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            {/* Logo e Título */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div
                className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(to top right, var(--gradient-start), var(--gradient-end))",
                  boxShadow: "var(--shadow)",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  stroke="white"
                  strokeWidth={2.5}
                  viewBox="0 0 24 24"
                  className="w-4 h-4 sm:w-6 sm:h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>

              {/* Título responsivo */}
              <div className="flex flex-col">
                <h1
                  className="text-base sm:text-lg lg:text-xl font-bold leading-tight"
                  style={{ color: "var(--text)" }}
                >
                  <span className="sm:hidden">Painel</span>
                  <span className="hidden sm:inline">Painel Financeiro</span>
                </h1>
                {currentDashboard && (
                  <span
                    className="text-xs truncate max-w-[120px] sm:max-w-[200px] lg:hidden font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {currentDashboard.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Seção Central - Dashboard Selector (Desktop) */}
          <div className="hidden lg:flex flex-1 justify-center">
            {currentDashboard && (
              <button
                onClick={() => setShowDashboardSelector(true)}
                {...hoverProps("dash-desktop")}
                className="flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all duration-200"
                style={{
                  color:
                    hoveredEl === "dash-desktop"
                      ? "var(--text)"
                      : "var(--text)",
                  backgroundColor:
                    hoveredEl === "dash-desktop"
                      ? "var(--bg-secondary)"
                      : "transparent",
                  border: `1px solid ${
                    hoveredEl === "dash-desktop"
                      ? "var(--border)"
                      : "var(--border)"
                  }`,
                  boxShadow:
                    hoveredEl === "dash-desktop"
                      ? "var(--shadow-sm)"
                      : "none",
                }}
              >
                <div
                  className="h-6 w-6 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: "var(--primary-bg)" }}
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    style={{ color: "var(--primary)" }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <span className="font-semibold text-sm">
                  {currentDashboard.name}
                </span>
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Seção Direita - Actions */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            {/* Dashboard Selector Mobile/Tablet */}
            <div className="lg:hidden">
              {currentDashboard && (
                <button
                  onClick={() => setShowDashboardSelector(true)}
                  {...hoverProps("dash-mobile")}
                  className="p-2 rounded-lg transition-all duration-200 touch-manipulation active:scale-95"
                  style={{
                    color:
                      hoveredEl === "dash-mobile"
                        ? "var(--text)"
                        : "var(--text-secondary)",
                    backgroundColor:
                      hoveredEl === "dash-mobile"
                        ? "var(--bg-secondary)"
                        : "transparent",
                  }}
                  aria-label="Selecionar dashboard"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* Notificações */}
            <div className="relative">
              <button
                ref={notificationButtonRef}
                onClick={() => setShowNotifications(!showNotifications)}
                {...hoverProps("notif-btn")}
                className="relative p-2 rounded-lg transition-all duration-200 touch-manipulation active:scale-95"
                style={{
                  color:
                    hoveredEl === "notif-btn"
                      ? "var(--text)"
                      : "var(--text-secondary)",
                  backgroundColor:
                    hoveredEl === "notif-btn"
                      ? "var(--bg-secondary)"
                      : "transparent",
                }}
                aria-label="Notificações"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {unreadCount > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 text-white text-[10px] sm:text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center font-bold leading-none animate-pulse"
                    style={{ backgroundColor: "var(--danger)" }}
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown Notificações Mobile-Friendly */}
              {showNotifications && (
                <div
                  ref={notificationDropdownRef}
                  className="absolute right-0 top-12 w-80 sm:w-96 rounded-2xl overflow-hidden max-h-[85vh] z-[100] animate-in slide-in-from-top-2 duration-200"
                  style={{
                    maxWidth: "calc(100vw - 2rem)",
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    boxShadow: "var(--shadow)",
                  }}
                >
                  {/* Header do Dropdown */}
                  <div
                    className="px-4 py-3"
                    style={{
                      backgroundColor: "var(--primary-bg)",
                      borderBottom: "1px solid var(--border-light)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <h3
                        className="font-bold text-sm sm:text-base flex items-center space-x-2"
                        style={{ color: "var(--text)" }}
                      >
                        <div
                          className="w-6 h-6 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: "var(--primary-bg)" }}
                        >
                          <svg
                            className="h-3.5 w-3.5"
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
                        <span>Notificações</span>
                        {unreadCount > 0 && (
                          <span
                            className="text-white text-xs px-2 py-0.5 rounded-full font-bold"
                            style={{ backgroundColor: "var(--danger)" }}
                          >
                            {unreadCount}
                          </span>
                        )}
                      </h3>

                      {/* Botões de Ação */}
                      <div className="flex space-x-1">
                        {notifications.some((n) => n.is_read) && (
                          <button
                            onClick={() => removeReadNotifications()}
                            {...hoverProps("clear-read")}
                            className="text-xs font-medium px-2 py-1 rounded-md transition-colors"
                            style={{
                              color:
                                hoveredEl === "clear-read"
                                  ? "var(--text)"
                                  : "var(--text-secondary)",
                              backgroundColor:
                                hoveredEl === "clear-read"
                                  ? "var(--card)"
                                  : "transparent",
                            }}
                          >
                            Limpar lidas
                          </button>
                        )}
                        {unreadCount > 0 && (
                          <button
                            onClick={() => markAllAsRead(true)}
                            {...hoverProps("clear-all")}
                            className="text-xs font-medium px-2 py-1 rounded-md transition-colors"
                            style={{
                              color: "var(--danger)",
                              backgroundColor:
                                hoveredEl === "clear-all"
                                  ? "var(--danger-bg)"
                                  : "transparent",
                            }}
                          >
                            Limpar todas
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Lista de Notificações */}
                  <div className="max-h-80 overflow-y-auto overscroll-contain">
                    {notifications.length === 0 ? (
                      <div
                        className="p-8 text-center"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        <div
                          className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: "var(--bg-secondary)" }}
                        >
                          <svg
                            className="h-8 w-8"
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
                        </div>
                        <p className="text-sm font-semibold mb-1">
                          Nenhuma notificação
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Você está em dia! 🎉
                        </p>
                      </div>
                    ) : (
                      <>
                        {notifications.slice(0, 5).map((notification) => (
                          <div
                            key={notification.id}
                            {...hoverProps(`notif-item-${notification.id}`)}
                            className="px-4 py-3 transition-colors cursor-pointer active:bg-gray-100"
                            style={{
                              backgroundColor:
                                hoveredEl ===
                                `notif-item-${notification.id}`
                                  ? "var(--bg-secondary)"
                                  : !notification.is_read
                                  ? "var(--primary-bg)"
                                  : "transparent",
                              borderBottom: "1px solid var(--border-light)",
                            }}
                            onClick={() => {
                              if (!notification.is_read) {
                                markAsRead(notification.id, true);
                              }
                            }}
                          >
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0 mt-1">
                                {notification.type === "dashboard_invite" ? (
                                  <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center"
                                    style={{
                                      backgroundColor: "var(--primary-bg)",
                                    }}
                                  >
                                    <svg
                                      className="w-4 h-4"
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
                                    className="w-8 h-8 rounded-full flex items-center justify-center"
                                    style={{
                                      backgroundColor: "var(--primary-bg)",
                                    }}
                                  >
                                    <svg
                                      className="w-4 h-4"
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
                                <p
                                  className="text-sm font-semibold leading-5"
                                  style={{ color: "var(--text)" }}
                                >
                                  {notification.title}
                                </p>
                                <p
                                  className="text-sm mt-1 leading-5"
                                  style={{ color: "var(--text-secondary)" }}
                                >
                                  {notification.message}
                                </p>
                                <p
                                  className="text-xs mt-2 font-medium"
                                  style={{ color: "var(--text-muted)" }}
                                >
                                  {new Date(
                                    notification.created_at,
                                  ).toLocaleDateString("pt-BR", {
                                    day: "2-digit",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>

                                {notification.type === "dashboard_invite" &&
                                  notification.related_id && (
                                    <div className="flex space-x-2 mt-3">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleInvitationResponse(
                                            notification.related_id!,
                                            true,
                                          );
                                        }}
                                        disabled={
                                          processingInvite ===
                                          notification.related_id
                                        }
                                        {...hoverProps(
                                          `accept-${notification.related_id}`,
                                        )}
                                        className="px-3 py-1.5 text-white text-xs rounded-lg disabled:opacity-50 font-medium transition-colors active:scale-95"
                                        style={{
                                          backgroundColor: "var(--primary)",
                                          filter:
                                            hoveredEl ===
                                            `accept-${notification.related_id}`
                                              ? "brightness(0.9)"
                                              : "none",
                                        }}
                                      >
                                        Aceitar
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleInvitationResponse(
                                            notification.related_id!,
                                            false,
                                          );
                                        }}
                                        disabled={
                                          processingInvite ===
                                          notification.related_id
                                        }
                                        {...hoverProps(
                                          `decline-${notification.related_id}`,
                                        )}
                                        className="px-3 py-1.5 text-xs rounded-lg disabled:opacity-50 font-medium transition-colors active:scale-95"
                                        style={{
                                          backgroundColor:
                                            hoveredEl ===
                                            `decline-${notification.related_id}`
                                              ? "var(--border)"
                                              : "var(--bg-secondary)",
                                          color: "var(--text)",
                                        }}
                                      >
                                        Recusar
                                      </button>
                                    </div>
                                  )}
                              </div>

                              {!notification.is_read && (
                                <div
                                  className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-2 animate-pulse"
                                  style={{
                                    backgroundColor: "var(--primary)",
                                  }}
                                ></div>
                              )}
                            </div>
                          </div>
                        ))}

                        {notifications.length > 5 && (
                          <div
                            className="px-4 py-3"
                            style={{
                              borderTop: "1px solid var(--border-light)",
                              backgroundColor: "var(--bg-secondary)",
                            }}
                          >
                            <button
                              onClick={() => {
                                setShowNotifications(false);
                                setShowNotificationCenter(true);
                              }}
                              {...hoverProps("view-all")}
                              className="w-full text-center text-sm font-semibold py-2 rounded-lg transition-colors"
                              style={{
                                color: "var(--primary)",
                                backgroundColor:
                                  hoveredEl === "view-all"
                                    ? "var(--primary-bg)"
                                    : "transparent",
                              }}
                            >
                              Ver todas as notificações ({notifications.length})
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Perfil */}
            <div className="relative">
              <button
                ref={profileButtonRef}
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="relative focus:outline-none group touch-manipulation active:scale-95"
                aria-label="Menu do usuário"
              >
                <div
                  className="h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold border-2 border-white transition-all duration-200"
                  style={{
                    background:
                      "linear-gradient(to bottom right, var(--gradient-start), var(--gradient-end))",
                    boxShadow: "var(--shadow)",
                  }}
                >
                  {user?.email ? getInitials(user.email) : "U"}
                </div>
                <div
                  className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "var(--text-secondary)" }}
                >
                  <svg
                    className="w-1.5 h-1.5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={4}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </button>

              {/* Dropdown do Perfil Mobile-Friendly */}
              {showProfileMenu && (
                <div
                  ref={profileDropdownRef}
                  className="absolute right-0 top-12 w-64 sm:w-80 rounded-2xl overflow-hidden z-[100] animate-in slide-in-from-top-2 duration-200"
                  style={{
                    maxWidth: "calc(100vw - 2rem)",
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    boxShadow: "var(--shadow)",
                  }}
                >
                  {/* Header do Perfil */}
                  <div
                    className="px-4 py-4"
                    style={{
                      background: "var(--primary-bg)",
                      borderBottom: "1px solid var(--border-light)",
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="h-12 w-12 rounded-full flex items-center justify-center text-white text-lg font-bold"
                        style={{
                          background:
                            "linear-gradient(to bottom right, var(--gradient-start), var(--gradient-end))",
                          boxShadow: "var(--shadow)",
                        }}
                      >
                        {user?.email ? getInitials(user.email) : "U"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-bold truncate"
                          style={{ color: "var(--text)" }}
                        >
                          {user?.name || "Usuário"}
                        </p>
                        <p
                          className="text-xs truncate font-medium"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {user?.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    <button
                      onClick={handleLogout}
                      {...hoverProps("logout-btn")}
                      className="w-full px-4 py-3 text-left transition-colors group active:bg-red-100"
                      style={{
                        backgroundColor:
                          hoveredEl === "logout-btn"
                            ? "var(--danger-bg)"
                            : "transparent",
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                          style={{ backgroundColor: "var(--danger-bg)" }}
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            style={{ color: "var(--danger)" }}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p
                            className="font-semibold transition-colors"
                            style={{ color: "var(--danger)" }}
                          >
                            Sair
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: "var(--danger)" }}
                          >
                            Encerrar sessão
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modais */}
      {showDashboardSelector && (
        <DashboardSelector onClose={() => setShowDashboardSelector(false)} />
      )}

      <NotificationCenter
        isOpen={showNotificationCenter}
        onClose={() => setShowNotificationCenter(false)}
      />
    </header>
  );
};

export default Navbar;
