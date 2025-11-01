-- Execute este SQL no Supabase SQL Editor para permitir registro de usuários:

-- Primeiro, vamos remover as políticas restritivas da tabela users
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Criar políticas mais permissivas para permitir registro
CREATE POLICY "Allow user registration" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id OR auth.uid() IS NULL);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Também precisamos permitir criação de dashboards para novos usuários
DROP POLICY IF EXISTS "Users can create dashboards" ON dashboards;
CREATE POLICY "Users can create dashboards" ON dashboards
  FOR INSERT WITH CHECK (true);

-- E permitir inserção na tabela user_dashboards
DROP POLICY IF EXISTS "Users can view own dashboard relationships" ON user_dashboards;
CREATE POLICY "Allow dashboard relationship creation" ON user_dashboards
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own dashboard relationships" ON user_dashboards
  FOR SELECT USING (user_id = auth.uid() OR auth.uid() IS NULL);