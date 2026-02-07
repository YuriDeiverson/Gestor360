import React, { useState, useEffect } from "react";
import {
  Transaction,
  TransactionType,
  TransactionStatus,
  PaymentMethod,
  Budget,
} from "../utils/types";
import { availableAccounts } from "../utils/mockData";
import { ICONS } from "../constants";
import Portal from "./Portal";

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (
    transaction: Omit<Transaction, "id" | "industry">,
  ) => Promise<void>;
  budgets: Budget[];
  cards?: any[]; // Adicionar prop para cartões
}

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onAddTransaction,
  budgets = [],
  cards = [], // Adicionar cards com valor padrão
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

  const isSalary = method === "Salário";

  /* 🔁 Ajustes automáticos quando for salário */
  useEffect(() => {
    if (isSalary) {
      setType("income");
      setDescription("Salário");
      setStatus("completed");
      setBudgetId(null); // 👈 categoria opcional
    }
  }, [isSalary]);

  /* 🔁 Ajusta tipo automaticamente quando escolher categoria */
  useEffect(() => {
    if (budgetId) {
      const selectedBudget = budgets.find((b) => b.id === budgetId);
      if (selectedBudget) {
        setType(selectedBudget.type);
      }
    }
  }, [budgetId, budgets]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ Validação: conta NÃO é obrigatória para salário
    if (!amount || !date || (!isSalary && !account)) {
      alert("Preencha os campos obrigatórios.");
      return;
    }

    try {
      await onAddTransaction({
        description: isSalary ? "Salário" : description,
        amount: parseFloat(amount),
        date,
        type: isSalary ? "income" : type,
        budgetId: budgetId ?? undefined,
        account,
        method,
        status,
      } as any);

      // Reset
      setDescription("");
      setAmount("");
      setDate(today);
      setType("expense");
      setBudgetId(null);
      setAccount("");
      setMethod("Cartão de Crédito");
      setStatus("completed");

      onClose();
    } catch (error) {
      console.error(error);
      alert("Erro ao adicionar transação.");
    }
  };

  if (!isOpen) return null;

  const inputStyle =
    "mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500";

  const labelStyle = "block text-sm font-medium text-gray-700";

  return (
    <Portal>
      <div
        className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 w-full max-w-lg sm:max-w-2xl relative max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-3 sm:top-4 right-3 sm:right-4 text-gray-400 p-1 hover:text-gray-600 transition"
          >
            {ICONS.close}
          </button>

          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 pr-8">Adicionar Transação</h2>

          {isSalary && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-sm">
              Esta transação será registrada como <strong>Salário</strong>.
              A categoria é opcional.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Descrição */}
            <div>
              <label className={labelStyle}>Descrição</label>
              <input
                className={`${inputStyle} text-base sm:text-lg`}
                value={description}
                disabled={isSalary}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={isSalary ? "Salário" : "Digite a descrição"}
              />
            </div>

            {/* Valor / Data */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelStyle}>Valor</label>
                <input
                  type="number"
                  className={`${inputStyle} text-base sm:text-lg`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  step="0.01"
                />
              </div>
              <div>
                <label className={labelStyle}>Data</label>
                <input
                  type="date"
                  className={`${inputStyle} text-base sm:text-lg`}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            {/* Categoria (opcional para salário) */}
            <div>
              <label className={labelStyle}>
                Categoria {isSalary && <span className="text-xs">(opcional)</span>}
              </label>
              <select
                className={`${inputStyle} text-base sm:text-lg`}
                value={budgetId ?? ""}
                onChange={(e) =>
                  setBudgetId(e.target.value || null)
                }
                disabled={budgets.length === 0}
              >
                <option value="">
                  {budgets.length === 0
                    ? "Crie um orçamento primeiro"
                    : "Sem categoria"}
                </option>

                {budgets.map((b) => (
                  <option key={b.id} value={b.id}>
                    ● {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Conta / Método */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelStyle}>Conta</label>
                <select
                  className={`${inputStyle} text-base sm:text-lg`}
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
                <label className={labelStyle}>Método</label>
                <select
                  className={`${inputStyle} text-base sm:text-lg`}
                  value={method}
                  onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                >
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Débito">Débito</option>
                  <option value="PIX">PIX</option>
                  <option value="Salário">Salário</option>
                </select>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className={labelStyle}>Status</label>
              <select
                className={`${inputStyle} text-base sm:text-lg`}
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as TransactionStatus)
                }
              >
                <option value="completed">Completo</option>
                <option value="pending">Pendente</option>
              </select>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 sm:pt-6">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-3 sm:py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-base sm:text-base"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 sm:py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-base sm:text-base"
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
};

export default AddTransactionModal;
