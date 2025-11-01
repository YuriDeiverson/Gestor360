// Script para limpar filtros salvos no localStorage e forçar reinicialização
// Execute este código no console do navegador se necessário

localStorage.removeItem("filters");
console.log("✅ Filtros limpos! Recarregue a página.");

// Ou rode este código para verificar os filtros atuais:
// console.log('Filtros atuais:', JSON.parse(localStorage.getItem('filters') || '{}'));
