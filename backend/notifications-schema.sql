-- Criar tabela de notificações
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('dashboard_invite', 'dashboard_update', 'system')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_id UUID, -- Pode referenciar convites, dashboards, etc.
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_related_id ON notifications(related_id);

-- RLS (Row Level Security)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem apenas suas próprias notificações
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

-- Política para usuários atualizarem apenas suas próprias notificações
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- Política para o sistema criar notificações (será usado com service role)
CREATE POLICY "System can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true);