import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import Portal from "./Portal";

interface DashboardSelectorProps {
  onClose: () => void;
}

export const DashboardSelector: React.FC<DashboardSelectorProps> = ({ onClose }) => {
  const { currentDashboard, dashboards, invitations, switchDashboard, createDashboard, sendInvitation, respondToInvitation, leaveDashboard, refreshInvitations, refreshDashboards } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();

  const [activeTab, setActiveTab] = useState<"dashboards" | "invitations" | "create" | "invite">("dashboards");
  const [loading, setLoading] = useState(false);
  const [hoveredEl, setHoveredEl] = useState<string | null>(null);

  const [newDashboardName, setNewDashboardName] = useState("");
  const [newDashboardDescription, setNewDashboardDescription] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");

  const hoverProps = (id: string) => ({
    onMouseEnter: () => setHoveredEl(id),
    onMouseLeave: () => setHoveredEl(null),
  });

  useEffect(() => {
    const loadData = async () => {
      console.log("🔄 DashboardSelector: Carregando convites...");
      try {
        await refreshInvitations();
        console.log("✅ DashboardSelector: Convites carregados");
      } catch (error) {
        console.error("❌ DashboardSelector: Erro ao carregar convites:", error);
      }
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    console.log("📧 DashboardSelector: Invitations atualizados:", invitations);
  }, [invitations]);

  const handleSwitchDashboard = async (dashboardId: string) => {
    try {
      setLoading(true);
      await switchDashboard(dashboardId);
      showSuccess("Dashboard alterado!", "Você agora está usando outro dashboard");
      onClose();
    } catch {
      showError("Erro", "Não foi possível trocar de dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDashboard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDashboardName.trim()) return showWarning("Nome obrigatório", "Digite um nome para o dashboard");
    try {
      setLoading(true);
      await createDashboard(newDashboardName.trim(), newDashboardDescription.trim() || undefined);
      showSuccess("Dashboard criado!", "Seu novo dashboard foi criado e está ativo");
      setNewDashboardName("");
      setNewDashboardDescription("");
      setActiveTab("dashboards");
      onClose();
    } catch (error) {
      showError("Erro", error instanceof Error ? error.message : "Erro ao criar dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !currentDashboard) return showWarning("Dados obrigatórios", "Digite um email e certifique-se de estar em um dashboard");
    try {
      setLoading(true);
      await sendInvitation(currentDashboard.id, inviteEmail.trim(), inviteMessage.trim() || undefined);
      showSuccess("Convite enviado!", `Convite enviado para ${inviteEmail}`);
      setInviteEmail("");
      setInviteMessage("");
      setActiveTab("dashboards");
    } catch (error) {
      showError("Erro", error instanceof Error ? error.message : "Erro ao enviar convite");
    } finally {
      setLoading(false);
    }
  };

  const handleRespondInvitation = async (invitationId: string, accept: boolean) => {
    try {
      setLoading(true);
      await respondToInvitation(invitationId, accept);
      showSuccess(accept ? "Convite aceito!" : "Convite rejeitado", accept ? "Você agora tem acesso ao dashboard" : "O convite foi rejeitado");
      await refreshInvitations();
      if (accept) await refreshDashboards();
    } catch (error) {
      showError("Erro", error instanceof Error ? error.message : "Erro ao responder convite");
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveDashboard = async (dashboardId: string) => {
    const dashboard = dashboards.find(d => d.id === dashboardId);
    if (!dashboard) {
      showError("Erro", "Dashboard não encontrado");
      return;
    }
    
    const confirmed = window.confirm(
      `Tem certeza que deseja sair do dashboard "${dashboard.name}"?\n\nVocê perderá acesso a todos os dados compartilhados e precisará de um novo convite para retornar.`
    );
    
    if (!confirmed) {
      return;
    }
    
    try {
      setLoading(true);
      
      console.log("🔄 DashboardSelector: Atualizando lista de dashboards antes de sair...");
      await refreshDashboards();
      
      const updatedDashboard = dashboards.find(d => d.id === dashboardId);
      if (!updatedDashboard) {
        showError("Erro", "Dashboard não encontrado. A lista foi atualizada.");
        return;
      }
      
      if (updatedDashboard.role === 'owner') {
        showError("Erro", "Você não pode sair do seu próprio dashboard. Para removê-lo, delete o dashboard.");
        return;
      }
      
      console.log("🚪 DashboardSelector: Tentando sair do dashboard:", {
        id: dashboardId,
        name: updatedDashboard.name,
        role: updatedDashboard.role
      });
      
      await leaveDashboard(dashboardId);
      showSuccess("Dashboard abandonado", `Você saiu do dashboard "${updatedDashboard.name}"`);
      await refreshDashboards();
    } catch (error) {
      console.error("❌ DashboardSelector: Erro ao sair do dashboard:", error);
      showError("Erro", error instanceof Error ? error.message : "Erro ao sair do dashboard");
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeStyle = (role: string): React.CSSProperties => {
    switch (role) {
      case 'owner':
        return { backgroundColor: 'var(--success-bg)', color: 'var(--success)' };
      case 'admin':
        return { backgroundColor: 'var(--primary-bg)', color: 'var(--primary)' };
      default:
        return { backgroundColor: 'var(--bg-secondary)', color: 'var(--text)' };
    }
  };

  return (
    <Portal>
      <div
        className="fixed inset-0 backdrop-blur-md flex items-center justify-center p-4 z-[100]"
        style={{ backgroundColor: "var(--overlay)" }}
      >
        <div
          className="rounded-3xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col"
          style={{
            backgroundColor: "var(--card)",
            boxShadow: "var(--shadow)",
          }}
        >
          {/* Cabeçalho */}
          <div
            className="flex items-center justify-between p-6"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <h2 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Gerenciar Dashboards</h2>
            <button
              onClick={onClose}
              {...hoverProps("close-btn")}
              className="transition-colors rounded-full p-2"
              style={{
                color: hoveredEl === "close-btn" ? "var(--text-secondary)" : "var(--text-muted)",
              }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-2 p-2" style={{ backgroundColor: "var(--bg-secondary)" }}>
            {[
              { key: "dashboards", label: "Meus Dashboards", count: dashboards.length },
              { key: "invitations", label: "Convites ", count: invitations.length },
              { key: "create", label: "Criar Novo" },
              { key: "invite", label: "Convidar" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as "dashboards" | "invitations" | "create" | "invite")}
                {...hoverProps(`tab-${tab.key}`)}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.key ? "shadow" : ""
                }`}
                style={
                  activeTab === tab.key
                    ? { backgroundColor: "var(--card)", color: "var(--primary)" }
                    : {
                        color: hoveredEl === `tab-${tab.key}` ? "var(--text)" : "var(--text-secondary)",
                        backgroundColor: "transparent",
                      }
                }
              >
                {tab.label}
                {tab.count && tab.count > 0 && (
                  <span
                    className="ml-2 px-2 py-0.5 rounded-full text-xs"
                    style={{
                      backgroundColor: "var(--primary-bg)",
                      color: "var(--primary)",
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Conteúdo */}
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            {/* Meus Dashboards */}
            {activeTab === "dashboards" && (
              <div className="space-y-4">
                {dashboards.length > 0 ? dashboards.map((dashboard) => (
                  <div
                    key={dashboard.id}
                    {...hoverProps(`dash-${dashboard.id}`)}
                    className="p-4 rounded-xl transition"
                    style={{
                      border: currentDashboard?.id === dashboard.id
                        ? "1px solid var(--primary)"
                        : hoveredEl === `dash-${dashboard.id}`
                        ? "1px solid var(--border)"
                        : "1px solid var(--border)",
                      backgroundColor: currentDashboard?.id === dashboard.id
                        ? "var(--primary-bg)"
                        : "transparent",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold" style={{ color: "var(--text)" }}>{dashboard.name}</h4>
                        {dashboard.description && (
                          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>{dashboard.description}</p>
                        )}
                        <div className="flex items-center space-x-2 mt-2 text-xs">
                          <span style={{ color: "var(--text-secondary)" }}>{dashboard.member_count} membro(s)</span>
                          <span style={{ color: "var(--text-secondary)" }}>{dashboard.is_shared ? "Compartilhado" : "Pessoal"}</span>
                          <span
                            className="px-2 py-1 rounded-full text-xs font-medium"
                            style={getRoleBadgeStyle(dashboard.role)}
                          >
                            {dashboard.role === 'owner' ? 'Proprietário' : dashboard.role === 'admin' ? 'Admin' : 'Membro'}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {currentDashboard?.id !== dashboard.id && (
                          <button
                            onClick={() => handleSwitchDashboard(dashboard.id)}
                            disabled={loading}
                            {...hoverProps(`use-${dashboard.id}`)}
                            className="px-3 py-1 text-white rounded-lg disabled:opacity-50 transition-colors"
                            style={{
                              backgroundColor: "var(--primary)",
                              filter: hoveredEl === `use-${dashboard.id}` ? "brightness(0.9)" : "none",
                            }}
                          >
                            Usar
                          </button>
                        )}
                        {dashboard.role !== "owner" && (
                          <button
                            onClick={() => handleLeaveDashboard(dashboard.id)}
                            disabled={loading}
                            {...hoverProps(`leave-${dashboard.id}`)}
                            className="px-3 py-1 text-white rounded-lg disabled:opacity-50 transition-colors"
                            style={{
                              backgroundColor: "var(--danger)",
                              filter: hoveredEl === `leave-${dashboard.id}` ? "brightness(0.9)" : "none",
                            }}
                          >
                            Sair
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )) : (
                  <p className="text-center py-8" style={{ color: "var(--text-secondary)" }}>Nenhum dashboard encontrado</p>
                )}
              </div>
            )}

            {/* Convites */}
            {activeTab === "invitations" && (
              <div className="space-y-4">
                {invitations.length > 0 ? invitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-4 rounded-xl flex justify-between items-start"
                    style={{
                      border: "1px solid var(--warning)",
                      backgroundColor: "var(--warning-bg)",
                    }}
                  >
                    <div>
                      <h4 className="font-semibold" style={{ color: "var(--text)" }}>{inv.dashboard_name}</h4>
                      <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                        Convite de: <span className="font-medium">{inv.inviter_name}</span>
                      </p>
                      {inv.message && (
                        <p className="text-sm mt-2 italic" style={{ color: "var(--text-secondary)" }}>"{inv.message}"</p>
                      )}
                      <p className="text-xs mt-2" style={{ color: "var(--text-secondary)" }}>
                        Expira em: {new Date(inv.expires_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleRespondInvitation(inv.id, true)}
                        disabled={loading}
                        {...hoverProps(`accept-${inv.id}`)}
                        className="px-3 py-1 text-white rounded-lg disabled:opacity-50 transition-colors"
                        style={{
                          backgroundColor: "var(--success)",
                          filter: hoveredEl === `accept-${inv.id}` ? "brightness(0.9)" : "none",
                        }}
                      >
                        Aceitar
                      </button>
                      <button
                        onClick={() => handleRespondInvitation(inv.id, false)}
                        disabled={loading}
                        {...hoverProps(`reject-${inv.id}`)}
                        className="px-3 py-1 text-white rounded-lg disabled:opacity-50 transition-colors"
                        style={{
                          backgroundColor: "var(--danger)",
                          filter: hoveredEl === `reject-${inv.id}` ? "brightness(0.9)" : "none",
                        }}
                      >
                        Rejeitar
                      </button>
                    </div>
                  </div>
                )) : (
                  <p className="text-center py-8" style={{ color: "var(--text-secondary)" }}>Nenhum convite pendente</p>
                )}
              </div>
            )}

            {/* Criar Dashboard */}
            {activeTab === "create" && (
              <form onSubmit={handleCreateDashboard} className="space-y-4">
                <input
                  type="text"
                  placeholder="Nome do Dashboard *"
                  value={newDashboardName}
                  onChange={e => setNewDashboardName(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:outline-none"
                  style={{
                    backgroundColor: "var(--input-bg)",
                    border: "1px solid var(--input-border)",
                    color: "var(--text)",
                  }}
                />
                <textarea
                  placeholder="Descrição (opcional)"
                  value={newDashboardDescription}
                  onChange={e => setNewDashboardDescription(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:outline-none"
                  style={{
                    backgroundColor: "var(--input-bg)",
                    border: "1px solid var(--input-border)",
                    color: "var(--text)",
                  }}
                  rows={3}
                />
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("dashboards")}
                    {...hoverProps("cancel-create")}
                    className="px-4 py-2 transition-colors"
                    style={{
                      color: hoveredEl === "cancel-create" ? "var(--text)" : "var(--text-secondary)",
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !newDashboardName.trim()}
                    {...hoverProps("submit-create")}
                    className="px-6 py-2 text-white rounded-lg disabled:opacity-50 transition-colors"
                    style={{
                      backgroundColor: "var(--primary)",
                      filter: hoveredEl === "submit-create" ? "brightness(0.9)" : "none",
                    }}
                  >
                    {loading ? "Criando..." : "Criar Dashboard"}
                  </button>
                </div>
              </form>
            )}

            {/* Convidar */}
            {activeTab === "invite" && (
              <form onSubmit={handleSendInvitation} className="space-y-4">
                <input
                  type="email"
                  placeholder="Email da pessoa *"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:outline-none"
                  style={{
                    backgroundColor: "var(--input-bg)",
                    border: "1px solid var(--input-border)",
                    color: "var(--text)",
                  }}
                />
                <textarea
                  placeholder="Mensagem (opcional)"
                  value={inviteMessage}
                  onChange={e => setInviteMessage(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:outline-none"
                  style={{
                    backgroundColor: "var(--input-bg)",
                    border: "1px solid var(--input-border)",
                    color: "var(--text)",
                  }}
                  rows={3}
                />
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("dashboards")}
                    {...hoverProps("cancel-invite")}
                    className="px-4 py-2 transition-colors"
                    style={{
                      color: hoveredEl === "cancel-invite" ? "var(--text)" : "var(--text-secondary)",
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !inviteEmail.trim()}
                    {...hoverProps("submit-invite")}
                    className="px-6 py-2 text-white rounded-lg disabled:opacity-50 transition-colors"
                    style={{
                      backgroundColor: "var(--primary)",
                      filter: hoveredEl === "submit-invite" ? "brightness(0.9)" : "none",
                    }}
                  >
                    {loading ? "Enviando..." : "Enviar Convite"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
};
