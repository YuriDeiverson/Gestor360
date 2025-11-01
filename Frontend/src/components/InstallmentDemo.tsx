import React, { useState } from "react";
import { TransactionTable } from "./TransactionTable";
import { Transaction } from "../utils/types";

const InstallmentDemo: React.FC = () => {
  const [transactions] = useState<Transaction[]>([
    {
      id: "1",
      description: "Compra Notebook Dell",
      amount: 500.0,
      totalAmount: 6000.0,
      remainingAmount: 5500.0,
      type: "expense",
      category: "Eletrônicos",
      date: "2024-11-01",
      account: "Cartão de Crédito",
      status: "pending",
      industry: "Tecnologia",
      method: "Cartão de Crédito",
      installments: 12,
      currentInstallment: 1,
      nextPaymentDate: "2024-12-01",
    },
    {
      id: "2",
      description: "Freelance Web Design",
      amount: 1500.0,
      type: "income",
      category: "Trabalho",
      date: "2024-11-01",
      account: "Conta Corrente",
      status: "completed",
      industry: "Tecnologia",
      method: "PIX",
    },
    {
      id: "3",
      description: "Curso de Programação",
      amount: 150.0,
      totalAmount: 1800.0,
      remainingAmount: 1650.0,
      type: "expense",
      category: "Educação",
      date: "2024-11-01",
      account: "Cartão de Crédito",
      status: "pending",
      industry: "Educação",
      method: "Cartão de Crédito",
      installments: 12,
      currentInstallment: 1,
      nextPaymentDate: "2024-12-01",
    },
  ]);

  const handlePayInstallment = async (transaction: Transaction) => {
    console.log("Pagando parcela de:", transaction.description);
    // Aqui seria feita a lógica de pagamento
    alert(`Parcela paga para: ${transaction.description}`);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Demo - Transações Parceladas Expandíveis
        </h1>

        <div className="bg-white rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-3">Funcionalidades:</h2>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>
              ✅ <strong>Expandir/Recolher:</strong> Clique no ícone de seta
              para ver detalhes das parcelas
            </li>
            <li>
              ✅ <strong>Progresso Visual:</strong> Barra de progresso mostrando
              parcelas pagas
            </li>
            <li>
              ✅ <strong>Detalhes Completos:</strong> Valor total, restante,
              próximo pagamento
            </li>
            <li>
              ✅ <strong>Botão de Pagamento:</strong> Aparece quando a parcela
              está vencida
            </li>
            <li>
              ✅ <strong>Responsivo:</strong> Layout adaptado para mobile e
              desktop
            </li>
          </ul>
        </div>

        <TransactionTable
          transactions={transactions}
          title="Transações com Parcelamento"
          onPayInstallment={handlePayInstallment}
        />
      </div>
    </div>
  );
};

export default InstallmentDemo;
