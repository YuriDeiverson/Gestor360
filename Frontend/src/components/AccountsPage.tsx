import React, { useMemo, useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X, Repeat2 } from "lucide-react";
import Portal from "./Portal";
import { Subscription } from "../utils/subscriptionsApi";
import {
  SUBSCRIPTION_PRESETS,
  SUBSCRIPTION_CATEGORY_LABELS,
  SUBSCRIPTION_CATEGORY_COLORS,
  getUiCategoryForIconKey,
  resolveSubscriptionImageUrl,
  type SubscriptionUiCategory,
} from "../utils/subscriptionPresets";

interface CardOption {
  id: string;
  name: string;
  bank?: string;
}

interface AccountsPageProps {
  subscriptions: Subscription[];
  cards: CardOption[];
  dashboardId: string | undefined;
  onAdd: (s: Omit<Subscription, "id"> & { dashboardId: string }) => Promise<void>;
  onEdit: (id: string, partial: Partial<Omit<Subscription, "id" | "dashboardId">>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const emptyForm = () => ({
  name: "",
  amount: "",
  billingDay: "5",
  cardId: "",
  iconKey: "" as string,
});

const shellCard =
  "rounded-2xl border p-5 shadow-sm";

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const SubAvatar: React.FC<{
  src: string;
  name: string;
  fallbackColor: string;
}> = ({ src, name, fallbackColor }) => {
  const [broken, setBroken] = useState(false);
  const initial = name.charAt(0).toUpperCase();
  if (!src || broken) {
    return (
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
        style={{ backgroundColor: fallbackColor }}
      >
        {initial}
      </div>
    );
  }
  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl"
      style={{ backgroundColor: "var(--bg-secondary)" }}
    >
      <img
        src={src}
        alt=""
        className="h-full w-full object-contain p-1"
        onError={() => setBroken(true)}
      />
    </div>
  );
};

const AccountsPage: React.FC<AccountsPageProps> = ({
  subscriptions,
  cards,
  dashboardId,
  onAdd,
  onEdit,
  onDelete,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [pendingDelete, setPendingDelete] = useState<Subscription | null>(null);

  const totalMonthly = useMemo(
    () => subscriptions.reduce((s, x) => s + x.amount, 0),
    [subscriptions]
  );
  const totalYearly = totalMonthly * 12;
  const uniqueCards = useMemo(
    () => new Set(subscriptions.map((s) => s.cardId)).size,
    [subscriptions]
  );

  const today = new Date().getDate();

  const upcomingBills = useMemo(() => {
    return [...subscriptions]
      .sort((a, b) => {
        const daysA =
          a.billingDay >= today
            ? a.billingDay - today
            : a.billingDay + 30 - today;
        const daysB =
          b.billingDay >= today
            ? b.billingDay - today
            : b.billingDay + 30 - today;
        return daysA - daysB;
      })
      .slice(0, 5);
  }, [subscriptions, today]);

  const categoryBreakdown = useMemo(() => {
    const by: Partial<Record<SubscriptionUiCategory, number>> = {};
    subscriptions.forEach((s) => {
      const cat = getUiCategoryForIconKey(s.iconKey);
      by[cat] = (by[cat] || 0) + s.amount;
    });
    return Object.entries(by).sort((a, b) => b[1] - a[1]) as [
      SubscriptionUiCategory,
      number,
    ][];
  }, [subscriptions]);

  const nextBillDays = useMemo(() => {
    if (subscriptions.length === 0) return null;
    let min = Infinity;
    subscriptions.forEach((s) => {
      const d =
        s.billingDay >= today
          ? s.billingDay - today
          : s.billingDay + 30 - today;
      if (d < min) min = d;
    });
    return min === Infinity ? null : min;
  }, [subscriptions, today]);

  const openAdd = () => {
    setEditing(null);
    setForm({
      ...emptyForm(),
      cardId: cards[0]?.id || "",
    });
    setModalOpen(true);
  };

  const openEdit = (sub: Subscription) => {
    setEditing(sub);
    setForm({
      name: sub.name,
      amount: String(sub.amount),
      billingDay: String(sub.billingDay),
      cardId: sub.cardId,
      iconKey: sub.iconKey || "",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(emptyForm());
  };

  useEffect(() => {
    if (!modalOpen) return;
    if (!editing && cards.length > 0) {
      setForm((f) => ({ ...f, cardId: f.cardId || cards[0]?.id || "" }));
    }
  }, [modalOpen, editing, cards]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dashboardId) return;
    const amount = parseFloat(form.amount.replace(",", "."));
    const billingDay = parseInt(form.billingDay, 10);
    if (!form.name.trim() || !form.cardId || !Number.isFinite(amount) || amount < 0) return;
    if (!Number.isInteger(billingDay) || billingDay < 1 || billingDay > 31) return;

    try {
      if (editing) {
        await onEdit(editing.id, {
          name: form.name.trim(),
          amount,
          billingDay,
          cardId: form.cardId,
          imageUrl: null,
          iconKey: form.iconKey || undefined,
        });
      } else {
        await onAdd({
          dashboardId,
          name: form.name.trim(),
          amount,
          billingDay,
          cardId: form.cardId,
          imageUrl: null,
          iconKey: form.iconKey || undefined,
        });
      }
      closeModal();
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await onDelete(pendingDelete.id);
      setPendingDelete(null);
    } catch (err) {
      console.error(err);
    }
  };

  const cardName = (id: string) => cards.find((c) => c.id === id)?.name || "Cartão";

  const inputStyle: React.CSSProperties = {
    backgroundColor: "var(--input-bg)",
    borderColor: "var(--input-border)",
    color: "var(--text)",
    borderWidth: 1,
    borderStyle: "solid",
  };

  const labelCls = "block text-xs font-semibold mb-1.5";
  const labelStyle = { color: "var(--text-muted)" } as React.CSSProperties;

  const kpis = [
    {
      label: "Gasto mensal",
      value: fmt(totalMonthly),
      sub: `${subscriptions.length} assinatura(s)`,
      color: "var(--danger-light)",
      bg: "rgba(244, 63, 94, 0.12)",
    },
    {
      label: "Projeção anual",
      value: fmt(totalYearly),
      sub: "12 × gasto mensal",
      color: "var(--warning)",
      bg: "rgba(245, 158, 11, 0.12)",
    },
    {
      label: "Assinaturas",
      value: String(subscriptions.length),
      sub: "cadastradas",
      color: "var(--success)",
      bg: "rgba(22, 163, 74, 0.12)",
    },
    {
      label: "Próxima cobrança",
      value:
        nextBillDays === null
          ? "—"
          : nextBillDays === 0
            ? "Hoje"
            : `em ${nextBillDays}d`,
      sub: uniqueCards > 0 ? `${uniqueCards} cartão(ões)` : "—",
      color: "var(--primary-light)",
      bg: "var(--primary-bg)",
    },
  ];

  return (
    <div className="space-y-7 pb-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text)" }}>
            Assinaturas
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: "var(--text-muted)" }}>
            Controle seus serviços recorrentes e cobranças no cartão
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          disabled={!dashboardId || cards.length === 0}
          className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-opacity disabled:opacity-50"
          style={{ backgroundColor: "var(--primary)" }}
        >
          <Plus className="h-4 w-4" />
          Nova assinatura
        </button>
      </div>

      {cards.length === 0 && (
        <div
          className="rounded-xl border p-5"
          style={{ backgroundColor: "var(--warning-bg)", borderColor: "var(--warning)" }}
        >
          <p className="text-sm font-medium" style={{ color: "var(--warning)" }}>
            Cadastre pelo menos um cartão na aba Cartões para vincular suas assinaturas.
          </p>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className={shellCard}
            style={{
              backgroundColor: "var(--card)",
              borderColor: "var(--border)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div className="mb-2 flex items-center justify-between">
              <p
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--text-muted)" }}
              >
                {k.label}
              </p>
              <div
                className="flex h-7 w-7 items-center justify-center rounded-lg"
                style={{ backgroundColor: k.bg }}
              >
                <Repeat2 className="h-3.5 w-3.5" style={{ color: k.color }} />
              </div>
            </div>
            <p className="text-xl font-bold" style={{ color: k.color }}>
              {k.value}
            </p>
            <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
              {k.sub}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Lista principal */}
        <div
          className={`${shellCard} p-6 lg:col-span-2`}
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--border)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <h3 className="mb-4 text-base font-semibold" style={{ color: "var(--text)" }}>
            Suas assinaturas
          </h3>

          {subscriptions.length === 0 && cards.length > 0 ? (
            <div className="py-12 text-center">
              <Repeat2 className="mx-auto mb-3 h-12 w-12 opacity-20" style={{ color: "var(--text-muted)" }} />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Nenhuma assinatura cadastrada.
              </p>
              <button
                type="button"
                onClick={openAdd}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white"
                style={{ backgroundColor: "var(--primary)" }}
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {subscriptions.map((sub) => {
                const displayImg = resolveSubscriptionImageUrl(sub.iconKey);
                const cat = getUiCategoryForIconKey(sub.iconKey);
                const catColor = SUBSCRIPTION_CATEGORY_COLORS[cat];
                const daysUntil =
                  sub.billingDay >= today
                    ? sub.billingDay - today
                    : sub.billingDay + 30 - today;
                return (
                  <div
                    key={sub.id}
                    className="flex items-center gap-4 rounded-xl border p-4 transition-colors"
                    style={{
                      borderColor: "var(--border)",
                      backgroundColor: "var(--card)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "var(--card)";
                    }}
                  >
                    <SubAvatar src={displayImg} name={sub.name} fallbackColor={catColor} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                          {sub.name}
                        </p>
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                          style={{
                            backgroundColor: `${catColor}22`,
                            color: catColor,
                          }}
                        >
                          {SUBSCRIPTION_CATEGORY_LABELS[cat]}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                        Dia {sub.billingDay} · {cardName(sub.cardId)} ·{" "}
                        {daysUntil === 0 ? "vence hoje" : `vence em ${daysUntil}d`}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-bold" style={{ color: "var(--danger-light)" }}>
                      {fmt(sub.amount)}/mês
                    </p>
                    <div
                      className="flex shrink-0 items-center gap-0.5 rounded-xl border p-0.5 touch-manipulation"
                      style={{
                        borderColor: "var(--border)",
                        backgroundColor: "var(--bg-secondary)",
                      }}
                      role="group"
                      aria-label="Ações da assinatura"
                    >
                      <button
                        type="button"
                        onClick={() => openEdit(sub)}
                        className="flex h-10 w-10 items-center justify-center rounded-lg sm:h-9 sm:w-9"
                        style={{ color: "var(--text-muted)" }}
                        title="Editar"
                        aria-label="Editar assinatura"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(sub)}
                        className="flex h-10 w-10 items-center justify-center rounded-lg sm:h-9 sm:w-9"
                        style={{ color: "var(--danger)" }}
                        title="Excluir"
                        aria-label="Excluir assinatura"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Coluna direita */}
        <div className="space-y-5">
          <div
            className={shellCard}
            style={{
              backgroundColor: "var(--card)",
              borderColor: "var(--border)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <h3 className="mb-3 text-sm font-semibold" style={{ color: "var(--text)" }}>
              Próximas cobranças
            </h3>
            {upcomingBills.length === 0 ? (
              <p className="py-4 text-center text-xs" style={{ color: "var(--text-muted)" }}>
                Nenhuma assinatura cadastrada.
              </p>
            ) : (
              <div className="space-y-2.5">
                {upcomingBills.map((sub) => {
                  const daysUntil =
                    sub.billingDay >= today
                      ? sub.billingDay - today
                      : sub.billingDay + 30 - today;
                  const urgent = daysUntil <= 3;
                  return (
                    <div key={sub.id} className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold" style={{ color: "var(--text)" }}>
                          {sub.name}
                        </p>
                        <p
                          className="text-[10px]"
                          style={{
                            color: urgent ? "var(--danger-light)" : "var(--text-muted)",
                            fontWeight: urgent ? 600 : 400,
                          }}
                        >
                          {daysUntil === 0 ? "Hoje!" : `em ${daysUntil} dia(s)`}
                        </p>
                      </div>
                      <p className="text-xs font-bold" style={{ color: "var(--danger-light)" }}>
                        {fmt(sub.amount)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div
            className={shellCard}
            style={{
              backgroundColor: "var(--card)",
              borderColor: "var(--border)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <h3 className="mb-3 text-sm font-semibold" style={{ color: "var(--text)" }}>
              Por categoria
            </h3>
            {categoryBreakdown.length === 0 ? (
              <p className="py-4 text-center text-xs" style={{ color: "var(--text-muted)" }}>
                Sem dados
              </p>
            ) : (
              <div className="space-y-3">
                {categoryBreakdown.map(([cat, val]) => (
                  <div key={cat}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="font-medium" style={{ color: "var(--text)" }}>
                        {SUBSCRIPTION_CATEGORY_LABELS[cat]}
                      </span>
                      <span style={{ color: "var(--text-muted)" }}>{fmt(val)}</span>
                    </div>
                    <div
                      className="h-1.5 overflow-hidden rounded-full"
                      style={{ backgroundColor: "var(--bg-secondary)" }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${totalMonthly > 0 ? (val / totalMonthly) * 100 : 0}%`,
                          backgroundColor: SUBSCRIPTION_CATEGORY_COLORS[cat],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal add/edit */}
      {modalOpen && (
        <Portal>
          <div
            className="fixed inset-0 z-[100000] flex items-center justify-center overflow-y-auto p-4"
            style={{ backgroundColor: "var(--overlay)" }}
            onClick={(e) => e.target === e.currentTarget && closeModal()}
          >
            <div
              className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border"
              style={{
                backgroundColor: "var(--card)",
                borderColor: "var(--border)",
                boxShadow: "var(--shadow)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={closeModal}
                className="absolute right-4 top-4 z-10 rounded-lg p-2"
                style={{ color: "var(--text-muted)" }}
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="p-6 sm:p-8">
                <h2 className="text-xl font-bold" style={{ color: "var(--text)" }}>
                  {editing ? "Editar assinatura" : "Nova assinatura"}
                </h2>
               

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div>
                    <label className={labelCls} style={labelStyle}>
                      Nome do serviço
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                      style={inputStyle}
                      placeholder="Ex.: Netflix família"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls} style={labelStyle}>
                        Valor mensal (R$)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={form.amount}
                        onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                        className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                        style={inputStyle}
                        placeholder="29,90"
                        required
                      />
                    </div>
                    <div>
                      <label className={labelCls} style={labelStyle}>
                        Dia de cobrança
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={31}
                        value={form.billingDay}
                        onChange={(e) => setForm((f) => ({ ...f, billingDay: e.target.value }))}
                        className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                        style={inputStyle}
                        placeholder="10"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelCls} style={labelStyle}>
                        Serviço (logo)
                      </label>
                      <select
                        value={form.iconKey}
                        onChange={(e) => {
                          const key = e.target.value;
                          const preset = SUBSCRIPTION_PRESETS.find((p) => p.id === key);
                          setForm((f) => ({
                            ...f,
                            iconKey: key,
                            name: preset && !editing ? preset.label : f.name,
                          }));
                        }}
                        className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                        style={inputStyle}
                      >
                        <option value="">Personalizado (sem preset)</option>
                        {SUBSCRIPTION_PRESETS.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls} style={labelStyle}>
                        Cartão
                      </label>
                      <select
                        value={form.cardId}
                        onChange={(e) => setForm((f) => ({ ...f, cardId: e.target.value }))}
                        className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                        style={inputStyle}
                        required
                      >
                        <option value="" disabled>
                          Selecione
                        </option>
                        {cards.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                            {c.bank ? ` — ${c.bank}` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-xl py-3 text-sm font-semibold text-white"
                    style={{ backgroundColor: "var(--primary)" }}
                  >
                    {editing ? "Salvar alterações" : "Adicionar assinatura"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Confirmação excluir */}
      {pendingDelete && (
        <Portal>
          <div
            className="fixed inset-0 z-[100001] flex items-center justify-center p-4"
            style={{ backgroundColor: "var(--overlay)" }}
            onClick={() => setPendingDelete(null)}
          >
            <div
              className="w-full max-w-sm rounded-2xl border p-6"
              style={{
                backgroundColor: "var(--card)",
                borderColor: "var(--border)",
                boxShadow: "var(--shadow)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold" style={{ color: "var(--text)" }}>
                Excluir assinatura?
              </h3>
              <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
                A assinatura &quot;{pendingDelete.name}&quot; será removida permanentemente.
              </p>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPendingDelete(null)}
                  className="rounded-xl px-4 py-2 text-sm font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-white"
                  style={{ backgroundColor: "var(--danger)" }}
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
};

export default AccountsPage;
