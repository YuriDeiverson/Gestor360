export const API_BASE_URL = import.meta.env.DEV
  ? "http://localhost:3002"
  : import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE_LOCAL_URL;

// Verificação da URL base
console.log("🌐 API_BASE_URL configurada:", API_BASE_URL);

// Função para testar conectividade
const testApiConnection = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log("🏥 Teste de conectividade:", response.ok ? "✅ Sucesso" : "❌ Falha");
    return response.ok;
  } catch (error) {
    console.error("❌ Erro ao testar conectividade:", error);
    return false;
  }
};

/* ======================================================
   TIPOS
====================================================== */

export type TransactionType = "income" | "expense";
export type TransactionStatus = "completed" | "pending";
export type PaymentMethod = "Cartão de Crédito" | "Débito" | "PIX" | "Salário";

/* =======================
   BUDGETS
======================= */

export interface ApiBudget {
  id: string;
  nome: string;
  icone?: string;
  cor?: string;
  tipo: "income" | "expense";
  descricao?: string;
  limit_value: number;
  dashboard_id?: string;
  created_at: string;
}

export interface BudgetCategory {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  type: "income" | "expense";
  description?: string;
  budgetedAmount: number;
  spentAmount?: number;
  status?: "within" | "near" | "over";
}

function convertApiBudgetToFrontend(api: ApiBudget): BudgetCategory {
  // Converter tipo do backend ("income"/"expense") para garantir formato correto
  const type = api.tipo === "income" ? "income" : "expense";
  
  return {
    id: api.id,
    name: api.nome,
    icon: api.icone || "💰",
    color: api.cor || "#10b981",
    type, // Usar o tipo convertido
    description: api.descricao || "",
    budgetedAmount: Number(api.limit_value),
    spentAmount: 0,
    status: "within",
  };
}

export const budgetsApi = {
  async getAll(dashboardId?: string) {
    const url = dashboardId
      ? `${API_BASE_URL}/api/budgets?dashboard_id=${dashboardId}`
      : `${API_BASE_URL}/api/budgets`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) throw new Error("Erro ao buscar budgets");

    const data: ApiBudget[] = await res.json();
    return data.map(convertApiBudgetToFrontend);
  },

  async create(budget: {
    nome: string;
    icone?: string;
    cor?: string;
    tipo: "income" | "expense";
    descricao?: string;
    limit_value: number;
    dashboard_id?: string;
  }) {
    const res = await fetch(`${API_BASE_URL}/api/budgets`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(budget),
    });

    if (!res.ok) throw new Error("Erro ao criar budget");

    const data: ApiBudget = await res.json();
    return convertApiBudgetToFrontend(data);
  },

  async update(
    id: string,
    budget: {
      nome?: string;
      icone?: string;
      cor?: string;
      tipo?: "income" | "expense";
      descricao?: string;
      limit_value?: number;
    },
  ) {
    const res = await fetch(`${API_BASE_URL}/api/budgets/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(budget),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || "Erro ao atualizar budget");
    }

    const data: ApiBudget = await res.json();
    return convertApiBudgetToFrontend(data);
  },

  async delete(id: string) {
    const res = await fetch(`${API_BASE_URL}/api/budgets/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || "Erro ao deletar budget");
    }

    return res.json();
  },
};

/* =======================
   TRANSAÇÕES
======================= */

export interface ApiTransaction {
  id: string;
  descricao: string;
  valor: number;
  tipo: "receita" | "despesa" | "income" | "expense"; // Backend retorna "receita"/"despesa"
  status: TransactionStatus;
  data: string;
  account: string;
  method: PaymentMethod;
  budget_id: string | null;
  /** Nome da categoria persistido (ex.: receitas sem orçamento) */
  categoria?: string;
  dashboard_id?: string;
  created_at: string;
  installments?: number;
  currentinstallment?: number;
  currentInstallment?: number;
  totalamount?: number;
  totalAmount?: number;
  remainingamount?: number;
  remainingAmount?: number;
  nextpaymentdate?: string;
  nextPaymentDate?: string;
  budget?: {
    id: string;
    nome: string;
    cor: string;
    tipo: string;
    limit_value: number;
  };
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  date: string;
  account: string;
  method: PaymentMethod;
  budgetId?: string;
  category: string;
  installments?: number;
  currentInstallment?: number;
  totalAmount?: number;
  nextPaymentDate?: string;
  remainingAmount?: number;
}

function convertApiTransactionToFrontend(api: ApiTransaction): Transaction {
  // Converter tipo do backend ("receita"/"despesa") para frontend ("income"/"expense")
  console.log("🔄 Debug - Convertendo transação:", {
    id: api.id,
    tipo: api.tipo,
    descricao: api.descricao
  });
  
  let type: TransactionType = "expense";
  if (api.tipo === "receita" || api.tipo === "income") {
    type = "income";
  } else if (api.tipo === "despesa" || api.tipo === "expense") {
    type = "expense";
  }

  const rawCat = typeof api.categoria === "string" ? api.categoria.trim() : "";
  const category = rawCat
    ? rawCat
    : api.budget?.nome || "Sem categoria";

  const amountNum = Number(api.valor);
  const inst = api.installments;
  const cur =
    api.currentinstallment != null ? api.currentinstallment : api.currentInstallment;
  const totalAmt = api.totalamount ?? api.totalAmount;
  const rem = api.remainingamount ?? api.remainingAmount;
  const nextPay = api.nextpaymentdate ?? api.nextPaymentDate;

  return {
    id: api.id,
    description: api.descricao,
    amount: Number.isFinite(amountNum) ? amountNum : 0,
    type,
    status: api.status,
    date: api.data,
    account: api.account,
    method: api.method,
    /** null no Supabase = sem orçamento (ex.: salário só com categoria) */
    budgetId: api.budget_id ?? undefined,
    category,
    ...(inst != null && inst > 0 ? { installments: inst } : {}),
    ...(cur != null && cur > 0 ? { currentInstallment: cur } : {}),
    ...(totalAmt != null && Number.isFinite(Number(totalAmt))
      ? { totalAmount: Number(totalAmt) }
      : {}),
    ...(rem != null && Number.isFinite(Number(rem))
      ? { remainingAmount: Number(rem) }
      : {}),
    ...(typeof nextPay === "string" && nextPay.trim()
      ? { nextPaymentDate: nextPay.trim() }
      : {}),
  };
}

export const transactionsApi = {
  async getAll(dashboardId?: string): Promise<Transaction[]> {
    const url = dashboardId
      ? `${API_BASE_URL}/api/transacoes?dashboard_id=${dashboardId}`
      : `${API_BASE_URL}/api/transacoes`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) throw new Error("Erro ao buscar transações");

    const data: ApiTransaction[] = await res.json();
    return data.map(convertApiTransactionToFrontend);
  },

  async create(transaction: {
    descricao: string;
    valor: number;
    tipo: string; // Aceita "receita" ou "despesa"
    data: string;
    status?: TransactionStatus;
    account?: string;
    method?: PaymentMethod;
    budget_id?: string | null;
    categoria?: string;
    dashboard_id?: string;
  }): Promise<Transaction> {
    const res = await fetch(`${API_BASE_URL}/api/transacoes`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...transaction,
        categoria:
          (transaction as { categoria?: string }).categoria ??
          (transaction as { category?: string }).category,
        status: transaction.status || "completed",
        account: transaction.account || "Conta Principal",
        method: transaction.method ?? "PIX",
      }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(
        (errBody as { error?: string }).error ||
          `Erro ao criar transação (${res.status})`,
      );
    }

    const data: ApiTransaction = await res.json();
    return convertApiTransactionToFrontend(data);
  },

  async update(
    id: string,
    transaction: {
      descricao?: string;
      valor?: number;
      tipo?: TransactionType;
      data?: string;
      status?: TransactionStatus;
      account?: string;
      method?: PaymentMethod;
      budget_id?: string | null;
      categoria?: string;
      dashboard_id?: string;
      installments?: number;
      currentinstallment?: number;
      currentInstallment?: number;
      totalamount?: number;
      totalAmount?: number;
      remainingamount?: number;
      remainingAmount?: number;
      nextpaymentdate?: string;
      nextPaymentDate?: string;
    },
  ): Promise<Transaction> {
    // Converter tipo do frontend para backend
    const tipo =
      transaction.tipo === "income"
        ? "receita"
        : transaction.tipo === "expense"
        ? "despesa"
        : undefined;

    const res = await fetch(`${API_BASE_URL}/api/transacoes/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...transaction,
        tipo,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || "Erro ao atualizar transação");
    }

    const data: ApiTransaction = await res.json();
    return convertApiTransactionToFrontend(data);
  },

  async delete(id: string, dashboardId?: string): Promise<void> {
    const url = dashboardId
      ? `${API_BASE_URL}/api/transacoes/${id}?dashboard_id=${dashboardId}`
      : `${API_BASE_URL}/api/transacoes/${id}`;

    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || "Erro ao deletar transação");
    }

    return res.json();
  },

  async payInstallment(id: string): Promise<Transaction> {
    const res = await fetch(`${API_BASE_URL}/api/transacoes/${id}/pay-installment`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || "Erro ao pagar parcela");
    }

    const data: ApiTransaction = await res.json();
    return convertApiTransactionToFrontend(data);
  },
};

/* =======================
   METAS
======================= */

export interface ApiMeta {
  id: string;
  nome: string;
  valor_alvo: number;
  valor_atual: number;
  data_limite?: string;
  descricao?: string;
  dashboard_id?: string;
}

export interface Meta {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: string;
  budgetId: string; // Adicionando budgetId para compatibilidade com Goal
}

export function convertApiMetaToFrontend(apiMeta: ApiMeta): Meta {
  return {
    id: apiMeta.id,
    name: apiMeta.nome,
    targetAmount: apiMeta.valor_alvo,
    currentAmount: apiMeta.valor_atual || 0,
    deadline: apiMeta.data_limite || "",
    category: "Geral",
    budgetId: apiMeta.dashboard_id || "default", // Adicionando budgetId obrigatório
  };
}

export const metasApi = {
  async getAll(dashboardId?: string): Promise<Meta[]> {
    try {
      const url = dashboardId
        ? `${API_BASE_URL}/api/metas?dashboard_id=${dashboardId}`
        : `${API_BASE_URL}/api/metas`;
      
      console.log("🔍 Buscando metas na URL:", url);
      console.log("🔑 Token disponível:", localStorage.getItem("authToken") ? "Sim" : "Não");

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          "Content-Type": "application/json",
        },
      });

      console.log("📊 Status da resposta (getAll):", response.status);
      console.log("📊 Status Text (getAll):", response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ Erro na API de metas:", errorData);
        console.error("❌ Status (getAll):", response.status);
        return [];
      }

      const data: ApiMeta[] = await response.json();
      console.log("✅ Metas encontradas:", data.length);
      return data.map(convertApiMetaToFrontend);
    } catch (error) {
      console.error("❌ Erro ao buscar metas:", error);
      return [];
    }
  },

  async create(meta: {
    nome: string;
    valor_alvo: number;
    valor_atual?: number;
    data_limite?: string;
    descricao?: string;
    dashboard_id?: string;
  }) {
    const url = `${API_BASE_URL}/api/metas`;
    console.log("🔍 Criando meta na URL:", url);
    console.log("📤 Dados enviados:", {
      ...meta,
      criado_em: new Date().toISOString(),
    });
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        criado_em: new Date().toISOString(),
        ...meta,
      }),
    });

    console.log("📊 Status da resposta:", response.status);
    console.log("📊 Headers da resposta:", response.headers);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("❌ Erro ao criar meta:", errorData);
      console.error("❌ Status:", response.status);
      console.error("❌ Status Text:", response.statusText);
      throw new Error(errorData.error || "Erro ao criar meta");
    }

    const data: ApiMeta = await response.json();
    console.log("✅ Meta criada com sucesso:", data);
    return convertApiMetaToFrontend(data);
  },

  async update(
    id: string,
    meta: Partial<{
      nome: string;
      valor_alvo: number;
      valor_atual: number;
      data_limite: string;
      descricao: string;
    }>,
  ) {
    const response = await fetch(`${API_BASE_URL}/api/metas/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(meta),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("❌ Erro ao atualizar meta:", errorData);
      throw new Error(errorData.error || "Erro ao atualizar meta");
    }

    const data: ApiMeta = await response.json();
    return convertApiMetaToFrontend(data);
  },

  async delete(id: string) {
    const response = await fetch(`${API_BASE_URL}/api/metas/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("❌ Erro ao deletar meta:", errorData);
      throw new Error(errorData.error || "Erro ao deletar meta");
    }

    return response.json();
  },
};
