import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { apiRequest } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { DashboardSwitcher } from "../components/DashboardSwitcher";
import {
  AddTransactionModal,
  type CardOpt,
} from "../components/modals/AddTransactionModal";
import { AddCardModal } from "../components/modals/AddCardModal";
import { AddBudgetModal } from "../components/modals/AddBudgetModal";
import { AddGoalModal } from "../components/modals/AddGoalModal";
import { AddSubscriptionModal } from "../components/modals/AddSubscriptionModal";
import { colors, radii, shadows, typography } from "../theme/tokens";
import { initialsFromName } from "../utils/initials";

type ApiTransaction = {
  id: string;
  descricao: string;
  valor: number;
  tipo: string;
  data: string;
  status?: string;
};

type BudgetRow = {
  id: string;
  nome?: string;
  name?: string;
  tipo?: string;
};

type ModalKey =
  | "income"
  | "expense"
  | "card"
  | "budget"
  | "goal"
  | "sub"
  | null;

const quickActions: {
  key: Exclude<ModalKey, null>;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}[] = [
  { key: "income", label: "Receita", icon: "trending-up", color: colors.success },
  { key: "expense", label: "Despesa", icon: "trending-down", color: colors.danger },
  { key: "card", label: "Cartão", icon: "card", color: colors.primary },
  { key: "budget", label: "Orçamento", icon: "pie-chart", color: "#a78bfa" },
  { key: "goal", label: "Meta", icon: "flag", color: colors.warning },
  { key: "sub", label: "Assinatura", icon: "repeat", color: "#38bdf8" },
];

export function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const {
    user,
    currentDashboard,
    dashboards,
    logout,
    switchDashboard,
  } = useAuth();
  const [transactions, setTransactions] = useState<ApiTransaction[]>([]);
  const [budgets, setBudgets] = useState<BudgetRow[]>([]);
  const [cardsList, setCardsList] = useState<CardOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalKey>(null);

  const loadTx = useCallback(async () => {
    if (!currentDashboard?.id) {
      setTransactions([]);
      return;
    }
    const data = await apiRequest<ApiTransaction[]>(
      `/transacoes?dashboard_id=${currentDashboard.id}`,
    );
    setTransactions(Array.isArray(data) ? data : []);
  }, [currentDashboard?.id]);

  const loadBudgets = useCallback(async () => {
    if (!currentDashboard?.id) {
      setBudgets([]);
      return;
    }
    const data = await apiRequest<BudgetRow[]>(
      `/budgets?dashboard_id=${currentDashboard.id}`,
    );
    setBudgets(Array.isArray(data) ? data : []);
  }, [currentDashboard?.id]);

  const loadCards = useCallback(async () => {
    if (!currentDashboard?.id) {
      setCardsList([]);
      return;
    }
    const data = await apiRequest<Array<{ id: string; name: string }>>(
      `/cards?dashboard_id=${currentDashboard.id}`,
    );
    const list = Array.isArray(data) ? data : [];
    setCardsList(list.map((c) => ({ id: c.id, name: c.name })));
  }, [currentDashboard?.id]);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadTx(), loadBudgets(), loadCards()]);
  }, [loadTx, loadBudgets, loadCards]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        if (!currentDashboard?.id) {
          setTransactions([]);
          setBudgets([]);
          setCardsList([]);
          return;
        }
        await refreshAll();
      } catch {
        if (!cancelled) {
          setTransactions([]);
          setBudgets([]);
          setCardsList([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentDashboard?.id, refreshAll]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshAll();
    } finally {
      setRefreshing(false);
    }
  };

  const stats = useMemo(() => {
    const now = new Date();
    const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const monthRows = transactions.filter(
      (t) => typeof t.data === "string" && t.data.startsWith(key),
    );
    const income = monthRows
      .filter((t) => t.tipo === "receita")
      .reduce((s, t) => s + Number(t.valor), 0);
    const expense = monthRows
      .filter((t) => t.tipo === "despesa")
      .reduce((s, t) => s + Number(t.valor), 0);
    return { income, expense, month: monthRows.length };
  }, [transactions]);

  const fmt = (n: number) =>
    n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const firstName = user?.name?.split(" ")[0] ?? "Olá";
  const initials = initialsFromName(user?.name, "+");

  const dashId = currentDashboard?.id;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12 }]}>
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.brandName}>Financeiro +</Text>
            <Text style={typography.subtitle} numberOfLines={1}>
              {currentDashboard?.name ?? "Dashboard"}
            </Text>
          </View>
          <TouchableOpacity
            onPress={logout}
            style={styles.iconBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.iconBtnText}>Sair</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.greeting}>Olá, {firstName}</Text>

        <DashboardSwitcher
          dashboards={dashboards}
          currentId={currentDashboard?.id}
          onSelect={switchDashboard}
        />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[typography.label, styles.quickTitle]}>
            Cadastrar agora
          </Text>
          <View style={styles.quickGrid}>
            {quickActions.map((a) => (
              <TouchableOpacity
                key={a.key}
                style={styles.quickCell}
                onPress={() => setActiveModal(a.key)}
                activeOpacity={0.88}
              >
                <View
                  style={[
                    styles.quickIconWrap,
                    { backgroundColor: `${a.color}22` },
                  ]}
                >
                  <Ionicons name={a.icon} size={22} color={a.color} />
                </View>
                <Text style={styles.quickLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={[styles.summaryCard, shadows.card]}>
            <Text style={typography.label}>Resumo do mês</Text>
            <View style={styles.statGrid}>
              <View style={styles.statCell}>
                <Text style={styles.statLabel}>Receitas</Text>
                <Text style={[styles.statValue, { color: colors.success }]}>
                  {fmt(stats.income)}
                </Text>
              </View>
              <View style={styles.statCell}>
                <Text style={styles.statLabel}>Despesas</Text>
                <Text style={[styles.statValue, { color: colors.danger }]}>
                  {fmt(stats.expense)}
                </Text>
              </View>
            </View>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceLabel}>Saldo</Text>
              <Text
                style={[
                  styles.balanceValue,
                  {
                    color:
                      stats.income - stats.expense >= 0
                        ? colors.success
                        : colors.danger,
                  },
                ]}
              >
                {fmt(stats.income - stats.expense)}
              </Text>
            </View>
            <Text style={styles.footnote}>
              {stats.month} lançamentos neste mês · {transactions.length} no
              dashboard
            </Text>
          </View>

          <Text style={[typography.label, styles.sectionLabel]}>
            Últimos lançamentos
          </Text>
          {transactions.slice(0, 20).map((t) => (
            <View key={t.id} style={styles.txRow}>
              <View
                style={[
                  styles.txDot,
                  {
                    backgroundColor:
                      t.tipo === "receita"
                        ? "rgba(52, 211, 153, 0.25)"
                        : "rgba(248, 113, 113, 0.2)",
                  },
                ]}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.txDesc} numberOfLines={1}>
                  {t.descricao}
                </Text>
                <Text style={styles.txMeta}>
                  {t.data}{" "}
                  <Text style={styles.txKind}>
                    {t.tipo === "receita" ? "Receita" : "Despesa"}
                  </Text>
                </Text>
              </View>
              <Text
                style={[
                  styles.txAmount,
                  { color: t.tipo === "receita" ? colors.success : colors.danger },
                ]}
              >
                {t.tipo === "receita" ? "+" : "−"}
                {fmt(Math.abs(Number(t.valor)))}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}

      <AddTransactionModal
        visible={activeModal === "income"}
        onClose={() => setActiveModal(null)}
        dashboardId={dashId}
        tipo="receita"
        budgets={budgets}
        onSuccess={refreshAll}
      />
      <AddTransactionModal
        visible={activeModal === "expense"}
        onClose={() => setActiveModal(null)}
        dashboardId={dashId}
        tipo="despesa"
        budgets={budgets}
        cards={cardsList}
        onSuccess={refreshAll}
      />
      <AddCardModal
        visible={activeModal === "card"}
        onClose={() => setActiveModal(null)}
        dashboardId={dashId}
        onSuccess={refreshAll}
      />
      <AddBudgetModal
        visible={activeModal === "budget"}
        onClose={() => setActiveModal(null)}
        dashboardId={dashId}
        onSuccess={refreshAll}
      />
      <AddGoalModal
        visible={activeModal === "goal"}
        onClose={() => setActiveModal(null)}
        dashboardId={dashId}
        onSuccess={refreshAll}
      />
      <AddSubscriptionModal
        visible={activeModal === "sub"}
        onClose={() => setActiveModal(null)}
        dashboardId={dashId}
        onSuccess={refreshAll}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 20 },
  topBar: { marginBottom: 8 },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.35)",
  },
  avatarText: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.primary,
  },
  brandName: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.3,
  },
  greeting: {
    ...typography.hero,
    marginBottom: 12,
  },
  iconBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radii.sm,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconBtnText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { paddingBottom: 100 },
  quickTitle: { marginBottom: 12 },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 22,
    justifyContent: "space-between",
  },
  quickCell: {
    width: "31%",
    minWidth: "30%",
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 4,
  },
  quickIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  quickLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
    textAlign: "center",
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statGrid: {
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
    marginBottom: 16,
  },
  statCell: {
    flex: 1,
    backgroundColor: colors.surface2,
    borderRadius: radii.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statLabel: { ...typography.caption, marginBottom: 6 },
  statValue: { fontSize: 17, fontWeight: "700" },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  balanceLabel: { ...typography.body, color: colors.textSecondary },
  balanceValue: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  footnote: { ...typography.caption, marginTop: 14, textAlign: "center" },
  sectionLabel: { marginBottom: 12 },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: 12,
  },
  txDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  txDesc: { color: colors.text, fontSize: 15, fontWeight: "500" },
  txMeta: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  txKind: { color: colors.textMuted },
  txAmount: { fontSize: 15, fontWeight: "700" },
});
