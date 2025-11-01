import React from "react";
import { createRoot } from "react-dom/client";
import InstallmentDemo from "./InstallmentDemo";
import "../index.css"; // Certifique-se de que o Tailwind CSS está sendo carregado

// Teste da funcionalidade de expansão
const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<InstallmentDemo />);
} else {
  // Criar container para teste
  const testContainer = document.createElement("div");
  testContainer.id = "test-root";
  testContainer.style.padding = "20px";
  document.body.appendChild(testContainer);

  const root = createRoot(testContainer);
  root.render(<InstallmentDemo />);
}

// Log para verificar se o arquivo foi carregado
console.log("🧪 Teste de Expansão de Parcelas carregado!");
console.log("✅ Procure por transações com badges azuis (ex: 1/12)");
console.log('✅ Clique no botão "Detalhes" para expandir');
console.log("✅ Veja as informações completas das parcelas");
