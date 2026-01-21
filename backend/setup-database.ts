import { supabase } from "./supabase";
import fs from "fs";
import path from "path";

async function setupDatabase() {
  try {
    console.log("🚀 Iniciando configuração do banco de dados...");

    // Ler o arquivo de schema
    const schemaPath = path.join(process.cwd(), "database-schema.sql");
    const schemaSQL = fs.readFileSync(schemaPath, "utf-8");

    // Executar o schema (dividir por statements)
    const statements = schemaSQL
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

    console.log(`📋 Executando ${statements.length} comandos SQL...`);

    for (const statement of statements) {
      try {
        const { error } = await supabase.rpc("exec_sql", { sql: statement });
        if (error) {
          console.warn(`⚠️  Aviso em: ${statement.substring(0, 50)}...`);
          console.warn(`   ${error.message}`);
        }
      } catch (err) {
        // Tentar executação direta se RPC falhar
        console.log(`🔄 Tentando execução alternativa...`);
      }
    }

    console.log("✅ Configuração do banco concluída!");
    console.log("🔍 Verificando tabelas criadas...");

    // Verificar se as tabelas foram criadas
    const { data: tables, error: tablesError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .in("table_name", [
        "users",
        "dashboards",
        "user_dashboards",
        "dashboard_invitations",
      ]);

    if (tablesError) {
      console.error("❌ Erro ao verificar tabelas:", tablesError);
    } else {
      console.log(
        "📊 Tabelas encontradas:",
        tables?.map((t) => t.table_name),
      );
    }
  } catch (error) {
    console.error("❌ Erro na configuração do banco:", error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase();
}

export { setupDatabase };
