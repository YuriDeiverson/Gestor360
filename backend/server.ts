import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { supabaseAdmin } from "./supabase.js";
import authRoutes from "./routes/auth.js";
import { authMiddleware, AuthenticatedRequest } from "./middleware.js";
import budgetsRoutes from "./routes/budgets.js";
import transacoesRoutes from "./routes/transacoes.js";
import metasRoutes from "./routes/metas.js";
import cardsRoutes from "./routes/cards.js";

// Carrega .env (configurações gerais)
dotenv.config();
// Depois carrega .env.local (sobrescreve para desenvolvimento local se existir)
dotenv.config({ path: ".env.local", override: false });

const app = express();

// ====================
// CORS
// ====================
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://financeiroplus.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 200,
  }),
);

app.use(express.json());

// ====================
// Debug middleware
// ====================
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  
  // Adicionar headers CORS manualmente se necessário
  res.header("Access-Control-Allow-Origin", allowedOrigins.includes(req.headers.origin) ? req.headers.origin : allowedOrigins[0]);
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  
  next();
});

// ====================
// Health
// ====================
app.get("/", (_req, res) => {
  res.json({
    message: "Dashboard Financeiro API",
    status: "online",
    version: "1.0.0",
  });
});

app.get("/health", (_req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// ====================
// Auth
// ====================
app.use("/api/auth", authRoutes);
app.use("/auth", authRoutes);

// ====================
// Convites
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
  } catch (error) {
    console.error("Erro ao buscar convite:", error);
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
      const { authService } = await import("./auth.js");
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

    const { authService } = await import("./auth.js");
    await authService.respondToInvitation(user.id, invitation.id, true);

    res.json({ ok: true });
  } catch (error) {
    console.error("Erro ao aceitar convite:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// ====================
// Rotas de Domínio
// ====================
app.use("/api/budgets", budgetsRoutes);
app.use("/api/transacoes", transacoesRoutes);
app.use("/api/metas", metasRoutes);
app.use("/api/cards", cardsRoutes);

// ====================
// 404 Handler - deve vir após todas as rotas
// ====================
app.use((req, res) => {
  console.error(`❌ Rota não encontrada: ${req.method} ${req.path}`);
  res.status(404).json({ error: "Rota não encontrada", path: req.path });
});

// ====================
// Notificações
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

    if (error) return res.status(500).json({ error });

    res.json(data);
  },
);

// ====================
// Start
// ====================
// Em desenvolvimento local, usa porta 3002 para corresponder ao frontend
// Em produção, usa PORT do ambiente ou 3000 como fallback
const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`🚀 API rodando em http://localhost:${PORT}`);
  console.log(`📡 Endpoints disponíveis:`);
  console.log(`   - GET  /api/transacoes`);
  console.log(`   - GET  /api/budgets`);
  console.log(`   - GET  /api/metas`);
  console.log(`   - POST /api/metas`);
  console.log(`   - PUT  /api/metas/:id`);
  console.log(`   - DELETE /api/metas/:id`);
  console.log(`   - GET  /health`);
});
