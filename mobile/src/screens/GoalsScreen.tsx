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
  AddGoalModal,
  type EditingGoal,
} from "../components/modals/AddGoalModal";
import type { MoreStackParamList } from "../navigation/types";

type MetaRow = {
  id: string;
  nome: string;
  valor_alvo: number;
  valor_atual?: number;
  data_limite?: string;
  descricao?: string;
};

function toEditingGoal(m: MetaRow): EditingGoal {
  return {
    id: m.id,
    nome: m.nome,
    valor_alvo: Number(m.valor_alvo),
    valor_atual: m.valor_atual != null ? Number(m.valor_atual) : undefined,
    data_limite: m.data_limite,
    descricao: m.descricao,
  };
}

export function GoalsScreen() {
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<MoreStackParamList, "Goals">>();
  const { currentDashboard } = useAuth();
  const [rows, setRows] = useState<MetaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EditingGoal | null>(null);

  const load = useCallback(async () => {
    if (!currentDashboard?.id) {
      setRows([]);
      return;
    }
    const data = await apiRequest<MetaRow[]>(
      `/metas?dashboard_id=${currentDashboard.id}`,
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

  const openEdit = (m: MetaRow) => {
    setEditing(toEditingGoal(m));
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const confirmDelete = (m: MetaRow) => {
    Alert.alert(
      "Excluir meta",
      `Remover "${m.nome}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await apiRequest(`/metas/${m.id}`, { method: "DELETE" });
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

  return (
    <View style={[styles.flex, { paddingBottom: insets.bottom }]}>
      <ScreenChrome
        title="Metas"
        subtitle={`${currentDashboard?.name ?? "Dashboard"} · acompanhe o progresso`}
        onBack={() => navigation.goBack()}
        onAdd={openCreate}
        addLabel="Novo"
        accentColor={colors.warning}
        contentStyle={styles.chromeContent}
      >
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.warning} />
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
                tintColor={colors.warning}
              />
            }
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>Sem metas</Text>
                <Text style={styles.emptySub}>
                  Toque em &quot;Novo&quot; para definir uma meta financeira.
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const target = Number(item.valor_alvo);
              const cur = Number(item.valor_atual ?? 0);
              const pct =
                target > 0 ? Math.min(100, (cur / target) * 100) : 0;
              return (
                <View style={styles.card}>
                  <View style={styles.cardTop}>
                    <View style={styles.titleBlock}>
                      <Text style={styles.name}>{item.nome}</Text>
                      {item.data_limite ? (
                        <Text style={styles.deadline}>
                          Até {item.data_limite}
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
                  <View style={styles.meterBg}>
                    <View
                      style={[
                        styles.meterFill,
                        {
                          width: `${pct}%`,
                          backgroundColor: colors.warning,
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.muted}>Atual</Text>
                    <Text style={styles.val}>{fmt(cur)}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.muted}>Meta</Text>
                    <Text style={styles.val}>{fmt(target)}</Text>
                  </View>
                </View>
              );
            }}
          />
        )}
      </ScreenChrome>

      <AddGoalModal
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
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
    gap: 8,
  },
  titleBlock: { flex: 1, minWidth: 0 },
  rowActions: { flexDirection: "row", alignItems: "center", gap: 4 },
  iconBtn: { padding: 6 },
  name: { fontSize: 17, fontWeight: "700", color: colors.text },
  deadline: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  meterBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surface2,
    overflow: "hidden",
    marginVertical: 14,
  },
  meterFill: { height: 8, borderRadius: 4 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  muted: { color: colors.textMuted, fontSize: 14 },
  val: { color: colors.text, fontSize: 15, fontWeight: "600" },
  empty: { paddingVertical: 40, alignItems: "center", paddingHorizontal: 16 },
  emptyTitle: { ...typography.title, marginBottom: 8 },
  emptySub: { ...typography.subtitle, textAlign: "center", maxWidth: 300 },
});
