import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabase, supabaseAdmin } from "./supabase.js";
import { emailService } from "./emailService.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key";
const JWT_EXPIRES_IN = "7d";

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: User;
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

class AuthService {
  // Registrar novo usuário
  async register(
    email: string,
    password: string,
    name: string,
  ): Promise<AuthTokens> {
    try {
      // Verificar se email já existe (usando cliente admin)
      const { data: existingUser } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("email", email.toLowerCase())
        .single();

      if (existingUser) {
        throw new Error("Email já está em uso");
      }

      // Hash da senha
      const passwordHash = await bcrypt.hash(password, 12);

      // Criar usuário (usando cliente admin para bypass RLS)
      const { data: user, error } = await supabaseAdmin
        .from("users")
        .insert([
          {
            email: email.toLowerCase(),
            password_hash: passwordHash,
            name: name.trim(),
          },
        ])
        .select("id, email, name, avatar_url, created_at")
        .single();

      if (error) throw error;

      // Gerar tokens
      const tokens = this.generateTokens(user);

      return {
        ...tokens,
        user,
      };
    } catch (error) {
      console.error("Erro no registro:", error);
      throw error;
    }
  }

  // Login do usuário
  async login(email: string, password: string): Promise<AuthTokens> {
    try {
      // Buscar usuário (usando cliente admin)
      const { data: user, error } = await supabaseAdmin
        .from("users")
        .select("id, email, name, avatar_url, password_hash, created_at")
        .eq("email", email.toLowerCase())
        .single();

      if (error || !user) {
        throw new Error("Email ou senha incorretos");
      }

      // Verificar senha
      const isPasswordValid = await bcrypt.compare(
        password,
        user.password_hash,
      );
      if (!isPasswordValid) {
        throw new Error("Email ou senha incorretos");
      }

      // Remover password_hash do retorno
      const { password_hash, ...userWithoutPassword } = user;

      // Gerar tokens
      const tokens = this.generateTokens(userWithoutPassword);

      return {
        ...tokens,
        user: userWithoutPassword,
      };
    } catch (error) {
      console.error("Erro no login:", error);
      throw error;
    }
  }

  // Gerar tokens JWT
  private generateTokens(user: User) {
    const payload = { userId: user.id, email: user.email };

    const accessToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    const refreshToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: "30d",
    });

    return { accessToken, refreshToken };
  }

  // Verificar token
  verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error("Token inválido");
    }
  }

  // Buscar dashboards do usuário
  async getUserDashboards(userId: string): Promise<Dashboard[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from("user_dashboards")
        .select(
          `
          role,
          dashboards (
            id,
            name,
            description,
            is_shared,
            created_by,
            created_at
          )
        `,
        )
        .eq("user_id", userId);

      if (error) throw error;

      // Contar membros de cada dashboard
      const dashboards = await Promise.all(
        data.map(async (item: any) => {
          const { data: memberCount } = await supabaseAdmin
            .from("user_dashboards")
            .select("user_id", { count: "exact" })
            .eq("dashboard_id", item.dashboards.id);

          return {
            ...item.dashboards,
            role: item.role,
            member_count: memberCount?.length || 0,
          };
        }),
      );

      return dashboards;
    } catch (error) {
      console.error("Erro ao buscar dashboards:", error);
      throw error;
    }
  }

  // Criar novo dashboard
  async createDashboard(
    userId: string,
    name: string,
    description?: string,
  ): Promise<Dashboard> {
    try {
      // Criar dashboard (usando cliente admin)
      const { data: dashboard, error: dashboardError } = await supabaseAdmin
        .from("dashboards")
        .insert([
          {
            name: name.trim(),
            description: description?.trim(),
            created_by: userId,
          },
        ])
        .select()
        .single();

      if (dashboardError) throw dashboardError;

      // Adicionar usuário como owner (usando cliente admin)
      const { error: relationError } = await supabaseAdmin
        .from("user_dashboards")
        .insert([
          {
            user_id: userId,
            dashboard_id: dashboard.id,
            role: "owner",
          },
        ]);

      if (relationError) throw relationError;

      return {
        ...dashboard,
        role: "owner",
        member_count: 1,
      };
    } catch (error) {
      console.error("Erro ao criar dashboard:", error);
      throw error;
    }
  }

  // Enviar convite para dashboard (apenas para usuários existentes)
  async sendDashboardInvitation(
    inviterId: string,
    dashboardId: string,
    inviteeEmail: string,
    message?: string,
  ): Promise<DashboardInvitation> {
    try {
      // Verificar se o usuário tem permissão para convidar
      const { data: permission, error: permissionError } = await supabaseAdmin
        .from("user_dashboards")
        .select("role")
        .eq("user_id", inviterId)
        .eq("dashboard_id", dashboardId)
        .single();

      console.log("Verificando permissão:", {
        inviterId,
        dashboardId,
        permission,
        permissionError,
      });

      if (!permission || !["owner", "admin"].includes(permission.role)) {
        console.log("Falha na permissão:", {
          permission: permission?.role,
          allowed: ["owner", "admin"],
        });
        throw new Error("Sem permissão para enviar convites");
      }

      // Buscar usuário destinatário - DEVE existir
      const { data: invitee } = await supabaseAdmin
        .from("users")
        .select("id, name")
        .eq("email", inviteeEmail.toLowerCase())
        .single();

      if (!invitee) {
        throw new Error(
          "Usuário não encontrado. Apenas usuários já cadastrados podem ser convidados.",
        );
      }

      // Verificar se já não está no dashboard
      const { data: existing } = await supabaseAdmin
        .from("user_dashboards")
        .select("id")
        .eq("user_id", invitee.id)
        .eq("dashboard_id", dashboardId)
        .single();

      if (existing) {
        throw new Error("Usuário já faz parte deste dashboard");
      }

      // Cancelar convites pendentes anteriores
      await supabaseAdmin
        .from("dashboard_invitations")
        .update({ status: "cancelled" })
        .eq("dashboard_id", dashboardId)
        .eq("invitee_email", inviteeEmail.toLowerCase())
        .eq("status", "pending");

      // Criar convite
      const { data: invitation, error } = await supabaseAdmin
        .from("dashboard_invitations")
        .insert([
          {
            dashboard_id: dashboardId,
            inviter_id: inviterId,
            invitee_email: inviteeEmail.toLowerCase(),
            invitee_id: invitee.id,
            message: message?.trim(),
          },
        ])
        .select(
          `
          id,
          dashboard_id,
          inviter_id,
          invitee_email,
          status,
          message,
          expires_at,
          created_at,
          dashboards (name),
          inviter:users!inviter_id (name)
        `,
        )
        .single();

      if (error) throw error;

      // Criar notificação interna para o usuário
      await this.createNotification(
        invitee.id,
        "dashboard_invite",
        "Novo Convite para Dashboard",
        `${
          invitation.inviter?.name || "Alguém"
        } convidou você para participar do dashboard "${
          invitation.dashboards?.name || "Dashboard"
        }".`,
        invitation.id,
      );

      // Enviar email de convite via Brevo
      try {
        await emailService.sendDashboardInvite(
          inviteeEmail,
          invitation.inviter?.name || "Usuário",
          invitation.dashboards?.name || "Dashboard",
          invitation.invite_token,
          message,
        );
        console.log(
          `📧 Email de convite enviado para ${inviteeEmail} via Brevo`,
        );
      } catch (emailError) {
        console.error("❌ Erro ao enviar email de convite:", emailError);
        // Não falha o convite se o email não foi enviado
      }

      console.log(
        `✅ Convite criado e notificação enviada para ${invitee.name} (${inviteeEmail})`,
      );

      return {
        id: invitation.id,
        dashboard_id: invitation.dashboard_id,
        dashboard_name: invitation.dashboards?.name || "Dashboard",
        inviter_id: invitation.inviter_id,
        inviter_name: invitation.inviter?.name || "Usuário",
        invitee_email: invitation.invitee_email,
        status: invitation.status,
        message: invitation.message,
        expires_at: invitation.expires_at,
        created_at: invitation.created_at,
      };
    } catch (error) {
      console.error("Erro ao enviar convite:", error);
      throw error;
    }
  }

  // Buscar convites recebidos pelo usuário
  async getUserInvitations(userId: string): Promise<DashboardInvitation[]> {
    try {
      const { data, error } = await supabase
        .from("dashboard_invitations")
        .select(
          `
          id,
          dashboard_id,
          inviter_id,
          invitee_email,
          status,
          message,
          expires_at,
          created_at,
          dashboards (name),
          inviter:users!inviter_id (name)
        `,
        )
        .eq("invitee_id", userId)
        .eq("status", "pending")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data.map((invitation: any) => ({
        id: invitation.id,
        dashboard_id: invitation.dashboard_id,
        dashboard_name: invitation.dashboards?.name || "Dashboard",
        inviter_id: invitation.inviter_id,
        inviter_name: invitation.inviter?.name || "Usuário",
        invitee_email: invitation.invitee_email,
        status: invitation.status,
        message: invitation.message,
        expires_at: invitation.expires_at,
        created_at: invitation.created_at,
      }));
    } catch (error) {
      console.error("Erro ao buscar convites:", error);
      throw error;
    }
  }

  // Responder a convite (aceitar/rejeitar)
  async respondToInvitation(
    userId: string,
    invitationId: string,
    accept: boolean,
  ): Promise<{ success: boolean; dashboardId?: string }> {
    try {
      console.log("🔍 Buscando convite:", { userId, invitationId, accept });

      if (accept) {
        // Primeiro, vamos ver todos os convites para debug
        const { data: allInvites } = await supabaseAdmin
          .from("dashboard_invitations")
          .select("id, invitee_id, status, invitee_email")
          .eq("id", invitationId);

        console.log("📋 Convite encontrado pelo ID:", allInvites);

        // Buscar detalhes do convite
        const { data: invitation, error: inviteError } = await supabaseAdmin
          .from("dashboard_invitations")
          .select("dashboard_id, invitee_id")
          .eq("id", invitationId)
          .eq("invitee_id", userId)
          .eq("status", "pending")
          .single();

        console.log("🎯 Resultado da busca do convite:", {
          invitation,
          inviteError,
        });

        if (inviteError || !invitation) {
          throw new Error("Convite não encontrado ou já utilizado");
        }

        // Adicionar usuário ao dashboard
        const { error: userDashboardError } = await supabaseAdmin
          .from("user_dashboards")
          .insert({
            user_id: userId,
            dashboard_id: invitation.dashboard_id,
            role: "member",
            joined_at: new Date().toISOString(),
          });

        if (userDashboardError) {
          console.log(
            "❌ Erro ao adicionar usuário ao dashboard:",
            userDashboardError,
          );
          throw userDashboardError;
        }

        // Atualizar status do convite para 'accepted'
        const { error: updateError } = await supabaseAdmin
          .from("dashboard_invitations")
          .update({
            status: "accepted",
            updated_at: new Date().toISOString(),
          })
          .eq("id", invitationId);

        if (updateError) {
          console.log("❌ Erro ao atualizar status do convite:", updateError);
          throw updateError;
        }

        console.log(
          "✅ Usuário adicionado ao dashboard e convite marcado como aceito",
        );
        return { success: true, dashboardId: invitation.dashboard_id };
      } else {
        // Rejeitar convite
        const { error: rejectError } = await supabaseAdmin
          .from("dashboard_invitations")
          .update({ status: "rejected", updated_at: new Date().toISOString() })
          .eq("id", invitationId)
          .eq("invitee_id", userId)
          .eq("status", "pending");

        if (rejectError) throw rejectError;
        return { success: true };
      }
    } catch (error) {
      console.error("Erro ao responder convite:", error);
      throw error;
    }
  }

  // Sair de dashboard compartilhado
  async leaveDashboard(userId: string, dashboardId: string): Promise<boolean> {
    try {
      console.log("🚪 Backend: Iniciando processo de saída do dashboard:", {
        userId,
        dashboardId,
      });

      // Verificar se não é o owner (usando admin client)
      const { data: relation, error: relationError } = await supabaseAdmin
        .from("user_dashboards")
        .select("role")
        .eq("user_id", userId)
        .eq("dashboard_id", dashboardId)
        .single();

      console.log("🔍 Backend: Verificação de relação:", {
        relation,
        error: relationError,
      });

      if (relationError || !relation) {
        console.log("❌ Backend: Usuário não faz parte do dashboard");
        throw new Error("Você não faz parte deste dashboard");
      }

      if (relation.role === "owner") {
        console.log("❌ Backend: Tentativa de sair do próprio dashboard");
        throw new Error("O proprietário não pode sair do dashboard");
      }

      console.log("✅ Backend: Verificações OK, removendo relação...");

      // Remover relação (usando admin client para ter permissão)
      const { error: deleteError } = await supabaseAdmin
        .from("user_dashboards")
        .delete()
        .eq("user_id", userId)
        .eq("dashboard_id", dashboardId);

      if (deleteError) {
        console.log("❌ Backend: Erro ao deletar relação:", deleteError);
        throw deleteError;
      }

      console.log("✅ Backend: Saída do dashboard concluída com sucesso");
      return true;
    } catch (error) {
      console.error("❌ Backend: Erro ao sair do dashboard:", error);
      throw error;
    }
  }

  // Criar notificação
  async createNotification(
    userId: string,
    type: "dashboard_invite" | "dashboard_update" | "system",
    title: string,
    message: string,
    relatedId?: string,
  ): Promise<void> {
    try {
      console.log("📝 Criando notificação:", {
        userId,
        type,
        title,
        message,
        relatedId,
      });

      const { data, error } = await supabaseAdmin
        .from("notifications")
        .insert([
          {
            user_id: userId,
            type,
            title,
            message,
            related_id: relatedId,
            is_read: false,
          },
        ])
        .select();

      console.log("📝 Resultado da criação:", { data, error });

      if (error) throw error;
    } catch (error) {
      console.error("Erro ao criar notificação:", error);
      throw error;
    }
  }
}

export const authService = new AuthService();
