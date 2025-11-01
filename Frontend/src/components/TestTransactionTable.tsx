import React from "react";
import TransactionTable from "./TransactionTable";
import { Transaction } from "../utils/types";

// Transação de teste parcelada
const testTransactions: Transaction[] = [
  {
    id: "test_installment_1",
    date: "2024-10-15",
    description: "Notebook Dell - TESTE PARCELADO",
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
  },
  {
    id: "test_normal_1",
    date: "2024-11-01",
    description: "Supermercado - TESTE NORMAL",
    amount: 150.5,
    type: "expense",
    status: "completed",
    account: "Conta Corrente",
    industry: "Alimentação",
    method: "Débito",
    category: "Alimentação",
  },
];

const TestTransactionTable: React.FC = () => {
  const handleEdit = (transaction: Transaction) => {
    console.log("Editar:", transaction);
  };

  const handleDelete = (id: string) => {
    console.log("Deletar:", id);
  };

  const handlePayInstallment = (transaction: Transaction) => {
    console.log("Pagar parcela:", transaction);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Teste do Botão de Expandir</h1>
      <p className="mb-4 text-gray-600">
        A primeira transação é parcelada e deve mostrar o botão azul de
        expandir. A segunda é normal e não deve mostrar o botão.
      </p>

      <TransactionTable
        transactions={testTransactions}
        title="Transações de Teste"
        onEditTransaction={handleEdit}
        onDeleteTransaction={handleDelete}
        onPayInstallment={handlePayInstallment}
      />
    </div>
  );
};

export default TestTransactionTable;
