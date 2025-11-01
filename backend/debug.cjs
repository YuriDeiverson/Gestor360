const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkNotifications() {
  console.log('🔍 Verificando todas as notificações...');
  
  // Buscar todas as notificações
  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
    
  if (error) {
    console.log('❌ Erro ao buscar notificações:', error);
    return;
  }
  
  console.log('📊 Total de notificações encontradas:', notifications.length);
  notifications.forEach(notif => {
    console.log('📝', {
      id: notif.id,
      user_id: notif.user_id,
      type: notif.type,
      title: notif.title,
      created_at: notif.created_at
    });
  });
  
  // Buscar usuários para identificar
  console.log('\n👥 Verificando usuários...');
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('id, name, email');
    
  if (!userError) {
    users.forEach(user => {
      console.log('👤', user.name, '(' + user.email + ')', '-> ID:', user.id);
    });
  }
}

checkNotifications().catch(console.error);