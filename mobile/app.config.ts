import type { ConfigContext, ExpoConfig } from "expo/config";
import { loadProjectEnv } from "@expo/env";

/**
 * Mesmo backend do projeto (Express em backend/).
 * loadProjectEnv(projectRoot) garante leitura de mobile/.env mesmo se o shell
 * não estiver com cwd em mobile/ (caso comum em monorepos).
 */
export default ({ projectRoot }: ConfigContext): ExpoConfig => {
  loadProjectEnv(projectRoot, { silent: true });

  return {
    name: "Dashboard Financeiro",
    slug: "dashboard-financeiro",
    owner: "yuriid",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#0f172a",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.dashboardfinanceiro.app",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#0f172a",
      },
      package: "com.dashboardfinanceiro.app",
      edgeToEdgeEnabled: true,
      /** HTTP local (LAN) — tipos do Expo podem não listar ainda */
      ...({ usesCleartextTraffic: true } as Record<string, unknown>),
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL,
      eas: {
        projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? "59399a46-e19a-43fc-afe7-782077529c15",
      },
    },
  };
};
