const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

async function testNotificationEndpoint() {
  console.log("🧪 Testando endpoint de notificações...");

  // Simular uma requisição como o frontend faz
  const userId = "be02f621-cc94-4410-a188-bac083932736"; // sasasa

  console.log("👤 Testando para usuário ID:", userId);

  // Buscar notificações diretamente no banco
  const { data: notifications, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.log("❌ Erro ao buscar notificações:", error);
    return;
  }

  console.log("📊 Notificações encontradas:", notifications.length);
  notifications.forEach((notif) => {
    console.log("📝", {
      id: notif.id,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      is_read: notif.is_read,
      created_at: notif.created_at,
    });
  });

  // Testar contagem não lidas
  const { data: unreadData, error: unreadError } = await supabase
    .from("notifications")
    .select("id")
    .eq("user_id", userId)
    .eq("is_read", false);

  if (!unreadError) {
    console.log("🔔 Notificações não lidas:", unreadData.length);
  }
}

testNotificationEndpoint().catch(console.error);
