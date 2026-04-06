import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiRequest, getStoredToken, setStoredToken } from "../api/client";
import type { Dashboard, User } from "../types";

const DASHBOARD_ID_KEY = "currentDashboardId";

type AuthContextValue = {
  user: User | null;
  currentDashboard: Dashboard | null;
  dashboards: Dashboard[];
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  switchDashboard: (dashboardId: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [currentDashboard, setCurrentDashboard] = useState<Dashboard | null>(
    null,
  );
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboards = useCallback(async () => {
    const res = await apiRequest<{ data: Dashboard[] }>("/auth/dashboards");
    const list = res.data ?? [];
    setDashboards(list);

    const savedId = await AsyncStorage.getItem(DASHBOARD_ID_KEY);
    let selected =
      (savedId && list.find((d) => d.id === savedId)) || list[0] || null;

    if (selected) {
      setCurrentDashboard(selected);
      await AsyncStorage.setItem(DASHBOARD_ID_KEY, selected.id);
    } else {
      setCurrentDashboard(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getStoredToken();
        if (!token) return;

        const me = await apiRequest<{ data: { user: User } }>("/auth/me");
        if (cancelled) return;
        setUser(me.data.user);
        await loadDashboards();
      } catch {
        await setStoredToken(null);
        if (!cancelled) {
          setUser(null);
          setDashboards([]);
          setCurrentDashboard(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadDashboards]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiRequest<{
      data: { accessToken: string; user: User };
    }>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      },
      false,
    );
    await setStoredToken(res.data.accessToken);
    setUser(res.data.user);
    await loadDashboards();
  }, [loadDashboards]);

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      const res = await apiRequest<{
        data: { accessToken: string; user: User };
      }>(
        "/auth/register",
        {
          method: "POST",
          body: JSON.stringify({ email, password, name }),
        },
        false,
      );
      await setStoredToken(res.data.accessToken);
      setUser(res.data.user);
      await loadDashboards();
    },
    [loadDashboards],
  );

  const logout = useCallback(async () => {
    await setStoredToken(null);
    await AsyncStorage.removeItem(DASHBOARD_ID_KEY);
    setUser(null);
    setCurrentDashboard(null);
    setDashboards([]);
  }, []);

  const switchDashboard = useCallback(async (dashboardId: string) => {
    const d = dashboards.find((x) => x.id === dashboardId);
    if (d) {
      setCurrentDashboard(d);
      await AsyncStorage.setItem(DASHBOARD_ID_KEY, dashboardId);
    }
  }, [dashboards]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      currentDashboard,
      dashboards,
      loading,
      login,
      register,
      logout,
      switchDashboard,
    }),
    [
      user,
      currentDashboard,
      dashboards,
      loading,
      login,
      register,
      logout,
      switchDashboard,
    ],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve estar dentro de AuthProvider");
  return ctx;
}
