import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { supabase, supabaseAdmin } from "./supabase.js";
import authRoutes from "./routes/auth.js";
import { authMiddleware, AuthenticatedRequest } from "./middleware.js";

dotenv.config();

const app = express();
app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
  }),
);
app.use(express.json());

// ====================
// Rotas de Autenticação
// ====================
app.use("/api/auth", authRoutes);

// ====================
// Endpoints de Convites por Token
// ====================

// Buscar informações do convite por token
app.get("/api/invite/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const { data: invitation, error } = await supabaseAdmin
      .from("dashboard_invitations")
      .select(
        `
        id,
        invite_token,
        email,
        message,
        status,
        created_at,
        dashboards:dashboard_id (
          id,
          name,
          description
        ),
        inviter:inviter_id (
          id,
          name,
          email
        )
      `,
      )
      .eq("invite_token", token)
      .eq("status", "pending")
      .single();

    if (error || !invitation) {
      return res
        .status(404)
        .json({ error: "Convite não encontrado ou já utilizado" });
    }

    // Verificar se o usuário já existe
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id, name")
      .eq("email", invitation.email)
      .single();

    res.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        message: invitation.message,
        dashboard: invitation.dashboards,
        inviter: invitation.inviter,
        created_at: invitation.created_at,
      },
      needsAccount: !existingUser,
    });
  } catch (error) {
    console.error("Erro ao buscar convite:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Aceitar convite por token
app.post("/api/invite/:token/accept", async (req, res) => {
  try {
    const { token } = req.params;
    const { name, password } = req.body;

    // Buscar convite
    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from("dashboard_invitations")
      .select(
        `
        id,
        email,
        dashboard_id,
        inviter_id
      `,
      )
      .eq("invite_token", token)
      .eq("status", "pending")
      .single();

    if (inviteError || !invitation) {
      return res
        .status(404)
        .json({ error: "Convite não encontrado ou já utilizado" });
    }

    // Verificar se o usuário já existe
    let { data: user } = await supabaseAdmin
      .from("users")
      .select("id, name, email")
      .eq("email", invitation.email)
      .single();

    // Se o usuário não existe, criar
    if (!user && name && password) {
      const authService = (await import("./auth.js")).AuthService;
      const authServiceInstance = new authService();

      const result = await authServiceInstance.register(
        invitation.email,
        password,
        name,
      );
      user = result.user;
    } else if (!user) {
      return res.status(400).json({
        error: "Usuário não encontrado. Dados de registro são obrigatórios.",
      });
    }

    // Aceitar o convite
    const authService = (await import("./auth.js")).AuthService;
    const authServiceInstance = new authService();

    const success = await authServiceInstance.respondToInvitation(
      user.id,
      invitation.id,
      true,
    );

    if (!success) {
      return res.status(400).json({ error: "Erro ao aceitar convite" });
    }

    // Gerar token de acesso
    const accessToken = authServiceInstance.generateAccessToken(
      user.id,
      user.email,
    );

    res.json({
      message: "Convite aceito com sucesso",
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Erro ao aceitar convite:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// ====================
// Transações (Multi-usuário)
// ====================
app.get(
  "/transacoes",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { dashboard_id } = req.query;

      if (!dashboard_id) {
        return res.status(400).json({ error: "dashboard_id é obrigatório" });
      }

      // Verificar se o usuário tem acesso ao dashboard
      const { data: access } = await supabaseAdmin
        .from("user_dashboards")
        .select("role")
        .eq("user_id", req.user!.userId)
        .eq("dashboard_id", dashboard_id)
        .single();

      if (!access) {
        return res.status(403).json({ error: "Acesso negado ao dashboard" });
      }

      const { data, error } = await supabaseAdmin
        .from("transacoes")
        .select("*")
        .eq("dashboard_id", dashboard_id)
        .order("data", { ascending: false });

      if (error) throw error;

      console.log(
        `📋 GET Transações - Dashboard: ${dashboard_id}, Total: ${data.length}`,
      );

      const transacoes = data.map((t) => ({ ...t, _id: t.id }));
      res.json({ transacoes });
    } catch (error) {
      console.error("Erro ao buscar transações:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  },
);

app.post(
  "/transacoes",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { dashboard_id, ...transactionData } = req.body;

      console.log("📝 Criando transação:", {
        userId: req.user!.userId,
        dashboard_id,
        transactionData,
      });

      if (!dashboard_id) {
        return res.status(400).json({ error: "dashboard_id é obrigatório" });
      }

      // Verificar se o usuário tem acesso ao dashboard
      const { data: access, error: accessError } = await supabaseAdmin
        .from("user_dashboards")
        .select("role")
        .eq("user_id", req.user!.userId)
        .eq("dashboard_id", dashboard_id)
        .single();

      console.log("🔍 Verificação de acesso:", {
        userId: req.user!.userId,
        dashboard_id,
        access,
        accessError,
      });

      if (!access) {
        return res.status(403).json({ error: "Acesso negado ao dashboard" });
      }

      const dataToInsert = {
        ...transactionData,
        dashboard_id,
        created_by: req.user!.userId,
      };

      console.log("📤 Dados para inserir:", dataToInsert);

      const { data, error } = await supabaseAdmin
        .from("transacoes")
        .insert([dataToInsert])
        .select()
        .single();

      console.log("✅ Resultado da inserção:", { data, error });

      if (error) throw error;

      const transacao = { ...data, _id: data.id };
      console.log("🎉 Transação criada com sucesso:", transacao);
      res.json(transacao);
    } catch (error) {
      console.error("Erro ao criar transação:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  },
);

app.put(
  "/transacoes/:id",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { dashboard_id, ...transactionData } = req.body;

      if (!dashboard_id) {
        return res.status(400).json({ error: "dashboard_id é obrigatório" });
      }

      // Verificar se o usuário tem acesso ao dashboard
      const { data: access } = await supabaseAdmin
        .from("user_dashboards")
        .select("role")
        .eq("user_id", req.user!.userId)
        .eq("dashboard_id", dashboard_id)
        .single();

      if (!access) {
        return res.status(403).json({ error: "Acesso negado ao dashboard" });
      }

      // Verificar se a transação pertence ao dashboard
      const { data: existingTransaction } = await supabaseAdmin
        .from("transacoes")
        .select("dashboard_id")
        .eq("id", req.params.id)
        .single();

      if (
        !existingTransaction ||
        existingTransaction.dashboard_id !== dashboard_id
      ) {
        return res.status(404).json({ error: "Transação não encontrada" });
      }

      const { data, error } = await supabaseAdmin
        .from("transacoes")
        .update({ ...transactionData, updated_by: req.user!.userId })
        .eq("id", req.params.id)
        .select()
        .single();

      if (error) throw error;

      const transacao = { ...data, _id: data.id };
      res.json(transacao);
    } catch (error) {
      console.error("Erro ao atualizar transação:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  },
);

app.delete(
  "/transacoes/:id",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { dashboard_id } = req.query;

      if (!dashboard_id) {
        return res.status(400).json({ error: "dashboard_id é obrigatório" });
      }

      // Verificar se o usuário tem acesso ao dashboard
      const { data: access } = await supabaseAdmin
        .from("user_dashboards")
        .select("role")
        .eq("user_id", req.user!.userId)
        .eq("dashboard_id", dashboard_id)
        .single();

      if (!access) {
        return res.status(403).json({ error: "Acesso negado ao dashboard" });
      }

      // Verificar se a transação pertence ao dashboard
      const { data: existingTransaction } = await supabaseAdmin
        .from("transacoes")
        .select("dashboard_id")
        .eq("id", req.params.id)
        .single();

      if (
        !existingTransaction ||
        existingTransaction.dashboard_id !== dashboard_id
      ) {
        return res.status(404).json({ error: "Transação não encontrada" });
      }

      const { error } = await supabaseAdmin
        .from("transacoes")
        .delete()
        .eq("id", req.params.id);

      if (error) throw error;

      res.json({ ok: true });
    } catch (error) {
      console.error("Erro ao deletar transação:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  },
);

// Pagar parcela de uma transação
app.post(
  "/transacoes/:id/pay-installment",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { dashboard_id } = req.body;

      if (!dashboard_id) {
        return res.status(400).json({ error: "dashboard_id é obrigatório" });
      }

      // Verificar se o usuário tem acesso ao dashboard
      const { data: access } = await supabaseAdmin
        .from("user_dashboards")
        .select("role")
        .eq("user_id", req.user!.userId)
        .eq("dashboard_id", dashboard_id)
        .single();

      if (!access) {
        return res.status(403).json({ error: "Acesso negado ao dashboard" });
      }

      // Buscar a transação com todas as informações de parcelamento
      const { data: transaction, error: fetchError } = await supabaseAdmin
        .from("transacoes")
        .select("*")
        .eq("id", req.params.id)
        .eq("dashboard_id", dashboard_id)
        .single();

      if (fetchError || !transaction) {
        return res.status(404).json({ error: "Transação não encontrada" });
      }

      // Verificar se é uma transação parcelada
      if (!transaction.installments || transaction.installments <= 1) {
        return res
          .status(400)
          .json({ error: "Esta transação não é parcelada" });
      }

      // Verificar se já foi totalmente paga
      if (transaction.currentinstallment >= transaction.installments) {
        return res
          .status(400)
          .json({ error: "Todas as parcelas já foram pagas" });
      }

      // Calcular próxima parcela
      const nextInstallment = transaction.currentinstallment + 1;
      const isLastInstallment = nextInstallment >= transaction.installments;

      // Calcular nova data de pagamento (próximo mês)
      const currentNextPayment = new Date(transaction.nextpaymentdate);
      currentNextPayment.setMonth(currentNextPayment.getMonth() + 1);

      // Calcular valor restante
      const installmentValue =
        transaction.totalamount / transaction.installments;
      const newRemainingAmount = Math.max(
        0,
        transaction.remainingamount - installmentValue,
      );

      // Atualizar a transação
      const { data: updatedTransaction, error: updateError } =
        await supabaseAdmin
          .from("transacoes")
          .update({
            currentinstallment: nextInstallment,
            nextpaymentdate: isLastInstallment
              ? null
              : currentNextPayment.toISOString().split("T")[0],
            remainingamount: newRemainingAmount,
            status: isLastInstallment ? "completed" : "pending",
            updated_by: req.user!.userId,
          })
          .eq("id", req.params.id)
          .select()
          .single();

      if (updateError) throw updateError;

      console.log("💰 Parcela paga com sucesso:", {
        transaction_id: req.params.id,
        installment: `${nextInstallment}/${transaction.installments}`,
        remaining: newRemainingAmount,
        status: isLastInstallment ? "completed" : "pending",
      });

      const transacao = { ...updatedTransaction, _id: updatedTransaction.id };
      res.json(transacao);
    } catch (error) {
      console.error("Erro ao pagar parcela:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  },
);

// ====================
// Metas (Multi-usuário)
// ====================
app.get("/metas", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { dashboard_id } = req.query;

    if (!dashboard_id) {
      return res.status(400).json({ error: "dashboard_id é obrigatório" });
    }

    // Verificar se o usuário tem acesso ao dashboard
    const { data: access } = await supabaseAdmin
      .from("user_dashboards")
      .select("role")
      .eq("user_id", req.user!.userId)
      .eq("dashboard_id", dashboard_id)
      .single();

    if (!access) {
      return res.status(403).json({ error: "Acesso negado ao dashboard" });
    }

    const { data, error } = await supabaseAdmin
      .from("metas")
      .select("*")
      .eq("dashboard_id", dashboard_id)
      .order("criado_em", { ascending: false });

    if (error) throw error;

    const metas = data.map((m) => ({ ...m, _id: m.id }));
    res.json({ metas });
  } catch (error) {
    console.error("Erro ao buscar metas:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

app.post("/metas", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { dashboard_id, ...metaData } = req.body;

    if (!dashboard_id) {
      return res.status(400).json({ error: "dashboard_id é obrigatório" });
    }

    // Verificar se o usuário tem acesso ao dashboard
    const { data: access } = await supabaseAdmin
      .from("user_dashboards")
      .select("role")
      .eq("user_id", req.user!.userId)
      .eq("dashboard_id", dashboard_id)
      .single();

    if (!access) {
      return res.status(403).json({ error: "Acesso negado ao dashboard" });
    }

    const { data, error } = await supabaseAdmin
      .from("metas")
      .insert([{ ...metaData, dashboard_id, created_by: req.user!.userId }])
      .select()
      .single();

    if (error) throw error;

    const meta = { ...data, _id: data.id };
    res.json(meta);
  } catch (error) {
    console.error("Erro ao criar meta:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

app.put(
  "/metas/:id",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { data, error } = await supabaseAdmin
        .from("metas")
        .update({ ...req.body, updated_by: req.user!.userId })
        .eq("id", req.params.id)
        .select()
        .single();

      if (error) throw error;

      if (!data) {
        return res.status(404).json({ error: "Meta não encontrada" });
      }

      const meta = { ...data, _id: data.id };
      res.json(meta);
    } catch (error) {
      console.error("Erro ao atualizar meta:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  },
);

app.delete(
  "/metas/:id",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { error } = await supabaseAdmin
        .from("metas")
        .delete()
        .eq("id", req.params.id);

      if (error) throw error;

      res.json({ ok: true });
    } catch (error) {
      console.error("Erro ao deletar meta:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  },
);

// ====================
// Orçamentos
// ====================
app.get(
  "/orcamentos",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { dashboard_id } = req.query;

      if (!dashboard_id) {
        return res.status(400).json({ error: "dashboard_id é obrigatório" });
      }

      // Verificar se o usuário tem acesso ao dashboard
      const { data: access } = await supabaseAdmin
        .from("user_dashboards")
        .select("role")
        .eq("user_id", req.user!.userId)
        .eq("dashboard_id", dashboard_id)
        .single();

      if (!access) {
        return res.status(403).json({ error: "Acesso negado ao dashboard" });
      }

      const { data, error } = await supabaseAdmin
        .from("orcamentos")
        .select("*")
        .eq("dashboard_id", dashboard_id)
        .order("categoria", { ascending: true });

      if (error) throw error;

      const orcamentos = data.map((o) => ({ ...o, _id: o.id }));
      res.json({ orcamentos });
    } catch (error) {
      console.error("Erro ao buscar orçamentos:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  },
);

app.post(
  "/orcamentos",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { dashboard_id, ...orcamentoData } = req.body;

      if (!dashboard_id) {
        return res.status(400).json({ error: "dashboard_id é obrigatório" });
      }

      // Verificar se o usuário tem acesso ao dashboard
      const { data: access } = await supabaseAdmin
        .from("user_dashboards")
        .select("role")
        .eq("user_id", req.user!.userId)
        .eq("dashboard_id", dashboard_id)
        .single();

      if (!access) {
        return res.status(403).json({ error: "Acesso negado ao dashboard" });
      }

      const { data, error } = await supabaseAdmin
        .from("orcamentos")
        .insert([
          { ...orcamentoData, dashboard_id, created_by: req.user!.userId },
        ])
        .select()
        .single();

      if (error) throw error;

      const orcamento = { ...data, _id: data.id };
      res.json(orcamento);
    } catch (error) {
      console.error("Erro ao criar orçamento:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  },
);

app.put(
  "/orcamentos/:id",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { data, error } = await supabaseAdmin
        .from("orcamentos")
        .update({ ...req.body, updated_by: req.user!.userId })
        .eq("id", req.params.id)
        .select()
        .single();

      if (error) throw error;

      if (!data) {
        return res.status(404).json({ error: "Orçamento não encontrado" });
      }

      const orcamento = { ...data, _id: data.id };
      res.json(orcamento);
    } catch (error) {
      console.error("Erro ao atualizar orçamento:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  },
);

app.delete(
  "/orcamentos/:id",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { error } = await supabaseAdmin
        .from("orcamentos")
        .delete()
        .eq("id", req.params.id);

      if (error) throw error;

      res.json({ ok: true });
    } catch (error) {
      console.error("Erro ao deletar orçamento:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  },
);

// ====================
// Categorias
// ====================
app.get(
  "/categorias",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { dashboard_id } = req.query;

      if (!dashboard_id) {
        return res.status(400).json({ error: "dashboard_id é obrigatório" });
      }

      // Verificar se o usuário tem acesso ao dashboard
      const { data: access } = await supabaseAdmin
        .from("user_dashboards")
        .select("role")
        .eq("user_id", req.user!.userId)
        .eq("dashboard_id", dashboard_id)
        .single();

      if (!access) {
        return res.status(403).json({ error: "Acesso negado ao dashboard" });
      }

      const { data, error } = await supabaseAdmin
        .from("categorias")
        .select("*")
        .eq("dashboard_id", dashboard_id)
        .order("nome", { ascending: true });

      if (error) throw error;

      const categorias = data.map((c) => ({ ...c, _id: c.id }));
      res.json({ categorias });
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  },
);

app.post(
  "/categorias",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { dashboard_id, ...categoriaData } = req.body;

      if (!dashboard_id) {
        return res.status(400).json({ error: "dashboard_id é obrigatório" });
      }

      // Verificar se o usuário tem acesso ao dashboard
      const { data: access } = await supabaseAdmin
        .from("user_dashboards")
        .select("role")
        .eq("user_id", req.user!.userId)
        .eq("dashboard_id", dashboard_id)
        .single();

      if (!access) {
        return res.status(403).json({ error: "Acesso negado ao dashboard" });
      }

      const { data, error } = await supabaseAdmin
        .from("categorias")
        .insert([
          { ...categoriaData, dashboard_id, created_by: req.user!.userId },
        ])
        .select()
        .single();

      if (error) throw error;

      const categoria = { ...data, _id: data.id };
      res.json(categoria);
    } catch (error) {
      console.error("Erro ao criar categoria:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  },
);

app.put(
  "/categorias/:id",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { data, error } = await supabaseAdmin
        .from("categorias")
        .update({ ...req.body, updated_by: req.user!.userId })
        .eq("id", req.params.id)
        .select()
        .single();

      if (error) throw error;

      if (!data) {
        return res.status(404).json({ error: "Categoria não encontrada" });
      }

      const categoria = { ...data, _id: data.id };
      res.json(categoria);
    } catch (error) {
      console.error("Erro ao atualizar categoria:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  },
);

app.delete(
  "/categorias/:id",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { error } = await supabaseAdmin
        .from("categorias")
        .delete()
        .eq("id", req.params.id);

      if (error) throw error;

      res.json({ ok: true });
    } catch (error) {
      console.error("Erro ao deletar categoria:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  },
);

// ====================
// Notificações
// ====================

// Buscar notificações do usuário
app.get(
  "/api/notifications",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    try {
      console.log("🔔 Buscando notificações para usuário:", req.user!.userId);
      console.log("👤 Dados do usuário logado:", req.user);

      // Buscar notificações diretamente primeiro para debug
      const { data: allNotifications, error: debugError } = await supabaseAdmin
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });

      console.log(
        "🗃️ Todas as notificações no banco:",
        allNotifications?.length || 0,
      );
      console.log(
        "🎯 Notificações para o usuário sasasa (be02f621-cc94-4410-a188-bac083932736):",
        allNotifications?.filter(
          (n) => n.user_id === "be02f621-cc94-4410-a188-bac083932736",
        ).length || 0,
      );

      const { data, error } = await supabaseAdmin
        .from("notifications")
        .select("*")
        .eq("user_id", req.user!.userId)
        .order("created_at", { ascending: false });

      console.log("📊 Resultado notificações:", {
        data,
        error,
        count: data?.length,
      });

      if (error) throw error;

      res.json(data || []);
    } catch (error) {
      console.error("Erro ao buscar notificações:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  },
);

// Contar notificações não lidas (deve vir ANTES dos endpoints com :id)
app.get(
  "/api/notifications/unread-count",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { count, error } = await supabaseAdmin
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", req.user!.userId)
        .eq("is_read", false);

      if (error) throw error;

      res.json({ count: count || 0 });
    } catch (error) {
      console.error("Erro ao contar notificações não lidas:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  },
);

// Marcar todas as notificações como lidas (deve vir ANTES do endpoint com :id)
app.patch(
  "/api/notifications/read-all",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { error } = await supabaseAdmin
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("user_id", req.user!.userId)
        .eq("is_read", false);

      if (error) throw error;

      res.json({ ok: true });
    } catch (error) {
      console.error("Erro ao marcar todas as notificações como lidas:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  },
);

// Deletar todas as notificações lidas (deve vir ANTES do endpoint com :id)
app.delete(
  "/api/notifications/delete-read",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    try {
      console.log(
        "🧹 Deletando notificações lidas para usuário:",
        req.user!.userId,
      );

      const { error } = await supabaseAdmin
        .from("notifications")
        .delete()
        .eq("user_id", req.user!.userId)
        .eq("is_read", true);

      if (error) throw error;

      console.log("✅ Notificações lidas deletadas com sucesso");
      res.json({ ok: true });
    } catch (error) {
      console.error("Erro ao deletar notificações lidas:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  },
);

// Deletar todas as notificações (deve vir ANTES do endpoint com :id)
app.delete(
  "/api/notifications/clear-all",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    try {
      console.log(
        "🧹 Deletando todas as notificações para usuário:",
        req.user!.userId,
      );

      const { error } = await supabaseAdmin
        .from("notifications")
        .delete()
        .eq("user_id", req.user!.userId);

      if (error) throw error;

      console.log("✅ Todas as notificações deletadas com sucesso");
      res.json({ ok: true });
    } catch (error) {
      console.error("Erro ao deletar todas as notificações:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  },
);

// Marcar notificação como lida (deve vir DEPOIS do endpoint específico)
app.patch(
  "/api/notifications/:id/read",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { error } = await supabaseAdmin
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", req.params.id)
        .eq("user_id", req.user!.userId);

      if (error) throw error;

      res.json({ ok: true });
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  },
);

// Deletar uma notificação específica (deve vir DEPOIS dos endpoints específicos)
app.delete(
  "/api/notifications/:id",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    try {
      console.log(
        "🗑️ Deletando notificação:",
        req.params.id,
        "para usuário:",
        req.user!.userId,
      );

      const { error } = await supabaseAdmin
        .from("notifications")
        .delete()
        .eq("id", req.params.id)
        .eq("user_id", req.user!.userId);

      if (error) throw error;

      console.log("✅ Notificação deletada com sucesso");
      res.json({ ok: true });
    } catch (error) {
      console.error("Erro ao deletar notificação:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  },
);

// ====================
// Rodar servidor
// ====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
  console.log("Conectado ao Supabase");
});
