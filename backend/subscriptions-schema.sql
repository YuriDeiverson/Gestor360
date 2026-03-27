-- =============================================================================
-- Tabela SUBSCRIPTIONS (Contas / assinaturas mensais)
-- =============================================================================
-- Como aplicar no Supabase:
--   1. Dashboard do projeto → SQL → New query
--   2. Cole este ficheiro inteiro e clique em Run
--   3. Confirma em Table Editor que apareceu "subscriptions"
--
-- Requisitos: tabelas `dashboards` e `cards` já existirem (como no teu projeto).
-- =============================================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id UUID NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  billing_day INT NOT NULL CHECK (billing_day >= 1 AND billing_day <= 31),
  image_url TEXT,
  icon_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_dashboard_id ON subscriptions(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_card_id ON subscriptions(card_id);

COMMENT ON TABLE subscriptions IS 'Assinaturas recorrentes (streaming, software, etc.) — aba Contas';
COMMENT ON COLUMN subscriptions.billing_day IS 'Dia do mês em que a cobrança costuma aparecer na fatura';
COMMENT ON COLUMN subscriptions.icon_key IS 'Chave do preset no frontend (ex.: netflix, figma)';
COMMENT ON COLUMN subscriptions.image_url IS 'Legado; logos vêm de subscriptionPresets.ts no frontend';

-- =============================================================================
-- Row Level Security (opcional — útil se usares o cliente Supabase no browser)
-- O backend Node com service_role ignora RLS; estas policies protegem acesso direto.
-- =============================================================================
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subscriptions_select" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_insert" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_update" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_delete" ON subscriptions;

CREATE POLICY "subscriptions_select" ON subscriptions
  FOR SELECT USING (
    dashboard_id IN (
      SELECT dashboard_id FROM user_dashboards WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "subscriptions_insert" ON subscriptions
  FOR INSERT WITH CHECK (
    dashboard_id IN (
      SELECT dashboard_id FROM user_dashboards WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "subscriptions_update" ON subscriptions
  FOR UPDATE USING (
    dashboard_id IN (
      SELECT dashboard_id FROM user_dashboards WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "subscriptions_delete" ON subscriptions
  FOR DELETE USING (
    dashboard_id IN (
      SELECT dashboard_id FROM user_dashboards WHERE user_id = auth.uid()
    )
  );
