-- Vincula transações geradas a partir de assinaturas (Contas).
-- Execute no SQL Editor do Supabase após a tabela `subscriptions` existir.

ALTER TABLE transacoes
  ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_transacoes_subscription_id ON transacoes(subscription_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_transacoes_one_subscription
  ON transacoes(subscription_id)
  WHERE subscription_id IS NOT NULL;

COMMENT ON COLUMN transacoes.subscription_id IS 'Se preenchido, transação criada automaticamente pela assinatura (Contas)';
