-- Criar tabela de categorias se não existir
CREATE TABLE IF NOT EXISTS categorias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  icone TEXT,
  cor TEXT,
  tipo TEXT CHECK (tipo IN ('income', 'expense', 'both')) DEFAULT 'expense',
  descricao TEXT,
  dashboard_id UUID NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_categorias_dashboard_id ON categorias(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_categorias_tipo ON categorias(tipo);

-- Adicionar política RLS
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam categorias dos dashboards que têm acesso
CREATE POLICY "Users can view categories in their dashboards" ON categorias
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_dashboards
      WHERE user_dashboards.dashboard_id = categorias.dashboard_id
      AND user_dashboards.user_id = auth.uid()
    )
  );

-- Política para permitir que usuários criem categorias nos dashboards que têm acesso
CREATE POLICY "Users can create categories in their dashboards" ON categorias
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_dashboards
      WHERE user_dashboards.dashboard_id = categorias.dashboard_id
      AND user_dashboards.user_id = auth.uid()
    )
  );

-- Política para permitir que usuários atualizem categorias nos dashboards que têm acesso
CREATE POLICY "Users can update categories in their dashboards" ON categorias
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_dashboards
      WHERE user_dashboards.dashboard_id = categorias.dashboard_id
      AND user_dashboards.user_id = auth.uid()
    )
  );

-- Política para permitir que usuários deletem categorias nos dashboards que têm acesso
CREATE POLICY "Users can delete categories in their dashboards" ON categorias
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_dashboards
      WHERE user_dashboards.dashboard_id = categorias.dashboard_id
      AND user_dashboards.user_id = auth.uid()
    )
  );
