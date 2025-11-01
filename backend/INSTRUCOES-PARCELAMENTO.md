# Atualização do Banco de Dados - Suporte a Parcelamento

## ⚠️ AÇÃO NECESSÁRIA

O sistema de parcelamento foi implementado, mas o banco de dados precisa ser atualizado com as novas colunas.

## Passos para Atualizar:

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Copie e execute o script `add-installments-columns.sql`

## O que será adicionado:

As seguintes colunas serão adicionadas na tabela `transacoes`:

- `installments` - Número total de parcelas
- `currentInstallment` - Parcela atual
- `totalAmount` - Valor total da compra
- `remainingAmount` - Valor restante a pagar
- `nextPaymentDate` - Data do próximo pagamento
- `method` - Método de pagamento
- `account` - Conta utilizada
- `status` - Status da transação (completed/pending)

## Após executar o script:

✅ O botão de expandir aparecerá nas transações parceladas
✅ Será possível criar transações parceladas
✅ O sistema mostrará o progresso das parcelas (ex: 3/12)
✅ Detalhes completos das parcelas estarão disponíveis

## Nota:

Este script é idempotente (pode ser executado múltiplas vezes sem problemas).
