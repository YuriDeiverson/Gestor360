/**
 * Script de teste para adicionar uma transação parcelada diretamente no localStorage
 * Para usar: copie e cole no console do navegador
 */

// Transação de teste parcelada
const testTransaction = {
  id: "test-installment-" + Date.now(),
  description: "Teste Compra Parcelada",
  amount: 250.0,
  totalAmount: 3000.0,
  remainingAmount: 2750.0,
  type: "expense",
  category: "Teste",
  date: "2024-11-01",
  account: "Cartão de Crédito",
  status: "pending",
  industry: "Teste",
  method: "Cartão de Crédito",
  installments: 12,
  currentInstallment: 1,
  nextPaymentDate: "2024-12-01",
};

// Adicionar ao localStorage
function addTestTransaction() {
  try {
    // Pegar transações existentes
    const existingTransactions = JSON.parse(
      localStorage.getItem("transactions") || "[]",
    );

    // Adicionar nova transação
    existingTransactions.push(testTransaction);

    // Salvar de volta
    localStorage.setItem("transactions", JSON.stringify(existingTransactions));

    console.log("✅ Transação de teste adicionada:", testTransaction);
    console.log("🔄 Recarregue a página para ver a transação");

    return true;
  } catch (error) {
    console.error("❌ Erro ao adicionar transação de teste:", error);
    return false;
  }
}

// Executar
console.log("🧪 Adicionando transação de teste parcelada...");
addTestTransaction();

// Também criar função para remover
function removeTestTransaction() {
  try {
    const existingTransactions = JSON.parse(
      localStorage.getItem("transactions") || "[]",
    );
    const filteredTransactions = existingTransactions.filter(
      (t) => !t.id.startsWith("test-installment-"),
    );
    localStorage.setItem("transactions", JSON.stringify(filteredTransactions));
    console.log("🗑️ Transações de teste removidas");
    return true;
  } catch (error) {
    console.error("❌ Erro ao remover transações de teste:", error);
    return false;
  }
}

// Disponibilizar globalmente
window.addTestTransaction = addTestTransaction;
window.removeTestTransaction = removeTestTransaction;

console.log("🎯 Para testar:");
console.log("1. Execute addTestTransaction() no console");
console.log("2. Recarregue a página");
console.log("3. Vá para a página de Transações");
console.log('4. Procure por "Teste Compra Parcelada" com badge [1/12]');
console.log('5. Clique no botão "Detalhes" para expandir');
console.log("");
console.log("Para limpar: execute removeTestTransaction()");
