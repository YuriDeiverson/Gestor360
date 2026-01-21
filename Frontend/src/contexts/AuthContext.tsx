import React, { createContext, useEffect, useState } from "react";
import { API_BASE_URL } from "../utils/api";

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: string;
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  is_shared: boolean;
  created_by: string;
  role: "owner" | "admin" | "member";
  created_at: string;
  member_count?: number;
}

export interface DashboardInvitation {
  id: string;
  dashboard_id: string;
  dashboard_name: string;
  inviter_id: string;
  inviter_name: string;
  invitee_email: string;
  status: "pending" | "accepted" | "rejected" | "cancelled";
  message?: string;
  expires_at: string;
  created_at: string;
}

interface AuthContextData {
  user: User | null;
  currentDashboard: Dashboard | null;
  dashboards: Dashboard[];
  invitations: DashboardInvitation[];
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  switchDashboard: (dashboardId: string) => Promise<void>;
  createDashboard: (name: string, description?: string) => Promise<Dashboard>;
  sendInvitation: (
    dashboardId: string,
    email: string,
    message?: string,
  ) => Promise<void>;
  respondToInvitation: (invitationId: string, accept: boolean) => Promise<void>;
  leaveDashboard: (dashboardId: string) => Promise<void>;
  refreshInvitations: () => Promise<void>;
  refreshDashboards: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export { AuthContext };

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [currentDashboard, setCurrentDashboard] = useState<Dashboard | null>(
    null,
  );
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [invitations, setInvitations] = useState<DashboardInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  // Função para fazer requisições autenticadas
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem("authToken");

    console.log(`📡 API Call: ${endpoint}`, { hasToken: !!token });

    const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    console.log(`📡 API Response: ${endpoint} - Status: ${response.status}`);

    if (response.status === 401) {
      // Token expirado ou inválido
      console.warn("⚠️ Token inválido ou expirado (401) - fazendo logout");
      logout();
      throw new Error("Sessão expirada");
    }

    const data = await response.json();

    if (!response.ok) {
      console.error(`❌ API Error: ${endpoint}`, data);
      throw new Error(data.error || "Erro na requisição");
    }

    return data;
  };

  // Login
  const login = async (email: string, password: string) => {
    try {
      const response = await apiCall("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      const { accessToken, user: userData } = response.data;

      localStorage.setItem("authToken", accessToken);
      setUser(userData);

      // Carregar dados iniciais
      await Promise.all([loadDashboards(), loadInvitations()]);
    } catch (error) {
      console.error("Erro no login:", error);
      throw error;
    }
  };

  // Registro
  const register = async (email: string, password: string, name: string) => {
    try {
      const response = await apiCall("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, name }),
      });

      const { accessToken, user: userData } = response.data;

      localStorage.setItem("authToken", accessToken);
      setUser(userData);

      // Carregar dados iniciais
      await Promise.all([loadDashboards(), loadInvitations()]);
    } catch (error) {
      console.error("Erro no registro:", error);
      throw error;
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentDashboardId");
    setUser(null);
    setCurrentDashboard(null);
    setDashboards([]);
    setInvitations([]);
  };

  // Carregar dashboards
  const loadDashboards = async () => {
    try {
      const response = await apiCall("/auth/dashboards");
      const dashboardsList = response.data;
      setDashboards(dashboardsList);

      // Selecionar dashboard atual
      const savedDashboardId = localStorage.getItem("currentDashboardId");
      let selectedDashboard = null;

      if (savedDashboardId) {
        selectedDashboard = dashboardsList.find(
          (d: Dashboard) => d.id === savedDashboardId,
        );
      }

      if (!selectedDashboard && dashboardsList.length > 0) {
        selectedDashboard = dashboardsList[0];
      }

      if (selectedDashboard) {
        setCurrentDashboard(selectedDashboard);
        localStorage.setItem("currentDashboardId", selectedDashboard.id);
      }
    } catch (error) {
      console.error("Erro ao carregar dashboards:", error);
    }
  };

  // Carregar convites
  const loadInvitations = async () => {
    try {
      console.log("🔄 AuthContext: Buscando convites na API...");
      
      // Primeiro tenta o endpoint oficial
      try {
        const response = await apiCall("/auth/invitations");
        console.log("📧 AuthContext: Resposta da API de convites:", response);
        
        if (response.data && response.data.length > 0) {
          setInvitations(response.data);
          console.log("✅ AuthContext: Convites carregados do endpoint oficial:", response.data.length);
          return;
        }
      } catch {
        console.log("⚠️ AuthContext: Endpoint /auth/invitations falhou, tentando alternativa...");
      }
      
      // Se não funcionou, tenta buscar das notificações (solução temporária)
      try {
        const notificationsResponse = await fetch(`${API_BASE_URL}/api/notifications`, {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
            "Content-Type": "application/json"
          }
        });
        
        if (notificationsResponse.ok) {
          const notificationsData = await notificationsResponse.json();
          console.log("📱 AuthContext: Notificações obtidas:", notificationsData);
          
          // Filtrar notificações de convite e converter para formato de convites
          const inviteNotifications = notificationsData.data?.filter((n: { type: string; is_read: boolean }) => 
            n.type === 'dashboard_invite' && !n.is_read
          ) || [];
          
          console.log("📧 AuthContext: Convites encontrados nas notificações:", inviteNotifications.length);
          
          // Converter notificações em formato de convites (adaptação temporária)
          const invites = inviteNotifications.map((notif: { 
            related_id: string; 
            message: string; 
            id: string;
          }) => ({
            id: notif.related_id, // ID do convite real
            dashboard_name: notif.message.match(/dashboard "([^"]+)"/)?.[1] || "Dashboard",
            inviter_name: notif.message.split(" convidou")[0] || "Usuário",
            message: "Convite de dashboard",
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias
            notification_id: notif.id
          }));
          
          setInvitations(invites);
          console.log("✅ AuthContext: Convites convertidos das notificações:", invites.length);
          return;
        }
      } catch (notifError) {
        console.log("⚠️ AuthContext: Erro ao buscar notificações:", notifError);
      }
      
      // Se tudo falhou, lista vazia
      setInvitations([]);
      console.log("❌ AuthContext: Nenhum convite encontrado");
      
    } catch (error) {
      console.error("❌ AuthContext: Erro geral ao carregar convites:", error);
      setInvitations([]);
    }
  };

  // Trocar dashboard
  const switchDashboard = async (dashboardId: string) => {
    const dashboard = dashboards.find((d) => d.id === dashboardId);
    if (dashboard) {
      setCurrentDashboard(dashboard);
      localStorage.setItem("currentDashboardId", dashboardId);
    }
  };

  // Criar dashboard
  const createDashboard = async (name: string, description?: string) => {
    try {
      const response = await apiCall("/auth/dashboards", {
        method: "POST",
        body: JSON.stringify({ name, description }),
      });

      const newDashboard = response.data;
      setDashboards((prev) => [newDashboard, ...prev]);

      // Automaticamente trocar para o novo dashboard
      setCurrentDashboard(newDashboard);
      localStorage.setItem("currentDashboardId", newDashboard.id);

      return newDashboard;
    } catch (error) {
      console.error("Erro ao criar dashboard:", error);
      throw error;
    }
  };

  // Enviar convite
  const sendInvitation = async (
    dashboardId: string,
    email: string,
    message?: string,
  ) => {
    try {
      await apiCall(`/auth/dashboards/${dashboardId}/invitations`, {
        method: "POST",
        body: JSON.stringify({ email, message }),
      });
    } catch (error) {
      console.error("Erro ao enviar convite:", error);
      throw error;
    }
  };

  // Responder convite
  const respondToInvitation = async (invitationId: string, accept: boolean) => {
    try {
      console.log("🎯 AuthContext: Respondendo convite", {
        invitationId,
        accept,
      });
      console.log("🔗 URL da requisição:", `/auth/invitations/${invitationId}`);

      const response = await apiCall(`/auth/invitations/${invitationId}`, {
        method: "PATCH",
        body: JSON.stringify({ accept }),
      });

      console.log("📡 Resposta da API:", response);

      if (accept) {
        // Recarregar dashboards se aceito
        console.log("✅ Convite aceito! Recarregando dashboards...");
        await loadDashboards();

        // Se a resposta contém o dashboardId, trocar para esse dashboard
        if (response.data?.dashboardId) {
          console.log(
            "🔄 Trocando para o dashboard aceito:",
            response.data.dashboardId,
          );
          await switchDashboard(response.data.dashboardId);
        }
      }

      // Remover convite da lista
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
      console.log("🗑️ Convite removido da lista");
    } catch (error) {
      console.error("❌ AuthContext: Erro ao responder convite:", error);
      throw error;
    }
  };

  // Sair de dashboard
  const leaveDashboard = async (dashboardId: string) => {
    try {
      console.log("🚪 AuthContext: Tentando sair do dashboard:", dashboardId);
      console.log("📋 AuthContext: Dashboards do usuário:", dashboards.map(d => ({ id: d.id, name: d.name, role: d.role })));
      console.log("🎯 AuthContext: Dashboard atual:", currentDashboard);
      
      // Verificar se o usuário faz parte do dashboard
      const dashboard = dashboards.find(d => d.id === dashboardId);
      if (!dashboard) {
        console.log("❌ AuthContext: Dashboard não encontrado na lista do usuário");
        throw new Error("Dashboard não encontrado. Você pode não fazer parte dele ou ele foi removido.");
      }
      
      // Verificar se é o proprietário (não pode sair do próprio dashboard)
      if (dashboard.role === 'owner') {
        console.log("❌ AuthContext: Tentativa de sair do próprio dashboard (proprietário)");
        throw new Error("Você não pode sair do seu próprio dashboard. Para removê-lo, delete o dashboard.");
      }
      
      console.log("✅ AuthContext: Dashboard encontrado:", dashboard);
      console.log("🔑 AuthContext: Role do usuário:", dashboard.role);
      console.log("✅ AuthContext: Prosseguindo com saída...");
      
      await apiCall(`/auth/dashboards/${dashboardId}/leave`, {
        method: "DELETE",
      });

      console.log("✅ AuthContext: Saída bem-sucedida, atualizando estado...");

      // Remover dashboard da lista
      setDashboards((prev) => prev.filter((d) => d.id !== dashboardId));

      // Se estava no dashboard que saiu, trocar para outro
      if (currentDashboard?.id === dashboardId) {
        const remainingDashboards = dashboards.filter(
          (d) => d.id !== dashboardId,
        );
        if (remainingDashboards.length > 0) {
          await switchDashboard(remainingDashboards[0].id);
        } else {
          setCurrentDashboard(null);
          localStorage.removeItem("currentDashboardId");
        }
      }
    } catch (error) {
      console.error("Erro ao sair do dashboard:", error);
      throw error;
    }
  };

  // Verificar autenticação na inicialização
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("authToken");
      console.log(
        "🔐 initAuth: Verificando token...",
        token ? "Token encontrado" : "Sem token",
      );

      if (token) {
        try {
          console.log("📡 Chamando /auth/me...");
          const response = await apiCall("/auth/me");
          console.log("✅ Usuário autenticado:", response.data.user);
          setUser(response.data.user);

          // Carregar dashboards inline
          try {
            console.log("📡 Carregando dashboards...");
            const dashboardResponse = await apiCall("/auth/dashboards");
            const dashboardsList = dashboardResponse.data;
            console.log("✅ Dashboards carregados:", dashboardsList.length);
            setDashboards(dashboardsList);

            // Selecionar dashboard atual
            const savedDashboardId = localStorage.getItem("currentDashboardId");
            let selectedDashboard = null;

            if (savedDashboardId) {
              selectedDashboard = dashboardsList.find(
                (d: Dashboard) => d.id === savedDashboardId,
              );
              console.log(
                "🎯 Dashboard salvo encontrado:",
                selectedDashboard?.name,
              );
            }

            if (!selectedDashboard && dashboardsList.length > 0) {
              selectedDashboard = dashboardsList[0];
              console.log(
                "🎯 Usando primeiro dashboard:",
                selectedDashboard.name,
              );
            }

            if (selectedDashboard) {
              setCurrentDashboard(selectedDashboard);
              localStorage.setItem("currentDashboardId", selectedDashboard.id);
            }
          } catch (error) {
            console.error("❌ Erro ao carregar dashboards:", error);
          }

          // Carregar convites inline
          try {
            console.log("📡 Carregando convites...");
            const invitationResponse = await apiCall("/auth/invitations");
            console.log(
              "✅ Convites carregados:",
              invitationResponse.data.length,
            );
            setInvitations(invitationResponse.data);
          } catch (error) {
            console.error("❌ Erro ao carregar convites:", error);
          }
        } catch (error) {
          console.error("❌ Erro ao verificar autenticação:", error);
          console.log("🚪 Fazendo logout...");
          logout();
        }
      } else {
        console.log("⚠️ Nenhum token encontrado - usuário não autenticado");
      }

      setLoading(false);
      console.log("✅ initAuth concluído");
    };

    initAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Dependências vazias - executar apenas uma vez

  const refreshInvitations = loadInvitations;
  const refreshDashboards = loadDashboards;

  return (
    <AuthContext.Provider
      value={{
        user,
        currentDashboard,
        dashboards,
        invitations,
        loading,
        login,
        register,
        logout,
        switchDashboard,
        createDashboard,
        sendInvitation,
        respondToInvitation,
        leaveDashboard,
        refreshInvitations,
        refreshDashboards,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook para usar o contexto de autenticação
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
