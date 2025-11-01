import React from "react";
import { createRoot } from "react-dom/client";
import InstallmentDemo from "./InstallmentDemo";

// Teste da funcionalidade de expansão
const TestApp: React.FC = () => {
  return (
    <div style={{ padding: "20px" }}>
      <div
        style={{
          backgroundColor: "#f3f4f6",
          padding: "16px",
          borderRadius: "8px",
          marginBottom: "20px",
          border: "1px solid #d1d5db",
        }}
      >
        <h1 style={{ color: "#1f2937", marginBottom: "10px" }}>
          🧪 Teste - Expansão de Parcelas
        </h1>
        <div style={{ fontSize: "14px", color: "#6b7280" }}>
          <p>✅ Procure por transações com badges azuis (ex: 1/12)</p>
          <p>✅ Clique no botão "Detalhes" para expandir</p>
          <p>✅ Veja as informações completas das parcelas</p>
        </div>
      </div>
      <InstallmentDemo />
    </div>
  );
};

// Se há um container root, use ele, senão crie um
const container =
  document.getElementById("root") ||
  (() => {
    const testContainer = document.createElement("div");
    testContainer.id = "test-root";
    document.body.appendChild(testContainer);
    return testContainer;
  })();

const root = createRoot(container);
root.render(<TestApp />);

// Log para verificar se o arquivo foi carregado
console.log("🧪 Teste de Expansão de Parcelas carregado!");

export default TestApp;
