import { supabaseAdmin } from "./supabase";

/** Ajusta o saldo do cartão (current_balance) quando a despesa no cartão muda em delta. */
export async function applyCardExpenseDelta(
  cardId: string,
  delta: number,
): Promise<void> {
  if (!cardId || delta === 0) return;
  const { data: card, error } = await supabaseAdmin
    .from("cards")
    .select("current_balance")
    .eq("id", cardId)
    .single();
  if (error || !card) {
    console.error("applyCardExpenseDelta: cartão não encontrado", cardId, error);
    return;
  }
  const newBalance = (card.current_balance || 0) + delta;
  const { error: updateError } = await supabaseAdmin
    .from("cards")
    .update({ current_balance: newBalance })
    .eq("id", cardId);
  if (updateError) {
    console.error("applyCardExpenseDelta: erro ao atualizar", updateError);
  }
}
