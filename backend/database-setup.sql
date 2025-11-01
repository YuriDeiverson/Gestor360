-- SQL para criar as tabelas no Supabase
-- Execute estes comandos no SQL Editor do Supabase

-- Tabela de transações
CREATE TABLE IF NOT EXISTS transacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  descricao TEXT NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  categoria VARCHAR(100) NOT NULL,
  data DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de metas
CREATE TABLE IF NOT EXISTS metas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  valor_alvo DECIMAL(10,2) NOT NULL,
  valor_atual DECIMAL(10,2) DEFAULT 0,
  data_limite DATE,
  descricao TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de orçamentos
CREATE TABLE IF NOT EXISTS orcamentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  categoria VARCHAR(100) NOT NULL,
  valor_limite DECIMAL(10,2) NOT NULL,
  valor_gasto DECIMAL(10,2) DEFAULT 0,
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  ano INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(categoria, mes, ano)
);

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at automaticamente
CREATE TRIGGER update_transacoes_updated_at 
    BEFORE UPDATE ON transacoes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_metas_updated_at 
    BEFORE UPDATE ON metas 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orcamentos_updated_at 
    BEFORE UPDATE ON orcamentos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_transacoes_data ON transacoes(data);
CREATE INDEX IF NOT EXISTS idx_transacoes_categoria ON transacoes(categoria);
CREATE INDEX IF NOT EXISTS idx_transacoes_tipo ON transacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_metas_data_limite ON metas(data_limite);
CREATE INDEX IF NOT EXISTS idx_orcamentos_mes_ano ON orcamentos(mes, ano);

-- Habilitar Row Level Security (RLS)
ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE metas ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcamentos ENABLE ROW LEVEL SECURITY;

-- Políticas para permitir acesso público (para desenvolvimento)
-- ATENÇÃO: Em produção, você deve configurar políticas mais restritivas
CREATE POLICY "Enable read access for all users" ON transacoes FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON transacoes FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON transacoes FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON transacoes FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON metas FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON metas FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON metas FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON metas FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON orcamentos FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON orcamentos FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON orcamentos FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON orcamentos FOR DELETE USING (true);