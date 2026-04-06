import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii, typography } from "../../theme/tokens";

type Props = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onAdd?: () => void;
  addLabel?: string;
  children: React.ReactNode;
  /** Cor do acento (pill / botão +) */
  accentColor?: string;
  contentStyle?: ViewStyle;
};

export function ScreenChrome({
  title,
  subtitle,
  onBack,
  onAdd,
  addLabel = "Novo",
  children,
  accentColor = colors.primary,
  contentStyle,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          {onBack ? (
            <TouchableOpacity
              onPress={onBack}
              style={styles.backBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </TouchableOpacity>
          ) : (
            <View style={styles.backPlaceholder} />
          )}
          {onAdd ? (
            <TouchableOpacity
              style={[styles.addBtn, { borderColor: `${accentColor}55` }]}
              onPress={onAdd}
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={22} color={accentColor} />
              <Text style={[styles.addBtnText, { color: accentColor }]}>
                {addLabel}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <View
          style={[
            styles.pill,
            {
              backgroundColor: `${accentColor}18`,
              borderColor: `${accentColor}40`,
            },
          ]}
        >
          <Text style={[styles.pillText, { color: accentColor }]}>{title}</Text>
        </View>
        <Text style={styles.hero}>{title}</Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={3}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 20, marginBottom: 12 },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    minHeight: 44,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  backPlaceholder: { width: 44 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
  },
  addBtnText: { fontSize: 14, fontWeight: "700" },
  pill: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radii.full,
    borderWidth: 1,
    marginBottom: 8,
  },
  pillText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.6 },
  hero: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    ...typography.subtitle,
    marginTop: 6,
  },
  content: { flex: 1, paddingHorizontal: 20 },
});
