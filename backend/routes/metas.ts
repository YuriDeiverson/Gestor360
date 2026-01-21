import { Router } from "express";
import { supabaseAdmin } from "../supabase";
import { authMiddleware, AuthenticatedRequest } from "../middleware";

const router = Router();

/**
 * GET /metas
 * Lista metas com dados do dashboard
 */
router.get("/", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { dashboard_id } = req.query;

    if (!dashboard_id) {
      return res.status(400).json({ error: "dashboard_id é obrigatório" });
    }

    console.log(`📥 Buscando metas para dashboard_id: ${dashboard_id}`);

    const { data: metas, error } = await supabaseAdmin
      .from("metas")
      .select("*")
      .eq("dashboard_id", dashboard_id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Erro ao buscar metas do Supabase:", error);
      return res.status(500).json({ 
        error: error.message || "Erro ao buscar metas",
        details: error 
      });
    }

    console.log(`✅ Metas encontradas: ${metas?.length || 0}`);
    res.json(metas || []);
  } catch (err: any) {
    console.error("❌ Erro ao buscar metas:", err);
    res.status(500).json({ 
      error: err.message || "Erro interno do servidor",
      details: process.env.NODE_ENV !== "production" ? err.stack : undefined
    });
  }
});

/**
 * POST /metas
 * Cria uma nova meta
 */
router.post("/", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    console.log("📥 Recebendo requisição POST /api/metas:", {
      body: req.body,
      headers: req.headers,
    });

    const {
      nome,
      valor_alvo,
      valor_atual,
      data_limite,
      descricao,
      dashboard_id
    } = req.body;

    // Validação dos campos obrigatórios
    const missingFields: string[] = [];
    if (!nome) missingFields.push("nome");
    if (!valor_alvo) missingFields.push("valor_alvo");
    if (!data_limite) missingFields.push("data_limite");
    if (!dashboard_id) missingFields.push("dashboard_id");

    if (missingFields.length > 0) {
      console.error("❌ Campos obrigatórios faltando:", missingFields);
      return res.status(400).json({
        error: `Campos obrigatórios faltando: ${missingFields.join(", ")}`,
        missingFields,
        received: {
          nome: !!nome,
          valor_alvo: !!valor_alvo,
          data_limite: !!data_limite,
          dashboard_id: !!dashboard_id,
        }
      });
    }

    // Validação dos valores
    if (valor_alvo && parseFloat(valor_alvo) <= 0) {
      return res.status(400).json({
        error: "valor_alvo deve ser maior que zero"
      });
    }

    // Converter tipos de dados
    const valorAlvoNumerico = parseFloat(valor_alvo);
    const valorAtualNumerico = valor_atual ? parseFloat(valor_atual) : 0;

    console.log("📝 Dados da meta:", {
      nome,
      valor_alvo: valorAlvoNumerico,
      valor_atual: valorAtualNumerico,
      data_limite,
      descricao,
      dashboard_id
    });

    const { data: meta, error } = await supabaseAdmin
      .from("metas")
      .insert([
        {
          nome,
          valor_alvo: valorAlvoNumerico,
          valor_atual: valorAtualNumerico,
          data_limite: new Date(data_limite),
          descricao: descricao || "",
          dashboard_id,
          criado_em: new Date(),
          updated_by: req.user!.userId,
          updated_at: new Date()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("❌ Erro ao criar meta no Supabase:", error);
      return res.status(500).json({ 
        error: error.message || "Erro ao criar meta",
        details: error 
      });
    }

    console.log("✅ Meta criada com sucesso:", meta);
    res.status(201).json(meta);
  } catch (err: any) {
    console.error("❌ Erro ao criar meta:", err);
    res.status(500).json({ 
      error: err.message || "Erro interno do servidor",
      details: process.env.NODE_ENV !== "production" ? err.stack : undefined
    });
  }
});

/**
 * PUT /metas/:id
 * Atualiza uma meta existente
 */
router.put("/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const {
      nome,
      valor_alvo,
      valor_atual,
      data_limite,
      descricao
    } = req.body;

    console.log(`📝 Atualizando meta ID: ${id}`);

    // Validação básica
    if (!nome || !valor_alvo || !data_limite) {
      return res.status(400).json({
        error: "nome, valor_alvo e data_limite são obrigatórios"
      });
    }

    // Converter tipos de dados
    const valorAlvoNumerico = parseFloat(valor_alvo);
    const valorAtualNumerico = valor_atual ? parseFloat(valor_atual) : 0;

    const { data: meta, error } = await supabaseAdmin
      .from("metas")
      .update({
        nome,
        valor_alvo: valorAlvoNumerico,
        valor_atual: valorAtualNumerico,
        data_limite: new Date(data_limite),
        descricao: descricao || "",
        updated_by: req.user!.userId,
        updated_at: new Date()
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("❌ Erro ao atualizar meta no Supabase:", error);
      return res.status(500).json({ 
        error: error.message || "Erro ao atualizar meta",
        details: error 
      });
    }

    if (!meta) {
      return res.status(404).json({ error: "Meta não encontrada" });
    }

    console.log("✅ Meta atualizada com sucesso:", meta);
    res.json(meta);
  } catch (err: any) {
    console.error("❌ Erro ao atualizar meta:", err);
    res.status(500).json({ 
      error: err.message || "Erro interno do servidor",
      details: process.env.NODE_ENV !== "production" ? err.stack : undefined
    });
  }
});

/**
 * DELETE /metas/:id
 * Deleta uma meta
 */
router.delete("/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    console.log(`🗑️ Deletando meta ID: ${id}`);

    // Verificar se a meta existe antes de deletar
    const { data: meta, error } = await supabaseAdmin
      .from("metas")
      .select("id, nome")
      .eq("id", id)
      .single();

    if (error) {
      console.error("❌ Erro ao buscar meta para deletar:", error);
      return res.status(500).json({ 
        error: error.message || "Erro ao buscar meta",
        details: error 
      });
    }

    if (!meta) {
      return res.status(404).json({ error: "Meta não encontrada" });
    }

    // Deletar a meta
    const { error: deleteError } = await supabaseAdmin
      .from("metas")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("❌ Erro ao deletar meta:", deleteError);
      return res.status(500).json({ 
        error: deleteError.message || "Erro ao deletar meta",
        details: deleteError 
      });
    }

    console.log(`✅ Meta deletada com sucesso: ${meta.nome}`);
    res.json({ message: "Meta deletada com sucesso", meta });
  } catch (err: any) {
    console.error("❌ Erro ao deletar meta:", err);
    res.status(500).json({ 
      error: err.message || "Erro interno do servidor",
      details: process.env.NODE_ENV !== "production" ? err.stack : undefined
    });
  }
});

export default router;
