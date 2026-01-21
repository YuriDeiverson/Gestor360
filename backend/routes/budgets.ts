import { Router } from "express";
import { supabaseAdmin } from "../supabase.js";
import { authMiddleware, AuthenticatedRequest } from "../middleware.js";

const router = Router();

// ==========================
// Criar Budget (categoria)
// ==========================
router.post("/", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { nome, icone, cor, tipo, descricao, limit_value, dashboard_id } =
      req.body;

    const { data, error } = await supabaseAdmin
      .from("budgets") // 🔥 AQUI É O PONTO CRÍTICO
      .insert([
        {
          nome,
          icone,
          cor,
          tipo,
          descricao,
          limit_value,
          dashboard_id,
          created_by: req.user!.userId,
          updated_by: req.user!.userId,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (err: any) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

// ==========================
// Listar Budgets
// ==========================
router.get("/", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { dashboard_id } = req.query;

    if (!dashboard_id) {
      return res.status(400).json({ error: "dashboard_id é obrigatório" });
    }

    console.log(`📥 Buscando budgets para dashboard_id: ${dashboard_id}`);

    const { data, error } = await supabaseAdmin
      .from("budgets")
      .select("*")
      .eq("dashboard_id", dashboard_id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("❌ Erro ao buscar budgets do Supabase:", error);
      return res.status(500).json({ 
        error: error.message || "Erro ao buscar budgets",
        details: error 
      });
    }

    console.log(`✅ Budgets encontrados: ${data?.length || 0}`);
    res.json(data || []);
  } catch (err: any) {
    console.error("❌ Erro inesperado ao buscar budgets:", err);
    res.status(500).json({ 
      error: err.message || "Erro interno do servidor",
      details: process.env.NODE_ENV !== "production" ? err.stack : undefined
    });
  }
});

// ==========================
// Atualizar Budget
// ==========================
router.put("/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { nome, icone, cor, tipo, descricao, limit_value } = req.body;

    console.log(`📝 Atualizando budget ID: ${id}`);

    const { data, error } = await supabaseAdmin
      .from("budgets")
      .update({
        nome,
        icone,
        cor,
        tipo,
        descricao,
        limit_value,
        updated_by: req.user!.userId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("❌ Erro ao atualizar budget:", error);
      return res.status(500).json({ 
        error: error.message || "Erro ao atualizar budget",
        details: error 
      });
    }

    if (!data) {
      return res.status(404).json({ error: "Budget não encontrado" });
    }

    console.log(`✅ Budget atualizado: ${data.nome}`);
    res.json(data);
  } catch (err: any) {
    console.error("❌ Erro inesperado ao atualizar budget:", err);
    res.status(500).json({ 
      error: err.message || "Erro interno do servidor",
      details: process.env.NODE_ENV !== "production" ? err.stack : undefined
    });
  }
});

// ==========================
// Deletar Budget
// ==========================
router.delete("/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    console.log(`🗑️ Deletando budget ID: ${id}`);

    // Verificar se o budget existe antes de deletar
    const { data: budget, error: fetchError } = await supabaseAdmin
      .from("budgets")
      .select("id, nome")
      .eq("id", id)
      .single();

    if (fetchError || !budget) {
      return res.status(404).json({ error: "Budget não encontrado" });
    }

    // Deletar o budget (a foreign key está configurada com ON DELETE SET NULL,
    // então as transações não serão deletadas, apenas terão budget_id = NULL)
    const { error } = await supabaseAdmin
      .from("budgets")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("❌ Erro ao deletar budget:", error);
      return res.status(500).json({ 
        error: error.message || "Erro ao deletar budget",
        details: error 
      });
    }

    console.log(`✅ Budget deletado: ${budget.nome}`);
    res.json({ message: "Budget deletado com sucesso", id });
  } catch (err: any) {
    console.error("❌ Erro inesperado ao deletar budget:", err);
    res.status(500).json({ 
      error: err.message || "Erro interno do servidor",
      details: process.env.NODE_ENV !== "production" ? err.stack : undefined
    });
  }
});

export default router;
