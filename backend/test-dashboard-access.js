import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

async function testDashboardAccess() {
  console.log("🔍 Testando acesso ao dashboard...\n");

  // Liste todos os dashboards e acessos
  const { data: allDashboards } = await supabase
    .from("dashboards")
    .select("id, name");

  console.log("📊 Dashboards disponíveis:");
  allDashboards?.forEach((d) => {
    console.log(`  - ${d.name} (${d.id})`);
  });

  // Liste todos os acessos
  const { data: allAccess } = await supabase
    .from("user_dashboards")
    .select("user_id, dashboard_id, role");

  console.log("\n🔐 Acessos configurados:");
  allAccess?.forEach((a) => {
    const dashboard = allDashboards?.find((d) => d.id === a.dashboard_id);
    console.log(
      `  - User ${a.user_id.substring(0, 8)}... → Dashboard "${
        dashboard?.name
      }" (${a.role})`,
    );
  });

  // Teste com usuário específico
  const testUserId = "9a9745e4-2a27-4061-90e2-f0c92ebf46c6"; // ID do usuário do log

  console.log(`\n👤 Testando acesso para usuário: ${testUserId}`);

  const { data: userAccess } = await supabase
    .from("user_dashboards")
    .select("dashboard_id, role")
    .eq("user_id", testUserId);

  console.log("📋 Dashboards acessíveis:");
  userAccess?.forEach((a) => {
    const dashboard = allDashboards?.find((d) => d.id === a.dashboard_id);
    console.log(`  - ${dashboard?.name} (${a.role})`);
  });
}

testDashboardAccess().catch(console.error);
