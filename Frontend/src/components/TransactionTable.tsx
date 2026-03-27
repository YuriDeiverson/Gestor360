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

  const statusStyle: React.CSSProperties =
    transaction.status === "completed"
      ? { backgroundColor: 'var(--success-bg)', color: 'var(--success)', border: '1px solid var(--success)' }
      : { backgroundColor: 'var(--warning-bg)', color: 'var(--warning)', border: '1px solid var(--warning)' };

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
      <tr
        className="transition hidden sm:table-row"
        style={{ borderBottom: '1px solid var(--border)' }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--card-hover)'; }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; }}
      >
        {/* Data */}
        <td className="py-4 px-4 text-sm whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
          {formatDate(transaction.date)}
        </td>

        {/* Descrição */}
        <td className="py-4 px-4">
          <div className="font-medium flex items-center gap-2" style={{ color: 'var(--text)' }}>
            {transaction.description}
            {isInstallment && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium"
                style={{ backgroundColor: 'var(--primary-bg)', color: 'var(--primary)', border: '1px solid var(--primary)' }}
              >
                {transaction.currentInstallment}/{transaction.installments}
                {transaction.status === "pending" && (
                  <span className="ml-1" style={{ color: 'var(--warning)' }}>
                    ({(transaction.installments - (transaction.currentInstallment || 0))} restantes)
                  </span>
                )}
              </span>
            )}
          </div>
        </td>

        {/* Categoria */}
        <td className="py-4 px-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
          {transaction.category}
        </td>

        {/* Conta */}
        <td className="py-4 px-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
          {transaction.method === "Cartão de Crédito" ? (transaction.cardName || "Cartão") : transaction.account}
        </td>

        {/* Cartão */}
        <td className="py-4 px-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
          {transaction.cardName || "-"}
        </td>

        {/* Valor */}
        <td className="py-4 px-4 text-right">
          <span
            className="font-semibold text-base"
            style={{ color: isExpense ? 'var(--danger)' : 'var(--success)' }}
          >
            {isExpense ? "−" : "+"} {formatCurrency(transaction.amount)}
          </span>
          {isInstallment && (
            <div className="text-xs mt-1 text-right" style={{ color: 'var(--text-muted)' }}>
              <div>Total: {formatCurrency(transaction.totalAmount || 0)}</div>
              <div className="font-medium" style={{ color: 'var(--warning)' }}>
                Falta: {formatCurrency(transaction.remainingAmount || 0)}
              </div>
            </div>
          )}
        </td>

        {/* Status */}
        <td className="py-4 px-4">
          <span
            className="px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={statusStyle}
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
                className="text-white px-3 py-1.5 rounded-lg text-xs font-medium transition active:scale-95"
                style={{ backgroundColor: 'var(--primary)', boxShadow: 'var(--shadow-sm)' }}
                onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(0.9)'; }}
                onMouseLeave={e => { e.currentTarget.style.filter = ''; }}
              >
                Pagar
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => onEdit(transaction)}
                className="p-1.5 rounded-lg transition"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.backgroundColor = 'var(--primary-bg)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.backgroundColor = ''; }}
              >
                {ICONS.edit}
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(transaction.id)}
                className="p-1.5 rounded-lg transition"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.backgroundColor = 'var(--danger-bg)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.backgroundColor = ''; }}
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
          <div
            className="p-3 sm:p-4 transition space-y-3"
            style={{ borderBottom: '1px solid var(--border)' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--card-hover)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; }}
          >
            <div className="flex justify-between items-start gap-2">
              <div className="font-medium flex-1 min-w-0" style={{ color: 'var(--text)' }}>
                <div className="truncate">{transaction.description}</div>
                {isInstallment && (
                  <span
                    className="ml-0 mt-1 inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium"
                    style={{ backgroundColor: 'var(--primary-bg)', color: 'var(--primary)', border: '1px solid var(--primary)' }}
                  >
                    {transaction.currentInstallment}/{transaction.installments}
                  </span>
                )}
              </div>
              <span
                className="px-2 py-1 rounded-lg text-xs font-semibold flex-shrink-0"
                style={statusStyle}
              >
                {transaction.status === "completed" ? "Pago" : "Pendente"}
              </span>
            </div>
            <div className="text-sm space-y-1" style={{ color: 'var(--text-secondary)' }}>
              <div className="flex justify-between">
                <span>Data:</span>
                <span className="font-medium">{formatDate(transaction.date)}</span>
              </div>
              <div className="flex justify-between">
                <span>Valor:</span>
                <span
                  className="font-semibold"
                  style={{ color: isExpense ? 'var(--danger)' : 'var(--success)' }}
                >
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
                <div className="text-xs p-2 rounded-lg" style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-secondary)' }}>
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span>{formatCurrency(transaction.totalAmount || 0)}</span>
                  </div>
                  <div className="flex justify-between font-medium" style={{ color: 'var(--warning)' }}>
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
                  className="flex-1 text-white px-3 py-2 rounded-lg text-sm font-medium transition active:scale-95"
                  style={{ backgroundColor: 'var(--primary)', boxShadow: 'var(--shadow-sm)' }}
                  onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(0.9)'; }}
                  onMouseLeave={e => { e.currentTarget.style.filter = ''; }}
                >
                  Pagar Parcela
                </button>
              )}
              {onEdit && (
                <button
                  onClick={() => onEdit(transaction)}
                  className="p-2 rounded-lg transition"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.backgroundColor = 'var(--primary-bg)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.backgroundColor = ''; }}
                >
                  {ICONS.edit}
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(transaction.id)}
                  className="p-2 rounded-lg transition"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.backgroundColor = 'var(--danger-bg)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.backgroundColor = ''; }}
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
    <div
      className="rounded-xl sm:rounded-2xl overflow-hidden"
      style={{ backgroundColor: 'var(--card)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}
    >
      <div
        className="px-4 sm:px-6 py-3 sm:py-4"
        style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-secondary)' }}
      >
        <h3 className="text-base sm:text-lg font-semibold" style={{ color: 'var(--text)' }}>{title}</h3>
        {transactions.length > 0 && (
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {transactions.length}{" "}
            {transactions.length === 1 ? "transação" : "transações"}
          </p>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead
            className="hidden sm:table-header-group"
            style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}
          >
            <tr>
              <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                Data
              </th>
              <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                Descrição
              </th>
              <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider hidden lg:table-cell" style={{ color: 'var(--text-secondary)' }}>
                Categoria
              </th>
              <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider hidden md:table-cell" style={{ color: 'var(--text-secondary)' }}>
                Conta
              </th>
              <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider hidden lg:table-cell" style={{ color: 'var(--text-secondary)' }}>
                Cartão
              </th>
              <th className="px-3 sm:px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                Valor
              </th>
              <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider hidden sm:table-cell" style={{ color: 'var(--text-secondary)' }}>
                Status
              </th>
              <th className="px-3 sm:px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
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
                <td colSpan={8} className="text-center py-8 sm:py-12 text-sm" style={{ color: 'var(--text-muted)' }}>
                  Nenhuma transação encontrada
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {transactions.length > itemsPerPage && (
        <div
          className="px-4 sm:px-6 py-3 sm:py-4"
          style={{ borderTop: '1px solid var(--border)', backgroundColor: 'var(--bg-secondary)' }}
        >
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
