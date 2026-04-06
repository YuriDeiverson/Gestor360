import React, { useCallback, useEffect, useState } from "react";
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
import { useRoute, RouteProp } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { apiRequest } from "../api/client";
import { useAuth } from "../context/AuthContext";
import type { MainTabParamList } from "../navigation/types";
import { colors, radii, typography } from "../theme/tokens";
import { ScreenChrome } from "../components/ui/ScreenChrome";
import {
  AddTransactionModal,
  type EditingTransaction,
  type BudgetOpt,
  type CardOpt,
} from "../components/modals/AddTransactionModal";

type ApiTransaction = {
  id: string;
  descricao: string;
  valor: number;
  tipo: string;
  data: string;
  status?: string;
  method?: string;
  account?: string;
  budget_id?: string;
  categoria?: string;
  installments?: number;
  currentinstallment?: number;
  totalamount?: number;
  remainingamount?: number;
  nextpaymentdate?: string;
  budget?: { id?: string };
};

function toEditing(t: ApiTransaction): EditingTransaction {
  const b = t.budget_id ?? t.budget?.id;
  return {
    id: t.id,
    descricao: t.descricao,
    valor: Number(t.valor),
    data: t.data,
    tipo: t.tipo,
    budget_id: b ?? null,
    categoria: t.categoria,
    method: t.method,
    account: t.account,
    status: t.status,
    installments: t.installments,
    currentinstallment: t.currentinstallment,
    totalamount: t.totalamount,
    remainingamount: t.remainingamount,
    nextpaymentdate: t.nextpaymentdate,
  };
}

export function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteProp<MainTabParamList, "Income" | "Expenses">>();
  const tipoFilter = route.name === "Income" ? "receita" : "despesa";
  const { currentDashboard } = useAuth();
  const [items, setItems] = useState<ApiTransaction[]>([]);
  const [budgets, setBudgets] = useState<BudgetOpt[]>([]);
  const [cards, setCards] = useState<CardOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EditingTransaction | null>(null);

  const load = useCallback(async () => {
    if (!currentDashboard?.id) {
      setItems([]);
      setBudgets([]);
      setCards([]);
      return;
    }
    const id = currentDashboard.id;
    const [tData, bData, cData] = await Promise.all([
      apiRequest<ApiTransaction[]>(`/transacoes?dashboard_id=${id}`),
      apiRequest<BudgetOpt[]>(`/budgets?dashboard_id=${id}`).catch(() => []),
      apiRequest<Array<{ id: string; name: string }>>(
        `/cards?dashboard_id=${id}`,
      ).catch(() => []),
    ]);
    const list = Array.isArray(tData) ? tData : [];
    setItems(list.filter((t) => t.tipo === tipoFilter));
    setBudgets(Array.isArray(bData) ? bData : []);
    const clist = Array.isArray(cData) ? cData : [];
    setCards(clist.map((c) => ({ id: c.id, name: c.name })));
  }, [currentDashboard?.id, tipoFilter]);

  useEffect(() => {
    let c = false;
    (async () => {
      try {
        setLoading(true);
        await load();
      } catch {
        if (!c) {
          setItems([]);
          setBudgets([]);
          setCards([]);
        }
      } finally {
        if (!c) setLoading(false);
      }
    })();
    return () => {
      c = true;
    };
  }, [load]);

  const fmt = (n: number) =>
    n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const title = tipoFilter === "receita" ? "Receitas" : "Despesas";
  const accent = tipoFilter === "receita" ? colors.success : colors.danger;

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (t: ApiTransaction) => {
    setEditing(toEditing(t));
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const confirmDelete = (t: ApiTransaction) => {
    Alert.alert(
      "Excluir lançamento",
      `Remover "${t.descricao}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await apiRequest(`/transacoes/${t.id}`, { method: "DELETE" });
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

  const payInstallment = (t: ApiTransaction) => {
    const inst = t.installments ?? 1;
    const cur = t.currentinstallment ?? 1;
    if (inst <= 1 || cur >= inst) return;
    Alert.alert(
      "Pagar parcela",
      `Registrar pagamento da parcela ${cur}/${inst}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Pagar",
          onPress: async () => {
            try {
              await apiRequest(`/transacoes/${t.id}/pay-installment`, {
                method: "POST",
              });
              await load();
            } catch (e) {
              Alert.alert(
                "Erro",
                e instanceof Error ? e.message : "Falha ao pagar parcela.",
              );
            }
          },
        },
      ],
    );
  };

  const instLabel = (t: ApiTransaction) => {
    const n = t.installments ?? 1;
    if (n <= 1) return null;
    const c = t.currentinstallment ?? 1;
    return `${c}/${n}`;
  };

  return (
    <View style={[styles.flex, { paddingBottom: insets.bottom }]}>
      <ScreenChrome
        title={title}
        subtitle={`${currentDashboard?.name ?? "Dashboard"} · ${items.length} lançamentos`}
        onAdd={openCreate}
        addLabel="Novo"
        accentColor={accent}
        contentStyle={styles.chromeContent}
      >
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={accent} />
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
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
                tintColor={accent}
              />
            }
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>Nada por aqui</Text>
                <Text style={styles.emptySub}>
                  Toque em &quot;Novo&quot; para lançar {title.toLowerCase()}.
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const il = instLabel(item);
              const canPay =
                tipoFilter === "despesa" &&
                item.status === "pending" &&
                (item.installments ?? 1) > 1 &&
                (item.currentinstallment ?? 1) < (item.installments ?? 1);
              return (
                <View style={styles.row}>
                  <View style={[styles.bar, { backgroundColor: accent }]} />
                  <View style={styles.rowBody}>
                    <Text style={styles.desc} numberOfLines={2}>
                      {item.descricao}
                    </Text>
                    <Text style={styles.date}>
                      {item.data}
                      {il ? ` · Parc. ${il}` : ""}
                    </Text>
                  </View>
                  <Text style={[styles.amount, { color: accent }]}>
                    {tipoFilter === "receita" ? "+" : "−"}
                    {fmt(Math.abs(Number(item.valor)))}
                  </Text>
                  <View style={styles.actions}>
                    {canPay ? (
                      <TouchableOpacity
                        onPress={() => payInstallment(item)}
                        style={styles.iconBtn}
                        hitSlop={8}
                      >
                        <Ionicons
                          name="cash-outline"
                          size={20}
                          color={colors.primary}
                        />
                      </TouchableOpacity>
                    ) : null}
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
              );
            }}
          />
        )}
      </ScreenChrome>

      <AddTransactionModal
        visible={modalOpen}
        onClose={closeModal}
        dashboardId={currentDashboard?.id}
        tipo={tipoFilter}
        budgets={budgets}
        cards={cards}
        editing={editing}
        onSuccess={load}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  chromeContent: { paddingHorizontal: 0 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { paddingBottom: 100, paddingHorizontal: 20 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  bar: { width: 3, height: 36, borderRadius: 2 },
  rowBody: { flex: 1, minWidth: 0 },
  desc: { color: colors.text, fontSize: 15, fontWeight: "600" },
  date: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  amount: { fontSize: 15, fontWeight: "800" },
  actions: { flexDirection: "row", alignItems: "center", gap: 4 },
  iconBtn: { padding: 6 },
  empty: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  emptyTitle: { ...typography.title, marginBottom: 8 },
  emptySub: { ...typography.subtitle, textAlign: "center" },
});
