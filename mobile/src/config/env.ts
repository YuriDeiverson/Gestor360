import Constants from "expo-constants";
import { Platform } from "react-native";

type Extra = { apiUrl?: string; eas?: { projectId?: string } };

/** Mesmo host que o Frontend em produção (VITE_API_BASE_URL) — fallback se o bundle não tiver env. */
export const DEFAULT_PRODUCTION_API_BASE =
  "https://backend360.vercel.app";

function normalizeBase(raw: string | undefined): string | null {
  const t = raw?.trim();
  if (!t) return null;
  return t.replace(/\/$/, "");
}

/**
 * URL base do backend (sem /api no final).
 * 1) app.config extra.apiUrl — manifest (vem de EXPO_PUBLIC_API_URL no app.config).
 * 2) process.env.EXPO_PUBLIC_* — Metro pode embutir no bundle.
 * 3) __DEV__: emulador/simulador → localhost / 10.0.2.2.
 * 4) Release sem env embutido → DEFAULT_PRODUCTION_API_BASE (alinha com o web).
 */
export function getApiBaseUrl(): string {
  const extra = Constants.expoConfig?.extra as Extra | undefined;
  const fromExtra = normalizeBase(extra?.apiUrl);
  if (fromExtra) return fromExtra;

  const fromMetro = normalizeBase(process.env.EXPO_PUBLIC_API_URL);
  if (fromMetro) return fromMetro;

  if (__DEV__) {
    if (Platform.OS === "android") {
      return "http://10.0.2.2:3002";
    }
    return "http://localhost:3002";
  }

  return DEFAULT_PRODUCTION_API_BASE;
}
