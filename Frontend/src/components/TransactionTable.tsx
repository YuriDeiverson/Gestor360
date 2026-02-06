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
        {/* Data */}
        <td className="py-4 px-4 text-sm text-gray-600 whitespace-nowrap">
          {formatDate(transaction.date)}
        </td>

        {/* Descrição */}
        <td className="py-4 px-4">
          <div className="font-medium text-gray-900 flex items-center gap-2">
            {transaction.description}
            {isInstallment && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                {transaction.currentInstallment}/{transaction.installments}
                {transaction.status === "pending" && (
                  <span className="ml-1 text-amber-600">
                    ({(transaction.installments - (transaction.currentInstallment || 0))} restantes)
                  </span>
                )}
              </span>
            )}
          </div>
        </td>

        {/* Categoria */}
        <td className="py-4 px-4 text-sm text-gray-600">
          {transaction.category}
        </td>

        {/* Conta */}
        <td className="py-4 px-4 text-sm text-gray-600">
          {transaction.method === "Cartão de Crédito" ? (transaction.cardName || "Cartão") : transaction.account}
        </td>

        {/* Cartão */}
        <td className="py-4 px-4 text-sm text-gray-600">
          {transaction.cardName || "-"}
        </td>

        {/* Valor */}
        <td className="py-4 px-4 text-right">
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
        </td>

        {/* Status */}
        <td className="py-4 px-4">
          <span
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${statusBadge}`}
          >
            {transaction.status === "completed" ? "Pago" : "Pendente"}
          </span>
        </td>

        {/* Ações */}
        <td className="py-4 px-4 text-right">
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

      {/* Mobile */}
      <tr className="sm:hidden">
        <td colSpan={7} className="p-0">
          <div className="p-3 sm:p-4 border-b border-gray-100 hover:bg-gray-50 transition space-y-3">
            <div className="flex justify-between items-start gap-2">
              <div className="font-medium text-gray-900 flex-1 min-w-0">
                <div className="truncate">{transaction.description}</div>
                {isInstallment && (
                  <span className="ml-0 mt-1 inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    {transaction.currentInstallment}/{transaction.installments}
                  </span>
                )}
              </div>
              <span
                className={`px-2 py-1 rounded-lg text-xs font-semibold flex-shrink-0 ${statusBadge}`}
              >
                {transaction.status === "completed" ? "Pago" : "Pendente"}
              </span>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <div className="flex justify-between">
                <span>Data:</span>
                <span className="font-medium">{formatDate(transaction.date)}</span>
              </div>
              <div className="flex justify-between">
                <span>Valor:</span>
                <span className={`font-semibold ${amountClass}`}>
                  {isExpense ? "−" : "+"} {formatCurrency(transaction.amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Conta:</span>
                <span className="truncate text-right max-w-[120px]">
                  {transaction.method === "Cartão de Crédito" ? (transaction.cardName || "Cartão") : transaction.account}
                </span>
              </div>
              {transaction.category && (
                <div className="flex justify-between">
                  <span>Categoria:</span>
                  <span className="truncate text-right max-w-[120px]">{transaction.category}</span>
                </div>
              )}
              {isInstallment && (
                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span>{formatCurrency(transaction.totalAmount || 0)}</span>
                  </div>
                  <div className="flex justify-between text-amber-600 font-medium">
                    <span>Falta:</span>
                    <span>{formatCurrency(transaction.remainingAmount || 0)}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              {canPayNextInstallment && handlePayInstallment && (
                <button
                  onClick={() => handlePayInstallment(transaction)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition shadow-sm hover:shadow-md active:scale-95"
                >
                  Pagar Parcela
                </button>
              )}
              {onEdit && (
                <button
                  onClick={() => onEdit(transaction)}
                  className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition"
                >
                  {ICONS.edit}
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(transaction.id)}
                  className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                >
                  {ICONS.trash}
                </button>
              )}
            </div>
          </div>
        </td>
      </tr>
    </>
  );
};

const TransactionTable: React.FC<TransactionTableProps> = ({
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
    <div className="rounded-xl sm:rounded-2xl bg-white shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">{title}</h3>
        {transactions.length > 0 && (
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            {transactions.length}{" "}
            {transactions.length === 1 ? "transação" : "transações"}
          </p>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="hidden sm:table-header-group bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Data
              </th>
              <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Descrição
              </th>
              <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">
                Categoria
              </th>
              <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">
                Conta
              </th>
              <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">
                Cartão
              </th>
              <th className="px-3 sm:px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Valor
              </th>
              <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">
                Status
              </th>
              <th className="px-3 sm:px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
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
                <td colSpan={8} className="text-center py-8 sm:py-12 text-sm text-gray-500">
                  Nenhuma transação encontrada
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {transactions.length > itemsPerPage && (
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 bg-gray-50">
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
