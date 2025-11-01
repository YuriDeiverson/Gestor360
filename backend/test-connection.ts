import { supabase } from "./supabase.js";

// Script de teste da conexão com Supabase
async function testarConexao() {
  try {
    // Teste de conexão
    const { data, error } = await supabase
      .from("transacoes")
      .select("count", { count: "exact" });

    if (error) {
      console.error("❌ Erro na conexão:", error.message);
      return;
    }

    console.log("✅ Conexão com Supabase estabelecida com sucesso!");
    console.log(`📊 Total de transações no banco: ${data?.length || 0}`);

    // Teste das outras tabelas
    const { data: metas } = await supabase
      .from("metas")
      .select("count", { count: "exact" });
    console.log(`🎯 Total de metas no banco: ${metas?.length || 0}`);

    const { data: orcamentos } = await supabase
      .from("orcamentos")
      .select("count", { count: "exact" });
    console.log(`💰 Total de orçamentos no banco: ${orcamentos?.length || 0}`);
  } catch (error) {
    console.error("❌ Erro inesperado:", error);
  }
}

// Executar apenas se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  testarConexao();
}
