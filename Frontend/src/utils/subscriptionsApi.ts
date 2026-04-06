import { API_BASE_URL } from "./api";

export interface Subscription {
  id: string;
  dashboardId: string;
  cardId: string;
  name: string;
  amount: number;
  billingDay: number;
  /** Preset de logo; URL resolvida em `subscriptionPresets` (logo.dev ou Clearbit). */
  imageUrl?: string | null;
  iconKey?: string;
}

interface ApiSubscription {
  id: string;
  dashboard_id: string;
  card_id: string;
  name: string;
  amount: number;
  billing_day: number;
  image_url?: string | null;
  icon_key?: string | null;
}

function fromApi(row: ApiSubscription): Subscription {
  return {
    id: row.id,
    dashboardId: row.dashboard_id,
    cardId: row.card_id,
    name: row.name,
    amount: Number(row.amount),
    billingDay: row.billing_day,
    imageUrl: row.image_url || undefined,
    iconKey: row.icon_key || undefined,
  };
}

export const subscriptionsApi = {
  async getAll(dashboardId: string): Promise<Subscription[]> {
    const token = localStorage.getItem("authToken");
    const res = await fetch(
      `${API_BASE_URL}/api/subscriptions?dashboard_id=${encodeURIComponent(dashboardId)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );
    if (!res.ok) throw new Error("Erro ao carregar assinaturas");
    const data: ApiSubscription[] = await res.json();
    return data.map(fromApi);
  },

  async create(
    payload: Omit<Subscription, "id"> & { dashboardId: string },
  ): Promise<Subscription> {
    const token = localStorage.getItem("authToken");
    const res = await fetch(`${API_BASE_URL}/api/subscriptions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dashboard_id: payload.dashboardId,
        card_id: payload.cardId,
        name: payload.name,
        amount: payload.amount,
        billing_day: payload.billingDay,
        image_url: payload.imageUrl ?? null,
        icon_key: payload.iconKey || null,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Erro ao criar assinatura");
    }
    const row: ApiSubscription = await res.json();
    return fromApi(row);
  },

  async update(
    id: string,
    partial: Partial<Omit<Subscription, "id" | "dashboardId">>,
  ): Promise<Subscription> {
    const token = localStorage.getItem("authToken");
    const body: Record<string, unknown> = {};
    if (partial.name !== undefined) body.name = partial.name;
    if (partial.amount !== undefined) body.amount = partial.amount;
    if (partial.billingDay !== undefined) body.billing_day = partial.billingDay;
    if (partial.cardId !== undefined) body.card_id = partial.cardId;
    if (partial.imageUrl !== undefined) body.image_url = partial.imageUrl;
    if (partial.iconKey !== undefined) body.icon_key = partial.iconKey || null;

    const res = await fetch(`${API_BASE_URL}/api/subscriptions/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Erro ao atualizar assinatura");
    }
    const row: ApiSubscription = await res.json();
    return fromApi(row);
  },

  async delete(id: string): Promise<void> {
    const token = localStorage.getItem("authToken");
    const res = await fetch(`${API_BASE_URL}/api/subscriptions/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) throw new Error("Erro ao excluir assinatura");
  },
};
