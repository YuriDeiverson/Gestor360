import React, { useState, useMemo, useCallback } from "react";
import {
  CreditCard,
  Plus,
  TrendingDown,
  AlertCircle,
  Eye,
  EyeOff,
  Trash2,
  Edit2,
  Wallet,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Transaction } from "../utils/types";
import type { Subscription } from "../utils/subscriptionsApi";
import Portal from "./Portal";
import {
  CARD_BRAND_PRESETS,
  getCardBrandStyle,
  matchPresetByBankLabel,
} from "../utils/cardBrands";
import {
  getCurrentMonthKey,
  shiftMonthKey,
  formatMonthKeyLabel,
  dateToMonthKey,
  dateMonthPlusMonths,
} from "../utils/monthKey";
import {
  creditCardUsageInMonth,
  subscriptionMonthlyTotalForCard,
} from "../utils/cardUsageMonth";

interface Card {
  id: string;
  name: string;
  bank: string;
  limit: number;
  closingDay: number;
  dueDay: number;
  currentBalance: number;
  status: "active" | "inactive" | "overdue";
  nextDueDate?: string;
}

interface CardsDashboardPageProps {
  cards: Card[];
  transactions: Transaction[];
  /** Contas (assinaturas) por cartão — entram na fatura atual sem duplicar lançamentos "Assinatura:" */
  subscriptions?: Subscription[];
  onAddCard: (card: Omit<Card, "id">) => void | Promise<void>;
  onEditCard: (card: Card) => void | Promise<void>;
  onDeleteCard: (id: string) => void;
}

interface CardSummary {
  card: Card;
  totalSpent: number;
  totalReceived: number;
  pendingAmount: number;
  availableLimit: number;
  utilizationRate: number;
  transactionCount: number;
  currentInvoice: number;
  nextInvoice: number;
}

const defaultForm = (): Partial<Card> => ({
  name: "",
  bank: "Outro",
  limit: 0,
  closingDay: 1,
  dueDay: 10,
});

/** Plástico de cartão — proporção ISO ~1.586:1 */
const CreditCardPlastic: React.FC<{
  bankLabel: string;
  cardName: string;
  className?: string;
}> = ({ bankLabel, cardName, className = "" }) => {
  const style = getCardBrandStyle(bankLabel);
  return (
    <div
      className={`relative rounded-2xl p-5 flex flex-col justify-between overflow-hidden shadow-xl ${className}`}
      style={{
        aspectRatio: "1.586 / 1",
        background: style.gradient,
        boxShadow: "0 18px 40px rgba(0,0,0,0.28)",
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 42%, rgba(0,0,0,0.25) 100%)",
        }}
      />
      <div
        className="absolute -right-8 -top-8 w-32 h-32 rounded-full pointer-events-none opacity-25"
        style={{ background: "rgba(255,255,255,0.35)" }}
      />
      <div className="relative z-[1] flex justify-between items-start gap-2">
        <div
          className="h-9 w-12 rounded-md"
          style={{
            background:
              "linear-gradient(145deg, #d4af37 0%, #f5e6a8 40%, #b8860b 100%)",
            boxShadow: "inset 0 1px 2px rgba(255,255,255,0.5)",
          }}
        />
        <CreditCard
          className="w-7 h-7 opacity-90 shrink-0"
          style={{ color: style.textColor }}
          strokeWidth={1.5}
        />
      </div>
      <div className="relative z-[1] space-y-3 mt-2">
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.2em]"
          style={{ color: style.subtextColor }}
        >
          {bankLabel || "Cartão"}
        </p>
        <p
          className="text-lg sm:text-xl font-semibold tracking-wide truncate"
          style={{ color: style.textColor }}
        >
          {cardName || "Seu cartão"}
        </p>
        <p
          className="font-mono text-sm tracking-[0.35em]"
          style={{ color: style.subtextColor }}
        >
          •••• •••• •••• 4242
        </p>
      </div>
    </div>
  );
};

const CardsDashboardPage: React.FC<CardsDashboardPageProps> = ({
  cards,
  transactions,
  subscriptions = [],
  onAddCard,
  onEditCard,
  onDeleteCard,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [showBalance, setShowBalance] = useState<Record<string, boolean>>({});
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [newCard, setNewCard] = useState<Partial<Card>>(defaultForm);
  const [cardMonthKey, setCardMonthKey] = useState(() => getCurrentMonthKey());

  const monthLabel = useMemo(
    () => formatMonthKeyLabel(cardMonthKey),
    [cardMonthKey],
  );

  const cardsSummary = useMemo(() => {
    try {
      const nextMonthKey = shiftMonthKey(cardMonthKey, 1);

      const summaries: CardSummary[] = cards.map((card) => {
        const txUsage = creditCardUsageInMonth(
          transactions,
          card.id,
          cardMonthKey,
        );
        const subsTotal = subscriptionMonthlyTotalForCard(
          subscriptions,
          card.id,
        );
        const fromSubTx = transactions
          .filter(
            (t) =>
              t.account === card.id &&
              t.type === "expense" &&
              t.method === "Cartão de Crédito" &&
              t.description?.startsWith("Assinatura:") &&
              dateToMonthKey(t.date) === cardMonthKey,
          )
          .reduce((sum, t) => sum + (t.amount || 0), 0);

        const totalSpent = txUsage + Math.max(0, subsTotal - fromSubTx);

        const pendingNext = transactions
          .filter((t) => {
            if (
              t.type !== "expense" ||
              t.method !== "Cartão de Crédito" ||
              t.account !== card.id
            ) {
              return false;
            }
            if (t.status !== "pending") return false;
            const inst = t.installments ?? 1;
            if (inst <= 1) return false;
            const cur = Math.min(
              Math.max(1, t.currentInstallment ?? 1),
              inst,
            );
            const dueMonth = dateMonthPlusMonths(t.date, cur - 1);
            return dueMonth === nextMonthKey;
          })
          .reduce((sum, t) => sum + (t.amount || 0), 0);

        const limit = card.limit || 0;
        const usedOnCard = totalSpent;
        const availableLimit = Math.max(0, limit - usedOnCard);
        const utilizationRate =
          limit > 0 ? (usedOnCard / limit) * 100 : 0;

        const txCountMonth = transactions.filter((t) => {
          if (t.account !== card.id || t.type !== "expense") return false;
          return dateToMonthKey(t.date) === cardMonthKey;
        }).length;

        return {
          card,
          totalSpent,
          totalReceived: 0,
          pendingAmount: pendingNext,
          availableLimit,
          utilizationRate,
          transactionCount: txCountMonth,
          currentInvoice: totalSpent,
          nextInvoice: pendingNext,
        };
      });

      return summaries;
    } catch (error) {
      console.error("Erro ao calcular resumo dos cartões:", error);
      return [];
    }
  }, [cards, transactions, subscriptions, cardMonthKey]);

  const formatCurrency = (value: number | undefined | null) => {
    if (value === undefined || value === null || isNaN(value)) {
      return "R$ 0,00";
    }
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const getUtilizationColor = (rate: number) => {
    if (rate >= 90) return "var(--danger)";
    if (rate >= 70) return "var(--warning)";
    return "var(--primary)";
  };

  const closeModal = useCallback(() => {
    setShowModal(false);
    setEditingCard(null);
    setNewCard(defaultForm());
  }, []);

  const openAddModal = () => {
    setEditingCard(null);
    setNewCard(defaultForm());
    setShowModal(true);
  };

  const startEditCard = (card: Card) => {
    setEditingCard(card);
    const preset = matchPresetByBankLabel(card.bank);
    setNewCard({
      name: card.name,
      bank: preset.label,
      limit: card.limit,
      closingDay: card.closingDay,
      dueDay: card.dueDay,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = (newCard.name || "").trim();
    const bank = (newCard.bank || "").trim();
    const limit = Number(newCard.limit) || 0;
    const closingDay = Number(newCard.closingDay) || 1;
    const dueDay = Number(newCard.dueDay) || 10;

    if (!name || !bank || limit <= 0) return;

    try {
      if (editingCard) {
        await Promise.resolve(
          onEditCard({
            ...editingCard,
            name,
            bank,
            limit,
            closingDay,
            dueDay,
          }),
        );
      } else {
        await Promise.resolve(
          onAddCard({
            name,
            bank,
            limit,
            closingDay,
            dueDay,
            currentBalance: 0,
            status: "active",
          }),
        );
      }
      closeModal();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleBalance = (cardId: string) => {
    setShowBalance((prev) => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  const inputBase: React.CSSProperties = {
    backgroundColor: "var(--input-bg)",
    borderColor: "var(--input-border)",
    color: "var(--text)",
    borderWidth: 1,
    borderStyle: "solid",
  };

  const modalOpen = showModal;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-semibold tracking-tight"
            style={{ color: "var(--text)" }}
          >
            Meus Cartões
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Gerencie seus limites e faturas em um só lugar.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex items-center gap-1 rounded-lg border px-1 py-1"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--card)",
            }}
          >
            <button
              type="button"
              onClick={() => setCardMonthKey((m) => shiftMonthKey(m, -1))}
              className="p-2 rounded-md transition-colors"
              style={{ color: "var(--text)" }}
              aria-label="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span
              className="px-2 text-sm font-semibold capitalize min-w-[140px] text-center"
              style={{ color: "var(--text)" }}
            >
              {monthLabel}
            </span>
            <button
              type="button"
              onClick={() => setCardMonthKey((m) => shiftMonthKey(m, 1))}
              className="p-2 rounded-md transition-colors"
              style={{ color: "var(--text)" }}
              aria-label="Próximo mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setCardMonthKey(getCurrentMonthKey())}
              className="ml-1 px-2 py-1.5 text-xs font-semibold rounded-md"
              style={{
                color: "var(--primary)",
                backgroundColor: "var(--bg-secondary)",
              }}
            >
              Mês atual
            </button>
          </div>
          <button
            type="button"
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 px-5 py-2.5 text-white text-sm font-medium rounded-lg transition-all shadow-sm"
            style={{ backgroundColor: "var(--primary)" }}
          >
            <Plus className="w-4 h-4" />
            Novo Cartão
          </button>
        </div>
      </div>

      <p className="text-xs -mt-4 mb-2" style={{ color: "var(--text-muted)" }}>
        Uso e fatura exibidos pelo mês civil (1º ao último dia). Compras parceladas
        entram na parcela do mês correspondente; ao pagar cada parcela, o limite
        é liberado nesse valor (saldo do cartão no servidor).
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className="p-5 rounded-xl border"
          style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
        >
          <div
            className="flex items-center gap-2 mb-2 opacity-80"
            style={{ color: "var(--text-secondary)" }}
          >
            <Wallet className="w-4 h-4" />
            <span className="text-sm font-medium">Limite Total</span>
          </div>
          <p className="text-2xl font-semibold" style={{ color: "var(--text)" }}>
            {formatCurrency(cards.reduce((sum, card) => sum + card.limit, 0))}
          </p>
        </div>
        <div
          className="p-5 rounded-xl border"
          style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
        >
          <div
            className="flex items-center gap-2 mb-2 opacity-80"
            style={{ color: "var(--text-secondary)" }}
          >
            <TrendingDown className="w-4 h-4" />
            <span className="text-sm font-medium">Movimentação do mês</span>
          </div>
          <p className="text-2xl font-semibold" style={{ color: "var(--danger)" }}>
            {formatCurrency(
              cardsSummary.reduce((sum, s) => sum + s.currentInvoice, 0),
            )}
          </p>
        </div>
        <div
          className="p-5 rounded-xl border"
          style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
        >
          <div
            className="flex items-center gap-2 mb-2 opacity-80"
            style={{ color: "var(--text-secondary)" }}
          >
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Próximas Faturas</span>
          </div>
          <p className="text-2xl font-semibold" style={{ color: "var(--warning)" }}>
            {formatCurrency(
              cardsSummary.reduce((sum, s) => sum + s.nextInvoice, 0),
            )}
          </p>
        </div>
        <div
          className="p-5 rounded-xl border"
          style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
        >
          <div
            className="flex items-center gap-2 mb-2 opacity-80"
            style={{ color: "var(--text-secondary)" }}
          >
            <CreditCard className="w-4 h-4" />
            <span className="text-sm font-medium">Limite Disponível</span>
          </div>
          <p className="text-2xl font-semibold" style={{ color: "var(--primary)" }}>
            {formatCurrency(
              cardsSummary.reduce((sum, s) => sum + s.availableLimit, 0),
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cardsSummary.map((summary) => (
          <div
            key={summary.card.id}
            className="group relative rounded-2xl p-6 transition-all duration-300"
            style={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="relative mb-6">
              <CreditCardPlastic
                bankLabel={summary.card.bank || "Outro"}
                cardName={summary.card.name}
              />
              <div className="absolute top-3 right-3 flex gap-1 z-[2]">
                <button
                  type="button"
                  onClick={() => startEditCard(summary.card)}
                  className="p-2 rounded-lg backdrop-blur-md transition-colors"
                  style={{
                    backgroundColor: "rgba(0,0,0,0.25)",
                    color: "#fff",
                  }}
                  title="Editar"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteCard(summary.card.id)}
                  className="p-2 rounded-lg backdrop-blur-md transition-colors"
                  style={{
                    backgroundColor: "rgba(0,0,0,0.25)",
                    color: "#fff",
                  }}
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span
                    className="text-sm font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Disponível
                  </span>
                  <span
                    className="text-base font-semibold"
                    style={{ color: "var(--text)" }}
                  >
                    {formatCurrency(summary.availableLimit)}
                  </span>
                </div>
                <div
                  className="w-full rounded-full h-1.5 overflow-hidden"
                  style={{ backgroundColor: "var(--bg-secondary)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${Math.min(summary.utilizationRate, 100)}%`,
                      backgroundColor: getUtilizationColor(summary.utilizationRate),
                    }}
                  />
                </div>
                <div
                  className="flex justify-between mt-1.5 text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  <span>Usado: {summary.utilizationRate.toFixed(1)}%</span>
                  <span>Total: {formatCurrency(summary.card.limit)}</span>
                </div>
              </div>

              <div className="pt-2 space-y-3">
                <div
                  className="flex justify-between items-center pb-3 border-b"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4" style={{ color: "var(--danger)" }} />
                    <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
                      Movimentação {monthLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-sm font-semibold"
                      style={{ color: "var(--danger)" }}
                    >
                      {showBalance[summary.card.id]
                        ? formatCurrency(summary.currentInvoice)
                        : "R$ •••••"}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleBalance(summary.card.id)}
                      className="p-1 rounded transition-colors"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {showBalance[summary.card.id] ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {summary.nextInvoice > 0 && (
                  <div
                    className="flex justify-between items-center pb-3 border-b"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" style={{ color: "var(--warning)" }} />
                      <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
                        Próxima Fatura
                      </span>
                    </div>
                    <span
                      className="text-sm font-semibold pr-8"
                      style={{ color: "var(--warning)" }}
                    >
                      {showBalance[summary.card.id]
                        ? formatCurrency(summary.nextInvoice)
                        : "R$ •••••"}
                    </span>
                  </div>
                )}
              </div>

              <div
                className="flex justify-between items-center pt-2 text-xs font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: "var(--text-muted)" }}
                  />
                  Fecha dia {summary.card.closingDay}
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: "var(--danger)" }}
                  />
                  Vence dia {summary.card.dueDay}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {cards.length === 0 && (
        <div
          className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed"
          style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: "var(--bg-secondary)" }}
          >
            <CreditCard className="w-8 h-8 opacity-50" style={{ color: "var(--text-secondary)" }} />
          </div>
          <h3 className="text-lg font-semibold mb-1" style={{ color: "var(--text)" }}>
            Nenhum cartão encontrado
          </h3>
          <p
            className="text-sm mb-6 max-w-sm text-center"
            style={{ color: "var(--text-secondary)" }}
          >
            Adicione seu primeiro cartão de crédito para começar a monitorar seus limites e
            gastos mensais.
          </p>
          <button
            type="button"
            onClick={openAddModal}
            className="flex items-center gap-2 px-6 py-2.5 text-white text-sm font-medium rounded-lg transition-all"
            style={{ backgroundColor: "var(--primary)" }}
          >
            <Plus className="w-4 h-4" />
            Adicionar Cartão
          </button>
        </div>
      )}

      {modalOpen && (
        <Portal>
          <div
            className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto"
            style={{ backgroundColor: "var(--overlay)" }}
            onClick={(e) => e.target === e.currentTarget && closeModal()}
          >
            <div
              className="rounded-2xl w-full max-w-lg relative max-h-[90vh] overflow-y-auto"
              style={{
                backgroundColor: "var(--card)",
                boxShadow: "var(--shadow)",
                border: "1px solid var(--border)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={closeModal}
                className="absolute top-4 right-4 p-2 rounded-lg z-10"
                style={{ color: "var(--text-muted)" }}
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-6 sm:p-8">
                <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text)" }}>
                  {editingCard ? "Editar cartão" : "Novo cartão"}
                </h2>
                <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
                  Escolha o banco para aplicar o visual do plástico. O nome é só para você
                  identificar o cartão.
                </p>

                <div className="mb-6">
                  <CreditCardPlastic
                    bankLabel={newCard.bank || "Outro"}
                    cardName={newCard.name || "Nome do cartão"}
                  />
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label
                      className="block text-xs font-bold uppercase mb-1.5"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Banco / estilo do cartão
                    </label>
                    <select
                      value={newCard.bank || "Outro"}
                      onChange={(e) =>
                        setNewCard((prev) => ({ ...prev, bank: e.target.value }))
                      }
                      className="w-full px-4 py-3 rounded-xl outline-none"
                      style={inputBase}
                      required
                    >
                      {CARD_BRAND_PRESETS.map((p) => (
                        <option key={p.id} value={p.label}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      className="block text-xs font-bold uppercase mb-1.5"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Nome do cartão
                    </label>
                    <input
                      type="text"
                      value={newCard.name || ""}
                      onChange={(e) =>
                        setNewCard((prev) => ({ ...prev, name: e.target.value }))
                      }
                      className="w-full px-4 py-3 rounded-xl outline-none"
                      style={inputBase}
                      placeholder="Ex.: Visa Platinum, Roxinho"
                      required
                    />
                  </div>

                  <div>
                    <label
                      className="block text-xs font-bold uppercase mb-1.5"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Limite total
                    </label>
                    <input
                      type="number"
                      min={1}
                      step="0.01"
                      value={newCard.limit === 0 ? "" : newCard.limit}
                      onChange={(e) =>
                        setNewCard((prev) => ({
                          ...prev,
                          limit: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-4 py-3 rounded-xl outline-none"
                      style={inputBase}
                      placeholder="0,00"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        className="block text-xs font-bold uppercase mb-1.5"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Fechamento
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={31}
                        value={newCard.closingDay ?? 1}
                        onChange={(e) =>
                          setNewCard((prev) => ({
                            ...prev,
                            closingDay: parseInt(e.target.value, 10) || 1,
                          }))
                        }
                        className="w-full px-4 py-3 rounded-xl outline-none"
                        style={inputBase}
                        required
                      />
                    </div>
                    <div>
                      <label
                        className="block text-xs font-bold uppercase mb-1.5"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Vencimento
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={31}
                        value={newCard.dueDay ?? 10}
                        onChange={(e) =>
                          setNewCard((prev) => ({
                            ...prev,
                            dueDay: parseInt(e.target.value, 10) || 10,
                          }))
                        }
                        className="w-full px-4 py-3 rounded-xl outline-none"
                        style={inputBase}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 py-3 font-semibold rounded-xl"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 text-white font-semibold rounded-xl"
                      style={{ backgroundColor: "var(--primary)" }}
                    >
                      {editingCard ? "Salvar" : "Adicionar"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
};

export default CardsDashboardPage;
