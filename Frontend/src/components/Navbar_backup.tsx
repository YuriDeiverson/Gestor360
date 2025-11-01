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

  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);
  const notificationDropdownRef = useRef<HTMLDivElement>(null);

  // Função para gerar iniciais do email
  const getInitials = (email: string): string => {
    if (!email) return "U";
    const parts = email.split("@")[0].split(".");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email.slice(0, 2).toUpperCase();
  };

  // Fechar dropdowns ao clicar fora
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
    setProcessingInvite(invitationId);
    try {
      await respondToInvitation(invitationId, accept);
      await refreshNotifications();
      await refreshInvitations();
    } catch (error) {
      console.error("Erro ao responder convite:", error);
    } finally {
      setProcessingInvite(null);
    }
  };

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-14 sm:h-16 justify-between">
          {/* Seção Esquerda - Logo e Menu Mobile */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Botão Menu Mobile */}
            <button
              onClick={toggleSidebar}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-lg transition-colors lg:hidden touch-manipulation"
              aria-label="Abrir menu principal"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Logo e Título */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  stroke="white"
                  strokeWidth={2}
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
                <h1 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 leading-tight">
                  <span className="sm:hidden">Painel</span>
                  <span className="hidden sm:inline">Painel Financeiro</span>
                </h1>
                {currentDashboard && (
                  <span className="text-xs text-gray-500 truncate max-w-[120px] sm:max-w-[200px] lg:hidden">
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
                className="flex items-center space-x-2 px-4 py-2 rounded-xl text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200 border border-gray-200 hover:border-gray-300"
              >
                <div className="h-6 w-6 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="font-medium text-sm">{currentDashboard.name}</span>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
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
                  className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-lg transition-colors touch-manipulation"
                  aria-label="Selecionar dashboard"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </button>
              )}
            </div>

            {/* Notificações */}
            <div className="relative">
              <button
                ref={notificationButtonRef}
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-lg transition-colors touch-manipulation"
                aria-label="Notificações"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] sm:text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center font-medium leading-none">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown Notificações - Mobile Friendly */}
              {showNotifications && (
                <div
                  ref={notificationDropdownRef}
                  className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden max-h-[85vh] z-[100] animate-fadeIn"
                  style={{ 
                    maxWidth: 'calc(100vw - 1rem)',
                    right: window.innerWidth < 640 ? '-0.5rem' : '0'
                  }}
                >
                  {/* Header responsivo */}
                  <div className="px-3 sm:px-4 py-3 border-b border-gray-100 bg-gray-50/80">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base flex items-center space-x-2">
                        <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h8m0-2V5a2 2 0 012-2h7a2 2 0 012 2v7" />
                        </svg>
                        <span>Notificações</span>
                        {unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-medium">
                            {unreadCount}
                          </span>
                        )}
                      </h3>
                      
                      {/* Botões de Ação Responsivos */}
                      <div className="flex space-x-1">
                        {notifications.some(n => n.is_read) && (
                          <button
                            onClick={() => removeReadNotifications()}
                            className="text-xs text-gray-600 hover:text-gray-800 font-medium px-2 py-1 rounded-md hover:bg-white/80 transition-colors touch-manipulation"
                          >
                            <span className="hidden sm:inline">Limpar lidas</span>
                            <span className="sm:hidden">Lidas</span>
                          </button>
                        )}
                        {unreadCount > 0 && (
                          <button
                            onClick={() => markAllAsRead(true)}
                            className="text-xs text-red-600 hover:text-red-700 font-medium px-2 py-1 rounded-md hover:bg-red-50 transition-colors touch-manipulation"
                          >
                            <span className="hidden sm:inline">Limpar todas</span>
                            <span className="sm:hidden">Todas</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Lista de Notificações Responsiva */}
                  <div className="max-h-80 overflow-y-auto overscroll-contain">
                    {notifications.length === 0 ? (
                      <div className="p-6 sm:p-8 text-center text-gray-500">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                          <svg className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium mb-1">Nenhuma notificação</p>
                        <p className="text-xs text-gray-400">Você está em dia! 🎉</p>
                      </div>
                    ) : (
                      <>
                        {notifications.slice(0, 5).map((notification) => (
                          <div
                            key={notification.id}
                            className={`px-3 sm:px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer touch-manipulation active:bg-gray-100 ${
                              !notification.is_read ? "bg-blue-50/50" : ""
                            }`}
                            onClick={() => {
                              if (!notification.is_read) {
                                markAsRead(notification.id, true);
                              }
                            }}
                          >
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0 mt-0.5">
                                {notification.type === "dashboard_invite" ? (
                                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                  </div>
                                ) : (
                                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 leading-5">
                                  {notification.title}
                                </p>
                                <p className="text-sm text-gray-600 mt-1 leading-5">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-2 font-medium">
                                  {new Date(notification.created_at).toLocaleDateString("pt-BR", {
                                    day: "2-digit",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>

                                {notification.type === "dashboard_invite" && notification.related_id && (
                                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-3">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleInvitationResponse(notification.related_id!, true);
                                      }}
                                      disabled={processingInvite === notification.related_id}
                                      className="w-full sm:w-auto px-3 py-1.5 bg-emerald-600 text-white text-xs rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-medium transition-colors touch-manipulation active:scale-95"
                                    >
                                      Aceitar
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleInvitationResponse(notification.related_id!, false);
                                      }}
                                      disabled={processingInvite === notification.related_id}
                                      className="w-full sm:w-auto px-3 py-1.5 bg-gray-200 text-gray-700 text-xs rounded-lg hover:bg-gray-300 disabled:opacity-50 font-medium transition-colors touch-manipulation active:scale-95"
                                    >
                                      Recusar
                                    </button>
                                  </div>
                                )}
                              </div>
                              
                              {!notification.is_read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                              )}
                            </div>
                          </div>
                        ))}
                        
                        {notifications.length > 5 && (
                          <div className="px-3 sm:px-4 py-3 border-t border-gray-100 bg-gray-50">
                            <button
                              onClick={() => {
                                setShowNotifications(false);
                                setShowNotificationCenter(true);
                              }}
                              className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-semibold py-2 hover:bg-blue-50 rounded-lg transition-colors touch-manipulation"
                            >
                              Ver todas ({notifications.length})
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
            <div className="relative">"
                        <button
                          onClick={() => {
                            removeReadNotifications();
                          }}
                          className="text-xs text-gray-600 hover:text-gray-700 font-medium"
                        >
                          Limpar lidas
                        </button>
                      )}
                      {unreadCount > 0 && (
                        <button
                          onClick={() => {
                            markAllAsRead(true); // Remove todas as notificações após marcar como lidas
                          }}
                          className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                        >
                          Limpar todas
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <svg
                          className="h-12 w-12 mx-auto mb-3 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                          />
                        </svg>
                        <p className="text-sm">Nenhuma notificação</p>
                      </div>
                    ) : (
                      notifications.slice(0, 3).map((notification) => (
                        <div
                          key={notification.id}
                          className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                            !notification.is_read ? "bg-emerald-50" : ""
                          }`}
                          onClick={() => {
                            if (!notification.is_read) {
                              markAsRead(notification.id, true); // Remove a notificação após marcar como lida
                            }
                          }}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              {notification.type === "dashboard_invite" ? (
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <svg
                                    className="w-4 h-4 text-blue-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
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
                                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                                  <svg
                                    className="w-4 h-4 text-emerald-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
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
                              <p className="text-sm font-medium text-gray-900">
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
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
                                  <div className="flex space-x-2 mt-2">
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
                                      className="px-3 py-1 bg-emerald-600 text-white text-xs rounded-lg hover:bg-emerald-700 disabled:opacity-50"
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
                                      className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded-lg hover:bg-gray-300 disabled:opacity-50"
                                    >
                                      Recusar
                                    </button>
                                  </div>
                                )}
                            </div>
                            {!notification.is_read && (
                              <div className="w-2 h-2 bg-emerald-600 rounded-full flex-shrink-0"></div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {notifications.length > 3 && (
                    <div className="px-4 py-3 border-t border-gray-100">
                      <button
                        onClick={() => {
                          setShowNotifications(false);
                          setShowNotificationCenter(true);
                        }}
                        className="w-full text-center text-sm text-emerald-600 hover:text-emerald-700 font-medium py-2 hover:bg-emerald-50 rounded-lg transition-colors"
                      >
                        Ver todas as notificações ({notifications.length})
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Perfil */}
            <div className="relative">
              <button
                ref={profileButtonRef}
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="relative focus:outline-none group"
              >
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-semibold shadow-sm group-hover:shadow-md transition-shadow cursor-pointer border-2 border-white">
                  {user?.email ? getInitials(user.email) : "U"}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-gray-600 rounded-full flex items-center justify-center">
                  <svg
                    className="w-2 h-2 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </button>

              {showProfileMenu && (
                <div
                  ref={profileDropdownRef}
                  className="absolute right-0 top-12 w-72 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-[100] animate-fadeIn"
                >
                  {/* Header */}
                  <div className="px-4 py-4 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-lg font-semibold">
                        {user?.email ? getInitials(user.email) : "U"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                          {user?.name}
                        </p>
                        <p className="text-sm text-gray-600 truncate">
                          {user?.email}
                        </p>
                        {currentDashboard && (
                          <div className="mt-1">
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">
                              {currentDashboard.role === "owner"
                                ? "Proprietário"
                                : currentDashboard.role === "admin"
                                ? "Admin"
                                : "Membro"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Menu opções */}
                  <div className="py-2">
                    <button
                      onClick={() => {
                        setShowDashboardSelector(true);
                        setShowProfileMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 transition-all duration-200 group"
                    >
                      <div className="w-9 h-9 bg-blue-50 group-hover:bg-blue-100 rounded-xl flex items-center justify-center transition-colors">
                        <svg
                          className="w-5 h-5 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                          Gerenciar Dashboards
                        </p>
                        <p className="text-sm text-gray-500">
                          Criar, editar ou trocar
                        </p>
                      </div>
                    </button>

                    <div className="border-t border-gray-100 my-1"></div>

                    <button
                      onClick={logout}
                      className="w-full px-4 py-3 text-left hover:bg-red-50 flex items-center space-x-3 transition-all duration-200 group"
                    >
                      <div className="w-9 h-9 bg-red-50 group-hover:bg-red-100 rounded-xl flex items-center justify-center transition-colors">
                        <svg
                          className="w-5 h-5 text-red-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
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
                        <p className="font-medium text-red-600 group-hover:text-red-700 transition-colors">
                          Sair
                        </p>
                        <p className="text-sm text-red-500">Encerrar sessão</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

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
