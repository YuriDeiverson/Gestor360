import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { apiRequest } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { colors, radii, typography } from "../theme/tokens";
import {
  getCurrentMonthKey,
  shiftMonthKey,
  formatMonthKeyLabel,
  dateToMonthKey,
} from "../utils/monthKey";
import { creditCardUsageInMonth } from "../utils/cardUsageMonth";
import { ScreenChrome } from "../components/ui/ScreenChrome";
import {
  AddCardModal,
  type EditingCard,
} from "../components/modals/AddCardModal";

type ApiCard = {
  id: string;
  name: string;
  bank?: string;
  card_limit: number;
  closing_day?: number;
  due_day?: number;
  current_balance?: number;
  status: string;
};

type ApiTx = {
  tipo?: string;
  method?: string;
  account?: string;
  data?: string;
  descricao?: string;
  valor?: number;
  installments?: number;
  currentinstallment?: number;
  nextpaymentdate?: string;
  status?: string;
};

type SubRow = { card_id?: string; amount?: number };

function toEditingCard(c: ApiCard): EditingCard {
  return {
    id: c.id,
    name: c.name,
    bank: c.bank,
    card_limit: Number(c.card_limit),
    closing_day: Number(c.closing_day ?? 1),
    due_day: Number(c.due_day ?? 1),
  };
}

export function CardsScreen() {
  const insets = useSafeAreaInsets();
  const { currentDashboard } = useAuth();
  const [cards, setCards] = useState<ApiCard[]>([]);
  const [transactions, setTransactions] = useState<ApiTx[]>([]);
  const [subs, setSubs] = useState<SubRow[]>([]);
  const [cardMonthKey, setCardMonthKey] = useState(() => getCurrentMonthKey());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EditingCard | null>(null);

  const load = useCallback(async () => {
    if (!currentDashboard?.id) {
      setCards([]);
      setTransactions([]);
      setSubs([]);
      return;
    }
    const id = currentDashboard.id;
    const [cData, tData, sData] = await Promise.all([
      apiRequest<ApiCard[]>(`/cards?dashboard_id=${id}`),
      apiRequest<ApiTx[]>(`/transacoes?dashboard_id=${id}`),
      apiRequest<SubRow[]>(`/subscriptions?dashboard_id=${id}`).catch(() => []),
    ]);
    setCards(Array.isArray(cData) ? cData : []);
    setTransactions(Array.isArray(tData) ? tData : []);
    setSubs(Array.isArray(sData) ? sData : []);
  }, [currentDashboard?.id]);

  useEffect(() => {
    let c = false;
    (async () => {
      try {
        setLoading(true);
        await load();
      } catch {
        if (!c) {
          setCards([]);
          setTransactions([]);
          setSubs([]);
        }
      } finally {
        if (!c) setLoading(false);
      }
    })();
    return () => {
      c = true;
    };
  }, [load]);

  const usageByCard = useMemo(() => {
    const map: Record<string, number> = {};
    for (const card of cards) {
      const txU = creditCardUsageInMonth(
        transactions,
        card.id,
        cardMonthKey,
      );
      const subMonthly = subs
        .filter((s) => s.card_id === card.id)
        .reduce((a, s) => a + (Number(s.amount) || 0), 0);
      const fromSubTx = transactions
        .filter(
          (t) =>
            t.account === card.id &&
            t.tipo === "despesa" &&
            t.method === "Cartão de Crédito" &&
            String(t.descricao ?? "").startsWith("Assinatura:") &&
            t.data &&
            dateToMonthKey(t.data) === cardMonthKey,
        )
        .reduce((sum, t) => sum + (Number(t.valor) || 0), 0);
      map[card.id] = txU + Math.max(0, subMonthly - fromSubTx);
    }
    return map;
  }, [cards, transactions, subs, cardMonthKey]);

  const fmt = (n: number) =>
    n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (card: ApiCard) => {
    setEditing(toEditingCard(card));
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const confirmDelete = (card: ApiCard) => {
    Alert.alert(
      "Excluir cartão",
      `Remover "${card.name}"? Assinaturas vinculadas podem precisar de ajuste.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await apiRequest(`/cards/${card.id}`, { method: "DELETE" });
              await load();
            } catch (e) {
              Alert.alert(
                "Erro",
                e instanceof Error ? e.message : "Não foi possível excluir.",
              );
            }
          },
        },
      ],
    );
  };

  const monthHeader = (
    <View style={styles.monthBlock}>
      <Text style={styles.monthHint}>
        Uso no mês civil (1º ao último dia). Parcelas no mês da compra.
      </Text>
      <View style={styles.monthNav}>
        <TouchableOpacity
          onPress={() => setCardMonthKey((m) => shiftMonthKey(m, -1))}
          style={styles.monthBtn}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>
          {formatMonthKeyLabel(cardMonthKey)}
        </Text>
        <TouchableOpacity
          onPress={() => setCardMonthKey((m) => shiftMonthKey(m, 1))}
          style={styles.monthBtn}
        >
          <Ionicons name="chevron-forward" size={22} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setCardMonthKey(getCurrentMonthKey())}
          style={styles.todayBtn}
        >
          <Text style={styles.todayBtnText}>Mês atual</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.flex, { paddingBottom: insets.bottom }]}>
      <ScreenChrome
        title="Cartões"
        subtitle={`${currentDashboard?.name ?? "Dashboard"} · limite e uso por mês`}
        onAdd={openCreate}
        addLabel="Novo"
        accentColor={colors.primary}
        contentStyle={styles.chromeContent}
      >
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={cards}
            keyExtractor={(c) => c.id}
            ListHeaderComponent={monthHeader}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={async () => {
                  setRefreshing(true);
                  try {
                    await load();
                  } finally {
                    setRefreshing(false);
                  }
                }}
                tintColor={colors.primary}
              />
            }
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>Sem cartões</Text>
                <Text style={styles.emptySub}>
                  Toque em &quot;Novo&quot; para cadastrar um cartão.
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const used = usageByCard[item.id] ?? 0;
              const limit = Number(item.card_limit);
              const avail = Math.max(0, limit - used);
              const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
              return (
                <View style={styles.card}>
                  <View style={styles.cardTop}>
                    <View style={styles.cardTitleBlock}>
                      <Text style={styles.cardName}>{item.name}</Text>
                      {item.bank ? (
                        <Text style={styles.bank}>{item.bank}</Text>
                      ) : null}
                    </View>
                    <View style={styles.cardActions}>
                      <View
                        style={[
                          styles.badge,
                          item.status === "active" && styles.badgeOk,
                        ]}
                      >
                        <Text style={styles.badgeText}>
                          {item.status === "active" ? "Ativo" : item.status}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => openEdit(item)}
                        style={styles.iconBtn}
                        hitSlop={8}
                      >
                        <Ionicons
                          name="pencil"
                          size={20}
                          color={colors.textSecondary}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => confirmDelete(item)}
                        style={styles.iconBtn}
                        hitSlop={8}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={20}
                          color={colors.danger}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.meterBg}>
                    <View
                      style={[
                        styles.meterFill,
                        {
                          width: `${pct}%`,
                          backgroundColor:
                            pct > 90 ? colors.danger : colors.primary,
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.cardRow}>
                    <Text style={styles.muted}>Uso no mês</Text>
                    <Text style={styles.val}>{fmt(used)}</Text>
                  </View>
                  <View style={styles.cardRow}>
                    <Text style={styles.muted}>Disponível</Text>
                    <Text style={styles.val}>{fmt(avail)}</Text>
                  </View>
                  <View style={styles.cardRow}>
                    <Text style={styles.muted}>Limite</Text>
                    <Text style={styles.val}>{fmt(limit)}</Text>
                  </View>
                  {item.due_day != null ? (
                    <Text style={styles.due}>Vencimento dia {item.due_day}</Text>
                  ) : null}
                </View>
              );
            }}
          />
        )}
      </ScreenChrome>

      <AddCardModal
        visible={modalOpen}
        onClose={closeModal}
        dashboardId={currentDashboard?.id}
        editing={editing}
        onSuccess={load}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  chromeContent: { paddingHorizontal: 0 },
  monthBlock: {
    paddingHorizontal: 20,
    marginBottom: 12,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  monthHint: { ...typography.caption, marginBottom: 10, lineHeight: 18 },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  monthBtn: {
    padding: 8,
    borderRadius: radii.sm,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  monthTitle: {
    flex: 1,
    minWidth: 120,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    textTransform: "capitalize",
  },
  todayBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.sm,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  todayBtnText: { color: colors.primary, fontWeight: "700", fontSize: 13 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { paddingBottom: 100, paddingHorizontal: 20 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
    gap: 8,
  },
  cardTitleBlock: { flex: 1, minWidth: 0 },
  cardActions: { flexDirection: "row", alignItems: "center", gap: 4 },
  cardName: { fontSize: 17, fontWeight: "700", color: colors.text },
  bank: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
    backgroundColor: colors.surface2,
  },
  badgeOk: { backgroundColor: "rgba(52,211,153,0.15)" },
  badgeText: { fontSize: 11, fontWeight: "700", color: colors.textSecondary },
  iconBtn: { padding: 6 },
  meterBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surface2,
    overflow: "hidden",
    marginBottom: 14,
  },
  meterFill: { height: 6, borderRadius: 3 },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  muted: { color: colors.textMuted, fontSize: 14 },
  val: { color: colors.text, fontSize: 15, fontWeight: "600" },
  due: { marginTop: 8, fontSize: 12, color: colors.textSecondary },
  empty: {
    paddingVertical: 48,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  emptyTitle: { ...typography.title, marginBottom: 8 },
  emptySub: { ...typography.subtitle, textAlign: "center" },
});
