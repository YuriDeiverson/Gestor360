import express from "express";
import { authService } from "../auth.js";
import { authMiddleware, AuthenticatedRequest } from "../middleware.js";

const router = express.Router();

// Registrar novo usuário
router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validação
    if (!email || !password || !name) {
      return res.status(400).json({
        error: "Email, senha e nome são obrigatórios",
        code: "MISSING_FIELDS",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "A senha deve ter pelo menos 6 caracteres",
        code: "PASSWORD_TOO_SHORT",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: "Email inválido",
        code: "INVALID_EMAIL",
      });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({
        error: "Nome deve ter pelo menos 2 caracteres",
        code: "NAME_TOO_SHORT",
      });
    }

    const result = await authService.register(email, password, name);

    res.status(201).json({
      message: "Usuário criado com sucesso",
      data: result,
    });
  } catch (error) {
    console.error("Erro no registro:", error);

    if (error instanceof Error) {
      if (error.message === "Email já está em uso") {
        return res.status(409).json({
          error: error.message,
          code: "EMAIL_EXISTS",
        });
      }
    }

    res.status(500).json({
      error: "Erro interno do servidor",
      code: "INTERNAL_ERROR",
    });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validação
    if (!email || !password) {
      return res.status(400).json({
        error: "Email e senha são obrigatórios",
        code: "MISSING_FIELDS",
      });
    }

    const result = await authService.login(email, password);

    res.json({
      message: "Login realizado com sucesso",
      data: result,
    });
  } catch (error) {
    console.error("Erro no login:", error);

    if (error instanceof Error) {
      if (error.message === "Email ou senha incorretos") {
        return res.status(401).json({
          error: error.message,
          code: "INVALID_CREDENTIALS",
        });
      }
    }

    res.status(500).json({
      error: "Erro interno do servidor",
      code: "INTERNAL_ERROR",
    });
  }
});

// Verificar token / Buscar dados do usuário atual
router.get("/me", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { data: user, error } = await (
      await import("../supabase.js")
    ).supabaseAdmin
      .from("users")
      .select("id, email, name, avatar_url, created_at")
      .eq("id", req.user!.userId)
      .single();

    if (error || !user) {
      return res.status(404).json({
        error: "Usuário não encontrado",
        code: "USER_NOT_FOUND",
      });
    }

    res.json({
      message: "Dados do usuário",
      data: { user },
    });
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
      code: "INTERNAL_ERROR",
    });
  }
});

// Buscar dashboards do usuário
router.get(
  "/dashboards",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    try {
      const dashboards = await authService.getUserDashboards(req.user!.userId);

      res.json({
        message: "Dashboards do usuário",
        data: dashboards,
      });
    } catch (error) {
      console.error("Erro ao buscar dashboards:", error);
      res.status(500).json({
        error: "Erro interno do servidor",
        code: "INTERNAL_ERROR",
      });
    }
  },
);

// Criar novo dashboard
router.post(
  "/dashboards",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { name, description } = req.body;

      if (!name || name.trim().length < 2) {
        return res.status(400).json({
          error: "Nome do dashboard deve ter pelo menos 2 caracteres",
          code: "INVALID_NAME",
        });
      }

      const dashboard = await authService.createDashboard(
        req.user!.userId,
        name,
        description,
      );

      res.status(201).json({
        message: "Dashboard criado com sucesso",
        data: dashboard,
      });
    } catch (error) {
      console.error("Erro ao criar dashboard:", error);
      res.status(500).json({
        error: "Erro interno do servidor",
        code: "INTERNAL_ERROR",
      });
    }
  },
);

// Enviar convite para dashboard
router.post(
  "/dashboards/:dashboardId/invitations",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { dashboardId } = req.params;
      const { email, message } = req.body;

      console.log("Dados do convite:", {
        userId: req.user!.userId,
        dashboardId,
        email,
        message,
      });

      if (!email) {
        return res.status(400).json({
          error: "Email é obrigatório",
          code: "MISSING_EMAIL",
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          error: "Email inválido",
          code: "INVALID_EMAIL",
        });
      }

      const invitation = await authService.sendDashboardInvitation(
        req.user!.userId,
        dashboardId,
        email,
        message,
      );

      res.status(201).json({
        message: "Convite enviado com sucesso",
        data: invitation,
      });
    } catch (error) {
      console.error("Erro ao enviar convite:", error);

      if (error instanceof Error) {
        if (
          error.message.includes("permissão") ||
          error.message.includes("encontrado") ||
          error.message.includes("já faz parte")
        ) {
          return res.status(400).json({
            error: error.message,
            code: "INVITATION_ERROR",
          });
        }
      }

      res.status(500).json({
        error: "Erro interno do servidor",
        code: "INTERNAL_ERROR",
      });
    }
  },
);

// Buscar convites recebidos
router.get(
  "/invitations",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    try {
      const invitations = await authService.getUserInvitations(
        req.user!.userId,
      );

      res.json({
        message: "Convites recebidos",
        data: invitations,
      });
    } catch (error) {
      console.error("Erro ao buscar convites:", error);
      res.status(500).json({
        error: "Erro interno do servidor",
        code: "INTERNAL_ERROR",
      });
    }
  },
);

// Responder a convite (aceitar/rejeitar)
router.patch(
  "/invitations/:invitationId",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { invitationId } = req.params;
      const { accept } = req.body;

      if (typeof accept !== "boolean") {
        return res.status(400).json({
          error: 'Campo "accept" deve ser true ou false',
          code: "INVALID_RESPONSE",
        });
      }

      const result = await authService.respondToInvitation(
        req.user!.userId,
        invitationId,
        accept,
      );

      res.json({
        message: accept ? "Convite aceito com sucesso" : "Convite rejeitado",
        data: result,
      });
    } catch (error) {
      console.error("❌ Erro ao responder convite:", error);
      console.error(
        "❌ Stack trace:",
        error instanceof Error ? error.stack : "N/A",
      );
      console.error("❌ Detalhes do erro:", {
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : "Unknown",
      });
      res.status(500).json({
        error: "Erro interno do servidor",
        code: "INTERNAL_ERROR",
      });
    }
  },
);

// Sair de dashboard compartilhado
router.delete(
  "/dashboards/:dashboardId/leave",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { dashboardId } = req.params;

      const success = await authService.leaveDashboard(
        req.user!.userId,
        dashboardId,
      );

      res.json({
        message: "Você saiu do dashboard com sucesso",
        data: { success },
      });
    } catch (error) {
      console.error("Erro ao sair do dashboard:", error);

      if (error instanceof Error) {
        if (
          error.message.includes("não faz parte") ||
          error.message.includes("proprietário")
        ) {
          return res.status(400).json({
            error: error.message,
            code: "LEAVE_ERROR",
          });
        }
      }

      res.status(500).json({
        error: "Erro interno do servidor",
        code: "INTERNAL_ERROR",
      });
    }
  },
);

export default router;
