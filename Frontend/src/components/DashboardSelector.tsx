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

  const [newDashboardName, setNewDashboardName] = useState("");
  const [newDashboardDescription, setNewDashboardDescription] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");

  // Carregar convites quando o componente é montado
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
  }, []); // Executar apenas uma vez na montagem

  // Debug: Log quando invitations mudam
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
    // Buscar informações do dashboard
    const dashboard = dashboards.find(d => d.id === dashboardId);
    if (!dashboard) {
      showError("Erro", "Dashboard não encontrado");
      return;
    }
    
    // Confirmação antes de sair
    const confirmed = window.confirm(
      `Tem certeza que deseja sair do dashboard "${dashboard.name}"?\n\nVocê perderá acesso a todos os dados compartilhados e precisará de um novo convite para retornar.`
    );
    
    if (!confirmed) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Primeiro, atualizar a lista de dashboards para ter certeza que está sincronizada
      console.log("🔄 DashboardSelector: Atualizando lista de dashboards antes de sair...");
      await refreshDashboards();
      
      // Verificar novamente se o dashboard ainda existe e se o usuário pode sair
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

  return (
    <Portal>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Gerenciar Dashboards</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors rounded-full p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-2 p-2 bg-gray-50">
            {[
              { key: "dashboards", label: "Meus Dashboards", count: dashboards.length },
              { key: "invitations", label: "Convites ", count: invitations.length },
              { key: "create", label: "Criar Novo" },
              { key: "invite", label: "Convidar" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as "dashboards" | "invitations" | "create" | "invite")}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.key ? "bg-white text-blue-600 shadow" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.label}
                {tab.count && tab.count > 0 && (
                  <span className="ml-2 bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs">{tab.count}</span>
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
                  <div key={dashboard.id} className={`p-4 border rounded-xl transition ${currentDashboard?.id === dashboard.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">{dashboard.name}</h4>
                        {dashboard.description && <p className="text-sm text-gray-500 mt-1">{dashboard.description}</p>}
                        <div className="flex items-center space-x-2 mt-2 text-xs">
                          <span className="text-gray-500">{dashboard.member_count} membro(s)</span>
                          <span className="text-gray-500">{dashboard.is_shared ? "Compartilhado" : "Pessoal"}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            dashboard.role === 'owner' 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : dashboard.role === 'admin'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {dashboard.role === 'owner' ? 'Proprietário' : dashboard.role === 'admin' ? 'Admin' : 'Membro'}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {currentDashboard?.id !== dashboard.id && <button onClick={() => handleSwitchDashboard(dashboard.id)} disabled={loading} className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">Usar</button>}
                        {dashboard.role !== "owner" && <button onClick={() => handleLeaveDashboard(dashboard.id)} disabled={loading} className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">Sair</button>}
                      </div>
                    </div>
                  </div>
                )) : (
                  <p className="text-center text-gray-500 py-8">Nenhum dashboard encontrado</p>
                )}
              </div>
            )}

            {/* Convites */}
            {activeTab === "invitations" && (
              <div className="space-y-4">
                {invitations.length > 0 ? invitations.map((inv) => (
                  <div key={inv.id} className="p-4 border border-orange-200 bg-orange-50 rounded-xl flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-900">{inv.dashboard_name}</h4>
                      <p className="text-sm text-gray-600 mt-1">Convite de: <span className="font-medium">{inv.inviter_name}</span></p>
                      {inv.message && <p className="text-sm text-gray-600 mt-2 italic">"{inv.message}"</p>}
                      <p className="text-xs text-gray-500 mt-2">Expira em: {new Date(inv.expires_at).toLocaleDateString("pt-BR")}</p>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button onClick={() => handleRespondInvitation(inv.id, true)} disabled={loading} className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">Aceitar</button>
                      <button onClick={() => handleRespondInvitation(inv.id, false)} disabled={loading} className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">Rejeitar</button>
                    </div>
                  </div>
                )) : (
                  <p className="text-center text-gray-500 py-8">Nenhum convite pendente</p>
                )}
              </div>
            )}

            {/* Criar Dashboard */}
            {activeTab === "create" && (
              <form onSubmit={handleCreateDashboard} className="space-y-4">
                <input type="text" placeholder="Nome do Dashboard *" value={newDashboardName} onChange={e => setNewDashboardName(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                <textarea placeholder="Descrição (opcional)" value={newDashboardDescription} onChange={e => setNewDashboardDescription(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" rows={3} />
                <div className="flex justify-end space-x-2">
                  <button type="button" onClick={() => setActiveTab("dashboards")} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancelar</button>
                  <button type="submit" disabled={loading || !newDashboardName.trim()} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{loading ? "Criando..." : "Criar Dashboard"}</button>
                </div>
              </form>
            )}

            {/* Convidar */}
            {activeTab === "invite" && (
              <form onSubmit={handleSendInvitation} className="space-y-4">
                <input type="email" placeholder="Email da pessoa *" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                <textarea placeholder="Mensagem (opcional)" value={inviteMessage} onChange={e => setInviteMessage(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" rows={3} />
                <div className="flex justify-end space-x-2">
                  <button type="button" onClick={() => setActiveTab("dashboards")} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancelar</button>
                  <button type="submit" disabled={loading || !inviteEmail.trim()} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">{loading ? "Enviando..." : "Enviar Convite"}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
};
