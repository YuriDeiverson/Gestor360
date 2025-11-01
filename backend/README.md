# Backend - Dashboard Financeiro

Este é o backend do Dashboard Financeiro, configurado com Supabase como banco de dados.

## Configuração

### 1. Configurar o Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta
2. Crie um novo projeto
3. Vá para Settings > API para obter suas credenciais

### 2. Configurar Variáveis de Ambiente

1. Copie o arquivo `.env` e configure suas credenciais:

```bash
# Configurações do Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anonima-aqui

# Porta do servidor
PORT=3000
```

### 3. Configurar o Banco de Dados

1. No painel do Supabase, vá para SQL Editor
2. Execute o script SQL que está no arquivo `database-setup.sql`
3. Isso criará todas as tabelas necessárias (transacoes, metas, orcamentos)

### 4. Instalar Dependências

```bash
npm install
```

### 5. Rodar o Servidor

Para desenvolvimento (com auto-reload):

```bash
npm run dev
```

Para produção:

```bash
npm run build
npm start
```

## Estrutura do Banco

### Tabelas Criadas:

- **transacoes**: Armazena todas as transações financeiras
- **metas**: Armazena as metas financeiras dos usuários
- **orcamentos**: Armazena os orçamentos por categoria

### Características:

- Todas as tabelas têm timestamps automáticos (created_at, updated_at)
- IDs são UUIDs gerados automaticamente
- Row Level Security (RLS) habilitado para segurança
- Índices criados para melhor performance

## API Endpoints

Todas as rotas mantêm a mesma interface anterior:

### Transações

- `GET /transacoes` - Lista todas as transações
- `POST /transacoes` - Cria nova transação
- `PUT /transacoes/:id` - Atualiza transação
- `DELETE /transacoes/:id` - Remove transação

### Metas

- `GET /metas` - Lista todas as metas
- `POST /metas` - Cria nova meta
- `PUT /metas/:id` - Atualiza meta
- `DELETE /metas/:id` - Remove meta

### Orçamentos

- `GET /orcamentos` - Lista todos os orçamentos
- `POST /orcamentos` - Cria novo orçamento
- `PUT /orcamentos/:id` - Atualiza orçamento
- `DELETE /orcamentos/:id` - Remove orçamento

## Migração dos Dados

Se você tinha dados anteriores no sistema em memória, eles foram zerados conforme solicitado.
O sistema agora usa o Supabase e todos os dados ficam persistidos no banco de dados em nuvem.

## Colaboração

Com o Supabase configurado, múltiplas pessoas podem usar o sistema simultaneamente,
pois todos os dados ficam centralizados no banco de dados em nuvem.
