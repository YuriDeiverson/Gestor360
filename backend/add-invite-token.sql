-- Adicionar token único para convites por email
ALTER TABLE dashboard_invitations ADD COLUMN IF NOT EXISTS invite_token UUID DEFAULT gen_random_uuid();

-- Criar índice para o token
CREATE INDEX IF NOT EXISTS idx_dashboard_invitations_token ON dashboard_invitations(invite_token);

-- Atualizar tokens existentes
UPDATE dashboard_invitations SET invite_token = gen_random_uuid() WHERE invite_token IS NULL;