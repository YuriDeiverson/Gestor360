import { Transaction } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3002";

export interface ApiTransaction {
  _id: string;
  id: string;
  descricao: string;
  valor: number;
  tipo: "receita" | "despesa";
  categoria: string;
  data: string;
  created_at: string;
  updated_at: string;
  // Campos de parcelamento (snake_case do banco)
  installments?: number;
  currentinstallment?: number;
  totalamount?: number;
  remainingamount?: number;
  nextpaymentdate?: string;
  method?: string;
  account?: string;
  status?: string;
}

export interface ApiMeta {
  _id: string;
  id: string;
  nome: string;
  valor_alvo: number;
  valor_atual: number;
  data_limite?: string;
  descricao?: string;
  criado_em: string;
  created_at: string;
  updated_at: string;
}

export interface ApiOrcamento {
  _id: string;
  id: string;
  categoria: string;
  valor_limite: number;
  valor_gasto: number;
  mes: number;
  ano: number;
  created_at: string;
  updated_at: string;
}

export interface ApiCategoria {
  _id: string;
  id: string;
  nome: string;
  icone?: string;
  cor?: string;
  tipo?: "income" | "expense" | "both";
  descricao?: string;
  created_at: string;
  updated_at: string;
}

// Função para converter transação da API para o formato do frontend
export function convertApiTransactionToFrontend(
  apiTx: ApiTransaction,
): Transaction {
  // Debug: verificar dados brutos da API
  console.log("🔍 Convertendo transação da API:", {
    id: apiTx.id,
    descricao: apiTx.descricao,
    installments: apiTx.installments,
    currentinstallment: apiTx.currentinstallment,
    totalamount: apiTx.totalamount,
    hasInstallments: "installments" in apiTx,
    allKeys: Object.keys(apiTx),
  });

  return {
    id: apiTx.id || apiTx._id,
    date: apiTx.data,
    description: apiTx.descricao,
    amount: apiTx.valor,
    type: apiTx.tipo === "receita" ? "income" : "expense",
    status: (apiTx.status as "completed" | "pending") || "completed",
    account: apiTx.account || "Conta Principal",
    industry: "Geral",
    method: (apiTx.method as "Cartão de Crédito" | "Débito" | "PIX") || "PIX",
    category: apiTx.categoria,
    // Campos de parcelamento (convertendo de snake_case para camelCase)
    installments: apiTx.installments,
    currentInstallment: apiTx.currentinstallment,
    totalAmount: apiTx.totalamount,
    remainingAmount: apiTx.remainingamount,
    nextPaymentDate: apiTx.nextpaymentdate,
  };
}

// Função para converter meta da API para o formato do frontend
export function convertApiMetaToFrontend(apiMeta: ApiMeta) {
  return {
    id: apiMeta.id || apiMeta._id,
    name: apiMeta.nome,
    targetAmount: apiMeta.valor_alvo,
    currentAmount: apiMeta.valor_atual,
    deadline: apiMeta.data_limite || "",
    category: "Geral",
  };
}

// Função para converter orçamento da API para o formato do frontend
export function convertApiOrcamentoToFrontend(apiOrcamento: ApiOrcamento) {
  return {
    id: apiOrcamento.id || apiOrcamento._id,
    name: apiOrcamento.categoria,
    budgetedAmount: apiOrcamento.valor_limite,
  };
}

// Função para converter categoria da API para o formato do frontend
export function convertApiCategoriaToFrontend(apiCategoria: ApiCategoria) {
  return {
    id: apiCategoria.id || apiCategoria._id,
    name: apiCategoria.nome,
    icon: apiCategoria.icone || "💰",
    color: apiCategoria.cor || "#10b981",
    type: apiCategoria.tipo || ("expense" as "income" | "expense" | "both"),
    description: apiCategoria.descricao || "",
  };
}

// API de Transações
export const transactionsApi = {
  async getAll(dashboardId?: string) {
    console.log(
      "🌐 API: Buscando todas as transações...",
      dashboardId ? `dashboard: ${dashboardId}` : "sem dashboard",
    );

    if (!dashboardId) {
      console.warn("⚠️ Dashboard ID não fornecido, retornando array vazio");
      return [];
    }

    const response = await fetch(
      `${API_BASE_URL}/transacoes?dashboard_id=${dashboardId}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Erro na API de transações:", errorData);
      throw new Error(errorData.error || "Erro ao buscar transações");
    }

    const data = await response.json();

    if (!data.transacoes) {
      console.warn("⚠️ Nenhuma transação retornada");
      return [];
    }

    const transactions = data.transacoes.map(convertApiTransactionToFrontend);
    console.log("✅ API: Recebidas", transactions.length, "transações");
    return transactions;
  },

  async create(transaction: {
    descricao: string;
    valor: number;
    tipo: "receita" | "despesa";
    categoria: string;
    data: string;
    dashboard_id?: string;
  }) {
    console.log("🌐 API: Criando transação...", transaction);
    console.log("🔑 Token:", localStorage.getItem("authToken"));

    const response = await fetch(`${API_BASE_URL}/transacoes`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(transaction),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Erro ao criar transação:", errorData);
      throw new Error(errorData.error || "Erro ao criar transação");
    }

    const data = await response.json();
    const savedTransaction = convertApiTransactionToFrontend(data);
    console.log("🌐 API: Transação criada:", savedTransaction);
    return savedTransaction;
  },

  async update(
    id: string,
    transaction: Partial<{
      descricao: string;
      valor: number;
      tipo: "receita" | "despesa";
      categoria: string;
      data: string;
      dashboard_id?: string;
    }>,
  ) {
    console.log("🌐 API: Atualizando transação", id, transaction);

    const response = await fetch(`${API_BASE_URL}/transacoes/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(transaction),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Erro ao atualizar transação:", errorData);
      throw new Error(errorData.error || "Erro ao atualizar transação");
    }

    const data = await response.json();
    console.log("✅ API: Transação atualizada:", data);
    return convertApiTransactionToFrontend(data);
  },

  async delete(id: string, dashboardId?: string) {
    console.log("🌐 API: Deletando transação", id, "dashboard:", dashboardId);

    const url = dashboardId
      ? `${API_BASE_URL}/transacoes/${id}?dashboard_id=${dashboardId}`
      : `${API_BASE_URL}/transacoes/${id}`;

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Erro ao deletar transação:", errorData);
      throw new Error(errorData.error || "Erro ao deletar transação");
    }

    const result = await response.json();
    console.log("✅ API: Transação deletada");
    return result;
  },

  async payInstallment(transactionId: string, dashboardId: string) {
    console.log("💰 API: Pagando parcela da transação", transactionId);

    const response = await fetch(
      `${API_BASE_URL}/transacoes/${transactionId}/pay-installment`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ dashboard_id: dashboardId }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Erro ao pagar parcela:", errorData);
      throw new Error(errorData.error || "Erro ao pagar parcela");
    }

    const data = await response.json();
    const updatedTransaction = convertApiTransactionToFrontend(data);
    console.log("✅ API: Parcela paga com sucesso:", updatedTransaction);
    return updatedTransaction;
  },
};

// API de Metas
export const metasApi = {
  async getAll(dashboardId?: string) {
    try {
      const url = dashboardId
        ? `${API_BASE_URL}/metas?dashboard_id=${dashboardId}`
        : `${API_BASE_URL}/metas`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Erro na API de metas:", errorData);
        return [];
      }

      const data = await response.json();

      if (!data.metas || !Array.isArray(data.metas)) {
        console.warn(
          "⚠️ Propriedade 'metas' não encontrada ou não é array:",
          data,
        );
        return [];
      }

      return data.metas.map(convertApiMetaToFrontend);
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
    const response = await fetch(`${API_BASE_URL}/metas`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ criado_em: new Date().toISOString(), ...meta }),
    });
    const data = await response.json();
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
    const response = await fetch(`${API_BASE_URL}/metas/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(meta),
    });
    const data = await response.json();
    return convertApiMetaToFrontend(data);
  },

  async delete(id: string) {
    const response = await fetch(`${API_BASE_URL}/metas/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    });
    return response.json();
  },
};

// API de Orçamentos
export const orcamentosApi = {
  async getAll(dashboardId?: string) {
    try {
      const url = dashboardId
        ? `${API_BASE_URL}/orcamentos?dashboard_id=${dashboardId}`
        : `${API_BASE_URL}/orcamentos`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Erro na API de orçamentos:", errorData);
        return [];
      }

      const data = await response.json();

      if (!data.orcamentos || !Array.isArray(data.orcamentos)) {
        console.warn(
          "⚠️ Propriedade 'orcamentos' não encontrada ou não é array:",
          data,
        );
        return [];
      }

      return data.orcamentos.map(convertApiOrcamentoToFrontend);
    } catch (error) {
      console.error("❌ Erro ao buscar orçamentos:", error);
      return [];
    }
  },

  async create(orcamento: {
    categoria: string;
    valor_limite: number;
    valor_gasto?: number;
    mes: number;
    ano: number;
    dashboard_id?: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/orcamentos`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orcamento),
    });
    const data = await response.json();
    return convertApiOrcamentoToFrontend(data);
  },

  async update(
    id: string,
    orcamento: Partial<{
      categoria: string;
      valor_limite: number;
      valor_gasto: number;
      mes: number;
      ano: number;
    }>,
  ) {
    const response = await fetch(`${API_BASE_URL}/orcamentos/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orcamento),
    });
    const data = await response.json();
    return convertApiOrcamentoToFrontend(data);
  },

  async delete(id: string) {
    const response = await fetch(`${API_BASE_URL}/orcamentos/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    });
    return response.json();
  },
};

// API de Categorias
export const categoriasApi = {
  async getAll(dashboardId?: string) {
    try {
      const url = dashboardId
        ? `${API_BASE_URL}/categorias?dashboard_id=${dashboardId}`
        : `${API_BASE_URL}/categorias`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Erro na API de categorias:", errorData);
        return [];
      }

      const data = await response.json();

      if (!data.categorias || !Array.isArray(data.categorias)) {
        console.warn(
          "⚠️ Propriedade 'categorias' não encontrada ou não é array:",
          data,
        );
        return [];
      }

      return data.categorias.map(convertApiCategoriaToFrontend);
    } catch (error) {
      console.error("❌ Erro ao buscar categorias:", error);
      return [];
    }
  },

  async create(categoria: {
    nome: string;
    icone?: string;
    cor?: string;
    dashboard_id?: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/categorias`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(categoria),
    });
    const data = await response.json();
    return convertApiCategoriaToFrontend(data);
  },

  async update(
    id: string,
    categoria: Partial<{
      nome: string;
      icone: string;
      cor: string;
    }>,
  ) {
    const response = await fetch(`${API_BASE_URL}/categorias/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(categoria),
    });
    const data = await response.json();
    return convertApiCategoriaToFrontend(data);
  },

  async delete(id: string) {
    const response = await fetch(`${API_BASE_URL}/categorias/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    });
    return response.json();
  },
};
