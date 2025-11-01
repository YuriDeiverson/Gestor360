-- SQL simples para desabilitar RLS e permitir registro
-- Execute no Supabase SQL Editor:

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE dashboards DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_dashboards DISABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_invitations DISABLE ROW LEVEL SECURITY;