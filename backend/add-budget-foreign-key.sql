-- Adicionar Foreign Key entre transacoes.budget_id e budgets.id
-- Isso permitirá que o Supabase faça joins automáticos no futuro

-- PASSO 1: Limpar dados inconsistentes
-- Define budget_id como NULL para transações que referenciam budgets que não existem
DO $$
DECLARE
  inconsistent_count INTEGER;
BEGIN
  -- Contar transações inconsistentes
  SELECT COUNT(*) INTO inconsistent_count
  FROM transacoes t
  WHERE t.budget_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM budgets b WHERE b.id = t.budget_id
  );
  
  IF inconsistent_count > 0 THEN
    -- Atualizar transações com budget_id inválido para NULL
    UPDATE transacoes
    SET budget_id = NULL
    WHERE budget_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM budgets b WHERE b.id = transacoes.budget_id
    );
    
    RAISE NOTICE 'Atualizadas % transações com budget_id inválido (definidas como NULL)', inconsistent_count;
  ELSE
    RAISE NOTICE 'Todas as transações têm budget_id válido';
  END IF;
END $$;

-- PASSO 2: Verificar se a constraint já existe antes de criar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_transacoes_budget_id'
    AND table_name = 'transacoes'
  ) THEN
    -- Adicionar foreign key constraint
    ALTER TABLE transacoes
    ADD CONSTRAINT fk_transacoes_budget_id
    FOREIGN KEY (budget_id) 
    REFERENCES budgets(id) 
    ON DELETE SET NULL
    ON UPDATE CASCADE;
    
    RAISE NOTICE 'Foreign key fk_transacoes_budget_id criada com sucesso';
  ELSE
    RAISE NOTICE 'Foreign key fk_transacoes_budget_id já existe';
  END IF;
END $$;

-- Criar índice para melhor performance nas consultas com budget_id
CREATE INDEX IF NOT EXISTS idx_transacoes_budget_id ON transacoes(budget_id);

-- PASSO 3: Verificação final (opcional - apenas para confirmar)
-- Este comando apenas reporta o status final
DO $$
DECLARE
  inconsistent_count INTEGER;
  total_transacoes INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_transacoes FROM transacoes;
  SELECT COUNT(*) INTO inconsistent_count
  FROM transacoes t
  WHERE t.budget_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM budgets b WHERE b.id = t.budget_id
  );
  
  RAISE NOTICE 'Total de transações: %', total_transacoes;
  
  IF inconsistent_count > 0 THEN
    RAISE WARNING 'Ainda existem % transações com budget_id inválido', inconsistent_count;
  ELSE
    RAISE NOTICE 'Todas as transações têm budget_id válido ou NULL';
  END IF;
END $$;
