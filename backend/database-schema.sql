-- Tabela de usuários
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  avatar_url VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de dashboards
CREATE TABLE dashboards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL DEFAULT 'Meu Dashboard',
  description TEXT,
  is_shared BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de relacionamento usuário-dashboard (many-to-many)
CREATE TABLE user_dashboards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  dashboard_id UUID REFERENCES dashboards(id) ON DELETE CASCADE,
  role VARCHAR DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, dashboard_id)
);

-- Tabela de convites para dashboards
CREATE TABLE dashboard_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dashboard_id UUID REFERENCES dashboards(id) ON DELETE CASCADE,
  inviter_id UUID REFERENCES users(id) ON DELETE CASCADE,
  invitee_email VARCHAR NOT NULL,
  invitee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  message TEXT,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Atualizar tabelas existentes para incluir dashboard_id
ALTER TABLE transacoes ADD COLUMN dashboard_id UUID REFERENCES dashboards(id) ON DELETE CASCADE;
ALTER TABLE metas ADD COLUMN dashboard_id UUID REFERENCES dashboards(id) ON DELETE CASCADE;
ALTER TABLE orcamentos ADD COLUMN dashboard_id UUID REFERENCES dashboards(id) ON DELETE CASCADE;

-- Índices para performance
CREATE INDEX idx_user_dashboards_user_id ON user_dashboards(user_id);
CREATE INDEX idx_user_dashboards_dashboard_id ON user_dashboards(dashboard_id);
CREATE INDEX idx_dashboard_invitations_invitee_email ON dashboard_invitations(invitee_email);
CREATE INDEX idx_dashboard_invitations_status ON dashboard_invitations(status);
CREATE INDEX idx_transacoes_dashboard_id ON transacoes(dashboard_id);
CREATE INDEX idx_metas_dashboard_id ON metas(dashboard_id);
CREATE INDEX idx_orcamentos_dashboard_id ON orcamentos(dashboard_id);

-- Policies para Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE metas ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcamentos ENABLE ROW LEVEL SECURITY;

-- Policy para usuários (só podem ver seus próprios dados)
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Policy para dashboards (usuários só veem dashboards aos quais têm acesso)
CREATE POLICY "Users can view accessible dashboards" ON dashboards
  FOR SELECT USING (
    id IN (
      SELECT dashboard_id FROM user_dashboards 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create dashboards" ON dashboards
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own dashboards" ON dashboards
  FOR UPDATE USING (
    id IN (
      SELECT dashboard_id FROM user_dashboards 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Policy para user_dashboards
CREATE POLICY "Users can view own dashboard relationships" ON user_dashboards
  FOR SELECT USING (user_id = auth.uid());

-- Policy para convites
CREATE POLICY "Users can view invitations sent to them" ON dashboard_invitations
  FOR SELECT USING (invitee_id = auth.uid() OR inviter_id = auth.uid());

CREATE POLICY "Users can create invitations for their dashboards" ON dashboard_invitations
  FOR INSERT WITH CHECK (
    inviter_id = auth.uid() AND
    dashboard_id IN (
      SELECT dashboard_id FROM user_dashboards 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Policy para transações (só acessar dados do dashboard que o usuário tem acesso)
CREATE POLICY "Users can view dashboard transactions" ON transacoes
  FOR SELECT USING (
    dashboard_id IN (
      SELECT dashboard_id FROM user_dashboards 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert dashboard transactions" ON transacoes
  FOR INSERT WITH CHECK (
    dashboard_id IN (
      SELECT dashboard_id FROM user_dashboards 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update dashboard transactions" ON transacoes
  FOR UPDATE USING (
    dashboard_id IN (
      SELECT dashboard_id FROM user_dashboards 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete dashboard transactions" ON transacoes
  FOR DELETE USING (
    dashboard_id IN (
      SELECT dashboard_id FROM user_dashboards 
      WHERE user_id = auth.uid()
    )
  );

-- Policies similares para metas e orçamentos
CREATE POLICY "Users can view dashboard metas" ON metas
  FOR SELECT USING (
    dashboard_id IN (
      SELECT dashboard_id FROM user_dashboards 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert dashboard metas" ON metas
  FOR INSERT WITH CHECK (
    dashboard_id IN (
      SELECT dashboard_id FROM user_dashboards 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update dashboard metas" ON metas
  FOR UPDATE USING (
    dashboard_id IN (
      SELECT dashboard_id FROM user_dashboards 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete dashboard metas" ON metas
  FOR DELETE USING (
    dashboard_id IN (
      SELECT dashboard_id FROM user_dashboards 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view dashboard orcamentos" ON orcamentos
  FOR SELECT USING (
    dashboard_id IN (
      SELECT dashboard_id FROM user_dashboards 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert dashboard orcamentos" ON orcamentos
  FOR INSERT WITH CHECK (
    dashboard_id IN (
      SELECT dashboard_id FROM user_dashboards 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update dashboard orcamentos" ON orcamentos
  FOR UPDATE USING (
    dashboard_id IN (
      SELECT dashboard_id FROM user_dashboards 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete dashboard orcamentos" ON orcamentos
  FOR DELETE USING (
    dashboard_id IN (
      SELECT dashboard_id FROM user_dashboards 
      WHERE user_id = auth.uid()
    )
  );

-- Função para criar dashboard padrão quando usuário se registra
CREATE OR REPLACE FUNCTION create_default_dashboard()
RETURNS TRIGGER AS $$
DECLARE
  new_dashboard_id UUID;
BEGIN
  -- Criar dashboard padrão para o novo usuário
  INSERT INTO dashboards (name, description, created_by)
  VALUES ('Meu Dashboard', 'Dashboard pessoal', NEW.id)
  RETURNING id INTO new_dashboard_id;
  
  -- Adicionar usuário como owner do dashboard
  INSERT INTO user_dashboards (user_id, dashboard_id, role)
  VALUES (NEW.id, new_dashboard_id, 'owner');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar dashboard padrão
CREATE TRIGGER create_default_dashboard_trigger
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_dashboard();

-- Função para aceitar convite
CREATE OR REPLACE FUNCTION accept_dashboard_invitation(invitation_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  invitation_record RECORD;
BEGIN
  -- Buscar convite
  SELECT * INTO invitation_record
  FROM dashboard_invitations
  WHERE id = invitation_id
    AND invitee_id = auth.uid()
    AND status = 'pending'
    AND expires_at > NOW();
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Adicionar usuário ao dashboard
  INSERT INTO user_dashboards (user_id, dashboard_id, role)
  VALUES (invitation_record.invitee_id, invitation_record.dashboard_id, 'member')
  ON CONFLICT (user_id, dashboard_id) DO NOTHING;
  
  -- Atualizar status do convite
  UPDATE dashboard_invitations
  SET status = 'accepted', updated_at = NOW()
  WHERE id = invitation_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;