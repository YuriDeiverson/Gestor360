import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNotifications } from "../hooks/useNotifications";
import { useTheme } from "../contexts/ThemeContext";
import { DashboardSelector } from "./DashboardSelector";
import NotificationCenter from "./NotificationCenter";
import type { FinancialAlert } from "../utils/financialAlerts";

interface NavbarProps {
  user: {
    name: string;
    email: string;
    avatar?: string;
  } | null;
  toggleSidebar: () => void;
  /** Alertas calculados no app (orçamento, cartões, saldo) — não persistidos no servidor */
  financialAlerts?: FinancialAlert[];
}

const Navbar: React.FC<NavbarProps> = ({
  user,
  toggleSidebar,
  financialAlerts = [],
}) => {
  const { logout, currentDashboard, respondToInvitation } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
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

  const badgeCount = unreadCount + financialAlerts.length;

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

      // Fechar dropdown de perfil
      if (
        profileButtonRef.current &&
        !profileButtonRef.current.contains(target) &&
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(target)
      ) {
        setShowProfileMenu(false);
      }

      // Fechar dropdown de notificações
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

  // Função para lidar com respostas de convite
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
    <header className="backdrop-blur-md border-b shadow sticky top-0 z-40 transition-colors duration-300" style={{ backgroundColor: `color-mix(in srgb, var(--card) 92%, transparent)`, borderColor: 'var(--border)' }}>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-14 sm:h-16 justify-between">
          {/* Logo à esquerda */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg transition-colors touch-manipulation active:scale-95"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.backgroundColor = 'var(--card-hover)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
              aria-label="Abrir menu"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-md" style={{ backgroundColor: 'var(--primary-bg)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="var(--primary-light)" strokeWidth={2} viewBox="0 0 24 24" className="w-5 h-5 sm:w-8 sm:h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg sm:text-xl font-semibold" style={{ color: 'var(--text)' }}>
                  Painel Financeiro
                </h1>
              </div>
              <div className="sm:hidden">
                <h1 className="text-base font-semibold" style={{ color: 'var(--text)' }}>Painel</h1>
                {currentDashboard && (
                  <p className="text-xs truncate max-w-[100px]" style={{ color: 'var(--text-secondary)' }}>
                    {currentDashboard.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Ações à direita */}
          <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-all duration-200 touch-manipulation active:scale-95"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--warning)'; e.currentTarget.style.backgroundColor = 'var(--warning-bg)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
              aria-label={isDark ? "Modo claro" : "Modo escuro"}
              title={isDark ? "Modo claro" : "Modo escuro"}
            >
              {isDark ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Notificações */}
            <div className="relative">
              <button
                ref={notificationButtonRef}
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg transition-colors touch-manipulation active:scale-95"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.backgroundColor = 'var(--card-hover)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                aria-label="Notificações"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {badgeCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 text-white text-[10px] sm:text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center font-bold animate-pulse" style={{ backgroundColor: 'var(--danger)' }}>
                    {badgeCount > 9 ? "9+" : badgeCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div
                  ref={notificationDropdownRef}
                  className="absolute right-0 top-12 w-80 sm:w-96 rounded-xl overflow-hidden max-h-[85vh] z-[100]"
                  style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', maxWidth: 'calc(100vw - 1rem)', transform: window.innerWidth < 640 ? 'translateX(-10px)' : 'translateX(0)' }}
                >
                  <div className="px-3 sm:px-4 py-3 border-b" style={{ borderColor: 'var(--border)', background: `linear-gradient(to right, var(--gradient-start), var(--gradient-end))` }}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm sm:text-base flex items-center space-x-2" style={{ color: 'var(--text)' }}>
                        <svg className="h-4 w-4" fill="none" stroke="var(--primary)" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h8m0-2V5a2 2 0 012-2h7a2 2 0 012 2v7" />
                        </svg>
                        <span>Notificações</span>
                        {badgeCount > 0 && (
                          <span className="text-white text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ backgroundColor: 'var(--danger)' }}>
                            {badgeCount}
                          </span>
                        )}
                      </h3>
                      <div className="flex space-x-1">
                        {notifications.some((n) => n.is_read) && (
                          <button onClick={() => removeReadNotifications()} className="text-xs font-medium px-2 py-1 rounded-md transition-colors touch-manipulation" style={{ color: 'var(--text-secondary)' }}>
                            <span className="hidden sm:inline">Limpar lidas</span>
                            <span className="sm:hidden">Lidas</span>
                          </button>
                        )}
                        {unreadCount > 0 && (
                          <button onClick={() => markAllAsRead(true)} className="text-xs font-medium px-2 py-1 rounded-md transition-colors touch-manipulation" style={{ color: 'var(--danger)' }}>
                            <span className="hidden sm:inline">Limpar todas</span>
                            <span className="sm:hidden">Todas</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="max-h-80 overflow-y-auto overscroll-contain">
                    {notifications.length === 0 && financialAlerts.length === 0 ? (
                      <div className="p-6 sm:p-8 text-center" style={{ color: 'var(--text-secondary)' }}>
                        <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                          <svg className="h-6 w-6 sm:h-8 sm:w-8" fill="none" stroke="var(--text-muted)" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                        </div>
                        <p className="text-sm font-semibold mb-1">Nenhuma notificação</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Você está em dia!</p>
                      </div>
                    ) : (
                      <>
                        {financialAlerts.slice(0, 5).map((a) => (
                          <div
                            key={a.id}
                            className="px-3 sm:px-4 py-3 border-b touch-manipulation"
                            style={{
                              borderColor: 'var(--border)',
                              backgroundColor:
                                a.type === 'danger' ? 'var(--danger-bg)' : 'var(--warning-bg)',
                            }}
                          >
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0 mt-0.5">
                                <div
                                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center"
                                  style={{
                                    backgroundColor:
                                      a.type === 'danger'
                                        ? 'var(--danger-light)'
                                        : 'var(--warning)',
                                  }}
                                >
                                  <svg
                                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                  </svg>
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold leading-5" style={{ color: 'var(--text)' }}>{a.title}</p>
                                <p className="text-sm mt-1 leading-5" style={{ color: 'var(--text-secondary)' }}>{a.message}</p>
                                <p className="text-xs mt-2 font-medium" style={{ color: 'var(--text-muted)' }}>
                                  Resumo do mês
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                        {notifications.slice(0, 5).map((notification) => (
                          <div
                            key={notification.id}
                            className="px-3 sm:px-4 py-3 border-b transition-colors cursor-pointer touch-manipulation"
                            style={{
                              borderColor: 'var(--border)',
                              backgroundColor: !notification.is_read ? 'var(--primary-bg)' : 'transparent',
                            }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--card-hover)'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = !notification.is_read ? 'var(--primary-bg)' : 'transparent'}
                            onClick={() => { if (!notification.is_read) markAsRead(notification.id, true); }}
                          >
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0 mt-0.5">
                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: notification.type === "dashboard_invite" ? 'var(--primary-bg)' : 'var(--success-bg)' }}>
                                  {notification.type === "dashboard_invite" ? (
                                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="var(--primary)" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                  ) : (
                                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="var(--success)" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  )}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold leading-5" style={{ color: 'var(--text)' }}>{notification.title}</p>
                                <p className="text-sm mt-1 leading-5" style={{ color: 'var(--text-secondary)' }}>{notification.message}</p>
                                <p className="text-xs mt-2 font-medium" style={{ color: 'var(--text-muted)' }}>
                                  {new Date(notification.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                                </p>
                                {notification.type === "dashboard_invite" && notification.related_id && (
                                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-3">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleInvitationResponse(notification.related_id!, true); }}
                                      disabled={processingInvite === notification.related_id}
                                      className="w-full sm:w-auto px-3 py-1.5 text-white text-xs rounded-lg disabled:opacity-50 font-medium transition-colors touch-manipulation active:scale-95"
                                      style={{ backgroundColor: 'var(--success)' }}
                                    >
                                      Aceitar
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleInvitationResponse(notification.related_id!, false); }}
                                      disabled={processingInvite === notification.related_id}
                                      className="w-full sm:w-auto px-3 py-1.5 text-xs rounded-lg disabled:opacity-50 font-medium transition-colors touch-manipulation active:scale-95"
                                      style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                                    >
                                      Recusar
                                    </button>
                                  </div>
                                )}
                              </div>
                              {!notification.is_read && (
                                <div className="w-2 h-2 rounded-full flex-shrink-0 mt-2 animate-pulse" style={{ backgroundColor: 'var(--primary)' }}></div>
                              )}
                            </div>
                          </div>
                        ))}
                        {notifications.length > 5 && (
                          <div className="px-3 sm:px-4 py-3 border-t" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-secondary)' }}>
                            <button
                              onClick={() => { setShowNotifications(false); setShowNotificationCenter(true); }}
                              className="w-full text-center text-sm font-semibold py-2 rounded-lg transition-colors touch-manipulation"
                              style={{ color: 'var(--primary)' }}
                            >
                              Ver todas as do sistema ({notifications.length})
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
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs sm:text-sm font-bold shadow-lg group-hover:shadow-xl transition-all duration-200" style={{ borderWidth: 2, borderColor: 'var(--card)', borderStyle: 'solid' }}>
                  {user?.email ? getInitials(user.email) : "U"}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--text-muted)' }}>
                  <svg className="w-1.5 h-1.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {showProfileMenu && (
                <div
                  ref={profileDropdownRef}
                  className="absolute right-0 top-12 w-64 sm:w-80 rounded-2xl overflow-hidden z-[100]"
                  style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', maxWidth: 'calc(100vw - 2rem)' }}
                >
                  <div className="px-4 py-4 border-b" style={{ borderColor: 'var(--border)', background: `linear-gradient(to right, var(--gradient-start), var(--gradient-end))` }}>
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-lg font-bold shadow-lg">
                        {user?.email ? getInitials(user.email) : "U"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate" style={{ color: 'var(--text)' }}>{user?.name || "Usuário"}</p>
                        <p className="text-xs truncate font-medium" style={{ color: 'var(--text-secondary)' }}>{user?.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="py-2">
                    <button
                      onClick={() => { setShowProfileMenu(false); setShowDashboardSelector(true); }}
                      className="w-full px-4 py-3 text-left transition-colors group touch-manipulation"
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--primary-bg)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors" style={{ backgroundColor: 'var(--primary-bg)' }}>
                          <svg className="w-4 h-4" fill="none" stroke="var(--primary)" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold" style={{ color: 'var(--primary)' }}>Gerenciar Dashboards</p>
                          <p className="text-xs" style={{ color: 'var(--primary-light)' }}>Criar, editar e alternar</p>
                        </div>
                      </div>
                    </button>

                    <div className="my-2" style={{ borderTop: '1px solid var(--border)' }}></div>

                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-3 text-left transition-colors group touch-manipulation"
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--danger-bg)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--danger-bg)' }}>
                          <svg className="w-4 h-4" fill="none" stroke="var(--danger)" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold" style={{ color: 'var(--danger)' }}>Sair</p>
                          <p className="text-xs" style={{ color: 'var(--danger-light)' }}>Encerrar sessão</p>
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
