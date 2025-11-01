-- Execute este SQL no Supabase SQL Editor para permitir registro temporariamente:

-- Desabilitar RLS temporariamente para permitir registro
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE dashboards DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_dashboards DISABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_invitations DISABLE ROW LEVEL SECURITY;

-- Opcional: também desabilitar para as outras tabelas se necessário
-- ALTER TABLE transacoes DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE metas DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE orcamentos DISABLE ROW LEVEL SECURITY;