// Script de teste simples para verificar a lógica do botão de expandir

const testTransaction = {
  id: "test_installment_1",
  date: "2024-10-15",
  description: "Notebook Dell - TESTE",
  amount: 416.67,
  type: "expense",
  status: "pending",
  account: "Cartão de Crédito",
  industry: "Tecnologia",
  method: "Cartão de Crédito",
  category: "Tecnologia",
  installments: 12,
  currentInstallment: 3,
  totalAmount: 5000,
  remainingAmount: 3750,
  nextPaymentDate: "2024-11-15",
};

const testNormalTransaction = {
  id: "test_normal_1",
  date: "2024-11-01",
  description: "Supermercado",
  amount: 150.5,
  type: "expense",
  status: "completed",
  account: "Conta Corrente",
  industry: "Alimentação",
  method: "Débito",
  category: "Alimentação",
};

console.log("=== TESTE DA LÓGICA DO BOTÃO ===");

// Teste 1: Transação parcelada
const isInstallment1 =
  testTransaction.installments && testTransaction.installments > 1;
console.log("1. Transação parcelada:", {
  description: testTransaction.description,
  installments: testTransaction.installments,
  isInstallment: isInstallment1,
  shouldShowButton: isInstallment1 ? "SIM - Botão deve aparecer" : "NÃO",
});

// Teste 2: Transação normal
const isInstallment2 =
  testNormalTransaction.installments && testNormalTransaction.installments > 1;
console.log("2. Transação normal:", {
  description: testNormalTransaction.description,
  installments: testNormalTransaction.installments,
  isInstallment: isInstallment2,
  shouldShowButton: isInstallment2 ? "SIM" : "NÃO - Botão não deve aparecer",
});

console.log("=== VERIFICAÇÃO CONCLUÍDA ===");
console.log(
  "Se você não vê o botão azul na primeira transação, pode haver um problema de CSS ou renderização.",
);
