import React, { useState, useEffect } from "react";
import {
  Transaction,
  TransactionType,
  TransactionStatus,
  PaymentMethod,
  Category,
} from "../utils/types";
import { availableAccounts } from "../utils/mockData";
import { ICONS } from "../constants";
import Portal from "./Portal";

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEditTransaction: (transaction: Transaction) => void;
  transaction: Transaction;
  categories: Category[];
}

const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  isOpen,
  onClose,
  onEditTransaction,
  transaction,
  categories,
}) => {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [category, setCategory] = useState("");
  const [account, setAccount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("PIX");
  const [status, setStatus] = useState<TransactionStatus>("completed");

  // Carregar dados da transação quando o modal abrir
  useEffect(() => {
    if (isOpen && transaction) {
      setDescription(transaction.description);
      setAmount(transaction.amount.toString());
      setDate(transaction.date);
      setType(transaction.type);
      setCategory(transaction.category);
      setAccount(transaction.account);
      setMethod(transaction.method);
      setStatus(transaction.status);
    }
  }, [isOpen, transaction]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!description || !amount || !date || !category || !account) {
      alert("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    const editedTransaction: Transaction = {
      ...transaction,
      description,
      amount: parseFloat(amount),
      date,
      type,
      category,
      account,
      method,
      status,
    };

    onEditTransaction(editedTransaction);
    onClose();
  };

  const resetForm = () => {
    setDescription("");
    setAmount("");
    setDate("");
    setType("expense");
    setCategory("");
    setAccount("");
    setMethod("PIX");
    setStatus("completed");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const modalStyle =
    "fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-center z-50 p-4 pointer-events-auto";
  const contentStyle =
    "bg-white p-4 sm:p-6 md:p-8 rounded-2xl w-full max-w-2xl relative border border-gray-200 space-y-4 sm:space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto pointer-events-auto";
  const inputStyle =
    "mt-1 block w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out touch-manipulation text-base";
  const labelStyle = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <Portal>
      <div
        className={modalStyle}
        onClick={handleClose}
        role="button"
        tabIndex={0}
        aria-label="Fechar modal"
        onKeyDown={(e) => {
          if (e.key === "Escape") handleClose();
        }}
      >
        <div className={contentStyle} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-gray-600 transition-colors touch-manipulation p-2 rounded-lg active:bg-gray-100"
            aria-label="Fechar modal"
          >
            {ICONS.close}
          </button>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 pr-10 sm:pr-12 mb-4 sm:mb-6">
            Editar Transação
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Descrição */}
            <div>
              <label htmlFor="description" className={labelStyle}>
                Descrição
              </label>
              <input
                type="text"
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={inputStyle}
                placeholder="Ex: Compra no supermercado"
                required
              />
            </div>

            {/* Valor e Data */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="amount" className={labelStyle}>
                  Valor (R$)
                </label>
                <input
                  type="number"
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={inputStyle}
                  placeholder="0,00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label htmlFor="date" className={labelStyle}>
                  Data
                </label>
                <input
                  type="date"
                  id="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={inputStyle}
                  required
                />
              </div>
            </div>

            {/* Tipo e Categoria */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="type" className={labelStyle}>
                  Tipo
                </label>
                <select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value as TransactionType)}
                  className={inputStyle}
                  required
                >
                  <option value="expense">Despesa</option>
                  <option value="income">Receita</option>
                </select>
              </div>

              <div>
                <label htmlFor="category" className={labelStyle}>
                  Categoria
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={inputStyle}
                  required
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Conta e Método */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="account" className={labelStyle}>
                  Conta
                </label>
                <select
                  id="account"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  className={inputStyle}
                  required
                >
                  <option value="">Selecione uma conta</option>
                  {availableAccounts.map((acc) => (
                    <option key={acc} value={acc}>
                      {acc}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="method" className={labelStyle}>
                  Método de Pagamento
                </label>
                <select
                  id="method"
                  value={method}
                  onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                  className={inputStyle}
                  required
                >
                  <option value="PIX">PIX</option>
                  <option value="Credit Card">Cartão de Crédito</option>
                  <option value="Debit Card">Cartão de Débito</option>
                  <option value="Cash">Dinheiro</option>
                  <option value="Bank Transfer">Transferência</option>
                </select>
              </div>
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className={labelStyle}>
                Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as TransactionStatus)}
                className={inputStyle}
                required
              >
                <option value="completed">Completo</option>
                <option value="pending">Pendente</option>
              </select>
            </div>

            {/* Botões */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 sm:pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="w-full sm:w-auto px-6 py-3 sm:py-2.5 border-2 border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation min-h-[48px] sm:min-h-[42px]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 sm:py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-md hover:shadow-lg touch-manipulation min-h-[48px] sm:min-h-[42px]"
              >
                Salvar Alterações
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
};

export default EditTransactionModal;
