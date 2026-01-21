import { Router } from "express";
import { supabaseAdmin } from "../supabase";
import { authMiddleware, AuthenticatedRequest } from "../middleware";

const router = Router();

/**
 * GET /transacoes
 * Lista transações com dados do budget
 */
router.get("/", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { dashboard_id } = req.query;

    if (!dashboard_id) {
      return res.status(400).json({ error: "dashboard_id é obrigatório" });
    }

    console.log(`📥 Buscando transações para dashboard_id: ${dashboard_id}`);

    // Primeiro, buscar as transações sem o join (que não está funcionando)
    const { data: transacoes, error } = await supabaseAdmin
      .from("transacoes")
      .select("*")
      .eq("dashboard_id", dashboard_id)
      .order("data", { ascending: false });

    if (error) {
      console.error("❌ Erro ao buscar transações do Supabase:", error);
      return res.status(500).json({ 
        error: error.message || "Erro ao buscar transações",
        details: error 
      });
    }

    // Se houver transações, buscar os budgets correspondentes (mesmo que sejam null)
    if (transacoes && transacoes.length > 0) {
      const budgetIds = [...new Set(transacoes.map(t => t.budget_id).filter(Boolean))];
      
      if (budgetIds.length > 0) {
        const { data: budgets } = await supabaseAdmin
          .from("budgets")
          .select("id, nome, cor, tipo, limit_value")
          .in("id", budgetIds);

        // Combinar os dados
        const budgetsMap = new Map(budgets?.map(b => [b.id, b]) || []);
        const transacoesComBudget = transacoes.map(transacao => ({
          ...transacao,
          budget: transacao.budget_id ? budgetsMap.get(transacao.budget_id) : null
        }));

        console.log(`✅ Transações encontradas: ${transacoesComBudget.length}`);
        return res.json(transacoesComBudget);
      } else {
        // Retornar transações mesmo sem budgets
        const transacoesSemBudget = transacoes.map(transacao => ({
          ...transacao,
          budget: null
        }));
        
        console.log(`✅ Transações encontradas (sem budgets): ${transacoesSemBudget.length}`);
        return res.json(transacoesSemBudget);
      }
    }

    console.log(`✅ Transações encontradas: ${transacoes?.length || 0}`);
    res.json(transacoes || []);
  } catch (err: any) {
    console.error("❌ Erro inesperado ao buscar transações:", err);
    res.status(500).json({ 
      error: err.message || "Erro interno do servidor",
      details: process.env.NODE_ENV !== "production" ? err.stack : undefined
    });
  }
});

/**
 * POST /transacoes
 * Cria uma transação vinculada a um budget
 */
router.post("/", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    console.log("📥 Recebendo requisição POST /transacoes:", {
      body: req.body,
      headers: req.headers,
    });

    const {
      dashboard_id,
      descricao,
      valor,
      tipo,
      budget_id,
      data,
      method,
      account,
      status,
      installments,
      currentinstallment,
      currentInstallment,
      totalamount,
      totalAmount,
      remainingamount,
      remainingAmount,
      nextpaymentdate,
      nextPaymentDate,
    } = req.body;

    // Validação com mensagens mais detalhadas
    const missingFields: string[] = [];
    if (!dashboard_id) missingFields.push("dashboard_id");
    // budget_id é opcional para salário e transações com account (card_id)
    if (!budget_id && method !== "Salário" && !account) missingFields.push("budget_id");
    if (!valor && valor !== 0) missingFields.push("valor");
    if (!tipo) missingFields.push("tipo");

    if (missingFields.length > 0) {
      console.error("❌ Campos obrigatórios faltando:", missingFields);
      return res.status(400).json({
        error: `Campos obrigatórios faltando: ${missingFields.join(", ")}`,
        missingFields,
        received: {
          dashboard_id: !!dashboard_id,
          budget_id: !!budget_id,
          valor,
          tipo,
        },
      });
    }

    // Buscar o nome do budget para preencher a categoria (campo obrigatório)
    let categoria = "Sem categoria";
    if (budget_id) {
      const { data: budgetData } = await supabaseAdmin
        .from("budgets")
        .select("nome")
        .eq("id", budget_id)
        .single();
      categoria = budgetData?.nome || "Sem categoria";
    } else if (method === "Salário") {
      categoria = "Salário";
    }

    // Normalizar campos de parcelamento (aceitar tanto camelCase quanto snake_case)
    const insertData: any = {
      dashboard_id,
      descricao,
      valor,
      tipo, // expense | income
      categoria, // Nome do budget (campo obrigatório no banco)
      budget_id,
      data,
      method,
      account,
      status,
      installments: installments || currentinstallment ? (installments || 1) : 1,
      currentinstallment: currentinstallment || currentInstallment || 1,
      totalamount: totalamount || totalAmount,
      remainingamount: remainingamount || remainingAmount,
      nextpaymentdate: nextpaymentdate || nextPaymentDate,
      created_by: req.user!.userId,
    };

    // Remover campos undefined/null (exceto categoria que é obrigatória)
    Object.keys(insertData).forEach(key => {
      if (key !== "categoria" && key !== "budget_id" && (insertData[key] === undefined || insertData[key] === null)) {
        delete insertData[key];
      }
    });

    console.log("💾 Inserindo transação no Supabase:", insertData);

    const { data: result, error } = await supabaseAdmin
      .from("transacoes")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("❌ Erro ao criar transação:", error);
      return res.status(500).json({ 
        error: error.message || "Erro ao criar transação",
        details: error 
      });
    }

    // Atualizar limite do cartão se for despesa com cartão de crédito
    if (tipo === "despesa" && method === "Cartão de Crédito" && account) {
      try {
        console.log("💳 Atualizando limite do cartão:", account);
        
        // Buscar cartão atual
        const { data: card, error: cardError } = await supabaseAdmin
          .from("cards")
          .select("current_balance, card_limit")
          .eq("id", account)
          .single();
          
        if (cardError) {
          console.error("❌ Erro ao buscar cartão:", cardError);
        } else if (card) {
          // Atualizar saldo atual (somar valor da despesa)
          const newBalance = (card.current_balance || 0) + valor;
          
          const { error: updateError } = await supabaseAdmin
            .from("cards")
            .update({ current_balance: newBalance })
            .eq("id", account);
            
          if (updateError) {
            console.error("❌ Erro ao atualizar limite do cartão:", updateError);
          } else {
            console.log("✅ Limite do cartão atualizado:", {
              cardId: account,
              oldBalance: card.current_balance,
              newBalance: newBalance,
              limit: card.card_limit
            });
          }
        }
      } catch (updateErr) {
        console.error("❌ Erro ao processar atualização do cartão:", updateErr);
      }
    }

    res.status(201).json(result);
  } catch (err: any) {
    console.error("❌ Erro inesperado ao criar transação:", err);
    res.status(500).json({ 
      error: err.message || "Erro interno do servidor",
      details: process.env.NODE_ENV !== "production" ? err.stack : undefined
    });
  }
});

/**
 * PUT /transacoes/:id
 * Atualiza uma transação existente
 */
router.put("/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const {
      dashboard_id,
      descricao,
      valor,
      tipo,
      budget_id,
      data,
      method,
      account,
      status,
      installments,
      currentinstallment,
      currentInstallment,
      totalamount,
      totalAmount,
      remainingamount,
      remainingAmount,
      nextpaymentdate,
      nextPaymentDate,
    } = req.body;

    console.log(`📝 Atualizando transação ID: ${id}`);

    // Se budget_id mudou, buscar o novo nome da categoria
    let categoria: string | undefined;
    if (budget_id) {
      const { data: budgetData } = await supabaseAdmin
        .from("budgets")
        .select("nome")
        .eq("id", budget_id)
        .single();

      categoria = budgetData?.nome;
    }

    // Preparar dados de atualização
    const updateData: any = {
      descricao,
      valor,
      tipo,
      budget_id,
      data,
      method,
      account,
      status,
      installments: installments || currentinstallment ? (installments || 1) : 1,
      currentinstallment: currentinstallment || currentInstallment || 1,
      totalamount: totalamount || totalAmount,
      remainingamount: remainingamount || remainingAmount,
      nextpaymentdate: nextpaymentdate || nextPaymentDate,
      updated_by: req.user!.userId,
      updated_at: new Date().toISOString(),
    };

    // Adicionar categoria se foi fornecida ou se budget_id foi alterado
    if (categoria) {
      updateData.categoria = categoria;
    }

    // Remover campos undefined/null
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined || updateData[key] === null) {
        delete updateData[key];
      }
    });

    console.log("💾 Atualizando transação no Supabase:", updateData);

    const { data: result, error } = await supabaseAdmin
      .from("transacoes")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("❌ Erro ao atualizar transação:", error);
      return res.status(500).json({ 
        error: error.message || "Erro ao atualizar transação",
        details: error 
      });
    }

    if (!result) {
      return res.status(404).json({ error: "Transação não encontrada" });
    }

    console.log(`✅ Transação atualizada: ${result.descricao}`);
    res.json(result);
  } catch (err: any) {
    console.error("❌ Erro inesperado ao atualizar transação:", err);
    res.status(500).json({ 
      error: err.message || "Erro interno do servidor",
      details: process.env.NODE_ENV !== "production" ? err.stack : undefined
    });
  }
});

/**
 * DELETE /transacoes/:id
 * Deleta uma transação
 */
router.delete("/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    console.log(`🗑️ Deletando transação ID: ${id}`);

    // Verificar se a transação existe antes de deletar
    const { data: transaction, error: fetchError } = await supabaseAdmin
      .from("transacoes")
      .select("id, descricao")
      .eq("id", id)
      .single();

    if (fetchError || !transaction) {
      return res.status(404).json({ error: "Transação não encontrada" });
    }

    // Deletar a transação
    const { error } = await supabaseAdmin
      .from("transacoes")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("❌ Erro ao deletar transação:", error);
      return res.status(500).json({ 
        error: error.message || "Erro ao deletar transação",
        details: error 
      });
    }

    console.log(`✅ Transação deletada: ${transaction.descricao}`);
    res.json({ message: "Transação deletada com sucesso", id });
  } catch (err: any) {
    console.error("❌ Erro inesperado ao deletar transação:", err);
    res.status(500).json({ 
      error: err.message || "Erro interno do servidor",
      details: process.env.NODE_ENV !== "production" ? err.stack : undefined
    });
  }
});

export default router;
