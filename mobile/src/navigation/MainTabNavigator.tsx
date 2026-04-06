import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { DashboardScreen } from "../screens/DashboardScreen";
import { TransactionsScreen } from "../screens/TransactionsScreen";
import { CardsScreen } from "../screens/CardsScreen";
import { MoreNavigator } from "./MoreNavigator";
import type { MainTabParamList } from "./types";
import { colors, typography } from "../theme/tokens";

const Tab = createBottomTabNavigator<MainTabParamList>();

type IconName = keyof typeof Ionicons.glyphMap;

function tabIcon(name: IconName, focused: boolean, color: string, size: number) {
  return <Ionicons name={name} size={focused ? size + 1 : size} color={color} />;
}

export function MainTabNavigator() {
  const insets = useSafeAreaInsets();
  const padBottom = Math.max(insets.bottom, 10);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 58 + padBottom,
          paddingBottom: padBottom,
          paddingTop: 6,
          paddingHorizontal: 4,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: typography.tabLabel,
        tabBarItemStyle: { paddingTop: 4 },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: "Início",
          tabBarIcon: ({ color, focused, size }) =>
            tabIcon(focused ? "home" : "home-outline", focused, color, size),
        }}
      />
      <Tab.Screen
        name="Income"
        component={TransactionsScreen}
        options={{
          title: "Receitas",
          tabBarIcon: ({ color, focused, size }) =>
            tabIcon(
              focused ? "trending-up" : "trending-up-outline",
              focused,
              color,
              size,
            ),
        }}
      />
      <Tab.Screen
        name="Expenses"
        component={TransactionsScreen}
        options={{
          title: "Despesas",
          tabBarIcon: ({ color, focused, size }) =>
            tabIcon(
              focused ? "trending-down" : "trending-down-outline",
              focused,
              color,
              size,
            ),
        }}
      />
      <Tab.Screen
        name="Cards"
        component={CardsScreen}
        options={{
          title: "Cartões",
          tabBarIcon: ({ color, focused, size }) =>
            tabIcon(
              focused ? "card" : "card-outline",
              focused,
              color,
              size,
            ),
        }}
      />
      <Tab.Screen
        name="More"
        component={MoreNavigator}
        options={{
          title: "Mais",
          tabBarIcon: ({ color, focused, size }) =>
            tabIcon(
              focused ? "apps" : "apps-outline",
              focused,
              color,
              size,
            ),
        }}
      />
    </Tab.Navigator>
  );
}
