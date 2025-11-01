import React, { useState, useMemo } from "react";
import { Transaction } from "../utils/types";
import { formatCurrency, formatDate } from "../utils/helpers";
import { ICONS } from "../constants";
import Pagination from "./Pagination";

interface TransactionTableProps {
  transactions: Transaction[];
  title: string;
  itemsPerPage?: number;
  onEditTransaction?: (transaction: Transaction) => void;
  onDeleteTransaction?: (transactionId: string) => void;
  onPayInstallment?: (transaction: Transaction) => void;
}

const TransactionRow: React.FC<{
  transaction: Transaction;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transactionId: string) => void;
  handlePayInstallment?: (transaction: Transaction) => void;
}> = ({ transaction, onEdit, onDelete, handlePayInstallment }) => {
  const isExpense = transaction.type === "expense";
  const amountClass = isExpense ? "text-rose-600" : "text-emerald-600";

  const statusBadge =
    transaction.status === "completed"
      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
      : "bg-amber-50 text-amber-700 border border-amber-200";

  const isInstallment =
    transaction.installments && transaction.installments > 1;

  const canPayNextInstallment =
    isInstallment &&
    transaction.currentInstallment !== undefined &&
    transaction.currentInstallment < transaction.installments &&
    transaction.status !== "completed" &&
    transaction.type === "expense";

  return (
    <>
      <tr className="hover:bg-gray-50 transition hidden sm:table-row border-b border-gray-100">
        <td className="py-4 px-4">
          <div className="flex flex-col">
            <div className="font-medium text-gray-900 flex items-center gap-2">
              {transaction.description}
              {isInstallment && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  {transaction.currentInstallment}/{transaction.installments}
                </span>
              )}
            </div>
            <div className="text-sm text-gray-500 mt-0.5">
              {transaction.category}
            </div>
          </div>
        </td>
        <td className="py-4 px-4 text-sm text-gray-600 whitespace-nowrap">
          {formatDate(transaction.date)}
        </td>
        <td className="py-4 px-4">
          <div className="flex flex-col items-end">
            <span className={`font-semibold text-base ${amountClass}`}>
              {isExpense ? "−" : "+"} {formatCurrency(transaction.amount)}
            </span>
            {isInstallment && (
              <div className="text-xs text-gray-500 mt-1 text-right">
                <div>Total: {formatCurrency(transaction.totalAmount || 0)}</div>
                <div className="text-amber-600 font-medium">
                  Falta: {formatCurrency(transaction.remainingAmount || 0)}
                </div>
              </div>
            )}
          </div>
        </td>
        <td className="py-4 px-4 text-sm text-gray-600">
          {transaction.account}
        </td>
        <td className="py-4 px-4">
          <span
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${statusBadge}`}
          >
            {transaction.status === "completed" ? "Pago" : "Pendente"}
          </span>
        </td>
        <td className="py-4 px-4">
          <div className="flex items-center gap-2 justify-end">
            {canPayNextInstallment && handlePayInstallment && (
              <button
                onClick={() => handlePayInstallment(transaction)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition shadow-sm hover:shadow active:scale-95"
              >
                Pagar
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => onEdit(transaction)}
                className="text-gray-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition"
              >
                {ICONS.edit}
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(transaction.id)}
                className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition"
              >
                {ICONS.trash}
              </button>
            )}
          </div>
        </td>
      </tr>

      <tr className="sm:hidden">
        <td colSpan={6} className="p-0">
          <div className="p-4 border-b border-gray-100 hover:bg-gray-50 transition">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 mb-1 flex items-center gap-2 flex-wrap">
                  <span className="truncate">{transaction.description}</span>
                  {isInstallment && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 flex-shrink-0">
                      {transaction.currentInstallment}/
                      {transaction.installments}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  {transaction.category}
                </div>
              </div>
              <span
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold ml-2 flex-shrink-0 ${statusBadge}`}
              >
                {transaction.status === "completed" ? "Pago" : "Pendente"}
              </span>
            </div>

            <div className="flex items-end justify-between mb-3">
              <div className="flex flex-col">
                <span className={`font-bold text-xl ${amountClass}`}>
                  {isExpense ? "−" : "+"} {formatCurrency(transaction.amount)}
                </span>
                {isInstallment && (
                  <div className="text-xs text-gray-500 mt-1.5 space-y-0.5">
                    <div>
                      Total: {formatCurrency(transaction.totalAmount || 0)}
                    </div>
                    <div className="text-amber-600 font-medium">
                      Faltam: {formatCurrency(transaction.remainingAmount || 0)}
                    </div>
                  </div>
                )}
              </div>
              <div className="text-right text-sm text-gray-600 flex-shrink-0">
                <div>{formatDate(transaction.date)}</div>
                <div className="text-xs mt-0.5">{transaction.account}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
              {canPayNextInstallment && handlePayInstallment && (
                <button
                  onClick={() => handlePayInstallment(transaction)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition shadow-sm hover:shadow-md active:scale-95"
                >
                  Pagar Parcela
                </button>
              )}
              <div className="flex gap-2">
                {onEdit && (
                  <button
                    onClick={() => onEdit(transaction)}
                    className="text-gray-400 hover:text-blue-600 p-2.5 rounded-lg hover:bg-blue-50 transition active:bg-blue-100"
                  >
                    {ICONS.edit}
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(transaction.id)}
                    className="text-gray-400 hover:text-red-600 p-2.5 rounded-lg hover:bg-red-50 transition active:bg-red-100"
                  >
                    {ICONS.trash}
                  </button>
                )}
              </div>
            </div>
          </div>
        </td>
      </tr>
    </>
  );
};

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  title,
  itemsPerPage = 10,
  onEditTransaction,
  onDeleteTransaction,
  onPayInstallment,
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return transactions.slice(startIndex, startIndex + itemsPerPage);
  }, [transactions, currentPage, itemsPerPage]);

  const totalPages = Math.max(1, Math.ceil(transactions.length / itemsPerPage));

  return (
    <div className="rounded-2xl bg-white shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {transactions.length > 0 && (
          <p className="text-sm text-gray-500 mt-0.5">
            {transactions.length}{" "}
            {transactions.length === 1 ? "transação" : "transações"}
          </p>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="hidden sm:table-header-group bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Descrição
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Data
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Valor
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Conta
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedTransactions.length > 0 ? (
              paginatedTransactions.map((t) => (
                <TransactionRow
                  key={t.id}
                  transaction={t}
                  onEdit={onEditTransaction}
                  onDelete={onDeleteTransaction}
                  handlePayInstallment={onPayInstallment}
                />
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center py-12">
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <svg
                      className="w-16 h-16 mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <p className="text-lg font-medium">
                      Nenhuma transação encontrada
                    </p>
                    <p className="text-sm mt-1">
                      Adicione uma nova transação para começar
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {transactions.length > itemsPerPage && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
};

export default TransactionTable;
