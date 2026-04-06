import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import type { Dashboard } from "../types";
import { colors, radii } from "../theme/tokens";

type Props = {
  dashboards: Dashboard[];
  currentId?: string;
  onSelect: (id: string) => void;
};

export function DashboardSwitcher({
  dashboards,
  currentId,
  onSelect,
}: Props) {
  if (dashboards.length <= 1) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.wrap}
      contentContainerStyle={styles.inner}
    >
      {dashboards.map((d) => {
        const active = d.id === currentId;
        return (
          <TouchableOpacity
            key={d.id}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onSelect(d.id)}
            activeOpacity={0.85}
          >
            <Text
              style={[styles.chipText, active && styles.chipTextActive]}
              numberOfLines={1}
            >
              {d.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { maxHeight: 44, marginBottom: 4 },
  inner: { gap: 8, paddingRight: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radii.full,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "500",
    maxWidth: 140,
  },
  chipTextActive: { color: colors.primary, fontWeight: "700" },
});
