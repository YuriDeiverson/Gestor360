import { Router } from "express";
import { supabaseAdmin } from "../supabase";
import { authMiddleware, AuthenticatedRequest } from "../middleware";
import { applyCardExpenseDelta } from "../cardBalance";
import { subscriptionTransactionDateInCurrentMonth } from "../subscriptionBillingDate";

const router = Router();
router.use(authMiddleware);

function isMissingSubscriptionIdColumn(err: unknown): boolean {
  const e = err as { code?: string; message?: string } | null;
  if (!e) return false;
  const msg = e.message || "";
  return (
    e.code === "42703" ||
    /subscription_id/i.test(msg) ||
    /column .* does not exist/i.test(msg)
  );
}

type LinkedTx = { id: string; valor: number; account: string };

async function findLinkedTransaction(
  subscriptionId: string,
  dashboardId: string,
  cardId: string,
  name: string,
): Promise<LinkedTx | null> {
  const r1 = await supabaseAdmin
    .from("transacoes")
    .select("id, valor, account")
    .eq("subscription_id", subscriptionId)
    .maybeSingle();

  if (r1.data) return r1.data as LinkedTx;
  if (r1.error && !isMissingSubscriptionIdColumn(r1.error)) {
    console.warn("findLinkedTransaction (subscription_id):", r1.error);
    return null;
  }

  const r2 = await supabaseAdmin
    .from("transacoes")
    .select("id, valor, account")
    .eq("dashboard_id", dashboardId)
    .eq("account", cardId)
    .eq("descricao", `Assinatura: ${String(name).trim()}`)
    .maybeSingle();

  return (r2.data as LinkedTx) ?? null;
}

router.get("/", async (req: AuthenticatedRequest, res) => {
  try {
    const dashboard_id = req.query.dashboard_id as string;
    if (!dashboard_id) {
      return res.status(400).json({ error: "dashboard_id é obrigatório" });
    }

    const { data, error } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("dashboard_id", dashboard_id)
      .order("name", { ascending: true });

    if (error) {
      console.error("Erro ao listar subscriptions:", error);
      return res.status(500).json({ error: error.message });
    }

    res.json(data || []);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.post("/", async (req: AuthenticatedRequest, res) => {
  try {
    const {
      dashboard_id,
      card_id,
      name,
      amount,
      billing_day,
      image_url,
      icon_key,
    } = req.body;

    if (!dashboard_id || !card_id || !name || amount === undefined || amount === null) {
      return res.status(400).json({
        error:
          "Campos obrigatórios: dashboard_id, card_id, name, amount, billing_day",
      });
    }

    const day = Number(billing_day);
    if (!Number.isInteger(day) || day < 1 || day > 31) {
      return res.status(400).json({ error: "billing_day deve ser entre 1 e 31" });
    }

    const { data: cardRow, error: cardErr } = await supabaseAdmin
      .from("cards")
      .select("id, dashboard_id")
      .eq("id", card_id)
      .single();

    if (cardErr || !cardRow) {
      return res.status(400).json({ error: "Cartão não encontrado" });
    }

    if (cardRow.dashboard_id !== dashboard_id) {
      return res.status(400).json({ error: "Cartão não pertence a este dashboard" });
    }

    const { data: subRow, error } = await supabaseAdmin
      .from("subscriptions")
      .insert([
        {
          dashboard_id,
          card_id,
          name: String(name).trim(),
          amount: Number(amount),
          billing_day: day,
          image_url: image_url || null,
          icon_key: icon_key || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar subscription:", error);
      return res.status(500).json({ error: error.message });
    }

    const billingDate = subscriptionTransactionDateInCurrentMonth(day);
    const valor = Number(amount);
    const trimmedName = String(name).trim();

    const baseInsert: Record<string, unknown> = {
      dashboard_id,
      descricao: `Assinatura: ${trimmedName}`,
      valor,
      tipo: "despesa",
      categoria: "Contas",
      data: billingDate,
      method: "Cartão de Crédito",
      account: card_id,
      status: "completed",
      installments: 1,
      currentinstallment: 1,
      created_by: req.user!.userId,
    };

    let txRow = await supabaseAdmin
      .from("transacoes")
      .insert([{ ...baseInsert, subscription_id: subRow.id }])
      .select()
      .single();

    if (txRow.error && isMissingSubscriptionIdColumn(txRow.error)) {
      txRow = await supabaseAdmin.from("transacoes").insert([baseInsert]).select().single();
      if (txRow.data && !txRow.error) {
        const patch = await supabaseAdmin
          .from("transacoes")
          .update({ subscription_id: subRow.id })
          .eq("id", (txRow.data as { id: string }).id);
        if (patch.error) {
          console.warn("Não foi possível gravar subscription_id na transação:", patch.error);
        }
      }
    }

    if (txRow.error) {
      console.error("Erro ao criar transação da assinatura:", txRow.error);
      await supabaseAdmin.from("subscriptions").delete().eq("id", subRow.id);
      return res.status(500).json({
        error: (txRow.error as { message?: string }).message || "Erro ao criar transação",
      });
    }

    await applyCardExpenseDelta(card_id, valor);

    res.status(201).json(subRow);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.put("/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { name, amount, billing_day, card_id, image_url, icon_key } = req.body;

    const { data: prevSub, error: prevErr } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("id", id)
      .single();

    if (prevErr || !prevSub) {
      return res.status(404).json({ error: "Assinatura não encontrada" });
    }

    const prevTx = await findLinkedTransaction(
      id,
      prevSub.dashboard_id as string,
      prevSub.card_id as string,
      prevSub.name as string,
    );

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = String(name).trim();
    if (amount !== undefined) updateData.amount = Number(amount);
    if (billing_day !== undefined) {
      const d = Number(billing_day);
      if (!Number.isInteger(d) || d < 1 || d > 31) {
        return res.status(400).json({ error: "billing_day deve ser entre 1 e 31" });
      }
      updateData.billing_day = d;
    }
    if (image_url !== undefined) updateData.image_url = image_url || null;
    if (icon_key !== undefined) updateData.icon_key = icon_key || null;

    if (card_id !== undefined) {
      const { data: cardRow, error: cardErr } = await supabaseAdmin
        .from("cards")
        .select("id, dashboard_id")
        .eq("id", card_id)
        .single();

      if (cardErr || !cardRow || cardRow.dashboard_id !== prevSub.dashboard_id) {
        return res.status(400).json({ error: "Cartão inválido para este dashboard" });
      }
      updateData.card_id = card_id;
    }

    const { data, error } = await supabaseAdmin
      .from("subscriptions")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Erro ao atualizar subscription:", error);
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: "Assinatura não encontrada" });
    }

    const merged = {
      name: data.name as string,
      amount: Number(data.amount),
      billing_day: Number(data.billing_day),
      card_id: data.card_id as string,
    };

    if (prevTx) {
      const oldValor = Number(prevTx.valor);
      const oldCard = prevTx.account as string;
      const newValor = merged.amount;
      const newCard = merged.card_id;
      const billingDate = subscriptionTransactionDateInCurrentMonth(merged.billing_day);

      await supabaseAdmin
        .from("transacoes")
        .update({
          descricao: `Assinatura: ${merged.name}`,
          valor: newValor,
          account: newCard,
          data: billingDate,
          updated_at: new Date().toISOString(),
          updated_by: req.user!.userId,
        })
        .eq("id", prevTx.id);

      if (oldCard === newCard) {
        await applyCardExpenseDelta(newCard, newValor - oldValor);
      } else {
        await applyCardExpenseDelta(oldCard, -oldValor);
        await applyCardExpenseDelta(newCard, newValor);
      }
    }

    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.delete("/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const { data: sub, error: subErr } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("id", id)
      .single();

    if (subErr || !sub) {
      return res.status(404).json({ error: "Assinatura não encontrada" });
    }

    const tx = await findLinkedTransaction(
      id,
      sub.dashboard_id as string,
      sub.card_id as string,
      sub.name as string,
    );

    if (tx?.account) {
      await applyCardExpenseDelta(tx.account as string, -Number(tx.valor));
    }

    if (tx?.id) {
      await supabaseAdmin.from("transacoes").delete().eq("id", tx.id);
    }

    const { error } = await supabaseAdmin.from("subscriptions").delete().eq("id", id);

    if (error) {
      console.error("Erro ao excluir subscription:", error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: "Assinatura removida" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;
