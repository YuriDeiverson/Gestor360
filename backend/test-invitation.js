import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

async function testInvitationAcceptance() {
  console.log("🔍 Testando aceitação de convite...");

  const testUserId = "9a9745e4-2a27-4061-90e2-f0c92ebf46c6";
  const testDashboardId = "aab4248a-8a34-4010-8d3b-e162e062a2ca";

  // Verificar se já existe a relação
  const { data: existing, error: existingError } = await supabase
    .from("user_dashboards")
    .select("*")
    .eq("user_id", testUserId)
    .eq("dashboard_id", testDashboardId)
    .single();

  console.log("📊 Relação existente:", existing);
  console.log("❌ Erro ao buscar existente:", existingError);

  if (!existing) {
    console.log("\n➕ Tentando inserir nova relação...");
    const { data, error } = await supabase
      .from("user_dashboards")
      .insert({
        user_id: testUserId,
        dashboard_id: testDashboardId,
        role: "viewer",
        joined_at: new Date().toISOString(),
      })
      .select();

    console.log("✅ Resultado da inserção:", data);
    console.log("❌ Erro na inserção:", error);

    if (data && data.length > 0) {
      // Deletar o teste
      console.log("\n🗑️ Removendo registro de teste...");
      await supabase
        .from("user_dashboards")
        .delete()
        .eq("user_id", testUserId)
        .eq("dashboard_id", testDashboardId);
      console.log("✅ Registro de teste removido");
    }
  } else {
    console.log("⚠️ Relação já existe, não testando inserção");
  }
}

testInvitationAcceptance().catch(console.error);
