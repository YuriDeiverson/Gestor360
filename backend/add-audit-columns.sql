-- Adicionar colunas de auditoria nas tabelas existentes

-- Adicionar colunas na tabela transacoes
ALTER TABLE transacoes 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);

-- Adicionar colunas na tabela metas
ALTER TABLE metas 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);

-- Adicionar colunas na tabela orcamentos
ALTER TABLE orcamentos 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_transacoes_created_by ON transacoes(created_by);
CREATE INDEX IF NOT EXISTS idx_metas_created_by ON metas(created_by);
CREATE INDEX IF NOT EXISTS idx_orcamentos_created_by ON orcamentos(created_by);
