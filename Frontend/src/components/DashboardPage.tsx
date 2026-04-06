import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
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
import { cardsApi, Card as ApiCard } from "../utils/cardsApi";

// Interface para o Card do Frontend
interface Card {
  id: string;
  name: string;
  bank: string;
  limit: number;
  closingDay: number;
  dueDay: number;
  currentBalance: number;
  status: 'active' | 'inactive' | 'overdue';
  nextDueDate?: string;
}

// Função para converter da API para o Frontend
function convertApiCardToFrontend(apiCard: any): Card {
  return {
    id: apiCard.id,
    name: apiCard.name,
    bank: apiCard.bank || "",
    limit: apiCard.card_limit,
    closingDay: apiCard.closing_day,
    dueDay: apiCard.due_day,
    currentBalance: apiCard.current_balance || 0,
    status: apiCard.status,
    nextDueDate: apiCard.next_due_date,
  };
}
import { Budget, Transaction, Goal } from "../utils/types";
import { Meta, BudgetCategory } from "../utils/api";
import { computeFinancialAlerts } from "../utils/financialAlerts";
import DashboardContent from "./DashboardContent";
import TransactionsPage from "./TransactionsPage";
import GoalsPage from "./GoalsPage";
import BudgetsPage from "./BudgetsPage";
import CardsDashboardPage from "./CardsDashboardPage";
import CardsDashboard from "./CardsDashboard";
import BillImportModal from "./BillImportModal";
import AccountsPage from "./AccountsPage";
import { subscriptionsApi, Subscription } from "../utils/subscriptionsApi";

// Tipo simples para Category
interface Category {
  id: string;
  name: string;
}

const DashboardPage: React.FC = () => {

  const { user, logout, currentDashboard, switchDashboard } = useAuth();
  const { filters, setFilters } = useFilters();
  const { showSuccess, showError } = useToast();
  const { confirmation, showConfirmation, hideConfirmation } =
    useConfirmation();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activePage, setActivePage] = useState<
    | "dashboard"
    | "income"
    | "expenses"
    | "goals"
    | "budgets"
    | "cards"
    | "subscriptions"
  >("dashboard");

  // Data state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Meta[]>([]);
  const [localGoalsChanges, setLocalGoalsChanges] = useState<Set<string>>(new Set());
  
  // Usar useRef para manter estado persistente
  const localGoalsChangesRef = useRef<Set<string>>(new Set());

  // Log para verificar inicialização do estado
  useEffect(() => {
    console.log("🔍 Estado localGoalsChanges inicializado:", Array.from(localGoalsChanges));
    console.log("🔍 Ref localGoalsChanges:", Array.from(localGoalsChangesRef.current));
  }, [localGoalsChanges]); 
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  // Funções para gerenciar cartões
  const addCard = async (card: Omit<Card, "id">) => {
    try {
      // Obter o dashboard_id do dashboard atual
      const dashboardId = currentDashboard?.id;
      if (!dashboardId) {
        throw new Error('Nenhum dashboard selecionado');
      }

      const apiCard = await cardsApi.create({
        ...card,
        dashboardId: dashboardId
      } as any);
      const frontendCard = convertApiCardToFrontend(apiCard);
      setCards(prev => [...prev, frontendCard]);
    } catch (error) {
      console.error("Erro ao criar cartão:", error);
    }
  };

  const editCard = async (card: Card) => {
    try {
      const apiCard = await cardsApi.update(card.id, card as any);
      const frontendCard = convertApiCardToFrontend(apiCard);
      setCards(prev => prev.map(c => c.id === card.id ? frontendCard : c));
    } catch (error) {
      console.error("Erro ao editar cartão:", error);
    }
  };

  const deleteCard = async (id: string) => {
    try {
      await cardsApi.delete(id);
      setCards(prev => prev.filter(c => c.id !== id));
      setSubscriptions(prev => prev.filter(s => s.cardId !== id));
    } catch (error) {
      console.error("Erro ao excluir cartão:", error);
    }
  };

  const addSubscription = async (payload: Omit<Subscription, "id"> & { dashboardId: string }) => {
    try {
      const created = await subscriptionsApi.create(payload);
      setSubscriptions((prev) =>
        [...prev, created].sort((a, b) => a.name.localeCompare(b.name)),
      );
      showSuccess("Assinatura criada", `${created.name} foi adicionada.`);
      await loadData();
    } catch (e) {
      console.error(e);
      showError("Erro", "Não foi possível criar a assinatura. Verifique se a tabela existe no banco.");
    }
  };

  const editSubscription = async (
    id: string,
    partial: Partial<Omit<Subscription, "id" | "dashboardId">>,
  ) => {
    try {
      const updated = await subscriptionsApi.update(id, partial);
      setSubscriptions((prev) =>
        prev
          .map((s) => (s.id === id ? updated : s))
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
      showSuccess("Assinatura atualizada", `${updated.name} foi salva.`);
      await loadData();
    } catch (e) {
      console.error(e);
      showError("Erro", "Não foi possível salvar a assinatura.");
    }
  };

  const deleteSubscription = async (id: string) => {
    const sub = subscriptions.find((s) => s.id === id);
    const ok = await showConfirmation({
      title: "Excluir assinatura",
      message: sub
        ? `Remover "${sub.name}" da lista de contas?`
        : "Remover esta assinatura?",
      confirmText: "Excluir",
      cancelText: "Cancelar",
      type: "danger",
    });
    if (!ok) return;
    try {
      await subscriptionsApi.delete(id);
      setSubscriptions((prev) => prev.filter((s) => s.id !== id));
      showSuccess("Assinatura removida", "A conta foi excluída da lista.");
      await loadData();
    } catch (e) {
      console.error(e);
      showError("Erro", "Não foi possível excluir a assinatura.");
    }
  };
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
        cardsData = [];
      }

   const [transactionsData, goalsData, budgetsData] =
  await Promise.all([
    transactionsApi.getAll(currentDashboard.id),
    metasApi.getAll(currentDashboard.id),
    budgetsApi.getAll(currentDashboard.id),
  ]);

      console.log("✅ Dados carregados:");
      console.log(`  📈 Transações: ${transactionsData.length}`);
      console.log(`  🎯 Metas: ${goalsData.length}`);
      console.log(`  💰 Orçamentos: ${budgetsData.length}`);
      console.log(`  💳 Cartões: ${cardsData.length}`);
      console.log("  🔍 Estrutura dos orçamentos:", JSON.stringify(budgetsData, null, 2));
      
      // Debug: verificar primeiras transações
      console.log("🔍 Debug - Primeiras 3 transações recebidas:", transactionsData.slice(0, 3));

      console.log("🔄 Debug - Atualizando estados:");
      console.log("  - Transactions:", transactionsData.length, "anterior:", transactions.length);
      console.log("  - Goals:", goalsData.length);
      console.log("  - Budgets:", budgetsData.length);
      console.log("  - Cards:", cardsData.length);
      
      setTransactions(transactionsData);
      
      // Atualizar metas apenas se não houver alterações locais pendentes
      setGoals((prevGoals) => {
        console.log("🔍 Debug - Atualizando metas:");
        console.log("  - Alterações locais pendentes (estado):", Array.from(localGoalsChanges));
        console.log("  - Alterações locais pendentes (ref):", Array.from(localGoalsChangesRef.current));
        console.log("  - Metas anteriores:", prevGoals.map(g => ({ id: g.id, currentAmount: g.currentAmount })));
        console.log("  - Metas da API:", goalsData.map(g => ({ id: g.id, currentAmount: g.currentAmount })));
        
        // Usar o ref para verificar alterações locais
        if (localGoalsChangesRef.current.size === 0) {
          // Se não há alterações locais, usar dados da API
          console.log("✅ Usando dados da API (sem alterações locais)");
          return goalsData;
        } else {
          // Se há alterações locais, mesclar dados
          console.log("🔄 Mesclando dados da API com alterações locais");
          const mergedGoals = goalsData.map((apiGoal) => {
            const localGoal = prevGoals.find(g => g.id === apiGoal.id);
            if (localGoal && localGoalsChangesRef.current.has(apiGoal.id)) {
              // Manter valor local se foi alterado
              console.log(`🔒 Mantendo valor local para meta ${apiGoal.id}: ${localGoal.currentAmount} (API: ${apiGoal.currentAmount})`);
              return { ...apiGoal, currentAmount: localGoal.currentAmount };
            }
            return apiGoal;
          });
          console.log("📊 Resultado final:", mergedGoals.map(g => ({ id: g.id, currentAmount: g.currentAmount })));
          return mergedGoals;
        }
      });
      
      setBudgetCategories(budgetsData);
      setCards(cardsData);

      try {
        const subs = await subscriptionsApi.getAll(currentDashboard.id);
        setSubscriptions(subs);
      } catch (subErr) {
        console.warn("Assinaturas (Contas) não carregadas:", subErr);
        setSubscriptions([]);
      }
      
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
    console.log("🔄 useEffect de loadData disparado");
    console.log("🔍 localGoalsChanges no início do useEffect:", Array.from(localGoalsChanges));
    loadData();

    // Auto-refresh a cada 30 segundos para ver alterações de outros usuários
    const interval = setInterval(() => {
      console.log("⏰ Auto-refresh disparado (30s)");
      console.log("🔍 localGoalsChanges no auto-refresh:", Array.from(localGoalsChanges));
      loadData();
    }, 30000);

    return () => {
      console.log("🛑 Limpando intervalo do auto-refresh");
      clearInterval(interval);
    };
  }, [currentDashboard?.id]); // Removido loadData das dependências

  // Sincronizar filtros com categorias disponíveis
  useEffect(() => {
    // Filtros já estão sendo gerenciados pelo hook useFilters
  }, [categories, setFilters]);

  // Filter transactions based on current filters
  const filteredTransactions = useMemo(() => {
    console.log("🔍 Filtrando transações...");
    console.log("📊 Total de transações:", transactions.length);
    console.log("📊 Filtros ativos:", {
      startDate: filters.startDate,
      endDate: filters.endDate,
      accounts: filters.accounts,
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
      
      // Para transações de cartão, sempre passar no filtro de conta
      // ou se não houver contas selecionadas
      const isCardTransaction = (t.cardName && t.cardName !== "") || (t.method === "Cartão de Crédito");
      const accountMatch = 
        filters.accounts.length === 0 || 
        isCardTransaction || 
        filters.accounts.includes(t.account);
      
      const categoryMatch = true; // Sem filtro de categoria por enquanto
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
          isCardTransaction: isCardTransaction,
          transactionAccount: t.account,
          transactionCardName: t.cardName,
          transactionMethod: t.method,
          filtersAccounts: filters.accounts,
        });
      } else {
        // Log das transações que passaram no filtro
        if (t.cardName) {
          console.log(`✅ Transação de cartão "${t.description}" passou:`, {
            cardName: t.cardName,
            account: t.account,
            method: t.method,
          });
        }
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

  const financialAlerts = useMemo(
    () =>
      computeFinancialAlerts(
        transactions,
        budgetCategories,
        cards.map((c) => ({
          limit: c.limit,
          currentBalance: c.currentBalance,
        })),
      ),
    [transactions, budgetCategories, cards],
  );

  // Handlers to modify data
  const addTransaction = async (newTransaction: any) => {
    try {
      // O modal envia budget_id diretamente, não budgetId (string vazia quebra FK no banco)
      const budgetIdRaw =
        (newTransaction as any).budget_id || (newTransaction as any).budgetId;
      const budgetIdClean =
        budgetIdRaw && String(budgetIdRaw).trim()
          ? String(budgetIdRaw).trim()
          : null;

      const incomeCategoryName = (newTransaction as any).category as string | undefined;
      const isIncomeWithCategory =
        newTransaction.type === "income" &&
        typeof incomeCategoryName === "string" &&
        incomeCategoryName.trim().length > 0;

      const accountClean =
        newTransaction.account != null && String(newTransaction.account).trim()
          ? String(newTransaction.account).trim()
          : "";

      /** Sempre enviar categoria em receitas (coluna NOT NULL no Supabase). */
      const categoriaForApi =
        newTransaction.type === "income"
          ? isIncomeWithCategory
            ? incomeCategoryName!.trim()
            : newTransaction.method === "Salário"
              ? "Salário"
              : "Outros"
          : undefined;

      // Orçamento opcional: salário (legado), cartão, ou receita com categoria fixa
      if (
        !budgetIdClean &&
        !isIncomeWithCategory &&
        !accountClean &&
        newTransaction.method !== "Salário" &&
        newTransaction.method !== "Cartão de Crédito"
      ) {
        throw new Error("budget_id é obrigatório");
      }

      if (!currentDashboard?.id) {
        throw new Error("Nenhum dashboard selecionado");
      }

      const apiTransaction = {
        descricao: newTransaction.description,
        valor: newTransaction.amount,
        tipo: (newTransaction.type === "income" ? "receita" : "despesa") as any,
        budget_id: budgetIdClean,
        categoria: categoriaForApi,
        data: newTransaction.date,
        dashboard_id: currentDashboard.id,
        // Campos de parcelamento (snake_case para o banco)
        installments: newTransaction.installments,
        currentinstallment: newTransaction.currentInstallment,
        totalamount: newTransaction.totalAmount,
        remainingamount: newTransaction.remainingAmount,
        nextpaymentdate: newTransaction.nextPaymentDate,
        // Outros campos (method sempre definido para o backend não assumir PIX por engano)
        method: newTransaction.method ?? "PIX",
        account: newTransaction.account,
        status: newTransaction.status ?? "completed",
      } as any;

      console.log(" Enviando para API:", apiTransaction);
      await transactionsApi.create(apiTransaction);
      console.log(" Transação salva no backend!");

      // RECARREGAR todos os dados após criar para garantir sincronização
      console.log(" Recarregando dados após criar transação...");
      await loadData();

      showSuccess(
        "Transação criada",
        `"${newTransaction.description}" foi adicionada com sucesso!`
      );
    } catch (error) {
      console.error(" Erro ao salvar transação:", error);
      console.error(" Detalhes do erro:", {
        message: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        transaction: newTransaction
      });
      showError(
        "Erro ao criar transação",
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a transação. Tente novamente.",
      );
    }
  };

  const editTransaction = async (
    editedTransaction: Transaction,
    options?: { silent?: boolean },
  ) => {
    try {
      console.log("🔄 Editando transação:", editedTransaction);

      const apiTransaction = {
  descricao: editedTransaction.description,
  valor: editedTransaction.amount,
  tipo: (editedTransaction.type === "income" ? "receita" : "despesa") as any,
  budget_id: editedTransaction.budgetId ?? null,
  categoria:
    editedTransaction.type === "income" ? editedTransaction.category : undefined,
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
} as any;


      await transactionsApi.update(editedTransaction.id, apiTransaction);
      console.log("✅ Transação atualizada no backend!");

      // RECARREGAR dados após editar
      console.log("🔄 Recarregando dados após editar transação...");
      await loadData();

      if (!options?.silent) {
        showSuccess(
          "Transação editada",
          `"${editedTransaction.description}" foi atualizada com sucesso!`,
        );
      }
    } catch (error) {
      console.error("❌ Erro ao editar transação:", error);
      showError(
        "Erro ao editar transação",
        "Não foi possível atualizar a transação. Tente novamente.",
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
    console.log("💰 Adicionando fundos:", goalId, amount);
    console.log("🔍 Estado localGoalsChanges antes:", Array.from(localGoalsChanges));
    console.log("🔍 Ref localGoalsChanges antes:", Array.from(localGoalsChangesRef.current));
    
    setGoals((prev) => {
      const updated = prev.map((g) =>
        g.id === goalId ? { ...g, currentAmount: g.currentAmount + amount } : g,
      );
      console.log("📊 Estado goals após atualização:", updated.map(g => ({ id: g.id, currentAmount: g.currentAmount })));
      return updated;
    });
    
    // Marcar que esta meta foi alterada localmente (usando ref)
    localGoalsChangesRef.current.add(goalId);
    setLocalGoalsChanges(new Set(localGoalsChangesRef.current));
    
    console.log("🔒 Estado localGoalsChanges após marcação:", Array.from(localGoalsChanges));
    console.log("🔒 Ref localGoalsChanges após marcação:", Array.from(localGoalsChangesRef.current));
    
    // Tentar sincronizar com a API após um pequeno delay para garantir que o estado foi atualizado
    setTimeout(() => {
      console.log("🔄 Iniciando sincronização após delay...");
      syncGoalWithAPI(goalId);
    }, 100);
  };

  const withdrawFundsFromGoal = (goalId: string, amount: number) => {
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId ? { ...g, currentAmount: Math.max(0, g.currentAmount - amount) } : g,
      ),
    );
    // Marcar que esta meta foi alterada localmente
    setLocalGoalsChanges(prev => new Set([...prev, goalId]));
    
    // Tentar sincronizar com a API após um pequeno delay para garantir que o estado foi atualizado
    setTimeout(() => {
      syncGoalWithAPI(goalId);
    }, 100);
  };

  const syncGoalWithAPI = async (goalId: string) => {
    try {
      console.log("🔄 syncGoalWithAPI iniciado para:", goalId);
      console.log("🔍 localGoalsChanges no início da sync:", Array.from(localGoalsChanges));
      console.log("🔍 Ref localGoalsChanges no início da sync:", Array.from(localGoalsChangesRef.current));
      
      // Obter o valor mais recente do estado usando uma função callback
      let currentGoal: Meta | undefined;
      setGoals(prev => {
        currentGoal = prev.find(g => g.id === goalId);
        console.log("📊 Meta encontrada para sync:", currentGoal?.id, currentGoal?.currentAmount);
        return prev; // Não modificar o estado, apenas obter o valor
      });
      
      if (currentGoal && currentDashboard?.id) {
        console.log("🔄 Sincronizando meta com API:", goalId);
        console.log("💰 Valor atual:", currentGoal.currentAmount);
        
        await metasApi.update(goalId, {
          nome: currentGoal.name,
          valor_alvo: currentGoal.targetAmount,
          valor_atual: currentGoal.currentAmount,
          data_limite: currentGoal.deadline,
          descricao: currentGoal.budgetId || ""
        });
        
        console.log("🔍 localGoalsChanges antes de limpar:", Array.from(localGoalsChanges));
        console.log("🔍 Ref localGoalsChanges antes de limpar:", Array.from(localGoalsChangesRef.current));
        
        // NÃO limpar imediatamente - esperar um pouco para garantir que o auto-refresh veja a alteração
        setTimeout(() => {
          localGoalsChangesRef.current.delete(goalId);
          setLocalGoalsChanges(new Set(localGoalsChangesRef.current));
          console.log("🗑️ Removendo goalId das alterações locais (delayed):", goalId);
          console.log("🔍 Ref localGoalsChanges após limpar (delayed):", Array.from(localGoalsChangesRef.current));
        }, 1000); // Esperar 1 segundo antes de limpar
        
        console.log("✅ Meta sincronizada com sucesso");
      } else {
        console.log("❌ Meta não encontrada ou sem dashboard");
      }
    } catch (error) {
      console.error("❌ Erro ao sincronizar meta com API:", error);
      console.log("🔍 localGoalsChanges após erro:", Array.from(localGoalsChanges));
      console.log("🔍 Ref localGoalsChanges após erro:", Array.from(localGoalsChangesRef.current));
    }
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

  // Função para lidar com a mudança de página
  const handleSetActivePage = (page: string) => {
    console.log("📄 Mudando para página:", page);
    setActivePage(page as typeof activePage);
  };

  // ... (rest of the code remains the same)
  const renderContent = () => {
    switch (activePage) {
      case "dashboard":
        return (
          <DashboardContent
            transactions={filteredTransactions}
            transactionsAll={transactions}
            subscriptions={subscriptions}
            goals={goals}
            budgets={budgetCategories}
            setActivePage={handleSetActivePage}
            payInstallment={payInstallment}
          />
        );
      case "income":
      case "expenses":
        return (
          <TransactionsPage
            mode={activePage === "income" ? "income" : "expense"}
            /** Lista completa do dashboard: filtros globais (contas/período) escondiam receitas PIX/Débito/Salário */
            transactions={transactions}
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
            budgetCategories={budgetCategories as any}
            transactions={transactions.filter(t => t.type === "expense" && t.budgetId)} // Apenas despesas com orçamento
            addBudget={addBudget as any}
            editBudget={editBudget as any}
            deleteBudget={deleteBudget}
          />
        );
      case "cards":
        return (
          <CardsDashboardPage
            cards={cards}
            transactions={transactions} // Usar todas as transações, não apenas as filtradas
            subscriptions={subscriptions}
            onAddCard={addCard}
            onEditCard={editCard}
            onDeleteCard={deleteCard}
          />
        );
      case "subscriptions":
        return (
          <AccountsPage
            subscriptions={subscriptions}
            cards={cards.map((c) => ({ id: c.id, name: c.name, bank: c.bank }))}
            dashboardId={currentDashboard?.id}
            onAdd={addSubscription}
            onEdit={editSubscription}
            onDelete={deleteSubscription}
          />
        );
      case "goals":
        return (
       <GoalsPage
  goals={goals as any}
  addGoal={addGoal}
  editGoal={editGoal}
  deleteGoal={deleteGoal}
  addFunds={addFundsToGoal}
  withdrawFunds={withdrawFundsFromGoal}
  budgets={budgetCategories.map(b => ({
    id: b.id,
    name: b.name,
    budgetedAmount: b.budgetedAmount,
    color: b.color,
    type: b.type,
    limit_value: b.budgetedAmount
  })) as any}
  categories={categories}
/>

        );
      default:
        return loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--primary)' }}></div>
              <p className="mt-4" style={{ color: 'var(--text-secondary)' }}>Carregando...</p>
            </div>
          </div>
        ) : (
          <DashboardContent
            transactions={filteredTransactions}
            transactionsAll={transactions}
            subscriptions={subscriptions}
            goals={goals}
            budgets={budgetCategories}
            setActivePage={handleSetActivePage}
            payInstallment={payInstallment}
          />
        );
    }
  };

  return (
    <div className="flex h-screen font-sans transition-colors duration-300" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
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
          financialAlerts={financialAlerts}
        />

        {/* Conteúdo Principal - Responsivo */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="max-w-7xl mx-auto">
            {/* Filtros - Apenas na página dashboard */}
            {activePage === "dashboard" && <Header categories={categories as any} />}

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
