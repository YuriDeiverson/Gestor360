-- Execute este SQL para permitir registro de usuários
-- (desabilita RLS temporariamente para a tabela users)

-- Remover políticas RLS temporariamente
DROP POLICY IF EXISTS users_policy ON users;

-- Criar política que permite inserção de novos usuários
CREATE POLICY users_select_policy ON users FOR SELECT USING (true);
CREATE POLICY users_insert_policy ON users FOR INSERT WITH CHECK (true);
CREATE POLICY users_update_policy ON users FOR UPDATE USING (id = auth.uid());
CREATE POLICY users_delete_policy ON users FOR DELETE USING (id = auth.uid());

-- Ajustar políticas para dashboard_invitations
DROP POLICY IF EXISTS invitations_policy ON dashboard_invitations;
CREATE POLICY invitations_select_policy ON dashboard_invitations FOR SELECT USING (true);
CREATE POLICY invitations_insert_policy ON dashboard_invitations FOR INSERT WITH CHECK (true);
CREATE POLICY invitations_update_policy ON dashboard_invitations FOR UPDATE USING (
    invitee_id = auth.uid() OR inviter_id = auth.uid()
);
CREATE POLICY invitations_delete_policy ON dashboard_invitations FOR DELETE USING (
    invitee_id = auth.uid() OR inviter_id = auth.uid()
);

-- Ou, alternativamente, desabilitar RLS completamente para teste:
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE dashboards DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_dashboards DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE dashboard_invitations DISABLE ROW LEVEL SECURITY;