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
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { apiRequest } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { colors, radii, typography } from "../theme/tokens";
import {
  getCurrentMonthKey,
  shiftMonthKey,
  formatMonthKeyLabel,
  isTransactionInMonthKey,
} from "../utils/monthKey";
import { ScreenChrome } from "../components/ui/ScreenChrome";
import {
  AddBudgetModal,
  type EditingBudget,
} from "../components/modals/AddBudgetModal";
import type { MoreStackParamList } from "../navigation/types";

type BudgetRow = {
  id: string;
  nome?: string;
  name?: string;
  tipo?: string;
  limit_value?: number;
  limitValue?: number;
};

type ApiTx = {
  id: string;
  tipo?: string;
  data?: string;
  valor?: number;
  budget_id?: string;
};

function toEditingBudget(b: BudgetRow): EditingBudget {
  return {
    id: b.id,
    nome: b.nome,
    name: b.name,
    tipo: b.tipo,
    limit_value: b.limit_value,
    limitValue: b.limitValue,
  };
}

export function BudgetsScreen() {
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<MoreStackParamList, "Budgets">>();
  const { currentDashboard } = useAuth();
  const [rows, setRows] = useState<BudgetRow[]>([]);
  const [transactions, setTransactions] = useState<ApiTx[]>([]);
  const [referenceMonth, setReferenceMonth] = useState(() =>
    getCurrentMonthKey(),
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EditingBudget | null>(null);

  const load = useCallback(async () => {
    if (!currentDashboard?.id) {
      setRows([]);
      setTransactions([]);
      return;
    }
    const [bData, tData] = await Promise.all([
      apiRequest<BudgetRow[]>(
        `/budgets?dashboard_id=${currentDashboard.id}`,
      ),
      apiRequest<ApiTx[]>(`/transacoes?dashboard_id=${currentDashboard.id}`),
    ]);
    setRows(Array.isArray(bData) ? bData : []);
    const raw = Array.isArray(tData) ? tData : [];
    const flat = raw.map((x: ApiTx & { budget?: unknown }) => {
      const b = (x as { budget?: { id?: string } }).budget;
      const budget_id =
        x.budget_id ?? (b && typeof b === "object" && b.id ? b.id : undefined);
      return { ...x, budget_id };
    });
    setTransactions(flat);
  }, [currentDashboard?.id]);

  useEffect(() => {
    let c = false;
    (async () => {
      try {
        setLoading(true);
        await load();
      } catch {
        if (!c) {
          setRows([]);
          setTransactions([]);
        }
      } finally {
        if (!c) setLoading(false);
      }
    })();
    return () => {
      c = true;
    };
  }, [load]);

  const spendingByBudget = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of transactions) {
      if (
        !t.budget_id ||
        !t.data ||
        !isTransactionInMonthKey(t.data, referenceMonth)
      ) {
        continue;
      }
      const cat = rows.find((r) => r.id === t.budget_id);
      if (!cat) continue;
      const tipo = (cat.tipo ?? "").toLowerCase();
      const isExpense = tipo === "expense" || tipo === "despesa";
      const isIncome = tipo === "income" || tipo === "receita";
      if (isExpense && t.tipo !== "despesa") continue;
      if (isIncome && t.tipo !== "receita") continue;
      const id = t.budget_id;
      map[id] = (map[id] || 0) + (Number(t.valor) || 0);
    }
    return map;
  }, [transactions, referenceMonth, rows]);

  const fmt = (n: number) =>
    n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (b: BudgetRow) => {
    setEditing(toEditingBudget(b));
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const confirmDelete = (b: BudgetRow) => {
    const label = b.nome ?? b.name ?? "Categoria";
    Alert.alert(
      "Excluir orçamento",
      `Remover "${label}"? Lançamentos podem ficar sem categoria.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await apiRequest(`/budgets/${b.id}`, { method: "DELETE" });
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

  const monthBar = (
    <View style={styles.monthRow}>
      <Text style={styles.monthLabel}>Mês de referência</Text>
      <View style={styles.monthNav}>
        <TouchableOpacity
          onPress={() => setReferenceMonth((m) => shiftMonthKey(m, -1))}
          style={styles.monthBtn}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>
          {formatMonthKeyLabel(referenceMonth)}
        </Text>
        <TouchableOpacity
          onPress={() => setReferenceMonth((m) => shiftMonthKey(m, 1))}
          style={styles.monthBtn}
        >
          <Ionicons name="chevron-forward" size={22} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setReferenceMonth(getCurrentMonthKey())}
          style={styles.todayBtn}
        >
          <Text style={styles.todayBtnText}>Hoje</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.monthHint}>
        Gastos e receitas do mês civil; o limite da categoria é fixo.
      </Text>
    </View>
  );

  return (
    <View style={[styles.flex, { paddingBottom: insets.bottom }]}>
      <ScreenChrome
        title="Orçamento"
        subtitle={`${currentDashboard?.name ?? "Dashboard"} · categorias e limites`}
        onBack={() => navigation.goBack()}
        onAdd={openCreate}
        addLabel="Novo"
        accentColor="#a78bfa"
        contentStyle={styles.chromeContent}
      >
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#a78bfa" />
          </View>
        ) : (
          <FlatList
            data={rows}
            keyExtractor={(b) => b.id}
            ListHeaderComponent={monthBar}
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
                tintColor="#a78bfa"
              />
            }
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>Nenhum orçamento</Text>
                <Text style={styles.emptySub}>
                  Toque em &quot;Novo&quot; para criar uma categoria.
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const label = item.nome ?? item.name ?? "Categoria";
              const cap = Number(item.limit_value ?? item.limitValue ?? 0);
              const tipoRaw = (item.tipo ?? "").toLowerCase();
              const tipoLabel =
                tipoRaw === "income" || tipoRaw === "receita"
                  ? "Receita"
                  : "Despesa";
              const spent = spendingByBudget[item.id] || 0;
              const pct = cap > 0 ? Math.min(100, (spent / cap) * 100) : 0;
              const over = spent > cap;
              return (
                <View style={styles.card}>
                  <View style={styles.cardHead}>
                    <View style={styles.cardTitleBlock}>
                      <Text style={styles.name}>{label}</Text>
                      <View style={styles.tag}>
                        <Text style={styles.tagText}>{tipoLabel}</Text>
                      </View>
                    </View>
                    <View style={styles.rowActions}>
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
                  <View style={styles.rowVals}>
                    <View>
                      <Text style={styles.limitLabel}>No mês</Text>
                      <Text
                        style={[
                          styles.spentVal,
                          { color: over ? colors.danger : colors.text },
                        ]}
                      >
                        {fmt(spent)}
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={styles.limitLabel}>Limite</Text>
                      <Text style={styles.limitVal}>{fmt(cap)}</Text>
                    </View>
                  </View>
                  <View style={styles.meterBg}>
                    <View
                      style={[
                        styles.meterFill,
                        {
                          width: `${pct}%`,
                          backgroundColor: over ? colors.danger : "#a78bfa",
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            }}
          />
        )}
      </ScreenChrome>

      <AddBudgetModal
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
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  monthRow: {
    marginBottom: 16,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  monthLabel: { ...typography.caption, marginBottom: 8 },
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
    minWidth: 140,
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
  todayBtnText: { color: "#a78bfa", fontWeight: "700", fontSize: 13 },
  monthHint: { ...typography.caption, marginTop: 10, lineHeight: 18 },
  list: { paddingTop: 8, paddingBottom: 100, paddingHorizontal: 20 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 8,
  },
  cardTitleBlock: { flex: 1, minWidth: 0 },
  rowActions: { flexDirection: "row", alignItems: "center", gap: 4 },
  iconBtn: { padding: 6 },
  name: { fontSize: 16, fontWeight: "700", color: colors.text },
  tag: {
    marginTop: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
    backgroundColor: colors.surface2,
  },
  tagText: { fontSize: 11, fontWeight: "700", color: colors.textSecondary },
  rowVals: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  limitLabel: { ...typography.caption, marginBottom: 4 },
  spentVal: { fontSize: 18, fontWeight: "800" },
  limitVal: { fontSize: 16, fontWeight: "700", color: "#a78bfa" },
  meterBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surface2,
    overflow: "hidden",
  },
  meterFill: { height: 8, borderRadius: 4 },
  empty: { paddingVertical: 40, alignItems: "center", paddingHorizontal: 16 },
  emptyTitle: { ...typography.title, marginBottom: 8 },
  emptySub: { ...typography.subtitle, textAlign: "center", maxWidth: 300 },
});
