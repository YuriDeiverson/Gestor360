import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
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
  transactionsApi,
  metasApi,
  orcamentosApi,
  categoriasApi,
} from "../utils/api";
import { Transaction, Goal, BudgetCategory, Category } from "../utils/types";
import DashboardContent from "./DashboardContent";
import TransactionsPage from "./TransactionsPage";
import GoalsPage from "./GoalsPage";
import BudgetsPage from "./BudgetsPage";
import CategoriesPage from "./CategoriesPage";

const DashboardPage: React.FC = () => {
  console.log("🚀 DashboardPage: Componente carregado");

  const { user, logout, currentDashboard } = useAuth();
  const { filters, setFilters } = useFilters();
  const { showSuccess, showError } = useToast();
  const { confirmation, showConfirmation, hideConfirmation } =
    useConfirmation();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState<
    "dashboard" | "transactions" | "goals" | "budgets" | "categories"
  >("dashboard");

  // Data state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>(
    [],
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

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

      const [transactionsData, goalsData, budgetsData, categoriesData] =
        await Promise.all([
          transactionsApi.getAll(currentDashboard.id),
          metasApi.getAll(currentDashboard.id),
          orcamentosApi.getAll(currentDashboard.id),
          categoriasApi.getAll(currentDashboard.id),
        ]);

      console.log("✅ Dados carregados:");
      console.log("  📈 Transações:", transactionsData.length);
      console.log("  🎯 Metas:", goalsData.length);
      console.log("  💰 Orçamentos:", budgetsData.length);
      console.log("  🏷️ Categorias:", categoriesData.length);

      setTransactions(transactionsData);
      setGoals(goalsData);
      setBudgetCategories(budgetsData);
      setCategories(categoriesData);
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

    try {
      const apiTransaction = {
        descricao: newTransaction.description,
        valor: newTransaction.amount,
        tipo: (newTransaction.type === "income" ? "receita" : "despesa") as
          | "receita"
          | "despesa",
        categoria: newTransaction.category,
        data: newTransaction.date,
        dashboard_id: currentDashboard?.id,
        // Campos de parcelamento (snake_case para o banco)
        installments: newTransaction.installments,
        currentinstallment: newTransaction.currentInstallment,
        totalamount: newTransaction.totalAmount,
        remainingamount: newTransaction.remainingAmount,
        nextpaymentdate: newTransaction.nextPaymentDate,
        // Outros campos
        method: newTransaction.method,
        account: newTransaction.account,
        status: newTransaction.status,
      };

      console.log("📤 Enviando para API:", apiTransaction);
      await transactionsApi.create(apiTransaction);
      console.log("✅ Transação salva no backend!");

      // RECARREGAR todos os dados após criar para garantir sincronização
      console.log("� Recarregando dados após criar transação...");
      await loadData();

      showSuccess(
        "Transação criada",
        `"${newTransaction.description}" foi adicionada com sucesso!`,
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
          editedTransaction.type === "income"
            ? ("receita" as const)
            : ("despesa" as const),
        categoria: editedTransaction.category,
        data: editedTransaction.date,
        dashboard_id: currentDashboard?.id,
        // Campos de parcelamento (snake_case para o banco)
        installments: editedTransaction.installments,
        currentinstallment: editedTransaction.currentInstallment,
        totalamount: editedTransaction.totalAmount,
        remainingamount: editedTransaction.remainingAmount,
        nextpaymentdate: editedTransaction.nextPaymentDate,
        // Outros campos
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
        `"${editedTransaction.description}" foi atualizada com sucesso!`,
      );
    } catch (error) {
      console.error("❌ Erro ao editar transação:", error);
      showError(
        "Erro ao editar transação",
        "Não foi possível atualizar a transação. Tente novamente.",
      );
    }
  };

  const payInstallment = async (transaction: Transaction) => {
    try {
      if (!currentDashboard?.id) {
        showError("Erro", "Dashboard não selecionado");
        return;
      }

      console.log("💰 Pagando parcela da transação:", transaction);

      await transactionsApi.payInstallment(transaction.id, currentDashboard.id);
      console.log("✅ Parcela paga no backend!");

      // RECARREGAR dados após pagar parcela
      console.log("🔄 Recarregando dados após pagar parcela...");
      await loadData();

      showSuccess(
        "Parcela paga",
        `Parcela ${transaction.currentInstallment! + 1}/${
          transaction.installments
        } de "${transaction.description}" foi paga com sucesso!`,
      );
    } catch (error) {
      console.error("❌ Erro ao pagar parcela:", error);
      showError(
        "Erro ao pagar parcela",
        "Não foi possível processar o pagamento. Tente novamente.",
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
          `"${transaction.description}" foi removida com sucesso!`,
        );
      } catch (error) {
        console.error("❌ Erro ao deletar transação:", error);
        showError(
          "Erro ao excluir transação",
          "Não foi possível remover a transação. Tente novamente.",
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
        `"${newGoal.name}" foi adicionada com sucesso!`,
      );
    } catch (error) {
      console.error("❌ Erro ao salvar meta:", error);
      showError(
        "Erro ao criar meta",
        "Não foi possível criar a meta. Tente novamente.",
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
        descricao: editedGoal.category || "",
      };

      await metasApi.update(editedGoal.id, apiGoal);
      await loadData();
      showSuccess(
        "Meta editada",
        `"${editedGoal.name}" foi atualizada com sucesso!`,
      );
    } catch (error) {
      console.error("❌ Erro ao editar meta:", error);
      showError(
        "Erro ao editar meta",
        "Não foi possível atualizar a meta. Tente novamente.",
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
          `"${goal.name}" foi removida com sucesso!`,
        );
      } catch (error) {
        console.error("❌ Erro ao deletar meta:", error);
        showError(
          "Erro ao excluir meta",
          "Não foi possível remover a meta. Tente novamente.",
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
      const apiOrcamento = {
        categoria: newBudget.name,
        valor_limite: newBudget.budgetedAmount,
        valor_gasto: 0,
        mes: currentDate.getMonth() + 1,
        ano: currentDate.getFullYear(),
        dashboard_id: currentDashboard?.id,
      };

      await orcamentosApi.create(apiOrcamento);
      await loadData();
      showSuccess(
        "Orçamento criado",
        `"${newBudget.name}" foi adicionado com sucesso!`,
      );
    } catch (error) {
      console.error("❌ Erro ao salvar orçamento:", error);
      showError(
        "Erro ao criar orçamento",
        "Não foi possível criar o orçamento. Tente novamente.",
      );
    }
  };

  const editBudget = async (updatedBudget: BudgetCategory) => {
    try {
      const apiOrcamento = {
        categoria: updatedBudget.name,
        valor_limite: updatedBudget.budgetedAmount,
      };

      await orcamentosApi.update(updatedBudget.id, apiOrcamento);
      await loadData();
      showSuccess(
        "Orçamento editado",
        `"${updatedBudget.name}" foi atualizado com sucesso!`,
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

    const details = [
      `Nome: ${budget.name}`,
      `Valor Orçado: R$ ${budget.budgetedAmount.toFixed(2)}`,
    ];

    const confirmed = await showConfirmation({
      title: "Excluir Orçamento",
      message:
        "Tem certeza que deseja excluir este orçamento? Esta ação não pode ser desfeita.",
      confirmText: "Excluir",
      cancelText: "Cancelar",
      type: "danger",
      details,
    });

    if (confirmed) {
      try {
        await orcamentosApi.delete(budgetId);
        await loadData();
        showSuccess(
          "Orçamento excluído",
          `"${budget.name}" foi removido com sucesso!`,
        );
      } catch (error) {
        console.error("❌ Erro ao excluir orçamento:", error);
        showError(
          "Erro ao excluir orçamento",
          "Não foi possível excluir o orçamento. Tente novamente.",
        );
      }
    }
  };

  const addCategory = async (newCategory: Omit<Category, "id">) => {
    try {
      const apiCategoria = {
        nome: newCategory.name,
        icone: newCategory.icon,
        cor: newCategory.color,
        tipo: newCategory.type,
        descricao: newCategory.description || "",
        dashboard_id: currentDashboard?.id,
      };

      await categoriasApi.create(apiCategoria);
      await loadData();

      showSuccess(
        "Categoria criada",
        `"${newCategory.name}" foi adicionada com sucesso!`,
      );
    } catch (error) {
      console.error("❌ Erro ao salvar categoria:", error);
      showError(
        "Erro ao criar categoria",
        "Não foi possível criar a categoria. Tente novamente.",
      );
    }
  };

  const editCategory = async (updatedCategory: Category) => {
    try {
      // Encontrar categoria original para comparar se o nome mudou
      const originalCategory = categories.find(
        (c) => c.id === updatedCategory.id,
      );
      const nameChanged =
        originalCategory && originalCategory.name !== updatedCategory.name;

      const apiCategoria = {
        nome: updatedCategory.name,
        icone: updatedCategory.icon,
        cor: updatedCategory.color,
        tipo: updatedCategory.type,
        descricao: updatedCategory.description || "",
        dashboard_id: currentDashboard?.id,
      };

      await categoriasApi.update(updatedCategory.id, apiCategoria);

      // Se o nome da categoria mudou, atualizar todas as transações e orçamentos que usam essa categoria
      if (nameChanged && originalCategory) {
        // Atualizar transações
        const transactionsToUpdate = transactions.filter(
          (t) => t.category === originalCategory.name,
        );

        for (const transaction of transactionsToUpdate) {
          const updatedTransaction = {
            ...transaction,
            category: updatedCategory.name,
          };

          try {
            const apiTransacao = {
              descricao: updatedTransaction.description,
              valor: updatedTransaction.amount,
              data: updatedTransaction.date,
              tipo: (updatedTransaction.type === "income"
                ? "receita"
                : "despesa") as "receita" | "despesa",
              categoria: updatedTransaction.category, // Nome atualizado
              dashboard_id: currentDashboard?.id,
            };

            await transactionsApi.update(transaction.id, apiTransacao);
          } catch (error) {
            console.error(
              `❌ Erro ao atualizar transação ${transaction.id}:`,
              error,
            );
          }
        }

        // Atualizar orçamentos
        const budgetsToUpdate = budgetCategories.filter(
          (b) => b.name === originalCategory.name,
        );

        for (const budget of budgetsToUpdate) {
          const updatedBudget = {
            ...budget,
            name: updatedCategory.name,
          };

          try {
            const apiOrcamento = {
              categoria: updatedBudget.name, // Nome atualizado
              valor_limite: updatedBudget.budgetedAmount,
              dashboard_id: currentDashboard?.id,
            };

            await orcamentosApi.update(budget.id, apiOrcamento);
          } catch (error) {
            console.error(
              `❌ Erro ao atualizar orçamento ${budget.id}:`,
              error,
            );
          }
        }

        if (transactionsToUpdate.length > 0 || budgetsToUpdate.length > 0) {
          const transactionMsg =
            transactionsToUpdate.length > 0
              ? `${transactionsToUpdate.length} transações`
              : "";
          const budgetMsg =
            budgetsToUpdate.length > 0
              ? `${budgetsToUpdate.length} orçamentos`
              : "";
          const separator =
            transactionsToUpdate.length > 0 && budgetsToUpdate.length > 0
              ? " e "
              : "";

          console.log(
            `✅ Atualizados: ${transactionMsg}${separator}${budgetMsg} com a nova categoria "${updatedCategory.name}"`,
          );
        }
      }

      await loadData();

      showSuccess(
        "Categoria atualizada",
        `"${updatedCategory.name}" foi atualizada com sucesso!${
          nameChanged
            ? ` Transações e orçamentos atualizados automaticamente.`
            : ""
        }`,
      );
    } catch (error) {
      console.error("❌ Erro ao atualizar categoria:", error);
      showError(
        "Erro ao atualizar categoria",
        "Não foi possível atualizar a categoria. Tente novamente.",
      );
    }
  };

  const deleteCategory = async (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    if (!category) return;

    const details = [
      `Nome: ${category.name}`,
      `Cor: ${category.color}`,
      "Atenção: Transações desta categoria podem ser afetadas!",
    ];

    const confirmed = await showConfirmation({
      title: "Excluir Categoria",
      message:
        "Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.",
      confirmText: "Excluir",
      cancelText: "Cancelar",
      type: "warning",
      details,
    });

    if (confirmed) {
      try {
        await categoriasApi.delete(categoryId);
        await loadData();

        showSuccess(
          "Categoria excluída",
          `"${category.name}" foi removida com sucesso!`,
        );
      } catch (error) {
        console.error("❌ Erro ao deletar categoria:", error);
        showError(
          "Erro ao excluir categoria",
          "Não foi possível excluir a categoria. Tente novamente.",
        );
      }
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
            categories={categories}
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
            categories={categories}
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
      case "categories":
        return (
          <CategoriesPage
            categories={categories}
            addCategory={addCategory}
            editCategory={editCategory}
            deleteCategory={deleteCategory}
          />
        );
      default:
        return loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando dados...</p>
            </div>
          </div>
        ) : (
          <DashboardContent
            transactions={filteredTransactions}
            goals={goals}
            setActivePage={handleSetActivePage}
          />
        );
    }
  };

  return (
    <div className="flex h-screen bg-[#f6f7f8] text-gray-900 font-sans">
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        logout={logout}
        activePage={activePage}
        setActivePage={handleSetActivePage}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Navbar com Notificações e Perfil */}
        <Navbar
          user={user}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        {/* Conteúdo Principal - Responsivo */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Filtros */}
          <Header categories={categories} />

          <div className="max-w-7xl mx-auto">{renderContent()}</div>
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
