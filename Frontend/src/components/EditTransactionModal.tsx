import React, { useState, useEffect } from "react";
import {
  Transaction,
  TransactionType,
  TransactionStatus,
  PaymentMethod,
} from "../utils/types";
import { Budget } from "../utils/types";
import { ICONS } from "../constants";
import {
  INCOME_CATEGORIES,
  type IncomeCategoryId,
  toIncomeCategorySelectValue,
} from "../utils/incomeCategories";
import Portal from "./Portal";
import {
  txInputClass,
  txInputStyle,
  txLabelClass,
  txLabelStyle,
  txModalCardClass,
  txModalOverlayClass,
  txModalTitleClass,
  txPrimaryButtonClass,
  txSecondaryButtonClass,
} from "./transactionModalShared";

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEditTransaction: (transaction: Transaction) => void;
  transaction: Transaction;
  budgets: Budget[];
  cards?: any[];
}

const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  isOpen,
  onClose,
  onEditTransaction,
  transaction,
  budgets,
  cards = [],
}) => {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [category, setCategory] = useState("");
  const [account, setAccount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("PIX");
  const [status, setStatus] = useState<TransactionStatus>("completed");

  useEffect(() => {
    if (isOpen && transaction) {
      setDescription(transaction.description);
      setAmount(transaction.amount.toString());
      setDate(transaction.date);
      setType(transaction.type);
      setCategory(
        transaction.type === "income"
          ? toIncomeCategorySelectValue(
              transaction.category,
              transaction.method,
            )
          : transaction.category,
      );
      setAccount(transaction.account);
      setMethod(transaction.method);
      setStatus(transaction.status);
    }
  }, [isOpen, transaction]);

  useEffect(() => {
    if (type !== "expense" || !category || budgets.length === 0) return;
    const selectedBudget = budgets.find((b) => b.name === category);
    if (selectedBudget) {
      setType(selectedBudget.type);
    }
  }, [category, budgets, type]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!description || !amount || !date || !account) {
      alert("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    if (type === "expense" && !category) {
      alert("Selecione uma categoria");
      return;
    }
    if (type === "income" && !category) {
      alert("Selecione uma categoria");
      return;
    }

    const budgetForExpense =
      type === "expense" ? budgets.find((b) => b.name === category) : undefined;

    const editedTransaction: Transaction = {
      ...transaction,
      description,
      amount: parseFloat(amount),
      date,
      type,
      category: type === "income" ? (category as IncomeCategoryId) : category,
      budgetId: type === "expense" ? budgetForExpense?.id : undefined,
      account,
      /** Receitas: método fixo "Salário" no banco (sem exibir no modal). */
      method: type === "income" ? "Salário" : method,
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

  const title =
    type === "income"
      ? "Editar receita"
      : type === "expense"
        ? "Editar despesa"
        : "Editar transação";

  return (
    <Portal>
      <div
        className={txModalOverlayClass}
        style={{ backgroundColor: "var(--overlay)" }}
        onClick={handleClose}
        role="presentation"
      >
        <div
          className={`${txModalCardClass} max-w-md`}
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--border)",
            boxShadow: "var(--shadow)",
            color: "var(--text)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-4 top-4 rounded-lg p-1.5 transition"
            style={{ color: "var(--text-muted)" }}
            aria-label="Fechar"
          >
            {ICONS.close}
          </button>

          <h2 className={txModalTitleClass} style={{ color: "var(--text)" }}>
            {title}
          </h2>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="edit-description" className={txLabelClass} style={txLabelStyle}>
                Descrição
              </label>
              <input
                type="text"
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={txInputClass}
                style={txInputStyle}
                placeholder="Ex.: Compra no supermercado"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit-amount" className={txLabelClass} style={txLabelStyle}>
                  Valor (R$)
                </label>
                <input
                  type="number"
                  id="edit-amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={txInputClass}
                  style={txInputStyle}
                  placeholder="0,00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label htmlFor="edit-date" className={txLabelClass} style={txLabelStyle}>
                  Data
                </label>
                <input
                  type="date"
                  id="edit-date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={txInputClass}
                  style={txInputStyle}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="edit-type" className={txLabelClass} style={txLabelStyle}>
                Tipo
              </label>
              <select
                id="edit-type"
                value={type}
                onChange={(e) => {
                  const next = e.target.value as TransactionType;
                  setType(next);
                  if (next === "income") {
                    setCategory("Salário");
                  } else {
                    setCategory("");
                  }
                }}
                className={txInputClass}
                style={txInputStyle}
                required
              >
                <option value="expense">Despesa</option>
                <option value="income">Receita</option>
              </select>
            </div>

            {type === "income" ? (
              <div>
                <label htmlFor="edit-income-category" className={txLabelClass} style={txLabelStyle}>
                  Categoria
                </label>
                <select
                  id="edit-income-category"
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as IncomeCategoryId)
                  }
                  className={txInputClass}
                  style={txInputStyle}
                  required
                >
                  {INCOME_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label htmlFor="edit-category" className={txLabelClass} style={txLabelStyle}>
                  Categoria (orçamento)
                </label>
                <select
                  id="edit-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={txInputClass}
                  style={txInputStyle}
                  required
                >
                  <option value="">Selecione</option>
                  {budgets.map((b) => (
                    <option key={b.id} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {type === "income" ? (
              <div>
                <label htmlFor="edit-account" className={txLabelClass} style={txLabelStyle}>
                  Conta
                </label>
                <select
                  id="edit-account"
                  className={txInputClass}
                  style={txInputStyle}
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  required
                >
                  <option value="">Selecione</option>
                  {cards.map((card) => (
                    <option key={card.id} value={card.id}>
                      {card.name}
                      {card.bank ? ` (${card.bank})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-account" className={txLabelClass} style={txLabelStyle}>
                    Conta
                  </label>
                  <select
                    id="edit-account"
                    className={txInputClass}
                    style={txInputStyle}
                    value={account}
                    onChange={(e) => setAccount(e.target.value)}
                    required
                  >
                    <option value="">Selecione</option>
                    {cards.map((card) => (
                      <option key={card.id} value={card.id}>
                        {card.name}
                        {card.bank ? ` (${card.bank})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="edit-method" className={txLabelClass} style={txLabelStyle}>
                    Método
                  </label>
                  <select
                    id="edit-method"
                    value={method}
                    onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                    className={txInputClass}
                    style={txInputStyle}
                    required
                  >
                    <option value="Cartão de Crédito">Cartão de crédito</option>
                    <option value="Débito">Débito</option>
                    <option value="PIX">PIX</option>
                  </select>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="edit-status" className={txLabelClass} style={txLabelStyle}>
                Status
              </label>
              <select
                id="edit-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as TransactionStatus)}
                className={txInputClass}
                style={txInputStyle}
                required
              >
                <option value="completed">Completo</option>
                <option value="pending">Pendente</option>
              </select>
            </div>

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleClose}
                className={`${txSecondaryButtonClass} sm:w-auto sm:min-w-[120px]`}
                style={{
                  borderColor: "var(--border)",
                  color: "var(--text)",
                  backgroundColor: "var(--card)",
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={`${txPrimaryButtonClass} sm:w-auto sm:min-w-[140px]`}
                style={{ backgroundColor: "var(--primary)" }}
              >
                Salvar alterações
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
};

export default EditTransactionModal;
