import React, { useState } from "react";
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

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (
    transaction: Omit<Transaction, "id" | "industry">,
  ) => Promise<void>;
  categories: Category[];
}

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onAddTransaction,
  categories,
}) => {
  console.log("🔷 AddTransactionModal renderizado. isOpen:", isOpen);

  const today = new Date().toISOString().split("T")[0];

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today);
  const [type, setType] = useState<TransactionType>("expense");
  const [category, setCategory] = useState("");
  const [account, setAccount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("Cartão de Crédito");
  const [status, setStatus] = useState<TransactionStatus>("completed");
  // Novos estados para parcelamento
  const [installments, setInstallments] = useState("1");
  const [isInstallment, setIsInstallment] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("📝 AddTransactionModal: Formulário submetido");

    if (!description || !amount || !date || !category || !account) {
      // Basic validation
      alert("Por favor, preencha todos os campos obrigatórios.");
      console.log("❌ Validação falhou - campos obrigatórios vazios");
      return;
    }

    const totalAmount = parseFloat(amount);
    const installmentCount = isInstallment ? parseInt(installments) : 1;
    const installmentAmount =
      installmentCount > 1 ? totalAmount / installmentCount : totalAmount;

    try {
      if (installmentCount > 1) {
        // Criar uma única transação parcelada (ainda não paga)
        const nextPaymentDate = new Date(date);
        // Próximo pagamento é no mês seguinte da data de criação
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

        const transactionData = {
          description: `${description}`,
          amount: installmentAmount,
          date,
          type,
          category,
          account,
          method,
          status: "pending" as TransactionStatus, // Começa como pendente
          installments: installmentCount,
          currentInstallment: 0, // Começa em 0 (nenhuma parcela paga ainda)
          totalAmount: totalAmount,
          nextPaymentDate: nextPaymentDate.toISOString().split("T")[0],
          remainingAmount: totalAmount, // Todo valor ainda pendente
        };

        await onAddTransaction(transactionData);
      } else {
        // Transação única
        const transactionData = {
          description,
          amount: totalAmount,
          date,
          type,
          category,
          account,
          method,
          status,
        };

        await onAddTransaction(transactionData);
      }

      console.log(
        "✅ AddTransactionModal: Transação(ões) adicionada(s) com sucesso",
      );

      // Reset form
      setDescription("");
      setAmount("");
      setDate(today);
      setType("expense");
      setCategory("");
      setAccount("");
      setMethod("Cartão de Crédito");
      setStatus("completed");
      setInstallments("1");
      setIsInstallment(false);

      // FECHA O MODAL após sucesso
      onClose();
    } catch (error) {
      console.error(
        "❌ AddTransactionModal: Erro ao adicionar transação:",
        error,
      );
      alert(
        "Erro ao adicionar transação. Verifique o console para mais detalhes.",
      );
    }
  };

  if (!isOpen) return null;

  const modalStyle =
    "fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-center z-50 p-4 pointer-events-auto";
  const contentStyle =
    "bg-white p-4 sm:p-6 md:p-8 rounded-2xl w-full max-w-2xl relative border border-gray-200 space-y-4 sm:space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto pointer-events-auto";
  const inputStyle =
    "mt-1 block w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition duration-150 ease-in-out touch-manipulation text-base";
  const labelStyle = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <Portal>
      <div
        className={modalStyle}
        onClick={onClose}
        role="button"
        tabIndex={0}
        aria-label="Fechar modal"
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
      >
        <div className={contentStyle} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-gray-600 transition-colors touch-manipulation p-2 rounded-lg active:bg-gray-100"
            aria-label="Fechar modal"
          >
            {ICONS.close}
          </button>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 pr-10 sm:pr-12">
            Adicionar Nova Transação
          </h2>

          {/* --- Formulário do Modal --- */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Descrição */}
            <div>
              <label htmlFor="description" className={labelStyle}>
                Descrição
              </label>
              <input
                id="description"
                type="text"
                placeholder="Ex: Supermercado, Salário..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={inputStyle}
                required
              />
            </div>

            {/* Valor e Data */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="amount" className={labelStyle}>
                  Valor Total (R$)
                </label>
                <input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={inputStyle}
                  required
                />
              </div>
              <div>
                <label htmlFor="date" className={labelStyle}>
                  Data
                </label>
                <input
                  id="date"
                  type="date"
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
                  <option value="" disabled>
                    Selecione uma categoria
                  </option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Conta e Método de Pagamento */}
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
                  <option value="" disabled>
                    Selecione uma conta
                  </option>
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
                  onChange={(e) => {
                    const newMethod = e.target.value as PaymentMethod;
                    setMethod(newMethod);
                    // Reset parcelamento se não for cartão de crédito
                    if (newMethod !== "Cartão de Crédito") {
                      setIsInstallment(false);
                      setInstallments("1");
                    }
                  }}
                  className={inputStyle}
                >
                  <option>Cartão de Crédito</option>
                  <option>Débito</option>
                  <option>PIX</option>
                </select>
              </div>
            </div>

            {/* Seção de Parcelamento - aparece para despesas */}
            {type === "expense" && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
                <div className="flex items-center space-x-3 mb-3">
                  <input
                    id="installment-checkbox"
                    type="checkbox"
                    checked={isInstallment}
                    onChange={(e) => {
                      setIsInstallment(e.target.checked);
                      if (!e.target.checked) {
                        setInstallments("1");
                      }
                    }}
                    className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 touch-manipulation cursor-pointer"
                  />
                  <label
                    htmlFor="installment-checkbox"
                    className="text-sm font-medium text-gray-700 cursor-pointer select-none"
                  >
                    Parcelar esta despesa
                  </label>
                </div>

                {isInstallment && (
                  <div className="space-y-4 mt-4 pt-4 border-t border-blue-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="installments" className={labelStyle}>
                          Número de Parcelas
                        </label>
                        <select
                          id="installments"
                          value={installments}
                          onChange={(e) => setInstallments(e.target.value)}
                          className={inputStyle}
                        >
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(
                            (num) => (
                              <option key={num} value={num.toString()}>
                                {num}x de{" "}
                                {amount && parseInt(installments) > 0
                                  ? `R$ ${(parseFloat(amount) / num).toFixed(
                                      2,
                                    )}`
                                  : "R$ 0,00"}
                              </option>
                            ),
                          )}
                        </select>
                      </div>
                      <div>
                        <label className={labelStyle}>Valor por Parcela</label>
                        <div className="mt-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-white border border-emerald-300 rounded-lg text-emerald-700 font-semibold text-base flex items-center justify-center">
                          {amount && parseInt(installments) > 0
                            ? `R$ ${(
                                parseFloat(amount) / parseInt(installments)
                              ).toFixed(2)}`
                            : "R$ 0,00"}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-blue-700 bg-blue-100 p-3 rounded-lg border border-blue-200">
                      <strong>ℹ️ Informação:</strong> Será criada uma única
                      transação parcelada. Você poderá controlar o pagamento de
                      cada parcela individualmente.
                    </div>
                  </div>
                )}
              </div>
            )}

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
              >
                <option value="completed">Completo</option>
                <option value="pending">Pendente</option>
              </select>
            </div>

            {/* Botões de Ação */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 sm:pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-3 sm:py-2.5 border-2 border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 active:bg-gray-100 transition-colors duration-150 touch-manipulation min-h-[48px] sm:min-h-[42px]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 sm:py-2.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 active:bg-emerald-800 transition-colors duration-150 shadow-md hover:shadow-lg touch-manipulation min-h-[48px] sm:min-h-[42px]"
              >
                Adicionar Transação
              </button>
            </div>
          </form>
          {/* --- Fim do Formulário --- */}
        </div>
      </div>
    </Portal>
  );
};

export default AddTransactionModal;
