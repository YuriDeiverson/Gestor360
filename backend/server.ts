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

// ✅ PRE-FLIGHT GARANTIDO (OBRIGATÓRIO NA VERCEL) - DEVE VIR ANTES DE TUDO
app.use((req, res, next) => {
  try {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - Origin: ${req.headers.origin}`);
    
    const origin = req.headers.origin;
    const isAllowedOrigin = allowedOrigins.includes(origin || "");
    
    // Set CORS headers for all requests
    res.header("Access-Control-Allow-Origin", isAllowedOrigin ? origin : allowedOrigins[0]);
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Allow-Credentials", "true");
    
    console.log(`CORS headers set for origin: ${res.getHeader("Access-Control-Allow-Origin")}`);
    
    // Handle preflight requests immediately
    if (req.method === "OPTIONS") {
      console.log("Handling OPTIONS request - returning 204");
      return res.status(204).end();
    }
    
    next();
  } catch (error) {
    console.error("Error in CORS middleware:", error);
    return res.status(500).json({ error: "CORS middleware error" });
  }
});

// Then apply cors middleware for additional safety
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  }),
);

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
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (_req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// Test CORS endpoint
app.options("/test-cors", (req, res) => {
  console.log("Test CORS OPTIONS endpoint hit");
  res.header("Access-Control-Allow-Origin", req.headers.origin || "https://financeiroplus.vercel.app");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  res.status(204).end();
});

app.get("/test-cors", (req, res) => {
  console.log("Test CORS GET endpoint hit");
  res.header("Access-Control-Allow-Origin", req.headers.origin || "https://financeiroplus.vercel.app");
  res.header("Access-Control-Allow-Credentials", "true");
  res.json({ message: "CORS test successful", timestamp: new Date().toISOString() });
});

// ====================
// AUTH
// ====================
app.use("/api/auth", authRoutes);

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
// GLOBAL ERROR HANDLER
// ====================
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Global error handler:", {
    error: error.message,
    stack: error.stack,
    method: req.method,
    url: req.originalUrl,
    headers: req.headers
  });
  
  // Ensure CORS headers even on error
  res.header("Access-Control-Allow-Origin", req.headers.origin || "https://financeiroplus.vercel.app");
  res.header("Access-Control-Allow-Credentials", "true");
  
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? error.message : "Something went wrong"
  });
});

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
// For Vercel serverless functions
export default app;

// Start server only in development
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}
