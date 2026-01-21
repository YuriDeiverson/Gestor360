import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { supabaseAdmin } from "./supabase";
import authRoutes from "./routes/auth";
import { authMiddleware, AuthenticatedRequest } from "./middleware";
import budgetsRoutes from "./routes/budgets";
import transacoesRoutes from "./routes/transacoes";
import metasRoutes from "./routes/metas";
import cardsRoutes from "./routes/cards";

// ====================
// ENV
// ====================
dotenv.config();
dotenv.config({ path: ".env.local", override: false });

const app = express();

// ====================
// CORS (VERSÃO ESTÁVEL PRA VERCEL)
// ====================
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://financeiroplus.vercel.app",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ✅ PRE-FLIGHT GARANTIDO (OBRIGATÓRIO NA VERCEL)
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

// ====================
// MIDDLEWARES
// ====================
app.use(express.json());

// Log simples (debug)
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// ====================
// HEALTH
// ====================
app.get("/", (_req, res) => {
  res.json({
    message: "Dashboard Financeiro API",
    status: "online",
    version: "1.0.0",
  });
});

app.get("/health", (_req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// ====================
// AUTH
// ====================
app.use("/api/auth", authRoutes);
app.use("/auth", authRoutes);

// ====================
// CONVITES
// ====================
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

    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", invitation.email)
      .single();

    res.json({
      invitation,
      needsAccount: !existingUser,
    });
  } catch (err) {
    console.error("Erro ao buscar convite:", err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

app.post("/api/invite/:token/accept", async (req, res) => {
  try {
    const { token } = req.params;
    const { name, password } = req.body;

    const { data: invitation } = await supabaseAdmin
      .from("dashboard_invitations")
      .select("*")
      .eq("invite_token", token)
      .eq("status", "pending")
      .single();

    if (!invitation) {
      return res.status(404).json({ error: "Convite inválido" });
    }

    let { data: user } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("email", invitation.email)
      .single();

    if (!user && name && password) {
      const { authService } = await import("./auth");
      const result = await authService.register(
        invitation.email,
        password,
        name,
      );
      user = result.user;
    }

    if (!user) {
      return res.status(400).json({ error: "Usuário não encontrado" });
    }

    const { authService } = await import("./auth");
    await authService.respondToInvitation(user.id, invitation.id, true);

    res.json({ ok: true });
  } catch (err) {
    console.error("Erro ao aceitar convite:", err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// ====================
// ROTAS DE DOMÍNIO
// ====================
app.use("/api/budgets", budgetsRoutes);
app.use("/api/transacoes", transacoesRoutes);
app.use("/api/metas", metasRoutes);
app.use("/api/cards", cardsRoutes);

// ====================
// NOTIFICAÇÕES
// ====================
app.get(
  "/api/notifications",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    const { data, error } = await supabaseAdmin
      .from("notifications")
      .select("*")
      .eq("user_id", req.user!.userId)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error });
    }

    res.json(data);
  },
);

// ====================
// 404
// ====================
app.use((req, res) => {
  res.status(404).json({
    error: "Rota não encontrada",
    method: req.method,
    path: req.originalUrl,
  });
});

// ====================
// EXPORT (Vercel)
// ====================
export default app;
