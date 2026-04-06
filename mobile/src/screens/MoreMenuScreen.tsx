import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import type { MoreStackParamList } from "../navigation/types";
import { DashboardSwitcher } from "../components/DashboardSwitcher";
import { colors, radii, typography } from "../theme/tokens";

type Nav = NativeStackNavigationProp<MoreStackParamList, "MoreMenu">;

const rows: {
  key: keyof Omit<MoreStackParamList, "MoreMenu">;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    key: "Budgets",
    title: "Orçamento",
    subtitle: "Categorias e limites",
    icon: "pie-chart-outline",
  },
  {
    key: "Goals",
    title: "Metas",
    subtitle: "Objetivos financeiros",
    icon: "flag-outline",
  },
  {
    key: "Subscriptions",
    title: "Assinaturas",
    subtitle: "Recorrências e vencimentos",
    icon: "repeat-outline",
  },
];

export function MoreMenuScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const {
    user,
    logout,
    currentDashboard,
    dashboards,
    switchDashboard,
  } = useAuth();

  return (
    <View style={[styles.root, { paddingTop: insets.top + 16 }]}>
      <Text style={typography.hero}>Mais</Text>
      <Text style={[typography.subtitle, { marginBottom: 20 }]}>
        Planejamento e conta
      </Text>

      <View style={styles.profile}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user?.name ?? "?").slice(0, 1).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.profileName} numberOfLines={1}>
            {user?.name}
          </Text>
          <Text style={styles.profileEmail} numberOfLines={1}>
            {user?.email}
          </Text>
        </View>
      </View>

      <DashboardSwitcher
        dashboards={dashboards}
        currentId={currentDashboard?.id}
        onSelect={switchDashboard}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollInner}
        showsVerticalScrollIndicator={false}
      >
        {rows.map((row) => (
          <TouchableOpacity
            key={row.key}
            style={styles.row}
            onPress={() => navigation.navigate(row.key)}
            activeOpacity={0.88}
          >
            <View style={styles.rowIcon}>
              <Ionicons name={row.icon} size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{row.title}</Text>
              <Text style={styles.rowSub}>{row.subtitle}</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.logout} onPress={() => logout()}>
          <Ionicons name="log-out-outline" size={22} color={colors.danger} />
          <Text style={styles.logoutText}>Sair da conta</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 20 },
  profile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.35)",
  },
  avatarText: { fontSize: 22, fontWeight: "800", color: colors.primary },
  profileName: { fontSize: 17, fontWeight: "700", color: colors.text },
  profileEmail: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  scroll: { flex: 1 },
  scrollInner: { paddingBottom: 100 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 14,
  },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  rowSub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  logout: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.35)",
    backgroundColor: "rgba(248,113,113,0.08)",
  },
  logoutText: { fontSize: 16, fontWeight: "700", color: colors.danger },
});
