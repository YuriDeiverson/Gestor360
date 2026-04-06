import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MoreMenuScreen } from "../screens/MoreMenuScreen";
import { BudgetsScreen } from "../screens/BudgetsScreen";
import { GoalsScreen } from "../screens/GoalsScreen";
import { SubscriptionsScreen } from "../screens/SubscriptionsScreen";
import type { MoreStackParamList } from "./types";
import { colors } from "../theme/tokens";

const Stack = createNativeStackNavigator<MoreStackParamList>();

const headerOptions = {
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: "700" as const, fontSize: 17 },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.bg },
};

export function MoreNavigator() {
  return (
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen
        name="MoreMenu"
        component={MoreMenuScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Budgets"
        component={BudgetsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Goals"
        component={GoalsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Subscriptions"
        component={SubscriptionsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
