import React, { useState, useEffect, useRef } from "react";
import {
  Transaction,
  TransactionType,
  TransactionStatus,
  PaymentMethod,
  Budget,
} from "../utils/types";
import { ICONS } from "../constants";
import { INCOME_CATEGORIES, type IncomeCategoryId } from "../utils/incomeCategories";
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

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (
    transaction: Omit<Transaction, "id" | "industry">,
  ) => Promise<void>;
  budgets: Budget[];
  cards?: any[];
  defaultType?: TransactionType;
  lockType?: boolean;
}

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onAddTransaction,
  budgets = [],
  cards = [],
  defaultType,
  lockType = false,
}) => {
  const today = new Date().toISOString().split("T")[0];

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today);
  const [type, setType] = useState<TransactionType>("expense");
  const [budgetId, setBudgetId] = useState<string | null>(null);
  const [account, setAccount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("Cartão de Crédito");
  const [status, setStatus] = useState<TransactionStatus>("completed");
  /** Categoria da receita (UI); método enviado ao backend é sempre "Salário". */
  const [incomeCategory, setIncomeCategory] = useState<IncomeCategoryId>("Salário");
  /** Valor por parcela; se parcelas > 1, total = valor × parcelas. */
  const [expenseInstallments, setExpenseInstallments] = useState("1");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLockRef = useRef(false);

  const isLockedIncome = lockType && defaultType === "income";
  const isLockedExpense = lockType && defaultType === "expense";
  const isSalaryMode = !isLockedIncome && method === "Salário";

  useEffect(() => {
    if (!isOpen || !lockType || !defaultType) return;
    const d = new Date().toISOString().split("T")[0];
    setType(defaultType);
    setBudgetId(null);
    setDescription("");
    setAmount("");
    setDate(d);
    setStatus("completed");
    if (defaultType === "income") {
      setMethod("Salário");
      setAccount("");
      setIncomeCategory("Salário");
    } else {
      setMethod("Cartão de Crédito");
      setAccount("");
      setExpenseInstallments("1");
    }
  }, [isOpen, lockType, defaultType]);

  useEffect(() => {
    if (isSalaryMode) {
      setType("income");
      setDescription("Salário");
      setStatus("completed");
      setBudgetId(null);
    }
  }, [isSalaryMode]);

  useEffect(() => {
    if (budgetId) {
      const selectedBudget = budgets.find((b) => b.id === budgetId);
      if (selectedBudget && !lockType) {
        setType(selectedBudget.type);
      }
    }
  }, [budgetId, budgets, lockType]);

  useEffect(() => {
    if (!isOpen) {
      setIsSubmitting(false);
      submitLockRef.current = false;
    }
  }, [isOpen]);

  const visibleBudgets = budgets.filter((b) => {
    if (lockType && defaultType === "income") return b.type === "income";
    if (lockType && defaultType === "expense") return b.type === "expense";
    return true;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitLockRef.current || isSubmitting) return;
    submitLockRef.current = true;

    if (isLockedIncome) {
      if (!description.trim() || !amount || !date || !account) {
        alert("Preencha descrição, valor, data e conta.");
        submitLockRef.current = false;
        return;
      }
    } else if (isLockedExpense) {
      if (!description.trim() || !amount || !date || !budgetId || !account) {
        alert("Preencha descrição, valor, data, categoria e conta.");
        submitLockRef.current = false;
        return;
      }
    } else if (!amount || !date || (!isSalaryMode && !account)) {
      alert("Preencha os campos obrigatórios.");
      submitLockRef.current = false;
      return;
    }

    setIsSubmitting(true);
    try {
      if (isLockedIncome) {
        await onAddTransaction({
          description: description.trim(),
          amount: parseFloat(amount),
          date,
          type: "income",
          category: incomeCategory,
          account,
          method: "Salário",
          status,
        } as Omit<Transaction, "id" | "industry">);
      } else if (isLockedExpense) {
        const b = budgets.find((x) => x.id === budgetId);
        const parcel = parseFloat(amount);
        const n = Math.max(
          1,
          Math.min(48, parseInt(expenseInstallments, 10) || 1),
        );
        const totalAmount = parcel * n;
        const addOneMonth = (iso: string) => {
          const d = new Date(iso + "T12:00:00");
          d.setMonth(d.getMonth() + 1);
          return d.toISOString().split("T")[0];
        };
        await onAddTransaction({
          description: description.trim(),
          amount: parcel,
          date,
          type: "expense",
          category: b?.name ?? "",
          budgetId: budgetId ?? undefined,
          account,
          method,
          ...(n > 1
            ? {
                installments: n,
                currentInstallment: 1,
                totalAmount,
                remainingAmount: totalAmount - parcel,
                nextPaymentDate: addOneMonth(date),
                status: "pending" as TransactionStatus,
              }
            : { status }),
        } as Omit<Transaction, "id" | "industry">);
      } else {
        await onAddTransaction({
          description: isSalaryMode ? "Salário" : description,
          amount: parseFloat(amount),
          date,
          type: isSalaryMode ? "income" : type,
          budgetId: budgetId ?? undefined,
          account,
          method,
          status,
        } as Omit<Transaction, "id" | "industry">);
      }

      setDescription("");
      setAmount("");
      setDate(today);
      setType("expense");
      setBudgetId(null);
      setAccount("");
      setMethod("Cartão de Crédito");
      setStatus("completed");
      setIncomeCategory("Salário");
      setExpenseInstallments("1");

      onClose();
    } catch (error) {
      console.error(error);
      alert("Erro ao adicionar transação.");
    } finally {
      submitLockRef.current = false;
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const cardMaxW =
    isLockedIncome || isLockedExpense ? "max-w-md" : "max-w-2xl";

  return (
    <Portal>
      <div
        className={txModalOverlayClass}
        style={{ backgroundColor: "var(--overlay)" }}
        onClick={onClose}
      >
        <div
          className={`${txModalCardClass} ${cardMaxW}`}
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
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-1.5 transition"
            style={{ color: "var(--text-muted)" }}
            aria-label="Fechar"
          >
            {ICONS.close}
          </button>

          <h2 className={txModalTitleClass} style={{ color: "var(--text)" }}>
            {isLockedIncome
              ? "Nova receita"
              : isLockedExpense
                ? "Nova despesa"
                : "Adicionar transação"}
          </h2>

          {isSalaryMode && (
            <div
              className="mt-4 rounded-xl border p-3 text-sm"
              style={{
                backgroundColor: "var(--success-bg)",
                borderColor: "var(--success)",
                color: "var(--success)",
              }}
            >
              Esta transação será registrada como <strong>Salário</strong>.
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {/* ——— Receita: categoria escolhida; método "Salário" sempre no backend (sem campo no modal) ——— */}
            {isLockedIncome && (
              <>
                <div>
                  <label className={txLabelClass} style={txLabelStyle}>
                    Descrição
                  </label>
                  <input
                    className={txInputClass}
                    style={txInputStyle}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex.: Salário março"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={txLabelClass} style={txLabelStyle}>
                      Valor (R$)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      className={txInputClass}
                      style={txInputStyle}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="5000"
                      required
                    />
                  </div>
                  <div>
                    <label className={txLabelClass} style={txLabelStyle}>
                      Data
                    </label>
                    <input
                      type="date"
                      className={txInputClass}
                      style={txInputStyle}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className={txLabelClass} style={txLabelStyle}>
                    Categoria
                  </label>
                  <select
                    className={txInputClass}
                    style={txInputStyle}
                    value={incomeCategory}
                    onChange={(e) =>
                      setIncomeCategory(e.target.value as IncomeCategoryId)
                    }
                    required
                  >
                    {INCOME_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={txLabelClass} style={txLabelStyle}>
                    Conta
                  </label>
                  <select
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
                  <label className={txLabelClass} style={txLabelStyle}>
                    Status
                  </label>
                  <select
                    className={txInputClass}
                    style={txInputStyle}
                    value={status}
                    onChange={(e) =>
                      setStatus(e.target.value as TransactionStatus)
                    }
                  >
                    <option value="completed">Completo</option>
                    <option value="pending">Pendente</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={txPrimaryButtonClass}
                  style={{
                    backgroundColor: "var(--primary)",
                    opacity: isSubmitting ? 0.7 : 1,
                  }}
                >
                  {isSubmitting ? "Salvando…" : "Adicionar receita"}
                </button>
              </>
            )}

            {/* ——— Despesa (aba Despesas) ——— */}
            {isLockedExpense && (
              <>
                <div>
                  <label className={txLabelClass} style={txLabelStyle}>
                    Descrição
                  </label>
                  <input
                    className={txInputClass}
                    style={txInputStyle}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex.: Supermercado"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={txLabelClass} style={txLabelStyle}>
                      Valor (R$)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      className={txInputClass}
                      style={txInputStyle}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className={txLabelClass} style={txLabelStyle}>
                      Data
                    </label>
                    <input
                      type="date"
                      className={txInputClass}
                      style={txInputStyle}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className={txLabelClass} style={txLabelStyle}>
                    Categoria (orçamento)
                  </label>
                  <select
                    className={txInputClass}
                    style={txInputStyle}
                    value={budgetId ?? ""}
                    onChange={(e) => setBudgetId(e.target.value || null)}
                    disabled={visibleBudgets.length === 0}
                    required
                  >
                    <option value="">
                      {visibleBudgets.length === 0
                        ? "Crie um orçamento primeiro"
                        : "Selecione"}
                    </option>
                    {visibleBudgets.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={txLabelClass} style={txLabelStyle}>
                      Conta
                    </label>
                    <select
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
                    <label className={txLabelClass} style={txLabelStyle}>
                      Método
                    </label>
                    <select
                      className={txInputClass}
                      style={txInputStyle}
                      value={method}
                      onChange={(e) =>
                        setMethod(e.target.value as PaymentMethod)
                      }
                    >
                      <option value="Cartão de Crédito">Cartão de crédito</option>
                      <option value="Débito">Débito</option>
                      <option value="PIX">PIX</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={txLabelClass} style={txLabelStyle}>
                    Parcelas
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={48}
                    className={txInputClass}
                    style={txInputStyle}
                    value={expenseInstallments}
                    onChange={(e) => setExpenseInstallments(e.target.value)}
                  />
                  <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                    Valor acima é por parcela. Compras parceladas ficam como &quot;pendente&quot;
                    até quitar — use &quot;Pagar&quot; na lista para avançar.
                  </p>
                </div>

                {Math.max(1, Math.min(48, parseInt(expenseInstallments || "1", 10) || 1)) <= 1 && (
                  <div>
                    <label className={txLabelClass} style={txLabelStyle}>
                      Status
                    </label>
                    <select
                      className={txInputClass}
                      style={txInputStyle}
                      value={status}
                      onChange={(e) =>
                        setStatus(e.target.value as TransactionStatus)
                      }
                    >
                      <option value="completed">Completo</option>
                      <option value="pending">Pendente</option>
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={txPrimaryButtonClass}
                  style={{
                    backgroundColor: "var(--primary)",
                    opacity: isSubmitting ? 0.7 : 1,
                  }}
                >
                  {isSubmitting ? "Salvando…" : "Adicionar despesa"}
                </button>
              </>
            )}

            {/* ——— Modo genérico (sem lock) ——— */}
            {!isLockedIncome && !isLockedExpense && (
              <>
                <div>
                  <label className={txLabelClass} style={txLabelStyle}>
                    Descrição
                  </label>
                  <input
                    className={txInputClass}
                    style={txInputStyle}
                    value={description}
                    disabled={isSalaryMode}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={isSalaryMode ? "Salário" : "Digite a descrição"}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={txLabelClass} style={txLabelStyle}>
                      Valor
                    </label>
                    <input
                      type="number"
                      className={txInputClass}
                      style={txInputStyle}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0,00"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className={txLabelClass} style={txLabelStyle}>
                      Data
                    </label>
                    <input
                      type="date"
                      className={txInputClass}
                      style={txInputStyle}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className={txLabelClass} style={txLabelStyle}>
                    Categoria
                  </label>
                  <select
                    className={txInputClass}
                    style={txInputStyle}
                    value={budgetId ?? ""}
                    onChange={(e) => setBudgetId(e.target.value || null)}
                    disabled={visibleBudgets.length === 0}
                  >
                    <option value="">
                      {visibleBudgets.length === 0
                        ? "Crie um orçamento primeiro"
                        : "Sem categoria"}
                    </option>
                    {visibleBudgets.map((b) => (
                      <option key={b.id} value={b.id}>
                        ● {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={txLabelClass} style={txLabelStyle}>
                      Conta
                    </label>
                    <select
                      className={txInputClass}
                      style={txInputStyle}
                      value={account}
                      onChange={(e) => setAccount(e.target.value)}
                    >
                      <option value="">Selecione</option>
                      {cards.map((card) => (
                        <option key={card.id} value={card.id}>
                          {card.name} ({card.bank})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={txLabelClass} style={txLabelStyle}>
                      Método
                    </label>
                    <select
                      className={txInputClass}
                      style={txInputStyle}
                      value={method}
                      onChange={(e) =>
                        setMethod(e.target.value as PaymentMethod)
                      }
                    >
                      <option value="Cartão de Crédito">Cartão de Crédito</option>
                      <option value="Débito">Débito</option>
                      <option value="PIX">PIX</option>
                      <option value="Salário">Salário</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={txLabelClass} style={txLabelStyle}>
                    Status
                  </label>
                  <select
                    className={txInputClass}
                    style={txInputStyle}
                    value={status}
                    onChange={(e) =>
                      setStatus(e.target.value as TransactionStatus)
                    }
                  >
                    <option value="completed">Completo</option>
                    <option value="pending">Pendente</option>
                  </select>
                </div>

                <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={onClose}
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
                    disabled={isSubmitting}
                    className={`${txPrimaryButtonClass} sm:w-auto sm:min-w-[120px]`}
                    style={{
                      backgroundColor: "var(--primary)",
                      opacity: isSubmitting ? 0.7 : 1,
                    }}
                  >
                    {isSubmitting ? "Salvando…" : "Salvar"}
                  </button>
                </div>
              </>
            )}
          </form>

          {(isLockedIncome || isLockedExpense) && (
            <button
              type="button"
              onClick={onClose}
              className={`${txSecondaryButtonClass} mt-3`}
              style={{
                borderColor: "var(--border)",
                color: "var(--text-secondary)",
                backgroundColor: "transparent",
              }}
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
    </Portal>
  );
};

export default AddTransactionModal;
