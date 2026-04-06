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
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { apiRequest } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { colors, radii, typography } from "../theme/tokens";
import { ScreenChrome } from "../components/ui/ScreenChrome";
import {
  AddSubscriptionModal,
  type EditingSubscription,
} from "../components/modals/AddSubscriptionModal";
import type { MoreStackParamList } from "../navigation/types";

type SubRow = {
  id: string;
  name: string;
  amount: number;
  billing_day?: number;
  card_id?: string;
};

function toEditing(s: SubRow): EditingSubscription {
  return {
    id: s.id,
    name: s.name,
    amount: Number(s.amount),
    billing_day: s.billing_day,
    card_id: s.card_id,
  };
}

export function SubscriptionsScreen() {
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<
      NativeStackNavigationProp<MoreStackParamList, "Subscriptions">
    >();
  const { currentDashboard } = useAuth();
  const [rows, setRows] = useState<SubRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EditingSubscription | null>(null);

  const load = useCallback(async () => {
    if (!currentDashboard?.id) {
      setRows([]);
      return;
    }
    const data = await apiRequest<SubRow[]>(
      `/subscriptions?dashboard_id=${currentDashboard.id}`,
    );
    setRows(Array.isArray(data) ? data : []);
  }, [currentDashboard?.id]);

  useEffect(() => {
    let c = false;
    (async () => {
      try {
        setLoading(true);
        await load();
      } catch {
        if (!c) setRows([]);
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

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (s: SubRow) => {
    setEditing(toEditing(s));
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const confirmDelete = (s: SubRow) => {
    Alert.alert(
      "Excluir assinatura",
      `Remover "${s.name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await apiRequest(`/subscriptions/${s.id}`, {
                method: "DELETE",
              });
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

  const accent = "#38bdf8";

  return (
    <View style={[styles.flex, { paddingBottom: insets.bottom }]}>
      <ScreenChrome
        title="Assinaturas"
        subtitle={`${currentDashboard?.name ?? "Dashboard"} · recorrências no cartão`}
        onBack={() => navigation.goBack()}
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
            data={rows}
            keyExtractor={(r) => r.id}
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
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>Sem assinaturas</Text>
                <Text style={styles.emptySub}>
                  Cadastre serviços recorrentes e o dia de cobrança.
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.rowTop}>
                  <View style={styles.titleBlock}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.amount}>{fmt(Number(item.amount))}</Text>
                    {item.billing_day != null ? (
                      <Text style={styles.day}>
                        Cobrança no dia {item.billing_day}
                      </Text>
                    ) : null}
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
              </View>
            )}
          />
        )}
      </ScreenChrome>

      <AddSubscriptionModal
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
  list: { paddingTop: 8, paddingBottom: 100, paddingHorizontal: 20 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  titleBlock: { flex: 1, minWidth: 0 },
  rowActions: { flexDirection: "row", alignItems: "flex-start", gap: 4 },
  iconBtn: { padding: 6 },
  name: { fontSize: 16, fontWeight: "700", color: colors.text },
  amount: {
    fontSize: 17,
    fontWeight: "800",
    color: "#38bdf8",
    marginTop: 6,
  },
  day: { fontSize: 13, color: colors.textMuted, marginTop: 8 },
  empty: { paddingVertical: 40, alignItems: "center", paddingHorizontal: 16 },
  emptyTitle: { ...typography.title, marginBottom: 8 },
  emptySub: { ...typography.subtitle, textAlign: "center", maxWidth: 300 },
});
