import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useFilters } from "../hooks/useFilters";
import { useToast } from "../hooks/useToast";
import { useConfirmation } from "../hooks/useConfirmation";
import { useInstallmentChecker } from "../hooks/useInstallmentChecker";
import Sidebar from "./Sidebar";
import Header from "./Header";
import Navbar from "./Navbar";
import ConfirmModal from "./ConfirmModal";
import InstallmentNotification from "./InstallmentNotification";
import {
  transactionsApi, budgetsApi, metasApi, API_BASE_URL
} from "../utils/api";
import { cardsApi } from "../utils/cardsApi";
import { Budget, Transaction, Goal } from "../utils/types";
import { Meta, BudgetCategory } from "../utils/api";
import DashboardContent from "./DashboardContent";
import TransactionsPage from "./TransactionsPage";
import GoalsPage from "./GoalsPage";
import BudgetsPage from "./BudgetsPage";
import CardsPage from "./CardsPage";
import BillImportModal from "./BillImportModal";

// Tipo simples para Category
interface Category {
  id: string;
  name: string;
}

const DashboardPage: React.FC = () => {
  console.log("🚀 DashboardPage: Componente carregado");

  const { user, logout, currentDashboard, switchDashboard } = useAuth();
  const { filters, setFilters } = useFilters();
  const { showSuccess, showError } = useToast();
  const { confirmation, showConfirmation, hideConfirmation } =
    useConfirmation();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activePage, setActivePage] = useState<
    "dashboard" | "transactions" | "goals" | "budgets" | "cards"
  >("dashboard");

  // Data state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([]);
  const [cards, setCards] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Hook para verificação automática de parcelas
  const { updates, removeUpdate } = useInstallmentChecker({
    transactions,
    onUpdateTransaction: async (transaction: Transaction) => {
      await editTransaction(transaction);
    },
  });

  // Funções auxiliares para localStorage
  const loadLocalData = <T,>(key: string, defaultValue: T): T => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch (error) {
      console.error(`Erro ao carregar ${key} do localStorage:`, error);
      return defaultValue;
    }
  };

  const saveLocalData = <T,>(key: string, data: T) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Erro ao salvar ${key} no localStorage:`, error);
    }
  };

  // Carregar dados locais na inicialização
  useEffect(() => {
    // Limpar filtros antigos que possam ter categorias predefinidas
    const existingFilters = localStorage.getItem("filters");
    if (existingFilters) {
      try {
        const parsed = JSON.parse(existingFilters);
        // Se contém categorias predefinidas, limpar
        if (parsed.industries && parsed.industries.length > 0) {
          console.log(
            "🧹 Limpando filtros antigos com categorias predefinidas",
          );
          localStorage.removeItem("filters");
        }
      } catch (error) {
        console.error("Erro ao verificar filtros:", error);
        localStorage.removeItem("filters");
      }
    }

    const localCategories = loadLocalData<Category[]>(
      "dashboard-categories",
      [],
    );
    const localBudgets = loadLocalData<BudgetCategory[]>(
      "dashboard-budgets",
      [],
    );

    setCategories(localCategories);
    setBudgetCategories(localBudgets);
  }, []);

  // Salvar categorias no localStorage sempre que mudarem
  useEffect(() => {
    saveLocalData("dashboard-categories", categories);
  }, [categories]);

  // Salvar orçamentos no localStorage sempre que mudarem
  useEffect(() => {
    saveLocalData("dashboard-budgets", budgetCategories);
  }, [budgetCategories]);

  // Função para carregar dados (será usada no useEffect e após criar/editar)
  const loadData = useCallback(async () => {
    try {
      console.log("📊 Carregando dados da API...");
      setLoading(true);

      if (!currentDashboard?.id) {
        console.log("⚠️ Nenhum dashboard selecionado, usando dados locais");
        setLoading(false);
        return;
      }

      console.log("🎯 Dashboard ID:", currentDashboard.id);

   // Carregar cartões
      let cardsData = [];
      try {
        const backendCards = await authenticatedFetch(`/api/cards?dashboard_id=${currentDashboard.id}`);
        // Mapear dados do backend para o formato do frontend
        cardsData = backendCards.map((card: any) => ({
          id: card.id,
          name: card.name,
          bank: card.bank,
          limit: card.card_limit,
          closingDay: card.closing_day,
          dueDay: card.due_day,
          currentBalance: card.current_balance,
          nextDueDate: card.next_due_date,
          status: card.status
        }));
      } catch (error) {
        console.error("Erro ao carregar cartões:", error);
      }

   const [transactionsData, goalsData, budgetsData] =
  await Promise.all([
    transactionsApi.getAll(currentDashboard.id),
    metasApi.getAll(currentDashboard.id),
    budgetsApi.getAll(currentDashboard.id),
  ]);

      console.log("✅ Dados carregados:");
      console.log("  📈 Transações:", transactionsData.length);
      console.log("  🎯 Metas:", goalsData.length);
      console.log("  💰 Orçamentos:", budgetsData.length);
      console.log("  💳 Cartões:", cardsData.length);
      
      // Debug: verificar primeiras transações
      console.log("🔍 Debug - Primeiras 3 transações recebidas:", transactionsData.slice(0, 3));

      console.log("🔄 Debug - Atualizando estados:");
      console.log("  - Transactions:", transactionsData.length, "anterior:", transactions.length);
      console.log("  - Goals:", goalsData.length);
      console.log("  - Budgets:", budgetsData.length);
      console.log("  - Cards:", cardsData.length);
      
      setTransactions(transactionsData);
      setGoals(goalsData);
      setBudgetCategories(budgetsData);
      setCards(cardsData);
      
      // Verificar se atualizou após um pequeno delay
      setTimeout(() => {
        console.log("🔍 Debug - Estado após 500ms:");
        console.log("  - Transactions length:", transactions.length);
      }, 500);
    } catch (error) {
      console.error("❌ Erro ao carregar dados:", error);
      // Em caso de erro, manter arrays vazios
    } finally {
      setLoading(false);
    }
  }, [currentDashboard?.id]);

  // Carregar dados da API
  useEffect(() => {
    loadData();

    // Auto-refresh a cada 30 segundos para ver alterações de outros usuários
    const refreshInterval = setInterval(() => {
      console.log("🔄 Auto-refresh: Recarregando dados...");
      loadData();
    }, 30000); // 30 segundos (aumentado de 10 para reduzir conflitos)

    return () => clearInterval(refreshInterval);
  }, [loadData]);

  // Sincronizar filtros com categorias disponíveis
  useEffect(() => {
    const categoryNames = categories.map((cat) => cat.name);

    // Atualizar filtros para incluir apenas categorias que existem
    setFilters((prev) => ({
      ...prev,
      industries: prev.industries.filter((industry) =>
        categoryNames.includes(industry),
      ),
    }));
  }, [categories, setFilters]);

  // Filter transactions based on current filters
  const filteredTransactions = useMemo(() => {
    console.log("🔍 Filtrando transações...");
    console.log("📊 Total de transações:", transactions.length);
    console.log("📊 Filtros ativos:", {
      startDate: filters.startDate,
      endDate: filters.endDate,
      accounts: filters.accounts,
      industries: filters.industries,
      status: filters.status,
    });

    if (transactions.length === 0) {
      console.log("⚠️ Nenhuma transação disponível");
      return [];
    }

    const filtered = transactions.filter((t) => {
      const transactionDate = new Date(t.date);
      const startDate = new Date(filters.startDate);
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);

      const dateMatch =
        transactionDate >= startDate && transactionDate <= endDate;
      const accountMatch =
        filters.accounts.length === 0 || filters.accounts.includes(t.account);
      const categoryMatch =
        filters.industries.length === 0 ||
        filters.industries.includes(t.category);
      const statusMatch =
        filters.status === "all" || filters.status === t.status;

      // Log detalhado quando transação é filtrada
      if (!dateMatch || !accountMatch || !categoryMatch || !statusMatch) {
        console.log(`❌ Transação "${t.description}" filtrada:`, {
          date: t.date,
          dateMatch,
          accountMatch,
          categoryMatch,
          statusMatch,
        });
      }

      return dateMatch && accountMatch && categoryMatch && statusMatch;
    });

    console.log("✅ Transações após filtro:", filtered.length);
    if (filtered.length !== transactions.length) {
      console.warn(
        `⚠️ ${
          transactions.length - filtered.length
        } transações foram FILTRADAS!`,
      );
    }
    return filtered;
  }, [transactions, filters]);

  // Handlers to modify data
  const addTransaction = async (
    newTransaction: Omit<Transaction, "id" | "industry">,
    
  ) => {
    console.log("🔄 Tentando adicionar transação:", newTransaction);
    console.log("📌 Dashboard atual:", currentDashboard?.id);
    console.log("💳 Método da transação:", newTransaction.method);
    console.log("🆔 Budget ID:", (newTransaction as any).budget_id);

      
    try {
      // O modal envia budget_id diretamente, não budgetId
      const budgetId = (newTransaction as any).budget_id || (newTransaction as any).budgetId;
          // Para salário e transações com account (cartão), budgetId é opcional
      if (!budgetId && !newTransaction.account && newTransaction.method !== "Salário") {
        throw new Error("budget_id é obrigatório");
      }

      if (!currentDashboard?.id) {
        throw new Error("Nenhum dashboard selecionado");
      }

      const apiTransaction = {
        descricao: newTransaction.description,
        valor: newTransaction.amount,
        tipo: newTransaction.type === "income" ? "receita" : "despesa",
        budget_id: budgetId ?? null,
        data: newTransaction.date,
        dashboard_id: currentDashboard.id,
        // Campos de parcelamento (snake_case para o banco)
        installments: newTransaction.installments,
        currentinstallment: newTransaction.currentInstallment,
        totalamount: newTransaction.totalAmount,
        remainingamount: newTransaction.remainingAmount,
        nextpaymentdate: newTransaction.nextPaymentDate,
        // Outros campos
        method: newTransaction.method,
        account: newTransaction.account,
        status: newTransaction.status ?? "completed",
      };

      console.log("📤 Enviando para API:", apiTransaction);
      await transactionsApi.create(apiTransaction);
      console.log("✅ Transação salva no backend!");

      // RECARREGAR todos os dados após criar para garantir sincronização
      console.log("� Recarregando dados após criar transação...");
      await loadData();

      showSuccess(
        "Transação criada",
        `"${newTransaction.description}" foi adicionada com sucesso!`
      );
    } catch (error) {
      console.log("❌ Erro ao salvar transação:", error);
      showError(
        "Erro ao criar transação",
        "Não foi possível salvar a transação. Tente novamente.",
      );
    }
  };

  const editTransaction = async (editedTransaction: Transaction) => {
    try {
      console.log("🔄 Editando transação:", editedTransaction);

      const apiTransaction = {
  descricao: editedTransaction.description,
  valor: editedTransaction.amount,
  tipo:
    editedTransaction.type === "income" ? "receita" : "despesa",
  budget_id: editedTransaction.budgetId,
  data: editedTransaction.date,
  dashboard_id: currentDashboard?.id,
  installments: editedTransaction.installments,
  currentinstallment: editedTransaction.currentInstallment,
  totalamount: editedTransaction.totalAmount,
  remainingamount: editedTransaction.remainingAmount,
  nextpaymentdate: editedTransaction.nextPaymentDate,
  method: editedTransaction.method,
  account: editedTransaction.account,
  status: editedTransaction.status,
};


      await transactionsApi.update(editedTransaction.id, apiTransaction);
      console.log("✅ Transação atualizada no backend!");

      // RECARREGAR dados após editar
      console.log("🔄 Recarregando dados após editar transação...");
      await loadData();

      showSuccess(
        "Transação editada",
        `"${editedTransaction.description}" foi atualizada com sucesso!`
      );
    } catch (error) {
      console.error("❌ Erro ao editar transação:", error);
      showError(
        "Erro ao editar transação",
        "Não foi possível atualizar a transação. Tente novamente."
      );
    }
  };

  const importTransactions = async (transactions: any[]) => {
    console.log("📥 Importando transações:", transactions);
    try {
      // Adicionar cada transação individualmente
      for (const transaction of transactions) {
        await addTransaction(transaction);
      }
      
      // Recarregar dados após importação
      await loadData();
      
      // Debug: verificar transações após recarregar
      console.log("🔍 Debug - Transações após importação:", transactions.length);
      console.log("🔍 Debug - Estado atual das transações:", transactions);
      
      showSuccess("Importação Concluída", `${transactions.length} transações importadas com sucesso!`);
    } catch (error) {
      console.error("❌ Erro ao importar transações:", error);
      showError("Erro na Importação", "Não foi possível importar as transações. Tente novamente.");
    }
  };

  const payInstallment = async (transaction: Transaction) => {
    try {
      if (!currentDashboard?.id) {
        showError("Erro", "Dashboard não selecionado");
        return;
      }

      console.log("💰 Pagando parcela da transação:", transaction);

      await transactionsApi.payInstallment(transaction.id);
      console.log("✅ Parcela paga no backend!");

      // RECARREGAR dados após pagar parcela
      console.log("🔄 Recarregando dados após pagar parcela...");
      await loadData();

      showSuccess(
        "Parcela paga",
        `Parcela ${transaction.currentInstallment! + 1}/${
          transaction.installments
        } de "${transaction.description}" foi paga com sucesso!`
      );
    } catch (error) {
      console.error("❌ Erro ao pagar parcela:", error);
      showError(
        "Erro ao pagar parcela",
        "Não foi possível processar o pagamento. Tente novamente."
      );
    }
  };

  const deleteTransaction = async (transactionId: string) => {
    const transaction = transactions.find((t) => t.id === transactionId);
    if (!transaction) return;

    const details = [
      `Descrição: ${transaction.description}`,
      `Valor: R$ ${transaction.amount.toFixed(2)}`,
      `Data: ${new Date(transaction.date).toLocaleDateString("pt-BR")}`,
      `Categoria: ${transaction.category}`,
      `Tipo: ${transaction.type === "income" ? "Receita" : "Despesa"}`,
    ];

    const confirmed = await showConfirmation({
      title: "Excluir Transação",
      message:
        "Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.",
      confirmText: "Excluir",
      cancelText: "Cancelar",
      type: "danger",
      details,
    });

    if (confirmed) {
      try {
        await transactionsApi.delete(transactionId, currentDashboard?.id);

        // RECARREGAR dados após deletar
        console.log("🔄 Recarregando dados após deletar transação...");
        await loadData();

        showSuccess(
          "Transação excluída",
          `"${transaction.description}" foi removida com sucesso!`
        );
      } catch (error) {
        console.error("❌ Erro ao deletar transação:", error);
        showError(
          "Erro ao excluir transação",
          "Não foi possível remover a transação. Tente novamente."
        );
      }
    }
  };

  const addGoal = async (newGoal: Omit<Goal, "id" | "currentAmount">) => {
    try {
      const apiGoal = {
        nome: newGoal.name,
        valor_alvo: newGoal.targetAmount,
        valor_atual: 0,
        data_limite: newGoal.deadline,
        descricao: "",
        dashboard_id: currentDashboard?.id,
      };

      await metasApi.create(apiGoal);
      await loadData();
      showSuccess(
        "Meta criada",
        `"${newGoal.name}" foi adicionada com sucesso!`
      );
    } catch (error) {
      console.error("❌ Erro ao salvar meta:", error);
      showError(
        "Erro ao criar meta",
        "Não foi possível criar a meta. Tente novamente."
      );
    }
  };

  const editGoal = async (editedGoal: Goal) => {
    try {
      const apiGoal = {
        id: editedGoal.id,
        nome: editedGoal.name,
        valor_alvo: editedGoal.targetAmount,
        valor_atual: editedGoal.currentAmount,
        data_limite: editedGoal.deadline,
        descricao: editedGoal.name || "",
      };

      await metasApi.update(editedGoal.id, apiGoal);
      await loadData();
      showSuccess(
        "Meta editada",
        `"${editedGoal.name}" foi atualizada com sucesso!`
      );
    } catch (error) {
      console.error("❌ Erro ao editar meta:", error);
      showError(
        "Erro ao editar meta",
        "Não foi possível atualizar a meta. Tente novamente."
      );
    }
  };

  const deleteGoal = async (goalId: string) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;

    const progress =
      goal.targetAmount > 0
        ? ((goal.currentAmount / goal.targetAmount) * 100).toFixed(1)
        : "0";

    const details = [
      `Nome: ${goal.name}`,
      `Valor Alvo: R$ ${goal.targetAmount.toFixed(2)}`,
      `Valor Atual: R$ ${goal.currentAmount.toFixed(2)}`,
      `Progresso: ${progress}%`,
      `Prazo: ${
        goal.deadline
          ? new Date(goal.deadline).toLocaleDateString("pt-BR")
          : "Não definido"
      }`,
    ];

    const confirmed = await showConfirmation({
      title: "Excluir Meta",
      message:
        "Tem certeza que deseja excluir esta meta? Esta ação não pode ser desfeita.",
      confirmText: "Excluir",
      cancelText: "Cancelar",
      type: "danger",
      details,
    });

    if (confirmed) {
      try {
        await metasApi.delete(goalId);
        await loadData();
        showSuccess(
          "Meta excluída",
          `"${goal.name}" foi removida com sucesso!`
        );
      } catch (error) {
        console.error("❌ Erro ao deletar meta:", error);
        showError(
          "Erro ao excluir meta",
          "Não foi possível remover a meta. Tente novamente."
        );
      }
    }
  };

  const addFundsToGoal = (goalId: string, amount: number) => {
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId ? { ...g, currentAmount: g.currentAmount + amount } : g,
      ),
    );
  };

  const addBudget = async (newBudget: Omit<BudgetCategory, "id">) => {
    try {
      const currentDate = new Date();
      

      await budgetsApi.create({
  nome: newBudget.name,
  limit_value: newBudget.budgetedAmount,
  cor: newBudget.color,
  icone: newBudget.icon,
  tipo: newBudget.type,
  descricao: newBudget.description || "",
  dashboard_id: currentDashboard?.id,
});
      await loadData();
      showSuccess(
        "Orçamento criado",
        `"${newBudget.name}" foi adicionado com sucesso!`
      );
    } catch (error) {
      console.error("❌ Erro ao salvar orçamento:", error);
      showError(
        "Erro ao criar orçamento",
        "Não foi possível criar o orçamento. Tente novamente."
      );
    }
  };

  const editBudget = async (updatedBudget: Budget) => {
    try {
      // Encontrar o orçamento original para comparar o tipo
      const originalBudget = budgetCategories.find(b => b.id === updatedBudget.id);
      const typeChanged = originalBudget?.type !== updatedBudget.type;

      // Atualizar o orçamento
      await budgetsApi.update(updatedBudget.id, {
        nome: updatedBudget.name,
        limit_value: updatedBudget.budgetedAmount,
        cor: updatedBudget.color,
        tipo: updatedBudget.type,
      });

      // Se o tipo mudou, atualizar TODAS as transações associadas (existentes e futuras)
      let updatedTransactionsCount = 0;
      if (typeChanged) {
        const transactionsToUpdate = transactions.filter(t => t.budgetId === updatedBudget.id);
        updatedTransactionsCount = transactionsToUpdate.length;
        
        for (const transaction of transactionsToUpdate) {
          await transactionsApi.update(transaction.id, {
            tipo: updatedBudget.type,
          });
        }
      }

      await loadData();
      showSuccess(
        "Orçamento editado",
        `"${updatedBudget.name}" foi atualizado com sucesso!${
          typeChanged ? ` ${updatedTransactionsCount} transação(ões) sincronizada(s).` : ''
        }`,
      );
    } catch (error) {
      console.error("❌ Erro ao editar orçamento:", error);
      showError(
        "Erro ao editar orçamento",
        "Não foi possível editar o orçamento. Tente novamente.",
      );
    }
  };

  const deleteBudget = async (budgetId: string) => {
    const budget = budgetCategories.find((b) => b.id === budgetId);
    if (!budget) return;

    const confirmed = await showConfirmation({
      title: "Excluir Orçamento",
      message:
        "Tem certeza que deseja excluir este orçamento? Esta ação não pode ser desfeita.",
      confirmText: "Excluir",
      cancelText: "Cancelar",
      type: "danger",
    });

    if (confirmed) {
      try {
        await budgetsApi.delete(budgetId);
        await loadData();
        showSuccess(
          "Orçamento excluído",
          `"${budget.name}" foi removido com sucesso!`,
        );
      } catch (error) {
        console.error("❌ Erro ao excluir orçamento:", error);
        showError(
          "Erro ao excluir orçamento",
          "Não foi possível remover o orçamento. Tente novamente.",
        );
      }
    }
  };

  // Função auxiliar para fazer chamadas autenticadas
  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('Token não encontrado');
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (response.status === 401) {
      logout();
      throw new Error('Sessão expirada');
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro na requisição');
    }

    return response.json();
  };

  // Funções para gerenciar cartões
  const editCard = async (updatedCard: any) => {
    try {
      const backendResponse = await authenticatedFetch(`/api/cards/${updatedCard.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: updatedCard.name,
          bank: updatedCard.bank,
          card_limit: updatedCard.limit,
          closing_day: updatedCard.closingDay,
          due_day: updatedCard.dueDay,
          status: updatedCard.status
        })
      });
      
      // Mapear resposta do backend para o formato do frontend
      const frontendCard = {
        id: backendResponse.id,
        name: backendResponse.name,
        bank: backendResponse.bank,
        limit: backendResponse.card_limit,
        closingDay: backendResponse.closing_day,
        dueDay: backendResponse.due_day,
        currentBalance: backendResponse.current_balance,
        nextDueDate: backendResponse.next_due_date,
        status: backendResponse.status
      };
      
      // Atualizar o estado com o cartão atualizado
      setCards(prev => prev.map(card => 
        card.id === frontendCard.id ? frontendCard : card
      ));
      showSuccess("Cartão atualizado", `${updatedCard.name} foi atualizado com sucesso!`);
    } catch (error) {
      console.error("Erro ao editar cartão:", error);
      showError("Erro ao editar cartão", error instanceof Error ? error.message : "Tente novamente");
    }
  };

  const deleteCard = async (cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;
    
    const confirmed = await showConfirmation({
      title: "Excluir Cartão",
      message: `Tem certeza que deseja excluir o cartão "${card.name}"?`,
      confirmText: "Excluir",
      cancelText: "Cancelar",
      type: "danger",
    });

    if (confirmed) {
      try {
        await authenticatedFetch(`/api/cards/${cardId}`, {
          method: 'DELETE'
        });

        // Remover o cartão do estado
        setCards(prev => prev.filter(c => c.id !== cardId));
        showSuccess("Cartão excluído", `${card.name} foi removido com sucesso!`);
      } catch (error) {
        console.error("Erro ao excluir cartão:", error);
        showError("Erro ao excluir cartão", error instanceof Error ? error.message : "Tente novamente");
      }
    }
  };

  const addCard = async (newCard: any) => {
    try {
      // Obter os dashboards do usuário e usar o primeiro
      const dashboards = await authenticatedFetch('/api/auth/dashboards');
      if (!dashboards || !dashboards.data || dashboards.data.length === 0) {
        throw new Error('Nenhum dashboard encontrado');
      }

      const dashboard_id = dashboards.data[0].id;

      // Fazer a chamada para criar o cartão
      const createdCard = await authenticatedFetch('/api/cards', {
        method: 'POST',
        body: JSON.stringify({
          dashboard_id,
          name: newCard.name,
          bank: newCard.bank,
          card_limit: newCard.limit,
          closing_day: newCard.closingDay,
          due_day: newCard.dueDay
        })
      });
      
      // Atualizar o estado com o cartão criado
      setCards(prev => [...prev, createdCard]);
      showSuccess("Cartão adicionado", `${newCard.name} foi adicionado com sucesso!`);
    } catch (error) {
      console.error("Erro ao adicionar cartão:", error);
      showError("Erro ao adicionar cartão", error instanceof Error ? error.message : "Tente novamente");
    }
  };

  
  const handleSetActivePage = (page: string) => {
    console.log("📄 Mudando para página:", page);
    setActivePage(page as typeof activePage);
  };

  const renderContent = () => {
    switch (activePage) {
      case "dashboard":
        return (
          <DashboardContent
            transactions={filteredTransactions}
            goals={goals}
            setActivePage={handleSetActivePage}
            payInstallment={payInstallment}
          />
        );
      case "transactions":
        return (
          <TransactionsPage
            transactions={filteredTransactions}
            addTransaction={addTransaction}
            editTransaction={editTransaction}
            deleteTransaction={deleteTransaction}
            payInstallment={payInstallment}
            budgets={budgetCategories.map(b => ({
              id: b.id,
              name: b.name,
              budgetedAmount: b.budgetedAmount,
              color: b.color,
              limit_value: b.budgetedAmount,
              status: b.status,
              type: b.type
            }))}
            cards={cards}
            onImportTransactions={importTransactions}
          />
        );
      case "budgets":
        return (
          <BudgetsPage
            budgetCategories={budgetCategories}
            transactions={filteredTransactions}
            addBudget={addBudget}
            editBudget={editBudget}
            deleteBudget={deleteBudget}
            categories={categories}
          />
        );
      case "cards":
        return (
          <CardsPage
            cards={cards}
            onAddCard={addCard}
            onEditCard={editCard}
            onDeleteCard={deleteCard}
          />
        );
      case "goals":
        return (
       <GoalsPage
  goals={goals}
  addGoal={addGoal}
  editGoal={editGoal}
  deleteGoal={deleteGoal}
  addFunds={addFundsToGoal}
  budgets={budgetCategories.map(b => ({
    id: b.id,
    name: b.name,
    budgetedAmount: b.budgetedAmount,
    color: b.color,
    type: b.type
  }))}
  categories={categories}
/>

        );
      default:
        return loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Carregando...</p>
            </div>
          </div>
        ) : (
          <DashboardContent
            transactions={filteredTransactions}
            setActivePage={handleSetActivePage}
            payInstallment={payInstallment}
          />
        );
    }
  };

  return (
    <div className="flex h-screen bg-[#f6f7f8] text-gray-900 font-sans">
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        logout={logout}
        activePage={activePage}
        setActivePage={handleSetActivePage}
      />

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isSidebarOpen ? "ml-64 sm:ml-72" : "ml-0"
        }`}
      >
        {/* Navbar com Notificações e Perfil */}
        <Navbar
          user={user}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        {/* Conteúdo Principal - Responsivo */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="max-w-7xl mx-auto">
            {/* Filtros - Apenas na página dashboard */}
            {activePage === "dashboard" && <Header categories={categories} />}

            {renderContent()}
          </div>
        </main>
      </div>

      {/* Modal de Confirmação */}
      {confirmation && (
        <ConfirmModal
          isOpen={confirmation.isOpen}
          onClose={hideConfirmation}
          onConfirm={confirmation.onConfirm}
          title={confirmation.title}
          message={confirmation.message}
          confirmText={confirmation.confirmText}
          cancelText={confirmation.cancelText}
          type={confirmation.type}
          details={confirmation.details}
        />
      )}

      {/* Notificações de parcelas atualizadas */}
      {updates.map((update, index) => (
        <InstallmentNotification
          key={`${update.id}-${index}`}
          message={`${update.description} - Parcela ${update.current}/${update.total}`}
          onClose={() => removeUpdate(update.id)}
        />
      ))}
    </div>
  );
};

export default DashboardPage;
