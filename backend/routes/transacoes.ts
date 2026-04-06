import { Router, type Response } from "express";
import { supabaseAdmin } from "../supabase";
import { authMiddleware, AuthenticatedRequest } from "../middleware";

const router = Router();

/**
 * POST /api/transacoes/:id/pay-installment
 * Exportado para registro explícito em server.ts (evita 404 em alguns deploys/sub-routers).
 */
export async function payInstallmentHandler(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const { id } = req.params;

    const { data: row, error: fetchErr } = await supabaseAdmin
      .from("transacoes")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchErr || !row) {
      return res.status(404).json({ error: "Transação não encontrada" });
    }

    const installments = Math.max(
      1,
      parseInt(String(row.installments ?? 1), 10) || 1,
    );
    const cur = Math.max(
      1,
      parseInt(String(row.currentinstallment ?? 1), 10) || 1,
    );
    const valorNum = Number(row.valor);
    const totalAmt =
      row.totalamount != null && !Number.isNaN(Number(row.totalamount))
        ? Number(row.totalamount)
        : valorNum * installments;
    const remainingPrev =
      row.remainingamount != null && !Number.isNaN(Number(row.remainingamount))
        ? Number(row.remainingamount)
        : Math.max(0, totalAmt - valorNum);

    if (installments <= 1) {
      return res
        .status(400)
        .json({ error: "Esta transação não possui parcelamento (1x)." });
    }
    if (row.status === "completed") {
      return res.status(400).json({ error: "Parcelamento já quitado." });
    }

    const nextInstallment = cur + 1;
    const isLast = nextInstallment > installments;
    const installmentValue =
      installments > 0 ? totalAmt / installments : valorNum;
    const newRemaining = Math.max(0, remainingPrev - installmentValue);

    let nextPaymentDate: string | null =
      typeof row.nextpaymentdate === "string" && row.nextpaymentdate.trim()
        ? row.nextpaymentdate.trim()
        : null;

    if (!isLast) {
      if (nextPaymentDate) {
        const d = new Date(nextPaymentDate + "T12:00:00");
        d.setMonth(d.getMonth() + 1);
        nextPaymentDate = d.toISOString().split("T")[0];
      } else if (row.data) {
        const d = new Date(String(row.data) + "T12:00:00");
        d.setMonth(d.getMonth() + 1);
        nextPaymentDate = d.toISOString().split("T")[0];
      }
    } else {
      nextPaymentDate = null;
    }

    const updateData: Record<string, unknown> = {
      currentinstallment: nextInstallment,
      remainingamount: newRemaining,
      status: isLast ? "completed" : "pending",
      updated_by: req.user!.userId,
      updated_at: new Date().toISOString(),
    };
    if (nextPaymentDate) {
      updateData.nextpaymentdate = nextPaymentDate;
    } else {
      updateData.nextpaymentdate = null;
    }

    const { data: result, error } = await supabaseAdmin
      .from("transacoes")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("❌ Erro ao pagar parcela:", error);
      return res.status(500).json({
        error: error.message || "Erro ao pagar parcela",
      });
    }

    const methodStr =
      typeof row.method === "string" ? row.method.trim() : "";
    const accountStr =
      row.account != null && String(row.account).trim()
        ? String(row.account).trim()
        : "";

    if (methodStr === "Cartão de Crédito" && accountStr && Number.isFinite(installmentValue)) {
      try {
        const { data: card } = await supabaseAdmin
          .from("cards")
          .select("current_balance")
          .eq("id", accountStr)
          .single();
        if (card) {
          const newBal = Math.max(
            0,
            (card.current_balance || 0) - installmentValue,
          );
          await supabaseAdmin
            .from("cards")
            .update({ current_balance: newBal })
            .eq("id", accountStr);
        }
      } catch (cardErr) {
        console.error("Erro ao atualizar cartão ao pagar parcela:", cardErr);
      }
    }

    res.json(result);
  } catch (err: any) {
    console.error("❌ pay-installment:", err);
    res.status(500).json({
      error: err.message || "Erro ao pagar parcela",
    });
  }
}

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
      categoria: categoriaBody,
    } = req.body;

    /** String vazia quebra FK em budget_id; null é o correto no Postgres */
    const budgetIdNorm =
      budget_id && String(budget_id).trim() ? String(budget_id).trim() : null;
    const methodStr = typeof method === "string" ? method.trim() : "";
    const accountStr =
      account != null && String(account).trim() ? String(account).trim() : "";

    const tipoRaw = String(tipo ?? "")
      .trim()
      .toLowerCase();
    let tipoNorm: "receita" | "despesa";
    if (tipoRaw === "receita" || tipoRaw === "income") {
      tipoNorm = "receita";
    } else if (tipoRaw === "despesa" || tipoRaw === "expense") {
      tipoNorm = "despesa";
    } else {
      return res.status(400).json({
        error: `tipo inválido (use receita ou despesa). Recebido: ${tipo}`,
        received: tipo,
      });
    }

    // Validação com mensagens mais detalhadas
    const missingFields: string[] = [];
    if (!dashboard_id) missingFields.push("dashboard_id");
    const hasIncomeCategory =
      typeof categoriaBody === "string" && categoriaBody.trim().length > 0;
    // budget_id é opcional para salário, conta (cartão), ou categoria de receita explícita
    if (
      !budgetIdNorm &&
      methodStr !== "Salário" &&
      !accountStr &&
      !hasIncomeCategory
    ) {
      missingFields.push("budget_id");
    }
    if (
      valor === undefined ||
      valor === null ||
      (typeof valor === "string" && valor.trim() === "")
    ) {
      missingFields.push("valor");
    }
    if (!descricao || !String(descricao).trim()) missingFields.push("descricao");
    if (!data) missingFields.push("data");

    if (missingFields.length > 0) {
      console.error("❌ Campos obrigatórios faltando:", missingFields);
      return res.status(400).json({
        error: `Campos obrigatórios faltando: ${missingFields.join(", ")}`,
        missingFields,
        received: {
          dashboard_id: !!dashboard_id,
          budget_id: !!budgetIdNorm,
          valor,
          tipo,
          descricao: !!descricao,
          data: !!data,
          method: methodStr,
        },
      });
    }

    // Nome da categoria no banco: budget, corpo categoria (receitas), ou legado método Salário
    let categoria = "Sem categoria";
    if (budgetIdNorm) {
      const { data: budgetData } = await supabaseAdmin
        .from("budgets")
        .select("nome")
        .eq("id", budgetIdNorm)
        .single();
      categoria = budgetData?.nome || "Sem categoria";
    } else if (hasIncomeCategory) {
      categoria = String(categoriaBody).trim();
    } else if (methodStr === "Salário") {
      categoria = "Salário";
    }

    const valorNum =
      typeof valor === "number" ? valor : parseFloat(String(valor).replace(",", "."));
    if (Number.isNaN(valorNum)) {
      return res.status(400).json({ error: "valor inválido", received: valor });
    }

    const inst = installments ?? currentinstallment ?? currentInstallment;
    const installmentsNum = inst != null && inst !== "" ? Math.max(1, parseInt(String(inst), 10) || 1) : 1;
    const curInst = currentinstallment ?? currentInstallment;
    const currentinstallmentNum =
      curInst != null && curInst !== ""
        ? Math.max(1, parseInt(String(curInst), 10) || 1)
        : 1;

    // Normalizar campos de parcelamento (aceitar tanto camelCase quanto snake_case)
    const insertData: any = {
      dashboard_id,
      descricao: String(descricao).trim(),
      valor: valorNum,
      tipo: tipoNorm,
      categoria, // NOT NULL no banco — CHECK (tipo IN ('receita','despesa'))
      budget_id: budgetIdNorm,
      data,
      method: methodStr || "PIX",
      account: accountStr || "Conta Principal",
      status: status || "completed",
      installments: installmentsNum,
      currentinstallment: currentinstallmentNum,
      totalamount: totalamount ?? totalAmount,
      remainingamount: remainingamount ?? remainingAmount,
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
    if (
      tipoNorm === "despesa" &&
      methodStr === "Cartão de Crédito" &&
      accountStr
    ) {
      try {
        console.log("💳 Atualizando limite do cartão:", accountStr);
        
        // Buscar cartão atual
        const { data: card, error: cardError } = await supabaseAdmin
          .from("cards")
          .select("current_balance, card_limit")
          .eq("id", accountStr)
          .single();
          
        if (cardError) {
          console.error("❌ Erro ao buscar cartão:", cardError);
        } else if (card) {
          const totalPurchase =
            insertData.totalamount != null &&
            !Number.isNaN(Number(insertData.totalamount))
              ? Number(insertData.totalamount)
              : valorNum * installmentsNum;
          const balanceDelta =
            installmentsNum > 1 ? totalPurchase : valorNum;
          const newBalance = (card.current_balance || 0) + balanceDelta;

          const { error: updateError } = await supabaseAdmin
            .from("cards")
            .update({ current_balance: newBalance })
            .eq("id", accountStr);
            
          if (updateError) {
            console.error("❌ Erro ao atualizar limite do cartão:", updateError);
          } else {
            console.log("✅ Limite do cartão atualizado:", {
              cardId: accountStr,
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
      categoria: categoriaBody,
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
    } else if (typeof categoriaBody === "string" && categoriaBody.trim()) {
      categoria = categoriaBody.trim();
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

    // Remover apenas undefined (mantém null para limpar budget_id no Supabase)
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
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
