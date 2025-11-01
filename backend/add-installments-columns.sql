-- Adicionar colunas de parcelamento na tabela transacoes

-- Adicionar colunas de parcelamento
ALTER TABLE transacoes 
ADD COLUMN IF NOT EXISTS installments INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS currentinstallment INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS totalamount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS remainingamount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS nextpaymentdate DATE,
ADD COLUMN IF NOT EXISTS method VARCHAR(50) DEFAULT 'PIX',
ADD COLUMN IF NOT EXISTS account VARCHAR(100) DEFAULT 'Conta Principal',
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('completed', 'pending'));

-- Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_transacoes_installments ON transacoes(installments);
CREATE INDEX IF NOT EXISTS idx_transacoes_status ON transacoes(status);
CREATE INDEX IF NOT EXISTS idx_transacoes_nextpaymentdate ON transacoes(nextpaymentdate);

-- Comentários nas colunas
COMMENT ON COLUMN transacoes.installments IS 'Número total de parcelas (1 = à vista)';
COMMENT ON COLUMN transacoes.currentinstallment IS 'Parcela atual';
COMMENT ON COLUMN transacoes.totalamount IS 'Valor total da compra parcelada';
COMMENT ON COLUMN transacoes.remainingamount IS 'Valor restante a pagar';
COMMENT ON COLUMN transacoes.nextpaymentdate IS 'Data do próximo pagamento';
COMMENT ON COLUMN transacoes.method IS 'Método de pagamento (Cartão de Crédito, Débito, PIX)';
COMMENT ON COLUMN transacoes.account IS 'Conta utilizada';
COMMENT ON COLUMN transacoes.status IS 'Status da transação (completed, pending)';
