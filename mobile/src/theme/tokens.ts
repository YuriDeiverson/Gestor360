import { Platform, StyleSheet } from "react-native";

/** Paleta escura alinhada a apps financeiros profissionais */
export const colors = {
  bg: "#070a10",
  bgElevated: "#0c1018",
  surface: "#121826",
  surface2: "#1a2234",
  border: "rgba(148, 163, 184, 0.14)",
  borderStrong: "rgba(148, 163, 184, 0.22)",
  primary: "#3b82f6",
  primaryMuted: "rgba(59, 130, 246, 0.16)",
  text: "#f1f5f9",
  textSecondary: "#94a3b8",
  textMuted: "#64748b",
  success: "#34d399",
  danger: "#f87171",
  warning: "#fbbf24",
  tabBar: "#0a0e15",
  overlay: "rgba(0,0,0,0.45)",
};

export const radii = { sm: 10, md: 14, lg: 18, xl: 22, full: 9999 };

export const shadows =
  Platform.OS === "ios"
    ? {
        card: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.35,
          shadowRadius: 16,
        },
      }
    : { card: { elevation: 6 } };

export const typography = StyleSheet.create({
  hero: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.3,
  },
  subtitle: { fontSize: 15, color: colors.textSecondary, lineHeight: 22 },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
    letterSpacing: 0.6,
    textTransform: "uppercase" as const,
  },
  body: { fontSize: 15, color: colors.text, lineHeight: 22 },
  caption: { fontSize: 12, color: colors.textMuted },
  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
});
