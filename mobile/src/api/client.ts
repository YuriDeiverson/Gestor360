import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiBaseUrl } from "../config/env";

const TOKEN_KEY = "authToken";

export async function getStoredToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setStoredToken(token: string | null): Promise<void> {
  if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
  else await AsyncStorage.removeItem(TOKEN_KEY);
}

/** Path com prefixo /auth/..., /transacoes — sem /api (adicionado aqui). */
export async function apiRequest<T = unknown>(
  path: string,
  options: RequestInit = {},
  withAuth = true,
): Promise<T> {
  const base = getApiBaseUrl();
  const url = `${base}/api${path.startsWith("/") ? path : `/${path}`}`;
  const token = withAuth ? await getStoredToken() : null;

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers as Record<string, string>),
      },
    });
  } catch (e) {
    const hint =
      "Verifique sua internet e tente de novo. Se o problema continuar, confira as configurações do app com o suporte.";
    throw new Error(
      e instanceof Error && e.message
        ? `${e.message}. ${hint}`
        : `Não foi possível conectar. ${hint}`,
    );
  }

  const data = (await res.json().catch(() => ({}))) as T & {
    error?: string;
    message?: string;
  };

  if (res.status === 401) {
    if (withAuth) {
      await setStoredToken(null);
      throw new Error("Sessão expirada. Faça login novamente.");
    }
    const msg =
      (data as { error?: string }).error ||
      (data as { message?: string }).message ||
      "Não autorizado";
    throw new Error(msg);
  }

  if (!res.ok) {
    const msg =
      (data as { error?: string }).error ||
      (data as { message?: string }).message ||
      `Erro ${res.status}`;
    throw new Error(msg);
  }

  return data as T;
}
