import { supabase } from "../supabase.js";

export interface DashboardAccess {
  role: "owner" | "admin" | "member";
  dashboard_id: string;
}

export const checkDashboardAccess = async (
  userId: string,
  dashboardId: string,
): Promise<DashboardAccess | null> => {
  try {
    const { data, error } = await supabase
      .from("user_dashboards")
      .select("role, dashboard_id")
      .eq("user_id", userId)
      .eq("dashboard_id", dashboardId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      role: data.role,
      dashboard_id: data.dashboard_id,
    };
  } catch (error) {
    console.error("Erro ao verificar acesso ao dashboard:", error);
    return null;
  }
};

export const validateDashboardAccess = (
  access: DashboardAccess | null,
  requiredRoles: Array<"owner" | "admin" | "member"> = [
    "owner",
    "admin",
    "member",
  ],
): boolean => {
  if (!access) return false;
  return requiredRoles.includes(access.role);
};
