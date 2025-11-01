-- Schema mínimo para teste rápido
-- Execute este SQL no Supabase SQL Editor

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de dashboards
CREATE TABLE IF NOT EXISTS dashboards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    is_shared BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de relacionamento usuário-dashboard
CREATE TABLE IF NOT EXISTS user_dashboards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    dashboard_id UUID REFERENCES dashboards(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('owner', 'admin', 'member')) DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, dashboard_id)
);

-- Tabela de convites
CREATE TABLE IF NOT EXISTS dashboard_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    dashboard_id UUID REFERENCES dashboards(id) ON DELETE CASCADE,
    inviter_id UUID REFERENCES users(id) ON DELETE CASCADE,
    invitee_id UUID REFERENCES users(id) ON DELETE CASCADE,
    invitee_email TEXT NOT NULL,
    status TEXT CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')) DEFAULT 'pending',
    message TEXT,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar colunas às tabelas existentes
ALTER TABLE transacoes ADD COLUMN IF NOT EXISTS dashboard_id UUID REFERENCES dashboards(id);
ALTER TABLE transacoes ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);
ALTER TABLE transacoes ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);

ALTER TABLE metas ADD COLUMN IF NOT EXISTS dashboard_id UUID REFERENCES dashboards(id);
ALTER TABLE metas ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);
ALTER TABLE metas ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);

ALTER TABLE orcamento_categorias ADD COLUMN IF NOT EXISTS dashboard_id UUID REFERENCES dashboards(id);
ALTER TABLE orcamento_categorias ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);
ALTER TABLE orcamento_categorias ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_dashboards_user_id ON user_dashboards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_dashboards_dashboard_id ON user_dashboards(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_invitations_invitee_id ON dashboard_invitations(invitee_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_dashboard_id ON transacoes(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_metas_dashboard_id ON metas(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_orcamento_categorias_dashboard_id ON orcamento_categorias(dashboard_id);

-- Função para criar dashboard padrão
CREATE OR REPLACE FUNCTION create_default_dashboard()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO dashboards (name, description, created_by, is_shared)
    VALUES ('Meu Dashboard', 'Dashboard pessoal padrão', NEW.id, false);
    
    INSERT INTO user_dashboards (user_id, dashboard_id, role)
    VALUES (NEW.id, (SELECT id FROM dashboards WHERE created_by = NEW.id LIMIT 1), 'owner');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar dashboard padrão
DROP TRIGGER IF EXISTS create_default_dashboard_trigger ON users;
CREATE TRIGGER create_default_dashboard_trigger
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_dashboard();

-- RLS (Row Level Security) básico
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_invitations ENABLE ROW LEVEL SECURITY;

-- Políticas básicas de RLS
CREATE POLICY users_policy ON users FOR ALL USING (auth.uid() = id);
CREATE POLICY dashboards_policy ON dashboards FOR ALL USING (
    id IN (SELECT dashboard_id FROM user_dashboards WHERE user_id = auth.uid())
);
CREATE POLICY user_dashboards_policy ON user_dashboards FOR ALL USING (user_id = auth.uid());
CREATE POLICY invitations_policy ON dashboard_invitations FOR ALL USING (
    invitee_id = auth.uid() OR inviter_id = auth.uid()
);